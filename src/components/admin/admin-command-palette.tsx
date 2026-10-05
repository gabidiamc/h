import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  BarChart3,
  BookOpen,
  Megaphone,
  Calendar,
  Trophy,
  FolderTree,
  School,
  GraduationCap,
  Phone,
  Users,
  Inbox,
  Sparkles,
  ArrowRight,
  Plus,
  CalendarClock,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Languages,
  Activity,
  Layers,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/lib/school";
import { getCachedCategories } from "@/lib/categories-service";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  categoryLabel: string;
  icon: React.ElementType;
  href: string;
  schoolId?: string | null;
  status?: string;
}

export function AdminCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const { adminSchoolFilter } = useSchool();

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Debounced search query across database
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim().toLowerCase();
        const searchResults: SearchResultItem[] = [];

        // 1. Search Articles
        const { data: articles } = await supabase
          .from("articles")
          .select("id, title, slug, status, school_id, summary")
          .or(`title.ilike.%${q}%,summary.ilike.%${q}%,slug.ilike.%${q}%`)
          .limit(6);

        if (articles) {
          articles.forEach((a) => {
            searchResults.push({
              id: `art-${a.id}`,
              title: a.title,
              subtitle: a.summary || `Slug: ${a.slug}`,
              category: "articles",
              categoryLabel: "Artículos y Recursos",
              icon: BookOpen,
              href: `/admin/articulos`,
              schoolId: a.school_id,
              status: a.status,
            });
          });
        }

        // 2. Search Announcements
        const { data: announcements } = await supabase
          .from("announcements")
          .select(
            `id, level, status, starts_at, announcement_translations ( title, message, language_code )`,
          )
          .limit(6);

        if (announcements) {
          announcements.forEach((an) => {
            const trans =
              (
                an.announcement_translations as Array<{
                  title: string;
                  message: string;
                  language_code: string;
                }>
              )?.find((tr) => tr.language_code === "es") ||
              (
                an.announcement_translations as Array<{
                  title: string;
                  message: string;
                  language_code: string;
                }>
              )?.[0];
            const title = trans?.title || "Aviso oficial";
            const message = trans?.message || "";
            if (
              title.toLowerCase().includes(q) ||
              message.toLowerCase().includes(q) ||
              an.level.toLowerCase().includes(q)
            ) {
              searchResults.push({
                id: `ann-${an.id}`,
                title: title,
                subtitle: message.slice(0, 80) + (message.length > 80 ? "…" : ""),
                category: "announcements",
                categoryLabel: "Avisos",
                icon: Megaphone,
                href: `/admin/anuncios`,
                status: an.status,
              });
            }
          });
        }

        // 3. Search Events
        const { data: events } = await supabase
          .from("events")
          .select("id, title, starts_at, location, event_type, status")
          .or(`title.ilike.%${q}%,location.ilike.%${q}%`)
          .limit(6);

        if (events) {
          events.forEach((ev) => {
            const startDate =
              (ev as { start_date?: string }).start_date ||
              (ev.starts_at ? String(ev.starts_at).slice(0, 10) : "");
            searchResults.push({
              id: `evt-${ev.id}`,
              title: ev.title,
              subtitle: `${startDate || "Fecha por definir"} • ${ev.location || "DMPS"}`,
              category: "events",
              categoryLabel: "Calendario y Eventos",
              icon: Calendar,
              href: `/admin/calendario`,
              status: ev.status,
            });
          });
        }

        // 4. Search Activities & Sports
        const { data: activities } = await supabase
          .from("activities")
          .select("id, name, activity_type, season, school_id")
          .or(`name.ilike.%${q}%,activity_type.ilike.%${q}%`)
          .limit(6);

        if (activities) {
          activities.forEach((act) => {
            searchResults.push({
              id: `act-${act.id}`,
              title: act.name,
              subtitle: `${act.activity_type || "Actividad"} • Temporada: ${act.season || "Todo el año"}`,
              category: "activities",
              categoryLabel: "Deportes y Actividades",
              icon: Trophy,
              href: `/admin/actividades`,
              schoolId: act.school_id,
            });
          });
        }

        // 5. Search Categories
        const allCats = await getCachedCategories();
        const qLower = q.toLowerCase();
        const categories = allCats
          .filter(
            (cat) =>
              (cat.name && cat.name.toLowerCase().includes(qLower)) ||
              (cat.description && cat.description.toLowerCase().includes(qLower)) ||
              (cat.slug && cat.slug.toLowerCase().includes(qLower)),
          )
          .slice(0, 4);

        if (categories) {
          categories.forEach((cat) => {
            searchResults.push({
              id: `cat-${cat.id}`,
              title: cat.name,
              subtitle: cat.description || `Slug: ${cat.slug}`,
              category: "categories",
              categoryLabel: "Categorías",
              icon: FolderTree,
              href: `/admin/categorias`,
            });
          });
        }

        // 6. Search Schools
        const { data: schools } = await supabase
          .from("schools")
          .select("id, name, address, phone")
          .or(`name.ilike.%${q}%,address.ilike.%${q}%`)
          .limit(4);

        if (schools) {
          schools.forEach((sch) => {
            searchResults.push({
              id: `sch-${sch.id}`,
              title: sch.name,
              subtitle: `${sch.address || "Des Moines, IA"} • ${sch.phone || ""}`,
              category: "schools",
              categoryLabel: "Escuelas",
              icon: School,
              href: `/admin/escuelas`,
            });
          });
        }

        setResults(searchResults);
      } catch (err) {
        // silent error in search
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Quick Action shortcuts when search query is empty
  const defaultActions: SearchResultItem[] = useMemo(
    () => [
      {
        id: "qa-analytics",
        title: "Analítica y Métricas de DMPS Info (En Vivo)",
        subtitle: "Tráfico real, sesiones, búsquedas, contenido, escuelas y PWA desde Supabase",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: BarChart3,
        href: "/admin/analytics",
      },
      {
        id: "qa-new-article",
        title: "Crear nuevo artículo o recurso",
        subtitle: "Redactar información paso a paso con validaciones",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: Plus,
        href: "/admin/articulos",
      },
      {
        id: "qa-new-announcement",
        title: "Crear aviso urgente o importante",
        subtitle: "Publicar aviso en la portada con caducidad automática",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: Megaphone,
        href: "/admin/anuncios",
      },
      {
        id: "qa-calendar",
        title: "Gestionar calendario escolar",
        subtitle: "Ver eventos, días sin clases y sincronización oficial",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: Calendar,
        href: "/admin/calendario",
      },
      {
        id: "qa-lifecycle",
        title: "Revisar vigencia y fechas de caducidad",
        subtitle: "Control de contenidos activos, finalizados y archivados",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: CalendarClock,
        href: "/admin/vigencia",
      },
      {
        id: "qa-quality",
        title: "Bandeja de Calidad y Verificación",
        subtitle: "Revisar enlaces rotos, duplicados y traducciones",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: FileCheck2,
        href: "/admin/calidad",
      },
      {
        id: "qa-menu-nav",
        title: "Editar Menú y Navegación Pública",
        subtitle: "Personalizar títulos, orden, traducciones y visibilidad del menú público",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: Layers,
        href: "/admin/menu",
      },
      {
        id: "qa-requests",
        title: "Solicitudes y reportes de familias",
        subtitle: "Atender observaciones enviadas desde el sitio público",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: Inbox,
        href: "/admin/solicitudes",
      },
      {
        id: "qa-system",
        title: "Diagnóstico y estado del sistema",
        subtitle: "Verificar conexión de Supabase y salud técnica",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: Activity,
        href: "/admin?view=status",
      },
      {
        id: "qa-public-site",
        title: "Ver sitio público de familias",
        subtitle: "Abrir portal principal de DMPS Info",
        category: "actions",
        categoryLabel: "Acción Rápida",
        icon: ExternalLink,
        href: "/",
      },
    ],
    [],
  );

  // Group results by category
  const groupedResults = useMemo(() => {
    const items = query.trim() ? results : defaultActions;
    const groups: Record<string, SearchResultItem[]> = {};

    items.forEach((item) => {
      if (!groups[item.categoryLabel]) {
        groups[item.categoryLabel] = [];
      }
      groups[item.categoryLabel].push(item);
    });

    return groups;
  }, [query, results, defaultActions]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    window.location.href = href;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-border/80 bg-muted/20">
          <Search className="size-5 text-primary shrink-0 mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar artículos, avisos, eventos, escuelas, categorías, usuarios… (o escribe una acción)"
            className="h-14 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground/70"
            autoFocus
          />
          {loading && (
            <span className="text-xs font-semibold text-primary animate-pulse ml-2">Buscando…</span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {Object.keys(groupedResults).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">
                No se encontraron resultados para "{query}"
              </p>
              <p className="text-xs">
                Prueba buscando por título, escuela, tipo de evento o categoría.
              </p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([groupTitle, items]) => (
              <div key={groupTitle} className="space-y-1">
                <div className="px-3 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {groupTitle}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.href)}
                        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl hover:bg-primary-soft/80 dark:hover:bg-primary-soft/30 text-start transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            <IconComponent className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {item.title}
                              </span>
                              {item.status && (
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-muted border border-border text-muted-foreground shrink-0">
                                  {item.status === "published"
                                    ? "Publicado"
                                    : item.status === "draft"
                                      ? "Borrador"
                                      : item.status === "archived"
                                        ? "Archivado"
                                        : item.status}
                                </span>
                              )}
                              {item.schoolId && (
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-primary/10 text-primary uppercase shrink-0">
                                  {item.schoolId}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="size-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-t border-border/80 text-[11px] text-muted-foreground">
          <span>Consejo: Usa palabras clave, escuelas o tipos de contenido.</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">
              ESC
            </kbd>{" "}
            para cerrar
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
