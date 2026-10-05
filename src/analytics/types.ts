import type { Json } from "@/integrations/supabase/types";

export interface AnalyticsConfig {
  id: string;
  enabled: boolean;
  retention_days: number;
  presence_timeout_seconds: number;
  track_page_views: boolean;
  track_searches: boolean;
  track_events: boolean;
  track_pwa: boolean;
  track_referrer: boolean;
  track_device: boolean;
  track_browser: boolean;
  track_os: boolean;
  track_language: boolean;
  track_country: boolean;
}

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export interface DeviceContext {
  deviceType: DeviceType;
  browser: string;
  operatingSystem: string;
  userAgent: string;
  language: string;
  country: string | null;
  referrer: string | null;
  isPwa: boolean;
  platform: string;
}

export type AnalyticsContentType =
  | "home"
  | "article"
  | "category"
  | "topics"
  | "search"
  | "faq"
  | "announcements"
  | "contact"
  | "apps"
  | "resource"
  | "programs"
  | "student_programs"
  | "activities"
  | "schools"
  | "calendar"
  | "transportation"
  | "volunteers"
  | "podcast"
  | "page";

export type AnalyticsEventName =
  | "session_start"
  | "session_end"
  | "page_exit"
  | "article_view"
  | "article_feedback"
  | "category_click"
  | "resource_click"
  | "program_click"
  | "activity_click"
  | "faq_open"
  | "school_select"
  | "announcement_click"
  | "contact_click"
  | "language_change"
  | "external_link_click"
  | "internal_link_click"
  | "search"
  | "search_no_results"
  | "search_result_click"
  | "pwa_install"
  | "pwa_launch"
  | "pwa_prompt_shown"
  | "podcast_play"
  | "podcast_pause"
  | "podcast_progress"
  | "podcast_complete"
  | "podcast_seek"
  | "podcast_transcript_click"
  | (string & {});

export type AnalyticsEventCategory =
  | "lifecycle"
  | "navigation"
  | "content"
  | "engagement"
  | "search"
  | "preference"
  | "directory"
  | "outbound"
  | "pwa"
  | (string & {});

export interface PageViewPayload {
  path: string;
  title?: string | null;
  contentType?: AnalyticsContentType | string | null;
  contentId?: string | null;
  schoolId?: string | null;
  language?: string | null;
}

export interface AnalyticsEventPayload {
  eventName: AnalyticsEventName;
  eventCategory?: AnalyticsEventCategory | null;
  path?: string | null;
  contentType?: string | null;
  contentId?: string | null;
  schoolId?: string | null;
  language?: string | null;
  metadata?: Record<string, Json | undefined>;
}

export interface SearchAnalyticsPayload {
  query: string;
  resultCount: number;
  language?: string | null;
  path?: string | null;
  schoolId?: string | null;
}

export type PwaEventType = "pwa_install" | "pwa_launch" | "pwa_prompt_shown";
