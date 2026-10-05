import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { LincolnOnly } from "@/components/lincoln-only";
import { PublicShell } from "@/components/public-shell";
import { NGOT_ARTICLES, findNgotArticle, type NgotArticle } from "@/lib/ngot-articles";
import type { GuideBlock } from "@/lib/ngot-teams";
import { useI18n } from "@/lib/i18n";
import { autoTranslateText } from "@/lib/auto-translator";

export const Route = createFileRoute("/guias/$slug")({
  loader: ({ params }) => {
    const article = findNgotArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Artículo no encontrado" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.article.title} — Lincoln High School`;
    const description =
      loaderData.article.summary ||
      "Información para familias de 9.º grado en Abraham Lincoln High School.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: GuideArticle,
});

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.]+)/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          {part}
        </a>
      );
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part)) {
      return (
        <a key={i} href={`mailto:${part}`} className="font-semibold text-primary hover:underline">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function GuideArticle() {
  const { t, lang } = useI18n();
  const tr = (val: string) => (lang === "en" ? autoTranslateText(val, "en") : val);
  const { article } = Route.useLoaderData() as { article: NgotArticle };
  const related = NGOT_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <LincolnOnly>
      <PublicShell>
        <section className="hero-wash border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
            <Link
              to="/equipos"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("guias.back")}
            </Link>
            <span className="mt-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CategoryIcon name={article.icon} className="size-6" />
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {tr(article.title)}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <BookOpen className="size-4" aria-hidden="true" />
              {t("guias.badge")}
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="space-y-6">
            {article.blocks.map((block: GuideBlock) => (
              <div key={block.heading} className="surface-card p-6 sm:p-8">
                <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {tr(block.heading)}
                </h2>
                {block.image ? (
                  <a
                    href={block.image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <img
                      src={block.image.url}
                      alt={block.image.alt}
                      className="w-full"
                      loading="lazy"
                    />
                  </a>
                ) : null}

                {block.paragraphs?.map((text: string) => (
                  <p key={text} className="mt-3 leading-relaxed text-muted-foreground">
                    {linkify(tr(text))}
                  </p>
                ))}
                {block.bullets ? (
                  <ul className="mt-4 space-y-3">
                    {block.bullets.map((bullet: string) => (
                      <li
                        key={bullet}
                        className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm leading-relaxed text-foreground/90"
                      >
                        <span
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        <span>{linkify(tr(bullet))}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          <section className="mt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-2xl font-extrabold tracking-tight">
              {t("guias.related")}
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    to="/guias/$slug"
                    params={{ slug: item.slug }}
                    className="surface-card group flex h-full flex-col gap-2 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
                  >
                    <span className="text-sm font-bold leading-snug group-hover:text-primary">
                      {item.title}
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-primary">
                      {t("guias.readMore")}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </PublicShell>
    </LincolnOnly>
  );
}
