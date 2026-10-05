import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CategoryIcon } from "@/components/category-icon";
import { PublicShell } from "@/components/public-shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchCategories,
  fetchPublishedArticles,
  localizedCategory,
  CATEGORIES_QUERY_OPTIONS,
} from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/topics/")({
  head: () => ({
    meta: [
      { title: "Artículos Informativos para Familias — DMPS Family Info" },
      {
        name: "description",
        content:
          "Explora guías y artículos de lectura sobre inscripciones, salud, comidas, transporte y apoyo escolar para las familias.",
      },
      { property: "og:title", content: "Artículos Informativos para Familias — DMPS Family Info" },
      {
        property: "og:description",
        content: "Guías e información de lectura oficial para las familias de DMPS.",
      },
      { property: "og:url", content: "https://familiasdmps.app/topics" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/topics" }],
  }),
  component: TopicsPage,
});

function TopicsPage() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const categories = useQuery({
    queryKey: ["categories", selectedSchool.id],
    queryFn: () => fetchCategories(selectedSchool.id),
    ...CATEGORIES_QUERY_OPTIONS,
  });
  const articles = useQuery({
    queryKey: ["articles", selectedSchool.id],
    queryFn: () => fetchPublishedArticles(undefined, selectedSchool.id),
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{t("categories.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("categories.subtitle")}</p>

        {categories.isLoading ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-44 w-full rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : (categories.data ?? []).length === 0 ? (
          <div className="surface-card mt-10 p-8 sm:p-10 rounded-3xl border border-border text-center max-w-2xl mx-auto space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CategoryIcon name="BookOpen" className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Estamos preparando información nueva y verificada para las familias.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Vuelve pronto para consultar artículos, eventos y recursos actualizados.
            </p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(categories.data ?? []).map((cat, index) => {
              const loc = localizedCategory(cat, lang);
              const count = (articles.data ?? []).filter(
                (a) =>
                  a.category_id === cat.id ||
                  a.category_id === cat.slug ||
                  a.categories?.slug === cat.slug ||
                  a.categories?.slug === cat.id,
              ).length;
              const bannerUrl = cat.card_banner_url || null;
              const cardBg = cat.card_bg?.trim() || null;
              const isDarkBg =
                cardBg &&
                (cardBg.includes("#0") ||
                  cardBg.includes("#1") ||
                  cardBg.includes("0f172a") ||
                  cardBg.includes("e11d48"));

              return (
                <li
                  key={cat.id}
                  className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
                  style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
                >
                  <Link
                    to="/topics/$slug"
                    params={{ slug: cat.slug }}
                    style={cardBg ? { background: cardBg } : undefined}
                    className={`surface-card category-card-animated group flex h-full flex-col justify-between overflow-hidden p-0 rounded-2xl transition-all duration-300 hover:border-primary/50 ${
                      isDarkBg ? "text-white border-white/20" : ""
                    }`}
                  >
                    {bannerUrl && (
                      <div className="relative w-full overflow-hidden border-b border-border/50 bg-muted/20">
                        <img
                          src={bannerUrl}
                          alt={loc.name}
                          className="w-full h-auto max-h-[600px] object-cover transition-transform duration-500 group-hover:scale-105 rounded-t-2xl"
                          loading="lazy"
                          onError={(e) => {
                            (
                              (e.target as HTMLElement).parentElement as HTMLElement
                            )?.style.setProperty("display", "none");
                          }}
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`category-icon-bounce grid size-11 shrink-0 place-items-center rounded-xl transition-all duration-300 ${
                            isDarkBg
                              ? "bg-white/20 text-white"
                              : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/25"
                          }`}
                        >
                          <CategoryIcon name={cat.icon} className="size-5" />
                        </span>
                        <span
                          className={`text-lg font-bold transition-colors ${
                            isDarkBg ? "text-white" : "group-hover:text-primary"
                          }`}
                        >
                          {loc.name}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-snug line-clamp-3 ${
                          isDarkBg ? "text-slate-200" : "text-muted-foreground"
                        }`}
                      >
                        {loc.description}
                      </p>

                      <div
                        className={`mt-auto pt-4 border-t flex items-center justify-between text-xs font-bold ${
                          isDarkBg ? "border-white/20 text-white" : "border-border/60 text-primary"
                        }`}
                      >
                        <span>
                          {count} {t("categories.articles")}
                        </span>
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PublicShell>
  );
}
