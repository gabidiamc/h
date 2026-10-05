import { createFileRoute } from "@tanstack/react-router";
import { Phone, Users, ShieldCheck, School } from "lucide-react";

import { ContactsList } from "@/components/contacts-list";
import { PublicShell } from "@/components/public-shell";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Directorio y Tarjetas de Contacto — Lincoln & East | DMPS" },
      {
        name: "description",
        content:
          "Tarjetas de presentación y directorio de enlaces familiares bilingües, directores y departamentos de Des Moines Public Schools.",
      },
      { property: "og:title", content: "Directorio de Contactos — DMPS Family Info" },
      {
        property: "og:description",
        content:
          "Tarjetas de contacto directo para las familias de Lincoln High, East High y el distrito escolar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://familiasdmps.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 space-y-8">
        {/* Header Title */}
        <div className="border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-3">
            <School className="size-3.5" />
            <span>{selectedSchool.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {t("contact.title")}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-2xl">
            {selectedSchool.id === "lincoln"
              ? lang === "en"
                ? "Bilingual family liaisons and direct contact staff for Lincoln High School and DMPS."
                : "Enlaces familiares bilingües y equipo de contacto directo de Lincoln High School y DMPS."
              : lang === "en"
                ? "Directory of bilingual family liaisons, school administration, and district departments."
                : "Directorio de enlaces familiares bilingües, dirección escolar y departamentos del distrito."}
          </p>
        </div>

        {/* Contacts Presentation Grid */}
        <ContactsList />
      </div>
    </PublicShell>
  );
}
