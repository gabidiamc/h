import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/firebase";

function safeNext(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const next = safeNext(search["next"]);
    return next ? { next } : {};
  },
  head: () => ({
    meta: [
      { title: "Acceso del personal — DMPS Family Info" },
      {
        name: "description",
        content: "Acceso privado para el personal autorizado de Des Moines Public Schools.",
      },
      { property: "og:title", content: "Acceso del personal — DMPS Family Info" },
      { property: "og:description", content: "Solo personal autorizado." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function goAfterLogin() {
    const target = safeNext(next);
    if (target) {
      window.location.href = target;
      return;
    }
    void navigate({ to: "/admin", replace: true });
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        goAfterLogin();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, next]);

  const isConfigured = isSupabaseConfigured();

  async function onOAuthSignIn(provider: "apple" | "google" | "microsoft") {
    setError(null);
    if (provider === "google") {
      try {
        setLoading(true);
        await signInWithGoogle();
        goAfterLogin();
        return;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "No se pudo iniciar sesión con Google.";
        setError(message);
        setLoading(false);
        return;
      }
    }

    if (!isConfigured) {
      setError(
        "Supabase no está conectado todavía. Por favor configure las variables de entorno SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en Configuración.",
      );
      return;
    }
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "No se pudo iniciar sesión.");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    goAfterLogin();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isConfigured) {
      setError(
        "Supabase no está conectado todavía. Por favor agregue las variables SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY para habilitar el inicio de sesión del personal.",
      );
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim();

    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (err) {
        const msg = err.message || "";
        let userMsg = msg;
        if (msg.includes("Invalid login credentials")) {
          userMsg = "Correo o contraseña incorrectos. Verifique sus datos.";
        }
        setError(userMsg);
        setLoading(false);
        return;
      }

      setLoading(false);
      goAfterLogin();
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
          <Lock className="size-4" aria-hidden="true" />
          Área privada del personal
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-foreground">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Acceso para el personal autorizado de DMPS. Las familias no necesitan cuenta: toda la
          información es pública.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <Button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full rounded-xl text-base font-semibold shadow-xs"
          >
            {loading ? "Iniciando sesión…" : "Entrar"}
          </Button>
        </form>

        <div className="relative my-6 text-center text-xs">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-muted-foreground font-medium">o continúe con</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void onOAuthSignIn("google")}
            className="w-full min-h-12 rounded-xl text-base font-semibold gap-2"
          >
            <svg viewBox="0 0 48 48" aria-hidden="true" className="size-4">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.4-4.5 7.1l7 5.4c4.1-3.8 6.4-9.4 6.4-17z"
              />
              <path
                fill="#FBBC05"
                d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.2C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.2z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7-5.4c-2 1.3-4.6 2.1-8.9 2.1-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            Iniciar sesión con Google
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void onOAuthSignIn("apple")}
            className="w-full min-h-12 rounded-xl text-base font-semibold gap-2"
          >
            <svg viewBox="0 0 384 512" aria-hidden="true" className="size-4 fill-current">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            Iniciar sesión con Apple
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void onOAuthSignIn("microsoft")}
            className="w-full min-h-12 rounded-xl text-base font-semibold gap-2"
          >
            <svg viewBox="0 0 23 23" aria-hidden="true" className="size-4">
              <path fill="#F25022" d="M1 1h10v10H1z" />
              <path fill="#7FBA00" d="M12 1h10v10H12z" />
              <path fill="#00A4EF" d="M1 12h10v10H1z" />
              <path fill="#FFB900" d="M12 12h10v10H12z" />
            </svg>
            Iniciar sesión con Microsoft
          </Button>
        </div>

        <div className="relative my-6 text-center text-xs">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              ¿No tiene una cuenta?
            </span>
          </div>
        </div>

        {/* ÚNICO BOTÓN PARA CREAR CUENTA */}
        <Button
          asChild
          variant="outline"
          className="w-full min-h-11 rounded-xl text-base font-semibold border-primary/30 hover:bg-primary/5 hover:text-primary gap-2"
        >
          <Link to="/admin/registro">
            <UserPlus className="size-4 shrink-0" />
            <span>Crear una cuenta</span>
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
