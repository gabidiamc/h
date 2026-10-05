import type { AnalyticsConfig, DeviceContext, DeviceType } from "./types";

export function detectDeviceType(ua: string): DeviceType {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();

  if (
    /(ipad|tablet|playbook|silk)|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|surface/i.test(
      lower,
    )
  ) {
    return "tablet";
  }

  if (
    /mobile|iphone|ipod|android.*mobile|iemobile|wpdesktop|opera mini|blackberry|bb10|webos/i.test(
      lower,
    )
  ) {
    return "mobile";
  }

  return "desktop";
}

export function detectBrowser(ua: string): string {
  if (!ua) return "Unknown";
  if (/EdgA?\/|EdgiOS\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/SamsungBrowser\//i.test(ua)) return "Samsung Internet";
  if (/Firefox\/|FxiOS\//i.test(ua)) return "Firefox";
  if (/Chrome\/|CriOS\//i.test(ua) && !/Edg|OPR|SamsungBrowser/i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)) return "Safari";
  return "Other";
}

export function detectOperatingSystem(ua: string): string {
  if (!ua) return "Unknown";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Windows NT|Windows/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}

export function detectIsPwa(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const standaloneMedia =
      typeof window.matchMedia === "function" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches);

    const iosStandalone =
      typeof navigator !== "undefined" &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    const androidTwa =
      typeof document !== "undefined" &&
      typeof document.referrer === "string" &&
      document.referrer.startsWith("android-app://");

    return Boolean(standaloneMedia || iosStandalone || androidTwa);
  } catch {
    return false;
  }
}

export function sanitizeReferrer(rawReferrer?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const ref = rawReferrer ?? (typeof document !== "undefined" ? document.referrer : "");
  if (!ref || !ref.trim()) return null;

  try {
    const url = new URL(ref);
    if (url.origin === window.location.origin) {
      return null;
    }
    return `${url.origin}${url.pathname}`.slice(0, 512);
  } catch {
    return null;
  }
}

export function detectNonInvasiveCountry(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (
      tz.startsWith("America/Chicago") ||
      tz.startsWith("America/New_York") ||
      tz.startsWith("America/Denver") ||
      tz.startsWith("America/Los_Angeles") ||
      tz.startsWith("America/Phoenix") ||
      tz.startsWith("US/")
    ) {
      return "US";
    }
    const locale = navigator.language || "";
    const parts = locale.split(/[-_]/);
    if (parts.length >= 2 && parts[1] && parts[1].length === 2) {
      return parts[1].toUpperCase();
    }
    return null;
  } catch {
    return null;
  }
}

export function sanitizePath(rawPath?: string | null): string {
  if (!rawPath) {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  }
  try {
    const clean = rawPath.split("?")[0]?.split("#")[0]?.trim() || "/";
    return clean.startsWith("/") ? clean.slice(0, 512) : `/${clean}`.slice(0, 512);
  } catch {
    return "/";
  }
}

export function isExcludedAdminPath(path: string): boolean {
  const normalized = sanitizePath(path).toLowerCase();
  return (
    normalized === "/admin" ||
    normalized.startsWith("/admin/") ||
    normalized === "/auth" ||
    normalized.startsWith("/auth/")
  );
}

export function getAppLanguage(): string {
  if (typeof window === "undefined") return "es";
  try {
    const stored =
      window.localStorage.getItem("dmps_lang_v2") || window.localStorage.getItem("dmps_lang");
    if (stored && stored.trim()) return stored.trim().slice(0, 16);
  } catch {
    // ignore storage errors
  }
  if (typeof document !== "undefined" && document.documentElement.lang) {
    return document.documentElement.lang.slice(0, 16);
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.split("-")[0]?.slice(0, 16) || "es";
  }
  return "es";
}

export function getAppSchoolId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored =
      window.localStorage.getItem("dmps_selected_school") ||
      window.localStorage.getItem("dmps_selected_school_v2") ||
      window.localStorage.getItem("dmps_selected_school_v1");
    if (stored && stored.trim()) return stored.trim().slice(0, 64);
  } catch {
    // ignore storage errors
  }
  return null;
}

export function getDeviceContext(
  config?: AnalyticsConfig | null,
  explicitLang?: string | null,
): DeviceContext {
  if (typeof window === "undefined") {
    return {
      deviceType: "unknown",
      browser: "Unknown",
      operatingSystem: "Unknown",
      userAgent: "",
      language: explicitLang || "es",
      country: null,
      referrer: null,
      isPwa: false,
      platform: "web",
    };
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const rawDevice = detectDeviceType(ua);
  const rawBrowser = detectBrowser(ua);
  const rawOs = detectOperatingSystem(ua);
  const rawPwa = detectIsPwa();
  const rawLang = explicitLang || getAppLanguage();
  const rawCountry = detectNonInvasiveCountry();
  const rawReferrer = sanitizeReferrer();

  const trackDevice = config ? config.track_device : true;
  const trackBrowser = config ? config.track_browser : true;
  const trackOs = config ? config.track_os : true;
  const trackLanguage = config ? config.track_language : true;
  const trackCountry = config ? config.track_country : true;
  const trackReferrer = config ? config.track_referrer : true;
  const trackPwa = config ? config.track_pwa : true;

  return {
    deviceType: trackDevice ? rawDevice : "unknown",
    browser: trackBrowser ? rawBrowser : "Unknown",
    operatingSystem: trackOs ? rawOs : "Unknown",
    userAgent: ua.slice(0, 512),
    language: trackLanguage ? rawLang : "",
    country: trackCountry ? rawCountry : null,
    referrer: trackReferrer ? rawReferrer : null,
    isPwa: trackPwa ? rawPwa : false,
    platform: rawOs.toLowerCase(),
  };
}
