import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Info,
  MapPin,
  RefreshCw,
  Search,
  Share2,
  Shield,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PublicShell } from "@/components/public-shell";
import { SportsPhysicals } from "@/components/sports-physicals";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type BoundActivity,
  type BoundEvent,
  type BoundPractice,
  type BoundStatus,
  type BoundTeam,
  formatDateFormatted,
  formatTimeFormatted,
  fetchActivitiesForSchool,
  getStoredEvents,
  getStoredRegistrationSettings,
  getStoredTeams,
  LINCOLN_BOUND_BASE_URL,
  LINCOLN_BOUND_REGISTRATION_URL,
} from "@/lib/bound";
import {
  computeContentStatus,
  formatDesMoinesDate,
  getStatusBadgeInfo,
  type ContentStatus,
} from "@/lib/content-lifecycle";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";
import { trackActivityClick } from "@/analytics";

export const Route = createFileRoute("/deportes-actividades")({
  head: () => ({
    meta: [
      { title: "Deportes y Actividades — DMPS High Schools | Bound" },
      {
        name: "description",
        content:
          "Deportes, equipos, actividades y próximos eventos de Lincoln y East High School verificados en Bound.",
      },
      { property: "og:title", content: "Deportes y Actividades — DMPS High Schools" },
      {
        property: "og:description",
        content:
          "Calendarios, equipos, resultados y guía de registro oficial para deportes y actividades.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://familiasdmps.app/deportes-actividades" },
      { property: "og:image", content: "https://familiasdmps.app/og-preview.jpg" },
      { name: "twitter:image", content: "https://familiasdmps.app/og-preview.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/deportes-actividades" }],
  }),
  component: DeportesActividadesPage,
});

type FilterCategory =
  | "all"
  | "girls"
  | "boys"
  | "coed"
  | "extracurricular"
  | "upcoming_events"
  | "in_season"
  | "girls_coop";

function DeportesActividadesPage() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();

  // State
  const [activities, setActivities] = useState<BoundActivity[]>([]);
  const [teams, setTeams] = useState<BoundTeam[]>([]);
  const [events, setEvents] = useState<BoundEvent[]>([]);
  const [regSettings, setRegSettings] = useState(getStoredRegistrationSettings());

  const boundBaseUrl = selectedSchool.boundUrl;
  const schoolMascot = selectedSchool.mascot;
  const isEast = selectedSchool.id === "east";

  const [activeTab, setActiveTab] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeasonYear, setSelectedSeasonYear] = useState("2026-27");

  // Event list filter state
  const [eventFilter, setEventFilter] = useState<
    | "all"
    | "today"
    | "week"
    | "month"
    | "girls"
    | "boys"
    | "coed"
    | "extracurricular"
    | "home"
    | "away"
  >("all");

  // Modals
  const [selectedActivity, setSelectedActivity] = useState<BoundActivity | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [copyNotice, setCopyNotice] = useState(false);

  // Load datasets on mount, when selectedSchool changes, or when admin publishes updates
  useEffect(() => {
    const loadData = () => {
      void fetchActivitiesForSchool(selectedSchool.id, lang)
        .then(setActivities)
        .catch(() => setActivities([]));
      setTeams(getStoredTeams(selectedSchool.id));
      setEvents(getStoredEvents(selectedSchool.id));
      setRegSettings(getStoredRegistrationSettings(selectedSchool.id));
    };
    loadData();
    window.addEventListener("dmps_content_updated", loadData);
    return () => window.removeEventListener("dmps_content_updated", loadData);
  }, [selectedSchool.id, lang]);

  // Keyboard Escape listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedActivity(null);
        setIsHelpModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (!act.is_active) return false;

      // Filter category tab
      if (activeTab === "girls" && act.category !== "girls") return false;
      if (activeTab === "boys" && act.category !== "boys") return false;
      if (activeTab === "coed" && act.category !== "coed") return false;
      if (activeTab === "extracurricular" && act.category !== "extracurricular") return false;
      if (activeTab === "girls_coop" && act.category !== "girls_coop") return false;
      if (activeTab === "in_season" && act.status !== "En temporada") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = act.name.toLowerCase().includes(q);
        const matchTr = act.translated_name?.toLowerCase().includes(q) ?? false;
        const matchCategory = act.category.toLowerCase().includes(q);
        const matchSeason = act.season.toLowerCase().includes(q);
        if (!matchName && !matchTr && !matchCategory && !matchSeason) return false;
      }

      return true;
    });
  }, [activities, activeTab, searchQuery]);

  // Active / Happening Now events (or scheduled for current date/time)
  const activeNowEvents = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return events.filter((e) => {
      const isToday = e.starts_at.startsWith(todayStr) || e.starts_at.startsWith("2026-08-28");
      return isToday || e.status === "En curso";
    });
  }, [events]);

  // Upcoming Events list filtered chronologically
  const upcomingEventsFiltered = useMemo(() => {
    const todayStr = "2026-08-07"; // Base comparison date
    let list = events.filter((e) => e.starts_at >= todayStr || e.status === "Programado");

    if (eventFilter === "today") {
      list = list.filter(
        (e) => e.starts_at.startsWith("2026-08-28") || e.starts_at.startsWith("2026-08-27"),
      );
    } else if (eventFilter === "week") {
      list = list.filter((e) => e.starts_at <= "2026-09-05");
    } else if (eventFilter === "month") {
      list = list.filter((e) => e.starts_at <= "2026-09-30");
    } else if (eventFilter === "home") {
      list = list.filter((e) => e.home_away === "Home");
    } else if (eventFilter === "away") {
      list = list.filter((e) => e.home_away === "Away");
    }

    return list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [events, eventFilter]);

  // Helper to parse opponent details and generate team emblems/banners
  interface TeamBadge {
    name: string;
    shortName: string;
    bgGradient: string;
    textColor: string;
    borderColor: string;
    initials: string;
    mascot: string;
  }

  function parseGameTeams(title: string): {
    homeTeam: TeamBadge;
    awayTeam: TeamBadge;
    isVsMatch: boolean;
  } {
    const schoolBadge: TeamBadge = isEast
      ? {
          name: "Des Moines East",
          shortName: "East High",
          bgGradient: "from-rose-700 to-rose-950",
          textColor: "text-white",
          borderColor: "border-rose-500/50",
          initials: "E",
          mascot: "Scarlets",
        }
      : {
          name: "Des Moines Lincoln",
          shortName: "Lincoln",
          bgGradient: "from-red-700 to-red-950",
          textColor: "text-white",
          borderColor: "border-red-500/50",
          initials: "L",
          mascot: "Railsplitters",
        };

    const lower = title.toLowerCase();

    let opponent: TeamBadge = {
      name: "Opponent",
      shortName: "Opponent",
      bgGradient: "from-slate-700 to-slate-900",
      textColor: "text-white",
      borderColor: "border-slate-500/40",
      initials: "VS",
      mascot: "Team",
    };

    if (lower.includes("roosevelt")) {
      opponent = {
        name: "Des Moines Roosevelt",
        shortName: "Roosevelt",
        bgGradient: "from-blue-700 to-indigo-950",
        textColor: "text-white",
        borderColor: "border-blue-400/50",
        initials: "R",
        mascot: "Roughriders",
      };
    } else if (lower.includes("adm")) {
      opponent = {
        name: "ADM High School",
        shortName: "ADM",
        bgGradient: "from-amber-600 to-amber-950",
        textColor: "text-amber-200",
        borderColor: "border-amber-400/50",
        initials: "ADM",
        mascot: "Tigers",
      };
    } else if (lower.includes("dowling") || lower.includes("dchs")) {
      opponent = {
        name: "Dowling Catholic",
        shortName: "Dowling",
        bgGradient: "from-red-900 to-amber-950",
        textColor: "text-amber-300",
        borderColor: "border-amber-400/50",
        initials: "D",
        mascot: "Maroons",
      };
    } else if (lower.includes("clarke")) {
      opponent = {
        name: "Clarke High School",
        shortName: "Clarke",
        bgGradient: "from-red-800 to-rose-950",
        textColor: "text-white",
        borderColor: "border-red-400/50",
        initials: "C",
        mascot: "Indians",
      };
    } else if (lower.includes("ottumwa")) {
      opponent = {
        name: "Ottumwa High School",
        shortName: "Ottumwa",
        bgGradient: "from-red-600 to-red-900",
        textColor: "text-white",
        borderColor: "border-red-400/50",
        initials: "O",
        mascot: "Bulldogs",
      };
    } else if (lower.includes("mason city")) {
      opponent = {
        name: "Mason City",
        shortName: "Mason City",
        bgGradient: "from-zinc-800 to-black",
        textColor: "text-red-400",
        borderColor: "border-red-500/50",
        initials: "MC",
        mascot: "Riverhawks",
      };
    } else if (lower.includes("ankeny") || lower.includes("centennial")) {
      opponent = {
        name: "Ankeny Centennial",
        shortName: "Centennial",
        bgGradient: "from-slate-800 to-zinc-950",
        textColor: "text-emerald-400",
        borderColor: "border-emerald-500/50",
        initials: "AC",
        mascot: "Jaguars",
      };
    } else if (lower.includes("north") && !lower.includes("sioux")) {
      opponent = {
        name: "Des Moines North",
        shortName: "DM North",
        bgGradient: "from-sky-700 to-blue-950",
        textColor: "text-sky-200",
        borderColor: "border-sky-400/50",
        initials: "N",
        mascot: "Polar Bears",
      };
    } else if (lower.includes("sioux city")) {
      opponent = {
        name: "Sioux City North",
        shortName: "SC North",
        bgGradient: "from-blue-800 to-amber-900",
        textColor: "text-amber-300",
        borderColor: "border-amber-400/50",
        initials: "SCN",
        mascot: "Stars",
      };
    } else if (lower.includes("fort dodge") || lower.includes("ft dodge")) {
      opponent = {
        name: "Fort Dodge",
        shortName: "Fort Dodge",
        bgGradient: "from-red-700 to-slate-950",
        textColor: "text-white",
        borderColor: "border-red-500/50",
        initials: "FD",
        mascot: "Dodgers",
      };
    } else if (lower.includes("nevada")) {
      opponent = {
        name: "Nevada High School",
        shortName: "Nevada",
        bgGradient: "from-purple-800 to-amber-900",
        textColor: "text-amber-300",
        borderColor: "border-purple-400/50",
        initials: "NEV",
        mascot: "Cubs",
      };
    } else if (lower.includes("norwalk")) {
      opponent = {
        name: "Norwalk High School",
        shortName: "Norwalk",
        bgGradient: "from-purple-900 to-indigo-950",
        textColor: "text-amber-300",
        borderColor: "border-amber-400/50",
        initials: "NOR",
        mascot: "Warriors",
      };
    } else if (lower.includes("southeast polk") || lower.includes("se polk")) {
      opponent = {
        name: "Southeast Polk",
        shortName: "SE Polk",
        bgGradient: "from-yellow-600 to-zinc-950",
        textColor: "text-amber-300",
        borderColor: "border-amber-500/50",
        initials: "SEP",
        mascot: "Rams",
      };
    } else if (lower.includes("newton")) {
      opponent = {
        name: "Newton High School",
        shortName: "Newton",
        bgGradient: "from-red-600 to-zinc-950",
        textColor: "text-white",
        borderColor: "border-red-500/50",
        initials: "NEW",
        mascot: "Cardinals",
      };
    } else if (lower.includes("indianola")) {
      opponent = {
        name: "Indianola",
        shortName: "Indianola",
        bgGradient: "from-purple-800 to-zinc-950",
        textColor: "text-amber-300",
        borderColor: "border-purple-400/50",
        initials: "IND",
        mascot: "Indians",
      };
    } else if (lower.includes("urbandale")) {
      opponent = {
        name: "Urbandale",
        shortName: "Urbandale",
        bgGradient: "from-blue-700 to-slate-950",
        textColor: "text-white",
        borderColor: "border-blue-400/50",
        initials: "URB",
        mascot: "J-Hawks",
      };
    } else if (lower.includes("east") && !lower.includes("southeast")) {
      opponent = {
        name: "Des Moines East",
        shortName: "DM East",
        bgGradient: "from-red-800 to-black",
        textColor: "text-red-200",
        borderColor: "border-red-500/50",
        initials: "E",
        mascot: "Scarlets",
      };
    } else if (lower.includes("valley")) {
      opponent = {
        name: "WDM Valley",
        shortName: "Valley",
        bgGradient: "from-orange-600 to-zinc-950",
        textColor: "text-white",
        borderColor: "border-orange-500/50",
        initials: "VAL",
        mascot: "Tigers",
      };
    } else if (lower.includes("marshalltown")) {
      opponent = {
        name: "Marshalltown",
        shortName: "Marshalltown",
        bgGradient: "from-blue-800 to-red-950",
        textColor: "text-white",
        borderColor: "border-blue-400/50",
        initials: "MHS",
        mascot: "Bobcats",
      };
    } else {
      // General non-vs title e.g. Athletic Passes, Classic
      return {
        homeTeam: schoolBadge,
        awayTeam: {
          name: title,
          shortName: title.length > 20 ? title.slice(0, 18) + "..." : title,
          bgGradient: "from-amber-600 to-amber-900",
          textColor: "text-slate-950",
          borderColor: "border-amber-400/50",
          initials: isEast ? "E" : "L",
          mascot: schoolMascot ?? "",
        },
        isVsMatch: false,
      };
    }

    return {
      homeTeam: schoolBadge,
      awayTeam: opponent,
      isVsMatch: true,
    };
  }
  const selectedActivityTeams = useMemo(() => {
    if (!selectedActivity) return [];
    return teams.filter((t) => t.activity_id === selectedActivity.id);
  }, [selectedActivity, teams]);

  const selectedActivityEvents = useMemo(() => {
    if (!selectedActivity) return [];
    return events.filter((e) => e.activity_id === selectedActivity.id);
  }, [selectedActivity, events]);

  const getStatusBadgeVariant = (status: BoundStatus) => {
    switch (status) {
      case "En temporada":
      case "Registro abierto":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "Próximamente":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "Fuera de temporada":
      case "Registro cerrado":
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
      default:
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    }
  };

  const handleOpenRegistration = (url?: string | null) => {
    const targetUrl = url || regSettings.registration_url || selectedSchool.boundUrl;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleShare = (activityName: string) => {
    if (navigator.share) {
      void navigator.share({
        title: `${activityName} — ${selectedSchool.name}`,
        url: window.location.href,
      });
    } else {
      void navigator.clipboard.writeText(window.location.href);
      setCopyNotice(true);
      setTimeout(() => setCopyNotice(false), 2500);
    }
  };

  return (
    <PublicShell>
      {/* HEADER SECTION */}
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-bold text-primary shadow-soft uppercase tracking-wide">
                <Trophy className="size-4 text-primary" aria-hidden="true" />
                Des Moines {selectedSchool.name}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                {t("sports.pageTitle")}
              </h1>
              <p className="mt-2 max-w-2xl text-base text-muted-foreground leading-relaxed">
                {t("sports.pageSubtitle")} {selectedSchool.name}.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <RefreshCw className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                {t("sports.lastUpdated")}
              </span>
              <a
                href={boundBaseUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline underline-offset-4"
              >
                {t("sports.viewOfficialSource")}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ANUNCIO DE REGISTRO */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div
          className={`rounded-2xl border p-5 sm:p-6 shadow-xs ${
            regSettings.is_enabled ? "border-primary/20 bg-primary/5" : "border-border bg-muted/40"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 items-center justify-center rounded-lg font-bold text-xs ${
                    regSettings.is_enabled
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  <Sparkles className="size-4" />
                </span>
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  {regSettings.title}
                </h2>
                {!regSettings.is_enabled && (
                  <span className="rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-xs font-bold border border-slate-300 dark:border-slate-700">
                    {t("lifecycle.status.registration_closed")}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                {regSettings.message}
              </p>
              {!regSettings.is_enabled && (
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {t("lifecycle.registration_ended_notice")}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                <Shield className="size-3.5 text-primary" />
                <span>
                  {t("sports.registrationSupport")} {selectedSchool.name}.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {regSettings.is_enabled ? (
                <Button
                  onClick={() => handleOpenRegistration()}
                  className="min-h-11 px-5 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:opacity-95"
                >
                  {regSettings.primary_button_label}
                  <ExternalLink className="size-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  disabled
                  className="min-h-11 px-5 rounded-xl font-bold bg-muted text-muted-foreground cursor-not-allowed"
                >
                  {t("lifecycle.status.registration_closed")}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsHelpModalOpen(true)}
                className="min-h-11 px-4 rounded-xl font-semibold border-border bg-card hover:bg-muted"
              >
                <HelpCircle className="size-4 mr-1.5 text-primary" />
                {regSettings.secondary_button_label}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* NAVEGACIÓN SUPERIOR FIJA / STICKY BAR */}
      <section className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border mt-6 shadow-xs">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3">
            {/* Upper controls: Search bar & Season selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  aria-label={t("sports.searchAria")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("sports.searchPlaceholder")}
                  className="pl-10 min-h-10 rounded-xl text-sm bg-card border-border"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={t("sports.clearSearch")}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  {t("sports.seasonLabel")}
                </span>
                <select
                  aria-label={t("sports.seasonAria")}
                  value={selectedSeasonYear}
                  onChange={(e) => setSelectedSeasonYear(e.target.value)}
                  className="min-h-10 rounded-xl border border-input bg-card px-3 py-1 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="2026-27">{`2026-27 (${t("sports.seasonCurrent")})`}</option>
                  <option value="2027-28">{`2027-28 (${t("sports.seasonNext")})`}</option>
                  <option value="2025-26">{`2025-26 (${t("sports.seasonPrevious")})`}</option>
                </select>
              </div>
            </div>

            {/* Horizontal scrollable tab buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
              <button
                onClick={() => setActiveTab("all")}
                className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === "all"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-card border border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {t("sports.tab.all")}
              </button>
              <button
                onClick={() => setActiveTab("girls")}
                className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === "girls"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-card border border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {t("sports.tab.girls")}
              </button>
              <button
                onClick={() => setActiveTab("boys")}
                className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === "boys"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-card border border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {t("sports.tab.boys")}
              </button>
              <button
                onClick={() => setActiveTab("coed")}
                className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === "coed"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-card border border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {t("sports.tab.coed")}
              </button>
              <button
                onClick={() => setActiveTab("extracurricular")}
                className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === "extracurricular"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-card border border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {t("sports.tab.extracurricular")}
              </button>
              <button
                onClick={() => setActiveTab("in_season")}
                className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === "in_season"
                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                    : "bg-card border border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {t("sports.tab.inSeason")}
              </button>
              <button
                onClick={() => setActiveTab("girls_coop")}
                className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === "girls_coop"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-card border border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {t("sports.tab.girlsCoop")}
              </button>
              <button
                onClick={() => setActiveTab("upcoming_events")}
                className={`min-h-9 px-3.5 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === "upcoming_events"
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-card border border-border text-foreground/80 hover:bg-muted"
                }`}
              >
                {t("sports.tab.upcomingEvents")}
              </button>
              <button
                onClick={() => handleOpenRegistration()}
                className="min-h-9 px-3.5 rounded-lg whitespace-nowrap font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors ml-auto flex items-center gap-1 shrink-0"
              >
                {t("sports.register")}
                <ExternalLink className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SEASON NOTICE IF NON-CURRENT SEASON IS SELECTED */}
      {selectedSeasonYear !== "2026-27" && (
        <div className="mx-auto max-w-6xl px-4 mt-4 sm:px-6">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="size-4 shrink-0" />
              <span>
                {t("sports.seasonNotPublished")} {selectedSeasonYear}.{" "}
                {t("sports.seasonCheckCurrent")}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedSeasonYear("2026-27")}
              className="min-h-8 text-xs bg-card"
            >
              {t("sports.viewCurrentSeason")}
            </Button>
          </div>
        </div>
      )}

      {/* OCURRIENDO AHORA / PROGRAMADO PARA ESTA HORA */}
      {activeNowEvents.length > 0 && activeTab !== "upcoming_events" && (
        <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <div className="rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {t("sports.happeningNow")}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeNowEvents.map((evt) => {
                const teamsInfo = parseGameTeams(evt.opponent_or_title);
                return (
                  <div
                    key={evt.id}
                    className="rounded-2xl border border-border p-4 bg-background space-y-3 shadow-xs hover:border-amber-500/40 transition-all"
                  >
                    {/* Game Banner */}
                    <div className="relative rounded-xl bg-slate-950 p-3.5 border border-slate-800 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-950 opacity-90" />
                      <div className="relative z-10 flex items-center justify-between gap-3">
                        {/* Home / Lincoln Team */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={`size-10 rounded-xl bg-gradient-to-br ${teamsInfo.homeTeam.bgGradient} border ${teamsInfo.homeTeam.borderColor} flex items-center justify-center text-white font-black text-base shadow-md shrink-0`}
                          >
                            {teamsInfo.homeTeam.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-white tracking-wide truncate">
                              {teamsInfo.homeTeam.shortName}
                            </p>
                            <p className="text-[10px] text-red-300 font-semibold truncate">
                              {teamsInfo.homeTeam.mascot}
                            </p>
                          </div>
                        </div>

                        {/* VS Badge */}
                        <div className="flex flex-col items-center shrink-0 px-2">
                          <span className="rounded-full bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 shadow-xs uppercase tracking-wider">
                            VS
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">
                            {evt.home_away === "Home" ? t("sports.home") : t("sports.away")}
                          </span>
                        </div>

                        {/* Away / Opponent Team */}
                        <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-white tracking-wide truncate">
                              {teamsInfo.awayTeam.shortName}
                            </p>
                            <p className="text-[10px] text-slate-300 font-semibold truncate">
                              {teamsInfo.awayTeam.mascot}
                            </p>
                          </div>
                          <div
                            className={`size-10 rounded-xl bg-gradient-to-br ${teamsInfo.awayTeam.bgGradient} border ${teamsInfo.awayTeam.borderColor} flex items-center justify-center ${teamsInfo.awayTeam.textColor} font-black text-base shadow-md shrink-0`}
                          >
                            {teamsInfo.awayTeam.initials}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-foreground text-sm">
                        {evt.opponent_or_title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <Calendar className="size-3.5 text-amber-500" />
                          {formatDateFormatted(evt.starts_at)}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <Clock className="size-3.5" />
                          {formatTimeFormatted(evt.starts_at)}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                          <MapPin className="size-3.5 text-primary" />
                          {evt.location_name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MAIN CONTENT AREA */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* VIEW MODE: UPCOMING EVENTS TAB */}
        {activeTab === "upcoming_events" ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-foreground">
                {t("sports.tab.upcomingEvents")}
              </h2>
              {/* Event sub-filter buttons */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <button
                  onClick={() => setEventFilter("all")}
                  className={`px-3 py-1.5 rounded-lg border ${
                    eventFilter === "all"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-card border-border"
                  }`}
                >
                  {t("sports.tab.all")}
                </button>
                <button
                  onClick={() => setEventFilter("today")}
                  className={`px-3 py-1.5 rounded-lg border ${
                    eventFilter === "today"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-card border-border"
                  }`}
                >
                  {t("sports.today")}
                </button>
                <button
                  onClick={() => setEventFilter("week")}
                  className={`px-3 py-1.5 rounded-lg border ${
                    eventFilter === "week"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-card border-border"
                  }`}
                >
                  {t("sports.thisWeek")}
                </button>
                <button
                  onClick={() => setEventFilter("home")}
                  className={`px-3 py-1.5 rounded-lg border ${
                    eventFilter === "home"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-card border-border"
                  }`}
                >
                  {t("sports.home")}
                </button>
                <button
                  onClick={() => setEventFilter("away")}
                  className={`px-3 py-1.5 rounded-lg border ${
                    eventFilter === "away"
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-card border-border"
                  }`}
                >
                  {t("sports.away")}
                </button>
              </div>
            </div>

            {upcomingEventsFiltered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center bg-card rounded-2xl border border-border">
                {t("sports.noEventsMatch")}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingEventsFiltered.map((evt) => {
                  const teamsInfo = parseGameTeams(evt.opponent_or_title);
                  return (
                    <div
                      key={evt.id}
                      className="surface-card p-5 flex flex-col justify-between gap-4 hover:border-amber-500/50 transition-all rounded-2xl"
                    >
                      {/* Game Banner */}
                      <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-800 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-950 opacity-90" />
                        <div className="relative z-10 flex items-center justify-between gap-3">
                          {/* Home / Lincoln Team */}
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div
                              className={`size-11 rounded-xl bg-gradient-to-br ${teamsInfo.homeTeam.bgGradient} border ${teamsInfo.homeTeam.borderColor} flex items-center justify-center text-white font-black text-lg shadow-md shrink-0`}
                            >
                              {teamsInfo.homeTeam.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-white tracking-wide truncate">
                                {teamsInfo.homeTeam.shortName}
                              </p>
                              <p className="text-[10px] text-red-300 font-semibold truncate">
                                {teamsInfo.homeTeam.mascot}
                              </p>
                            </div>
                          </div>

                          {/* VS Badge */}
                          <div className="flex flex-col items-center shrink-0 px-2">
                            <span className="rounded-full bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 shadow-xs uppercase tracking-wider">
                              VS
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                              {evt.home_away === "Home" ? t("sports.home") : t("sports.away")}
                            </span>
                          </div>

                          {/* Away / Opponent Team */}
                          <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-white tracking-wide truncate">
                                {teamsInfo.awayTeam.shortName}
                              </p>
                              <p className="text-[10px] text-slate-300 font-semibold truncate">
                                {teamsInfo.awayTeam.mascot}
                              </p>
                            </div>
                            <div
                              className={`size-11 rounded-xl bg-gradient-to-br ${teamsInfo.awayTeam.bgGradient} border ${teamsInfo.awayTeam.borderColor} flex items-center justify-center ${teamsInfo.awayTeam.textColor} font-black text-lg shadow-md shrink-0`}
                            >
                              {teamsInfo.awayTeam.initials}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Event details with 12h Iowa time */}
                      <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-foreground leading-snug">
                          {evt.opponent_or_title}
                        </h3>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                              <Calendar className="size-3.5 text-amber-500" />
                              {formatDateFormatted(evt.starts_at)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              <Clock className="size-3.5" />
                              {formatTimeFormatted(evt.starts_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <MapPin className="size-3.5 text-primary shrink-0" />
                            <span className="font-medium">
                              {evt.location_name}{" "}
                              {evt.location_address ? `(${evt.location_address})` : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Tickets */}
                      {evt.ticket_url && (
                        <div className="pt-2 border-t border-border flex items-center justify-between">
                          <a
                            href={evt.ticket_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                          >
                            <Ticket className="size-3.5" />
                            {t("sports.buyTickets")}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* VIEW MODE: SPORTS & ACTIVITIES CARDS GRID */
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">
                {activeTab === "all" && t("sports.heading.all")}
                {activeTab === "girls" && t("sports.heading.girls")}
                {activeTab === "boys" && t("sports.heading.boys")}
                {activeTab === "coed" && t("sports.heading.coed")}
                {activeTab === "extracurricular" && t("sports.heading.extracurricular")}
                {activeTab === "in_season" && t("sports.heading.inSeason")}
                {activeTab === "girls_coop" && t("sports.heading.girlsCoop")}
              </h2>
              <span className="text-xs font-semibold text-muted-foreground">
                {filteredActivities.length} {t("sports.resultsCount")}
              </span>
            </div>

            {filteredActivities.length === 0 ? (
              <div className="surface-card p-8 text-center space-y-2">
                <p className="text-base font-semibold text-foreground">{t("sports.noResults")}</p>
                <p className="text-xs text-muted-foreground">{t("sports.noResultsHint")}</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredActivities.map((act) => {
                  const statusClass = getStatusBadgeVariant(act.status);
                  const bannerUrl =
                    act.card_banner_url || (act.icon_url?.startsWith("http") ? act.icon_url : null);
                  const cardBg = act.card_bg?.trim() || null;
                  const isDarkBg =
                    cardBg &&
                    (cardBg.includes("#0") ||
                      cardBg.includes("#1") ||
                      cardBg.includes("0f172a") ||
                      cardBg.includes("e11d48"));

                  return (
                    <div
                      key={act.id}
                      style={cardBg ? { background: cardBg } : undefined}
                      className={`surface-card flex flex-col justify-between overflow-hidden p-0 hover:border-amber-500/50 transition-all shadow-xs rounded-2xl ${
                        isDarkBg ? "text-white border-white/20" : ""
                      }`}
                    >
                      {bannerUrl && (
                        <div className="relative w-full overflow-hidden border-b border-border/50 bg-muted/20">
                          <img
                            src={bannerUrl}
                            alt={act.name}
                            className="w-full h-auto max-h-[600px] object-cover transition-transform duration-300 hover:scale-[1.02] rounded-t-2xl"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          {/* Top categories & status */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${
                                isDarkBg ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                              }`}
                            >
                              {act.gender_group === "Girls" && t("sports.gender.girls")}
                              {act.gender_group === "Boys" && t("sports.gender.boys")}
                              {act.gender_group === "Coed" && t("sports.gender.coed")}
                              {act.gender_group === "Activity" && t("sports.gender.activity")}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                                isDarkBg ? "bg-white/15 text-white border-white/30" : statusClass
                              }`}
                            >
                              {act.status}
                            </span>
                          </div>

                          {/* Title & Translation */}
                          <h3
                            className={`text-xl font-bold leading-snug ${
                              isDarkBg ? "text-white" : "text-foreground"
                            }`}
                          >
                            {act.name}
                          </h3>
                          {act.translated_name && act.translated_name !== act.name && (
                            <p
                              className={`text-xs font-medium mt-0.5 ${
                                isDarkBg ? "text-slate-300" : "text-muted-foreground"
                              }`}
                            >
                              {act.translated_name}
                            </p>
                          )}

                          {/* Details */}
                          <div
                            className={`mt-4 space-y-2 text-xs ${
                              isDarkBg ? "text-slate-200" : "text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Calendar
                                className={`size-3.5 shrink-0 ${
                                  isDarkBg ? "text-amber-400" : "text-primary"
                                }`}
                              />
                              <span>
                                {t("sports.seasonLabel")}{" "}
                                <strong
                                  className={`font-semibold ${
                                    isDarkBg ? "text-white" : "text-foreground"
                                  }`}
                                >
                                  {act.season}
                                </strong>
                              </span>
                            </div>

                            {act.levels && act.levels.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Users
                                  className={`size-3.5 shrink-0 ${
                                    isDarkBg ? "text-amber-400" : "text-primary"
                                  }`}
                                />
                                <span>
                                  {t("sports.levelsLabel")}{" "}
                                  <strong
                                    className={`font-semibold ${
                                      isDarkBg ? "text-white" : "text-foreground"
                                    }`}
                                  >
                                    {act.levels.join(", ")}
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Buttons: Golden 'Ver información' button */}
                        <div
                          className={`mt-6 pt-4 border-t ${
                            isDarkBg ? "border-white/20" : "border-border"
                          }`}
                        >
                          <Button
                            onClick={() => {
                              trackActivityClick(act.id, selectedSchool.id, {
                                category: act.category,
                                season: act.season,
                              });
                              setSelectedActivity(act);
                            }}
                            className="w-full min-h-11 rounded-xl font-extrabold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs transition-colors"
                          >
                            <Info className="size-4 mr-1.5" />
                            {t("sports.viewInfo")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <SportsPhysicals />

      {/* DETAIL MODAL (VENTANA DE INFORMACIÓN) */}
      {selectedActivity && (
        <div
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedActivity(null);
          }}
        >
          <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedActivity(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("sports.closeModal")}
            >
              <X className="size-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary uppercase">
                  {selectedActivity.gender_group}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeVariant(
                    selectedActivity.status,
                  )}`}
                >
                  {selectedActivity.status}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-foreground">{selectedActivity.name}</h2>
              {selectedActivity.translated_name && (
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedActivity.translated_name}
                </p>
              )}
            </div>

            {/* Modal Sections */}
            <div className="mt-6 space-y-6 text-sm">
              {/* SECTION: Team Information */}
              <div className="rounded-xl border border-border p-4 bg-muted/30 space-y-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  {t("sports.teamInfo")}
                </h3>

                {selectedActivityTeams.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    {selectedActivityTeams.map((team) => (
                      <div
                        key={team.id}
                        className="rounded-lg border border-border p-3 bg-card space-y-1"
                      >
                        <p className="font-bold text-foreground">{team.name}</p>
                        <p className="text-muted-foreground">
                          {t("sports.level")}{" "}
                          <strong className="text-foreground">{team.level}</strong>
                        </p>
                        {team.head_coach && (
                          <p className="text-muted-foreground">
                            {t("sports.headCoach")}{" "}
                            <strong className="text-foreground">{team.head_coach}</strong>
                          </p>
                        )}
                        {team.class_name && (
                          <p className="text-muted-foreground">
                            {t("sports.className")} {team.class_name}
                          </p>
                        )}
                        {team.conference && (
                          <p className="text-muted-foreground">
                            {t("sports.conference")} {team.conference}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      {t("sports.levelsAvailable")}{" "}
                      <strong className="text-foreground">
                        {selectedActivity.levels?.join(", ") || "Varsity, JV"}
                      </strong>
                    </p>
                    <p>{t("sports.coachInfoVerified")}</p>
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between">
                  <span>{t("sports.lastVerified")}</span>
                  <a
                    href={selectedActivity.official_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {t("sports.officialPageBound")}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              {/* SECTION: Calendario / Próximos Juegos */}
              <div className="space-y-3">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  {t("sports.calendar")}
                </h3>

                {selectedActivityEvents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedActivityEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="rounded-xl border border-border p-3 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-foreground">{evt.opponent_or_title}</p>
                          <div className="text-muted-foreground flex flex-wrap items-center gap-3">
                            <span>{formatDateFormatted(evt.starts_at)}</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {formatTimeFormatted(evt.starts_at)}
                            </span>
                            <span className="font-semibold text-primary">
                              {evt.home_away === "Home" ? t("sports.home") : t("sports.away")}
                            </span>
                            <span>{evt.location_name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 text-[11px]">
                            {evt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {t("sports.noUpcomingEvents")}
                  </p>
                )}
              </div>

              {/* SECTION: Prácticas públicas */}
              <div className="space-y-2">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  {t("sports.publicPractices")}
                </h3>
                <p className="text-xs text-muted-foreground">{t("sports.noPracticesAvailable")}</p>
              </div>

              {/* SECTION: Resultados recientes */}
              <div className="space-y-2">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  {t("sports.results")}
                </h3>
                <div className="rounded-xl border border-border p-3 bg-card text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">{t("sports.resultsValidated")}</p>
                  <a
                    href={selectedActivity.official_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline pt-1"
                  >
                    {t("sports.viewFullResults")}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-border flex flex-col gap-3">
              {(selectedActivity.status === "Registro cerrado" ||
                selectedActivity.status === "Fuera de temporada") && (
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {t("lifecycle.registration_ended_notice")}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedActivity.status === "Registro cerrado" ||
                  selectedActivity.status === "Fuera de temporada" ? (
                    <Button
                      disabled
                      className="min-h-10 px-4 rounded-xl font-bold bg-muted text-muted-foreground text-xs cursor-not-allowed"
                    >
                      {t("lifecycle.status.registration_closed")}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleOpenRegistration(selectedActivity.registration_url)}
                      className="min-h-10 px-4 rounded-xl font-bold bg-primary text-primary-foreground text-xs"
                    >
                      {t("sports.register")}
                    </Button>
                  )}
                  <a
                    href={selectedActivity.official_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    {t("sports.viewOfficialPage")}
                    <ExternalLink className="size-3.5 ml-1.5" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(selectedActivity.name)}
                    className="min-h-10 rounded-xl text-xs gap-1.5"
                  >
                    <Share2 className="size-3.5" />
                    {t("sports.share")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedActivity(null)}
                    className="min-h-10 rounded-xl text-xs"
                  >
                    {t("sports.close")}
                  </Button>
                </div>
              </div>
            </div>

            {copyNotice && (
              <p className="mt-2 text-center text-xs font-semibold text-emerald-600">
                {t("sports.linkCopied")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* HELP / SUPPORT MODAL (NECESITO AYUDA) */}
      {isHelpModalOpen && (
        <div
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHelpModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setIsHelpModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("sports.closeModal")}
            >
              <X className="size-5" />
            </button>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <HelpCircle className="size-4" />
                {selectedSchool.id === "east"
                  ? t("sports.help.titleEast")
                  : t("sports.help.titleLincoln")}
              </span>
              <h2 className="text-xl font-bold text-foreground">{t("sports.help.question")}</h2>
            </div>

            <p className="text-sm text-foreground/90 leading-relaxed">
              {selectedSchool.id === "east"
                ? t("sports.help.introEast")
                : t("sports.help.introLincoln")}
            </p>

            {selectedSchool.id === "east" ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1">
                  <p className="font-bold text-foreground">Rosario Jiménez</p>
                  <p className="text-xs text-muted-foreground">{t("sports.help.roleEastCoord1")}</p>
                </div>

                <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1">
                  <p className="font-bold text-foreground">Francisco Hernández</p>
                  <p className="text-xs text-muted-foreground">{t("sports.help.roleEastCoord2")}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1">
                  <p className="font-bold text-foreground">Brenda Lucero</p>
                  <p className="text-xs text-muted-foreground">
                    {t("sports.help.roleLincolnCoord1")}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-3.5 bg-muted/40 space-y-1">
                  <p className="font-bold text-foreground">Veronica Ortiz</p>
                  <p className="text-xs text-muted-foreground">
                    {t("sports.help.roleLincolnCoord2")}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <strong>{t("sports.help.noteImportant")}</strong> {t("sports.help.notePhonesInfo")}{" "}
              {selectedSchool.name}.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="default"
                onClick={() => {
                  setIsHelpModalOpen(false);
                  handleOpenRegistration();
                }}
                className="min-h-10 rounded-xl font-bold text-xs"
              >
                {t("sports.help.goToOfficialRegistration")}
                <ExternalLink className="size-3.5 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsHelpModalOpen(false)}
                className="min-h-10 rounded-xl text-xs"
              >
                {t("sports.help.understood")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PublicShell>
  );
}
