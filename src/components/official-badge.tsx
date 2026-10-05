import { ShieldCheck, ExternalLink, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type OfficialBadgeState =
  | "Actualizado"
  | "Última versión verificada"
  | "Actualización programada"
  | "Importado manualmente"
  | "Fuente temporalmente no disponible"
  | "Pendiente de revisión"
  | "Información no conectada"
  | "Tiempo real";

interface OfficialDataBadgeProps {
  sourceName: string;
  sourceUrl: string;
  state?: OfficialBadgeState;
  lastSuccessAt?: string | null;
  updateType?: string;
  className?: string;
}

export function OfficialDataBadge({
  sourceName,
  sourceUrl,
  state = "Última versión verificada",
  lastSuccessAt,
  updateType = "Comprobación periódica oficial",
  className = "",
}: OfficialDataBadgeProps) {
  const getStateBadge = (st: OfficialBadgeState) => {
    switch (st) {
      case "Tiempo real":
        return (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 font-bold">
            Tiempo real
          </Badge>
        );
      case "Actualizado":
        return (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 font-bold">
            Actualizado
          </Badge>
        );
      case "Actualización programada":
        return (
          <Badge className="bg-blue-600/15 text-blue-700 dark:text-blue-400 font-bold">
            Actualización programada
          </Badge>
        );
      case "Última versión verificada":
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 font-bold">
            Última versión verificada
          </Badge>
        );
      case "Importado manualmente":
        return (
          <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 font-bold">
            Importado manualmente
          </Badge>
        );
      case "Pendiente de revisión":
        return (
          <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 font-bold">
            Pendiente de revisión
          </Badge>
        );
      case "Fuente temporalmente no disponible":
        return (
          <Badge className="bg-destructive/15 text-destructive font-bold">
            Fuente temporalmente no disponible
          </Badge>
        );
      case "Información no conectada":
        return (
          <Badge className="bg-muted text-muted-foreground font-bold">
            Información no conectada
          </Badge>
        );
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  const formattedTime = lastSuccessAt
    ? new Date(lastSuccessAt).toLocaleString("es-US", {
        timeZone: "America/Chicago",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`rounded-2xl border border-border/80 bg-secondary/30 p-3.5 text-xs text-muted-foreground space-y-2 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          <span>
            Fuente oficial: <strong className="text-foreground">{sourceName}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {getStateBadge(state)}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline ml-1"
          >
            Ver enlace oficial
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground border-t border-border/40 pt-2">
        <span>
          Tipo de actualización: <strong className="text-foreground/90">{updateType}</strong>
        </span>
        {formattedTime ? (
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            Última sincronización exitosa:{" "}
            <strong className="text-foreground/90">{formattedTime} (Hora Central)</strong>
          </span>
        ) : (
          <span className="text-muted-foreground/80">Sin sincronización previa registrada</span>
        )}
      </div>

      {state === "Fuente temporalmente no disponible" && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>
            No fue posible conectar con la fuente oficial en el intento más reciente. Mostramos la
            última versión verificada en el sistema.
          </span>
        </div>
      )}
    </div>
  );
}
