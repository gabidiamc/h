import { createFileRoute } from "@tanstack/react-router";
import { Compass, RotateCcw } from "lucide-react";

import { ContactsList } from "@/components/contacts-list";
import { openAppTutorial, resetAppOnboarding } from "@/components/onboarding-tutorial";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "Accesibilidad — DMPS Family Info" },
      {
        name: "description",
        content:
          "Cómo este sitio cumple con WCAG 2.1 AA y cómo pedir ayuda o reportar una barrera de accesibilidad.",
      },
      { property: "og:title", content: "Accesibilidad — DMPS Family Info" },
      {
        property: "og:description",
        content: "Nuestro compromiso con un sitio accesible para cada familia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://familiasdmps.app/accessibility" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/accessibility" }],
  }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  const { t } = useI18n();

  const points = [
    t("accessibility.point1"),
    t("accessibility.point2"),
    t("accessibility.point3"),
    t("accessibility.point4"),
    t("accessibility.point5"),
    t("accessibility.point6"),
  ];

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{t("accessibility.title")}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{t("accessibility.subtitle")}</p>
        <ul className="mt-10 space-y-3">
          {points.map((point) => (
            <li key={point} className="surface-card flex gap-3 p-5 text-lg">
              <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {/* Tutorial and Onboarding Actions */}
        <section className="mt-12 surface-card p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-foreground">
            {t("onboarding.welcome.title")}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">{t("onboarding.welcome.text")}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button
              size="lg"
              onClick={openAppTutorial}
              className="min-h-12 rounded-xl bg-primary text-primary-foreground font-bold px-5 gap-2"
            >
              <Compass className="size-5" />
              <span>{t("onboarding.reopen")}</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={resetAppOnboarding}
              className="min-h-12 rounded-xl font-semibold gap-2"
            >
              <RotateCcw className="size-4 text-muted-foreground" />
              <span>{t("onboarding.resetWelcome")}</span>
            </Button>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-3xl font-extrabold">{t("contact.title")}</h2>
          <p className="mt-2 text-lg text-muted-foreground">{t("contacts.subtitle")}</p>
          <div className="mt-6">
            <ContactsList />
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
