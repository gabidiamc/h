import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, GraduationCap, Info, School } from "lucide-react";
import { useMemo, useState } from "react";

import { PublicShell } from "@/components/public-shell";
import { ReportInfoDialog } from "@/components/report-info-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPrograms, localizedProgram, ProgramRow } from "@/lib/directory";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";
import { CATEGORY_LABELS, fetchStudentPrograms, programCategories } from "@/lib/student-programs";
import { trackProgramClick } from "@/analytics";

export const Route = createFileRoute("/programas")({
  head: () => ({
    meta: [
      { title: "School programs — DMPS Family Info" },
      {
        name: "description",
        content:
          "Preschool, Lincoln Silver Cord, special education, English language support, arts, STEM, career and college readiness, summer and family programs at DMPS.",
      },
      { property: "og:title", content: "School programs — DMPS Family Info" },
      {
        property: "og:description",
        content: "Academic, arts, language, health, Lincoln High Silver Cord and family programs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://familiasdmps.app/programas" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/programas" }],
  }),
  component: ProgramsPage,
});

function ProgramsPage() {
  const { t, lang } = useI18n();
  const { selectedSchool } = useSchool();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramRow | null>(null);

  const programs = useQuery({
    queryKey: ["programs", selectedSchool.id],
    queryFn: () => fetchPrograms(selectedSchool.id),
  });

  const studentPrograms = useQuery({
    queryKey: ["student_programs", selectedSchool.id, lang],
    queryFn: () => fetchStudentPrograms(selectedSchool.id === "east" ? "east" : "lincoln", lang),
  });

  const types = useMemo(
    () => Array.from(new Set((programs.data ?? []).map((p) => p.program_type))).sort(),
    [programs.data],
  );

  const filtered = (programs.data ?? []).filter((p) => {
    if (type && p.program_type !== type) return false;
    if (openOnly && !p.enrollment_open) return false;

    // Filter by school
    const currentSchoolId = selectedSchool.id === "east" ? "sch-east" : "sch-lincoln";
    if (p.school_id && p.school_id !== "all" && p.school_id !== currentSchoolId) {
      return false;
    }

    const isLincolnProgram =
      p.school_level?.toLowerCase().includes("lincoln") ||
      p.name?.toLowerCase().includes("lincoln") ||
      p.slug?.toLowerCase().includes("lincoln") ||
      p.id?.toLowerCase().includes("lincoln");

    const isEastProgram =
      p.school_level?.toLowerCase().includes("east") ||
      p.name?.toLowerCase().includes("east") ||
      p.slug?.toLowerCase().includes("east") ||
      p.id?.toLowerCase().includes("east");

    if (selectedSchool.id === "lincoln" && isEastProgram && !isLincolnProgram) return false;
    if (selectedSchool.id === "east" && isLincolnProgram && !isEastProgram) return false;

    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    const loc = localizedProgram(p, lang);
    return `${loc.name} ${loc.summary ?? ""} ${p.grades ?? ""} ${p.school_level ?? ""}`
      .toLowerCase()
      .includes(needle);
  });

  return (
    <PublicShell>
      <section className="hero-wash border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-primary shadow-soft">
            <GraduationCap className="size-4" aria-hidden="true" />
            {t("programs.title")}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">{t("programs.title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t("programs.subtitle")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="surface-card grid gap-3 p-4 sm:grid-cols-3 rounded-2xl">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("common.search")}
            aria-label={t("common.search")}
            className="min-h-11 rounded-xl text-base"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label={t("programs.allTypes")}
            className="min-h-11 rounded-xl border border-input bg-background px-3 text-base"
          >
            <option value="">{t("programs.allTypes")}</option>
            {types.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="size-5 rounded text-primary focus:ring-primary"
            />
            {t("programs.open")}
          </label>
        </div>

        {programs.isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-8 text-muted-foreground">{t("programs.none")}</p>
        ) : (
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {filtered.map((p) => {
              const loc = localizedProgram(p, lang);
              const bannerSrc = p.card_banner_url || p.image_url;
              const cardBg = p.card_bg?.trim() || null;
              const isDarkBg =
                cardBg &&
                (cardBg.includes("#0") ||
                  cardBg.includes("#1") ||
                  cardBg.includes("0f172a") ||
                  cardBg.includes("e11d48"));

              return (
                <li
                  key={p.id}
                  onClick={() => {
                    trackProgramClick(p.id, selectedSchool.id, {
                      program_type: p.program_type,
                    });
                    setSelectedProgram(p);
                  }}
                  style={cardBg ? { background: cardBg } : undefined}
                  className={`surface-card flex h-full flex-col justify-between overflow-hidden p-0 rounded-2xl border transition-all hover:border-primary/50 hover:shadow-lift cursor-pointer group ${
                    isDarkBg ? "text-white border-white/20" : ""
                  }`}
                >
                  {bannerSrc && (
                    <div className="relative w-full overflow-hidden border-b border-border/50 bg-muted/20">
                      <img
                        src={bannerSrc}
                        alt={loc.name}
                        className="w-full h-auto max-h-[600px] object-cover transition-transform duration-300 group-hover:scale-[1.02] rounded-t-2xl"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                            isDarkBg ? "bg-white/20 text-white" : "bg-primary-soft text-primary"
                          }`}
                        >
                          {p.program_type}
                        </span>
                        {p.is_free ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                              isDarkBg
                                ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
                                : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {t("programs.free")}
                          </span>
                        ) : null}
                        {p.enrollment_open ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                              isDarkBg
                                ? "bg-amber-500/30 text-amber-200 border border-amber-400/40"
                                : "bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            {t("programs.open")}
                          </span>
                        ) : null}
                      </div>

                      <h2
                        className={`text-xl font-bold transition-colors leading-snug ${
                          isDarkBg ? "text-white" : "group-hover:text-primary"
                        }`}
                      >
                        {loc.name}
                      </h2>

                      {loc.summary ? (
                        <p
                          className={`text-sm leading-relaxed line-clamp-3 ${
                            isDarkBg ? "text-slate-200" : "text-muted-foreground"
                          }`}
                        >
                          {loc.summary}
                        </p>
                      ) : null}

                      {p.school_level ? (
                        <p
                          className={`text-xs font-semibold flex items-center gap-1.5 pt-1 ${
                            isDarkBg ? "text-sky-300" : "text-primary"
                          }`}
                        >
                          <School className="size-3.5" />
                          {p.school_level} {p.grades ? `· ${p.grades}` : ""}
                        </p>
                      ) : null}
                    </div>

                    <div
                      className={`mt-5 pt-3 border-t flex items-center justify-between text-xs font-bold ${
                        isDarkBg ? "border-white/20 text-white" : "border-border/60 text-primary"
                      }`}
                    >
                      <span>{t("programs.viewDetailsHowToJoin")}</span>
                      <ExternalLink className="size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-12 border-t border-border pt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">
                {t("programs.studentProgramsTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {t("programs.studentProgramsSubtitle")} {selectedSchool.name}.
              </p>
            </div>
            <Link
              to="/programas-estudiantes"
              className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-bold text-primary hover:bg-secondary"
            >
              {t("programs.viewAll")}
            </Link>
          </div>

          {studentPrograms.isLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-2xl" />
              ))}
            </div>
          ) : (studentPrograms.data ?? []).length === 0 ? (
            <p className="mt-6 text-muted-foreground">{t("programs.noVerifiedPrograms")}</p>
          ) : (
            <ul className="mt-6 grid gap-5 md:grid-cols-2">
              {(studentPrograms.data ?? []).map((sp) => (
                <li
                  key={sp.id}
                  className="surface-card flex h-full flex-col justify-between rounded-2xl border p-5"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {programCategories(sp).map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase text-primary"
                        >
                          {CATEGORY_LABELS[c] ?? c}
                        </span>
                      ))}
                      {sp.enrollment_status === "open" ? (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase text-amber-800 dark:text-amber-300">
                          {t("programs.applicationOpen")}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold leading-snug">{sp.name}</h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {sp.description_es}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3">
                    <Link
                      to="/programas-estudiantes"
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {t("common.viewDetails")}
                    </Link>
                    {sp.official_url ? (
                      <a
                        href={sp.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        {t("programs.officialSource")}
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <ReportInfoDialog entityType="programs" />
        </div>
      </section>

      {/* DETAILED PROGRAM MODAL */}
      <Dialog open={!!selectedProgram} onOpenChange={(open) => !open && setSelectedProgram(null)}>
        {selectedProgram ? (
          <DialogContent className="max-w-xl rounded-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold uppercase text-primary">
                  {selectedProgram.program_type}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {selectedProgram.cost ?? t("programs.free")}
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
                    {t("programs.description")}
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
                    {t("programs.requirements")}
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
                    {t("programs.howToApply")}
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {localizedProgram(selectedProgram, lang).application_process}
                  </p>
                </div>
              ) : null}
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
                  {t("programs.howToJoin")}
                </a>
              ) : null}

              <Button
                variant="outline"
                className="min-h-11 rounded-xl font-bold"
                onClick={() => setSelectedProgram(null)}
              >
                {t("sports.close")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </PublicShell>
  );
}
