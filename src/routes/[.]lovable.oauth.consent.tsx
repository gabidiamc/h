import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SiteLogo } from "@/components/site-logo";
import { supabase } from "@/integrations/supabase/client";

type OAuthDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search["authorization_id"] === "string" ? search["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Falta authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/admin/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-sm text-destructive">
        No se pudo cargar esta solicitud de autorización:{" "}
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "esta aplicación";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error: err } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("El servidor de autorización no devolvió una dirección de regreso.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="hero-wash flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <SiteLogo />
      <div className="surface-card mt-8 w-full max-w-md rounded-2xl border border-border/80 p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-extrabold text-foreground">
          Conectar {clientName} a su cuenta
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {clientName} podrá leer y modificar el contenido del sitio con sus mismos permisos del
          panel del personal.
        </p>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={busy}
            onClick={() => void decide(true)}
            className="min-h-11 flex-1 rounded-xl font-semibold"
          >
            {busy ? "Procesando…" : "Autorizar"}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void decide(false)}
            className="min-h-11 flex-1 rounded-xl font-semibold"
          >
            Rechazar
          </Button>
        </div>
      </div>
    </main>
  );
}
