import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Mail, Users } from "lucide-react";

import { LincolnOnly } from "@/components/lincoln-only";
import { PublicShell } from "@/components/public-shell";
import { findNgotTeam, type NgotTeam, type TeamMember } from "@/lib/ngot-teams";
import { useI18n } from "@/lib/i18n";
import { autoTranslateText } from "@/lib/auto-translator";

export const Route = createFileRoute("/equipos/$slug")({
  loader: ({ params }) => {
    const team = findNgotTeam(params.slug);
    if (!team) throw notFound();
    return { team };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Equipo no encontrado" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.team.name} — Lincoln High School`;
    const description = `Maestros, correos y horarios de oficina del ${loaderData.team.name} de 9.º grado en Abraham Lincoln High School.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: TeamDetail,
});

function TeamDetail() {
  const { team } = Route.useLoaderData() as { team: NgotTeam };
  const { lang, t } = useI18n();
  const tr = (val: string) => (lang === "en" ? autoTranslateText(val, "en") : val);

  return (
    <LincolnOnly>
      <PublicShell>
        <section className="hero-wash border-b border-border">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
            <Link
              to="/equipos"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {lang === "en" ? "Back to teams" : "Volver a los equipos"}
            </Link>
            <span className="mt-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {tr(team.name)}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">{tr(team.tagline)}</p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <ul className="grid gap-4 sm:grid-cols-2">
            {team.members.map((member: TeamMember) => (
              <li
                key={`${team.slug}-${member.subject}`}
                className="surface-card flex flex-col p-5 transition-shadow hover:shadow-lift"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {tr(member.subject)}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {member.name ? member.name : lang === "en" ? "To be assigned" : "Por asignar"}
                </p>
                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="mt-2 inline-flex min-h-11 items-center gap-2 break-all text-sm font-semibold text-primary hover:underline"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    {member.email}
                  </a>
                ) : null}
                <p className="mt-auto flex items-start gap-2 pt-3 text-sm text-muted-foreground">
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {member.officeHours
                    ? tr(member.officeHours)
                    : lang === "en"
                      ? "Hours to be confirmed"
                      : "Horario por confirmar"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </PublicShell>
    </LincolnOnly>
  );
}
