import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PublicShell } from "@/components/public-shell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EAST_SCHOOL, LINCOLN_SCHOOL, useSchool } from "@/lib/school";
import type { CanonicalSchoolId } from "@/lib/school-scope";
import {
  CATEGORY_LABELS,
  PROGRAM_FILTERS,
  fetchStudentPrograms,
  matchesFilter,
  programCategories,
  programLines,
  programLinks,
  type ProgramFilter,
  type StudentProgramRow,
} from "@/lib/student-programs";
import { trackProgramClick } from "@/analytics";

const TITLE = "Programas y oportunidades para estudiantes";
const DESCRIPTION =
  "Programas de universidad, empleo, tecnología, arte, liderazgo, voluntariado y transporte separados por escuela: Abraham Lincoln High School y Des Moines East High School.";

export const Route = createFileRoute("/programas-estudiantes")({
  head: () => ({
    meta: [
      { title: `${TITLE} — DMPS Familias` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} — DMPS Familias` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://familiasdmps.app/programas-estudiantes" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/programas-estudiantes" }],
  }),
  component: StudentProgramsPage,
});

function StudentProgramsPage() {
  const { t, lang } = useI18n();
  const { selectedSchoolId } = useSchool();
  const [filter, setFilter] = useState<ProgramFilter>("all");

  const activeSchool = (selectedSchoolId as CanonicalSchoolId | null) ?? null;

  const programs = useQuery({
    queryKey: ["student-programs", activeSchool, lang],
    queryFn: () => fetchStudentPrograms(activeSchool as CanonicalSchoolId, lang),
    enabled: activeSchool !== null,
  });

  const visible = useMemo(
    () => (programs.data ?? []).filter((row) => matchesFilter(row, filter)),
    [programs.data, filter],
  );

  const schoolInfo = activeSchool === "east" ? EAST_SCHOOL : LINCOLN_SCHOOL;

  return (
    <PublicShell>
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-extrabold text-primary shadow-xs">
            <GraduationCap className="size-4" aria-hidden="true" />
            {t("studentPrograms.badge")}
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {t("studentPrograms.title")}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("studentPrograms.subtitle")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {activeSchool === null ? (
          <p className="rounded-2xl bg-secondary p-5 text-base text-muted-foreground">
            {t("studentPrograms.chooseSchool")}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${schoolInfo.colors?.badgeBg ?? ""}`}
              >
                <Users className="size-4" aria-hidden="true" />
                {schoolInfo.name}
              </span>
              <a
                href={schoolInfo.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {t("studentPrograms.officialSite")}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </div>

            <nav aria-label={t("studentPrograms.filterAria")} className="mt-5">
              <ul className="flex flex-wrap gap-2">
                {PROGRAM_FILTERS.map((f) => {
                  const isActive = filter === f.value;
                  return (
                    <li key={f.value}>
                      <button
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          setFilter(f.value);
                          trackProgramClick(`filter:${f.value}`, activeSchool, {
                            filter: f.value,
                          });
                        }}
                        className={`min-h-11 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground/80 hover:bg-secondary"
                        }`}
                      >
                        {f.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {programs.isLoading ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                ))}
              </div>
            ) : programs.error ? (
              <p className="mt-8 rounded-xl bg-destructive/10 p-4 text-destructive">
                {t("studentPrograms.loadError")}
              </p>
            ) : visible.length === 0 ? (
              <p className="mt-8 rounded-2xl bg-secondary p-5 text-muted-foreground">
                {t("studentPrograms.noneForFilter")} {schoolInfo.name}.
              </p>
            ) : (
              <ul className="mt-8 grid gap-5 lg:grid-cols-2">
                {visible.map((row) => (
                  <li key={row.id}>
                    <ProgramCard row={row} schoolName={schoolInfo.name} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}

function ProgramCard({ row, schoolName }: { row: StudentProgramRow; schoolName: string }) {
  const { t } = useI18n();
  const links = programLinks(row);
  const steps = programLines(row.how_to_participate);
  const cats = programCategories(row);
  const isDart = cats.includes("transporte");

  return (
    <article
      className={`surface-card flex h-full flex-col p-5 sm:p-6 ${
        row.is_featured ? "border-primary/40 shadow-lift" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Users className="size-3.5" aria-hidden="true" />
          {schoolName}
        </span>
        {cats.map((c) => (
          <span
            key={c}
            className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground"
          >
            {CATEGORY_LABELS[c] ?? c}
          </span>
        ))}
      </div>

      <h3 className="mt-3 text-xl font-extrabold leading-snug tracking-tight">{row.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{row.description_es}</p>

      <dl className="mt-4 space-y-2 text-sm">
        {row.audience ? (
          <div>
            <dt className="font-bold text-foreground">{t("studentPrograms.audience")}</dt>
            <dd className="text-muted-foreground">{row.audience}</dd>
          </div>
        ) : null}
        {row.cost ? (
          <div>
            <dt className="font-bold text-foreground">{t("studentPrograms.cost")}</dt>
            <dd className="text-muted-foreground">{row.cost}</dd>
          </div>
        ) : null}
        {row.enrollment_status === "open" || row.enrollment_status === "closed" ? (
          <div>
            <dt className="font-bold text-foreground">{t("studentPrograms.enrollment")}</dt>
            <dd className="inline-flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="size-4" aria-hidden="true" />
              {row.enrollment_status === "open"
                ? t("studentPrograms.enrollmentOpen")
                : t("studentPrograms.enrollmentClosed")}
              {row.enrollment_note ? ` — ${row.enrollment_note}` : ""}
            </dd>
          </div>
        ) : row.enrollment_note ? (
          <div>
            <dt className="font-bold text-foreground">{t("studentPrograms.datesOrEnrollment")}</dt>
            <dd className="text-muted-foreground">{row.enrollment_note}</dd>
          </div>
        ) : null}
        {row.address ? (
          <div>
            <dt className="font-bold text-foreground">{t("studentPrograms.address")}</dt>
            <dd className="inline-flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {row.address}
            </dd>
          </div>
        ) : null}
        {row.phone ? (
          <div>
            <dt className="font-bold text-foreground">{t("studentPrograms.phone")}</dt>
            <dd className="inline-flex items-center gap-1.5">
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              <a href={`tel:${row.phone.replace(/[^\d+]/g, "")}`} className="hover:underline">
                {row.phone}
              </a>
            </dd>
          </div>
        ) : null}
        {row.email ? (
          <div>
            <dt className="font-bold text-foreground">{t("studentPrograms.email")}</dt>
            <dd className="inline-flex items-center gap-1.5">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <a href={`mailto:${row.email}`} className="hover:underline">
                {row.email}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      {steps.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
          <h4 className="text-sm font-extrabold">{t("studentPrograms.howToParticipate")}</h4>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {steps.map((step) => (
              <li key={step} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {row.requirements ? (
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>{row.requirements}</span>
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {row.official_url ? (
          <Button asChild className="min-h-11 rounded-xl font-bold">
            <a href={row.official_url} target="_blank" rel="noopener noreferrer">
              {t("studentPrograms.viewOfficialProgram")}
              <ExternalLink className="ms-1.5 size-4" aria-hidden="true" />
            </a>
          </Button>
        ) : null}
        {isDart ? (
          <>
            <Button asChild variant="outline" className="min-h-11 rounded-xl font-bold">
              <Link to="/transporte/dart">{t("studentPrograms.checkRoutes")}</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 rounded-xl font-bold">
              <Link to="/transporte/dart">{t("studentPrograms.findRide")}</Link>
            </Button>
          </>
        ) : null}
        {links.map((link) => (
          <Button
            key={link.url}
            asChild
            variant="outline"
            className="min-h-11 rounded-xl font-semibold"
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
              <ExternalLink className="ms-1.5 size-3.5" aria-hidden="true" />
            </a>
          </Button>
        ))}
      </div>

      <p className="mt-auto pt-4 text-xs text-muted-foreground">
        <BadgeCheck className="me-1 inline size-3.5 align-[-2px]" aria-hidden="true" />
        {row.verified_at
          ? `${t("studentPrograms.lastVerified")} ${formatDate(row.verified_at)}`
          : t("studentPrograms.noVerificationDate")}
      </p>
    </article>
  );
}

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}
