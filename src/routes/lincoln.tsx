import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  Briefcase,
  Bus,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Info,
  Laptop,
  MapPin,
  Phone,
  School,
  Smartphone,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useState } from "react";

import { JobBoardWidget } from "@/components/job-board";
import { PublicShell } from "@/components/public-shell";
import { ResourcesOverview } from "@/components/resources-overview";
import { PendingVerificationNote, VerificationNote } from "@/components/verification-note";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPrograms, fetchSchools, localizedProgram, ProgramRow } from "@/lib/directory";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

const LINCOLN_URL = "https://lincoln.dmschools.org/";
const DMPS_URL = "https://www.dmschools.org/";
const DART_URL = "https://www.ridedart.com/";

export const Route = createFileRoute("/lincoln")({
  head: () => ({
    meta: [
      { title: "Lincoln High School — Programs, Silver Cord & Family Info" },
      {
        name: "description",
        content:
          "Lincoln High School Silver Cord volunteer program, free DART passes, college credits, technology laptops, and verified school resources.",
      },
      {
        property: "og:title",
        content: "Lincoln High School — Programs, Silver Cord & Family Info",
      },
      {
        property: "og:description",
        content:
          "Verified Lincoln High School student programs, Silver Cord room, and free family services.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://familiasdmps.app/lincoln" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/lincoln" }],
  }),
  component: LincolnPage,
});

function officialLinks(t: (key: string) => string) {
  return [
    { name: t("lincoln.link.lincolnOfficial"), url: LINCOLN_URL },
    {
      name: t("lincoln.link.silverCordVolunteering"),
      url: "https://lincoln.dmschools.org/students/silver-cord/",
    },
    { name: "Des Moines Public Schools", url: DMPS_URL },
    { name: t("lincoln.link.dart"), url: DART_URL },
  ];
}

function LincolnPage() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const schoolName = selectedSchool.name;
  const isEast = selectedSchool.id === "east";
  const [selectedProgram, setSelectedProgram] = useState<ProgramRow | null>(null);

  const schools = useQuery({ queryKey: ["schools"], queryFn: fetchSchools });
  const activeSchoolData =
    (schools.data ?? []).find((s) => (isEast ? /east/i.test(s.name) : /lincoln/i.test(s.name))) ??
    null;

  const programs = useQuery({
    queryKey: ["programs", selectedSchool.id],
    queryFn: () => fetchPrograms(selectedSchool.id),
  });

  // Filter programs relevant to selected school
  const schoolPrograms = (programs.data ?? []).filter((p) => {
    if (isEast) {
      return (
        /east/i.test(p.name) ||
        /east/i.test(p.school_level ?? "") ||
        p.id.includes("east") ||
        p.id.includes("dart") ||
        p.id.includes("dmps-free-meals")
      );
    }
    return (
      /lincoln/i.test(p.name) ||
      /lincoln/i.test(p.school_level ?? "") ||
      p.id.includes("lincoln") ||
      p.id.includes("dart") ||
      p.id.includes("dmps-free-meals")
    );
  });

  return (
    <PublicShell>
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary shadow-soft">
            <School className="size-4" aria-hidden="true" />
            {schoolName}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">
            {t("lincoln.hero.title").replace("{{school}}", schoolName)}
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
            {t("lincoln.hero.subtitle").replace("{{school}}", schoolName)}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-12">
        {/* LINCOLN SILVER CORD HIGHLIGHT BANNER */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-primary/5 p-6 sm:p-8 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                <Award className="size-4 text-amber-600 dark:text-amber-400" />
                {t("lincoln.silverCord.badge")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {t("lincoln.silverCord.title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t("lincoln.silverCord.body")}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-foreground pt-1">
                <span className="flex items-center gap-1.5 rounded-lg bg-card/80 px-3 py-1.5 border border-border">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  {t("lincoln.silverCord.badge150")}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-card/80 px-3 py-1.5 border border-border">
                  <GraduationCap className="size-4 text-primary" />
                  {t("lincoln.silverCord.badgeCord")}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg bg-card/80 px-3 py-1.5 border border-border">
                  <Sparkles className="size-4 text-amber-500" />
                  {t("lincoln.silverCord.badgeFree")}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
              <Button
                size="lg"
                className="rounded-xl font-bold gap-2 min-h-12 text-base shadow-sm"
                onClick={() => {
                  const sc = schoolPrograms.find((p) => p.id === "prog-lincoln-silver-cord");
                  if (sc) setSelectedProgram(sc);
                }}
              >
                <Award className="size-5" />
                {t("lincoln.silverCord.viewDetails")}
              </Button>

              <a
                href="https://lincoln.dmschools.org/students/silver-cord/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-input bg-background px-5 text-sm font-bold text-primary hover:bg-accent hover:text-accent-foreground"
              >
                <ExternalLink className="size-4" />
                {t("lincoln.silverCord.officialPage")}
              </a>
            </div>
          </div>
        </div>

        {/* MOBILE APPS BANNER */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary-soft p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary">
                  <Smartphone className="size-4 text-primary" />
                  {t("lincoln.apps.badge")}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {t("lincoln.apps.title")}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("lincoln.apps.body")}
                </p>
              </div>

              <Link
                to="/topics/$slug"
                params={{
                  slug: "apps",
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-sm shrink-0 w-full md:w-auto"
              >
                <Smartphone className="size-5" />
                {t("lincoln.apps.viewAll")}
              </Link>
            </div>

            {/* QUICK LINKS TO THE 4 CUBICLES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <Link
                to="/articles/$slug"
                params={{ slug: "app-infinite-campus-parent-padres" }}
                className="group flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    {t("lincoln.apps.parents")}
                  </div>
                  <div className="text-sm font-extrabold text-card-foreground truncate group-hover:text-primary">
                    Campus Parent
                  </div>
                </div>
                <Smartphone className="size-5 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>

              <Link
                to="/articles/$slug"
                params={{ slug: "app-infinite-campus-student-estudiantes" }}
                className="group flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    {t("lincoln.apps.students")}
                  </div>
                  <div className="text-sm font-extrabold text-card-foreground truncate group-hover:text-primary">
                    Campus Student
                  </div>
                </div>
                <Smartphone className="size-5 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>

              <Link
                to="/articles/$slug"
                params={{ slug: "app-parentsquare-comunicacion-escuela" }}
                className="group flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    {t("lincoln.apps.messaging")}
                  </div>
                  <div className="text-sm font-extrabold text-card-foreground truncate group-hover:text-primary">
                    ParentSquare
                  </div>
                </div>
                <Smartphone className="size-5 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>

              <Link
                to="/articles/$slug"
                params={{ slug: "app-mydart-transit-transporte-escolar-gratis" }}
                className="group flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    {t("lincoln.apps.freeTransit")}
                  </div>
                  <div className="text-sm font-extrabold text-card-foreground truncate group-hover:text-primary">
                    myDART Transit
                  </div>
                </div>
                <Bus className="size-5 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        {/* DEDICATED LINCOLN HIGH SCHOOL JOB BOARD SECTION */}
        <JobBoardWidget className="mt-8" />

        {/* DEDICATED RESOURCES OVERVIEW COMPONENT */}
        <ResourcesOverview className="mt-8" />

        {/* LINCOLN FREE PROGRAMS ROOM GRID */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="size-6 text-primary" />
                <span>{t("lincoln.programs.title")}</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("lincoln.programs.subtitle").replace("{{school}}", schoolName)}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schoolPrograms.map((p) => {
              const loc = localizedProgram(p, lang);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProgram(p)}
                  className="surface-card flex flex-col justify-between p-5 transition-all hover:border-primary/50 hover:shadow-lift cursor-pointer rounded-2xl border border-border/80 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase text-primary">
                        {p.program_type}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {t("lincoln.programs.free")}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {loc.name}
                    </h3>

                    {loc.summary ? (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {loc.summary}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary">
                    <span>{t("lincoln.programs.viewDetails")}</span>
                    <ExternalLink className="size-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SCHOOL GENERAL INFORMATION */}
        <div>
          <h2 className="text-2xl font-bold">{t("lincoln.school.title")}</h2>
          {schools.isLoading ? (
            <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
          ) : activeSchoolData ? (
            <div className="mt-4 space-y-4">
              <div className="surface-card p-6 rounded-2xl">
                <h3 className="text-xl font-bold">{activeSchoolData.name}</h3>
                {activeSchoolData.address ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    {activeSchoolData.address}
                    {activeSchoolData.city ? `, ${activeSchoolData.city}` : ""}
                  </p>
                ) : null}
                {activeSchoolData.phone ? (
                  <p className="mt-1">
                    <a
                      href={`tel:${activeSchoolData.phone.replace(/[^0-9+]/g, "")}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-primary"
                    >
                      <Phone className="size-4 shrink-0" aria-hidden="true" />
                      {activeSchoolData.phone}
                    </a>
                  </p>
                ) : null}
                {activeSchoolData.hours ? (
                  <p className="mt-1 text-muted-foreground">{activeSchoolData.hours}</p>
                ) : null}
              </div>
              <VerificationNote
                sourceName={schoolName}
                sourceUrl={activeSchoolData.website_url ?? LINCOLN_URL}
                reviewedAt={activeSchoolData.verified_at ?? null}
                entityType="schools"
                entityId={activeSchoolData.id}
              />
            </div>
          ) : (
            <div className="mt-4">
              <PendingVerificationNote what={t("lincoln.school.pendingWhat")} />
            </div>
          )}
        </div>

        {/* OFFICIAL LINKS */}
        <div>
          <h2 className="text-2xl font-bold">{t("lincoln.links.title")}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {officialLinks(t).map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="surface-card flex h-full min-h-24 flex-col justify-between gap-2 p-5 transition-shadow hover:shadow-lift rounded-2xl border"
                >
                  <span className="text-base font-bold">{l.name}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-primary">
                    {t("lincoln.links.open")}
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* POPUP MODAL DIALOG FOR DETAILED PROGRAM INFORMATION */}
      <Dialog open={!!selectedProgram} onOpenChange={(open) => !open && setSelectedProgram(null)}>
        {selectedProgram ? (
          <DialogContent className="max-w-xl rounded-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase text-primary">
                  {selectedProgram.program_type}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {selectedProgram.cost ?? t("lincoln.programs.free")}
                </span>
              </div>

              <DialogTitle className="text-2xl font-extrabold text-foreground leading-snug">
                {localizedProgram(selectedProgram, lang).name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {localizedProgram(selectedProgram, lang).name} details
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                {selectedProgram.school_level ? (
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <School className="size-4 text-primary shrink-0" />
                    <span>{selectedProgram.school_level}</span>
                  </div>
                ) : null}
                {selectedProgram.grades ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="size-4 text-primary shrink-0" />
                    <span>{selectedProgram.grades}</span>
                  </div>
                ) : null}
              </div>

              {localizedProgram(selectedProgram, lang).description ? (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t("lincoln.dialog.description")}
                  </h4>
                  <p className="text-foreground leading-relaxed">
                    {localizedProgram(selectedProgram, lang).description}
                  </p>
                </div>
              ) : null}

              {localizedProgram(selectedProgram, lang).requirements ? (
                <div className="space-y-1.5 rounded-xl border border-border p-3.5 bg-card">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-primary" />
                    {t("lincoln.dialog.requirements")}
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {localizedProgram(selectedProgram, lang).requirements}
                  </p>
                </div>
              ) : null}

              {localizedProgram(selectedProgram, lang).application_process ? (
                <div className="space-y-1.5 rounded-xl border border-border p-3.5 bg-card">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Info className="size-4 text-primary" />
                    {t("lincoln.dialog.howToApply")}
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {localizedProgram(selectedProgram, lang).application_process}
                  </p>
                </div>
              ) : null}

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="size-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {t("lincoln.dialog.verifiedNote").replace(
                    "{{school}}",
                    activeSchoolData?.name ?? schoolName,
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              {selectedProgram.official_url ? (
                <a
                  href={selectedProgram.official_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-xs"
                >
                  <ExternalLink className="size-4" />
                  {t("lincoln.dialog.officialSite")}
                </a>
              ) : null}

              <Button
                variant="outline"
                className="min-h-11 rounded-xl font-bold"
                onClick={() => setSelectedProgram(null)}
              >
                {t("lincoln.dialog.close")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </PublicShell>
  );
}
