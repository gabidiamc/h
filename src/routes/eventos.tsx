import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  ExternalLink,
  Filter,
  Globe,
  MapPin,
  Megaphone,
  Search,
  Sparkles,
  Tag,
  Users,
  Video,
  ArrowRight,
  ChevronRight,
  Share2,
  CalendarCheck,
  Building,
  Radio,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { fetchEvents, localizedEvent, type EventRow } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";
import { formatDesMoinesDate } from "@/lib/content-lifecycle";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos y Actividades Familiares — Familias DMPS" },
      {
        name: "description",
        content:
          "Próximos eventos escolares, talleres para padres, conferencias, actividades presenciales y eventos virtuales en vivo para familias de DMPS.",
      },
      { property: "og:title", content: "Eventos y Actividades — Familias DMPS" },
      {
        property: "og:description",
        content:
          "Descubre eventos presenciales con ubicación en mapa y eventos virtuales con enlaces directos.",
      },
    ],
  }),
  component: EventsPublicPage,
});

export function EventsPublicPage() {
  const { lang } = useI18n();
  const { selectedSchool } = useSchool();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "physical" | "virtual" | "family" | "conferences"
  >("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public_events", selectedSchool.id],
    queryFn: () => fetchEvents(selectedSchool.id),
  });

  const isSpanish = lang === "es";

  // Helper to determine if an event is virtual or has a digital link
  const isVirtualEvent = (e: EventRow) => {
    const loc = (e.location || "").toLowerCase();
    const url = (e.official_url || "").toLowerCase();
    return (
      loc.includes("virtual") ||
      loc.includes("online") ||
      loc.includes("zoom") ||
      loc.includes("meet") ||
      loc.includes("teams") ||
      loc.includes("en línea") ||
      url.includes("zoom.us") ||
      url.includes("meet.google") ||
      url.includes("teams.microsoft") ||
      url.includes("youtube.com")
    );
  };

  // Helper to generate Google Calendar URL
  const generateGoogleCalendarUrl = (e: EventRow, title: string, desc: string) => {
    const start = e.start_date.replace(/-/g, "");
    const startTime = e.start_time ? e.start_time.replace(/:/g, "") + "00" : "000000";
    const end = (e.end_date || e.start_date).replace(/-/g, "");
    const endTime = e.end_time ? e.end_time.replace(/:/g, "") + "00" : "235959";
    const dates = `${start}T${startTime}/${end}T${endTime}`;
    const loc =
      e.location ||
      (isVirtualEvent(e) ? e.official_url || "En línea" : "Des Moines Public Schools");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(loc)}`;
  };

  // Helper to download .ICS file
  const downloadIcs = (e: EventRow, title: string, desc: string) => {
    const start = e.start_date.replace(/-/g, "");
    const end = (e.end_date || e.start_date).replace(/-/g, "");
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//DMPS Familias//Eventos//ES",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${e.location || "DMPS"}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${e.slug || "evento-dmps"}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isSpanish ? "Archivo de calendario descargado" : "Calendar file downloaded");
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const { title, description } = localizedEvent(e, lang, selectedSchool.id);
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        title.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const isVirtual = isVirtualEvent(e);

      if (filterType === "physical") return !isVirtual && Boolean(e.location);
      if (filterType === "virtual") return isVirtual || Boolean(e.official_url);
      if (filterType === "family") return e.event_type === "family" || e.event_type === "general";
      if (filterType === "conferences")
        return e.event_type === "conference" || e.event_type === "workshop";

      return true;
    });
  }, [events, search, filterType, lang, selectedSchool.id]);

  // Featured events for top banner
  const featuredEvents = useMemo(() => {
    return events.filter((e) => e.is_featured || e.image_url).slice(0, 3);
  }, [events]);

  return (
    <PublicShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-primary">
                <Sparkles className="size-4" />
                {isSpanish ? "Agenda y Eventos Oficiales" : "Official Schedule & Events"}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {isSpanish ? "Eventos para Familias y Comunidad" : "Family & Community Events"}
              </h1>
              <p className="mt-3 text-base sm:text-lg text-muted-foreground">
                {isSpanish
                  ? `Talleres, conferencias, eventos presenciales en ${selectedSchool.name} y sesiones virtuales en vivo con enlaces directos.`
                  : `Workshops, conferences, in-person events at ${selectedSchool.name}, and live digital sessions.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-xl shadow-soft">
                <Link to="/calendario">
                  <CalendarDays className="mr-2 size-4" />
                  {isSpanish ? "Ver Calendario Escolar" : "View School Calendar"}
                </Link>
              </Button>
              <Button asChild className="rounded-xl shadow-soft">
                <Link to="/contact">
                  <Users className="mr-2 size-4" />
                  {isSpanish ? "Línea de Ayuda Familiar" : "Family Support Line"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Banner Showcase (if featured events exist) */}
      {featuredEvents.length > 0 && (
        <section className="border-b border-border bg-card/60 py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl">
                <Sparkles className="size-5 text-amber-500" />
                {isSpanish ? "Eventos Destacados" : "Featured Events"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {isSpanish ? "Recomendados para familias" : "Recommended for families"}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredEvents.map((evt) => {
                const { title, description } = localizedEvent(evt, lang, selectedSchool.id);
                const isVirtual = isVirtualEvent(evt);

                return (
                  <div
                    key={evt.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:border-primary/40 hover:shadow-lift"
                  >
                    {/* Banner Image or Gradient Header */}
                    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
                      {evt.image_url ? (
                        <img
                          src={evt.image_url}
                          alt={title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="grid h-full place-items-center p-6 text-center">
                          <CalendarDays className="size-12 text-primary/40" />
                        </div>
                      )}

                      {/* Badges on Banner */}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                        {isVirtual ? (
                          <Badge className="bg-blue-600 text-white font-semibold flex items-center gap-1 shadow-sm">
                            <Radio className="size-3 animate-pulse" />
                            {isSpanish ? "En Línea / Digital" : "Virtual / Online"}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600 text-white font-semibold flex items-center gap-1 shadow-sm">
                            <Building className="size-3" />
                            {isSpanish ? "Lugar Físico" : "In-Person"}
                          </Badge>
                        )}
                        {evt.is_featured && (
                          <Badge
                            variant="secondary"
                            className="bg-background/90 backdrop-blur font-medium"
                          >
                            ★ {isSpanish ? "Destacado" : "Featured"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Clock className="size-3.5" />
                        <span>{formatDesMoinesDate(evt.start_date, lang)}</span>
                        {evt.start_time && <span>• {evt.start_time}</span>}
                      </div>

                      <h3 className="mt-2 text-lg font-bold text-foreground leading-snug line-clamp-2">
                        {title}
                      </h3>

                      {description && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {description}
                        </p>
                      )}

                      {/* Location or Digital Links */}
                      <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs">
                        {isVirtual ? (
                          <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 font-medium">
                            <Video className="mt-0.5 size-4 shrink-0" />
                            <span className="line-clamp-1">
                              {evt.location ||
                                (isSpanish
                                  ? "Videollamada / Transmisión en Vivo"
                                  : "Live Video Stream")}
                            </span>
                          </div>
                        ) : evt.location ? (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-rose-500" />
                            <span className="line-clamp-1">{evt.location}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center justify-between gap-2 pt-2">
                        {evt.official_url ? (
                          <Button asChild size="sm" className="rounded-xl flex-1 font-semibold">
                            <a href={evt.official_url} target="_blank" rel="noopener noreferrer">
                              {isVirtual ? (
                                <>
                                  <Video className="mr-1.5 size-3.5" />
                                  {isSpanish ? "Unirse al evento" : "Join Event"}
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="mr-1.5 size-3.5" />
                                  {isSpanish ? "Más información" : "More Info"}
                                </>
                              )}
                            </a>
                          </Button>
                        ) : !isVirtual && evt.location ? (
                          <Button asChild size="sm" variant="outline" className="rounded-xl flex-1">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MapPin className="mr-1.5 size-3.5 text-rose-500" />
                              {isSpanish ? "Ver en Mapa" : "View on Map"}
                            </a>
                          </Button>
                        ) : null}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-xl shrink-0 text-muted-foreground hover:text-foreground"
                          title={isSpanish ? "Añadir a Google Calendar" : "Add to Google Calendar"}
                          onClick={() => {
                            window.open(
                              generateGoogleCalendarUrl(evt, title, description),
                              "_blank",
                            );
                          }}
                        >
                          <CalendarPlus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Events Directory */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Filters and Search Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                filterType === "all"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {isSpanish ? "Todos los eventos" : "All Events"} ({events.length})
            </button>
            <button
              onClick={() => setFilterType("physical")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                filterType === "physical"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              <Building className="size-3.5" />
              {isSpanish ? "Presenciales (Lugar Físico)" : "In-Person"}
            </button>
            <button
              onClick={() => setFilterType("virtual")}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                filterType === "virtual"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              <Video className="size-3.5" />
              {isSpanish ? "Virtuales / En Línea (Links)" : "Virtual / Online Links"}
            </button>
            <button
              onClick={() => setFilterType("family")}
              className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                filterType === "family"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {isSpanish ? "Familiares" : "Family"}
            </button>
            <button
              onClick={() => setFilterType("conferences")}
              className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
                filterType === "conferences"
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {isSpanish ? "Conferencias y Talleres" : "Conferences & Workshops"}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={
                isSpanish ? "Buscar por nombre, lugar o tema…" : "Search by name, location…"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-border bg-card"
            />
          </div>
        </div>

        {/* Event List / Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <CalendarDays className="size-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">
              {isSpanish ? "No se encontraron eventos" : "No events found"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              {isSpanish
                ? "No hay eventos que coincidan con los filtros seleccionados o todavía no se han publicado para esta escuela."
                : "There are no events matching your filter criteria right now."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setSearch("");
                  setFilterType("all");
                }}
              >
                {isSpanish ? "Restablecer filtros" : "Reset filters"}
              </Button>
              <Button asChild className="rounded-xl">
                <Link to="/calendario">
                  {isSpanish ? "Ver Calendario Anual" : "View Annual Calendar"}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((evt) => {
              const { title, description } = localizedEvent(evt, lang, selectedSchool.id);
              const isVirtual = isVirtualEvent(evt);

              return (
                <div
                  key={evt.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:border-primary/40 hover:shadow-lift"
                >
                  {/* Top Image if present */}
                  {evt.image_url && (
                    <div className="relative h-40 w-full overflow-hidden bg-muted">
                      <img
                        src={evt.image_url}
                        alt={title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isVirtual ? (
                          <Badge className="bg-blue-600/90 hover:bg-blue-600 text-white text-[11px] font-semibold flex items-center gap-1">
                            <Video className="size-3" />
                            {isSpanish ? "En Línea / Virtual" : "Virtual / Online"}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1">
                            <Building className="size-3" />
                            {isSpanish ? "Presencial" : "In-Person"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[11px] font-medium capitalize">
                          {evt.event_type || "General"}
                        </Badge>
                      </div>

                      {evt.is_featured && (
                        <span className="text-xs font-bold text-amber-500">
                          ★ {isSpanish ? "Destacado" : "Featured"}
                        </span>
                      )}
                    </div>

                    {/* Date and Time Header */}
                    <div className="mt-3.5 flex items-center gap-2 text-xs font-bold text-primary">
                      <CalendarDays className="size-4 shrink-0" />
                      <span>{formatDesMoinesDate(evt.start_date, lang)}</span>
                      {evt.start_time && (
                        <span className="text-muted-foreground font-normal">
                          • {evt.start_time} {evt.end_time ? `- ${evt.end_time}` : ""}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mt-2 text-lg font-bold text-foreground leading-tight">
                      {title}
                    </h3>

                    {/* Description */}
                    {description && (
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {description}
                      </p>
                    )}

                    {/* Location or Digital Links Section */}
                    <div className="mt-4 rounded-xl bg-secondary/50 p-3 text-xs space-y-1.5">
                      {isVirtual ? (
                        <>
                          <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                            <Video className="mt-0.5 size-3.5 shrink-0" />
                            <span>
                              {isSpanish
                                ? "Acceso digital / Enlace virtual:"
                                : "Virtual link / Digital access:"}
                            </span>
                          </div>
                          {evt.official_url ? (
                            <a
                              href={evt.official_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate font-mono text-[11px] text-primary underline hover:text-primary/80"
                            >
                              {evt.official_url}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              {evt.location ||
                                (isSpanish
                                  ? "El enlace se publicará antes del evento."
                                  : "Link will be shared before event.")}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2 text-foreground font-semibold">
                            <MapPin className="mt-0.5 size-3.5 shrink-0 text-rose-500" />
                            <span>{isSpanish ? "Ubicación física:" : "Physical venue:"}</span>
                          </div>
                          <p className="text-muted-foreground pl-5">
                            {evt.location || `${selectedSchool.name} - Des Moines, IA`}
                          </p>
                          {evt.location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 pl-5 text-[11px] font-semibold text-primary hover:underline"
                            >
                              <ExternalLink className="size-3" />
                              {isSpanish ? "Abrir en Google Maps" : "Open in Google Maps"}
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-border/60 bg-muted/20 p-4 flex items-center justify-between gap-2">
                    {evt.official_url ? (
                      <Button asChild size="sm" className="rounded-xl flex-1 font-semibold">
                        <a href={evt.official_url} target="_blank" rel="noopener noreferrer">
                          {isVirtual ? (
                            <>
                              <Video className="mr-1.5 size-3.5" />
                              {isSpanish ? "Unirse a la sesión" : "Join Session"}
                            </>
                          ) : (
                            <>
                              <ExternalLink className="mr-1.5 size-3.5" />
                              {isSpanish ? "Más información" : "Event Info"}
                            </>
                          )}
                        </a>
                      </Button>
                    ) : !isVirtual && evt.location ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-xl flex-1 font-semibold"
                      >
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin className="mr-1.5 size-3.5 text-rose-500" />
                          {isSpanish ? "Ver en Mapa" : "View Map"}
                        </a>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-xl flex-1 font-semibold"
                      >
                        <Link to="/contact">
                          {isSpanish ? "Preguntar en la escuela" : "Contact School"}
                        </Link>
                      </Button>
                    )}

                    {/* Add to Calendar Menu / Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl shrink-0"
                      title={
                        isSpanish ? "Descargar para Apple / Outlook / Google" : "Export to Calendar"
                      }
                      onClick={() => downloadIcs(evt, title, description)}
                    >
                      <CalendarPlus className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Info Callout Banner */}
      <section className="border-t border-border bg-muted/40 py-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <CalendarCheck className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 text-xl font-bold text-foreground">
            {isSpanish
              ? "¿Necesita ayuda con un evento o interpretación?"
              : "Need help with an event or interpretation?"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            {isSpanish
              ? "Todos los eventos de Des Moines Public Schools cuentan con servicios de interpretación y traducción gratuitos para familias."
              : "All Des Moines Public Schools events offer free translation and interpretation services for families."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/contact">
                {isSpanish ? "Contactar a la escuela" : "Contact School Office"}
              </Link>
            </Button>
            <Button asChild className="rounded-xl">
              <Link to="/faq">
                {isSpanish ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
