import { Check, Compass, GraduationCap, School, ShieldCheck, Sparkles } from "lucide-react";
import { EAST_SCHOOL, LINCOLN_SCHOOL, useSchool, type SchoolId } from "@/lib/school";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SchoolEmblem } from "@/components/school-emblem";

export function SchoolSelectorModal() {
  const { t, lang } = useI18n();
  const {
    selectedSchoolId,
    setSelectedSchool,
    isModalOpen,
    closeSchoolModal,
    isSchoolSelected,
    schools,
  } = useSchool();

  const handleSelect = (id: SchoolId) => {
    setSelectedSchool(id);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeSchoolModal()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-3xl p-0 border-border bg-card shadow-2xl">
        <div className="relative bg-gradient-to-br from-slate-900 via-primary-deep to-slate-950 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid size-10 place-items-center rounded-2xl bg-white/10 backdrop-blur text-gold">
              <GraduationCap className="size-6" />
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase text-white/90">
              Des Moines Public Schools
            </span>
          </div>
          <DialogHeader className="text-start">
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("school.selector.title")}
            </DialogTitle>
            <DialogDescription className="text-slate-200 text-sm sm:text-base mt-2">
              {t("school.selector.subtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {schools.map((school) => {
              const isSelected = selectedSchoolId === school.id && isSchoolSelected;
              return (
                <button
                  key={school.id}
                  type="button"
                  onClick={() => handleSelect(school.id)}
                  className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 text-start transition-all duration-200 hover:shadow-xl focus-visible:outline-none ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 end-4 grid size-7 place-items-center rounded-full bg-primary text-white shadow">
                      <Check className="size-4 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <SchoolEmblem
                        schoolId={school.id}
                        label={school.short_name || school.name}
                        size="md"
                      />
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold border border-primary/20">
                        <ShieldCheck className="size-3.5" />
                        {school.mascot || school.short_name || "DMPS"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {school.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">{school.motto}</p>

                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                      {lang === "es" ? school.description_es : school.description_en}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Seleccionar escuela</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {school.address}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl bg-muted/60 p-4 border border-border flex items-start gap-3 text-xs text-muted-foreground">
            <Sparkles className="size-4 shrink-0 text-gold mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-0.5">
                {t("school.selector.sharedInfoTitle")}
              </p>
              <p>{t("school.selector.sharedInfoBody")}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
