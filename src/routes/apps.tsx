import { createFileRoute } from "@tanstack/react-router";

import { PublicShell } from "@/components/public-shell";
import { ResourcesOverview } from "@/components/resources-overview";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/apps")({
  head: () => ({
    meta: [
      { title: "Aplicaciones Oficiales para Familias — DMPS Family Info" },
      {
        name: "description",
        content:
          "Todas las aplicaciones oficiales para las familias de DMPS: Infinite Campus Parent y Student, ParentSquare y myDART, con enlaces directos a App Store y Google Play.",
      },
      { property: "og:title", content: "Aplicaciones Oficiales para Familias — DMPS Family Info" },
      {
        property: "og:description",
        content: "Descarga las apps oficiales del distrito con enlaces verificados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://familiasdmps.app/apps" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/apps" }],
  }),
  component: AppsPage,
});

function AppsPage() {
  const { t } = useI18n();

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{t("apps.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("apps.subtitle")}</p>
        <ResourcesOverview className="mt-10" />
      </div>
    </PublicShell>
  );
}
