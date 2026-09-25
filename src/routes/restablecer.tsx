import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/restablecer")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Restablecer contraseña — Hecho por Monse" },
      { name: "description", content: "Crea una nueva contraseña para tu cuenta." },
      { property: "og:title", content: "Restablecer contraseña — Hecho por Monse" },
      { property: "og:description", content: "Crea una nueva contraseña para tu cuenta." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const prepare = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const errorDescription =
        url.searchParams.get("error_description") || hash.get("error_description");

      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      } catch (_) {
        /* fall through to session check */
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        window.history.replaceState({}, "", "/restablecer");
        setStatus("ready");
      } else {
        setError(
          errorDescription ||
            "El enlace de restablecimiento no es válido o ya expiró. Solicita uno nuevo desde «¿Olvidaste tu contraseña?».",
        );
        setStatus("invalid");
      }
    };

    void prepare();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setStatus("done");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-100 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-100/60 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
            <Sparkles className="w-6 h-6 text-rose-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Nueva Contraseña</h1>
          <p className="text-xs text-stone-500 mt-1">
            Elige una contraseña nueva para tu cuenta de Hecho por Monse.
          </p>
        </div>

        {status === "checking" && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-stone-500">
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
            <span>Verificando tu enlace...</span>
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <Link
              to="/"
              className="block w-full py-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm font-bold text-center transition-colors"
            >
              Volver a la tienda
            </Link>
          </div>
        )}

        {status === "done" && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>¡Listo! Tu contraseña fue actualizada y ya iniciaste sesión con ella.</span>
            </div>
            <Link
              to="/cuenta"
              className="block w-full py-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm font-bold text-center transition-colors"
            >
              Ir a Mi Cuenta
            </Link>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-70 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              {isSaving ? "Guardando..." : "Guardar Nueva Contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
