/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCategories,
  getCachedCategories,
  getCachedCategoryLookup,
  getCachedCategoryByIdOrSlug,
  invalidateCategoriesCache,
  CATEGORIES_CACHE_TTL,
  CATEGORIES_STALE_TIME,
  CATEGORIES_GC_TIME,
  CATEGORIES_QUERY_OPTIONS,
  CATEGORIES_PUBLIC_PROJECTION,
  CATEGORIES_ADMIN_PROJECTION,
} from "@/lib/categories-service";
import { fetchPublishedArticles, fetchArticleBySlug } from "@/lib/content";
import { listRows } from "@/lib/admin";
import { notifyContentUpdated } from "@/lib/sync";

describe("STAGE 1A — public.categories Optimization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    invalidateCategoriesCache();
  });

  afterEach(() => {
    invalidateCategoriesCache();
    vi.restoreAllMocks();
  });

  it("1. Configures correct cache TTL and TanStack Query options", () => {
    expect(CATEGORIES_CACHE_TTL).toBe(5 * 60 * 1000); // 5 minutes
    expect(CATEGORIES_STALE_TIME).toBe(5 * 60 * 1000);
    expect(CATEGORIES_GC_TIME).toBe(30 * 60 * 1000); // 30 minutes
    expect(CATEGORIES_QUERY_OPTIONS.staleTime).toBe(300_000);
    expect(CATEGORIES_QUERY_OPTIONS.gcTime).toBe(1_800_000);
    expect(CATEGORIES_QUERY_OPTIONS.refetchOnWindowFocus).toBe(false);
  });

  it("2. Uses explicit projection without wildcard SELECT *", () => {
    expect(CATEGORIES_PUBLIC_PROJECTION).not.toContain("*");
    expect(CATEGORIES_PUBLIC_PROJECTION).toContain("id");
    expect(CATEGORIES_PUBLIC_PROJECTION).toContain("slug");
    expect(CATEGORIES_PUBLIC_PROJECTION).toContain("name");
    expect(CATEGORIES_PUBLIC_PROJECTION).toContain("display_order");

    expect(CATEGORIES_ADMIN_PROJECTION).not.toContain("*");
    expect(CATEGORIES_ADMIN_PROJECTION).toContain("id");
    expect(CATEGORIES_ADMIN_PROJECTION).toContain("created_at");
  });

  it("3. Correct loading and enrichment of categories", async () => {
    const mockCategoriesData = [
      {
        id: "cat-1",
        slug: "salud",
        name: "Salud y Bienestar",
        description: "Servicios médicos y salud",
        icon: "Heart",
        display_order: 1,
        is_featured: true,
        is_visible: true,
        school_id: "all",
        card_banner_url: null,
        card_bg: "#06234B",
      },
      {
        id: "cat-2",
        slug: "transporte",
        name: "Transporte",
        description: "Rutas y buses escolares",
        icon: "Bus",
        display_order: 2,
        is_featured: false,
        is_visible: true,
        school_id: "lincoln",
        card_banner_url: null,
        card_bg: null,
      },
    ];

    const mockTranslationsData = [
      {
        id: "tr-1",
        category_id: "cat-1",
        language_code: "es",
        name: "Salud y Nutrición",
        description: "Servicios de salud",
        updated_at: "2026-10-01T00:00:00Z",
      },
      {
        id: "tr-2",
        category_id: "cat-1",
        language_code: "en",
        name: "Health & Nutrition",
        description: "Health services",
        updated_at: "2026-10-01T00:00:00Z",
      },
    ];

    let categoriesSelectCalledWith = "";
    (supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockImplementation((projection: string) => {
            categoriesSelectCalledWith = projection;
            return {
              order: vi.fn().mockResolvedValue({ data: mockCategoriesData, error: null }),
            };
          }),
        } as any;
      }
      if (table === "category_translations") {
        return {
          select: vi.fn().mockResolvedValue({ data: mockTranslationsData, error: null }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    const result = await fetchCategories();

    expect((supabase as any).from).toHaveBeenCalledWith("categories");
    expect(categoriesSelectCalledWith).toBe(CATEGORIES_PUBLIC_PROJECTION);
    expect(result.length).toBe(2);
    expect(result[0].slug).toBe("salud");
    expect(result[0].name).toBe("Salud y Nutrición");
    expect(result[0].category_translations.length).toBe(2);
  });

  it("4. In-flight request deduplication: concurrent calls generate exactly ONE Supabase request", async () => {
    let callCount = 0;
    (supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockImplementation(() => {
            callCount++;
            return {
              order: vi.fn().mockImplementation(async () => {
                await new Promise((r) => setTimeout(r, 20));
                return {
                  data: [
                    {
                      id: "cat-1",
                      slug: "comida",
                      name: "Comida Escolar",
                      display_order: 1,
                      is_visible: true,
                    },
                  ],
                  error: null,
                };
              }),
            };
          }),
        } as any;
      }
      if (table === "category_translations") {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    const [resA, resB, resC] = await Promise.all([
      getCachedCategories(),
      getCachedCategories("lincoln"),
      fetchCategories("east"),
    ]);

    expect(callCount).toBe(1);
    expect(resA.length).toBe(1);
    expect(resB.length).toBe(1);
    expect(resC.length).toBe(1);
  });

  it("5. Cache TTL: subsequent calls within 5 minutes reuse cache with 0 network calls", async () => {
    let networkCalls = 0;
    (supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockImplementation(() => {
            networkCalls++;
            return {
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "cat-1",
                    slug: "deportes",
                    name: "Deportes",
                    display_order: 1,
                    is_visible: true,
                  },
                ],
                error: null,
              }),
            };
          }),
        } as any;
      }
      if (table === "category_translations") {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    const firstCall = await fetchCategories();
    expect(networkCalls).toBe(1);
    expect(firstCall[0].slug).toBe("deportes");

    const secondCall = await fetchCategories();
    expect(networkCalls).toBe(1);
    expect(secondCall[0].slug).toBe("deportes");

    const thirdCall = await fetchCategories("lincoln");
    expect(networkCalls).toBe(1);
    expect(thirdCall[0].slug).toBe("deportes");
  });

  it("6. Invalidation: invalidateCategoriesCache clears cache and triggers fresh fetch", async () => {
    let networkCalls = 0;
    (supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockImplementation(() => {
            networkCalls++;
            return {
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "cat-1",
                    slug: "general",
                    name: `General (call ${networkCalls})`,
                    display_order: 1,
                    is_visible: true,
                  },
                ],
                error: null,
              }),
            };
          }),
        } as any;
      }
      if (table === "category_translations") {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    await fetchCategories();
    expect(networkCalls).toBe(1);

    notifyContentUpdated("categories");

    const afterInvalidation = await fetchCategories();
    expect(networkCalls).toBe(2);
    expect(afterInvalidation[0].name).toBe("General (call 2)");
  });

  it("7. Article functions reuse cached categories without querying PostgREST categories table", async () => {
    const mockCatLookup = [
      {
        id: "cat-art",
        slug: "ayuda-financiera",
        name: "Ayuda Financiera",
        display_order: 1,
        is_visible: true,
      },
    ];

    let categoriesHitCount = 0;
    (supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === "categories") {
        categoriesHitCount++;
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCatLookup, error: null }),
          }),
        } as any;
      }
      if (table === "category_translations") {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any;
      }
      if (table === "articles") {
        const queryChain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "art-1",
                slug: "como-solicitar-becas",
                title: "Cómo solicitar becas",
                category_id: "cat-art",
                status: "published",
              },
            ],
            error: null,
          }),
          or: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "art-1",
                slug: "como-solicitar-becas",
                title: "Cómo solicitar becas",
                category_id: "cat-art",
                status: "published",
              },
              error: null,
            }),
          }),
        };
        return queryChain;
      }
      if (table === "article_translations") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    await fetchCategories();
    expect(categoriesHitCount).toBe(1);

    const publishedArticles = await fetchPublishedArticles();
    expect(categoriesHitCount).toBe(1);
    expect(publishedArticles.length).toBe(1);
    expect(publishedArticles[0].categories?.slug).toBe("ayuda-financiera");

    const singleArticle = await fetchArticleBySlug("como-solicitar-becas");
    expect(categoriesHitCount).toBe(1);
    expect(singleArticle?.categories?.slug).toBe("ayuda-financiera");
  });

  it("8. Admin listRows uses explicit CATEGORIES_ADMIN_PROJECTION", async () => {
    let adminSelectProjection = "";
    (supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockImplementation((projection: string) => {
            adminSelectProjection = projection;
            return {
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "cat-admin",
                    slug: "admin-cat",
                    name: "Admin Cat",
                    display_order: 1,
                  },
                ],
                error: null,
              }),
            };
          }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    const rows = await listRows("categories", "display_order", true);
    expect(rows.length).toBe(1);
    expect(adminSelectProjection).toBe(CATEGORIES_ADMIN_PROJECTION);
    expect(adminSelectProjection).not.toBe("*");
  });

  it("9. Graceful fallback on Supabase error returns cached data or empty array without crashing", async () => {
    let returnFailure = false;
    (supabase as any).from = vi.fn().mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockImplementation(async () => {
              if (returnFailure) {
                return { data: null, error: { code: "500", message: "Internal server error" } };
              }
              return {
                data: [{ id: "cat-stable", slug: "stable", name: "Estable", is_visible: true }],
                error: null,
              };
            }),
          }),
        } as any;
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) } as any;
    });

    const initial = await fetchCategories();
    expect(initial.length).toBe(1);

    invalidateCategoriesCache();
    returnFailure = true;

    const fallbackResult = await fetchCategories();
    expect(Array.isArray(fallbackResult)).toBe(true);
  });
});
