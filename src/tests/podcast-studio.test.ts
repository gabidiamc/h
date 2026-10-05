/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/integrations/supabase/client";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  ANALYTICS_COLUMNS,
  EPISODE_COLUMNS,
  PODCAST_COLUMNS,
  PODCAST_STORAGE_BUCKET,
  TRANSCRIPT_COLUMNS,
  deletePodcast,
  deletePodcastEpisode,
  fetchEpisodeTranscript,
  fetchPodcastAnalyticsSummary,
  fetchPodcastBySlugOrId,
  fetchPodcasts,
  formatBytes,
  formatDurationTimestamp,
  parseTimestampToSeconds,
  recordPodcastAnalyticsEvent,
  saveEpisodeTranscript,
  savePodcast,
  savePodcastEpisode,
  uploadPodcastMedia,
  validatePodcastMediaFile,
} from "../lib/podcasts";
import { PLAYBACK_SPEEDS, getBackgroundPlaybackCapabilities } from "../lib/podcast-player-context";
import {
  findActiveTranscriptSegmentId,
  hasReliableSegmentTimestamps,
} from "../components/podcast/transcript-player";

describe("DMPS INFO — PODCAST STUDIO V1 Suite", () => {
  let originalFrom: any;
  let originalStorage: any;
  let tables: Map<string, any[]>;
  let removedStoragePaths: string[];

  beforeEach(() => {
    originalFrom = (supabase as any).from;
    originalStorage = (supabase as any).storage;
    tables = new Map<string, any[]>();
    removedStoragePaths = [];

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }

    const createBuilder = (tableName: string) => {
      let rows = [...(tables.get(tableName) || [])];
      const filters: Array<(r: any) => boolean> = [];
      let pendingMutation: (() => any) | null = null;

      const applyFilters = (list: any[]) => list.filter((r) => filters.every((fn) => fn(r)));

      const builder: any = {
        select: vi.fn().mockImplementation(() => builder),
        eq: vi.fn().mockImplementation((col: string, val: any) => {
          filters.push((r) => String(r[col] ?? "") === String(val));
          return builder;
        }),
        in: vi.fn().mockImplementation((col: string, vals: any[]) => {
          const set = new Set(vals.map(String));
          filters.push((r) => set.has(String(r[col] ?? "")));
          return builder;
        }),
        order: vi.fn().mockImplementation(() => builder),
        limit: vi.fn().mockImplementation(() => builder),
        upsert: vi.fn().mockImplementation((payload: any) => {
          pendingMutation = () => {
            const incoming = Array.isArray(payload) ? payload : [payload];
            const current = [...(tables.get(tableName) || [])];
            const saved: any[] = [];
            for (const item of incoming) {
              const now = new Date().toISOString();
              const row = {
                ...item,
                id:
                  item.id || `${tableName}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                created_at: item.created_at || now,
                updated_at: item.updated_at || now,
              };
              const idx = current.findIndex((r) => r.id === row.id);
              if (idx >= 0) {
                current[idx] = { ...current[idx], ...row };
                saved.push(current[idx]);
              } else {
                current.push(row);
                saved.push(row);
              }
            }
            tables.set(tableName, current);
            return saved;
          };
          return builder;
        }),
        insert: vi.fn().mockImplementation((payload: any) => {
          const incoming = Array.isArray(payload) ? payload : [payload];
          const current = [...(tables.get(tableName) || [])];
          const saved: any[] = [];
          for (const item of incoming) {
            const row = {
              ...item,
              id: item.id || `${tableName}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              created_at: item.created_at || new Date().toISOString(),
            };
            current.push(row);
            saved.push(row);
          }
          tables.set(tableName, current);
          return Promise.resolve({ data: saved, error: null });
        }),
        update: vi.fn().mockImplementation((patch: any) => {
          pendingMutation = () => {
            const current = [...(tables.get(tableName) || [])];
            const updated: any[] = [];
            const next = current.map((r) => {
              if (filters.every((fn) => fn(r))) {
                const u = { ...r, ...patch };
                updated.push(u);
                return u;
              }
              return r;
            });
            tables.set(tableName, next);
            return updated;
          };
          return builder;
        }),
        delete: vi.fn().mockImplementation(() => {
          pendingMutation = () => {
            const current = [...(tables.get(tableName) || [])];
            const remaining = current.filter((r) => !filters.every((fn) => fn(r)));
            tables.set(tableName, remaining);
            return [];
          };
          return builder;
        }),
        maybeSingle: vi.fn().mockImplementation(async () => {
          if (pendingMutation) {
            const res = pendingMutation();
            return { data: res[0] ?? null, error: null };
          }
          rows = applyFilters(tables.get(tableName) || []);
          return { data: rows[0] ?? null, error: null };
        }),
        then: (onFulfilled: any, onRejected: any) => {
          const run = async () => {
            if (pendingMutation) {
              const res = pendingMutation();
              return { data: res, error: null };
            }
            rows = applyFilters(tables.get(tableName) || []);
            return { data: rows, error: null };
          };
          return run().then(onFulfilled, onRejected);
        },
      };

      return builder;
    };

    (supabase as any).from = vi.fn().mockImplementation((t: string) => createBuilder(t));
    (supabase as any).storage = {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockImplementation(async (storagePath: string) => ({
          data: { path: storagePath, Key: `${PODCAST_STORAGE_BUCKET}/${storagePath}` },
          error: null,
        })),
        getPublicUrl: vi.fn().mockImplementation((storagePath: string) => ({
          data: {
            publicUrl: `https://storage.dmps.edu/object/public/${PODCAST_STORAGE_BUCKET}/${storagePath}`,
          },
        })),
        remove: vi.fn().mockImplementation(async (paths: string[]) => {
          removedStoragePaths.push(...paths);
          return { data: paths, error: null };
        }),
      }),
    };
  });

  afterEach(() => {
    if (originalFrom) (supabase as any).from = originalFrom;
    if (originalStorage) (supabase as any).storage = originalStorage;
    vi.restoreAllMocks();
  });

  it("FASE 2 & 3: La migración SQL crea tablas de producción, políticas RLS, bucket podcast-media y Realtime", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261004000000_podcast_studio_v1.sql",
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.podcasts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.podcast_episodes");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.podcast_transcripts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.podcast_analytics_events");

    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("public.can_manage_content()");
    expect(sql).toContain(PODCAST_STORAGE_BUCKET);
    expect(sql).toContain("storage.buckets");
    expect(sql).toContain("storage.objects");
    expect(sql).toContain("supabase_realtime");
  });

  it("FASE 2: Las proyecciones de columnas evitan SELECT * en todo el módulo de podcasts", () => {
    expect(PODCAST_COLUMNS).not.toContain("*");
    expect(EPISODE_COLUMNS).not.toContain("*");
    expect(TRANSCRIPT_COLUMNS).not.toContain("*");
    expect(ANALYTICS_COLUMNS).not.toContain("*");

    const libSource = fs.readFileSync(path.resolve(process.cwd(), "src/lib/podcasts.ts"), "utf8");
    expect(libSource).not.toContain('.select("*")');
    expect(libSource).not.toContain(".select('*')");
  });

  it("FASE 4: Crear podcast guarda en borrador por defecto (no publica automáticamente) y permite edición", async () => {
    const created = await savePodcast({
      name: "Voces de las Familias DMPS",
      description: "Guías oficiales en audio para las familias del distrito escolar.",
      language: "es",
      cover_url: "https://example.com/cover.jpg",
      banner_url: "https://example.com/banner.jpg",
      logo_url: "https://example.com/logo.png",
    });

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Voces de las Familias DMPS");
    expect(created.status).toBe("draft");
    expect(created.cover_url).toBe("https://example.com/cover.jpg");
    expect(created.banner_url).toBe("https://example.com/banner.jpg");
    expect(created.logo_url).toBe("https://example.com/logo.png");

    // No aparece como publicado hasta que el admin cambie su estado explícitamente
    const pubBefore = await fetchPodcastBySlugOrId(created.slug, { onlyPublished: true });
    expect(pubBefore).toBeNull();

    // Publicar explícitamente
    const published = await savePodcast({
      ...created,
      status: "published",
    });
    expect(published.status).toBe("published");

    const pubAfter = await fetchPodcastBySlugOrId(created.slug, { onlyPublished: true });
    expect(pubAfter).not.toBeNull();
    expect(pubAfter?.id).toBe(created.id);

    await deletePodcast(created.id);
  });

  it("FASE 4 & 8 & 9: Episodios y Transcripciones cumplen el flujo completo sin auto-publicar", async () => {
    const podcast = await savePodcast({
      name: "Guía Escolar en Audio",
      language: "es",
      status: "published",
    });

    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Cómo usar Infinite Campus paso a paso",
      description: "Explicación detallada para padres y tutores.",
      episode_number: 1,
      season_number: 1,
      duration_seconds: 180,
      audio_url: "https://example.com/ep1.mp3",
      language: "es",
    });

    // El episodio inicia en draft
    expect(episode.status).toBe("draft");
    expect(episode.transcript_status).toBe("none");

    // Guardar transcripción generada en estado de revisión (no publicada automáticamente)
    const segments = [
      {
        id: "seg_1",
        startTime: 0,
        endTime: 8,
        speaker: "Locutor DMPS",
        text: "Bienvenidos al primer episodio sobre Infinite Campus.",
      },
      {
        id: "seg_2",
        startTime: 8,
        endTime: 18,
        speaker: "Coordinadora",
        text: "Hoy aprenderemos cómo consultar calificaciones y asistencia.",
      },
    ];

    const draftTranscript = await saveEpisodeTranscript({
      episodeId: episode.id,
      language: "es",
      fullText: segments.map((s) => `${s.speaker}: ${s.text}`).join("\n"),
      segments,
      publish: false,
    });

    expect(draftTranscript.status).toBe("review_ready");

    // No debe ser visible públicamente mientras esté en review_ready
    const publicTrBefore = await fetchEpisodeTranscript(episode.id, {
      onlyPublished: true,
    });
    expect(publicTrBefore).toBeNull();

    // El administrador revisa, edita y publica explícitamente la transcripción
    const editedSegments = [
      segments[0],
      {
        ...segments[1],
        text: "Hoy aprenderemos cómo consultar calificaciones, asistencia y horarios en línea.",
      },
    ];

    const publishedTranscript = await saveEpisodeTranscript({
      episodeId: episode.id,
      language: "es",
      fullText: editedSegments.map((s) => `${s.speaker}: ${s.text}`).join("\n"),
      segments: editedSegments,
      publish: true,
    });

    expect(publishedTranscript.status).toBe("published");

    const publicTrAfter = await fetchEpisodeTranscript(episode.id, {
      onlyPublished: true,
    });
    expect(publicTrAfter).not.toBeNull();
    expect(publicTrAfter?.segments).toHaveLength(2);
    expect(publicTrAfter?.segments[1].text).toContain("horarios en línea");

    // Verificar sincronización de timestamps del Transcript Player (Fase 9)
    expect(hasReliableSegmentTimestamps(editedSegments)).toBe(true);
    expect(findActiveTranscriptSegmentId(editedSegments, 3)).toBe("seg_1");
    expect(findActiveTranscriptSegmentId(editedSegments, 12)).toBe("seg_2");
    expect(findActiveTranscriptSegmentId([], 5)).toBeNull();

    // Verificar conteo por lote sin N+1
    await savePodcastEpisode({
      ...episode,
      status: "published",
    });
    const listWithCounts = await fetchPodcasts({ onlyPublished: true });
    const foundPod = listWithCounts.find((p) => p.id === podcast.id);
    expect(foundPod?.episode_count).toBe(1);
    expect(foundPod?.published_episode_count).toBe(1);

    await deletePodcastEpisode(episode.id);
    await deletePodcast(podcast.id);
  });

  it("FASE 5: Validación de archivos multimedia, progreso, cancelación y reemplazo seguro", async () => {
    expect(ALLOWED_MEDIA_MIME_TYPES.audio).toContain("audio/mpeg");
    expect(ALLOWED_MEDIA_MIME_TYPES.video).toContain("video/mp4");
    expect(ALLOWED_MEDIA_MIME_TYPES.image).toContain("image/webp");

    const validMp3 = new File([new Uint8Array(2048)], "episodio-bienvenida.mp3", {
      type: "audio/mpeg",
    });
    const inspection = validatePodcastMediaFile(validMp3, "audio");
    expect(inspection.valid).toBe(true);
    expect(inspection.sizeBytes).toBe(2048);

    const invalidType = new File([new Uint8Array(512)], "script.exe", {
      type: "application/x-msdownload",
    });
    expect(validatePodcastMediaFile(invalidType, "audio").valid).toBe(false);

    // Subida con seguimiento de progreso real y reemplazo seguro del archivo anterior
    const progressSteps: number[] = [];
    const uploadRes = await uploadPodcastMedia({
      file: validMp3,
      category: "audio",
      podcastId: "pod_test_upload",
      episodeId: "ep_test_upload",
      assetRole: "audio",
      previousStoragePath: "podcasts/pod_test_upload/episodes/ep_test_upload/audio.mp3",
      onProgress: (pct) => progressSteps.push(pct),
    });

    expect(uploadRes.publicUrl).toBeTruthy();
    expect(uploadRes.storagePath).toContain(
      "podcasts/pod_test_upload/episodes/ep_test_upload/audio",
    );
    expect(progressSteps).toContain(100);
    // El archivo anterior solo se elimina tras confirmar el nuevo
    expect(removedStoragePaths).toContain(
      "podcasts/pod_test_upload/episodes/ep_test_upload/audio.mp3",
    );

    // Cancelación con AbortController
    const abortController = new AbortController();
    abortController.abort();
    await expect(
      uploadPodcastMedia({
        file: validMp3,
        category: "audio",
        podcastId: "pod_test_upload",
        signal: abortController.signal,
      }),
    ).rejects.toThrow(/cancelada/i);
  });

  it("FASE 6 & 7: Velocidades del reproductor global y capacidades reales de reproducción en segundo plano", () => {
    expect(PLAYBACK_SPEEDS).toEqual([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
    expect(formatDurationTimestamp(65)).toBe("01:05");
    expect(formatDurationTimestamp(3665)).toBe("01:01:05");
    expect(parseTimestampToSeconds("02:15")).toBe(135);
    expect(formatBytes(1048576)).toBe("1.0 MB");

    const capabilities = getBackgroundPlaybackCapabilities();
    expect(capabilities).toHaveLength(5);

    const byId = Object.fromEntries(capabilities.map((c) => [c.scenarioId, c]));
    expect(byId.in_site_navigation.supported).toBe(true);
    expect(byId.background_tab.supported).toBe(true);
    expect(byId.installed_pwa.supported).toBe(true);
    // Nunca afirma falsamente que el navegador sigue reproduciendo al cerrar por completo la app
    expect(byId.app_completely_closed.supported).toBe(false);
  });

  it("FASE 13-15: Podcast Analytics registra eventos reales y calcula métricas individuales por episodio", async () => {
    const pod = await savePodcast({
      name: "Podcast Analítica Real",
      language: "es",
      status: "published",
    });

    const ep = await savePodcastEpisode({
      podcast_id: pod.id,
      title: "Episodio con Telemetría Real",
      episode_number: 1,
      season_number: 1,
      duration_seconds: 100,
      status: "published",
    });

    await recordPodcastAnalyticsEvent({
      podcastId: pod.id,
      episodeId: ep.id,
      eventType: "play_start",
      positionSeconds: 0,
      durationSeconds: 100,
      listenedSeconds: 5,
      playbackRate: 1,
      language: "es",
    });

    await recordPodcastAnalyticsEvent({
      podcastId: pod.id,
      episodeId: ep.id,
      eventType: "play_progress",
      positionSeconds: 60,
      durationSeconds: 100,
      listenedSeconds: 60,
      playbackRate: 1.25,
      language: "es",
    });

    await recordPodcastAnalyticsEvent({
      podcastId: pod.id,
      episodeId: ep.id,
      eventType: "play_pause",
      positionSeconds: 60,
      durationSeconds: 100,
      listenedSeconds: 60,
      playbackRate: 1.25,
      language: "es",
    });

    await recordPodcastAnalyticsEvent({
      podcastId: pod.id,
      episodeId: ep.id,
      eventType: "play_complete",
      positionSeconds: 100,
      durationSeconds: 100,
      listenedSeconds: 100,
      playbackRate: 1.25,
      language: "es",
    });

    const summary = await fetchPodcastAnalyticsSummary({ podcastId: pod.id });
    expect(summary.totalPlays).toBeGreaterThanOrEqual(1);
    expect(summary.uniqueListeners).toBeGreaterThanOrEqual(1);
    expect(summary.totalListenedSeconds).toBe(100);
    expect(summary.avgCompletionPercent).toBe(100);
    expect(summary.completionsCount).toBe(1);
    expect(summary.pausesCount).toBe(1);

    const epMetrics = summary.episodes.find((e) => e.episodeId === ep.id);
    expect(epMetrics).toBeDefined();
    expect(epMetrics?.totalPlays).toBe(1);
    expect(epMetrics?.avgCompletionPercent).toBe(100);
    expect(epMetrics?.milestone100Count).toBe(1);

    await deletePodcastEpisode(ep.id);
    await deletePodcast(pod.id);
  });
});
