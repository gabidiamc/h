import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit, upsertRow } from "./admin";
import { getCachedSiteSetting, invalidateSiteSettingCache } from "./site-settings-service";

export type ExternalServiceId = "voluntarios" | "bfl-status";

export type ExternalServiceConfig = {
  id: ExternalServiceId;
  nameKey: string;
  nameFallback: string;
  descKey: string;
  descFallback: string;
  buttonKey: string;
  buttonFallback: string;
  url: string;
  defaultUrl: string;
  settingField: "volunteer_portal_url" | "bfl_status_url";
  badgeText: string;
  features: string[];
};

export const DEFAULT_SERVICE_URLS: Record<ExternalServiceId, string> = {
  voluntarios: "https://hub.familiasdmps.app",
  "bfl-status": "https://status.familiasdmps.app/",
};

const STORAGE_KEY = "dmps_external_services_config";
const EVENT_NAME = "dmps_external_services_updated";

export const EXTERNAL_SERVICES: Record<ExternalServiceId, Omit<ExternalServiceConfig, "url">> = {
  voluntarios: {
    id: "voluntarios",
    nameKey: "services.voluntarios.title",
    nameFallback: "Voluntarios",
    descKey: "services.voluntarios.desc",
    descFallback:
      "Encuentra oportunidades de voluntariado, consulta tus solicitudes, registra tus horas y revisa tu perfil.",
    buttonKey: "services.voluntarios.button",
    buttonFallback: "Abrir Portal de Voluntarios",
    defaultUrl: DEFAULT_SERVICE_URLS["voluntarios"],
    settingField: "volunteer_portal_url",
    badgeText: "DMPS Hub",
    features: [
      "Oportunidades de voluntariado en escuelas y programas",
      "Consulta y seguimiento de solicitudes",
      "Registro de horas comunitarias",
      "Gestión de perfil y disponibilidad",
    ],
  },
  "bfl-status": {
    id: "bfl-status",
    nameKey: "services.bfl.title",
    nameFallback: "BFL Status",
    descKey: "services.bfl.desc",
    descFallback:
      "Sistema para consultar la disponibilidad del personal, administrar filas, asignar familias y acceder al kiosco durante eventos.",
    buttonKey: "services.bfl.button",
    buttonFallback: "Abrir BFL Status",
    defaultUrl: DEFAULT_SERVICE_URLS["bfl-status"],
    settingField: "bfl_status_url",
    badgeText: "BFL Status",
    features: [
      "Disponibilidad en tiempo real del personal de apoyo bilingüe",
      "Administración y turnos de filas para familias",
      "Asignación directa en eventos y ferias comunitarias",
      "Acceso directo a modo kiosco de atención",
    ],
  },
};

let memoryServiceUrls: Record<ExternalServiceId, string> = { ...DEFAULT_SERVICE_URLS };

export function getStoredServiceUrls(): Record<ExternalServiceId, string> {
  return { ...memoryServiceUrls };
}

export function isServiceUrlValid(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "#" || trimmed.toLowerCase() === "disabled") return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function useExternalServices() {
  const [urls, setUrls] = useState<Record<ExternalServiceId, string>>(getStoredServiceUrls);

  const reloadUrls = useCallback(() => {
    setUrls(getStoredServiceUrls());
  }, []);

  useEffect(() => {
    // Initial fetch from supabase site_settings
    let mounted = true;
    async function fetchRemote() {
      try {
        const val = await getCachedSiteSetting<Record<string, string>>(
          "external_services",
          DEFAULT_SERVICE_URLS,
        );

        if (val && mounted) {
          const updated = {
            voluntarios:
              val.voluntarios !== undefined ? val.voluntarios : DEFAULT_SERVICE_URLS.voluntarios,
            "bfl-status":
              val["bfl-status"] !== undefined
                ? val["bfl-status"]
                : DEFAULT_SERVICE_URLS["bfl-status"],
          };
          memoryServiceUrls = updated;
          setUrls(updated);
        }
      } catch {
        // ignore
      }
    }

    void fetchRemote();

    const handleUpdate = () => reloadUrls();
    window.addEventListener(EVENT_NAME, handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener(EVENT_NAME, handleUpdate);
    };
  }, [reloadUrls]);

  const updateServiceUrls = async (newUrls: Record<ExternalServiceId, string>) => {
    // Persist to supabase site_settings as single source of truth
    await upsertRow("site_settings", {
      key: "external_services",
      value: newUrls,
    });

    invalidateSiteSettingCache("external_services");
    memoryServiceUrls = { ...newUrls };
    setUrls(newUrls);
    window.dispatchEvent(new Event(EVENT_NAME));

    await logAudit(
      "update",
      "site_settings",
      "external_services",
      "Actualización de enlaces externos a portales (Voluntarios y BFL Status)",
    );
  };

  const getServiceConfig = (id: ExternalServiceId): ExternalServiceConfig => {
    const base = EXTERNAL_SERVICES[id];
    const url = urls[id] ?? base.defaultUrl;
    return {
      ...base,
      url,
    };
  };

  return {
    urls,
    getServiceConfig,
    isAvailable: (id: ExternalServiceId) => isServiceUrlValid(urls[id]),
    updateServiceUrls,
  };
}
