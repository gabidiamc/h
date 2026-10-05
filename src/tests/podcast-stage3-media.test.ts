import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/integrations/supabase/client";
import {
  PODCAST_STORAGE_BUCKET,
  savePodcast,
  savePodcastEpisode,
  uploadAndAssociateEpisodeMedia,
  uploadPodcastMedia,
  validatePodcastMediaFile,
  removeEpisodeMediaFile,
  deletePodcastEpisode,
  deletePodcast,
  fetchPodcastEpisodes,
} from "../lib/podcasts";

describe("PODCAST STUDIO — STAGE 3: Integración Real de Subida de Media", () => {
  let originalFrom: unknown;
  let originalStorage: unknown;
  let tables: Map<string, Array<Record<string, unknown>>>;
  let storageObjects: Map<string, { data: Uint8Array; mime: string }>;
  let removedStoragePaths: string[];

  beforeEach(() => {
    originalFrom = (supabase as unknown as { from: unknown }).from;
    originalStorage = (supabase as unknown as { storage: unknown }).storage;
    tables = new Map<string, Array<Record<string, unknown>>>();
    storageObjects = new Map<string, { data: Uint8Array; mime: string }>();
    removedStoragePaths = [];

    const createBuilder = (tableName: string) => {
      let rows = [...(tables.get(tableName) || [])];
      const filters: Array<(r: Record<string, unknown>) => boolean> = [];
      let pendingMutation: (() => Array<Record<string, unknown>>) | null = null;

      const applyFilters = (list: Array<Record<string, unknown>>) =>
        list.filter((r) => filters.every((fn) => fn(r)));

      const builder: Record<string, unknown> = {
        select: vi.fn().mockImplementation(() => builder),
        eq: vi.fn().mockImplementation((col: string, val: unknown) => {
          filters.push((r) => String(r[col] ?? "") === String(val));
          return builder;
        }),
        order: vi.fn().mockImplementation(() => builder),
        limit: vi.fn().mockImplementation(() => builder),
        upsert: vi.fn().mockImplementation((payload: unknown) => {
          pendingMutation = () => {
            const incoming = Array.isArray(payload) ? payload : [payload];
            const current = [...(tables.get(tableName) || [])];
            const saved: Array<Record<string, unknown>> = [];
            for (const item of incoming as Array<Record<string, unknown>>) {
              const now = new Date().toISOString();
              const row: Record<string, unknown> = {
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
        update: vi.fn().mockImplementation((patch: Record<string, unknown>) => {
          pendingMutation = () => {
            const current = [...(tables.get(tableName) || [])];
            const updated: Array<Record<string, unknown>> = [];
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
        then: (
          onFulfilled: (res: { data: unknown; error: unknown }) => unknown,
          onRejected: (err: unknown) => unknown,
        ) => {
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

    (supabase as unknown as { from: unknown }).from = vi
      .fn()
      .mockImplementation((t: string) => createBuilder(t));

    (supabase as unknown as { storage: unknown }).storage = {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockImplementation(async (storagePath: string, file: File) => {
          storageObjects.set(storagePath, {
            data: new Uint8Array(await file.arrayBuffer()),
            mime: file.type,
          });
          return {
            data: { path: storagePath, Key: `${PODCAST_STORAGE_BUCKET}/${storagePath}` },
            error: null,
          };
        }),
        getPublicUrl: vi.fn().mockImplementation((storagePath: string) => ({
          data: {
            publicUrl: `https://storage.dmps.edu/object/public/${PODCAST_STORAGE_BUCKET}/${storagePath}`,
          },
        })),
        remove: vi.fn().mockImplementation(async (paths: string[]) => {
          for (const p of paths) {
            removedStoragePaths.push(p);
            storageObjects.delete(p);
          }
          return { data: paths, error: null };
        }),
      }),
    };
  });

  afterEach(() => {
    if (originalFrom) (supabase as unknown as { from: unknown }).from = originalFrom;
    if (originalStorage) (supabase as unknown as { storage: unknown }).storage = originalStorage;
    vi.restoreAllMocks();
  });

  it("REQUISITO A: Se puede crear un podcast en public.podcasts con su ID real", async () => {
    const podcast = await savePodcast({
      name: "Podcast Informativo DMPS",
      description: "Canal oficial de audio y video para familias del distrito.",
      language: "es",
      status: "draft",
    });

    expect(podcast.id).toBeTruthy();
    expect(podcast.name).toBe("Podcast Informativo DMPS");
    expect(podcast.status).toBe("draft");
    expect(tables.get("podcasts")?.some((p) => p.id === podcast.id)).toBe(true);
  });

  it("REQUISITO B: Se puede crear un episodio en public.podcast_episodes con su ID real antes de subir archivos", async () => {
    const podcast = await savePodcast({
      name: "Podcast Comunitario",
      language: "es",
    });

    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Episodio 1: Bienvenida al Ciclo Escolar",
      description: "Información para el primer día de clases.",
      episode_number: 1,
      season_number: 1,
      language: "es",
      status: "draft",
    });

    expect(episode.id).toBeTruthy();
    expect(episode.podcast_id).toBe(podcast.id);
    expect(episode.title).toBe("Episodio 1: Bienvenida al Ciclo Escolar");
    // Al crearse inicialmente, los campos de archivo deben ser nulos
    expect(episode.audio_path).toBeNull();
    expect(episode.audio_url).toBeNull();
    expect(episode.video_path).toBeNull();
    expect(episode.cover_path).toBeNull();
  });

  it("REQUISITO C & D & E: Subida de MP3 real, almacenamiento en Storage con path organizado y asociación al episodio", async () => {
    const podcast = await savePodcast({
      name: "Podcast DMPS",
      language: "es",
    });

    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Instrucciones de Transporte DART",
      episode_number: 2,
      season_number: 1,
    });

    // Archivo MP3 simulado con bytes reales
    const mp3Bytes = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x0f, 0x76]);
    const mp3File = new File([mp3Bytes], "transporte-dart.mp3", { type: "audio/mpeg" });

    // Validar tipo antes de subir
    const validation = validatePodcastMediaFile(mp3File, "audio");
    expect(validation.valid).toBe(true);
    expect(validation.mimeType).toBe("audio/mpeg");

    // Ejecutar subida y asociación
    const progressList: number[] = [];
    const result = await uploadAndAssociateEpisodeMedia({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "audio",
      file: mp3File,
      onProgress: (p) => progressList.push(p),
    });

    // D. El MP3 aparece realmente en Storage con el path estructurado
    const expectedPath = `podcasts/${podcast.id}/episodes/${episode.id}/audio.mp3`;
    expect(result.storagePath).toBe(expectedPath);
    expect(storageObjects.has(expectedPath)).toBe(true);
    expect(result.publicUrl).toContain(expectedPath);
    expect(progressList).toContain(100);

    // E. El episodio tiene audio_path, audio_url, audio_mime, audio_size
    expect(result.episode.audio_path).toBe(expectedPath);
    expect(result.episode.audio_storage_path).toBe(expectedPath);
    expect(result.episode.audio_url).toBe(result.publicUrl);
    expect(result.episode.audio_mime).toBe("audio/mpeg");
    expect(result.episode.audio_mime_type).toBe("audio/mpeg");
    expect(result.episode.audio_size).toBe(mp3Bytes.byteLength);
    expect(result.episode.audio_size_bytes).toBe(mp3Bytes.byteLength);

    // Verificar en la base de datos simulada
    const epInDb = tables.get("podcast_episodes")?.find((e) => e.id === episode.id);
    expect(epInDb?.audio_storage_path).toBe(expectedPath);
    expect(epInDb?.audio_url).toBe(result.publicUrl);
  });

  it("REQUISITO F & G: Reemplazo de MP3 sin dejar archivos huérfanos y sin eliminar el anterior antes de confirmar", async () => {
    const podcast = await savePodcast({ name: "Podcast Reemplazos", language: "es" });
    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Episodio a Modificar",
      episode_number: 1,
    });

    // 1. Subida del archivo original
    const oldMp3 = new File([new Uint8Array(1024)], "version1.mp3", { type: "audio/mpeg" });
    const initialUpload = await uploadAndAssociateEpisodeMedia({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "audio",
      file: oldMp3,
    });

    const oldPath = initialUpload.storagePath;
    expect(storageObjects.has(oldPath)).toBe(true);
    expect(removedStoragePaths).not.toContain(oldPath);

    // 2. Reemplazo por un nuevo audio (F)
    const newMp3 = new File([new Uint8Array(2048)], "version2-editada.mp3", { type: "audio/mpeg" });
    const replaced = await uploadAndAssociateEpisodeMedia({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "audio",
      file: newMp3,
      previousStoragePath: oldPath,
    });

    // G. El archivo anterior fue eliminado de Storage tras confirmar el nuevo
    expect(replaced.storagePath).not.toBe(oldPath);
    expect(storageObjects.has(replaced.storagePath)).toBe(true);
    expect(removedStoragePaths).toContain(oldPath);
    expect(storageObjects.has(oldPath)).toBe(false);

    // El episodio tiene los nuevos metadatos
    expect(replaced.episode.audio_path).toBe(replaced.storagePath);
    expect(replaced.episode.audio_size).toBe(2048);
  });

  it("REQUISITO H: Subida de portada del episodio dentro de podcasts/{podcast_id}/episodes/{episode_id}/cover.webp", async () => {
    const podcast = await savePodcast({ name: "Podcast con Portada", language: "es" });
    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Episodio Especial de Verano",
      episode_number: 3,
    });

    const coverFile = new File([new Uint8Array(4096)], "portada.webp", { type: "image/webp" });
    const result = await uploadAndAssociateEpisodeMedia({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "cover",
      file: coverFile,
    });

    const expectedCoverPath = `podcasts/${podcast.id}/episodes/${episode.id}/cover.webp`;
    expect(result.storagePath).toBe(expectedCoverPath);
    expect(storageObjects.has(expectedCoverPath)).toBe(true);
    expect(result.episode.cover_path).toBe(expectedCoverPath);
    expect(result.episode.cover_url).toBe(result.publicUrl);
  });

  it("REQUISITO I: Subida de video del episodio dentro de podcasts/{podcast_id}/episodes/{episode_id}/video.mp4", async () => {
    const podcast = await savePodcast({ name: "Podcast Video", language: "es" });
    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Sesión de Consejo Escolar",
      episode_number: 4,
    });

    const videoFile = new File([new Uint8Array(8192)], "sesion.mp4", { type: "video/mp4" });
    const result = await uploadAndAssociateEpisodeMedia({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "video",
      file: videoFile,
    });

    const expectedVideoPath = `podcasts/${podcast.id}/episodes/${episode.id}/video.mp4`;
    expect(result.storagePath).toBe(expectedVideoPath);
    expect(storageObjects.has(expectedVideoPath)).toBe(true);
    expect(result.episode.video_path).toBe(expectedVideoPath);
    expect(result.episode.video_url).toBe(result.publicUrl);
    expect(result.episode.video_mime).toBe("video/mp4");
    expect(result.episode.video_size).toBe(8192);
  });

  it("REQUISITO J: Las Storage Policies y RLS en la migración impiden que usuarios no autorizados modifiquen Storage", () => {
    const migrationFile = path.resolve(
      process.cwd(),
      "supabase/migrations/20261004000000_podcast_studio_v1.sql",
    );
    expect(fs.existsSync(migrationFile)).toBe(true);
    const sql = fs.readFileSync(migrationFile, "utf8");

    // Verificar políticas de inserción, actualización y eliminación restringidas a administradores/content managers
    expect(sql).toContain("CREATE POLICY podcast_media_staff_insert ON storage.objects");
    expect(sql).toContain(
      "WITH CHECK (bucket_id = 'podcast-media' AND public.can_manage_content())",
    );

    expect(sql).toContain("CREATE POLICY podcast_media_staff_update ON storage.objects");
    expect(sql).toContain("USING (bucket_id = 'podcast-media' AND public.can_manage_content())");

    expect(sql).toContain("CREATE POLICY podcast_media_staff_delete ON storage.objects");
    expect(sql).toContain("USING (bucket_id = 'podcast-media' AND public.can_manage_content())");

    // El público general únicamente tiene SELECT (lectura)
    expect(sql).toContain("CREATE POLICY podcast_media_public_read ON storage.objects");
    expect(sql).toContain("FOR SELECT TO anon, authenticated");
  });

  it("MANEJO DE ERRORES: Rechaza subida si el episodio no existe o no tiene ID", async () => {
    const fakeFile = new File([new Uint8Array(100)], "test.mp3", { type: "audio/mpeg" });

    await expect(
      uploadAndAssociateEpisodeMedia({
        episodeId: "",
        podcastId: "pod_123",
        role: "audio",
        file: fakeFile,
      }),
    ).rejects.toThrow(/el episodio no existe o no tiene un id real asignado/i);

    await expect(
      uploadAndAssociateEpisodeMedia({
        episodeId: "non_existent_episode",
        podcastId: "pod_123",
        role: "audio",
        file: fakeFile,
      }),
    ).rejects.toThrow(/el episodio no existe en la base de datos/i);
  });

  it("MANEJO DE ERRORES: No duplica episodios en caso de error y permite reintento seguro", async () => {
    const podcast = await savePodcast({ name: "Podcast Retries", language: "es" });
    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Episodio con Reintento",
      episode_number: 1,
    });

    const epCountBefore = (tables.get("podcast_episodes") || []).length;
    expect(epCountBefore).toBe(1);

    // Intentar subir con tipo inválido (.exe)
    const invalidFile = new File([new Uint8Array(500)], "malware.exe", {
      type: "application/x-msdownload",
    });

    await expect(
      uploadAndAssociateEpisodeMedia({
        episodeId: episode.id,
        podcastId: podcast.id,
        role: "audio",
        file: invalidFile,
      }),
    ).rejects.toThrow(/formato no compatible/i);

    // El episodio se conserva intacto y no se crearon nuevos episodios
    const epCountAfter = (tables.get("podcast_episodes") || []).length;
    expect(epCountAfter).toBe(1);

    // Reintento exitoso con archivo válido
    const validFile = new File([new Uint8Array(500)], "audio_valido.mp3", { type: "audio/mpeg" });
    const successResult = await uploadAndAssociateEpisodeMedia({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "audio",
      file: validFile,
    });

    expect(successResult.episode.id).toBe(episode.id);
    expect((tables.get("podcast_episodes") || []).length).toBe(1);
  });

  it("ELIMINACIÓN: removeEpisodeMediaFile limpia los metadatos en DB y remueve el objeto en Storage", async () => {
    const podcast = await savePodcast({ name: "Podcast Delete Media", language: "es" });
    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Episodio a Limpiar",
      episode_number: 1,
    });

    const audioFile = new File([new Uint8Array(300)], "test_clean.mp3", { type: "audio/mpeg" });
    const uploadRes = await uploadAndAssociateEpisodeMedia({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "audio",
      file: audioFile,
    });

    expect(storageObjects.has(uploadRes.storagePath)).toBe(true);

    const clearedEpisode = await removeEpisodeMediaFile({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "audio",
      storagePath: uploadRes.storagePath,
    });

    expect(clearedEpisode.audio_path).toBeNull();
    expect(clearedEpisode.audio_url).toBeNull();
    expect(removedStoragePaths).toContain(uploadRes.storagePath);
    expect(storageObjects.has(uploadRes.storagePath)).toBe(false);

    // Limpieza final del episodio y podcast
    await deletePodcastEpisode(episode.id);
    await deletePodcast(podcast.id);
    expect((tables.get("podcast_episodes") || []).length).toBe(0);
    expect((tables.get("podcasts") || []).length).toBe(0);
  });
});
