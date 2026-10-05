import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldInput } from "@/components/admin/field-input";
import { logAudit } from "@/lib/admin";
import {
  DEFAULT_POPUP,
  fetchPopupAnnouncement,
  savePopupAnnouncement,
  type PopupAnnouncement,
} from "@/lib/popup";
import { SITE_SETTINGS_QUERY_OPTIONS } from "@/lib/site-settings-service";

export const Route = createFileRoute("/admin/emergentes")({
  component: PopupAdminPage,
});

function PopupAdminPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["popup-announcement"],
    queryFn: () => fetchPopupAnnouncement(),
    ...SITE_SETTINGS_QUERY_OPTIONS,
  });
  const [form, setForm] = useState<PopupAnnouncement>(DEFAULT_POPUP);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function set<K extends keyof PopupAnnouncement>(key: K, value: PopupAnnouncement[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const saved = await savePopupAnnouncement(form);
      setForm(saved);
      queryClient.setQueryData(["popup-announcement"], saved);
      await queryClient.invalidateQueries({ queryKey: ["popup-announcement"] });
      void logAudit("update", "popup_announcement", "popup", form.title);
      toast.success("Anuncio flotante guardado. Ya se muestra en todo el sitio.");
    } catch (error) {
      toast.error(`No se pudo guardar: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">Anuncios flotantes</h1>
        <p className="text-muted-foreground">
          Aparece en el centro de la pantalla cada vez que alguien entra al sitio, con su imagen,
          colores y una “X” para cerrarlo.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-5">
          <label className="flex min-h-11 items-center gap-3 font-semibold">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
              className="size-5 rounded border-border text-primary"
            />
            Mostrar el anuncio flotante en el sitio
          </label>

          <div className="space-y-2">
            <Label htmlFor="popup-title">Título</Label>
            <Input
              id="popup-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ej. Inscripciones abiertas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="popup-message">Mensaje</Label>
            <Textarea
              id="popup-message"
              rows={5}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Escriba el mensaje que verán las familias."
            />
          </div>

          <FieldInput
            field={{
              name: "image_url",
              label: "Imagen (suba un archivo o pegue un enlace)",
              type: "image",
            }}
            value={form.image_url}
            onChange={(v) => set("image_url", (v as string) ?? null)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="popup-link">Enlace (opcional)</Label>
              <Input
                id="popup-link"
                value={form.link_url ?? ""}
                onChange={(e) => set("link_url", e.target.value || null)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="popup-link-label">Texto del botón</Label>
              <Input
                id="popup-link-label"
                value={form.link_label ?? ""}
                onChange={(e) => set("link_label", e.target.value || null)}
                placeholder="Más información"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ColorField
              label="Fondo"
              value={form.background_color}
              onChange={(v) => set("background_color", v)}
            />
            <ColorField
              label="Texto"
              value={form.text_color}
              onChange={(v) => set("text_color", v)}
            />
            <ColorField
              label="Color principal"
              value={form.accent_color}
              onChange={(v) => set("accent_color", v)}
            />
          </div>

          <Button onClick={() => void save()} disabled={saving} className="min-h-11 rounded-xl">
            {saving ? "Guardando…" : "Guardar y publicar"}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Vista previa
          </p>
          <div
            style={{ backgroundColor: form.background_color, color: form.text_color }}
            className="overflow-hidden rounded-3xl border border-border shadow-lg"
          >
            {form.image_url ? (
              <img src={form.image_url} alt="" className="max-h-64 w-full object-cover" />
            ) : null}
            <div className="space-y-3 p-6">
              <h2 className="text-2xl font-extrabold" style={{ color: form.accent_color }}>
                {form.title || "Título del anuncio"}
              </h2>
              <p className="whitespace-pre-line">{form.message || "Mensaje del anuncio."}</p>
              {form.link_url ? (
                <span
                  className="inline-flex min-h-11 items-center rounded-full px-5 font-bold text-white"
                  style={{ backgroundColor: form.accent_color }}
                >
                  {form.link_label || "Más información"}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-11 cursor-pointer rounded-lg border border-border bg-transparent"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </div>
  );
}
