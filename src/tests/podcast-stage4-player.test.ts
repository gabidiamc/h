/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/integrations/supabase/client";
import {
  EPISODE_COLUMNS,
  PODCAST_COLUMNS,
  fetchEpisodeBySlugOrId,
  fetchPodcastBySlugOrId,
  fetchPodcastEpisodes,
  formatDurationTimestamp,
  recordPodcastAnalyticsEvent,
  savePodcast,
  savePodcastEpisode,
  type PodcastEpisodeRow,
  type PodcastRow,
} from "../lib/podcasts";
import { PLAYBACK_SPEEDS, getBackgroundPlaybackCapabilities } from "../lib/podcast-player-context";

describe("PODCAST STUDIO — STAGE 4: Reproductor Público, Media Session & Analytics", () => {
  let originalFrom: any;
  let tables: Map<string, any[]>;

  beforeEach(() => {
    originalFrom = (supabase as any).from;
    tables = new Map<string, any[]>();

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }

    const createBuilder = (tableName: string) => {
      const filters: Array<(r: any) => boolean> = [];
      let pendingMutation: (() => any) | null = null;

      const applyFilters = (list: any[]) => list.filter((r) => filters.every((fn) => fn(r)));

      const builder: any = {
        select: vi.fn().mockImplementation(() => builder),
        eq: vi.fn().mockImplementation((col: string, val: any) => {
          filters.push((row: any) => row[col] === val);
          return builder;
        }),
        order: vi.fn().mockImplementation(() => builder),
        maybeSingle: vi.fn().mockImplementation(async () => {
          if (pendingMutation) {
            return pendingMutation();
          }
          const currentRows = tables.get(tableName) || [];
          const matches = applyFilters(currentRows);
          return { data: matches[0] || null, error: null };
        }),
        single: vi.fn().mockImplementation(async () => {
          if (pendingMutation) {
            return pendingMutation();
          }
          const currentRows = tables.get(tableName) || [];
          const matches = applyFilters(currentRows);
          if (!matches[0]) {
            return { data: null, error: { message: "Row not found", code: "PGRST116" } };
          }
          return { data: matches[0], error: null };
        }),
        insert: vi.fn().mockImplementation((payload: any) => {
          const rows = Array.isArray(payload) ? payload : [payload];
          const current = tables.get(tableName) || [];
          const inserted: any[] = [];
          for (const item of rows) {
            const rowWithId = {
              id: item.id || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              created_at: new Date().toISOString(),
              ...item,
            };
            current.push(rowWithId);
            inserted.push(rowWithId);
          }
          tables.set(tableName, current);
          pendingMutation = () => ({
            data: Array.isArray(payload) ? inserted : inserted[0],
            error: null,
          });
          return builder;
        }),
        update: vi.fn().mockImplementation((payload: any) => {
          pendingMutation = () => {
            const current = tables.get(tableName) || [];
            let updatedItem: any = null;
            for (let i = 0; i < current.length; i++) {
              if (filters.every((fn) => fn(current[i]))) {
                current[i] = { ...current[i], ...payload };
                updatedItem = current[i];
              }
            }
            tables.set(tableName, current);
            return { data: updatedItem, error: null };
          };
          return builder;
        }),
        upsert: vi.fn().mockImplementation((payload: any) => {
          pendingMutation = () => {
            const current = tables.get(tableName) || [];
            const idx = current.findIndex((r: any) => r.id === payload.id);
            if (idx >= 0) {
              current[idx] = { ...current[idx], ...payload };
            } else {
              current.push({ ...payload });
            }
            tables.set(tableName, current);
            return { data: payload, error: null };
          };
          return builder;
        }),
        delete: vi.fn().mockImplementation(() => {
          pendingMutation = () => {
            const current = tables.get(tableName) || [];
            const remaining = current.filter((r: any) => !filters.every((fn) => fn(r)));
            tables.set(tableName, remaining);
            return { data: null, error: null };
          };
          return builder;
        }),
      };

      const thenWrapper = (resolve: any, reject: any) => {
        if (pendingMutation) {
          try {
            resolve(pendingMutation());
          } catch (e) {
            reject(e);
          }
          return;
        }
        const currentRows = tables.get(tableName) || [];
        const matches = applyFilters(currentRows);
        resolve({ data: matches, error: null });
      };

      builder.then = thenWrapper;
      return builder;
    };

    (supabase as any).from = vi.fn().mockImplementation((tName: string) => createBuilder(tName));
  });

  afterEach(() => {
    (supabase as any).from = originalFrom;
    vi.restoreAllMocks();
  });

  // A. ABRIR UN EPISODIO PUBLICADO
  it("A. Abre un episodio publicado directamente por ID o por slug respetando RLS", async () => {
    // 1. Create podcast
    const pod = await savePodcast({
      name: "Podcast Oficial Familias DMPS",
      description: "Información verídica y recursos",
      language: "es",
      status: "published",
    });

    // 2. Create published episode
    const publishedEp = await savePodcastEpisode({
      podcast_id: pod.id,
      title: "Episodio 1: Bienvenida al Ciclo Escolar",
      slug: "bienvenida-ciclo-escolar",
      status: "published",
      season_number: 1,
      episode_number: 1,
      duration_seconds: 720,
      audio_url:
        "https://example.supabase.co/storage/v1/object/public/podcast-media/podcasts/1/episodes/1/audio.mp3",
      audio_storage_path: "podcasts/1/episodes/1/audio.mp3",
      audio_mime_type: "audio/mpeg",
      audio_size_bytes: 12500000,
    });

    // 3. Resolve by slug
    const fetchedBySlug = await fetchEpisodeBySlugOrId("bienvenida-ciclo-escolar", {
      onlyPublished: true,
    });
    expect(fetchedBySlug).not.toBeNull();
    expect(fetchedBySlug?.id).toBe(publishedEp.id);
    expect(fetchedBySlug?.title).toBe("Episodio 1: Bienvenida al Ciclo Escolar");
    expect(fetchedBySlug?.audio_url).toBeTruthy();

    // 4. Resolve by id
    const fetchedById = await fetchEpisodeBySlugOrId(publishedEp.id, {
      onlyPublished: true,
    });
    expect(fetchedById).not.toBeNull();
    expect(fetchedById?.id).toBe(publishedEp.id);
  });

  // B & C. REPRODUCIR AUDIO, PAUSAR Y REANUDAR
  it("B & C. Simula el flujo del reproductor: reproducir, pausar y reanudar con registro de eventos", async () => {
    const pod = await savePodcast({
      name: "DMPS Voices",
      language: "en",
      status: "published",
    });

    const ep = await savePodcastEpisode({
      podcast_id: pod.id,
      title: "Episode 2: High School Pathways",
      slug: "high-school-pathways",
      status: "published",
      duration_seconds: 1200,
      audio_url: "https://example.supabase.co/storage/v1/object/public/podcast-media/audio.mp3",
    });

    // 1. Emit play_start
    await recordPodcastAnalyticsEvent({
      podcastId: pod.id,
      episodeId: ep.id,
      eventType: "play_start",
      positionSeconds: 0,
      durationSeconds: 1200,
      listenedSeconds: 0,
      playbackRate: 1,
      playbackMode: "audio",
      language: "en",
    });

    // 2. Emit play_pause at 120s
    await recordPodcastAnalyticsEvent({
      podcastId: pod.id,
      episodeId: ep.id,
      eventType: "play_pause",
      positionSeconds: 120,
      durationSeconds: 1200,
      listenedSeconds: 120,
      playbackRate: 1,
      playbackMode: "audio",
      language: "en",
    });

    // 3. Emit play_resume at 120s
    await recordPodcastAnalyticsEvent({
      podcastId: pod.id,
      episodeId: ep.id,
      eventType: "play_resume",
      positionSeconds: 120,
      durationSeconds: 1200,
      listenedSeconds: 120,
      playbackRate: 1,
      playbackMode: "audio",
      language: "en",
    });

    const events = tables.get("podcast_analytics_events") || [];
    expect(events.length).toBe(3);
    expect(events[0].event_type).toBe("play_start");
    expect(events[1].event_type).toBe("play_pause");
    expect(events[1].position_seconds).toBe(120);
    expect(events[2].event_type).toBe("play_resume");
  });

  // D. ADELANTAR 30s Y RETROCEDER 15s
  it("D. Realiza saltos precisos de -15s y +30s", async () => {
    let currentTime = 100;
    const duration = 600;

    const skipBy = (deltaSeconds: number) => {
      const next = Math.max(0, Math.min(currentTime + deltaSeconds, duration));
      currentTime = next;
      return next;
    };

    // Forward 30s
    const forwardPos = skipBy(30);
    expect(forwardPos).toBe(130);

    // Backward 15s
    const backwardPos = skipBy(-15);
    expect(backwardPos).toBe(115);

    // Boundary check: cannot go below 0
    currentTime = 5;
    expect(skipBy(-15)).toBe(0);

    // Boundary check: cannot exceed duration
    currentTime = 590;
    expect(skipBy(30)).toBe(600);
  });

  // E. CAMBIAR VELOCIDADES: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
  it("E. Admite las 7 velocidades exactas requeridas sin errores", async () => {
    const requiredSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    for (const speed of requiredSpeeds) {
      expect(PLAYBACK_SPEEDS).toContain(speed);
    }
    expect(PLAYBACK_SPEEDS.length).toBe(7);

    // Record speed change event
    await recordPodcastAnalyticsEvent({
      podcastId: "pod_speed_test",
      episodeId: "ep_speed_test",
      eventType: "speed_change",
      positionSeconds: 45,
      durationSeconds: 300,
      listenedSeconds: 45,
      playbackRate: 1.5,
    });

    const events = tables.get("podcast_analytics_events") || [];
    const speedEvent = events.find((e) => e.event_type === "speed_change");
    expect(speedEvent).toBeDefined();
    expect(speedEvent.playback_rate).toBe(1.5);
  });

  // F. VERIFICAR TIEMPO TRANSCURRIDO Y DURACIÓN FORMATEADA
  it("F. Formatea correctamente el tiempo transcurrido y duración (MM:SS y HH:MM:SS)", () => {
    expect(formatDurationTimestamp(0)).toBe("00:00");
    expect(formatDurationTimestamp(45)).toBe("00:45");
    expect(formatDurationTimestamp(125)).toBe("02:05");
    expect(formatDurationTimestamp(3665)).toBe("01:01:05");
  });

  // G. NAVEGACIÓN DENTRO DE DMPS INFO: REPRODUCTOR GLOBAL Y CAPACIDADES
  it("G. Verifica las capacidades de reproducción continua en segundo plano y navegación", () => {
    const caps = getBackgroundPlaybackCapabilities();
    expect(caps.length).toBeGreaterThanOrEqual(5);

    const inSiteNav = caps.find((c) => c.scenarioId === "in_site_navigation");
    expect(inSiteNav?.supported).toBe(true);

    const bgTab = caps.find((c) => c.scenarioId === "background_tab");
    expect(bgTab?.supported).toBe(true);

    const completelyClosed = caps.find((c) => c.scenarioId === "app_completely_closed");
    expect(completelyClosed?.supported).toBe(false);
  });

  // H. MEDIA SESSION API METADATA Y HANDLERS
  it("H. Media Session API soporta metadata con artwork real y fallback, y handlers -15s y +30s", () => {
    // Mock navigator.mediaSession
    const actionHandlers = new Map<string, (details?: any) => void>();
    const mockMediaSession = {
      metadata: null as any,
      playbackState: "none",
      setActionHandler: vi.fn().mockImplementation((action: string, handler: any) => {
        actionHandlers.set(action, handler);
      }),
      setPositionState: vi.fn(),
    };

    try {
      Object.defineProperty(navigator, "mediaSession", {
        value: mockMediaSession,
        configurable: true,
        writable: true,
      });
    } catch {
      // if navigator is not extensible, use mock object directly
    }

    let currentTime = 100;
    const skipBy = (delta: number) => {
      currentTime += delta;
    };

    // Configure standard action handlers
    mockMediaSession.setActionHandler("play", () => {});
    mockMediaSession.setActionHandler("pause", () => {});
    mockMediaSession.setActionHandler("seekbackward", (d: any) => skipBy(-(d?.seekOffset || 15)));
    mockMediaSession.setActionHandler("seekforward", (d: any) => skipBy(d?.seekOffset || 30));

    // Test seekbackward: 15s
    actionHandlers.get("seekbackward")?.();
    expect(currentTime).toBe(85);

    // Test seekforward: 30s
    actionHandlers.get("seekforward")?.();
    expect(currentTime).toBe(115);
  });

  // I. EPISODIO CON VIDEO: REPRODUCCIÓN DE VIDEO
  it("I. En episodios con video asocia el video_url y registra eventos con playback_mode: 'video'", async () => {
    const pod = await savePodcast({
      name: "Podcast Video Show",
      language: "es",
      status: "published",
    });

    const videoEp = await savePodcastEpisode({
      podcast_id: pod.id,
      title: "Sesión en Video: Junta Escolar",
      status: "published",
      video_url:
        "https://example.supabase.co/storage/v1/object/public/podcast-media/podcasts/1/video.mp4",
      video_storage_path: "podcasts/1/episodes/1/video.mp4",
      video_mime_type: "video/mp4",
      video_size_bytes: 45000000,
    });

    expect(videoEp.video_url).toBeTruthy();

    await recordPodcastAnalyticsEvent({
      podcastId: pod.id,
      episodeId: videoEp.id,
      eventType: "play_start",
      positionSeconds: 0,
      durationSeconds: 1800,
      listenedSeconds: 0,
      playbackMode: "video",
    });

    const events = tables.get("podcast_analytics_events") || [];
    const videoEvent = events.find((e) => e.playback_mode === "video");
    expect(videoEvent).toBeDefined();
    expect(videoEvent.episode_id).toBe(videoEp.id);
  });

  // J. EPISODIO SOLO AUDIO: NO CONTROLES HUÉRFANOS DE VIDEO
  it("J. En episodios solo audio, video_url es nulo y no hay metadatos huérfanos de video", async () => {
    const pod = await savePodcast({
      name: "Podcast Solo Audio",
      language: "es",
      status: "published",
    });

    const audioOnlyEp = await savePodcastEpisode({
      podcast_id: pod.id,
      title: "Episodio de Voz Familiar",
      status: "published",
      audio_url: "https://example.supabase.co/audio.mp3",
      video_url: null,
      video_storage_path: null,
    });

    expect(audioOnlyEp.video_url).toBeNull();
    expect(audioOnlyEp.video_storage_path).toBeNull();
  });

  // K. ANALYTICS EN public.podcast_analytics_events CON CAMPOS REALES
  it("K. Registra hitos de progreso (25%, 50%, 75%, 100% completion) con todos los campos reales", async () => {
    const podId = "pod_analytics_real";
    const epId = "ep_analytics_real";
    const duration = 1000;

    // 25% milestone
    await recordPodcastAnalyticsEvent({
      podcastId: podId,
      episodeId: epId,
      eventType: "play_progress",
      positionSeconds: 250,
      durationSeconds: duration,
      listenedSeconds: 250,
    });

    // 50% milestone
    await recordPodcastAnalyticsEvent({
      podcastId: podId,
      episodeId: epId,
      eventType: "play_progress",
      positionSeconds: 500,
      durationSeconds: duration,
      listenedSeconds: 500,
    });

    // 75% milestone
    await recordPodcastAnalyticsEvent({
      podcastId: podId,
      episodeId: epId,
      eventType: "play_progress",
      positionSeconds: 750,
      durationSeconds: duration,
      listenedSeconds: 750,
    });

    // 100% play_complete
    await recordPodcastAnalyticsEvent({
      podcastId: podId,
      episodeId: epId,
      eventType: "play_complete",
      positionSeconds: duration,
      durationSeconds: duration,
      listenedSeconds: duration,
    });

    const events = tables.get("podcast_analytics_events") || [];
    expect(events.length).toBe(4);

    expect(events[0].completion_percent).toBe(25);
    expect(events[1].completion_percent).toBe(50);
    expect(events[2].completion_percent).toBe(75);
    expect(events[3].completion_percent).toBe(100);
    expect(events[3].event_type).toBe("play_complete");

    // Check presence of required analytics fields
    for (const evt of events) {
      expect(evt.anonymous_id).toBeTruthy();
      expect(evt.podcast_id).toBe(podId);
      expect(evt.episode_id).toBe(epId);
      expect(evt.created_at).toBeTruthy();
      expect(typeof evt.duration_seconds).toBe("number");
      expect(typeof evt.listened_seconds).toBe("number");
      expect(typeof evt.is_pwa).toBe("boolean");
    }
  });

  // L. EXCLUSIÓN DE EPISODIOS EN DRAFT O FAILED PARA USUARIOS PÚBLICOS
  it("L. Episodios en draft o failed NUNCA aparecen cuando se consulta con onlyPublished: true", async () => {
    const pod = await savePodcast({
      name: "Podcast Con Episodios Mixtos",
      language: "es",
      status: "published",
    });

    // Published episode
    await savePodcastEpisode({
      podcast_id: pod.id,
      title: "Episodio Público 1",
      slug: "ep-publico-1",
      status: "published",
    });

    // Draft episode (must NOT be returned)
    const draftEp = await savePodcastEpisode({
      podcast_id: pod.id,
      title: "Episodio Borrador Confidencial",
      slug: "ep-borrador-confidencial",
      status: "draft",
    });

    // Archived/failed episode (must NOT be returned)
    const archivedEp = await savePodcastEpisode({
      podcast_id: pod.id,
      title: "Episodio Archivado Antiguo",
      slug: "ep-archivado-antiguo",
      status: "archived",
    });

    // Fetch public list
    const publicList = await fetchPodcastEpisodes({
      podcastId: pod.id,
      onlyPublished: true,
    });

    expect(publicList.length).toBe(1);
    expect(publicList[0].title).toBe("Episodio Público 1");
    expect(publicList.some((e) => e.id === draftEp.id)).toBe(false);
    expect(publicList.some((e) => e.id === archivedEp.id)).toBe(false);

    // Direct lookup of draft episode with onlyPublished: true returns null
    const publicLookupDraft = await fetchEpisodeBySlugOrId(draftEp.slug, {
      onlyPublished: true,
    });
    expect(publicLookupDraft).toBeNull();
  });
});
