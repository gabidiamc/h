/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

import { ArticleCard } from "@/components/article-card";
import { CategoryIcon } from "@/components/category-icon";
import { PublicShell } from "@/components/public-shell";
import { ResourcesOverview } from "@/components/resources-overview";
import {
  fetchCategories,
  fetchPublishedArticles,
  localizedCategory,
  CATEGORIES_QUERY_OPTIONS,
} from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";
import { trackCategoryClick } from "@/analytics";

function titleize(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const Route = createFileRoute("/topics/$slug")({
  head: ({ params }) => {
    const name = titleize(params.slug);
    const title = `${name} — Recursos para familias | DMPS Family Info`;
    const description = `Artículos, guías y recursos verificados sobre ${name} para las familias de Des Moines Public Schools, en español e inglés.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        {
          property: "og:url",
          content: `https://dmps-familias.lovable.app/topics/${params.slug}`,
        },
      ],
      links: [
        { rel: "canonical", href: `https://dmps-familias.lovable.app/topics/${params.slug}` },
      ],
    };
  },
  component: TopicPage,
});

function TopicPage() {
  const { slug } = Route.useParams();
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

  const category = (categories.data ?? []).find((c) => c.slug === slug || c.id === slug);
  const loc = category ? localizedCategory(category, lang) : null;

  useEffect(() => {
    if (slug) {
      trackCategoryClick(slug, selectedSchool.id, lang);
    }
  }, [slug, selectedSchool.id, lang]);
  const list = (articles.data ?? []).filter(
    (a) =>
      a.category_id === category?.id ||
      a.category_id === category?.slug ||
      a.categories?.slug === category?.slug ||
      a.categories?.slug === category?.id,
  );

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <Link
          to="/topics"
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("categories.title")}
        </Link>

        {categories.isLoading ? (
          <Skeleton className="mt-6 h-16 w-2/3 rounded-xl" />
        ) : (
          <div>
            {Boolean((category as any)?.banner_url || (category as any)?.image_url) && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border shadow-soft">
                <img
                  src={(category as any)?.banner_url || (category as any)?.image_url}
                  alt={loc?.name ?? slug}
                  className="w-full max-h-[320px] object-cover"
                  onError={(e) => {
                    ((e.target as HTMLElement).parentElement as HTMLElement)?.style.setProperty(
                      "display",
                      "none",
                    );
                  }}
                />
              </div>
            )}
            <header className="mt-6 flex min-w-0 items-start gap-4">
              {category ? (
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft">
                  <CategoryIcon name={category.icon} className="size-7 text-primary" />
                </span>
              ) : null}
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold sm:text-4xl">{loc?.name ?? slug}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{loc?.description}</p>
              </div>
            </header>
          </div>
        )}

        <ul
          data-tutorial="category-content"
          className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {articles.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-48 w-full rounded-2xl" />
              </li>
            ))
          ) : list.length === 0 ? (
            <li className="surface-card col-span-full p-8 text-center text-muted-foreground font-medium">
              {t("category.empty")}
            </li>
          ) : (
            list.map((a) => (
              <li key={a.id}>
                <ArticleCard article={a} category={category} />
              </li>
            ))
          )}
        </ul>

        {slug === "apps" || slug === "tecnologia-escolar" ? (
          <ResourcesOverview className="mt-14" />
        ) : null}
      </div>
    </PublicShell>
  );
}
