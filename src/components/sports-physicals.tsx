import { CalendarDays, ExternalLink, HeartPulse, Stethoscope } from "lucide-react";

import { useI18n } from "@/lib/i18n";

const COPY = {
  en: {
    title: "Sports physical opportunities",
    intro:
      "Below are different opportunities for students to get a sports physical this school year. These clinics are FREE and open to all students who need a sports physical.",
    yearRound: "Free year-round clinics",
    summer: "Free summer clinics",
    clinics: "Free sports physical clinics (The Iowa Clinic)",
    clinicsNote:
      "The form is provided on site, but for faster processing we recommend completing the first two pages before arriving at the building.",
    signUp: "Sign up / more info",
    moreInfo: "More info",
    disclaimer: "Dates and times may change. Confirm with the school or the clinic before going.",
  },
  es: {
    title: "Oportunidades de examen físico deportivo",
    intro:
      "Estas son las oportunidades para que los estudiantes obtengan su examen físico deportivo este año escolar. Estas clínicas son GRATUITAS y están abiertas a todos los estudiantes que necesiten el examen físico.",
    yearRound: "Clínicas gratuitas todo el año",
    summer: "Clínicas gratuitas de verano",
    clinics: "Clínicas gratuitas de examen físico (The Iowa Clinic)",
    clinicsNote:
      "El formulario se entrega en el lugar, pero para agilizar el proceso recomendamos completar las primeras dos páginas antes de llegar al edificio.",
    signUp: "Registrarse / más información",
    moreInfo: "Más información",
    disclaimer:
      "Las fechas y horarios pueden cambiar. Confirme con la escuela o la clínica antes de asistir.",
  },
};

const YEAR_ROUND = [
  {
    label: "DMPS Clinics",
    url: "https://activities.dmschools.org/wp-content/uploads/sites/24/2022/02/DMPS-Clinics-Poster-2022.png",
  },
  {
    label: "Free Clinics of Iowa",
    url: "https://www.fciowa.org/_files/ugd/011769_558cabceec294d9aa3a9060b43a0a08f.pdf",
  },
];

const SUMMER = [
  {
    date: "Jul 22",
    label: "Des Moines University Clinics · 10:00am-6:00pm",
    url: "https://calendar.dmu.edu/event/back_to_school_physicals",
  },
  {
    date: "Jul 23",
    label: "Iowa Ortho · 5:30-8:00pm",
    url: "https://www.iowaortho.com/free-sports-physicals/",
  },
];

const IOWA_CLINIC = [
  {
    date: "Aug 5",
    label: "North HS · 4:00-6:00pm",
    url: "https://www.signupgenius.com/go/70A0449AFA72BAA8-64534145-free#/",
  },
  {
    date: "Aug 18",
    label: "Harding MS · 4:00-6:00pm",
    url: "https://www.signupgenius.com/go/70A0449AFA72BAA8-64534120-free#/",
  },
  {
    date: "Aug 19",
    label: "Weeks MS · 4:00-6:00pm",
    url: "https://www.signupgenius.com/go/70A0449AFA72BAA8-64534117-free#/",
  },
  {
    date: "Aug 20",
    label: "Hoyt MS · 4:00-6:00pm",
    url: "https://www.signupgenius.com/go/70A0449AFA72BAA8-64534133-free#/",
  },
  {
    date: "Aug 24",
    label: "Hiatt MS · 4:00-6:00pm",
    url: "https://www.signupgenius.com/go/70A0449AFA72BAA8-64534074-free#/",
  },
  {
    date: "Aug 25",
    label: "Callanan MS · 4:00-6:00pm",
    url: "https://www.signupgenius.com/go/70A0449AFA72BAA8-64534101-free#/",
  },
  {
    date: "Aug 27",
    label: "McCombs MS · 4:00-6:00pm",
    url: "https://www.signupgenius.com/go/70A0449AFA72BAA8-64534092-free#/",
  },
];
const ACTIVITIES_URL = "https://www.dmschools.org/activities/";

export function SportsPhysicals() {
  const { lang } = useI18n();
  const c = lang === "en" ? COPY.en : COPY.es;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary-soft p-2 text-primary">
            <HeartPulse className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">{c.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Stethoscope className="size-4 text-primary" />
              {c.yearRound}
            </h3>
            <ul className="mt-3 space-y-2">
              {YEAR_ROUND.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {item.label}
                    <ExternalLink className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarDays className="size-4 text-primary" />
              {c.summer}
            </h3>
            <ul className="mt-3 space-y-2">
              {SUMMER.map((item) => (
                <li key={item.date} className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{item.date}</span> — {item.label}{" "}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {c.moreInfo}
                    <ExternalLink className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold text-foreground">{c.clinics}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{c.clinicsNote}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {IOWA_CLINIC.map((item) => (
              <li
                key={item.date}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-semibold text-foreground">{item.date}</span>{" "}
                  <span className="text-muted-foreground">{item.label}</span>
                </span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {c.signUp}
                  <ExternalLink className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={ACTIVITIES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            DMPS Activities
            <ExternalLink className="size-3.5" />
          </a>
          <p className="text-xs text-muted-foreground">{c.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
