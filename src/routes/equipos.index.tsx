import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Mail, Users } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { LincolnOnly } from "@/components/lincoln-only";
import { PublicShell } from "@/components/public-shell";
import { NGOT_ARTICLES } from "@/lib/ngot-articles";
import { NGOT_TEAMS } from "@/lib/ngot-teams";
import { LINCOLN_SCHOOL } from "@/lib/school";
import { useI18n } from "@/lib/i18n";
import { autoTranslateText } from "@/lib/auto-translator";

export const Route = createFileRoute("/equipos/")({
  head: () => ({
    meta: [
      { title: "Equipos NGOT de 9.º Grado — Lincoln High School" },
      {
        name: "description",
        content:
          "Conoce los equipos ASPIRE, BREAKTHROUGH y EMPOWER de 9.º grado en Abraham Lincoln High School: maestros, contactos y horarios de oficina.",
      },
      { property: "og:title", content: "Equipos NGOT de 9.º Grado — Lincoln High School" },
      {
        property: "og:description",
        content: "Maestros, correos y horarios de oficina de cada equipo NGOT de 9.º grado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://familiasdmps.app/equipos" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/equipos" }],
  }),
  component: EquiposIndex,
});

function EquiposIndex() {
  const { t, lang } = useI18n();
  const tr = (val: string) => (lang === "en" ? autoTranslateText(val, "en") : val);

  return (
    <LincolnOnly>
      <PublicShell>
        <section className="hero-wash border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-extrabold text-primary shadow-xs">
              <Users className="size-4" aria-hidden="true" />
              {t("teams.onlyLincoln")}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {t("teams.pageTitle")}
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {t("teams.pageSubtitle")}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {NGOT_TEAMS.map((item) => {
              const staff = item.members.filter((m) => m.name);
              return (
                <Link
                  key={item.slug}
                  to="/equipos/$slug"
                  params={{ slug: item.slug }}
                  className="surface-card group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
                >
                  <span
                    className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary/70"
                    aria-hidden="true"
                  />
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Users className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-4 text-xl font-extrabold tracking-tight group-hover:text-primary">
                    {tr(item.name)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tr(item.tagline)}</p>
                  <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                    {staff.slice(0, 3).map((m) => (
                      <li key={m.subject} className="truncate">
                        <span className="font-semibold text-foreground">{tr(m.subject)}:</span>{" "}
                        {m.name}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-primary">
                    {t("teams.viewStaff")} {staff.length} {t("teams.staffMembers")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>

          <section className="mt-14" aria-labelledby="guias-heading">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
              <div className="min-w-0">
                <h2 id="guias-heading" className="text-3xl font-extrabold tracking-tight">
                  {t("teams.articlesTitle")}
                </h2>
                <p className="mt-2 text-muted-foreground">{t("teams.articlesSubtitle")}</p>
              </div>
            </div>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {NGOT_ARTICLES.map((article) => (
                <li key={article.slug}>
                  <Link
                    to="/guias/$slug"
                    params={{ slug: article.slug }}
                    className="surface-card group flex h-full flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <CategoryIcon name={article.icon} className="size-5" />
                    </span>
                    <span className="text-lg font-bold leading-snug group-hover:text-primary">
                      {tr(article.title)}
                    </span>
                    <span className="line-clamp-3 text-sm leading-snug text-muted-foreground">
                      {tr(article.summary)}
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-bold text-primary">
                      <BookOpen className="size-4" aria-hidden="true" />
                      {t("common.readMore")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-10 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" aria-hidden="true" />
            {t("teams.officialSource")}: {LINCOLN_SCHOOL.name}, {LINCOLN_SCHOOL.address},{" "}
            {LINCOLN_SCHOOL.cityStateZip} · {t("contact.phone")} {LINCOLN_SCHOOL.phone} ·
            lincoln@dmschools.org
          </p>
        </div>
      </PublicShell>
    </LincolnOnly>
  );
}
