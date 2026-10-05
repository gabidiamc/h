import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Compass,
  FileText,
  Heart,
  HeartHandshake,
  Info,
  Layers,
  Lightbulb,
  Megaphone,
  School,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/quienes-somos")({
  head: () => ({
    meta: [
      { title: "Quiénes somos — DMPS Info" },
      {
        name: "description",
        content:
          "Conoce qué es DMPS Info, su propósito comunitario, su independencia por diseño, su visión de futuro y quién está detrás del proyecto.",
      },
      { property: "og:title", content: "Quiénes somos — DMPS Info" },
      {
        property: "og:description",
        content:
          "Un proyecto independiente creado para hacer la información más fácil de encontrar, entender y utilizar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://familiasdmps.app/quienes-somos" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/quienes-somos" }],
  }),
  component: QuienesSomosPage,
});

function QuienesSomosPage() {
  const { lang } = useI18n();
  const isEn = lang === "en";

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 sm:px-6 sm:py-12">
        {/* ================================================== */}
        {/* HERO */}
        {/* ================================================== */}
        <section
          id="about-hero"
          aria-labelledby="hero-title"
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs"
        >
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              <span>
                {isEn ? "Independent Community Initiative" : "Iniciativa Comunitaria Independiente"}
              </span>
            </div>

            <h1
              id="hero-title"
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl"
            >
              {isEn ? "About Us" : "Quiénes somos"}
            </h1>

            <p className="text-lg font-semibold text-primary sm:text-xl">
              {isEn
                ? "An independent project created to make information easier to find, understand, and use."
                : "Un proyecto independiente creado para hacer la información más fácil de encontrar, entender y utilizar."}
            </p>

            <p className="text-base text-muted-foreground leading-relaxed">
              {isEn
                ? "DMPS Info was born as an independent project with the goal of gathering useful information for students, families, and the community in one single place. We believe accessing school details, transportation, and local support should never be complicated or exhausting for anyone."
                : "DMPS Info nació como un proyecto independiente con la intención de reunir información útil para estudiantes, familias y comunidad en un solo lugar. Creemos que acceder a datos sobre escuelas, transporte y apoyos locales no debería ser una tarea complicada ni agotadora para nadie."}
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* WHAT IS DMPS INFO */}
        {/* ================================================== */}
        <section
          id="about-what-is"
          aria-labelledby="what-is-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Info className="size-4" aria-hidden="true" />
              <span>{isEn ? "Community Platform" : "Plataforma Comunitaria"}</span>
            </div>
            <h2 id="what-is-title" className="text-2xl sm:text-3xl font-bold text-foreground">
              {isEn ? "What is DMPS Info?" : "¿Qué es DMPS Info?"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "DMPS Info is an independent platform focused on gathering and organizing useful information for the community. Its central goal is to make it easy for anyone to access school, community, and transit details clearly and simply from one single place."
                : "DMPS Info es una plataforma independiente enfocada en reunir y organizar información útil para la comunidad. Su objetivo central es facilitar que cualquier persona pueda consultar datos escolares, comunitarios y de movilidad de forma clara y accesible desde un único lugar."}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
              {isEn
                ? "Currently aims to facilitate access to:"
                : "Actualmente busca facilitar el acceso a:"}
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2" id="current-services-list">
              {[
                {
                  label: isEn ? "School Information" : "Información escolar",
                  desc: isEn
                    ? "Dates, schedules, and resources focused on the school environment."
                    : "Datos, fechas y recursos orientados al entorno escolar.",
                },
                {
                  label: isEn ? "DART & Transportation" : "Información de DART y transporte",
                  desc: isEn
                    ? "Routes, stops, and mobility guidance for students and families."
                    : "Rutas, paradas y movilidad para estudiantes y familias.",
                },
                {
                  label: isEn ? "News & Announcements" : "Noticias y comunicados",
                  desc: isEn
                    ? "A centralized space with relevant updates for the school community."
                    : "Espacio centralizado con avisos relevantes para la comunidad.",
                },
                {
                  label: isEn ? "Family Resources" : "Recursos para familias",
                  desc: isEn
                    ? "Guides, support liaisons, and practical materials for daily life."
                    : "Guías, apoyos y materiales prácticos de uso cotidiano.",
                },
                {
                  label: isEn ? "Community Support" : "Información comunitaria",
                  desc: isEn
                    ? "Guidance to connect with helpful local services and programs."
                    : "Orientación para conectar con servicios y programas útiles.",
                },
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl border border-border/80 bg-secondary/40 p-3.5 transition-colors"
                >
                  <CheckCircle2
                    className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-semibold text-foreground text-sm block">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-foreground space-y-1">
            <p className="font-semibold flex items-center gap-2">
              <ShieldAlert
                className="size-4 text-amber-600 dark:text-amber-400 shrink-0"
                aria-hidden="true"
              />
              <span>
                {isEn
                  ? "Clarification on sources and formal procedures"
                  : "Aclaración sobre fuentes y trámites formales"}
              </span>
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "DMPS Info does not replace official communication channels or formal administrative systems. Where applicable, the app directs users to official school and district portals for enrollment, official records, or institutional procedures."
                : "DMPS Info no reemplaza los canales oficiales de comunicación ni los sistemas formales de trámites. Cuando corresponde, la aplicación orienta y dirige a los usuarios hacia las fuentes y sitios oficiales pertinentes para inscripciones, registros o gestiones institucionales."}
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* WHY IT WAS CREATED */}
        {/* ================================================== */}
        <section
          id="about-why"
          aria-labelledby="why-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Lightbulb className="size-4" aria-hidden="true" />
            <span>{isEn ? "Origin of the Initiative" : "Origen de la iniciativa"}</span>
          </div>
          <h2 id="why-title" className="text-2xl sm:text-3xl font-bold text-foreground">
            {isEn ? "Why does DMPS Info exist?" : "¿Por qué existe DMPS Info?"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {isEn
              ? "Important information is often scattered across different websites, systems, and documents. For busy families juggling multiple responsibilities, finding what they need at the right moment can be confusing and overwhelming."
              : "La información importante puede estar distribuida entre diferentes páginas, sistemas y recursos. Para muchas familias con múltiples responsabilidades, encontrar lo que necesitan en el momento oportuno puede resultar confuso y disperso."}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {isEn
              ? "DMPS Info seeks to help families find what they need in a simpler, organized way. The project grew from a simple idea:"
              : "DMPS Info busca facilitar que las familias puedan encontrar lo que necesitan de una manera más sencilla y organizada. El proyecto nació de una idea sencilla:"}
          </p>
          <blockquote className="rounded-2xl border-l-4 border-primary bg-primary/5 p-4 text-base font-semibold italic text-foreground sm:text-lg">
            {isEn
              ? "“Making useful community information easier to find.”"
              : "“Hacer que encontrar información útil para la comunidad sea más fácil.”"}
          </blockquote>
          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Without promising to solve every daily difficulty, the project works every day to bring order, clarity, and simplicity."
              : "Sin prometer resolver todas las dificultades cotidianas, el proyecto trabaja cada día para aportar orden, claridad y sencillez."}
          </p>
        </section>

        {/* ================================================== */}
        {/* OUR PURPOSE */}
        {/* ================================================== */}
        <section
          id="about-purpose"
          aria-labelledby="purpose-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Compass className="size-4" aria-hidden="true" />
              <span>{isEn ? "Our Guide" : "Nuestra Guía"}</span>
            </div>
            <h2 id="purpose-title" className="text-2xl sm:text-3xl font-bold text-foreground">
              {isEn ? "Our Purpose" : "Nuestro propósito"}
            </h2>
            <p className="text-lg font-semibold text-foreground/90">
              {isEn
                ? "Creating an independent tool that helps families and the community find useful information in a simpler, clearer, and more accessible way."
                : "Crear una herramienta independiente que ayude a las familias y a la comunidad a encontrar información útil de una manera más sencilla, clara y accesible."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" id="purpose-pillars">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                <FileText className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-foreground">{isEn ? "Information" : "Información"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "Practical, understandable data structured to save families valuable time."
                  : "Datos prácticos y comprensibles estructurados para ahorrar tiempo."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
              <div className="grid size-9 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-foreground">
                {isEn ? "Accessibility" : "Accesibilidad"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "Bilingual content, responsive design, and barrier-free reading on any device."
                  : "Contenido bilingüe, diseño responsivo y lectura sin barreras en cualquier equipo."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                <Users className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-foreground">{isEn ? "Community" : "Comunidad"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "A human-centered approach genuinely designed for the benefit of students and families."
                  : "Un enfoque humano pensado genuinamente en el beneficio de estudiantes y familias."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
              <div className="grid size-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                <Layers className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-foreground">{isEn ? "Technology" : "Tecnología"}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "Modern digital tools placed in the service of usefulness and simplicity."
                  : "Herramientas modernas puestas al servicio de la utilidad y la simplicidad."}
              </p>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* WHAT YOU CAN FIND */}
        {/* ================================================== */}
        <section id="about-features" aria-labelledby="features-title" className="space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Layers className="size-4" aria-hidden="true" />
              <span>{isEn ? "Current Features" : "Contenido Actual"}</span>
            </div>
            <h2 id="features-title" className="text-2xl sm:text-3xl font-bold text-foreground">
              {isEn ? "What can you find?" : "¿Qué puedes encontrar?"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isEn
                ? "Sections designed to provide direct answers to the most common family needs:"
                : "Secciones diseñadas para dar respuesta directa a las necesidades más habituales:"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* School info */}
            <div
              id="feature-card-school"
              className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3"
            >
              <div className="grid size-10 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <School className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? "School Information" : "Información escolar"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isEn
                  ? "Resources, bell schedules, and articles related to schools and students."
                  : "Recursos e información relacionada con escuelas y estudiantes."}
              </p>
            </div>

            {/* DART transport */}
            <div
              id="feature-card-transport"
              className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3"
            >
              <div className="grid size-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bus className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? "DART & Transportation" : "DART y transporte"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isEn
                  ? "Route maps, bus passes, and tools to help students and families move around Des Moines."
                  : "Información de rutas, transporte y herramientas relacionadas con el desplazamiento de la comunidad."}
              </p>
            </div>

            {/* News */}
            <div
              id="feature-card-news"
              className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3"
            >
              <div className="grid size-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Megaphone className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? "News & Announcements" : "Noticias y comunicados"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isEn
                  ? "A single space to find timely updates, alerts, and notifications."
                  : "Un espacio para encontrar información y avisos relevantes."}
              </p>
            </div>

            {/* Families */}
            <div
              id="feature-card-families"
              className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3"
            >
              <div className="grid size-10 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <HeartHandshake className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? "Family Resources" : "Recursos para familias"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isEn
                  ? "Bilingual liaisons, food pantry contacts, and emergency assistance."
                  : "Recursos que pueden ser útiles para estudiantes y familias."}
              </p>
            </div>

            {/* Community */}
            <div
              id="feature-card-community"
              className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3 sm:col-span-2 lg:col-span-1"
            >
              <div className="grid size-10 place-items-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Users className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {isEn ? "Community" : "Comunidad"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isEn
                  ? "Information and local connections that bring people closer to community services."
                  : "Información y recursos que puedan ayudar a conectar a la comunidad con diferentes servicios."}
              </p>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* INDEPENDENT PROJECT & BY DESIGN */}
        {/* ================================================== */}
        <section
          id="about-independent-project"
          aria-labelledby="project-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-4" aria-hidden="true" />
            <span>{isEn ? "Project Nature" : "Naturaleza del proyecto"}</span>
          </div>
          <h2 id="project-title" className="text-2xl sm:text-3xl font-bold text-foreground">
            {isEn ? "An Independent Project" : "Un proyecto independiente"}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {isEn
              ? "DMPS Info did not start as an official initiative of Des Moines Public Schools. It is an independent community project developed with the heart to assist families and facilitate quick access to essential information."
              : "DMPS Info no nació como una iniciativa oficial de Des Moines Public Schools. Es un proyecto independiente desarrollado con la intención de ayudar a las familias y facilitar el acceso a información útil."}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {isEn
              ? "The project continues to evolve over time, adding new tools and services based on real suggestions and needs from local families."
              : "El proyecto puede evolucionar con el tiempo y agregar nuevas herramientas y servicios en función de las sugerencias y necesidades que surjan en la comunidad."}
          </p>

          <div
            id="independent-by-design"
            className="mt-4 rounded-2xl border border-border bg-secondary/50 p-5 space-y-2"
          >
            <h3 className="text-base font-bold text-foreground">
              {isEn ? "Independent by design" : "Independiente por diseño"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isEn
                ? "The project aims to keep its capacity to innovate quickly and independently, always dedicated to mutual support and family wellbeing."
                : "El proyecto busca mantener su capacidad de crecer y evolucionar independientemente, con la agilidad de innovar de manera constructiva y siempre orientada al apoyo mutuo y al bienestar de las familias."}
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* WHO IS BEHIND */}
        {/* ================================================== */}
        <section
          id="about-creator"
          aria-labelledby="creator-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Users className="size-4" aria-hidden="true" />
            <span>{isEn ? "Authorship & Responsibility" : "Autoría y Responsabilidad"}</span>
          </div>
          <h2 id="creator-title" className="text-2xl sm:text-3xl font-bold text-foreground">
            {isEn ? "Who is behind DMPS Info" : "Quién está detrás de DMPS Info"}
          </h2>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                {isEn ? "Project Creator & Founder" : "Creador y propietario del proyecto"}
              </span>
              <p
                id="creator-name"
                className="text-xl sm:text-2xl font-black text-foreground tracking-tight"
              >
                Jeferson Martinez
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-background px-3.5 py-2 text-xs font-bold text-primary border border-border self-start sm:self-auto">
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
              <span>{isEn ? "Independent Development" : "Desarrollo Independiente"}</span>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {isEn
              ? "DMPS Info is an independently developed initiative with a clear vision focused on helping families and growing responsibly, transparently, and closely connected to our community."
              : "DMPS Info es un proyecto desarrollado independientemente con una visión enfocada en ayudar a las familias y seguir creciendo de manera responsable, transparente y cercana a la comunidad."}
          </p>
        </section>

        {/* ================================================== */}
        {/* WHAT IS COMING & ROADMAP */}
        {/* ================================================== */}
        <section
          id="about-future"
          aria-labelledby="future-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-8"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="size-4" aria-hidden="true" />
              <span>{isEn ? "The Road Ahead" : "Camino hacia adelante"}</span>
            </div>
            <h2 id="future-title" className="text-2xl sm:text-3xl font-bold text-foreground">
              {isEn ? "What's coming next" : "Lo que viene"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "Our future roadmap is guided by three continuous commitments:"
                : "Nuestra visión de futuro se sustenta en tres compromisos continuos:"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-2">
              <h3 className="font-bold text-foreground">
                {isEn ? "More Services" : "Más servicios"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "Continuing to add helpful tools and resources adapted to daily life."
                  : "Continuar agregando herramientas y recursos útiles adaptados a la vida diaria."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-2">
              <h3 className="font-bold text-foreground">
                {isEn ? "Helping More Families" : "Ayudar a más familias"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "Expanding the platform's reach to serve an ever-growing community."
                  : "Hacer que la plataforma pueda ser útil para una comunidad cada vez mayor."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-5 space-y-2">
              <h3 className="font-bold text-foreground">
                {isEn ? "Independent Growth" : "Crecimiento independiente"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn
                  ? "Continuing to develop DMPS Info as a sustainable, independent project."
                  : "Seguir desarrollando DMPS Info como un proyecto independiente y sostenible."}
              </p>
            </div>
          </div>

          {/* Timeline / Roadmap conceptual */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-base font-bold text-foreground">
                {isEn ? "Growth Vision" : "Visión de crecimiento"}
              </h3>
              <span className="text-xs text-muted-foreground italic">
                {isEn
                  ? "Conceptual evolution roadmap, representing our direction."
                  : "Visión de evolución conceptual, no funcionalidades ya implementadas."}
              </span>
            </div>

            <div
              id="roadmap-timeline"
              className="grid gap-3 sm:grid-cols-4 text-center sm:text-left"
            >
              {/* Etapa 1 */}
              <div className="rounded-2xl border border-border bg-secondary/60 p-4 space-y-1">
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-extrabold text-primary uppercase tracking-wide">
                  {isEn ? "Today" : "Hoy"}
                </span>
                <p className="font-bold text-foreground text-sm">
                  {isEn ? "Information & Resources" : "Información y recursos"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Accessible starting point." : "Punto de partida accesible."}
                </p>
              </div>

              {/* Etapa 2 */}
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-1">
                <span className="inline-block rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                  {isEn ? "Growth" : "Crecimiento"}
                </span>
                <p className="font-bold text-foreground text-sm">
                  {isEn ? "More Tools & Services" : "Más herramientas y servicios"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Expanding features." : "Ampliación de utilidades."}
                </p>
              </div>

              {/* Etapa 3 */}
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-1">
                <span className="inline-block rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {isEn ? "Community" : "Comunidad"}
                </span>
                <p className="font-bold text-foreground text-sm">
                  {isEn ? "More Families Connected" : "Más personas conectadas"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Broader reach and utility." : "Mayor alcance y utilidad."}
                </p>
              </div>

              {/* Etapa 4 */}
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-1">
                <span className="inline-block rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  {isEn ? "Future" : "Futuro"}
                </span>
                <p className="font-bold text-foreground text-sm">
                  {isEn ? "Comprehensive Platform" : "Plataforma integral"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Full independent portal." : "Herramienta independiente completa."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* TRANSPARENCY */}
        {/* ================================================== */}
        <section
          id="about-transparency"
          aria-labelledby="transparency-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-4"
        >
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-4" aria-hidden="true" />
            <span>{isEn ? "Institutional Clarity" : "Claridad Institucional"}</span>
          </div>
          <h2 id="transparency-title" className="text-2xl sm:text-3xl font-bold text-foreground">
            {isEn ? "Transparency" : "Transparencia"}
          </h2>

          <div className="rounded-2xl border border-border bg-secondary/50 p-5 space-y-3">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {isEn
                ? "“DMPS Info is an independent project and does not necessarily represent Des Moines Public Schools, DART, or any other public institution.”"
                : "“DMPS Info es un proyecto independiente y no representa necesariamente a Des Moines Public Schools, DART ni a ninguna otra institución pública.”"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "For official policies and binding decisions, users should always consult the corresponding official district sources."
                : "Para información oficial, los usuarios deben consultar siempre las fuentes oficiales correspondientes."}
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* DMPS CONNECT ECOSYSTEM */}
        {/* ================================================== */}
        <section
          id="about-ecosystem"
          aria-labelledby="ecosystem-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Layers className="size-4" aria-hidden="true" />
              <span>{isEn ? "Project Ecosystem" : "Ecosistema de proyectos"}</span>
            </div>
            <h2 id="ecosystem-title" className="text-2xl sm:text-3xl font-bold text-foreground">
              {isEn ? "The DMPS Connect Ecosystem" : "El ecosistema DMPS Connect"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "Within our vision of creating practical and independent tools, projects focus on different everyday areas:"
                : "Dentro de la visión de crear herramientas útiles e independientes, existen proyectos enfocados en diferentes áreas de la vida diaria:"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                DMPS Connect
              </span>
              <p className="font-bold text-foreground text-sm">
                {isEn ? "Project Ecosystem" : "Ecosistema de proyectos"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEn
                  ? "Common framework for community initiatives."
                  : "Marco común de iniciativas de apoyo."}
              </p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                DMPS Info
              </span>
              <p className="font-bold text-foreground text-sm">
                {isEn ? "Information & Resources" : "Información y recursos"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEn
                  ? "Centralization of school and family data."
                  : "Centralización de datos escolares y familiares."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                DMPS Transit
              </span>
              <p className="font-bold text-foreground text-sm">
                {isEn ? "Smart Transit" : "Transporte inteligente"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEn
                  ? "Tools focused on community mobility."
                  : "Herramientas enfocadas en la movilidad comunitaria."}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {isEn
              ? "Each initiative maintains its own distinct functions and identity. DMPS Transit is not property of a public agency, but a complementary technological development within this same independent spirit."
              : "Cada iniciativa mantiene sus funciones e identidades separadas. DMPS Transit no es propiedad de una institución pública, sino un desarrollo tecnológico complementario dentro de este mismo espíritu independiente."}
          </p>
        </section>

        {/* ================================================== */}
        {/* PHILOSOPHY */}
        {/* ================================================== */}
        <section
          id="about-philosophy"
          aria-label="Filosofía del proyecto"
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/30 to-primary/10 p-8 sm:p-12 text-center shadow-xs"
        >
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="inline-grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Heart className="size-6" aria-hidden="true" />
            </div>
            <blockquote className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
              {isEn
                ? "“Technology has the greatest value when it makes the important things easier for people.”"
                : "“La tecnología tiene más valor cuando hace que las cosas importantes sean más fáciles para las personas.”"}
            </blockquote>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {isEn ? "Guiding Principle of DMPS Info" : "Principio guía de DMPS Info"}
            </p>
          </div>
        </section>

        {/* ================================================== */}
        {/* FINAL CTA */}
        {/* ================================================== */}
        <section
          id="about-cta"
          aria-labelledby="cta-title"
          className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs text-center space-y-6"
        >
          <div className="max-w-xl mx-auto space-y-2">
            <h2 id="cta-title" className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {isEn
                ? "Thank you for being part of this project."
                : "Gracias por ser parte del proyecto."}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {isEn
                ? "DMPS Info will keep growing with a simple mission: building tools that are truly helpful for families and the community."
                : "DMPS Info seguirá creciendo con una meta sencilla: crear herramientas que puedan ser útiles para las familias y la comunidad."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-2xl font-bold">
              <Link to="/">
                <span>{isEn ? "Explore DMPS Info" : "Explorar DMPS Info"}</span>
                <ArrowRight className="size-4 ml-1.5" aria-hidden="true" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="rounded-2xl font-bold">
              <Link to="/transporte/dart">
                <Smartphone className="size-4 mr-1.5" aria-hidden="true" />
                <span>{isEn ? "Explore Transit Tools" : "Conocer la App Escolar"}</span>
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
