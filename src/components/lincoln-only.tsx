import { Users } from "lucide-react";
import type { ReactNode } from "react";

import { PublicShell } from "@/components/public-shell";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { LINCOLN_SCHOOL, useSchool } from "@/lib/school";
import { normalizeSchoolId } from "@/lib/school-scope";

/** Envoltura para secciones exclusivas de Lincoln High School. */
export function LincolnOnly({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { selectedSchoolId, setSelectedSchool } = useSchool();
  const canonical = normalizeSchoolId(selectedSchoolId);

  if (canonical !== "lincoln" && canonical !== "all") {
    const rawTitle = t("lincolnOnly.title");
    const rawBody = t("lincolnOnly.body");
    const rawCta = t("lincolnOnly.cta");

    const title =
      rawTitle && rawTitle !== "lincolnOnly.title"
        ? rawTitle
        : `Contenido de ${LINCOLN_SCHOOL.name}`;
    const body =
      rawBody && rawBody !== "lincolnOnly.body"
        ? rawBody.replace("{school}", LINCOLN_SCHOOL.name)
        : `Este contenido corresponde a ${LINCOLN_SCHOOL.name}. Puedes cambiar a Lincoln para consultarlo.`;
    const cta =
      rawCta && rawCta !== "lincolnOnly.cta" ? rawCta : `Cambiar a ${LINCOLN_SCHOOL.name}`;

    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <Users className="mx-auto size-10 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-3 text-muted-foreground">{body}</p>
          <Button className="mt-6 min-h-11 rounded-xl" onClick={() => setSelectedSchool("lincoln")}>
            {cta}
          </Button>
        </div>
      </PublicShell>
    );
  }

  return <>{children}</>;
}
