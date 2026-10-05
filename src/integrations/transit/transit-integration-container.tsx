/**
 * TransitIntegrationContainer
 *
 * The structural and visual host for the DMPS Transit integrated module.
 *
 * ARCHITECTURAL RESPONSIBILITIES:
 * 1. Hosts the future DMPS Transit module directly inside DMPS Info.
 * 2. Maintains user experience 100% inside DMPS Info (no popup redirects, no secondary browser tabs).
 * 3. Never requires public users to log in, register, or possess a Transit account.
 * 4. Checks and manages connection states:
 *    - NOT_CONNECTED (Current preparation phase state)
 *    - CONNECTING
 *    - CONNECTED
 *    - UNAVAILABLE
 *    - ERROR
 * 5. In this preparation phase, smoothly renders the local DART resources as fallback
 *    without disrupting any existing functionality.
 */

import { useState, useEffect, type ReactNode } from "react";
import { Bus, Layers, ShieldCheck, AlertCircle, RefreshCw, Sparkles, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getTransitIntegrationStatus, subscribeTransitStatus } from "./transit-integration-state";
import type {
  TransitConnectionState,
  TransitIntegrationMetadata,
  TransitIntegrationContainerProps,
} from "./transit-integration-types";

export function TransitIntegrationContainer({
  schoolId = "all",
  schoolName = "Des Moines Public Schools",
  children,
  className = "",
  showPreparationBanner = false,
}: TransitIntegrationContainerProps) {
  const [status, setStatus] = useState<TransitIntegrationMetadata>(() =>
    getTransitIntegrationStatus(),
  );

  useEffect(() => {
    // Subscribe to connection lifecycle updates
    const unsubscribe = subscribeTransitStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const state: TransitConnectionState = status.state;

  return (
    <div
      id="transit-integration-container"
      className={`transit-integration-container w-full space-y-4 ${className}`}
      data-testid="transit-integration-container"
      data-state={state}
    >
      {/* Visual Header / Integration Readiness Chip */}
      {showPreparationBanner && (
        <Card className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-2xs">
          <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bus className="size-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground">
                    Módulo de Transporte Integrado
                  </span>
                  {state === "NOT_CONNECTED" && (
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/30 text-muted-foreground text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span className="size-2 rounded-full bg-slate-400 inline-block" />
                      DMPS Transit: En espera de vinculación
                    </Badge>
                  )}
                  {state === "CONNECTING" && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-600 bg-amber-500/10 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="size-2.5 animate-spin" />
                      Conectando con DMPS Transit...
                    </Badge>
                  )}
                  {state === "CONNECTED" && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                      DMPS Transit Conectado
                    </Badge>
                  )}
                  {state === "UNAVAILABLE" && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-600 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <AlertCircle className="size-2.5" />
                      Servicio no disponible temporalmente
                    </Badge>
                  )}
                  {state === "ERROR" && (
                    <Badge
                      variant="destructive"
                      className="text-[11px] font-semibold flex items-center gap-1"
                    >
                      <AlertCircle className="size-2.5" />
                      Error en enlace
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {schoolName} • Acceso público y directo para familias y estudiantes sin requerir
                  cuenta adicional.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium shrink-0">
              <ShieldCheck className="size-4 text-primary" />
              <span>Entorno Seguro DMPS Info</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STATE-DEPENDENT MODULE VIEW */}
      {state === "CONNECTED" ? (
        <div
          id="dmps-transit-embedded-slot"
          className="rounded-3xl border border-primary/30 bg-card p-6 shadow-sm"
          data-testid="dmps-transit-embedded-slot"
        >
          {/* Future DMPS Transit Module will mount here */}
          <div className="flex items-center gap-3 text-sm text-foreground font-semibold">
            <Radio className="size-5 text-emerald-500 animate-pulse" />
            <span>Módulo de DMPS Transit activo para {schoolName}</span>
          </div>
        </div>
      ) : (
        /* In NOT_CONNECTED or preparation phase, fallback to the existing rich DART tools without interruption */
        <div id="dmps-transit-fallback-content" className="w-full">
          {children}
        </div>
      )}
    </div>
  );
}
