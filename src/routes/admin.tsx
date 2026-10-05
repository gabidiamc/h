import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, ShieldAlert } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOutStaff, useAdminSession } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel administrativo — DMPS Family Info" },
      { name: "description", content: "Área privada para el personal autorizado de DMPS." },
      { property: "og:title", content: "Panel administrativo — DMPS Family Info" },
      { property: "og:description", content: "Área privada para el personal autorizado." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const session = useAdminSession();
  const navigate = useNavigate();
  const location = useLocation();

  if (
    location.pathname.startsWith("/admin/login") ||
    location.pathname.startsWith("/admin/registro")
  ) {
    return <Outlet />;
  }

  if (session.loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!session.userId) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-soft">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LogIn className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Autenticación requerida
          </h1>
          <p className="text-sm text-muted-foreground">
            Debes iniciar sesión con una cuenta autorizada en Supabase Auth para acceder al panel
            administrativo.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button onClick={() => navigate({ to: "/admin/login" })}>Iniciar sesión</Button>
            <Button variant="outline" asChild>
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session.role) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="max-w-md space-y-4 rounded-xl border border-destructive/30 bg-card p-6 text-center shadow-soft">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Acceso no autorizado
          </h1>
          <p className="text-sm text-muted-foreground">
            La cuenta <strong className="text-foreground">{session.email}</strong> no tiene un rol
            administrativo asignado en <code>public.user_roles</code>. Contacta a un administrador
            principal para solicitar acceso.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={async () => {
                await signOutStaff();
                void navigate({ to: "/admin/login" });
              }}
            >
              <LogOut className="mr-1.5 size-4" />
              Cerrar sesión
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">Ir al portal público</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminShell email={session.email ?? ""} role={session.role}>
      <Outlet />
    </AdminShell>
  );
}
