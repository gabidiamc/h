import { createFileRoute } from "@tanstack/react-router";

import { PublicShell } from "@/components/public-shell";
import { LincolnOnly } from "@/components/lincoln-only";
import { useI18n } from "@/lib/i18n";
import bellSchedule from "@/assets/bell-schedule.jpg.asset.json";

export const Route = createFileRoute("/horario-campanas")({
  head: () => ({
    meta: [
      { title: "Horario de Campanas 2026-2027 — Lincoln High School" },
      {
        name: "description",
        content:
          "Horario de campanas 2026-2027 de Lincoln High School: horas de cada periodo, almuerzo A y almuerzo B.",
      },
      { property: "og:title", content: "Horario de Campanas 2026-2027 — Lincoln High School" },
      {
        property: "og:description",
        content: "Consulta las horas de cada periodo y los almuerzos A y B.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://familiasdmps.app/horario-campanas" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/horario-campanas" }],
  }),
  component: BellSchedulePage,
});

function BellSchedulePage() {
  const { t } = useI18n();

  return (
    <LincolnOnly>
      <PublicShell>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h1 className="text-4xl font-extrabold sm:text-5xl">{t("bell.title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("bell.subtitle")}</p>

          <a
            href={bellSchedule.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block overflow-hidden rounded-2xl border bg-card shadow-sm"
          >
            <img src={bellSchedule.url} alt={t("bell.title")} className="w-full" loading="lazy" />
          </a>
        </div>
      </PublicShell>
    </LincolnOnly>
  );
}
