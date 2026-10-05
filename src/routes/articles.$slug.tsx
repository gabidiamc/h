import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getSchoolById, useSchool } from "@/lib/school";
import { normalizeSchoolId } from "@/lib/school-scope";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck, Printer, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { ArticleBlocks } from "@/components/article-blocks";
import { ArticleBottomNav } from "@/components/article-bottom-nav";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchArticleBySlug,
  fetchCategories,
  localizedArticle,
  localizedCategory,
  logPageView,
  sendFeedback,
  CATEGORIES_QUERY_OPTIONS,
} from "@/lib/content";
import { useI18n } from "@/lib/i18n";

function titleize(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const Route = createFileRoute("/articles/$slug")({
  head: ({ params }) => {
    const name = titleize(params.slug);
    const title = `${name} — DMPS Family Info`;
    const description = `Guía clara y verificada sobre ${name} para las familias de Des Moines Public Schools, disponible en español e inglés con contactos y próximos pasos.`;
    const url = `https://dmps-familias.lovable.app/articles/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: name,
            description,
            inLanguage: ["es", "en"],
            mainEntityOfPage: url,
            publisher: {
              "@type": "EducationalOrganization",
              name: "Des Moines Public Schools",
            },
          }),
        },
      ],
    };
  },
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { selectedSchool, setSelectedSchool } = useSchool();
  const schoolId = normalizeSchoolId(selectedSchool.id);
  const [sent, setSent] = useState(false);
  const contentLang: "es" | "en" = lang === "en" ? "en" : "es";

  const article = useQuery({
    queryKey: ["article", slug],
    queryFn: () => fetchArticleBySlug(slug),
  });
  const categories = useQuery({
    queryKey: ["categories", selectedSchool.id],
    queryFn: () => fetchCategories(selectedSchool.id),
    ...CATEGORIES_QUERY_OPTIONS,
  });

  useEffect(() => {
    if (article.data?.id) void logPageView(article.data.id, contentLang);
  }, [article.data?.id, contentLang]);

  const data = article.data;
  const rawSchoolId = data?.school_id;
  const owner = normalizeSchoolId(rawSchoolId);

  // An article is considered foreign ONLY when:
  // 1. Article data has loaded
  // 2. The user has a specific school selected (not "all")
  // 3. The article is explicitly scoped to a single specific school (not undefined/null, and owner !== "all", "district", "global")
  // 4. That owner school does NOT match the currently active school (owner !== schoolId)
  const isExplicitlyScoped =
    Boolean(rawSchoolId) && owner !== "all" && owner !== "district" && owner !== "global";
  const isForeign = Boolean(data) && schoolId !== "all" && isExplicitlyScoped && owner !== schoolId;
  const loc = data ? localizedArticle(data, contentLang, schoolId ?? undefined) : null;
  const category = (categories.data ?? []).find((c) => c.id === data?.category_id);

  if (isForeign) {
    const otherSchool = getSchoolById(owner);
    const otherSchoolName = otherSchool.name;
    const currentSchoolName = selectedSchool.name;
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
            Contenido exclusivo de {otherSchoolName}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Actualmente estás navegando con <strong>{currentSchoolName}</strong>. Este artículo
            contiene información y reglamentos específicos de <strong>{otherSchoolName}</strong>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button className="min-h-11 rounded-xl" onClick={() => setSelectedSchool(owner)}>
              Cambiar a {otherSchoolName}
            </Button>
            <Link to="/topics">
              <Button variant="outline" className="min-h-11 rounded-xl">
                Volver a Temas
              </Button>
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {category ? (
          <Link
            to="/topics/$slug"
            params={{ slug: category.slug }}
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t("article.back")} {localizedCategory(category, lang).name}
          </Link>
        ) : null}

        {article.isLoading || !loc ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-12 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {(loc.bannerUrl || data?.card_banner_url || data?.featured_image_url) && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-sm">
                <img
                  src={loc.bannerUrl || data?.card_banner_url || data?.featured_image_url || ""}
                  alt={loc.title || "Banner del artículo"}
                  className="w-full h-auto max-h-[480px] object-cover"
                  loading="eager"
                />
              </div>
            )}

            <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">{loc.title}</h1>
            {loc.summary ? (
              <p className="mt-4 text-xl text-muted-foreground">{loc.summary}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground border-y border-border/60 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                  <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("article.verifiedBadge")}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <CalendarCheck className="size-3.5 text-primary" />
                  <span>
                    {t("article.lastReviewedLabel")}{" "}
                    {new Date(
                      data!.updated_at || data!.published_at || Date.now(),
                    ).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>

              <Button
                variant="outline"
                className="min-h-10 gap-2 rounded-xl text-xs font-bold"
                onClick={() => window.print()}
              >
                <Printer className="size-3.5" aria-hidden="true" />
                {t("article.print")}
              </Button>
            </div>

            {loc.isFallback ? (
              <p className="mt-6 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-base font-medium">
                {t("article.notTranslated")}
              </p>
            ) : null}

            <div className="mt-10">
              <ArticleBlocks blocks={loc.blocks} />
            </div>

            {/* Navegación al pie del artículo: Botón Volver y Siguiente */}
            <ArticleBottomNav
              bottomNav={data?.bottom_nav}
              category={category}
              currentSlug={slug}
              lang={contentLang}
            />

            <section className="surface-card mt-12 p-6" aria-labelledby="feedback-heading">
              <h2 id="feedback-heading" className="text-lg font-bold">
                {t("article.helpful")}
              </h2>
              {sent ? (
                <p className="mt-3 font-medium text-leaf-foreground">{t("article.thanks")}</p>
              ) : (
                <div className="mt-4 flex gap-3">
                  <Button
                    className="min-h-11 rounded-xl px-6"
                    onClick={() => {
                      if (data) void sendFeedback(data.id, true);
                      setSent(true);
                    }}
                  >
                    {t("article.yes")}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11 rounded-xl px-6"
                    onClick={() => {
                      if (data) void sendFeedback(data.id, false);
                      setSent(true);
                    }}
                  >
                    {t("article.no")}
                  </Button>
                </div>
              )}
            </section>
          </>
        )}
      </article>
    </PublicShell>
  );
}
