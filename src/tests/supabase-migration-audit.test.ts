/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { REALTIME_TABLES } from "../lib/sync";
import { upsertRow, deleteRow, listRows } from "../lib/admin";
import * as storageEngine from "../lib/storage-engine";
import { supabase } from "@/integrations/supabase/client";
import fs from "node:fs";
import path from "node:path";

describe("Auditoría de Persistencia y Única Fuente de Verdad Supabase", () => {
  let originalFrom: any;

  beforeEach(() => {
    originalFrom = (supabase as any).from;
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    if (originalFrom) {
      (supabase as any).from = originalFrom;
    }
    vi.restoreAllMocks();
  });

  it("TEST 1: articles upsert exitoso cuando Supabase está disponible", async () => {
    const mockArticle = {
      id: "art_test_101",
      slug: "articulo-exitoso",
      title: "Artículo Exitoso",
      summary: "Resumen exitoso",
      status: "published",
      verification_status: "verified",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const fromMock = vi.fn().mockImplementation((tableName: string) => {
      if (tableName === "articles") {
        return {
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
            }),
          }),
        };
      }
      // Translations table returns success
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    });
    (supabase as any).from = fromMock;

    const result = await upsertRow("articles", {
      id: "art_test_101",
      slug: "articulo-exitoso",
      title: "Artículo Exitoso",
      summary: "Resumen exitoso",
    });

    expect(result).toBeDefined();
    expect(result.id).toBe("art_test_101");
    expect(result.title).toBe("Artículo Exitoso");
    expect(fromMock).toHaveBeenCalledWith("articles");
  });

  it("TEST 2: articles upsert falla cuando Supabase rechaza la operación", async () => {
    const fromMock = vi.fn().mockImplementation(() => ({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: "42501", message: "permission denied for table articles" },
          }),
        }),
      }),
    }));
    (supabase as any).from = fromMock;

    await expect(
      upsertRow("articles", {
        slug: "articulo-denegado",
        title: "No Autorizado",
      }),
    ).rejects.toThrow(/permission denied for table articles/);
  });

  it("TEST 3: PGRST205 NO genera falso éxito (lanza excepción obligatoriamente)", async () => {
    const fromMock = vi.fn().mockImplementation(() => ({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "PGRST205",
              message: "Could not find the table 'public.articles' in the schema cache",
            },
          }),
        }),
      }),
    }));
    (supabase as any).from = fromMock;

    await expect(
      upsertRow("articles", {
        slug: "articulo-pgrst205",
        title: "Artículo PGRST205",
      }),
    ).rejects.toThrow(/PGRST205/);
  });

  it("TEST 4: PGRST205 NO escribe articles en localStorage", async () => {
    const fromMock = vi.fn().mockImplementation(() => ({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "PGRST205",
              message: "Could not find the table 'public.articles' in the schema cache",
            },
          }),
        }),
      }),
    }));
    (supabase as any).from = fromMock;

    try {
      await upsertRow("articles", {
        id: "art_leaked_test",
        slug: "articulo-leaked",
        title: "Articulo Que No Debe Ir a LocalStorage",
      });
    } catch {
      // Error esperado de Supabase
    }

    if (typeof window !== "undefined" && window.localStorage) {
      expect(window.localStorage.getItem("dmps_db_articles")).toBeNull();
      expect(window.localStorage.getItem("dmps_store_articles")).toBeNull();
      expect(window.localStorage.getItem("dmps_article_bottom_nav_art_leaked_test")).toBeNull();
    }
  });

  it("TEST 5: Después de guardar, SELECT desde Supabase devuelve el artículo actualizado", async () => {
    const updatedArticle = {
      id: "art_verify_select",
      slug: "articulo-actualizado",
      title: "Título Actualizado en PostgreSQL",
      summary: "Resumen confirmado",
      status: "published",
    };

    const fromMock = vi.fn().mockImplementation((tableName: string) => {
      if (tableName === "articles") {
        return {
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: updatedArticle, error: null }),
            }),
          }),
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [updatedArticle],
              error: null,
            }),
          }),
        };
      }
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    });
    (supabase as any).from = fromMock;

    const saved = await upsertRow("articles", updatedArticle);
    expect(saved.title).toBe("Título Actualizado en PostgreSQL");

    const fetchedRows = await listRows("articles");
    expect(fetchedRows.length).toBeGreaterThan(0);
    expect(fetchedRows[0].title).toBe("Título Actualizado en PostgreSQL");
    expect(fromMock).toHaveBeenCalledWith("articles");
  });

  it("TEST 6: article_translations persiste realmente y propaga error si falla", async () => {
    const fromMock = vi.fn().mockImplementation((tableName: string) => {
      if (tableName === "article_translations") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: "PGRST205",
                  message: "Could not find table 'public.article_translations' in schema cache",
                },
              }),
            }),
          }),
        };
      }
      return {};
    });
    (supabase as any).from = fromMock;

    await expect(
      upsertRow("article_translations", {
        id: "tr_art_with_tr_es",
        article_id: "art_with_tr",
        language_code: "es",
        title: "Con Traducciones",
      }),
    ).rejects.toThrow(/article_translations/);
  });

  it("TEST 7: appearance_settings persiste realmente y falla si Supabase rechaza", async () => {
    const fromMock = vi.fn().mockImplementation(() => ({
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: "PGRST205",
              message: "Could not find table 'public.appearance_settings' in schema cache",
            },
          }),
        }),
      }),
    }));
    (supabase as any).from = fromMock;

    await expect(
      upsertRow("appearance_settings", {
        id: "default",
        site_title: "DMPS Test Title",
      }),
    ).rejects.toThrow(/appearance_settings/);
  });

  it("TEST 8: recarga de datos obtiene información directamente desde Supabase sin shadow DB", async () => {
    const remoteArticles = [
      {
        id: "art_fresh_1",
        slug: "slug-fresh",
        title: "Artículo Remoto Fresco",
        status: "published",
      },
    ];

    const fromMock = vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: remoteArticles,
          error: null,
        }),
      }),
    }));
    (supabase as any).from = fromMock;

    const rows = await listRows("articles");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject(remoteArticles[0]);
    expect(rows[0].title).toBe("Artículo Remoto Fresco");
  });

  it("TEST 9: deleteRow lanza error cuando Supabase falla", async () => {
    const fromMock = vi.fn().mockImplementation(() => ({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: { code: "PGRST205", message: "Table not found in schema cache" },
        }),
      }),
    }));
    (supabase as any).from = fromMock;

    await expect(deleteRow("articles", "art_999")).rejects.toThrow(/PGRST205/);
  });

  it("TEST 10: Migración SQL contiene todas las tablas requeridas y configuración RLS", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20260830000000_core_dmps_tables.sql",
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, "utf8");

    const requiredTables = [
      "appearance_settings",
      "site_settings",
      "schools",
      "school_translations",
      "categories",
      "category_translations",
      "articles",
      "article_translations",
      "contacts",
      "resources",
      "social_media_channels",
      "social_media_posts",
      "announcements",
      "events",
      "programs",
      "student_programs",
      "activities",
      "faqs",
      "user_roles",
    ];

    expect(sql).toContain("ENABLE ROW LEVEL SECURITY;");
    for (const table of requiredTables) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(sql).toContain(`'${table}'`);
    }
  });

  it("TEST 11: Storage Engine opera estrictamente sin shadow DB", async () => {
    const fetched = await storageEngine.fetchTableFromStorage("articles");
    expect(fetched).toEqual([]);
    const cached = storageEngine.readFromUnifiedStorage("articles");
    expect(cached).toBeNull();
  });

  it("TEST 12: Supabase Realtime incluye todas las tablas de contenido requeridas", () => {
    const requiredRealtime = [
      "articles",
      "article_translations",
      "categories",
      "category_translations",
      "schools",
      "school_translations",
      "announcements",
      "announcement_translations",
      "events",
      "event_translations",
      "faqs",
      "faq_translations",
      "contacts",
      "appearance_settings",
      "site_settings",
      "social_media_channels",
      "social_media_posts",
      "resources",
    ];

    for (const table of requiredRealtime) {
      expect((REALTIME_TABLES as readonly string[]).includes(table)).toBe(true);
    }
    expect((REALTIME_TABLES as readonly string[]).includes("public_menu_items")).toBe(false);
  });

  it("TEST 13: Tablas vacías en Supabase devuelven 0 registros sin cargar SEED_* ni INITIAL_*", async () => {
    const emptyQueryChain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase as any).from = vi.fn().mockReturnValue(emptyQueryChain);

    const { fetchCategories, fetchPublishedArticles, fetchFaqs } = await import("../lib/content");
    const { fetchSchools, fetchContacts, fetchEvents, fetchPrograms, fetchActivities } =
      await import("../lib/directory");
    const { fetchResources } = await import("../lib/resources");
    const { fetchSocialMediaChannels, fetchSocialMediaPosts } = await import("../lib/social-media");
    const { fetchDartRoutes } = await import("../lib/dart");

    expect(await listRows("categories")).toEqual([]);
    expect(await listRows("articles")).toEqual([]);
    expect(await listRows("schools")).toEqual([]);
    expect(await listRows("resources")).toEqual([]);
    expect(await listRows("contacts")).toEqual([]);
    expect(await fetchCategories()).toEqual([]);
    expect(await fetchPublishedArticles()).toEqual([]);
    expect(await fetchFaqs()).toEqual([]);
    expect(await fetchSchools()).toEqual([]);
    expect(await fetchContacts()).toEqual([]);
    expect(await fetchEvents()).toEqual([]);
    expect(await fetchPrograms()).toEqual([]);
    expect(await fetchActivities()).toEqual([]);
    expect(await fetchResources("lincoln")).toEqual([]);
    expect(await fetchSocialMediaChannels()).toEqual([]);
    expect(await fetchSocialMediaPosts()).toEqual([]);
    expect(await fetchDartRoutes()).toEqual([]);
  });

  it("TEST 14: Archivos seed antiguos (20260830000001_core_dmps_seed.sql, school-content-data.ts, server-seeds.ts) fueron eliminados", () => {
    expect(
      fs.existsSync(
        path.resolve(process.cwd(), "supabase/migrations/20260830000001_core_dmps_seed.sql"),
      ),
    ).toBe(false);
    expect(fs.existsSync(path.resolve(process.cwd(), "src/lib/school-content-data.ts"))).toBe(
      false,
    );
    expect(fs.existsSync(path.resolve(process.cwd(), "src/lib/server-seeds.ts"))).toBe(false);
  });
});
