import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { detectIsPwa, getDeviceContext, isExcludedAdminPath, sanitizePath } from "./device";
import { recordAnalyticsEvent } from "./events";
import { getCurrentSessionId, getOrCreateAnonymousId, isValidUuid } from "./session";
import type { AnalyticsConfig, PwaEventType } from "./types";

const PWA_LAUNCH_RECORDED_KEY = "dmps_analytics_pwa_launch_recorded";
let pwaListenersInstalled = false;
let memoryPwaLaunchRecorded = false;
let memoryPwaPromptRecorded = false;

export async function recordAnalyticsPwaEvent(
  eventType: PwaEventType,
  config: AnalyticsConfig | null,
  explicitAnonymousId?: string,
  explicitSessionId?: string | null,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;
  if (config && (!config.enabled || !config.track_pwa)) return null;
  if (isExcludedAdminPath(sanitizePath(window.location.pathname))) return null;

  const anonymousId = explicitAnonymousId || getOrCreateAnonymousId();
  const sessionId = explicitSessionId !== undefined ? explicitSessionId : getCurrentSessionId();

  if (!isValidUuid(anonymousId)) return null;

  const device = getDeviceContext(config);

  try {
    const { data, error } = await supabase.rpc("record_pwa_event", {
      p_anonymous_id: anonymousId,
      p_event_type: eventType,
      p_session_id: sessionId && isValidUuid(sessionId) ? sessionId : null,
      p_platform: device.platform || null,
      p_device_type: config?.track_device === false ? null : device.deviceType,
      p_browser: config?.track_browser === false ? null : device.browser,
      p_operating_system: config?.track_os === false ? null : device.operatingSystem,
    });

    if (sessionId && isValidUuid(sessionId)) {
      void recordAnalyticsEvent(anonymousId, sessionId, config, {
        eventName: eventType,
        eventCategory: "pwa",
        contentType: "pwa",
        contentId: eventType,
        metadata: {
          platform: device.platform,
          device_type: device.deviceType,
        },
      });
    }

    if (!error && data && isValidUuid(data)) {
      return data;
    }
  } catch {
    // Analytics must never interrupt the app
  }

  return null;
}

export function trackPwaLaunchIfStandalone(
  config: AnalyticsConfig | null,
  anonymousId: string,
  sessionId: string,
): void {
  if (typeof window === "undefined") return;
  if (config && (!config.enabled || !config.track_pwa)) return;
  if (!detectIsPwa()) return;

  if (memoryPwaLaunchRecorded) return;
  try {
    if (window.sessionStorage.getItem(PWA_LAUNCH_RECORDED_KEY) === sessionId) {
      memoryPwaLaunchRecorded = true;
      return;
    }
    window.sessionStorage.setItem(PWA_LAUNCH_RECORDED_KEY, sessionId);
  } catch {
    // ignore storage errors
  }

  memoryPwaLaunchRecorded = true;
  void recordAnalyticsPwaEvent("pwa_launch", config, anonymousId, sessionId);
}

export function installPwaAnalyticsListeners(getConfig: () => AnalyticsConfig | null): () => void {
  if (typeof window === "undefined" || pwaListenersInstalled) {
    return () => {};
  }

  pwaListenersInstalled = true;

  const handleBeforeInstallPrompt = () => {
    if (memoryPwaPromptRecorded) return;
    memoryPwaPromptRecorded = true;
    void recordAnalyticsPwaEvent("pwa_prompt_shown", getConfig());
  };

  const handleAppInstalled = () => {
    void recordAnalyticsPwaEvent("pwa_install", getConfig());
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.removeEventListener("appinstalled", handleAppInstalled);
    pwaListenersInstalled = false;
  };
}
