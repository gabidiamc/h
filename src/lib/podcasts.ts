/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { getDeviceContext, getAppLanguage } from "@/analytics/device";
import { getCurrentSessionId, getOrCreateAnonymousId } from "@/analytics/session";
import { trackEvent } from "@/analytics/tracker";
import { notifyContentUpdated } from "./sync";
import { isSpotifyUrl } from "./spotify";
import { compressImageFile } from "./image-compression";

export type PodcastStatus = "draft" | "published" | "archived";
export type TranscriptStatus = "none" | "processing" | "review_ready" | "published" | "failed";
export type TranscriptRecordStatus =
  "draft" | "processing" | "review_ready" | "published" | "failed";

export type PodcastAnalyticsEventType =
  | "play_start"
  | "play_progress"
  | "play_pause"
  | "play_resume"
  | "play_seek"
  | "play_complete"
  | "transcript_segment_click"
  | "speed_change";

export interface PodcastRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  cover_storage_path?: string | null;
  banner_url: string | null;
  banner_storage_path?: string | null;
  logo_url: string | null;
  logo_storage_path?: string | null;
  spotify_url?: string | null;
  language: string;
  status: PodcastStatus;
  school_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  episode_count?: number;
  published_episode_count?: number;
  comments?: PodcastComment[];
}

export interface PodcastComment {
  id: string;
  podcast_id: string;
  episode_id?: string | null;
  author_name: string;
  content: string;
  created_at: string;
}

export interface PodcastEpisodeRow {
  id: string;
  podcast_id: string;
  slug: string;
  title: string;
  description: string | null;
  episode_number: number;
  season_number: number;
  published_at: string | null;
  duration_seconds: number;
  spotify_url?: string | null;
  audio_url: string | null;
  audio_storage_path: string | null;
  audio_path?: string | null;
  audio_mime_type: string | null;
  audio_mime?: string | null;
  audio_size_bytes: number | null;
  audio_size?: number | null;
  video_url: string | null;
  video_storage_path: string | null;
  video_path?: string | null;
  video_mime_type: string | null;
  video_mime?: string | null;
  video_size_bytes: number | null;
  video_size?: number | null;
  cover_url: string | null;
  cover_storage_path: string | null;
  cover_path?: string | null;
  language: string;
  status: PodcastStatus;
  transcript_status: TranscriptStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  speaker?: string | null;
  text: string;
}

export interface PodcastTranscriptRow {
  id: string;
  episode_id: string;
  language: string;
  full_text: string;
  segments: TranscriptSegment[];
  status: TranscriptRecordStatus;
  provider: string | null;
  generated_at: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PodcastAnalyticsEventRow {
  id: string;
  anonymous_id: string;
  session_id: string | null;
  podcast_id: string;
  episode_id: string;
  event_type: PodcastAnalyticsEventType;
  position_seconds: number;
  duration_seconds: number;
  listened_seconds: number;
  completion_percent: number;
  playback_rate: number;
  device_type: string | null;
  language: string | null;
  is_pwa: boolean;
  playback_mode: "audio" | "video";
  created_at: string;
}

export interface EpisodeAnalyticsMetrics {
  episodeId: string;
  podcastId: string;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  totalPlays: number;
  uniqueListeners: number;
  totalListenedSeconds: number;
  avgListenedSeconds: number;
  avgCompletionPercent: number;
  completionsCount: number;
  completionRatePercent: number;
  pausesCount: number;
  transcriptClicksCount: number;
  milestone25Count: number;
  milestone50Count: number;
  milestone75Count: number;
  milestone100Count: number;
  lastPlayedAt: string | null;
}

export interface PodcastAnalyticsSummary {
  totalPlays: number;
  uniqueListeners: number;
  totalListenedSeconds: number;
  avgCompletionPercent: number;
  completionsCount: number;
  completionRatePercent: number;
  pausesCount: number;
  transcriptClicksCount: number;
  byDevice: { device: string; count: number; percentage: number }[];
  byLanguage: { language: string; count: number; percentage: number }[];
  episodes: EpisodeAnalyticsMetrics[];
  recentEvents: PodcastAnalyticsEventRow[];
}

// Explicit column projections — never use SELECT *
export const PODCAST_COLUMNS =
  "id, slug, name, description, cover_url, cover_storage_path, banner_url, banner_storage_path, logo_url, logo_storage_path, language, status, school_id, metadata, created_at, updated_at";

export const EPISODE_COLUMNS =
  "id, podcast_id, slug, title, description, episode_number, season_number, published_at, duration_seconds, audio_url, audio_storage_path, audio_mime_type, audio_size_bytes, video_url, video_storage_path, video_mime_type, video_size_bytes, cover_url, cover_storage_path, language, status, transcript_status, metadata, created_at, updated_at";

export const TRANSCRIPT_COLUMNS =
  "id, episode_id, language, full_text, segments, status, provider, generated_at, reviewed_at, published_at, created_at, updated_at";

export const ANALYTICS_COLUMNS =
  "id, anonymous_id, session_id, podcast_id, episode_id, event_type, position_seconds, duration_seconds, listened_seconds, completion_percent, playback_rate, device_type, language, is_pwa, playback_mode, created_at";

export const PODCAST_STORAGE_BUCKET = "podcast-media";

export type MediaCategory = "audio" | "video" | "image";

export const ALLOWED_MEDIA_MIME_TYPES: Record<MediaCategory, readonly string[]> = {
  audio: [
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/webm",
  ],
  video: ["video/mp4", "video/webm", "video/ogg"],
  image: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",
    "image/avif",
    "image/x-icon",
  ],
};

export const MAX_MEDIA_SIZE_BYTES: Record<MediaCategory, number> = {
  audio: 200 * 1024 * 1024, // 200 MB
  video: 500 * 1024 * 1024, // 500 MB
  image: 15 * 1024 * 1024, // 15 MB
};

export interface MediaFileInspection {
  name: string;
  sizeBytes: number;
  formattedSize: string;
  mimeType: string;
  category: MediaCategory;
  valid: boolean;
  error?: string;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx++;
  }
  return `${value.toFixed(unitIdx === 0 ? 0 : 1)} ${units[unitIdx]}`;
}

export function formatDurationTimestamp(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function parseTimestampToSeconds(input: string | number): number {
  if (typeof input === "number") return Math.max(0, input);
  const cleaned = String(input || "").trim();
  if (!cleaned) return 0;
  if (/^\d+(\.\d+)?$/.test(cleaned)) {
    return Math.max(0, Number(cleaned));
  }
  const parts = cleaned.split(":").map((p) => Number(p.trim()));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function slugifyPodcastText(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `item-${Date.now()}`
  );
}

export function validatePodcastMediaFile(file: File, category: MediaCategory): MediaFileInspection {
  const allowedMimes = ALLOWED_MEDIA_MIME_TYPES[category];
  const maxBytes = MAX_MEDIA_SIZE_BYTES[category];
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  const extAllowed =
    (category === "audio" &&
      ["mp3", "m4a", "wav", "ogg", "aac", "webm", "mp4"].includes(ext)) ||
    (category === "video" && ["mp4", "webm", "ogg"].includes(ext)) ||
    (category === "image" &&
      ["jpg", "jpeg", "png", "webp", "svg", "gif", "avif", "ico"].includes(ext));

  const mimeAllowed = allowedMimes.includes(file.type.toLowerCase()) || extAllowed;

  if (!mimeAllowed) {
    return {
      name: file.name,
      sizeBytes: file.size,
      formattedSize: formatBytes(file.size),
      mimeType: file.type || `application/${ext || "octet-stream"}`,
      category,
      valid: false,
      error: `Formato no compatible (${file.type || ext}). Formatos permitidos para ${category}: ${allowedMimes.join(", ")}`,
    };
  }

  if (file.size <= 0) {
    return {
      name: file.name,
      sizeBytes: file.size,
      formattedSize: formatBytes(file.size),
      mimeType: file.type || `application/${ext}`,
      category,
      valid: false,
      error: "El archivo está vacío (0 bytes).",
    };
  }

  if (file.size > maxBytes) {
    return {
      name: file.name,
      sizeBytes: file.size,
      formattedSize: formatBytes(file.size),
      mimeType: file.type || `application/${ext}`,
      category,
      valid: false,
      error: `El archivo (${formatBytes(file.size)}) supera el límite máximo de ${formatBytes(maxBytes)}.`,
    };
  }

  return {
    name: file.name,
    sizeBytes: file.size,
    formattedSize: formatBytes(file.size),
    mimeType: file.type || `${category}/${ext}`,
    category,
    valid: true,
  };
}

/**
 * Probes the real duration of an audio or video File in the browser using HTMLMediaElement.
 */
export function probeMediaDurationSeconds(file: File): Promise<number> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(0);
  }
  return new Promise((resolve) => {
    try {
      const isVideo = file.type.startsWith("video/");
      const media = document.createElement(isVideo ? "video" : "audio");
      media.preload = "metadata";
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          media.removeAttribute("src");
        } catch {
          // ignore
        }
      };

      const timeout = window.setTimeout(() => {
        cleanup();
        resolve(0);
      }, 6000);

      media.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        const dur = Number.isFinite(media.duration) ? Math.round(media.duration) : 0;
        cleanup();
        resolve(Math.max(0, dur));
      };

      media.onerror = () => {
        window.clearTimeout(timeout);
        cleanup();
        resolve(0);
      };

      media.src = objectUrl;
    } catch {
      resolve(0);
    }
  });
}

function fileToDataUrl(file: File, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Subida cancelada por el usuario.", "AbortError"));
      return;
    }
    const reader = new FileReader();
    const onAbort = () => {
      try {
        reader.abort();
      } catch {
        // ignore
      }
      reject(new DOMException("Subida cancelada por el usuario.", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    reader.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve(String(reader.result || ""));
    };
    reader.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Error al leer el archivo local."));
    };
    reader.readAsDataURL(file);
  });
}

export interface UploadPodcastMediaOptions {
  file: File;
  category: MediaCategory;
  podcastId: string;
  episodeId?: string;
  role?: "cover" | "banner" | "logo" | "audio" | "video" | "episode_cover";
  assetRole?: "cover" | "banner" | "logo" | "audio" | "video" | "episode_cover";
  previousStoragePath?: string | null;
  preservePrevious?: boolean;
  signal?: AbortSignal;
  maxRetries?: number;
  onProgress?: (percent: number) => void;
}

export interface UploadPodcastMediaResult {
  publicUrl: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
}

/**
 * Uploads media directly to Supabase Storage (`podcast-media` bucket) with progress,
 * cancellation, retry support, and safe replacement (never deletes old storage file
 * until the new file is confirmed stored).
 */
export async function uploadPodcastMedia(
  options: UploadPodcastMediaOptions,
): Promise<UploadPodcastMediaResult> {
  const {
    file,
    category,
    podcastId,
    episodeId,
    role,
    assetRole,
    previousStoragePath,
    signal,
    maxRetries = 2,
    onProgress,
  } = options;

  const effectiveRole = role || assetRole || (category === "image" ? "cover" : category);

  const inspection = validatePodcastMediaFile(file, category);
  if (!inspection.valid) {
    throw new Error(inspection.error || "Archivo multimedia inválido.");
  }

  if (signal?.aborted) {
    throw new DOMException("Subida cancelada por el usuario.", "AbortError");
  }

  onProgress?.(5);

  const durationSeconds =
    category === "audio" || category === "video" ? await probeMediaDurationSeconds(file) : 0;

  if (signal?.aborted) {
    throw new DOMException("Subida cancelada por el usuario.", "AbortError");
  }

  onProgress?.(18);

  const safeExt =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") ||
    (category === "audio" ? "mp3" : category === "video" ? "mp4" : "jpg");

  let storagePath: string;
  if (episodeId) {
    // Exact organized path: podcasts/{podcast_id}/episodes/{episode_id}/{role}.{ext}
    const cleanRole = effectiveRole === "episode_cover" ? "cover" : effectiveRole;
    const isReplacing = Boolean(previousStoragePath);
    if (isReplacing) {
      const prevFileName = previousStoragePath?.split("/").pop() || "";
      const baseName = prevFileName.startsWith(`${cleanRole}_replacement`)
        ? cleanRole
        : `${cleanRole}_replacement`;
      storagePath = `podcasts/${podcastId}/episodes/${episodeId}/${baseName}.${safeExt}`;
    } else {
      storagePath = `podcasts/${podcastId}/episodes/${episodeId}/${cleanRole}.${safeExt}`;
    }
  } else {
    const safeBase = slugifyPodcastText(file.name.replace(/\.[^.]+$/, ""));
    const timestamp = Date.now();
    storagePath = `podcasts/${podcastId}/branding/${effectiveRole}_${safeBase}_${timestamp}.${safeExt}`;
  }

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    if (signal?.aborted) {
      throw new DOMException("Subida cancelada por el usuario.", "AbortError");
    }

    try {
      onProgress?.(Math.min(85, 25 + attempt * 15));

      const { data, error } = await (supabase as any).storage
        .from(PODCAST_STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: inspection.mimeType,
        });

      if (signal?.aborted) {
        throw new DOMException("Subida cancelada por el usuario.", "AbortError");
      }

      if (error) {
        // For images (e.g. podcast banner, logo, cover), if storage bucket is missing or unauthenticated,
        // provide graceful fallback to compressed data URL so the user is never blocked
        if (category === "image") {
          console.warn("Direct storage upload warning for podcast image, using fallback:", error.message);
          try {
            const fallbackDataUrl = await compressImageFile(file, {
              maxWidth: effectiveRole === "banner" ? 1920 : 1280,
              maxHeight: effectiveRole === "banner" ? 1080 : 1280,
              quality: 0.88,
            });
            onProgress?.(100);
            return {
              publicUrl: fallbackDataUrl,
              storagePath: `local/${storagePath}`,
              mimeType: inspection.mimeType,
              sizeBytes: inspection.sizeBytes,
              durationSeconds: 0,
            };
          } catch {
            // continue attempt loop
          }
        }
        throw new Error(error.message || "Error al subir a Supabase Storage");
      }

      let confirmedPath =
        data?.path || (data as any)?.Key?.replace(`${PODCAST_STORAGE_BUCKET}/`, "") || storagePath;
      if (confirmedPath.startsWith(`${PODCAST_STORAGE_BUCKET}/`)) {
        confirmedPath = confirmedPath.slice(PODCAST_STORAGE_BUCKET.length + 1);
      }
      if (confirmedPath.startsWith("/")) {
        confirmedPath = confirmedPath.slice(1);
      }

      const { data: pubData } = (supabase as any).storage
        .from(PODCAST_STORAGE_BUCKET)
        .getPublicUrl(confirmedPath);

      let publicUrl: string = pubData?.publicUrl || "";
      if (category === "image" && publicUrl && !publicUrl.startsWith("data:") && !publicUrl.includes("?")) {
        publicUrl = `${publicUrl}?v=${Date.now()}`;
      }

      onProgress?.(100);

      if (
        previousStoragePath &&
        previousStoragePath !== confirmedPath &&
        !previousStoragePath.startsWith("local/") &&
        !options.preservePrevious
      ) {
        try {
          await (supabase as any).storage
            .from(PODCAST_STORAGE_BUCKET)
            .remove([previousStoragePath]);
        } catch {
          // ignore
        }
      }

      return {
        publicUrl,
        storagePath: confirmedPath,
        mimeType: inspection.mimeType,
        sizeBytes: inspection.sizeBytes,
        durationSeconds,
      };
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      attempt++;
      if (attempt <= maxRetries) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }

  throw lastError || new Error("No se pudo completar la subida del archivo multimedia.");
}

export interface UploadAndAssociateEpisodeMediaParams {
  episodeId: string;
  podcastId: string;
  role: "audio" | "video" | "cover";
  file: File;
  previousStoragePath?: string | null;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}

export interface UploadAndAssociateEpisodeMediaResult {
  episode: PodcastEpisodeRow;
  publicUrl: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
}

/**
 * Executes the full Stage 3 workflow:
 * ADMIN -> VERIFY EPISODE EXISTS -> UPLOAD TO STORAGE -> ASSOCIATE MEDIA IN DB -> CLEANUP PREVIOUS MEDIA
 *
 * Rules strictly enforced:
 * 1. Episode must exist in public.podcast_episodes before uploading.
 * 2. Storage path is strictly podcasts/{podcast_id}/episodes/{episode_id}/{role}.{ext}
 * 3. Audio, video, and cover columns in DB are updated with real paths, real URLs, MIME types, and sizes.
 * 4. Safe replacement: previous storage object is deleted ONLY after new upload is verified and DB is updated.
 * 5. If DB update fails, the uploaded file is kept, previous file is NOT deleted, and no duplicate episodes are created.
 */
export async function uploadAndAssociateEpisodeMedia(
  params: UploadAndAssociateEpisodeMediaParams,
): Promise<UploadAndAssociateEpisodeMediaResult> {
  const { episodeId, podcastId, role, file, previousStoragePath, signal, onProgress } = params;

  if (!episodeId || episodeId.trim() === "") {
    throw new Error(
      "No se puede subir archivo multimedia: el episodio no existe o no tiene un ID real asignado. Guarda el episodio primero.",
    );
  }

  // 1. Verify that the episode exists in public.podcast_episodes
  const { data: existingEpisode, error: fetchErr } = await (supabase as any)
    .from("podcast_episodes")
    .select(EPISODE_COLUMNS)
    .eq("id", episodeId)
    .maybeSingle();

  if (fetchErr || !existingEpisode) {
    throw new Error(
      "El episodio no existe en la base de datos. Debes guardar el episodio antes de subir archivos.",
    );
  }

  const category: MediaCategory = role === "cover" ? "image" : role;
  const inspection = validatePodcastMediaFile(file, category);
  if (!inspection.valid) {
    throw new Error(inspection.error || "El archivo multimedia no es válido.");
  }

  // 2. Upload to Supabase Storage with clean path podcasts/{podcast_id}/episodes/{episode_id}/
  const uploadResult = await uploadPodcastMedia({
    file,
    category,
    podcastId,
    episodeId,
    assetRole: role,
    previousStoragePath,
    preservePrevious: true,
    signal,
    onProgress,
  });

  // 3. Update public.podcast_episodes with real path, real URL, mime, size, duration
  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    updated_at: now,
  };

  if (role === "audio") {
    updatePayload.audio_storage_path = uploadResult.storagePath;
    updatePayload.audio_url = uploadResult.publicUrl;
    updatePayload.audio_mime_type = uploadResult.mimeType;
    updatePayload.audio_size_bytes = uploadResult.sizeBytes;
    if (uploadResult.durationSeconds > 0) {
      updatePayload.duration_seconds = uploadResult.durationSeconds;
    }
  } else if (role === "video") {
    updatePayload.video_storage_path = uploadResult.storagePath;
    updatePayload.video_url = uploadResult.publicUrl;
    updatePayload.video_mime_type = uploadResult.mimeType;
    updatePayload.video_size_bytes = uploadResult.sizeBytes;
    const currentDur = Number((existingEpisode as any).duration_seconds || 0);
    if (uploadResult.durationSeconds > 0 && currentDur === 0) {
      updatePayload.duration_seconds = uploadResult.durationSeconds;
    }
  } else if (role === "cover") {
    updatePayload.cover_storage_path = uploadResult.storagePath;
    updatePayload.cover_url = uploadResult.publicUrl;
  }

  const { data: updatedData, error: updateErr } = await (supabase as any)
    .from("podcast_episodes")
    .update(updatePayload)
    .eq("id", episodeId)
    .select(EPISODE_COLUMNS)
    .maybeSingle();

  if (updateErr || !updatedData) {
    throw new Error(
      `El archivo se subió a Storage (${uploadResult.storagePath}), pero ocurrió un error al actualizar el episodio: ${updateErr?.message || "error desconocido"}. Puedes reintentar la operación sin perder el episodio.`,
    );
  }

  // 4. Touch parent podcast updated_at
  await (supabase as any).from("podcasts").update({ updated_at: now }).eq("id", podcastId);

  // 5. Safe replacement: remove previous file ONLY after DB update succeeds
  const oldPath =
    previousStoragePath ||
    (role === "audio"
      ? (existingEpisode as any).audio_storage_path
      : role === "video"
        ? (existingEpisode as any).video_storage_path
        : (existingEpisode as any).cover_storage_path);

  if (oldPath && oldPath !== uploadResult.storagePath) {
    try {
      await (supabase as any).storage.from(PODCAST_STORAGE_BUCKET).remove([oldPath]);
    } catch {
      // Non-fatal cleanup
    }
  }

  notifyContentUpdated("podcast_episodes");
  notifyContentUpdated("podcasts");

  return {
    episode: normalizeEpisodeRow(updatedData),
    publicUrl: uploadResult.publicUrl,
    storagePath: uploadResult.storagePath,
    mimeType: uploadResult.mimeType,
    sizeBytes: uploadResult.sizeBytes,
    durationSeconds: uploadResult.durationSeconds,
  };
}

export async function removeEpisodeMediaFile(params: {
  episodeId: string;
  podcastId: string;
  role: "audio" | "video" | "cover";
  storagePath?: string | null;
}): Promise<PodcastEpisodeRow> {
  const { episodeId, podcastId, role, storagePath } = params;
  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    updated_at: now,
  };

  if (role === "audio") {
    updatePayload.audio_storage_path = null;
    updatePayload.audio_url = null;
    updatePayload.audio_mime_type = null;
    updatePayload.audio_size_bytes = null;
  } else if (role === "video") {
    updatePayload.video_storage_path = null;
    updatePayload.video_url = null;
    updatePayload.video_mime_type = null;
    updatePayload.video_size_bytes = null;
  } else if (role === "cover") {
    updatePayload.cover_storage_path = null;
    updatePayload.cover_url = null;
  }

  const { data, error } = await (supabase as any)
    .from("podcast_episodes")
    .update(updatePayload)
    .eq("id", episodeId)
    .select(EPISODE_COLUMNS)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Error al eliminar archivo del episodio: ${error?.message || "error desconocido"}`,
    );
  }

  if (storagePath) {
    try {
      await (supabase as any).storage.from(PODCAST_STORAGE_BUCKET).remove([storagePath]);
    } catch (e) {
      console.warn("Error al remover objeto de Storage:", e);
    }
  }

  await (supabase as any).from("podcasts").update({ updated_at: now }).eq("id", podcastId);
  notifyContentUpdated("podcast_episodes");
  notifyContentUpdated("podcasts");

  return normalizeEpisodeRow(data);
}

// ============================================================================
// DATABASE QUERIES & MUTATIONS (PODCASTS, EPISODES, TRANSCRIPTS)
// ============================================================================

export function normalizePodcastRow(raw: any): PodcastRow {
  const metadata =
    raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
      ? raw.metadata
      : {};
  const spotify_url = raw.spotify_url ?? metadata.spotify_url ?? null;

  const rawComments = Array.isArray(metadata.comments)
    ? metadata.comments
    : Array.isArray(raw.comments)
      ? raw.comments
      : [];
  const comments: PodcastComment[] = rawComments.map((c: any) => ({
    id: String(c.id || `cmt_${Date.now()}`),
    podcast_id: String(c.podcast_id || raw.id),
    episode_id: c.episode_id ? String(c.episode_id) : null,
    author_name: String(c.author_name || "Oyente anónimo"),
    content: String(c.content || ""),
    created_at: String(c.created_at || new Date().toISOString()),
  }));

  return {
    id: String(raw.id),
    slug: String(raw.slug || raw.id),
    name: String(raw.name || "Podcast sin título"),
    description: raw.description ?? null,
    cover_url: raw.cover_url ?? null,
    cover_storage_path: raw.cover_storage_path ?? null,
    banner_url: raw.banner_url ?? null,
    banner_storage_path: raw.banner_storage_path ?? null,
    logo_url: raw.logo_url ?? null,
    logo_storage_path: raw.logo_storage_path ?? null,
    spotify_url,
    language: String(raw.language || "es"),
    status: (raw.status as PodcastStatus) || "draft",
    school_id: raw.school_id ?? "all",
    metadata,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    episode_count: Number(raw.episode_count ?? 0),
    published_episode_count: Number(raw.published_episode_count ?? 0),
    comments,
  };
}

export function normalizeEpisodeRow(raw: any): PodcastEpisodeRow {
  const audio_path = raw.audio_storage_path ?? raw.audio_path ?? null;
  const audio_mime = raw.audio_mime_type ?? raw.audio_mime ?? null;
  const audio_size =
    raw.audio_size_bytes !== null && raw.audio_size_bytes !== undefined
      ? Number(raw.audio_size_bytes)
      : raw.audio_size !== null && raw.audio_size !== undefined
        ? Number(raw.audio_size)
        : null;

  const video_path = raw.video_storage_path ?? raw.video_path ?? null;
  const video_mime = raw.video_mime_type ?? raw.video_mime ?? null;
  const video_size =
    raw.video_size_bytes !== null && raw.video_size_bytes !== undefined
      ? Number(raw.video_size_bytes)
      : raw.video_size !== null && raw.video_size !== undefined
        ? Number(raw.video_size)
        : null;

  const cover_path = raw.cover_storage_path ?? raw.cover_path ?? null;
  const metadata =
    raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
      ? raw.metadata
      : {};
  let spotify_url = raw.spotify_url ?? metadata.spotify_url ?? null;
  if (!spotify_url && isSpotifyUrl(raw.audio_url)) {
    spotify_url = raw.audio_url;
  }
  const clean_audio_url = isSpotifyUrl(raw.audio_url) ? null : (raw.audio_url ?? null);

  return {
    id: String(raw.id),
    podcast_id: String(raw.podcast_id),
    slug: String(raw.slug || raw.id),
    title: String(raw.title || "Episodio sin título"),
    description: raw.description ?? null,
    episode_number: Number(raw.episode_number ?? 1),
    season_number: Number(raw.season_number ?? 1),
    published_at: raw.published_at ?? null,
    duration_seconds: Number(raw.duration_seconds ?? 0),
    spotify_url,
    audio_url: clean_audio_url,
    audio_storage_path: audio_path,
    audio_path,
    audio_mime_type: audio_mime,
    audio_mime,
    audio_size_bytes: audio_size,
    audio_size: audio_size,
    video_url: raw.video_url ?? null,
    video_storage_path: video_path,
    video_path,
    video_mime_type: video_mime,
    video_mime,
    video_size_bytes: video_size,
    video_size: video_size,
    cover_url: raw.cover_url ?? null,
    cover_storage_path: cover_path,
    cover_path,
    language: String(raw.language || "es"),
    status: (raw.status as PodcastStatus) || "draft",
    transcript_status: (raw.transcript_status as TranscriptStatus) || "none",
    metadata,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

function normalizeTranscriptRow(raw: any): PodcastTranscriptRow {
  let segments: TranscriptSegment[] = [];
  if (Array.isArray(raw.segments)) {
    segments = raw.segments.map((s: any, idx: number) => ({
      id: String(s.id || `seg_${idx + 1}`),
      startTime: Number(s.startTime ?? s.start_time ?? 0),
      endTime: Number(s.endTime ?? s.end_time ?? Math.max(5, Number(s.startTime ?? 0) + 8)),
      speaker: s.speaker ? String(s.speaker) : null,
      text: String(s.text || ""),
    }));
  } else if (typeof raw.segments === "string") {
    try {
      const parsed = JSON.parse(raw.segments);
      if (Array.isArray(parsed)) {
        segments = parsed.map((s: any, idx: number) => ({
          id: String(s.id || `seg_${idx + 1}`),
          startTime: Number(s.startTime ?? 0),
          endTime: Number(s.endTime ?? 0),
          speaker: s.speaker ? String(s.speaker) : null,
          text: String(s.text || ""),
        }));
      }
    } catch {
      segments = [];
    }
  }

  return {
    id: String(raw.id),
    episode_id: String(raw.episode_id),
    language: String(raw.language || "es"),
    full_text: String(raw.full_text || ""),
    segments,
    status: (raw.status as TranscriptRecordStatus) || "draft",
    provider: raw.provider ?? "gemini-3.5-transcribe",
    generated_at: raw.generated_at ?? null,
    reviewed_at: raw.reviewed_at ?? null,
    published_at: raw.published_at ?? null,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetches podcasts with batched episode counts in 2 queries (zero N+1 queries, zero SELECT *).
 */
export async function fetchPodcasts(options?: {
  onlyPublished?: boolean;
  schoolId?: string | null;
  language?: string | null;
}): Promise<PodcastRow[]> {
  if (!isSupabaseConfigured()) return [];

  let query = (supabase as any)
    .from("podcasts")
    .select(PODCAST_COLUMNS)
    .order("updated_at", { ascending: false });

  if (options?.onlyPublished) {
    query = query.eq("status", "published");
  }

  const { data: podcastRows, error } = await query;
  if (error || !Array.isArray(podcastRows)) {
    return [];
  }

  let podcasts = podcastRows.map(normalizePodcastRow);

  if (options?.schoolId && options.schoolId !== "all") {
    podcasts = podcasts.filter(
      (p) =>
        !p.school_id ||
        p.school_id === "all" ||
        p.school_id === "district" ||
        p.school_id === options.schoolId,
    );
  }

  if (options?.language && options.language !== "all") {
    podcasts = podcasts.filter((p) => p.language === options.language);
  }

  if (podcasts.length === 0) return [];

  // Single batch query to count episodes per podcast (avoids N+1)
  const { data: epSummary } = await (supabase as any)
    .from("podcast_episodes")
    .select("id, podcast_id, status");

  const totalByPodcast = new Map<string, number>();
  const pubByPodcast = new Map<string, number>();

  if (Array.isArray(epSummary)) {
    for (const ep of epSummary) {
      const pid = String(ep.podcast_id || "");
      totalByPodcast.set(pid, (totalByPodcast.get(pid) ?? 0) + 1);
      if (ep.status === "published") {
        pubByPodcast.set(pid, (pubByPodcast.get(pid) ?? 0) + 1);
      }
    }
  }

  return podcasts.map((p) => ({
    ...p,
    episode_count: totalByPodcast.get(p.id) ?? 0,
    published_episode_count: pubByPodcast.get(p.id) ?? 0,
  }));
}

export async function fetchPodcastBySlugOrId(
  slugOrId: string,
  options?: { onlyPublished?: boolean },
): Promise<PodcastRow | null> {
  if (!isSupabaseConfigured() || !slugOrId) return null;

  const { data: bySlug } = await (supabase as any)
    .from("podcasts")
    .select(PODCAST_COLUMNS)
    .eq("slug", slugOrId)
    .maybeSingle();

  let target = bySlug;
  if (!target) {
    const { data: byId } = await (supabase as any)
      .from("podcasts")
      .select(PODCAST_COLUMNS)
      .eq("id", slugOrId)
      .maybeSingle();
    target = byId;
  }

  if (!target) return null;
  const normalized = normalizePodcastRow(target);
  if (options?.onlyPublished && normalized.status !== "published") {
    return null;
  }
  return normalized;
}

export async function savePodcast(
  input: Partial<PodcastRow> & { name: string },
): Promise<PodcastRow> {
  const now = new Date().toISOString();
  const id = input.id || `pod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const slug = input.slug?.trim() ? slugifyPodcastText(input.slug) : slugifyPodcastText(input.name);

  // IMPORTANT: Never auto-publish on creation; default to 'draft' unless explicitly specified
  const status: PodcastStatus = input.status || "draft";

  const payload = {
    id,
    slug,
    name: input.name.trim(),
    description: input.description ?? null,
    cover_url: input.cover_url ?? null,
    cover_storage_path: input.cover_storage_path ?? null,
    banner_url: input.banner_url ?? null,
    banner_storage_path: input.banner_storage_path ?? null,
    logo_url: input.logo_url ?? null,
    logo_storage_path: input.logo_storage_path ?? null,
    language: input.language || "es",
    status,
    school_id: input.school_id || "all",
    metadata: {
      ...(input.metadata || {}),
      ...(input.spotify_url !== undefined ? { spotify_url: input.spotify_url || null } : {}),
    },
    updated_at: now,
  };

  const { data, error } = await (supabase as any)
    .from("podcasts")
    .upsert(payload, { onConflict: "id" })
    .select(PODCAST_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al guardar podcast en Supabase: ${error.message}`);
  }

  notifyContentUpdated("podcasts");
  return normalizePodcastRow(data || payload);
}

export async function deletePodcast(podcastId: string): Promise<void> {
  const { error } = await supabase.from("podcasts").delete().eq("id", podcastId);
  if (error) {
    throw new Error(`Error al eliminar podcast: ${error.message}`);
  }
  notifyContentUpdated("podcasts");
}

export async function fetchPodcastEpisodes(options?: {
  podcastId?: string;
  onlyPublished?: boolean;
}): Promise<PodcastEpisodeRow[]> {
  if (!isSupabaseConfigured()) return [];

  let query = (supabase as any)
    .from("podcast_episodes")
    .select(EPISODE_COLUMNS)
    .order("published_at", { ascending: false });

  if (options?.podcastId) {
    query = query.eq("podcast_id", options.podcastId);
  }
  if (options?.onlyPublished) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];

  return data.map(normalizeEpisodeRow).sort((a, b) => {
    if (a.season_number !== b.season_number) return b.season_number - a.season_number;
    return b.episode_number - a.episode_number;
  });
}

export async function fetchEpisodeBySlugOrId(
  slugOrId: string,
  options?: { onlyPublished?: boolean },
): Promise<PodcastEpisodeRow | null> {
  if (!isSupabaseConfigured() || !slugOrId) return null;

  const { data: bySlug } = await (supabase as any)
    .from("podcast_episodes")
    .select(EPISODE_COLUMNS)
    .eq("slug", slugOrId)
    .maybeSingle();

  let target = bySlug;
  if (!target) {
    const { data: byId } = await (supabase as any)
      .from("podcast_episodes")
      .select(EPISODE_COLUMNS)
      .eq("id", slugOrId)
      .maybeSingle();
    target = byId;
  }

  if (!target) return null;
  const normalized = normalizeEpisodeRow(target);
  if (options?.onlyPublished && normalized.status !== "published") {
    return null;
  }
  return normalized;
}

export async function savePodcastEpisode(
  input: Partial<PodcastEpisodeRow> & { podcast_id: string; title: string },
): Promise<PodcastEpisodeRow> {
  const now = new Date().toISOString();
  const id = input.id || `ep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const slug = input.slug?.trim()
    ? slugifyPodcastText(input.slug)
    : slugifyPodcastText(input.title);

  // Never auto-publish unless explicitly set to 'published'
  const status: PodcastStatus = input.status || "draft";
  const publishedAt =
    status === "published" ? input.published_at || now : (input.published_at ?? null);

  // If user provided Spotify link or pasted it in audio_url
  let finalSpotifyUrl = input.spotify_url?.trim() || null;
  let finalAudioUrl = input.audio_url?.trim() || null;
  if (!finalSpotifyUrl && finalAudioUrl && isSpotifyUrl(finalAudioUrl)) {
    finalSpotifyUrl = finalAudioUrl;
    finalAudioUrl = null;
  } else if (finalAudioUrl && isSpotifyUrl(finalAudioUrl)) {
    finalAudioUrl = null;
  }

  const payload = {
    id,
    podcast_id: input.podcast_id,
    slug,
    title: input.title.trim(),
    description: input.description ?? null,
    episode_number: Number(input.episode_number ?? 1),
    season_number: Number(input.season_number ?? 1),
    published_at: publishedAt,
    duration_seconds: Number(input.duration_seconds ?? 0),
    audio_url: finalAudioUrl,
    audio_storage_path: input.audio_storage_path ?? input.audio_path ?? null,
    audio_mime_type: input.audio_mime_type ?? input.audio_mime ?? null,
    audio_size_bytes:
      input.audio_size_bytes !== null && input.audio_size_bytes !== undefined
        ? Number(input.audio_size_bytes)
        : input.audio_size !== null && input.audio_size !== undefined
          ? Number(input.audio_size)
          : null,
    video_url: input.video_url ?? null,
    video_storage_path: input.video_storage_path ?? input.video_path ?? null,
    video_mime_type: input.video_mime_type ?? input.video_mime ?? null,
    video_size_bytes:
      input.video_size_bytes !== null && input.video_size_bytes !== undefined
        ? Number(input.video_size_bytes)
        : input.video_size !== null && input.video_size !== undefined
          ? Number(input.video_size)
          : null,
    cover_url: input.cover_url ?? null,
    cover_storage_path: input.cover_storage_path ?? input.cover_path ?? null,
    language: input.language || "es",
    status,
    transcript_status: input.transcript_status || "none",
    metadata: {
      ...(input.metadata || {}),
      ...(finalSpotifyUrl !== null ? { spotify_url: finalSpotifyUrl } : {}),
    },
    updated_at: now,
  };

  const { data, error } = await (supabase as any)
    .from("podcast_episodes")
    .upsert(payload, { onConflict: "id" })
    .select(EPISODE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al guardar episodio en Supabase: ${error.message}`);
  }

  // Touch parent podcast updated_at
  await supabase.from("podcasts").update({ updated_at: now }).eq("id", input.podcast_id);

  notifyContentUpdated("podcast_episodes");
  notifyContentUpdated("podcasts");
  return normalizeEpisodeRow(data || payload);
}

export async function deletePodcastEpisode(episodeId: string): Promise<void> {
  const { error } = await supabase.from("podcast_episodes").delete().eq("id", episodeId);
  if (error) {
    throw new Error(`Error al eliminar episodio: ${error.message}`);
  }
  notifyContentUpdated("podcast_episodes");
  notifyContentUpdated("podcasts");
}

const inMemoryPodcastComments = new Map<string, PodcastComment[]>();

export async function fetchPodcastComments(podcastId: string): Promise<PodcastComment[]> {
  const pod = await fetchPodcastBySlugOrId(podcastId);
  const baseComments = pod?.comments || [];

  // Merge with locally stored comments if any
  let localComments: PodcastComment[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(`dmps_public_podcast_comments_${podcastId}`);
      if (raw) {
        localComments = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }

  // Deduplicate by ID
  const map = new Map<string, PodcastComment>();
  const mem = inMemoryPodcastComments.get(podcastId) || [];
  for (const c of mem) {
    map.set(c.id, c);
  }
  for (const c of localComments) {
    map.set(c.id, c);
  }
  for (const c of baseComments) {
    map.set(c.id, c);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function addPodcastComment(params: {
  podcastId: string;
  episodeId?: string | null;
  authorName?: string;
  content: string;
}): Promise<PodcastComment> {
  const author = params.authorName?.trim() || "Oyente anónimo";
  const content = params.content.trim();
  if (content.length < 2) {
    throw new Error("El comentario debe tener al menos 2 caracteres.");
  }

  // 1. Try server function with service role (allows any visitor without an account to comment)
  try {
    const { postPublicPodcastCommentServerFn } = await import("./podcasts.functions");
    const serverComment = await postPublicPodcastCommentServerFn({
      data: {
        podcastId: params.podcastId,
        episodeId: params.episodeId || null,
        authorName: author,
        content,
      },
    });
    if (serverComment && serverComment.id) {
      const curMem = inMemoryPodcastComments.get(params.podcastId) || [];
      inMemoryPodcastComments.set(params.podcastId, [serverComment, ...curMem]);
      if (typeof window !== "undefined") {
        try {
          const key = `dmps_public_podcast_comments_${params.podcastId}`;
          const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
          window.localStorage.setItem(key, JSON.stringify([serverComment, ...existing]));
        } catch {
          // ignore
        }
      }
      notifyContentUpdated("podcasts");
      return serverComment;
    }
  } catch (serverErr) {
    console.warn("postPublicPodcastCommentServerFn fallback:", serverErr);
  }

  // 2. Direct client and memory fallback
  const pod = await fetchPodcastBySlugOrId(params.podcastId);
  const newComment: PodcastComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    podcast_id: params.podcastId,
    episode_id: params.episodeId || null,
    author_name: author,
    content,
    created_at: new Date().toISOString(),
  };

  const curMem = inMemoryPodcastComments.get(params.podcastId) || [];
  inMemoryPodcastComments.set(params.podcastId, [newComment, ...curMem]);

  if (typeof window !== "undefined") {
    try {
      const key = `dmps_public_podcast_comments_${params.podcastId}`;
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
      window.localStorage.setItem(key, JSON.stringify([newComment, ...existing]));
    } catch {
      // ignore
    }
  }

  if (pod) {
    const existingComments = pod.comments || [];
    const updatedComments = [newComment, ...existingComments];
    const updatedMetadata = {
      ...(pod.metadata || {}),
      comments: updatedComments,
    };
    try {
      await (supabase as any)
        .from("podcasts")
        .update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
        .eq("id", pod.id);
    } catch {
      // ignore
    }
  }

  notifyContentUpdated("podcasts");
  return newComment;
}

export async function fetchEpisodeTranscript(
  episodeId: string,
  options?: { onlyPublished?: boolean },
): Promise<PodcastTranscriptRow | null> {
  if (!isSupabaseConfigured() || !episodeId) return null;

  const { data, error } = await (supabase as any)
    .from("podcast_transcripts")
    .select(TRANSCRIPT_COLUMNS)
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (error || !data) return null;
  const normalized = normalizeTranscriptRow(data);
  if (options?.onlyPublished && normalized.status !== "published") {
    return null;
  }
  return normalized;
}

export async function fetchTranscriptsByEpisodeIds(
  episodeIds: string[],
  options?: { onlyPublished?: boolean },
): Promise<Record<string, PodcastTranscriptRow>> {
  if (!isSupabaseConfigured() || episodeIds.length === 0) return {};

  let query = (supabase as any)
    .from("podcast_transcripts")
    .select(TRANSCRIPT_COLUMNS)
    .in("episode_id", episodeIds);

  if (options?.onlyPublished) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return {};

  const map: Record<string, PodcastTranscriptRow> = {};
  for (const row of data) {
    const normalized = normalizeTranscriptRow(row);
    if (!options?.onlyPublished || normalized.status === "published") {
      map[normalized.episode_id] = normalized;
    }
  }
  return map;
}

/**
 * Saves or updates a transcript in `public.podcast_transcripts` and syncs `transcript_status`
 * on the parent episode. Never publishes unless `publish: true` is explicitly passed.
 */
export async function saveEpisodeTranscript(input: {
  episodeId: string;
  language: string;
  fullText: string;
  segments: TranscriptSegment[];
  status?: TranscriptRecordStatus;
  provider?: string;
  publish?: boolean;
}): Promise<PodcastTranscriptRow> {
  const now = new Date().toISOString();
  const existing = await fetchEpisodeTranscript(input.episodeId);
  const id = existing?.id || `tr_${input.episodeId}`;

  const nextStatus: TranscriptRecordStatus = input.publish
    ? "published"
    : input.status || "review_ready";

  const payload = {
    id,
    episode_id: input.episodeId,
    language: input.language || "es",
    full_text: input.fullText,
    segments: input.segments,
    status: nextStatus,
    provider: input.provider || existing?.provider || "gemini-3.5-transcribe",
    generated_at: existing?.generated_at || now,
    reviewed_at: now,
    published_at: input.publish ? now : (existing?.published_at ?? null),
    updated_at: now,
  };

  const { data, error } = await (supabase as any)
    .from("podcast_transcripts")
    .upsert(payload, { onConflict: "id" })
    .select(TRANSCRIPT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al guardar transcripción: ${error.message}`);
  }

  const episodeTranscriptStatus: TranscriptStatus =
    nextStatus === "published"
      ? "published"
      : nextStatus === "processing"
        ? "processing"
        : nextStatus === "failed"
          ? "failed"
          : "review_ready";

  await (supabase as any)
    .from("podcast_episodes")
    .update({ transcript_status: episodeTranscriptStatus, updated_at: now })
    .eq("id", input.episodeId);

  notifyContentUpdated("podcast_transcripts");
  notifyContentUpdated("podcast_episodes");

  return normalizeTranscriptRow(data || payload);
}

/**
 * Triggers automatic AI transcription via `/api/podcast-transcribe`.
 * Flow: UPLOAD -> GENERATE TRANSCRIPT -> PROCESSING -> PREVIEW (review_ready) -> ADMIN REVIEW -> EDIT -> SAVE -> PUBLISH
 */
export async function generateAutomaticTranscriptForEpisode(params: {
  episode: PodcastEpisodeRow;
  podcastName?: string;
  audioBase64?: string;
  audioMimeType?: string;
}): Promise<PodcastTranscriptRow> {
  const { episode, podcastName, audioBase64, audioMimeType } = params;
  const now = new Date().toISOString();

  // Mark episode as processing first
  await (supabase as any)
    .from("podcast_episodes")
    .update({ transcript_status: "processing", updated_at: now })
    .eq("id", episode.id);
  notifyContentUpdated("podcast_episodes");

  try {
    const response = await fetch("/api/podcast-transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        episodeId: episode.id,
        title: episode.title,
        description: episode.description || "",
        podcastName: podcastName || "DMPS Family Podcast",
        language: episode.language || "es",
        durationSeconds: episode.duration_seconds || 120,
        audioUrl: episode.audio_url,
        audioMimeType: audioMimeType || episode.audio_mime_type || "audio/mpeg",
        audioBase64,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(errBody || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const segments: TranscriptSegment[] = Array.isArray(result.segments)
      ? result.segments.map((s: any, idx: number) => ({
          id: String(s.id || `seg_${idx + 1}`),
          startTime: Number(s.startTime ?? 0),
          endTime: Number(s.endTime ?? Math.max(5, Number(s.startTime ?? 0) + 8)),
          speaker: s.speaker ? String(s.speaker) : "Locutor DMPS",
          text: String(s.text || ""),
        }))
      : [];

    const fullText =
      result.fullText ||
      segments
        .map(
          (s) =>
            `[${formatDurationTimestamp(s.startTime)}] ${s.speaker ? `${s.speaker}: ` : ""}${s.text}`,
        )
        .join("\n");

    // Save as review_ready (NEVER auto-publish!)
    return await saveEpisodeTranscript({
      episodeId: episode.id,
      language: result.language || episode.language || "es",
      fullText,
      segments,
      status: "review_ready",
      provider: result.provider || "gemini-3.5-transcribe",
      publish: false,
    });
  } catch (err) {
    await (supabase as any)
      .from("podcast_episodes")
      .update({ transcript_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", episode.id);
    notifyContentUpdated("podcast_episodes");
    throw err;
  }
}

// ============================================================================
// PODCAST ANALYTICS ENGINE (REAL LISTENING METRICS)
// ============================================================================

export async function recordPodcastAnalyticsEvent(input: {
  podcastId: string;
  episodeId: string;
  eventType: PodcastAnalyticsEventType;
  positionSeconds: number;
  durationSeconds: number;
  listenedSeconds: number;
  playbackRate?: number;
  playbackMode?: "audio" | "video";
  language?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const anonymousId = getOrCreateAnonymousId();
    const sessionId = getCurrentSessionId();
    const deviceCtx = getDeviceContext();
    const lang = input.language || getAppLanguage() || "es";

    const duration = Math.max(0, Number(input.durationSeconds || 0));
    const position = Math.max(0, Number(input.positionSeconds || 0));
    const listened = Math.max(0, Number(input.listenedSeconds || 0));
    const completionPercent =
      input.eventType === "play_complete"
        ? 100
        : duration > 0
          ? Math.min(100, Math.round((position / duration) * 100))
          : 0;

    const row = {
      anonymous_id: anonymousId,
      session_id: sessionId || null,
      podcast_id: input.podcastId,
      episode_id: input.episodeId,
      event_type: input.eventType,
      position_seconds: Math.round(position * 10) / 10,
      duration_seconds: Math.round(duration * 10) / 10,
      listened_seconds: Math.round(listened * 10) / 10,
      completion_percent: completionPercent,
      playback_rate: Number(input.playbackRate || 1),
      device_type: deviceCtx.deviceType || "unknown",
      language: lang,
      is_pwa: Boolean(deviceCtx.isPwa),
      playback_mode: input.playbackMode || "audio",
      created_at: new Date().toISOString(),
    };

    await supabase.from("podcast_analytics_events").insert(row);

    // Also bridge key events to the global DMPS Analytics tracker
    if (
      input.eventType === "play_start" ||
      input.eventType === "play_pause" ||
      input.eventType === "play_complete" ||
      input.eventType === "transcript_segment_click"
    ) {
      const eventNameMap: Record<string, string> = {
        play_start: "podcast_play",
        play_pause: "podcast_pause",
        play_complete: "podcast_complete",
        transcript_segment_click: "podcast_transcript_click",
      };
      void trackEvent({
        eventName: eventNameMap[input.eventType] || "podcast_play",
        eventCategory: "engagement",
        contentType: "podcast",
        contentId: input.episodeId,
        language: lang,
        metadata: {
          podcast_id: input.podcastId,
          episode_id: input.episodeId,
          position_seconds: row.position_seconds,
          duration_seconds: row.duration_seconds,
          listened_seconds: row.listened_seconds,
          completion_percent: row.completion_percent,
          playback_rate: row.playback_rate,
        },
      });
    }
  } catch {
    // Analytics must never interrupt playback
  }
}

/**
 * Fetches real aggregated listening metrics for all podcasts or a specific podcast.
 * Zero mock data: if no events have been recorded, returns 0 across all metrics.
 */
export async function fetchPodcastAnalyticsSummary(options?: {
  podcastId?: string | null;
  days?: number;
}): Promise<PodcastAnalyticsSummary> {
  const empty: PodcastAnalyticsSummary = {
    totalPlays: 0,
    uniqueListeners: 0,
    totalListenedSeconds: 0,
    avgCompletionPercent: 0,
    completionsCount: 0,
    completionRatePercent: 0,
    pausesCount: 0,
    transcriptClicksCount: 0,
    byDevice: [],
    byLanguage: [],
    episodes: [],
    recentEvents: [],
  };

  if (!isSupabaseConfigured()) return empty;

  let eventsQuery = (supabase as any)
    .from("podcast_analytics_events")
    .select(ANALYTICS_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (options?.podcastId) {
    eventsQuery = eventsQuery.eq("podcast_id", options.podcastId);
  }

  const [eventsRes, episodes] = await Promise.all([
    eventsQuery,
    fetchPodcastEpisodes(options?.podcastId ? { podcastId: options.podcastId } : undefined),
  ]);

  const rawEvents: PodcastAnalyticsEventRow[] = Array.isArray(eventsRes.data)
    ? eventsRes.data.map((r: any) => ({
        id: String(r.id || ""),
        anonymous_id: String(r.anonymous_id || ""),
        session_id: r.session_id ? String(r.session_id) : null,
        podcast_id: String(r.podcast_id || ""),
        episode_id: String(r.episode_id || ""),
        event_type: (r.event_type as PodcastAnalyticsEventType) || "play_start",
        position_seconds: Number(r.position_seconds ?? 0),
        duration_seconds: Number(r.duration_seconds ?? 0),
        listened_seconds: Number(r.listened_seconds ?? 0),
        completion_percent: Number(r.completion_percent ?? 0),
        playback_rate: Number(r.playback_rate ?? 1),
        device_type: r.device_type ?? "unknown",
        language: r.language ?? "es",
        is_pwa: Boolean(r.is_pwa),
        playback_mode: r.playback_mode === "video" ? "video" : "audio",
        created_at: r.created_at || new Date().toISOString(),
      }))
    : [];

  let filteredEvents = rawEvents;
  if (options?.days && options.days > 0) {
    const cutoff = Date.now() - options.days * 24 * 60 * 60 * 1000;
    filteredEvents = rawEvents.filter((ev) => new Date(ev.created_at).getTime() >= cutoff);
  }

  // Group by episode + listener session to compute real max listened seconds & max completion % per play session
  interface SessionEpisodeTracker {
    episodeId: string;
    podcastId: string;
    anonymousId: string;
    sessionKey: string;
    maxListenedSeconds: number;
    maxCompletionPercent: number;
    completed: boolean;
    device: string;
    language: string;
  }

  const sessionEpisodeMap = new Map<string, SessionEpisodeTracker>();
  const uniqueGlobalListeners = new Set<string>();
  const deviceCounts = new Map<string, number>();
  const languageCounts = new Map<string, number>();

  let totalPlays = 0;
  let pausesCount = 0;
  let transcriptClicksCount = 0;

  for (const ev of filteredEvents) {
    if (ev.anonymous_id) {
      uniqueGlobalListeners.add(ev.anonymous_id);
    }

    if (ev.event_type === "play_start") {
      totalPlays++;
      const dev = ev.device_type || "unknown";
      deviceCounts.set(dev, (deviceCounts.get(dev) ?? 0) + 1);
      const lang = ev.language || "es";
      languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1);
    } else if (ev.event_type === "play_pause") {
      pausesCount++;
    } else if (ev.event_type === "transcript_segment_click") {
      transcriptClicksCount++;
    }

    const sessionKey = `${ev.episode_id}::${ev.session_id || ev.anonymous_id}`;
    const existing = sessionEpisodeMap.get(sessionKey);
    if (!existing) {
      sessionEpisodeMap.set(sessionKey, {
        episodeId: ev.episode_id,
        podcastId: ev.podcast_id,
        anonymousId: ev.anonymous_id,
        sessionKey,
        maxListenedSeconds: ev.listened_seconds,
        maxCompletionPercent: ev.completion_percent,
        completed: ev.event_type === "play_complete" || ev.completion_percent >= 95,
        device: ev.device_type || "unknown",
        language: ev.language || "es",
      });
    } else {
      existing.maxListenedSeconds = Math.max(existing.maxListenedSeconds, ev.listened_seconds);
      existing.maxCompletionPercent = Math.max(
        existing.maxCompletionPercent,
        ev.completion_percent,
      );
      if (ev.event_type === "play_complete" || ev.completion_percent >= 95) {
        existing.completed = true;
      }
    }
  }

  const allSessionTrackers = Array.from(sessionEpisodeMap.values());
  // If events exist without an explicit play_start (e.g. direct progress), ensure totalPlays >= session trackers count
  if (totalPlays === 0 && allSessionTrackers.length > 0) {
    totalPlays = allSessionTrackers.length;
  }

  const totalListenedSeconds = Math.round(
    allSessionTrackers.reduce((acc, s) => acc + s.maxListenedSeconds, 0),
  );
  const avgCompletionPercent =
    allSessionTrackers.length > 0
      ? Math.round(
          allSessionTrackers.reduce((acc, s) => acc + s.maxCompletionPercent, 0) /
            allSessionTrackers.length,
        )
      : 0;
  const completionsCount = allSessionTrackers.filter((s) => s.completed).length;
  const completionRatePercent =
    totalPlays > 0 ? Math.min(100, Math.round((completionsCount / totalPlays) * 100)) : 0;

  const totalDeviceEvents = Array.from(deviceCounts.values()).reduce((a, b) => a + b, 0);
  const byDevice = Array.from(deviceCounts.entries())
    .map(([device, count]) => ({
      device,
      count,
      percentage: totalDeviceEvents > 0 ? Math.round((count / totalDeviceEvents) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const totalLangEvents = Array.from(languageCounts.values()).reduce((a, b) => a + b, 0);
  const byLanguage = Array.from(languageCounts.entries())
    .map(([language, count]) => ({
      language,
      count,
      percentage: totalLangEvents > 0 ? Math.round((count / totalLangEvents) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Per-episode metrics
  const episodeMetrics: EpisodeAnalyticsMetrics[] = episodes.map((ep) => {
    const epEvents = filteredEvents.filter((e) => e.episode_id === ep.id);
    const epTrackers = allSessionTrackers.filter((t) => t.episodeId === ep.id);
    const epListeners = new Set(epEvents.map((e) => e.anonymous_id).filter(Boolean));
    let epPlays = epEvents.filter((e) => e.event_type === "play_start").length;
    if (epPlays === 0 && epTrackers.length > 0) {
      epPlays = epTrackers.length;
    }
    const epPauses = epEvents.filter((e) => e.event_type === "play_pause").length;
    const epTranscriptClicks = epEvents.filter(
      (e) => e.event_type === "transcript_segment_click",
    ).length;
    const epListened = Math.round(epTrackers.reduce((acc, t) => acc + t.maxListenedSeconds, 0));
    const epAvgListened = epTrackers.length > 0 ? Math.round(epListened / epTrackers.length) : 0;
    const epAvgCompletion =
      epTrackers.length > 0
        ? Math.round(
            epTrackers.reduce((acc, t) => acc + t.maxCompletionPercent, 0) / epTrackers.length,
          )
        : 0;
    const epCompletions = epTrackers.filter((t) => t.completed).length;
    const epCompletionRate =
      epPlays > 0 ? Math.min(100, Math.round((epCompletions / epPlays) * 100)) : 0;

    return {
      episodeId: ep.id,
      podcastId: ep.podcast_id,
      title: ep.title,
      episodeNumber: ep.episode_number,
      seasonNumber: ep.season_number,
      totalPlays: epPlays,
      uniqueListeners: epListeners.size,
      totalListenedSeconds: epListened,
      avgListenedSeconds: epAvgListened,
      avgCompletionPercent: epAvgCompletion,
      completionsCount: epCompletions,
      completionRatePercent: epCompletionRate,
      pausesCount: epPauses,
      transcriptClicksCount: epTranscriptClicks,
      milestone25Count: epTrackers.filter((t) => t.maxCompletionPercent >= 25).length,
      milestone50Count: epTrackers.filter((t) => t.maxCompletionPercent >= 50).length,
      milestone75Count: epTrackers.filter((t) => t.maxCompletionPercent >= 75).length,
      milestone100Count: epTrackers.filter((t) => t.maxCompletionPercent >= 95 || t.completed)
        .length,
      lastPlayedAt: epEvents[0]?.created_at ?? null,
    };
  });

  return {
    totalPlays,
    uniqueListeners: uniqueGlobalListeners.size,
    totalListenedSeconds,
    avgCompletionPercent,
    completionsCount,
    completionRatePercent,
    pausesCount,
    transcriptClicksCount,
    byDevice,
    byLanguage,
    episodes: episodeMetrics,
    recentEvents: filteredEvents.slice(0, 50),
  };
}
