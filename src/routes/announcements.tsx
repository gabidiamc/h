import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";

import { OfficialAnnouncementsCenter } from "@/components/official-announcements-center";
import { PublicShell } from "@/components/public-shell";
import { fetchActiveAnnouncements } from "@/lib/content";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Centro de Avisos Oficiales — DMPS Family Info" },
      {
        name: "description",
        content:
          "Alertas climáticas, cierres de nieve, retrasos y noticias oficiales de Des Moines Public Schools.",
      },
      { property: "og:title", content: "Centro de Avisos Oficiales — DMPS Family Info" },
      {
        property: "og:description",
        content: "Feed oficial de avisos y alertas para familias de DMPS.",
      },
      { property: "og:url", content: "https://familiasdmps.app/announcements" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/announcements" }],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { t } = useI18n();
  const { selectedSchool } = useSchool();
  const announcements = useQuery({
    queryKey: ["announcements", selectedSchool.id],
    queryFn: () => fetchActiveAnnouncements(selectedSchool.id),
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t("announcements.hero.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("announcements.hero.subtitle")}</p>
        <div className="mt-8">
          <OfficialAnnouncementsCenter
            announcements={announcements.data ?? []}
            isLoading={announcements.isLoading}
            onRefresh={() => announcements.refetch()}
          />
        </div>
      </div>
    </PublicShell>
  );
}
