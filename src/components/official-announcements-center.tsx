import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Info,
  Megaphone,
  Pin,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localizedAnnouncement, type AnnouncementRow } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

interface OfficialAnnouncementsCenterProps {
  announcements: AnnouncementRow[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const LEVEL_STYLES = {
  urgent: {
    container:
      "border-destructive/40 bg-destructive/5 dark:bg-destructive/10 hover:border-destructive/60",
    badge: "bg-destructive text-destructive-foreground font-bold",
    iconColor: "text-destructive",
    labelKey: "announcementsCenter.level.urgent",
    Icon: AlertTriangle,
  },
  important: {
    container: "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 hover:border-amber-500/60",
    badge: "bg-amber-600 text-white font-bold dark:bg-amber-700",
    iconColor: "text-amber-600 dark:text-amber-400",
    labelKey: "announcementsCenter.level.important",
    Icon: Megaphone,
  },
  info: {
    container: "border-primary/30 bg-primary/5 dark:bg-primary/10 hover:border-primary/50",
    badge: "bg-primary text-primary-foreground font-bold",
    iconColor: "text-primary",
    labelKey: "announcementsCenter.level.info",
    Icon: Info,
  },
} as const;

export function OfficialAnnouncementsCenter({
  announcements,
  isLoading = false,
  onRefresh,
}: OfficialAnnouncementsCenterProps) {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  void onRefresh;

  const targetSchoolId =
    selectedSchool.id === "east"
      ? "sch-east"
      : selectedSchool.id === "lincoln"
        ? "sch-lincoln"
        : `sch-${selectedSchool.id}`;

  const handleCopy = (announcement: AnnouncementRow, title: string, message: string) => {
    const shareText = `[Boletín Oficial DMPS]\n${title}\n\n${message}\n\nMás información oficial: https://dmschools.org`;
    navigator.clipboard.writeText(shareText);
    setCopiedId(announcement.id);
    toast.success(t("announcementsCenter.copiedToast"));
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter announcements by query, level and school
  const filtered = announcements.filter((a) => {
    const { title, message } = localizedAnnouncement(a, lang);
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = selectedLevel === "all" || a.level === selectedLevel;

    const s = a.school_id;
    const matchesSchool =
      !s ||
      s === "all" ||
      s === "district" ||
      s === "sch-all" ||
      s === targetSchoolId ||
      s === selectedSchool.id;

    return matchesSearch && matchesLevel && matchesSchool;
  });

  // Sort: pinned first, then by date descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
  });

  const urgentCount = announcements.filter((a) => a.level === "urgent").length;
  const importantCount = announcements.filter((a) => a.level === "important").length;
  const infoCount = announcements.filter((a) => a.level === "info").length;

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Buscador por palabra clave */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              aria-label={t("announcementsCenter.searchLabel")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("announcementsCenter.searchPlaceholder")}
              className="pl-10 h-10 rounded-2xl bg-card border-border text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label={t("announcementsCenter.clearSearch")}
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>

          {/* Filtro por nivel de prioridad */}
          <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 h-10 rounded-2xl bg-muted p-1">
              <TabsTrigger value="all" className="rounded-xl text-xs font-semibold px-2">
                {t("announcementsCenter.all")} ({announcements.length})
              </TabsTrigger>
              <TabsTrigger
                value="urgent"
                className="rounded-xl text-xs font-semibold px-2 text-destructive data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
              >
                🚨 {urgentCount}
              </TabsTrigger>
              <TabsTrigger
                value="important"
                className="rounded-xl text-xs font-semibold px-2 text-amber-600 dark:text-amber-400 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                ⚠️ {importantCount}
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="rounded-xl text-xs font-semibold px-2 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                ℹ️ {infoCount}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Lista de Avisos Ordenados Cronológicamente */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-3xl" />
          ))
        ) : sorted.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border p-8 text-center bg-card/50 space-y-3">
            <Info className="size-8 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">
              {t("announcementsCenter.noneFound")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? `${t("announcementsCenter.noMatch")} "${searchQuery}". ${t("announcementsCenter.tryDifferent")}`
                : t("announcements.none")}
            </p>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold"
              >
                {t("announcementsCenter.clearSearchBtn")}
              </Button>
            )}
          </Card>
        ) : (
          sorted.map((announcement) => {
            const { title, message } = localizedAnnouncement(announcement, lang);
            const style = LEVEL_STYLES[announcement.level];
            const Icon = style.Icon;

            const formattedDate = new Date(announcement.starts_at).toLocaleDateString(
              lang === "es" ? "es-ES" : "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            );

            return (
              <article
                key={announcement.id}
                className={`rounded-3xl border p-5 sm:p-6 shadow-xs transition-all ${style.container}`}
              >
                {/* Encabezado de la Tarjeta */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`rounded-full px-3 py-1 text-xs gap-1.5 ${style.badge}`}>
                      <Icon className="size-3.5" aria-hidden="true" />
                      <span>{t(style.labelKey)}</span>
                    </Badge>

                    {announcement.is_pinned && (
                      <Badge
                        variant="outline"
                        className="rounded-full text-[11px] font-bold px-2.5 py-0.5 gap-1 border-primary/40 bg-primary/10 text-primary"
                      >
                        <Pin className="size-3 text-primary" />
                        <span>{t("announcementsCenter.pinned")}</span>
                      </Badge>
                    )}

                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{formattedDate}</span>
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-muted-foreground/80 flex items-center gap-1 bg-background/60 px-2.5 py-0.5 rounded-full border border-border/40">
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>DMPS Verified</span>
                  </span>
                </div>

                {/* Título y Mensaje */}
                <div className="pt-4 space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {message}
                  </p>
                </div>

                {/* Acciones del Aviso */}
                <div className="mt-5 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                  {announcement.link_url ? (
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className="rounded-xl text-xs font-bold gap-1.5 h-9"
                    >
                      {announcement.link_url.startsWith("/") ? (
                        <Link to={announcement.link_url}>
                          <span>{t("announcementsCenter.readFullDetails")}</span>
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      ) : (
                        <a href={announcement.link_url} target="_blank" rel="noopener noreferrer">
                          <span>{t("announcementsCenter.officialLink")}</span>
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      )}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium italic">
                      {t("announcementsCenter.directAdvisory")}
                    </span>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleCopy(announcement, title, message)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-medium gap-1.5 h-9 bg-background/80 hover:bg-background"
                  >
                    {copiedId === announcement.id ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {t("announcementsCenter.copied")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-muted-foreground" />
                        <span>{t("announcementsCenter.copyAlert")}</span>
                      </>
                    )}
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Guía Explicativa de Prioridades de Avisos Oficiales */}
      <Card className="rounded-3xl border border-border bg-card/60 p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
          <Sparkles className="size-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">
            {t("announcementsCenter.priorityGuideTitle")}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-1">
            <span className="font-bold text-destructive flex items-center gap-1">
              🚨 Nivel Urgente (Rojo)
            </span>
            <p className="text-muted-foreground leading-relaxed">
              {t("announcementsCenter.urgentDesc")}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              ⚠️ Nivel Importante (Amarillo)
            </span>
            <p className="text-muted-foreground leading-relaxed">
              {t("announcementsCenter.importantDesc")}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
            <span className="font-bold text-primary flex items-center gap-1">
              ℹ️ Nivel Informativo (Azul)
            </span>
            <p className="text-muted-foreground leading-relaxed">
              {t("announcementsCenter.infoDesc")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
