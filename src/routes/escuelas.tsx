import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building,
  Calendar,
  ExternalLink,
  GraduationCap,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { EAST_SCHOOL, LINCOLN_SCHOOL, useSchool, type SchoolId } from "@/lib/school";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/escuelas")({
  head: () => ({
    meta: [
      { title: "Escuelas Secundarias — Lincoln High & East High | DMPS" },
      {
        name: "description",
        content:
          "Información sobre Abraham Lincoln High School y Des Moines East High School: directores, teléfonos, enlaces BFL y servicios de apoyo.",
      },
      { property: "og:title", content: "Escuelas Secundarias — Lincoln High & East High | DMPS" },
      {
        property: "og:description",
        content:
          "Directores, teléfonos, enlaces BFL y servicios de apoyo de las escuelas secundarias de Des Moines.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://dmps-familias.lovable.app/escuelas" },
    ],
    links: [{ rel: "canonical", href: "https://dmps-familias.lovable.app/escuelas" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: "Abraham Lincoln High School",
            parentOrganization: {
              "@type": "EducationalOrganization",
              name: "Des Moines Public Schools",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Des Moines",
              addressRegion: "IA",
              addressCountry: "US",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: "Des Moines East High School",
            parentOrganization: {
              "@type": "EducationalOrganization",
              name: "Des Moines Public Schools",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "Des Moines",
              addressRegion: "IA",
              addressCountry: "US",
            },
          },
        ]),
      },
    ],
  }),
  component: EscuelasPage,
});

function EscuelasPage() {
  const { t, lang } = useI18n();
  const { selectedSchool, setSelectedSchool, schools } = useSchool();

  return (
    <PublicShell>
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary shadow-soft mb-3">
            <School className="size-4" />
            <span>{t("schoolsPage.badge")}</span>
          </div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">{t("schoolsPage.title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {t("schoolsPage.subtitle")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-12">
        <div className="grid md:grid-cols-2 gap-8">
          {schools.map((school) => {
            const isSelected = selectedSchool.id === school.id;
            const isLincoln = school.id === "lincoln";
            const isEast = school.id === "east";

            const cardAccentClass = isLincoln
              ? isSelected
                ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20"
                : "border-border hover:border-blue-300"
              : isEast
                ? isSelected
                  ? "border-rose-600 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                  : "border-border hover:border-rose-300"
                : isSelected
                  ? "border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/20 dark:bg-teal-950/20"
                  : "border-border hover:border-teal-300";

            const badgeClass = isLincoln
              ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800"
              : isEast
                ? "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                : "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-800";

            const activePillClass = isLincoln
              ? "bg-blue-600 text-white"
              : isEast
                ? "bg-rose-600 text-white"
                : "bg-teal-600 text-white";

            const iconTextClass = isLincoln
              ? "text-blue-600 dark:text-blue-400"
              : isEast
                ? "text-rose-600 dark:text-rose-400"
                : "text-teal-600 dark:text-teal-400";

            return (
              <div
                key={school.id}
                className={`surface-card rounded-3xl p-6 sm:p-8 border-2 transition-all flex flex-col justify-between ${cardAccentClass}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold border ${badgeClass}`}
                    >
                      <ShieldCheck className="size-4" />
                      {school.mascot || school.short_name || "DMPS"}
                    </span>
                    {isSelected && (
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold ${activePillClass}`}
                      >
                        {t("schoolsPage.activeSchool")}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    {school.name}
                  </h2>
                  {school.motto && (
                    <p className={`text-sm font-semibold mt-1 ${iconTextClass}`}>{school.motto}</p>
                  )}

                  <p className="text-sm text-muted-foreground mt-4">
                    {lang === "es" ? school.description_es : school.description_en}
                  </p>

                  <div className="mt-6 space-y-2.5 text-sm">
                    {school.address && (
                      <div className="flex items-center gap-2.5 text-foreground">
                        <MapPin className={`size-4 shrink-0 ${iconTextClass}`} />
                        <span>
                          {school.address}
                          {school.cityStateZip && !school.address.includes(school.city)
                            ? `, ${school.cityStateZip}`
                            : ""}
                        </span>
                      </div>
                    )}
                    {school.phone && (
                      <div className="flex items-center gap-2.5 text-foreground">
                        <Phone className={`size-4 shrink-0 ${iconTextClass}`} />
                        <a href={`tel:${school.phone}`} className="hover:underline font-medium">
                          {t("schoolsPage.mainPhone")}: {school.phone}
                        </a>
                      </div>
                    )}
                    {school.bflPhone && (
                      <div className="flex items-center gap-2.5 text-foreground">
                        <Users className={`size-4 shrink-0 ${iconTextClass}`} />
                        <a href={`tel:${school.bflPhone}`} className="hover:underline font-medium">
                          {school.bflName || "Enlace BFL"}: {school.bflPhone}
                        </a>
                      </div>
                    )}
                    {school.principal && (
                      <div className="flex items-center gap-2.5 text-foreground">
                        <GraduationCap className={`size-4 shrink-0 ${iconTextClass}`} />
                        <span>
                          {isEast ? t("schoolsPage.principalF") : t("schoolsPage.principal")}:{" "}
                          {school.principal} {school.grades ? `(${school.grades})` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/80 flex flex-wrap gap-3">
                  <Button
                    onClick={() => setSelectedSchool(school.id)}
                    className={isSelected ? activePillClass : "variant-outline"}
                  >
                    {isSelected
                      ? isLincoln
                        ? t("schoolsPage.viewingLincoln")
                        : isEast
                          ? t("schoolsPage.viewingEast")
                          : `${t("schoolsPage.activeSchool")}: ${school.short_name}`
                      : isLincoln
                        ? t("schoolsPage.selectLincoln")
                        : isEast
                          ? t("schoolsPage.selectEast")
                          : `Seleccionar ${school.short_name || school.name}`}
                  </Button>
                  {school.officialUrl && (
                    <a
                      href={school.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold hover:underline px-3 py-2 ${iconTextClass}`}
                    >
                      <span>{t("schoolsPage.officialWebsite")}</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}
