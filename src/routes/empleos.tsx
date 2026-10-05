import { createFileRoute } from "@tanstack/react-router";
import { Briefcase } from "lucide-react";

import { JobBoardWidget } from "@/components/job-board";
import { PublicShell } from "@/components/public-shell";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/empleos")({
  head: () => ({
    meta: [
      { title: "Bolsa de Trabajo para Estudiantes — DMPS Family Info" },
      {
        name: "description",
        content:
          "Oportunidades de empleo verificado de medio tiempo, campamentos de verano y primeros trabajos para estudiantes de secundaria de DMPS.",
      },
      { property: "og:title", content: "Bolsa de Trabajo para Estudiantes — DMPS Family Info" },
      {
        property: "og:description",
        content:
          "Empleos verificados por la oficina de consejería para jóvenes de 14 a 18+ años en Des Moines.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://familiasdmps.app/empleos" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/empleos" }],
  }),
  component: EmpleosPage,
});

function EmpleosPage() {
  const { t } = useI18n();
  const { selectedSchool } = useSchool();
  const schoolName = selectedSchool.name;

  return (
    <PublicShell>
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-extrabold text-primary shadow-xs">
            <Briefcase className="size-4" aria-hidden="true" />
            {t("jobs.hero.badge")}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl text-foreground tracking-tight">
            {t("jobs.hero.title")}
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground leading-relaxed">
            {t("jobs.hero.subtitlePrefix")} {schoolName} {t("jobs.hero.subtitleSuffix")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <JobBoardWidget />
      </div>
    </PublicShell>
  );
}
