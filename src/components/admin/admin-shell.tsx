import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Bell,
  Briefcase,
  Bus,
  CalendarClock,
  CalendarDays,
  FolderTree,
  GraduationCap,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircleQuestion,
  Phone,
  RefreshCw,
  School,
  Sparkles,
  Link2,
  Globe,
  ShieldCheck,
  Smartphone,
  Trophy,
  Users,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  Activity,
  History,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ListTodo,
  Check,
  Share2,
  Headphones,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { SiteLogo } from "@/components/site-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRoleLabel, signOutStaff, type AppRole } from "@/lib/admin";
import { useSchool, type SchoolScope } from "@/lib/school";
import { applyChangesNow } from "@/lib/sync";
import { AdminCommandPalette } from "./admin-command-palette";

const ADMIN_SCHOOL_OPTIONS = [
  {
    id: "all",
    name: "Todas las escuelas (Distrito completo)",
    short: "Distrito completo",
    icon: "🌐",
  },
  { id: "lincoln", name: "Abraham Lincoln High School", short: "Lincoln High", icon: "🦁" },
  { id: "east", name: "Des Moines East High School", short: "East High", icon: "🌹" },
];

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "ia_creator_group",
    title: "Inteligencia Artificial",
    items: [
      {
        to: "/admin/creador-ia",
        label: "Creador con IA",
        icon: Sparkles,
        badge: "Nuevo ✨",
      },
    ],
  },
  {
    id: "contenido_publico",
    title: "Secciones del Menú Público (Editar Contenido)",
    items: [
      { to: "/admin/anuncios", label: "Inicio y Avisos", icon: Megaphone, badge: "Portada" },
      { to: "/admin/eventos", label: "Eventos", icon: CalendarDays, badge: "Nuevo" },
      { to: "/admin/calendario", label: "Calendario Escolar", icon: CalendarClock },
      { to: "/admin/articulos", label: "Artículos y Guías", icon: BookOpen },
      { to: "/admin/categorias", label: "Categorías de Temas", icon: FolderTree },
      { to: "/admin/programas", label: "Programas Académicos", icon: GraduationCap },
      {
        to: "/admin/programas-estudiantes",
        label: "Programas Estudiantes",
        icon: Users,
      },
      { to: "/admin/actividades", label: "Deportes y Actividades", icon: Trophy },
      { to: "/admin/recursos", label: "Recursos y Enlaces", icon: Globe },
      { to: "/admin/contactos", label: "Directorio y Contacto", icon: Phone },
      { to: "/admin/servicios", label: "Servicios y Portales", icon: Link2 },
      { to: "/admin/empleos", label: "Bolsa de Trabajo", icon: Briefcase, badge: "Público" },
      { to: "/admin/faq", label: "Preguntas Frecuentes", icon: HelpCircle, badge: "Público" },
      { to: "/admin/escuelas", label: "Escuelas y Sedes", icon: School },
      { to: "/admin/podcasts", label: "Podcast Studio", icon: Headphones, badge: "Estudio" },
      { to: "/admin/redes-sociales", label: "Redes Sociales", icon: Share2, badge: "Nuevo" },
      { to: "/admin/menu", label: "Estructura del Menú", icon: Menu, badge: "Editor" },
    ],
  },
  {
    id: "resumen",
    title: "Resumen y Métricas",
    items: [
      { to: "/admin", label: "Panel Principal", icon: LayoutDashboard, exact: true },
      {
        to: "/admin/analytics",
        label: "Analítica y Métricas",
        icon: BarChart3,
        badge: "En vivo",
      },
      { to: "/admin?view=pending", label: "Tareas Pendientes", icon: ListTodo },
      { to: "/admin?view=activity", label: "Actividad y Auditoría", icon: History },
      { to: "/admin?view=status", label: "Estado del Sistema", icon: Activity },
    ],
  },
  {
    id: "calidad",
    title: "Idiomas y Calidad",
    items: [
      { to: "/admin/traducciones", label: "Traducciones (ES, EN, KSW)", icon: FileCheck2 },
      { to: "/admin/vigencia", label: "Fechas y Vigencia", icon: CalendarClock },
      { to: "/admin/calidad", label: "Bandeja de Calidad", icon: FileCheck2 },
      { to: "/admin/solicitudes", label: "Solicitudes de Familias", icon: Inbox },
      { to: "/admin/ayuda-familias", label: "Ayuda para Familias", icon: MessageCircleQuestion },
    ],
  },
  {
    id: "sistema",
    title: "Sistema y Marca",
    items: [
      { to: "/admin/usuarios", label: "Usuarios y Permisos", icon: Users },
      {
        to: "/admin/dart/configuracion",
        label: "Artículo de la App",
        icon: Smartphone,
        badge: "Editable",
      },
      { to: "/admin/apariencia", label: "Identidad de DMPS INFO", icon: ImageIcon },
      { to: "/admin/emergentes", label: "Anuncios Flotantes", icon: Bell },
      { to: "/admin/reinicio", label: "Reinicio de Contenido", icon: ShieldAlert },
    ],
  },
];

export function AdminShell({
  children,
  email,
  role,
}: {
  children: ReactNode;
  email: string | null;
  role: AppRole | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { adminSchoolFilter, setAdminSchoolFilter, schools } = useSchool();
  const [applying, setApplying] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const adminSchoolOptions = [
    {
      id: "all",
      name: "Todas las escuelas (Distrito completo)",
      short: "Distrito completo",
      icon: "🌐",
    },
    ...schools.map((s) => ({
      id: s.id,
      name: s.name,
      short: s.short_name || s.name,
      icon: s.id === "lincoln" ? "🦁" : s.id === "east" ? "🌹" : "🏫",
    })),
  ];

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  async function applyChanges() {
    setApplying(true);
    try {
      await applyChangesNow(queryClient);
      toast.success("Cambios sincronizados correctamente en el sitio público.");
    } catch {
      toast.error("No se pudieron aplicar los cambios. Intente de nuevo.");
    } finally {
      setApplying(false);
    }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOutStaff();
    void navigate({ to: "/admin/login", replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground lg:flex-row">
      {/* Global Command Palette (Ctrl+K) */}
      <AdminCommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-border bg-card shadow-2xl lg:static lg:z-auto lg:w-68 lg:shrink-0 lg:shadow-none transition-transform duration-300 ease-in-out ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/80 bg-card">
          <SiteLogo />
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* School Scope Selector in Sidebar */}
        <div className="p-3 border-b border-border/60 bg-muted/10">
          <label className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
            Escuela Activa:
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-foreground transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">
                    {adminSchoolOptions.find((s) => s.id === adminSchoolFilter)?.icon || "🏫"}
                  </span>
                  <span className="truncate">
                    {adminSchoolOptions.find((s) => s.id === adminSchoolFilter)?.short ||
                      "Todas las escuelas"}
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-primary shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 rounded-xl p-1.5 shadow-xl border-border bg-popover z-50"
            >
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1">
                Cambiar escuela activa
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {adminSchoolOptions.map((school) => {
                const isSelected = adminSchoolFilter === school.id;
                return (
                  <DropdownMenuItem
                    key={school.id}
                    onClick={() => {
                      setAdminSchoolFilter(school.id);
                      void queryClient.invalidateQueries();
                      toast.info(`Cambiando administración a: ${school.short}`);
                    }}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{school.icon}</span>
                      <span className="truncate">{school.name}</span>
                    </div>
                    {isSelected && <Check className="size-3.5 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Global Search Trigger inside Sidebar */}
        <div className="p-3 border-b border-border/60">
          <button
            type="button"
            onClick={() => {
              setMobileNavOpen(false);
              setCommandPaletteOpen(true);
            }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground font-medium transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="size-4 text-primary" />
              <span>Buscar en el panel…</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Nav Groups */}
        <nav aria-label="Menú Administrativo" className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_GROUPS.map((group) => {
            const isCollapsed = Boolean(collapsedGroups[group.id]);
            return (
              <div key={group.id} className="space-y-1">
                {/* Group Section Header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <span>{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="size-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3 text-muted-foreground" />
                  )}
                </button>

                {/* Items in Group */}
                {!isCollapsed && (
                  <ul className="space-y-0.5 pt-0.5">
                    {group.items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            activeOptions={{ exact: Boolean(item.exact) }}
                            onClick={() => setMobileNavOpen(false)}
                            className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted data-[status=active]:bg-primary-soft data-[status=active]:text-primary"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <IconComponent className="size-4 shrink-0" aria-hidden="true" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-white">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-border/80 bg-muted/20 space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate max-w-[170px]">{email}</p>
              <p className="text-[11px] font-semibold text-primary">{formatRoleLabel(role)}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Nav Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="size-5" />
            </button>

            {/* Quick Search Button in Header */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs text-muted-foreground font-medium transition-colors shadow-2xs cursor-pointer min-w-[220px]"
            >
              <Search className="size-3.5 text-primary" />
              <span>Buscar en el panel…</span>
              <kbd className="ml-auto px-1.5 py-0.2 rounded bg-muted border border-border text-[10px] font-mono">
                Ctrl+K
              </kbd>
            </button>

            {/* School Scope Switcher in Header */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer transition-all"
                >
                  <span className="text-base">
                    {adminSchoolOptions.find((s) => s.id === adminSchoolFilter)?.icon || "🏫"}
                  </span>
                  <div className="flex flex-col text-start">
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider leading-none">
                      Escuela Activa
                    </span>
                    <span className="text-xs font-bold text-foreground leading-tight">
                      {adminSchoolOptions.find((s) => s.id === adminSchoolFilter)?.short ||
                        "Todas las escuelas"}
                    </span>
                  </div>
                  <ChevronDown className="size-3.5 text-primary ml-1 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-68 rounded-xl p-1.5 shadow-xl border-border bg-popover z-50"
              >
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1">
                  Filtrar panel por escuela
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {adminSchoolOptions.map((school) => {
                  const isSelected = adminSchoolFilter === school.id;
                  return (
                    <DropdownMenuItem
                      key={school.id}
                      onClick={() => {
                        setAdminSchoolFilter(school.id);
                        void queryClient.invalidateQueries();
                        toast.info(`Cambiando administración a: ${school.short}`);
                      }}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{school.icon}</span>
                        <span className="truncate">{school.name}</span>
                      </div>
                      {isSelected && <Check className="size-3.5 shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <Button
              className="min-h-10 gap-1.5 rounded-xl text-xs font-bold shadow-soft"
              disabled={applying}
              onClick={() => void applyChanges()}
            >
              <RefreshCw
                className={`size-3.5 ${applying ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {applying ? "Sincronizando…" : "Sincronizar"}
              </span>
            </Button>

            <ThemeToggle />

            <Link
              to="/"
              className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted shadow-2xs"
            >
              <span>Ver sitio</span>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
