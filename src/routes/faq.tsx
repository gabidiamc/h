import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, Search, ShieldCheck, PhoneCall } from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFaqs, localizedFaq } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";
import { trackFaqOpen } from "@/analytics";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Preguntas Frecuentes — DMPS & Lincoln High Info" },
      {
        name: "description",
        content:
          "Respuestas claras y reales a las preguntas más frecuentes de las familias sobre Lincoln High School y el portal.",
      },
      { property: "og:title", content: "Preguntas Frecuentes — DMPS & Lincoln High Info" },
      {
        property: "og:description",
        content: "Respuestas oficiales a preguntas comunes de familias de Lincoln High y DMPS.",
      },
      { property: "og:url", content: "https://familiasdmps.app/faq" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/faq" }],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { t, lang } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedSchool } = useSchool();
  const faqs = useQuery({
    queryKey: ["faqs", selectedSchool.id],
    queryFn: () => fetchFaqs(selectedSchool.id),
  });

  const rawList = faqs.data ?? [];
  const filteredFaqs = rawList.filter((f) => {
    if (!searchTerm.trim()) return true;
    const loc = localizedFaq(f, lang);
    const q = searchTerm.toLowerCase();
    return loc.question.toLowerCase().includes(q) || loc.answer.toLowerCase().includes(q);
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* TOP HEADER HERO */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-extrabold text-primary border border-primary/20">
            <HelpCircle className="size-4 text-primary" />
            <span>{t("faq.badge")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
            {t("faq.title")}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {t("faq.intro")}
          </p>

          {/* SEARCH BAR */}
          <div className="pt-2">
            <div className="relative max-w-lg">
              <Search className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                aria-label={t("faq.searchAria")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("faq.searchPlaceholder")}
                className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* FAQ ACCORDION LIST */}
        {faqs.isLoading ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
            {t("faq.searchEmpty")}
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="mt-8 space-y-3"
            onValueChange={(value) => {
              if (value) {
                trackFaqOpen(value, selectedSchool.id, lang);
              }
            }}
          >
            {filteredFaqs.map((f, index) => {
              const loc = localizedFaq(f, lang);
              return (
                <AccordionItem
                  key={f.id}
                  value={f.id}
                  className="surface-card rounded-2xl border border-border px-5 py-1 transition-all duration-200 data-[state=open]:border-primary/40 data-[state=open]:shadow-md"
                >
                  <AccordionTrigger className="py-4 text-start text-base sm:text-lg font-bold hover:no-underline text-foreground">
                    <span className="flex items-center gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                        {index + 1}
                      </span>
                      <span>{loc.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pl-9 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {loc.answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* BOTTOM HELPFUL CONTACT PROMPT */}
        <div className="mt-12 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-start">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-primary">
              <ShieldCheck className="size-4 text-primary" />
              <span>{t("faq.helpBadge")}</span>
            </div>
            <h3 className="text-xl font-extrabold text-foreground">{t("faq.helpTitle")}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">{t("faq.helpBody")}</p>
          </div>

          <Link
            to="/lincoln"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-xs shrink-0"
          >
            <PhoneCall className="size-4" />
            <span>{t("faq.helpCta")}</span>
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
