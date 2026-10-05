import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin_/registro")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Crear cuenta del personal — DMPS Family Info" },
      {
        name: "description",
        content: "Formulario de registro para el personal de Des Moines Public Schools.",
      },
      { property: "og:title", content: "Crear cuenta del personal — DMPS Family Info" },
      { property: "og:description", content: "Solo personal de DMPS." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSignUp,
});

function AdminSignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    void navigate({ to: "/admin", replace: true });
  }, [navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!isConfigured) {
      setError(
        "Supabase no está conectado todavía. Por favor configure las variables de entorno SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en Configuración.",
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail) {
      setError("Por favor ingrese un correo electrónico válido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden. Verifíquelas e intente de nuevo.");
      return;
    }

    setLoading(true);

    try {
      // 1. Intentar registrar el usuario en Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName || cleanEmail,
          },
        },
      });

      if (signUpError) {
        const msg = signUpError.message || "";
        let userMsg = msg;
        if (msg.includes("already registered") || msg.includes("already exists")) {
          userMsg = "Este correo electrónico ya está registrado. Por favor inicie sesión.";
        } else if (msg.includes("Password should be at least")) {
          userMsg = "La contraseña debe tener al menos 6 caracteres.";
        }
        setError(userMsg);
        setLoading(false);
        return;
      }

      // 2. Intentar auto iniciar sesión si la sesión no inició automáticamente
      let userId = data.user?.id;

      if (!data.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInError) {
          const signInMsg = signInError.message || "";
          void signInMsg;
          setInfo("Cuenta creada exitosamente. Inicie sesión con su correo y contraseña.");
          setLoading(false);
          return;
        }
        userId = signInData.user?.id;
      }

      // 3. El rol administrativo debe ser asignado manualmente por un super_admin existente
      // No se permite autoasignación de roles privilegiados en el cliente.
      setLoading(false);
      setInfo(
        "Cuenta creada exitosamente. Un administrador debe asignarle su rol para acceder a las funciones editoriales.",
      );

      setLoading(false);
      void navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError(
        `No se pudo conectar con el servidor. Revise su conexión e intente de nuevo. (${(err as Error).message})`,
      );
      setLoading(false);
    }
  }

  return (
    <div className="hero-wash flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <SiteLogo />
      <div className="surface-card mt-8 w-full max-w-md p-6 sm:p-8 shadow-lg rounded-2xl border border-border/80">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
          <UserPlus className="size-4" aria-hidden="true" />
          Registro del personal
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-foreground">Crear cuenta</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Complete los campos a continuación para crear su cuenta de administración y acceder al
          panel.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nombre completo
            </Label>
            <Input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Ej. María García"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="min-h-11 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nombre@dmschools.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-11 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-medium">
              Repetir contraseña
            </Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Confirme su contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="min-h-11 rounded-xl text-base"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm font-medium text-destructive"
            >
              {error}
            </p>
          ) : null}

          {info ? (
            <p
              role="status"
              className="rounded-xl bg-primary-soft border border-primary/20 p-3 text-sm font-medium text-primary"
            >
              {info}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl text-base font-semibold shadow-xs"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </Button>
        </form>

        <div className="relative my-6 text-center text-xs">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              ¿Ya posee una cuenta?
            </span>
          </div>
        </div>

        {/* ÚNICO BOTÓN PARA IR A INICIAR SESIÓN */}
        <Button
          asChild
          variant="outline"
          className="w-full min-h-11 rounded-xl text-base font-semibold border-border hover:bg-muted/60 gap-2"
        >
          <Link to="/admin/login">
            <LogIn className="size-4 shrink-0 text-primary" />
            <span>Ya tengo cuenta: Iniciar sesión</span>
          </Link>
        </Button>

        <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            DMPS Family Info
          </span>
          <Link to="/" className="font-medium text-primary hover:underline underline-offset-4">
            Volver al sitio público
          </Link>
        </div>
      </div>
    </div>
  );
}
