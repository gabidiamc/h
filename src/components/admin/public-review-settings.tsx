/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { fetchHelpSettings } from "@/lib/help/data";
import { checkReviewUrl, REVIEW_KEYS, REVIEW_MESSAGES } from "@/lib/help/public-review";

const db = (name: string) => (supabase as any).from(name);

async function saveSetting(key: string, value: string) {
  const { error } = await db("help_settings").upsert(
    {
      id: `set-${key.toLowerCase().replace(/_/g, "-")}`,
      setting_key: key,
      setting_value: value,
      is_public: true,
    },
    { onConflict: "setting_key" },
  );
  if (error) {
    console.error("[HelpSettings] Error saving setting:", error);
    throw new Error(
      `Error en Supabase (help_settings): ${error.message}${error.code ? ` (${error.code})` : ""}`,
    );
  }
}

/** Staff controls for the voluntary public review (Trustpilot) button. */
export function PublicReviewSettings() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["help_settings"], queryFn: fetchHelpSettings });

  const [url, setUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    setUrl(settings.data[REVIEW_KEYS.url] ?? "");
    setEnabled((settings.data[REVIEW_KEYS.enabled] ?? "false") === "true");
    const stamp = settings.data[REVIEW_KEYS.verifiedAt] ?? "";
    setVerifiedAt(stamp);
    setConfirmed(Boolean(stamp));
  }, [settings.data]);

  const check = checkReviewUrl(url);
  const canEnable = check.ok && confirmed;

  async function save(nextEnabled: boolean) {
    if (nextEnabled && !canEnable) {
      toast.error(
        check.ok
          ? "Confirma primero que el enlace corresponde a Familiasdmps."
          : REVIEW_MESSAGES[(check as { problem: keyof typeof REVIEW_MESSAGES }).problem],
      );
      return;
    }
    setSaving(true);
    try {
      const stamp = confirmed ? new Date().toISOString() : "";
      await saveSetting(REVIEW_KEYS.provider, "trustpilot");
      await saveSetting(REVIEW_KEYS.url, check.ok ? check.url : "");
      await saveSetting(REVIEW_KEYS.verifiedAt, stamp);
      await saveSetting(REVIEW_KEYS.enabled, nextEnabled ? "true" : "false");
      setEnabled(nextEnabled);
      setVerifiedAt(stamp);
      await queryClient.invalidateQueries({ queryKey: ["help_settings"] });
      toast.success(nextEnabled ? "Reseñas públicas activadas." : "Cambios guardados.");
    } catch {
      toast.error("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-card space-y-4 p-5">
        <div>
          <h2 className="text-lg font-bold">Reseñas públicas</h2>
          <p className="text-sm text-muted-foreground">
            Solo un botón con un enlace verificado. No se usa la API de Trustpilot, ni AFS, ni
            correo, ni invitaciones automáticas. Nada de la valoración interna se envía a
            Trustpilot.
          </p>
        </div>

        <div className="grid gap-2 sm:max-w-xs">
          <Label>Proveedor</Label>
          <Input value="Trustpilot" readOnly aria-readonly="true" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="review-url">Enlace oficial para escribir una reseña</Label>
          <Input
            id="review-url"
            value={url}
            placeholder="https://www.trustpilot.com/evaluate/..."
            onChange={(e) => {
              setUrl(e.target.value);
              setConfirmed(false);
            }}
          />
          {url ? (
            check.ok ? (
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Enlace válido de Trustpilot (https).
              </p>
            ) : (
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-destructive">
                <ShieldAlert className="size-4" aria-hidden="true" />
                {REVIEW_MESSAGES[check.problem]}
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Pega el enlace tal como aparece en Trustpilot. Solo se aceptan direcciones https de
              trustpilot.com o www.trustpilot.com; no se acepta mailto:, http:// ni dominios
              parecidos.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11 rounded-xl"
            disabled={!check.ok}
            onClick={() => {
              if (check.ok) window.open(check.url, "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Abrir el enlace en una pestaña nueva
          </Button>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={confirmed}
            disabled={!check.ok}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            Abrí el enlace y confirmo manualmente que muestra el perfil de <b>Familiasdmps</b> y que
            permite comenzar una reseña.
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Switch
            id="review-enabled"
            checked={enabled}
            disabled={saving || (!enabled && !canEnable)}
            onCheckedChange={(value) => void save(value)}
          />
          <Label htmlFor="review-enabled" className="font-semibold">
            {enabled ? "Función activada" : "Función desactivada"}
          </Label>
          <Button
            className="min-h-11 rounded-xl font-bold"
            disabled={saving}
            onClick={() => void save(enabled)}
          >
            Guardar cambios
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Verificado el:{" "}
          {verifiedAt ? new Date(verifiedAt).toLocaleString("es-MX") : "todavía sin verificar"}
        </p>
      </section>

      <section className="surface-card space-y-3 p-5">
        <h3 className="font-bold">Vista previa del mensaje que verán las familias</h3>
        <div className="rounded-xl border border-border bg-secondary/50 p-4 text-sm">
          <p className="font-semibold">¡Gracias por ayudarnos a mejorar!</p>
          <p className="mt-1">
            Tu valoración se guardó en DMPS – Familias. Si quieres, también puedes compartir
            públicamente tu experiencia en Trustpilot.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              className="min-h-11 rounded-xl text-sm font-bold"
              disabled={!enabled || !check.ok}
              onClick={() => {
                if (!enabled) {
                  toast.error(REVIEW_MESSAGES.disabled);
                  return;
                }
                if (!check.ok) {
                  toast.error(REVIEW_MESSAGES[check.problem]);
                  return;
                }
                window.open(check.url, "_blank", "noopener,noreferrer");
              }}
            >
              Escribir una reseña en Trustpilot
            </Button>
            <Button variant="outline" className="min-h-11 rounded-xl text-sm" disabled>
              Ahora no
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Trustpilot se abrirá en una pestaña nueva. La reseña se escribirá y publicará
            directamente en su plataforma.
          </p>
          {!enabled ? (
            <p className="mt-3 text-xs font-semibold text-destructive">
              {REVIEW_MESSAGES.disabled}
            </p>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          El botón se muestra igual a todas las familias, con 1 o con 5 estrellas, y no se ofrece
          ningún premio ni beneficio por opinar.
        </p>
      </section>
    </div>
  );
}
