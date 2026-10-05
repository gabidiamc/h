import { ChevronDown, GraduationCap } from "lucide-react";
import { useSchool } from "@/lib/school";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { SchoolEmblem } from "@/components/school-emblem";

export function SchoolSelectorButton({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const { selectedSchool, setSelectedSchool, openSchoolModal, schools } = useSchool();

  const isLincoln = selectedSchool.id === "lincoln";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-tutorial="school-selector"
          variant="outline"
          size="sm"
          className={`h-10 rounded-xl px-3 font-semibold gap-2 border-border transition-all bg-card hover:bg-muted ${className}`}
          aria-label={t("school.button.switch")}
        >
          <SchoolEmblem
            schoolId={selectedSchool.id}
            label={selectedSchool.short_name || selectedSchool.name}
            size="sm"
          />
          <div className="flex flex-col items-start text-start leading-none">
            <span className="text-xs font-bold text-foreground">
              {selectedSchool.short_name || selectedSchool.name}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {selectedSchool.mascot || "DMPS"}
            </span>
          </div>
          <ChevronDown className="size-3.5 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2 shadow-xl border-border">
        <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("school.button.selectHighSchool")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />

        {schools.map((school) => {
          const isSelected = selectedSchool.id === school.id;
          const isSchoolLincoln = school.id === "lincoln";
          const isSchoolEast = school.id === "east";

          return (
            <DropdownMenuItem
              key={school.id}
              onClick={() => setSelectedSchool(school.id)}
              className={`flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition-colors ${
                isSelected
                  ? isSchoolLincoln
                    ? "bg-blue-500/10 font-bold text-blue-700 dark:text-blue-400"
                    : isSchoolEast
                      ? "bg-rose-500/10 font-bold text-rose-700 dark:text-rose-400"
                      : "bg-teal-500/10 font-bold text-teal-700 dark:text-teal-400"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <SchoolEmblem
                schoolId={school.id}
                label={school.short_name || school.name}
                size="md"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{school.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {school.mascot || school.short_name} • {school.address || school.city}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={() => openSchoolModal()}
          className="rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <GraduationCap className="size-3.5 mr-2" />
          {t("school.button.compareProfiles")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
