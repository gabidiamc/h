/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Archive,
  RotateCcw,
  Calendar,
  RefreshCw,
  Search,
  ArrowUpRight,
  Zap,
  Code2,
  Copy,
  Check,
  Trophy,
  Infinity as InfinityIcon,
  Bell,
  FileText,
  GraduationCap,
  HelpCircle,
  Phone,
  Power,
  CalendarPlus,
  SlidersHorizontal,
  XCircle,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  computeContentStatus,
  formatDesMoinesDate,
  formatDesMoinesDateTime,
  getDesMoinesComponents,
  getStatusBadgeInfo,
  isItemPermanent,
  getEffectiveEndsAt,
  type ContentStatus,
  DES_MOINES_TIMEZONE,
} from "@/lib/content-lifecycle";
import {
  syncAndUpdateAllStatuses,
  deactivateAllExpiredResources,
  toggleResourceActive,
  setResourceExpiration,
  getDatabaseSqlDefinition,
  type SyncStatusSummary,
  type ResourceTable,
} from "@/lib/status-sync-service";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

interface AdminResourceItem {
  id: string;
  table: ResourceTable;
  title: string;
  typeLabel: string;
  iconType: "announcement" | "event" | "activity" | "program" | "article" | "faq" | "contact";
  starts_at: string | null;
  ends_at: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  expires_at?: string | null;
  review_date?: string | null;
  status: string;
  is_active: boolean;
  is_permanent: boolean;
  archived_at: string | null;
  updated_at: string | null;
  directAdminLink: string;
  effectiveEnds?: Date | null;
}

export const Route = createFileRoute("/admin/vigencia")({
  component: AdminVigenciaPage,
});

function AdminVigenciaPage() {
  const { t } = useI18n();
  const { adminSchoolFilter } = useSchool();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [validityFilter, setValidityFilter] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [showSqlDialog, setShowSqlDialog] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [lastSyncSummary, setLastSyncSummary] = useState<SyncStatusSummary | null>(null);

  // Expiration editor modal state
  const [editingItem, setEditingItem] = useState<AdminResourceItem | null>(null);
  const [customDate, setCustomDate] = useState<string>("");
  const [customTime, setCustomTime] = useState<string>("23:59");

  // Update real-time Des Moines clock
  useEffect(() => {
    const updateTime = () => {
      const parts = getDesMoinesComponents(new Date());
      setCurrentTime(`${parts.isoDate} ${parts.timeStr} (America/Chicago)`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch all items from all tables to provide unified lifecycle & expiration control
  const {
    data: rawItems = [],
    isLoading,
    refetch,
  } = useQuery<AdminResourceItem[]>({
    queryKey: ["admin_lifecycle_all_resources", adminSchoolFilter],
    queryFn: async () => {
      const results: AdminResourceItem[] = [];

      // 1. Announcements
      const [{ data: announcements }, { data: annTrs }] = await Promise.all([
        supabase.from("announcements").select("id, starts_at, expires_at, status, updated_at"),
        supabase.from("announcement_translations").select("announcement_id, title, language_code"),
      ]);

      if (announcements) {
        announcements.forEach((a) => {
          const itemTrs = (annTrs ?? []).filter(
            (tr: any) => String(tr.announcement_id) === String(a.id),
          );
          const trans = itemTrs.find((tr) => tr.language_code === "es") || itemTrs[0];
          const isPerm = !a.expires_at;
          const isActive = a.status === "published" || a.status === "scheduled";
          results.push({
            id: a.id,
            table: "announcements",
            title: trans?.title || "Aviso sin título",
            typeLabel: "Aviso",
            iconType: "announcement",
            starts_at: a.starts_at,
            ends_at: a.expires_at,
            expires_at: a.expires_at,
            status: a.status || "published",
            is_active: isActive,
            is_permanent: isPerm,
            archived_at: a.status === "archived" ? a.updated_at : null,
            updated_at: a.updated_at,
            directAdminLink: "/admin/anuncios",
          });
        });
      }

      // 2. Events
      const { data: events } = await supabase.from("events").select("*");

      if (events) {
        events.forEach((rawEv) => {
          const e = rawEv as Record<string, any>;
          const startDate = e.start_date || (e.starts_at ? String(e.starts_at).slice(0, 10) : null);
          const starts = startDate
            ? e.start_time
              ? `${startDate}T${e.start_time}:00`
              : `${startDate}T00:00:00`
            : (e.starts_at ?? null);
          const ends = e.end_date
            ? e.end_time
              ? `${String(e.end_date).slice(0, 10)}T${e.end_time}:00`
              : `${String(e.end_date).slice(0, 10)}T23:59:59`
            : startDate
              ? e.end_time
                ? `${startDate}T${e.end_time}:00`
                : `${startDate}T23:59:59`
              : starts;
          const isPerm = !e.end_date && !startDate;
          const isActive = e.status === "published" && !e.is_cancelled;
          results.push({
            id: e.id,
            table: "events",
            title: e.title || "Evento escolar",
            typeLabel: "Evento Calendario",
            iconType: "event",
            starts_at: starts,
            ends_at: ends,
            start_date: startDate,
            end_date: e.end_date,
            start_time: e.start_time,
            end_time: e.end_time,
            status: e.is_cancelled ? "cancelled" : e.status || "published",
            is_active: isActive,
            is_permanent: isPerm,
            archived_at: e.status === "archived" ? e.updated_at : null,
            updated_at: e.updated_at,
            directAdminLink: "/admin/calendario",
          });
        });
      }

      // 3. Activities / Sports / School Games
      const { data: activities } = await supabase.from("activities").select(`
          id,
          name,
          season,
          status,
          enrollment_open,
          updated_at
        `);

      if (activities) {
        activities.forEach((act) => {
          const isActive = act.status === "published";
          results.push({
            id: act.id,
            table: "activities",
            title: act.name || "Deporte / Actividad",
            typeLabel: "Deporte / Juego",
            iconType: "activity",
            starts_at: null,
            ends_at: null,
            status: act.status || "published",
            is_active: isActive,
            is_permanent: true, // Activities default to permanent seasonal until archived
            archived_at: act.status === "archived" ? act.updated_at : null,
            updated_at: act.updated_at,
            directAdminLink: "/admin/actividades",
          });
        });
      }

      // 4. Programs
      const { data: programs } = await supabase.from("programs").select(`
          id,
          name,
          start_date,
          end_date,
          status,
          enrollment_open,
          updated_at
        `);

      if (programs) {
        programs.forEach((p) => {
          const isPerm = !p.end_date;
          const isActive = p.status === "published";
          results.push({
            id: p.id,
            table: "programs",
            title: p.name || "Programa escolar",
            typeLabel: "Programa",
            iconType: "program",
            starts_at: p.start_date ? `${p.start_date}T00:00:00` : null,
            ends_at: p.end_date ? `${p.end_date}T23:59:59` : null,
            end_date: p.end_date,
            status: p.status || "published",
            is_active: isActive,
            is_permanent: isPerm,
            archived_at: p.status === "archived" ? p.updated_at : null,
            updated_at: p.updated_at,
            directAdminLink: "/admin/programas",
          });
        });
      }

      // 5. Articles / Guides
      const [{ data: articles }, { data: artTrs }] = await Promise.all([
        supabase.from("articles").select("id, title, content, published_at, status, updated_at"),
        supabase.from("article_translations").select("article_id, title, language_code"),
      ]);

      if (articles) {
        articles.forEach((rawArt) => {
          const art = rawArt as Record<string, any>;
          const itemTrs = (artTrs ?? []).filter(
            (t: any) => String(t.article_id) === String(art.id),
          );
          const trans = itemTrs.find((t) => t.language_code === "es") || itemTrs[0];
          let reviewDate: string | null = null;
          if (typeof art.content === "string" && art.content.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(art.content);
              reviewDate = parsed?._meta?.review_date ?? null;
            } catch {
              reviewDate = null;
            }
          }
          const isPerm = !reviewDate;
          const isActive = art.status === "published";
          results.push({
            id: art.id,
            table: "articles",
            title: trans?.title || art.title || "Artículo sin título",
            typeLabel: "Artículo / Guía",
            iconType: "article",
            starts_at: art.published_at,
            ends_at: reviewDate ? `${reviewDate}T23:59:59` : null,
            review_date: reviewDate,
            status: art.status || "published",
            is_active: isActive,
            is_permanent: isPerm,
            archived_at: art.status === "archived" ? art.updated_at : null,
            updated_at: art.updated_at,
            directAdminLink: "/admin/articulos",
          });
        });
      }

      // 6. FAQs
      const [{ data: faqs }, { data: faqTrs }] = await Promise.all([
        supabase.from("faqs").select("id, question, status, updated_at"),
        supabase.from("faq_translations").select("faq_id, question, language_code"),
      ]);

      if (faqs) {
        faqs.forEach((faq: any) => {
          const itemTrs = (faqTrs ?? []).filter((t: any) => String(t.faq_id) === String(faq.id));
          const trans = itemTrs.find((t) => t.language_code === "es") || itemTrs[0];
          const isPublished = faq.status === "published";
          results.push({
            id: faq.id,
            table: "faqs",
            title: trans?.question || faq.question || "Pregunta frecuente",
            typeLabel: "Pregunta Frecuente",
            iconType: "faq",
            starts_at: null,
            ends_at: null,
            status: isPublished ? "published" : "archived",
            is_active: isPublished,
            is_permanent: true,
            archived_at: !isPublished ? faq.updated_at : null,
            updated_at: faq.updated_at,
            directAdminLink: "/admin/ayuda-familias",
          });
        });
      }

      // 7. Contacts
      const { data: contacts } = await supabase.from("contacts").select(`
          id,
          department,
          person_name,
          role_title,
          job_title,
          is_visible,
          verified_at,
          updated_at
        `);

      if (contacts) {
        contacts.forEach((rawContact) => {
          const c = rawContact as Record<string, any>;
          const personName = c.person_name ?? c.role_title ?? c.job_title ?? null;
          const isVisible = c.is_visible ?? true;
          results.push({
            id: c.id,
            table: "contacts",
            title: `${c.department || ""} ${personName ? `(${personName})` : ""}`.trim(),
            typeLabel: "Contacto Directorio",
            iconType: "contact",
            starts_at: null,
            ends_at: null,
            status: isVisible ? "published" : "archived",
            is_active: Boolean(isVisible),
            is_permanent: true,
            archived_at: !isVisible ? c.updated_at || c.verified_at : null,
            updated_at: c.updated_at || c.verified_at,
            directAdminLink: "/admin/contactos",
          });
        });
      }

      return results;
    },
    staleTime: 1000 * 20,
  });

  // Calculate items with computed lifecycle status
  const processedItems = useMemo(() => {
    return rawItems.map((item) => {
      const computedStatus: ContentStatus = computeContentStatus(
        {
          starts_at: item.starts_at,
          ends_at: item.ends_at,
          start_date: item.start_date,
          end_date: item.end_date,
          start_time: item.start_time,
          end_time: item.end_time,
          expires_at: item.expires_at,
          review_date: item.review_date,
          status: item.status,
          archived_at: item.archived_at,
        },
        { isSport: item.table === "activities" },
      );

      const isPermanent = isItemPermanent({
        ends_at: item.ends_at,
        end_date: item.end_date,
        expires_at: item.expires_at,
        review_date: item.review_date,
        status: item.status,
        archived_at: item.archived_at,
      });

      const effectiveEnds = getEffectiveEndsAt({
        ends_at: item.ends_at,
        end_date: item.end_date,
        expires_at: item.expires_at,
        review_date: item.review_date,
      });

      const badgeInfo = getStatusBadgeInfo(computedStatus);

      // Check if expiring within 7 days
      let isExpiringSoon = false;
      if (effectiveEnds && (computedStatus === "active" || computedStatus === "upcoming")) {
        const diffDays = (effectiveEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 7) {
          isExpiringSoon = true;
        }
      }

      const isExpired = computedStatus === "completed" || computedStatus === "out_of_season";
      const isDeactivated =
        !item.is_active || computedStatus === "archived" || item.status === "archived";

      return {
        ...item,
        computedStatus,
        badgeInfo,
        isPermanent,
        effectiveEnds,
        isExpiringSoon,
        isExpired,
        isDeactivated,
      };
    });
  }, [rawItems]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const active = processedItems.filter(
      (i) => i.is_active && !i.isDeactivated && !i.isExpired,
    ).length;
    const permanent = processedItems.filter((i) => i.isPermanent && i.is_active).length;
    const withExpiration = processedItems.filter(
      (i) => Boolean(i.effectiveEnds) && i.is_active,
    ).length;
    const expiringSoon = processedItems.filter((i) => i.isExpiringSoon).length;
    const expired = processedItems.filter((i) => i.isExpired).length;
    const deactivated = processedItems.filter((i) => i.isDeactivated).length;

    return {
      total: processedItems.length,
      active,
      permanent,
      withExpiration,
      expiringSoon,
      expired,
      deactivated,
    };
  }, [processedItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return processedItems.filter((item) => {
      // Table / Module Filter
      if (tableFilter !== "all" && item.table !== tableFilter) return false;

      // Validity / Status Filter
      if (validityFilter === "active") {
        if (!item.is_active || item.isDeactivated || item.isExpired) return false;
      } else if (validityFilter === "permanent") {
        if (!item.isPermanent || !item.is_active) return false;
      } else if (validityFilter === "with_expiration") {
        if (!item.effectiveEnds || !item.is_active) return false;
      } else if (validityFilter === "expiring_soon") {
        if (!item.isExpiringSoon) return false;
      } else if (validityFilter === "expired") {
        if (!item.isExpired) return false;
      } else if (validityFilter === "deactivated") {
        if (!item.isDeactivated) return false;
      }

      // Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        if (
          !item.title.toLowerCase().includes(query) &&
          !item.typeLabel.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [processedItems, tableFilter, validityFilter, search]);

  // Mutation: Instant Active / Inactive Toggle
  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      item,
      targetActive,
    }: {
      item: AdminResourceItem;
      targetActive: boolean;
    }) => {
      const res = await toggleResourceActive(item.table, item.id, targetActive);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: (_, variables) => {
      if (variables.targetActive) {
        toast.success(`"${variables.item.title}" ha sido ACTIVADO y publicado.`);
      } else {
        toast.warning(`"${variables.item.title}" ha sido DESACTIVADO (archivado).`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin_lifecycle_all_resources"] });
    },
    onError: (err: Error) => {
      toast.error(`Error al cambiar estado: ${err.message}`);
    },
  });

  // Mutation: Make Permanent
  const makePermanentMutation = useMutation({
    mutationFn: async (item: AdminResourceItem) => {
      const res = await setResourceExpiration(item.table, item.id, {
        isPermanent: true,
        activateNow: true,
      });
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: (_, item) => {
      toast.success(`"${item.title}" ahora tiene vigencia PERMANENTE (sin fecha de vencimiento).`);
      queryClient.invalidateQueries({ queryKey: ["admin_lifecycle_all_resources"] });
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  // Mutation: Extend Expiration by Days
  const extendDaysMutation = useMutation({
    mutationFn: async ({ item, days }: { item: AdminResourceItem; days: number }) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const isoString = targetDate.toISOString();
      const datePart = isoString.slice(0, 10);

      const res = await setResourceExpiration(item.table, item.id, {
        isPermanent: false,
        expiresAtIso: isoString,
        endDateStr: datePart,
        endTimeStr: "23:59",
        reviewDateStr: datePart,
        activateNow: true,
      });
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: (_, variables) => {
      toast.success(`Vigencia de "${variables.item.title}" extendida por ${variables.days} días.`);
      queryClient.invalidateQueries({ queryKey: ["admin_lifecycle_all_resources"] });
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  // Mutation: Save Custom Expiration Date
  const saveCustomExpirationMutation = useMutation({
    mutationFn: async () => {
      if (!editingItem || !customDate) throw new Error("Selecciona una fecha válida.");
      const isoString = `${customDate}T${customTime.length === 5 ? customTime + ":00" : "23:59:00"}Z`;

      const res = await setResourceExpiration(editingItem.table, editingItem.id, {
        isPermanent: false,
        expiresAtIso: isoString,
        endDateStr: customDate,
        endTimeStr: customTime,
        reviewDateStr: customDate,
        activateNow: true,
      });
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      toast.success(`Fecha de vencimiento establecida exitosamente para "${editingItem?.title}".`);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ["admin_lifecycle_all_resources"] });
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  // Mutation: Batch Deactivate All Expired Resources
  const deactivateExpiredMutation = useMutation({
    mutationFn: async () => {
      return await deactivateAllExpiredResources();
    },
    onSuccess: (result) => {
      if (result.totalDeactivated > 0) {
        toast.success(
          `Se desactivaron y archivaron ${result.totalDeactivated} registro(s) con fecha vencida.`,
        );
      } else {
        toast.info("No hay registros vencidos pendientes de desactivar.");
      }
      queryClient.invalidateQueries({ queryKey: ["admin_lifecycle_all_resources"] });
    },
    onError: (err: Error) => {
      toast.error(`Error al desactivar vencidos: ${err.message}`);
    },
  });

  // Mutation: Batch Status Synchronization
  const syncStatusesMutation = useMutation({
    mutationFn: async () => {
      return await syncAndUpdateAllStatuses({ updateRemote: true });
    },
    onSuccess: (summary) => {
      setLastSyncSummary(summary);
      if (summary.totalUpdated > 0) {
        toast.success(
          `Sincronización completada: ${summary.totalUpdated} registro(s) actualizados en BD.`,
        );
      } else {
        toast.info(
          "Todos los registros ya se encuentran con su estado actualizado en la base de datos.",
        );
      }
      queryClient.invalidateQueries({ queryKey: ["admin_lifecycle_all_resources"] });
    },
    onError: (err: Error) => {
      toast.error(`Error en la sincronización: ${err.message}`);
    },
  });

  const handleCopySql = () => {
    navigator.clipboard.writeText(getDatabaseSqlDefinition());
    setCopiedSql(true);
    toast.success("Script SQL copiado al portapapeles.");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const openExpirationEditor = (item: AdminResourceItem) => {
    setEditingItem(item);
    const rawEnd = item.ends_at || item.expires_at || item.end_date;
    const d = item.effectiveEnds || (rawEnd ? new Date(rawEnd) : null);
    if (d && !isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      setCustomDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      setCustomTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 30);
      const pad = (n: number) => String(n).padStart(2, "0");
      setCustomDate(
        `${nextWeek.getFullYear()}-${pad(nextWeek.getMonth() + 1)}-${pad(nextWeek.getDate())}`,
      );
      setCustomTime("23:59");
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <CalendarClock className="size-4" />
            <span>Control de Vigencia y Vencimientos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            Control de Vigencia y Vencimientos
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Gestiona la activación, caducidad y permanencia de todos los recursos (eventos,
            deportes, anuncios, artículos, programas). Los elementos con vigencia vencida se
            desactivan automáticamente y se ocultan de las búsquedas públicas.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2.5 text-xs">
          <div className="rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs flex items-center gap-2">
            <Clock className="size-3.5 text-primary animate-pulse" />
            <div>
              <span className="text-muted-foreground">Hora oficial Des Moines: </span>
              <strong className="text-foreground font-mono">{currentTime}</strong>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => deactivateExpiredMutation.mutate()}
              disabled={deactivateExpiredMutation.isPending}
              variant="outline"
              className="min-h-9 text-xs gap-1.5 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold"
            >
              <XCircle
                className={`size-3.5 ${deactivateExpiredMutation.isPending ? "animate-spin" : ""}`}
              />
              Desactivar vencidos ahora
            </Button>
            <Button
              size="sm"
              onClick={() => syncStatusesMutation.mutate()}
              disabled={syncStatusesMutation.isPending}
              className="min-h-9 text-xs gap-1.5 bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90"
            >
              <Zap className={`size-3.5 ${syncStatusesMutation.isPending ? "animate-spin" : ""}`} />
              {syncStatusesMutation.isPending ? "Sincronizando..." : "Sincronizar estados BD"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSqlDialog(!showSqlDialog)}
              className="min-h-9 text-xs gap-1.5 border-border"
            >
              <Code2 className="size-3.5 text-primary" />
              SQL BD
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isLoading}
              className="min-h-9 text-xs gap-1"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* SQL Definition Drawer / Panel */}
      {showSqlDialog && (
        <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="size-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">
                Función y Disparador de Base de Datos PostgreSQL (Supabase)
              </h3>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopySql} className="text-xs gap-1.5">
              {copiedSql ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedSql ? "Copiado" : "Copiar SQL"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Este script SQL automatiza en PostgreSQL el cambio a <code>archived</code> cuando la
            fecha de vigencia vence en zona horaria <code>America/Chicago</code>.
          </p>
          <pre className="p-4 rounded-xl bg-muted/70 text-[11px] font-mono overflow-x-auto text-foreground max-h-64 border border-border">
            {getDatabaseSqlDefinition()}
          </pre>
        </div>
      )}

      {/* Sync Execution Summary Card */}
      {lastSyncSummary && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs text-foreground flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">
              Evaluación de estados completada a las {lastSyncSummary.desMoinesTime}
            </p>
            <p className="text-muted-foreground">
              Total evaluados: <strong>{lastSyncSummary.totalEvaluated}</strong> | Actualizados en
              BD: <strong>{lastSyncSummary.totalUpdated}</strong> (Eventos:{" "}
              {lastSyncSummary.eventsUpdated}, Avisos: {lastSyncSummary.announcementsUpdated},
              Deportes: {lastSyncSummary.activitiesUpdated}, Programas:{" "}
              {lastSyncSummary.programsUpdated}, Artículos: {lastSyncSummary.articlesUpdated})
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setValidityFilter("all")}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            validityFilter === "all"
              ? "border-primary bg-primary/5 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <p className="text-xs font-semibold text-muted-foreground">Total Recursos</p>
          <p className="text-2xl font-black text-foreground mt-1">{metrics.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setValidityFilter("active")}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            validityFilter === "active"
              ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Activos / Vigentes</p>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.active}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setValidityFilter("permanent")}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            validityFilter === "permanent"
              ? "border-indigo-500 bg-indigo-500/10 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Permanentes</p>
            <InfinityIcon className="size-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.permanent}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setValidityFilter("expiring_soon")}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            validityFilter === "expiring_soon"
              ? "border-amber-500 bg-amber-500/10 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Vencen en 7d</p>
            <AlertTriangle className="size-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {metrics.expiringSoon}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setValidityFilter("expired")}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            validityFilter === "expired"
              ? "border-rose-500 bg-rose-500/10 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Vencidos</p>
            <Clock className="size-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {metrics.expired}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setValidityFilter("deactivated")}
          className={`rounded-2xl border p-3.5 text-left transition-all ${
            validityFilter === "deactivated"
              ? "border-slate-500 bg-slate-500/10 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Desactivados</p>
            <Archive className="size-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1">
            {metrics.deactivated}
          </p>
        </button>
      </div>

      {/* Module Filters & Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-4">
        {/* Module selection tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-border text-xs font-semibold">
          {[
            { id: "all", label: "Todos los recursos", icon: SlidersHorizontal },
            { id: "events", label: "Eventos", icon: Calendar },
            { id: "activities", label: "Deportes y Juegos", icon: Trophy },
            { id: "announcements", label: "Avisos", icon: Bell },
            { id: "articles", label: "Artículos", icon: FileText },
            { id: "programs", label: "Programas", icon: GraduationCap },
            { id: "faqs", label: "Preguntas (FAQ)", icon: HelpCircle },
            { id: "contacts", label: "Contactos", icon: Phone },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = tableFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTableFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter selectors & search input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título o tipo de contenido..."
              className="pl-10 min-h-10 rounded-xl text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Validity Filter Selector */}
            <select
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value)}
              className="min-h-10 rounded-xl border border-input bg-background px-3 py-1 font-semibold text-foreground"
            >
              <option value="all">Todas las vigencias</option>
              <option value="active">🟢 Solo Activos y Vigentes</option>
              <option value="permanent">♾️ Vigentes Permanentemente</option>
              <option value="with_expiration">⏳ Con Fecha de Vencimiento</option>
              <option value="expiring_soon">⚠️ Próximos a Vencer (7 días)</option>
              <option value="expired">🛑 Vencidos (Finalizados)</option>
              <option value="deactivated">📦 Desactivados / Archivados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground space-y-2 bg-card/40">
            <CalendarClock className="size-10 mx-auto text-muted-foreground opacity-60" />
            <p className="font-bold text-foreground">No se encontraron elementos</p>
            <p className="text-xs">Prueba cambiando los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCurrentlyActive = item.is_active && !item.isDeactivated;

            return (
              <div
                key={`${item.table}-${item.id}`}
                className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
                  item.isDeactivated
                    ? "border-border bg-muted/40 opacity-75"
                    : item.isExpired
                      ? "border-rose-500/30 bg-rose-500/5"
                      : item.isExpiringSoon
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info & Badges */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Active / Inactive Badge */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide inline-flex items-center gap-1 ${
                          isCurrentlyActive
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        <Power className="size-3" />
                        {isCurrentlyActive ? "Activo" : "Desactivado"}
                      </span>

                      {/* Type Label */}
                      <span className="rounded-full bg-primary/10 text-primary font-bold text-[11px] px-2.5 py-0.5 uppercase tracking-wide">
                        {item.typeLabel}
                      </span>

                      {/* Expiration or Permanent Badge */}
                      {item.isPermanent ? (
                        <span className="rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-bold inline-flex items-center gap-1">
                          <InfinityIcon className="size-3" />
                          Vigente permanente
                        </span>
                      ) : item.effectiveEnds ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border inline-flex items-center gap-1 ${
                            item.isExpired
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
                              : item.isExpiringSoon
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                          }`}
                        >
                          <Clock className="size-3" />
                          {item.isExpired ? "Vencido el: " : "Vence el: "}
                          {formatDesMoinesDate(item.effectiveEnds)}
                        </span>
                      ) : null}

                      {item.isExpiringSoon && (
                        <span className="rounded-full bg-amber-500 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                          <AlertTriangle className="size-3" /> Vence pronto (7d)
                        </span>
                      )}

                      <span className="text-[11px] text-muted-foreground font-mono">
                        (Estado BD: {item.status})
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground truncate">{item.title}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {item.starts_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3 text-emerald-600" />
                          Inicia: <strong>{formatDesMoinesDateTime(item.starts_at)}</strong>
                        </span>
                      )}
                      {item.effectiveEnds && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3 text-amber-600" />
                          Vencimiento:{" "}
                          <strong>{formatDesMoinesDateTime(item.effectiveEnds)}</strong>
                        </span>
                      )}
                      {item.isPermanent && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                          <InfinityIcon className="size-3" /> Sin fecha de caducidad
                        </span>
                      )}
                      {item.updated_at && (
                        <span className="text-[11px] text-muted-foreground/80">
                          Actualizado: {formatDesMoinesDate(item.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Instant Activation / Deactivation Toggle */}
                    <Button
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          item,
                          targetActive: !isCurrentlyActive,
                        })
                      }
                      disabled={toggleActiveMutation.isPending}
                      variant={isCurrentlyActive ? "outline" : "default"}
                      className={`min-h-9 text-xs rounded-xl font-bold gap-1.5 ${
                        isCurrentlyActive
                          ? "border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      <Power className="size-3.5" />
                      {isCurrentlyActive ? "Desactivar" : "Activar"}
                    </Button>

                    {/* Make Permanent Button */}
                    {!item.isPermanent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => makePermanentMutation.mutate(item)}
                        disabled={makePermanentMutation.isPending}
                        className="min-h-9 text-xs rounded-xl border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 gap-1"
                        title="Elimina fecha de expiración para que esté vigente permanentemente"
                      >
                        <InfinityIcon className="size-3.5" />
                        Permanente
                      </Button>
                    )}

                    {/* Quick Extend Presets */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => extendDaysMutation.mutate({ item, days: 7 })}
                      disabled={extendDaysMutation.isPending}
                      className="min-h-9 text-xs rounded-xl border-border bg-background hover:bg-muted"
                      title="Extender o activar por 7 días a partir de hoy"
                    >
                      +7d
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => extendDaysMutation.mutate({ item, days: 30 })}
                      disabled={extendDaysMutation.isPending}
                      className="min-h-9 text-xs rounded-xl border-border bg-background hover:bg-muted"
                      title="Extender o activar por 30 días a partir de hoy"
                    >
                      +30d
                    </Button>

                    {/* Custom Expiration Date Picker Modal Trigger */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openExpirationEditor(item)}
                      className="min-h-9 text-xs rounded-xl border-border bg-background hover:bg-muted gap-1"
                    >
                      <CalendarPlus className="size-3.5 text-primary" />
                      Fijar fecha
                    </Button>

                    {/* Link to module edit */}
                    <a
                      href={item.directAdminLink}
                      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted"
                      title="Ir al módulo administrativo de este recurso"
                    >
                      Editar
                      <ArrowUpRight className="size-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Dialog to Set Custom Expiration Date */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CalendarPlus className="size-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Fijar Fecha de Vencimiento</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Recurso seleccionado:</span>
                <p className="font-bold text-foreground truncate">{editingItem.title}</p>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {editingItem.typeLabel}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Fecha de Vencimiento (Des Moines, IA):
                </label>
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="min-h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Hora de Vencimiento (Opcional):
                </label>
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="min-h-10 rounded-xl"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Cuando la fecha y hora seleccionada hayan pasado, el sistema cambiará
                automáticamente el estado a desactivado / archivado y no aparecerá en búsquedas
                públicas.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
                className="min-h-9 text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => saveCustomExpirationMutation.mutate()}
                disabled={saveCustomExpirationMutation.isPending || !customDate}
                className="min-h-9 text-xs rounded-xl bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90"
              >
                {saveCustomExpirationMutation.isPending ? "Guardando..." : "Guardar Vigencia"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
