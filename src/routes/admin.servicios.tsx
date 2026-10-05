import { createFileRoute } from "@tanstack/react-router";
import {
  ExternalLink,
  HeartHandshake,
  Activity,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_SERVICE_URLS,
  isServiceUrlValid,
  useExternalServices,
  type ExternalServiceId,
} from "@/lib/external-services";

export const Route = createFileRoute("/admin/servicios")({
  component: AdminServiciosPage,
});

function AdminServiciosPage() {
  const { urls, updateServiceUrls } = useExternalServices();

  const [formUrls, setFormUrls] = useState<Record<ExternalServiceId, string>>({
    voluntarios: "",
    "bfl-status": "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormUrls({
      voluntarios: urls.voluntarios ?? DEFAULT_SERVICE_URLS.voluntarios,
      "bfl-status": urls["bfl-status"] ?? DEFAULT_SERVICE_URLS["bfl-status"],
    });
  }, [urls]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateServiceUrls(formUrls);
      toast.success("Enlaces a portales externos guardados correctamente");
    } catch (err: unknown) {
      toast.error(
        `Error al guardar los enlaces: ${err instanceof Error ? err.message : "Error desconocido"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormUrls({ ...DEFAULT_SERVICE_URLS });
    toast.info(
      "Valores restablecidos a las direcciones predeterminadas. Presione Guardar para aplicar.",
    );
  };

  const isVoluntariosValid = isServiceUrlValid(formUrls.voluntarios);
  const isBflValid = isServiceUrlValid(formUrls["bfl-status"]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
            <Globe className="size-4" />
            <span>Portales Externos y Enlaces</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Servicios DMPS Connect
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
            Configure las direcciones web de los portales externos independientes (Voluntarios y BFL
            Status). DMPS Info actuará como portal central para dirigir a las familias sin fusionar
            bases de datos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="min-h-11 rounded-xl font-semibold gap-2 border-border"
          >
            <RotateCcw className="size-4" />
            <span>Restablecer URLs</span>
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-11 rounded-xl font-bold bg-primary text-primary-foreground gap-2 shadow-sm"
          >
            <Save className="size-4" />
            <span>{saving ? "Guardando..." : "Guardar cambios"}</span>
          </Button>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm text-foreground/90 flex items-start gap-3.5">
        <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-foreground">Arquitectura Independiente y Segura</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Las aplicaciones externas (Voluntarios y BFL Status) conservan su propio servidor,
            seguridad y base de datos. Si deja un enlace vacío o escribe "disabled", en DMPS Info se
            mostrará automáticamente el mensaje
            <strong className="text-foreground"> "Servicio temporalmente no disponible"</strong> en
            lugar de abrir una página vacía.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Voluntarios */}
        <Card className="rounded-2xl border-border shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="grid size-10 place-items-center rounded-xl bg-rose-500/10 text-rose-600">
                  <HeartHandshake className="size-5" />
                </div>
                {isVoluntariosValid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="size-3" />
                    No disponible
                  </span>
                )}
              </div>
              <CardTitle className="text-xl font-bold mt-3">Portal de Voluntarios</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Texto en la app: "Encuentra oportunidades de voluntariado, consulta tus solicitudes,
                registra tus horas y revisa tu perfil."
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-voluntarios" className="text-xs font-bold text-foreground">
                  URL del Portal de Voluntarios
                </Label>
                <Input
                  id="url-voluntarios"
                  type="url"
                  placeholder="https://hub.familiasdmps.app"
                  value={formUrls.voluntarios}
                  onChange={(e) =>
                    setFormUrls((prev) => ({ ...prev, voluntarios: e.target.value }))
                  }
                  className="rounded-xl font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Debe iniciar con <code>https://</code> o <code>http://</code>.
                </p>
              </div>

              {isVoluntariosValid && (
                <div className="pt-2">
                  <a
                    href={formUrls.voluntarios}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Probar enlace en nueva pestaña</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormUrls((prev) => ({ ...prev, voluntarios: "" }))}
              className="w-full rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              Desactivar temporalmente
            </Button>
          </div>
        </Card>

        {/* Card 2: BFL Status */}
        <Card className="rounded-2xl border-border shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
                  <Activity className="size-5" />
                </div>
                {isBflValid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="size-3" />
                    No disponible
                  </span>
                )}
              </div>
              <CardTitle className="text-xl font-bold mt-3">BFL Status</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Texto en la app: "Sistema para consultar la disponibilidad del personal, administrar
                filas, asignar familias y acceder al kiosco durante eventos."
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-bfl" className="text-xs font-bold text-foreground">
                  URL del Sistema BFL Status
                </Label>
                <Input
                  id="url-bfl"
                  type="url"
                  placeholder="https://status.familiasdmps.app/"
                  value={formUrls["bfl-status"]}
                  onChange={(e) =>
                    setFormUrls((prev) => ({ ...prev, "bfl-status": e.target.value }))
                  }
                  className="rounded-xl font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Debe iniciar con <code>https://</code> o <code>http://</code>.
                </p>
              </div>

              {isBflValid && (
                <div className="pt-2">
                  <a
                    href={formUrls["bfl-status"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Probar enlace en nueva pestaña</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormUrls((prev) => ({ ...prev, "bfl-status": "" }))}
              className="w-full rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              Desactivar temporalmente
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
