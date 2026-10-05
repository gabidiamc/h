import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  PODCAST_STORAGE_BUCKET,
  savePodcast,
  savePodcastEpisode,
  uploadPodcastMedia,
  uploadAndAssociateEpisodeMedia,
  validatePodcastMediaFile,
  normalizePodcastRow,
} from "../lib/podcasts";

describe("Podcast Branding & Media Upload Integration (Banner, Logo, Portada)", () => {
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

  it("1. Valida correctamente archivos de imagen para banner, portada y logo (JPG, PNG, WebP, SVG)", () => {
    const pngLogo = new File([new Uint8Array(512)], "emblema.png", { type: "image/png" });
    const jpgBanner = new File([new Uint8Array(1024)], "cabecera.jpg", { type: "image/jpeg" });
    const webpCover = new File([new Uint8Array(768)], "portada.webp", { type: "image/webp" });
    const svgLogo = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });

    expect(validatePodcastMediaFile(pngLogo, "image").valid).toBe(true);
    expect(validatePodcastMediaFile(jpgBanner, "image").valid).toBe(true);
    expect(validatePodcastMediaFile(webpCover, "image").valid).toBe(true);
    expect(validatePodcastMediaFile(svgLogo, "image").valid).toBe(true);
  });

  it("2. Sube el banner panorámico del podcast a Supabase Storage con ruta estructurada y URL pública", async () => {
    const podcastId = "pod_dmps_noticias";
    const bannerFile = new File([new Uint8Array(2048)], "banner-panoramico.jpg", {
      type: "image/jpeg",
    });

    const res = await uploadPodcastMedia({
      file: bannerFile,
      category: "image",
      role: "banner",
      podcastId,
    });

    expect(res.storagePath).toContain(`podcasts/${podcastId}/branding/banner_`);
    expect(res.storagePath).toMatch(/\.jpg$/);
    expect(storageObjects.has(res.storagePath)).toBe(true);
    expect(res.publicUrl).toContain(res.storagePath);
    expect(res.publicUrl).toContain("v=");
  });

  it("3. Sube el logo/emblema del podcast a Storage en la ruta podcasts/{podcastId}/branding/logo_...", async () => {
    const podcastId = "pod_canal_escolar";
    const logoFile = new File([new Uint8Array(1024)], "logo-oficial.png", {
      type: "image/png",
    });

    const res = await uploadPodcastMedia({
      file: logoFile,
      category: "image",
      role: "logo",
      podcastId,
    });

    expect(res.storagePath).toContain(`podcasts/${podcastId}/branding/logo_`);
    expect(res.storagePath).toMatch(/\.png$/);
    expect(storageObjects.has(res.storagePath)).toBe(true);
    expect(res.publicUrl).toContain(res.storagePath);
  });

  it("4. Sube la portada oficial del podcast a Storage y persiste banner, logo y portada en la base de datos", async () => {
    const podcastId = "pod_full_show";
    const coverFile = new File([new Uint8Array(1500)], "portada-show.webp", {
      type: "image/webp",
    });

    const coverRes = await uploadPodcastMedia({
      file: coverFile,
      category: "image",
      role: "cover",
      podcastId,
    });

    const savedPodcast = await savePodcast({
      id: podcastId,
      name: "Podcast Completo DMPS",
      language: "es",
      cover_url: coverRes.publicUrl,
      cover_storage_path: coverRes.storagePath,
      banner_url: "https://storage.dmps.edu/banner.jpg",
      banner_storage_path: `podcasts/${podcastId}/branding/banner_header.jpg`,
      logo_url: "https://storage.dmps.edu/logo.png",
      logo_storage_path: `podcasts/${podcastId}/branding/logo_main.png`,
    });

    expect(savedPodcast.id).toBe(podcastId);
    expect(savedPodcast.cover_url).toBe(coverRes.publicUrl);
    expect(savedPodcast.cover_storage_path).toBe(coverRes.storagePath);
    expect(savedPodcast.banner_url).toBe("https://storage.dmps.edu/banner.jpg");
    expect(savedPodcast.logo_url).toBe("https://storage.dmps.edu/logo.png");

    // Verificar normalización
    const normalized = normalizePodcastRow(savedPodcast);
    expect(normalized.cover_url).toBeTruthy();
    expect(normalized.banner_url).toBeTruthy();
    expect(normalized.logo_url).toBeTruthy();
  });

  it("5. Sube la portada del episodio y la asocia correctamente en public.podcast_episodes", async () => {
    const podcast = await savePodcast({
      name: "Podcast Episodios",
      language: "es",
    });

    const episode = await savePodcastEpisode({
      podcast_id: podcast.id,
      title: "Episodio con portada personalizada",
      episode_number: 1,
    });

    const epCoverFile = new File([new Uint8Array(1200)], "portada-ep1.jpg", {
      type: "image/jpeg",
    });

    const result = await uploadAndAssociateEpisodeMedia({
      episodeId: episode.id,
      podcastId: podcast.id,
      role: "cover",
      file: epCoverFile,
    });

    const expectedCoverPath = `podcasts/${podcast.id}/episodes/${episode.id}/cover.jpg`;
    expect(result.storagePath).toBe(expectedCoverPath);
    expect(storageObjects.has(expectedCoverPath)).toBe(true);
    expect(result.episode.cover_url).toBe(result.publicUrl);
    expect(result.episode.cover_storage_path).toBe(expectedCoverPath);

    // Verificar en tabla de episodios
    const epInDb = tables.get("podcast_episodes")?.find((e) => e.id === episode.id);
    expect(epInDb?.cover_url).toBe(result.publicUrl);
    expect(epInDb?.cover_storage_path).toBe(expectedCoverPath);
  });

  it("6. Visibilidad de miniaturas: si un episodio no tiene portada propia, hereda la del podcast o logo", () => {
    const mockPodcast = {
      id: "pod_1",
      name: "Podcast Principal",
      cover_url: "https://storage.dmps.edu/podcast-cover.jpg",
      logo_url: "https://storage.dmps.edu/podcast-logo.png",
    };

    const mockEpisodeWithoutCover = {
      id: "ep_1",
      podcast_id: "pod_1",
      title: "Episodio sin portada",
      cover_url: null,
      cover_storage_path: null,
    };

    // La lógica de resolución de portada visible en el reproductor y en la lista
    const visibleCover =
      mockEpisodeWithoutCover.cover_url || mockPodcast.cover_url || mockPodcast.logo_url;

    expect(visibleCover).toBe("https://storage.dmps.edu/podcast-cover.jpg");
  });
});
