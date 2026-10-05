import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock, Languages, Sparkles } from "lucide-react";

import mascot from "@/assets/mascot.png";
import skylineBg from "@/assets/images/des-moines-skyline.jpg";
import { AnnouncementCard } from "@/components/announcement-card";
import { ArticleCard } from "@/components/article-card";
import { CategoryIcon } from "@/components/category-icon";
import { PublicShell } from "@/components/public-shell";
import { SearchInput } from "@/components/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchActiveAnnouncements,
  fetchCategories,
  fetchEvents,
  fetchPublishedArticles,
  localizedCategory,
  localizedEvent,
  CATEGORIES_QUERY_OPTIONS,
} from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DMPS Family Info — Recursos e información para familias" },
      {
        name: "description",
        content:
          "Recursos, programas, calendarios, rutas y artículos informativos para las familias de DMPS.",
      },
      {
        property: "og:title",
        content: "DMPS Family Info — Centro multilingüe de recursos para familias",
      },
      {
        property: "og:description",
        content: "Centro multilingüe de recursos e información para las familias.",
      },
      { property: "og:url", content: "https://familiasdmps.app/" },
      { property: "og:image", content: "https://familiasdmps.app/og-preview.jpg" },
      { name: "twitter:image", content: "https://familiasdmps.app/og-preview.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/" }],
  }),
  component: Index,
});

function Index() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const categories = useQuery({
    queryKey: ["categories", selectedSchool.id],
    queryFn: () => fetchCategories(selectedSchool.id),
    ...CATEGORIES_QUERY_OPTIONS,
  });
  const announcements = useQuery({
    queryKey: ["announcements", selectedSchool.id],
    queryFn: () => fetchActiveAnnouncements(selectedSchool.id),
  });
  const articles = useQuery({
    queryKey: ["articles", selectedSchool.id],
    queryFn: () => fetchPublishedArticles(undefined, selectedSchool.id),
  });
  const events = useQuery({
    queryKey: ["events", selectedSchool.id],
    queryFn: () => fetchEvents(selectedSchool.id),
  });

  const categoriesList = categories.data ?? [];
  const allArticles = articles.data ?? [];
  const featured = [
    ...allArticles.filter((a) => a.is_featured),
    ...allArticles.filter((a) => !a.is_featured),
  ].slice(0, 6);

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-border bg-slate-950 text-white">
        {/* Imagen de fondo del skyline de Des Moines */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-bottom sm:bg-center bg-no-repeat opacity-75 pointer-events-none"
          style={{ backgroundImage: `url(${skylineBg})` }}
          aria-hidden="true"
        />
        {/* Capa de contraste y gradiente para legibilidad óptima */}
        <div
          className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/90 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/80 px-4 py-1.5 text-sm font-semibold text-sky-300 shadow-soft backdrop-blur-xs">
            <span
              className={`size-2.5 rounded-full ${
                selectedSchool.id === "lincoln" ? "bg-blue-400" : "bg-rose-400"
              }`}
            />
            <span className="text-white">{selectedSchool.name}</span>
            <span className="text-slate-300">• {selectedSchool.mascot}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-xs">
            {t("home.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-200 sm:text-xl drop-shadow-xs">
            {t("home.subtitle")}
          </p>
          <div className="mx-auto mt-8 max-w-2xl" data-tutorial="search">
            <SearchInput />
          </div>
        </div>
      </section>

      {/* Categorías Principales */}
      <section
        id="home-categories-grid"
        data-tutorial="categories"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
        aria-labelledby="popular-heading"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h2 id="popular-heading" className="text-2xl font-bold sm:text-3xl">
              {t("home.popular")}
            </h2>
            <p className="mt-1 text-muted-foreground">{t("home.popularHint")}</p>
          </div>
          <Link
            to="/topics"
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("home.viewAll")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-36 w-full rounded-2xl" />
                </li>
              ))
            : categoriesList.map((cat, index) => {
                const loc = localizedCategory(cat, lang);
                const bannerUrl = cat.card_banner_url || null;
                const cardBg = cat.card_bg?.trim() || null;
                const isDarkBg =
                  cardBg &&
                  (cardBg.includes("#0") ||
                    cardBg.includes("#1") ||
                    cardBg.includes("0f172a") ||
                    cardBg.includes("e11d48"));

                return (
                  <li
                    key={cat.id}
                    className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
                    style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
                  >
                    <Link
                      to="/topics/$slug"
                      params={{ slug: cat.slug }}
                      style={cardBg ? { background: cardBg } : undefined}
                      className={`surface-card category-card-animated group flex h-full flex-col justify-between overflow-hidden p-0 rounded-2xl transition-all duration-300 hover:border-primary/50 ${
                        isDarkBg ? "text-white border-white/20" : ""
                      }`}
                    >
                      {bannerUrl && (
                        <div className="relative w-full overflow-hidden border-b border-border/50 bg-muted/20">
                          <img
                            src={bannerUrl}
                            alt={loc.name}
                            className="w-full h-auto max-h-[600px] object-cover transition-transform duration-500 group-hover:scale-105 rounded-t-2xl"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`category-icon-bounce grid size-9 shrink-0 place-items-center rounded-xl transition-all duration-300 ${
                              isDarkBg
                                ? "bg-white/20 text-white"
                                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/25"
                            }`}
                          >
                            <CategoryIcon name={cat.icon} className="size-4.5" />
                          </span>
                          <span
                            className={`text-base font-bold transition-colors truncate flex-1 ${
                              isDarkBg ? "text-white" : "group-hover:text-primary"
                            }`}
                          >
                            {loc.name}
                          </span>
                          <ArrowRight
                            className="size-4 shrink-0 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <span
                          className={`text-xs leading-snug line-clamp-2 ${
                            isDarkBg ? "text-slate-200" : "text-muted-foreground"
                          }`}
                        >
                          {loc.description}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
        </ul>
      </section>

      {/* Avisos Activos */}
      <section
        id="home-announcements"
        data-tutorial="notices"
        className="border-y border-border bg-secondary/30 py-12"
        aria-labelledby="ann-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div>
              <h2 id="ann-heading" className="text-2xl font-bold sm:text-3xl">
                {t("home.announcements")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("nav.announcementsDesc")}</p>
            </div>
            <Link
              to="/announcements"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("home.viewAll")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {announcements.isLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                ))
              : (announcements.data ?? [])
                  .filter((a) => a.show_on_home)
                  .slice(0, 4)
                  .map((a) => <AnnouncementCard key={a.id} announcement={a} />)}
          </div>
        </div>
      </section>

      {/* Fechas Clave y Calendario */}
      <section
        id="home-key-dates"
        data-tutorial="calendar"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
        aria-labelledby="dates-heading"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" aria-hidden="true" />
              <h2 id="dates-heading" className="text-2xl font-bold sm:text-3xl">
                {lang === "es" ? "Fechas y Calendario Escolar" : "Key School Dates & Calendar"}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {lang === "es"
                ? "Fechas académicas importantes y días sin clases del distrito."
                : "Important academic milestones and no-school days across the district."}
            </p>
          </div>
          <Link
            to="/calendario"
            className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-4 hover:underline"
          >
            {lang === "es" ? "Ver calendario completo" : "View full calendar"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.data && events.data.length > 0 ? (
            events.data.slice(0, 3).map((item) => {
              const loc = localizedEvent(item, lang, selectedSchool.id);
              const title = loc.title || item.title;
              const formattedDate = item.start_date
                ? new Date(item.start_date + "T12:00:00").toLocaleDateString(
                    lang === "es" ? "es-US" : "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )
                : "";

              return (
                <div
                  key={item.id}
                  className="surface-card flex flex-col justify-between rounded-2xl border border-border p-4 shadow-soft transition-all hover:border-primary/30"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground capitalize">
                        {item.event_type || (lang === "es" ? "Evento" : "Event")}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {lang === "es" ? "Confirmado" : "Confirmed"}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-foreground leading-snug">
                      {title}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-1.5 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" aria-hidden="true" />
                      <span>{formattedDate}</span>
                    </div>
                    {item.all_day ? (
                      <span>{lang === "es" ? "Todo el día" : "All day"}</span>
                    ) : item.start_time ? (
                      <span>{item.start_time}</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-border bg-card p-6 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CalendarDays className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {lang === "es"
                      ? "Calendario Escolar Oficial 2026-2027"
                      : "Official 2026-2027 School Calendar"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {lang === "es"
                      ? "Consulta el calendario con días lectivos, conferencias de padres y días festivos subido por el personal."
                      : "View the official calendar with class days, conferences, and holidays uploaded by school staff."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to="/calendario"
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-xs hover:bg-primary/90 transition-all inline-flex items-center gap-1.5"
                >
                  <span>{lang === "es" ? "Ver Calendario" : "View Calendar"}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  to="/eventos"
                  className="rounded-xl border border-border bg-card hover:bg-muted/50 px-4 py-2 text-xs font-bold text-foreground shadow-xs transition-all inline-flex items-center gap-1.5"
                >
                  <span>{lang === "es" ? "Ver Eventos" : "View Events"}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Artículos Informativos y Políticas */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="featured-heading">
        <div className="mb-6">
          <h2 id="featured-heading" className="text-2xl font-bold sm:text-3xl">
            {t("home.featured")}
          </h2>
          <p className="mt-1 text-muted-foreground">{t("home.featuredHint")}</p>
        </div>

        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-44 w-full rounded-2xl" />
                </li>
              ))
            : featured.map((a) => {
                const category = categoriesList.find((c) => c.id === a.category_id);
                return (
                  <li key={a.id}>
                    <ArticleCard article={a} category={category} />
                  </li>
                );
              })}
        </ul>
      </section>

      {/* Banner de Ayuda y Contacto */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="surface-card grid items-center gap-6 overflow-hidden bg-primary-soft p-6 sm:p-10 md:grid-cols-[auto_minmax(0,1fr)]">
          <img
            src={mascot}
            alt=""
            loading="lazy"
            className="mx-auto h-36 w-auto object-contain md:h-44"
          />
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Languages className="size-6 shrink-0 text-primary" aria-hidden="true" />
              {t("home.help.title")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">{t("home.help.body")}</p>
            <Link
              to="/contact"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary-deep"
            >
              {t("contact.title")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
