/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  hasSupabaseRealtimeKey,
  isSupabaseConfigured,
  supabase,
} from "@/integrations/supabase/client";
import { invalidateCategoriesCache } from "./categories-service";

/** Tables that are replicated in real time to every device via Supabase Realtime. */
export const REALTIME_TABLES = [
  "articles",
  "article_translations",
  "article_tags",
  "article_relations",
  "tags",
  "categories",
  "category_translations",
  "announcements",
  "announcement_translations",
  "faqs",
  "faq_translations",
  "schools",
  "school_translations",
  "programs",
  "program_translations",
  "program_schools",
  "events",
  "event_translations",
  "contacts",
  "activities",
  "activity_translations",
  "appearance_settings",
  "site_settings",
  "social_media_channels",
  "social_media_posts",
  "resources",
  "dart_routes",
  "update_requests",
  "broken_link_reports",
  "podcasts",
  "podcast_episodes",
  "podcast_transcripts",
] as const;

import {
  cacheKey,
  safeSetItem,
  readFromUnifiedStorage,
  writeToUnifiedStorage,
  saveToUnifiedStorage,
  fetchTableFromStorage,
} from "./storage-engine";

export { cacheKey, safeSetItem, saveToUnifiedStorage, fetchTableFromStorage };

export function readCache<T = any>(table: string): T[] | null {
  return readFromUnifiedStorage<T>(table);
}

export function writeCache(table: string, rows: unknown) {
  writeToUnifiedStorage(table, rows);
}

let liveBroadcastChannel: RealtimeChannel | null = null;
let liveBroadcastSubscribed = false;
let crossTabChannel: BroadcastChannel | null = null;

function ensureBroadcastChannels() {
  if (typeof window === "undefined") return;
  if (!crossTabChannel && typeof BroadcastChannel !== "undefined") {
    try {
      crossTabChannel = new BroadcastChannel("dmps_cross_tab_sync");
    } catch {
      // ignore
    }
  }
  if (!liveBroadcastChannel && isSupabaseConfigured() && hasSupabaseRealtimeKey()) {
    try {
      liveBroadcastChannel = supabase.channel("dmps-live-broadcast", {
        config: { broadcast: { self: false } },
      });
      liveBroadcastChannel.subscribe((status) => {
        liveBroadcastSubscribed = status === "SUBSCRIBED";
      });
    } catch {
      // ignore
    }
  }
}

export function notifyContentUpdated(table?: string, options?: { fromRemote?: boolean }) {
  if (table === "categories" || table === "category_translations") {
    invalidateCategoriesCache();
  }
  if (typeof window === "undefined") return;
  ensureBroadcastChannels();

  window.dispatchEvent(
    new CustomEvent("dmps_content_updated", {
      detail: { table, fromRemote: Boolean(options?.fromRemote) },
    }),
  );

  if (!options?.fromRemote) {
    try {
      crossTabChannel?.postMessage({ table, ts: Date.now() });
    } catch {
      // ignore
    }
    try {
      if (liveBroadcastChannel && liveBroadcastSubscribed) {
        void liveBroadcastChannel.send({
          type: "broadcast",
          event: "content_updated",
          payload: { table, ts: Date.now() },
        });
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Subscribes to Supabase Realtime postgres_changes and Broadcast so any edit made in the
 * Owner / Admin Panel immediately invalidates TanStack Query and updates React UI
 * across every connected device without a manual page refresh.
 */
export function useRealtimeContentSync() {
  const queryClient = useQueryClient();

  // 1. In-browser local broadcast channel & custom event for zero-latency client reactivity
  useEffect(() => {
    let cancelled = false;
    ensureBroadcastChannels();

    const triggerInvalidations = (table?: string, fromRemote = false) => {
      if (cancelled) return;

      void queryClient.invalidateQueries();
      void queryClient.refetchQueries({ type: "active" });

      if (table) {
        void queryClient.invalidateQueries({ queryKey: [table] });
        void queryClient.invalidateQueries({ queryKey: ["admin", table] });
        if (table === "articles" || table === "article_translations") {
          void queryClient.invalidateQueries({ queryKey: ["articles"] });
          void queryClient.invalidateQueries({ queryKey: ["article"] });
          void queryClient.invalidateQueries({ queryKey: ["published-articles"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
          void queryClient.invalidateQueries({ queryKey: ["admin_articles_for_bottom_nav"] });
        }
        if (table === "contacts") {
          void queryClient.invalidateQueries({ queryKey: ["contacts"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "contacts"] });
        }
        if (table === "categories" || table === "category_translations") {
          invalidateCategoriesCache();
          void queryClient.invalidateQueries({ queryKey: ["categories"] });
          void queryClient.invalidateQueries({ queryKey: ["category"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
        }
        if (table === "announcements" || table === "announcement_translations") {
          void queryClient.invalidateQueries({ queryKey: ["announcements"] });
          void queryClient.invalidateQueries({ queryKey: ["announcements-all"] });
          void queryClient.invalidateQueries({ queryKey: ["popup-announcement"] });
          void queryClient.invalidateQueries({ queryKey: ["popup_announcement"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
        }
        if (table === "events" || table === "event_translations") {
          void queryClient.invalidateQueries({ queryKey: ["events"] });
          void queryClient.invalidateQueries({ queryKey: ["events-upcoming"] });
          void queryClient.invalidateQueries({ queryKey: ["events-page"] });
          void queryClient.invalidateQueries({ queryKey: ["public_calendar_events"] });
          void queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
        }
        if (table === "programs" || table === "program_translations") {
          void queryClient.invalidateQueries({ queryKey: ["programs"] });
          void queryClient.invalidateQueries({ queryKey: ["student-programs"] });
          void queryClient.invalidateQueries({ queryKey: ["student_programs"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
        }
        if (table === "activities" || table === "activity_translations") {
          void queryClient.invalidateQueries({ queryKey: ["activities"] });
          void queryClient.invalidateQueries({ queryKey: ["athletics"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "activities"] });
        }
        if (table === "schools" || table === "school_translations") {
          void queryClient.invalidateQueries({ queryKey: ["schools"] });
          void queryClient.invalidateQueries({ queryKey: ["school"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "schools"] });
        }
        if (table === "faqs" || table === "faq_translations") {
          void queryClient.invalidateQueries({ queryKey: ["faqs"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
        }
        if (table === "resources") {
          void queryClient.invalidateQueries({ queryKey: ["resources"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "resources"] });
        }
        if (
          table === "podcasts" ||
          table === "podcast_episodes" ||
          table === "podcast_transcripts"
        ) {
          void queryClient.invalidateQueries({ queryKey: ["podcasts"] });
          void queryClient.invalidateQueries({ queryKey: ["podcast_episodes"] });
          void queryClient.invalidateQueries({ queryKey: ["podcast_transcripts"] });
          void queryClient.invalidateQueries({ queryKey: ["podcast_analytics"] });
        }
        if (table === "social_media_channels" || table === "social_media_posts") {
          void queryClient.invalidateQueries({ queryKey: ["social_media_channels"] });
          void queryClient.invalidateQueries({ queryKey: ["social_media_posts"] });
          void queryClient.invalidateQueries({ queryKey: ["social-channels"] });
          void queryClient.invalidateQueries({ queryKey: ["social-posts"] });
        }
        if (table === "site_settings" || table === "appearance_settings") {
          void queryClient.invalidateQueries({ queryKey: ["site_settings"] });
          void queryClient.invalidateQueries({ queryKey: ["appearance_settings"] });
          void queryClient.invalidateQueries({ queryKey: ["appearance"] });
          void queryClient.invalidateQueries({ queryKey: ["popup_config"] });
          void queryClient.invalidateQueries({ queryKey: ["public_menu_items"] });
          if (fromRemote) {
            window.dispatchEvent(new CustomEvent("dmps_appearance_updated"));
            window.dispatchEvent(new CustomEvent("dmps_navigation_updated"));
            window.dispatchEvent(new CustomEvent("dmps-jobs-updated"));
            window.dispatchEvent(new CustomEvent("dmps-external-services-updated"));
            window.dispatchEvent(new CustomEvent("dmps-popup-updated"));
          }
        }
        if (table === "public_menu_items") {
          void queryClient.invalidateQueries({ queryKey: ["public_menu_items"] });
        }
      }
    };

    const handleLocalUpdate = (e: Event) => {
      if (cancelled) return;
      const custom = e as CustomEvent<{ table?: string; fromRemote?: boolean }>;
      triggerInvalidations(custom.detail?.table, Boolean(custom.detail?.fromRemote));
    };

    const handleCrossTab = (msg: MessageEvent) => {
      if (cancelled) return;
      const tbl = msg.data?.table as string | undefined;
      notifyContentUpdated(tbl, { fromRemote: true });
    };

    window.addEventListener("dmps_content_updated", handleLocalUpdate);
    crossTabChannel?.addEventListener("message", handleCrossTab);

    return () => {
      cancelled = true;
      window.removeEventListener("dmps_content_updated", handleLocalUpdate);
      crossTabChannel?.removeEventListener("message", handleCrossTab);
    };
  }, [queryClient]);

  // 2. Supabase postgres_changes & Broadcast real-time subscription (Single Source of Truth)
  useEffect(() => {
    if (!isSupabaseConfigured() || !hasSupabaseRealtimeKey()) return;
    let cancelled = false;

    const refresh = (table?: string) => {
      if (cancelled) return;
      notifyContentUpdated(table, { fromRemote: true });
    };

    const channel = supabase.channel("dmps-content-sync");
    for (const table of REALTIME_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => refresh(table));
    }
    channel.subscribe();

    ensureBroadcastChannels();
    liveBroadcastChannel?.on("broadcast", { event: "content_updated" }, (payload) => {
      const tbl = (payload?.payload as { table?: string } | undefined)?.table;
      refresh(tbl);
    });

    const onFocus = () => {
      if (!cancelled) {
        void queryClient.invalidateQueries();
        void queryClient.refetchQueries({ type: "active" });
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Invalida las queries de TanStack y notifica a las vistas para refrescar datos desde Supabase.
 */
export async function applyChangesNow(queryClient: {
  invalidateQueries: () => Promise<void> | void;
  refetchQueries: () => Promise<void> | void;
}) {
  await queryClient.invalidateQueries();
  await queryClient.refetchQueries();
  if (typeof window !== "undefined") {
    notifyContentUpdated();
    window.dispatchEvent(new Event("dmps_appearance_updated"));
  }
}
