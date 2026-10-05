import { Mail, Phone, Globe, GraduationCap } from "lucide-react";

import { useI18n } from "@/lib/i18n";

type Liaison = {
  name: string;
  phone: string;
  phoneHref: string;
  email: string;
  website?: string;
};

const LIAISONS: Liaison[] = [
  {
    name: "Brenda Lucero",
    phone: "515-371-7143",
    phoneHref: "tel:+15153717143",
    email: "brenda.lucero@dmschools.org",
  },
  {
    name: "Veronica Ortiz",
    phone: "515-829-5522",
    phoneHref: "tel:+15158295522",
    email: "veronica.ortiz@dmschools.org",
    website: "https://www.dmschools.org",
  },
];

/** Bilingual Family Liaison cards (Lincoln High School only). */
export function LincolnLiaisons() {
  const { t } = useI18n();

  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {LIAISONS.map((p) => (
        <li key={p.email} className="surface-card space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold leading-tight">{p.name}</h3>
              <p className="text-sm font-semibold text-primary">{t("liaisons.role")}</p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="size-6" aria-hidden="true" />
            </span>
          </div>

          <p className="text-sm text-muted-foreground">{t("liaisons.office")}</p>

          <div className="space-y-2 border-t border-border/60 pt-3">
            <p className="flex items-center gap-2 text-sm">
              <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <a className="font-semibold hover:underline" href={p.phoneHref}>
                {p.phone}
              </a>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <a className="font-semibold break-all hover:underline" href={`mailto:${p.email}`}>
                {p.email}
              </a>
            </p>
            {p.website ? (
              <p className="flex items-center gap-2 text-sm">
                <Globe className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <a
                  className="font-semibold hover:underline"
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.dmschools.org
                </a>
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
