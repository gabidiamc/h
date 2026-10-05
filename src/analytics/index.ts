import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { isExcludedAdminPath, sanitizePath } from "./device";
import { initAnalyticsTracker, trackPageView } from "./tracker";

export * from "./types";
export * from "./device";
export * from "./session";
export * from "./pageViews";
export * from "./events";
export * from "./presence";
export * from "./searches";
export * from "./pwa";
export * from "./tracker";
export * from "./dashboard-queries";
export * from "./intelligence-queries";
export * from "./report-types";
export * from "./report-export";
export * from "./report-queries";

/**
 * Central React mount point for the DMPS INFO Real Analytics Tracker.
 * Initializes the tracker once and records route transitions across TanStack Router.
 */
export function DmpsAnalyticsObserver() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const cleanInitial = sanitizePath(window.location.pathname);
    if (!isExcludedAdminPath(cleanInitial)) {
      lastTrackedPathRef.current = cleanInitial;
    }
    void initAnalyticsTracker();
  }, []);

  useEffect(() => {
    const cleanPath = sanitizePath(pathname);
    if (isExcludedAdminPath(cleanPath)) return;

    if (lastTrackedPathRef.current === cleanPath) {
      return;
    }

    lastTrackedPathRef.current = cleanPath;

    // Defer slightly so document.title updates after route head resolution
    const timer = window.setTimeout(() => {
      void trackPageView({
        path: cleanPath,
        title: typeof document !== "undefined" ? document.title : null,
      });
    }, 60);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
