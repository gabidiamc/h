import { useState, useEffect } from "react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export interface JobListing {
  id: string;
  employer: string;
  positions: {
    es: string;
    en: string;
  };
  details: {
    es: string;
    en: string;
  };
  pay?: {
    es: string;
    en: string;
  };
  ageReq?: {
    es: string;
    en: string;
  };
  ageCategory: "14-15" | "16-17" | "18+" | "all";
  location?: {
    es: string;
    en: string;
  };
  contact: {
    name?: string;
    phone?: string;
    email?: string;
    applyUrl?: string;
    address?: string;
    notesEs?: string;
    notesEn?: string;
  };
  category: "retail" | "food" | "camp" | "trade" | "care" | "youth";
}

export const LINCOLN_JOB_LISTINGS: JobListing[] = [
  {
    id: "spaghetti-works",
    employer: "Des Moines Spaghetti Works",
    category: "food",
    ageCategory: "14-15",
    positions: {
      es: "Barra de Ensaladas, Anfitrión(a), Cocina y Repartidor de Platillos",
      en: "Salad Bar, Host, Kitchen & Food Runner Departments",
    },
    details: {
      es: "¡Puestos ideales para primeros empleos o empleos de verano, así como departamentos de cocina y repartidores de comida!",
      en: "Positions in salad bar department and host department that are perfect for first time jobs or summer jobs, as well as kitchen and food runner departments!",
    },
    pay: {
      es: "Salario competitivo por hora",
      en: "Competitive hourly wage",
    },
    ageReq: {
      es: "Aceptan desde 14-15 años en adelante",
      en: "Accepting ages 14-15 and over",
    },
    location: {
      es: "310 Court Avenue, Des Moines, IA 50309",
      en: "310 Court Avenue, Des Moines, IA 50309",
    },
    contact: {
      name: "William Paulson (Kitchen Manager)",
      phone: "515-243-2195",
      address: "310 Court Avenue, Des Moines, IA 50309",
    },
  },
  {
    id: "camp-fire",
    employer: "Camp Fire Heart of Iowa",
    category: "camp",
    ageCategory: "18+",
    positions: {
      es: "Consejeros de Campamento de Verano",
      en: "Summer Camp Counselors",
    },
    details: {
      es: "Trabajo de verano a tiempo completo con pago semanal de $375. Elige entre 3 campamentos: 1. Eastview y Southwoods Day Camp (edades 5-9: natación, juegos en grupo y STEM/lectura). 2. Outrageous Camp (edades 10-13: actividades de verano emocionantes). 3. Skate Camp (edades 7-13: enseña y practica patinaje).",
      en: "Full Time summer job weekly pay $375. Choose from 3 camps: 1. Eastview and Southwoods Day Camp (ages 5-9). 2. Outrageous Camp (ages 10-13). 3. Skate Camp (ages 7-13).",
    },
    pay: {
      es: "$375 semanales (Tiempo Completo)",
      en: "$375 weekly (Full Time summer job)",
    },
    ageReq: {
      es: "Debe tener 18 años o más",
      en: "Must be 18 or older",
    },
    contact: {
      email: "lauren@campfireiowa.org",
      notesEs:
        "Envía un correo con el asunto 'Camp Counselor Position'. Incluye en qué campamento estás interesado y por qué serías un buen candidato.",
      notesEn:
        "Email lauren@campfireiowa.org with subject line 'Camp Counselor Position'. Include which camp you are interested in and why you are a fit.",
    },
  },
  {
    id: "rally-house",
    employer: "Rally House",
    category: "retail",
    ageCategory: "16-17",
    positions: {
      es: "Asociados de Tienda (Part-Time) y Encargados de Llaves (Key Holders)",
      en: "Part-Time Retail Associates & Key Holders (Full Time / Part Time)",
    },
    details: {
      es: "Tienda minorista en el área de Des Moines buscando asociados de tienda y encargados de llaves. ¡Si te apasionan los deportes y disfrutas de descuentos en ropa deportiva, únete a nuestro equipo! Gran ambiente y oportunidades de crecimiento.",
      en: "Retail store in Des Moines area looking to hire Part-Time Retail Associates as well as Key Holders! Passion for sports & apparel discounts. Room for growth.",
    },
    pay: {
      es: "$12+ por hora",
      en: "$12+ per hour",
    },
    contact: {
      applyUrl: "https://rallyhouse.com/careers",
      notesEs: "Aplica en línea en rallyhouse.com/careers",
      notesEn: "For information and to apply go to: rallyhouse.com/careers",
    },
  },
  {
    id: "culvers-ankeny",
    employer: "Culver’s in Ankeny",
    category: "food",
    ageCategory: "14-15",
    positions: {
      es: "Miembros del Equipo Culver's",
      en: "Culver’s Team Members",
    },
    details: {
      es: "Ubicado en 2305 SE Delaware Ave en Ankeny. Salario ajustado por edad: 14 y 15 años $9/hr; 16 y 17 años $14/hr; 18+ años $16/hr. Puede aumentar según los turnos.",
      en: "Located at 2305 SE Delaware in Ankeny. Wage based on age: 14 & 15 year olds $9/hr; 16 & 17 year olds $14/hr; 18 and over $16/hr. May increase depending on shifts.",
    },
    pay: {
      es: "$9/hr (14-15 años) | $14/hr (16-17 años) | $16/hr (18+)",
      en: "$9/hr (14-15 yrs) | $14/hr (16-17 yrs) | $16/hr (18+)",
    },
    ageReq: {
      es: "Oportunidades desde los 14 años",
      en: "Opportunities starting at age 14",
    },
    location: {
      es: "2305 SE Delaware Ave, Ankeny, IA 50021",
      en: "2305 SE Delaware Ave, Ankeny, IA 50021",
    },
    contact: {
      phone: "515-963-9191",
      applyUrl: "https://culvers.com/careers",
      notesEs:
        "Aplica en línea en culvers.com/careers (código postal 50021) o llama al gerente al 515-963-9191.",
      notesEn:
        "Apply online at culvers.com/careers (zip code 50021). Call manager at 515-963-9191.",
    },
  },
  {
    id: "pump-it-up",
    employer: "Pump It Up Urbandale",
    category: "youth",
    ageCategory: "16-17",
    positions: {
      es: "Personal de Eventos y Fiestas de Inflables",
      en: "Event & Party Staff",
    },
    details: {
      es: "Trabajo dinámico supervisando áreas de juegos inflables y fiestas infantiles. Salario por hora más propinas.",
      en: "Hourly wage plus tips.",
    },
    pay: {
      es: "Salario por hora + Propinas",
      en: "Hourly wage + tips",
    },
    location: {
      es: "Urbandale, Iowa",
      en: "Urbandale, Iowa",
    },
    contact: {
      phone: "515-249-2710",
      notesEs: "Envía un mensaje de texto al 515-249-2710 para programar una entrevista por video.",
      notesEn: "Text 515-249-2710 to set up a video interview.",
    },
  },
  {
    id: "ll-insulation",
    employer: "L&L Insulation",
    category: "trade",
    ageCategory: "18+",
    positions: {
      es: "Personal de Almacén",
      en: "Warehouse Staff",
    },
    details: {
      es: "Puestos de medio tiempo disponibles en el área de almacén. Ubicado en NE 14th y Broadway en Des Moines.",
      en: "Part time positions available in warehouse. Located at NE 14th and Broadway in Des Moines.",
    },
    pay: {
      es: "$16 por hora",
      en: "$16 an hour",
    },
    ageReq: {
      es: "Debe tener 18 años cumplidos",
      en: "Must be 18 years old",
    },
    location: {
      es: "NE 14th & Broadway, Des Moines, IA",
      en: "NE 14th & Broadway, Des Moines, IA",
    },
    contact: {
      notesEs: "Publicación de empleo y solicitud disponibles a través de BambooHR.",
      notesEn: "The job listing and application are available via BambooHR.",
    },
  },
  {
    id: "tdi-cable",
    employer: "TD&I Cable",
    category: "trade",
    ageCategory: "18+",
    positions: {
      es: "Técnicos de Instalación de Cable e Infraestructura Subterránea/Aérea",
      en: "Fiber Optic & Cable Infrastructure Technicians",
    },
    details: {
      es: "Servicios integrales de construcción (inyección, arado, excavación, perforación direccional, líneas aéreas). Dirigido a estudiantes interesados tras su graduación de secundaria. Excelentes beneficios: 401K, reparto de utilidades, pensión, seguro médico pagado al 90%, vacaciones desde el primer día, capacitación pagada, viáticos de viaje y trabajo todo el año.",
      en: "Comprehensive construction services for interested students after graduation. Great benefits: 401K, profit sharing, pension, 90% health insurance paid, vacation accrual day 1, paid holidays & travel, year-round work.",
    },
    pay: {
      es: "Salario competitivo + 90% seguro pagado + viáticos",
      en: "Competitive wage + 90% health insurance paid + per diem",
    },
    ageReq: {
      es: "Para estudiantes recién graduados (18+)",
      en: "For graduating high school seniors (18+)",
    },
    location: {
      es: "Des Moines / Midwest (Servicios en IA, MN, WI)",
      en: "Des Moines / Midwest (Serving IA, MN, WI)",
    },
    contact: {
      applyUrl: "https://tdicable.com",
      notesEs: "Servicios de cableado de fibra óptica en el Medio Oeste (tdicable.com)",
      notesEn: "Fiber optic cabling services serving IA, MN, WI (tdicable.com)",
    },
  },
  {
    id: "growing-futures",
    employer: "Des Moines: Growing Futures",
    category: "youth",
    ageCategory: "14-15",
    positions: {
      es: "Equipo de Plantación de Árboles (Spring Tree Planting Crew)",
      en: "Tree Planting Crew",
    },
    details: {
      es: "Growing Futures es un programa de empleo juvenil para estudiantes de secundaria en Des Moines. ¡Nos reunimos los sábados en primavera para plantar árboles en Des Moines! También ofrece desarrollo profesional. Trabajan 7 sábados en la primavera.",
      en: "Youth employment program for high school students in Des Moines metro. Meet on Saturdays during spring planting trees. Professional development opportunities. 7 Saturdays in spring.",
    },
    pay: {
      es: "$12 / hora (7 sábados en primavera)",
      en: "$12 / hour (7 Saturdays in spring)",
    },
    ageReq: {
      es: "Estudiantes de secundaria en Des Moines",
      en: "High school students in Des Moines",
    },
    contact: {
      applyUrl: "https://www.treesforever.org",
      notesEs: "La solicitud está publicada en el sitio web de Trees Forever.",
      notesEn: "Job listing and application posted on Trees Forever website.",
    },
  },
  {
    id: "girl-scouts-iowa",
    employer: "Girl Scouts of Iowa",
    category: "camp",
    ageCategory: "16-17",
    positions: {
      es: "Personal de Campamento de Verano (Acuáticos, Salvavidas, Cuerdas, Equitación, Líderes/Consejeros, Cocina)",
      en: "Summer Camp jobs: Waterfront, Lifeguard, Ropes Course, Equestrian, Unit Leaders, Counselors, Kitchen Staff",
    },
    details: {
      es: "Temporada de junio a mediados de agosto. Trabajo remunerado que incluye alojamiento y comida (room and board).",
      en: "June to mid-August. Paid plus room and board provided.",
    },
    pay: {
      es: "Salario + Alojamiento y Comida incluidos",
      en: "Paid + Room and Board provided",
    },
    contact: {
      email: "CampSac@gsiowa.org",
      notesEs:
        "Envía un correo a CampSac@gsiowa.org o aplica con el código QR en la oficina de consejería escolar.",
      notesEn: "Email CampSac@gsiowa.org or apply online / QR code in Counseling Office Job Board.",
    },
  },
  {
    id: "chi-living",
    employer: "CHI Living Communities",
    category: "care",
    ageCategory: "18+",
    positions: {
      es: "Asistentes de Enfermería Certificados (CNA)",
      en: "CNA Positions (Certified Nursing Assistant)",
    },
    details: {
      es: "Puestos de CNA brindando atención y servicio a adultos mayores en la comunidad residencial.",
      en: "CNA positions serving senior adults.",
    },
    pay: {
      es: "Salario competitivo en salud",
      en: "Competitive healthcare wage",
    },
    contact: {
      applyUrl: "https://homeishere.org",
      notesEs: "Aplica en línea en homeishere.org",
      notesEn: "Apply at homeishere.org",
    },
  },
  {
    id: "ymca-des-moines",
    employer: "YMCA of Greater Des Moines",
    category: "youth",
    ageCategory: "14-15",
    positions: {
      es: "Múltiples Posiciones (Salvavidas, Atención, Instructores)",
      en: "Multiple Positions (Lifeguards, Member Services, Instructors)",
    },
    details: {
      es: "Diversas vacantes de trabajo disponibles en múltiples instalaciones y sedes de la YMCA en el área de Des Moines.",
      en: "Several positions available at multiple locations.",
    },
    contact: {
      applyUrl: "https://www.dmymca.org",
      notesEs: "Para más información y aplicar, visita el portal de empleos de la YMCA.",
      notesEn: "For more information and to apply, click here.",
    },
  },
  {
    id: "heartland-business",
    employer: "Heartland Business Systems",
    category: "trade",
    ageCategory: "18+",
    positions: {
      es: "Asistente de Servicios al Cliente (Client Services Assistant)",
      en: "Client Services Assistant",
    },
    details: {
      es: "Puesto a tiempo completo diseñado para un estudiante de último año (Senior) tras su graduación.",
      en: "Full time position for a graduating senior after graduation.",
    },
    contact: {
      applyUrl: "https://www.hbs.net/careers",
      notesEs: "Para más información y aplicar en línea.",
      notesEn: "For more information and to apply, visit HBS careers.",
    },
  },
  {
    id: "evelyn-k-davis",
    employer: "Evelyn K. Davis Center for Working Families",
    category: "care",
    ageCategory: "16-17",
    positions: {
      es: "Tutor del Programa Tutor Heroes",
      en: "Tutor Heroes Program - Tutor",
    },
    details: {
      es: "Martes, miércoles y jueves de 5:00 PM a 7:00 PM (virtual o en persona). Revisa la bolsa de trabajo en la oficina de consejería escolar.",
      en: "Tuesdays, Wednesdays, Thursdays 5-7pm virtually or in-person. Check the job board in school counseling office.",
    },
    pay: {
      es: "Remunerado por horas de tutoría",
      en: "Paid per tutoring hours",
    },
    contact: {
      applyUrl: "https://forms.gle/WNcKHdKqgc2irHax9",
      notesEs: "Aplica completando el formulario de Google o consulta en la oficina de consejería.",
      notesEn: "Apply here: https://forms.gle/WNcKHdKqgc2irHax9",
    },
  },
  {
    id: "skate-south",
    employer: "Skate South",
    category: "youth",
    ageCategory: "16-17",
    positions: {
      es: "DJ, Personal de Pista, Concesiones de Comida y Anfitrión de Cumpleaños",
      en: "DJ, Skate Attendant, Concessions & Birthday Host",
    },
    details: {
      es: "Ubicado en 10494 County Line Rd, Des Moines 50230. Turnos necesarios: Miércoles 5:30-8:30 PM, Viernes 6:00-9:00 PM, Sábado 1-5 PM & 5-8 PM, Domingo 1-4 PM. ¡Patinaje gratis cuando no estés trabajando!",
      en: "Located at 10494 County Line Rd, Des Moines 50230. Shifts needed: Wed 5:30-8:30, Friday 6:00-9:00, Sat 1-5 & 5-8, Sun 1-4. Free skating when not working!",
    },
    ageReq: {
      es: "Edades 16 años en adelante",
      en: "Ages 16 and over",
    },
    location: {
      es: "10494 County Line Rd, Des Moines, IA 50230",
      en: "10494 County Line Rd, Des Moines, IA 50230",
    },
    contact: {
      phone: "515-385-6037",
      address: "10494 County Line Rd, Des Moines 50230",
      notesEs: "Llama o envía mensaje al 515-385-6037.",
      notesEn: "Call or text 515-385-6037.",
    },
  },
  {
    id: "homegoods",
    employer: "HomeGoods",
    category: "retail",
    ageCategory: "16-17",
    positions: {
      es: "Varios Puestos en Tienda y Servicio al Cliente",
      en: "Various Retail & Customer Service Positions",
    },
    details: {
      es: "Ubicado en 320 S. Jordan Creek Pkwy, West Des Moines 50266.",
      en: "320 S. Jordan Creek Pkwy, West Des Moines 50266.",
    },
    location: {
      es: "320 S. Jordan Creek Pkwy, West Des Moines 50266",
      en: "320 S. Jordan Creek Pkwy, West Des Moines 50266",
    },
    contact: {
      phone: "515-226-8431",
      applyUrl: "https://jobs.tjx.com",
      notesEs: "Aplica en jobs.tjx.com o llama al 515-226-8431.",
      notesEn: "Apply at jobs.tjx.com or call 515-226-8431.",
    },
  },
  {
    id: "immanuel-pathways",
    employer: "Immanuel Pathways (Senior Care Home)",
    category: "care",
    ageCategory: "14-15",
    positions: {
      es: "Mesero / Server para Comedor de Adultos Mayores",
      en: "Server at Senior Care Home",
    },
    details: {
      es: "Ubicado en Urbandale, Iowa. Horario a tiempo parcial por las tardes incluyendo fines de semana de 4:00 PM a 7:00 PM.",
      en: "Urbandale, Iowa. Part time evenings including weekends 4pm-7pm.",
    },
    ageReq: {
      es: "Edades 14 años en adelante",
      en: "Ages 14 and over",
    },
    location: {
      es: "Urbandale, Iowa",
      en: "Urbandale, Iowa",
    },
    contact: {
      name: "Josh Elliott",
      email: "jelliott@immanuel.com",
      phone: "402-829-6965",
      applyUrl: "https://immanuel.com/careers",
      notesEs:
        "Aplica en Immanuel.com/careers o contacta a Josh Elliott (jelliott@immanuel.com / 402-829-6965).",
      notesEn: "Apply at Immanuel.com/careers or contact Josh Elliott at 402-829-6965.",
    },
  },
  {
    id: "early-learning-center",
    employer: "The Early Learning Center",
    category: "care",
    ageCategory: "16-17",
    positions: {
      es: "Asistentes de Maestro a Tiempo Parcial (Edades 6 meses - 12 años)",
      en: "Part-Time Assistant Teachers for children ages 6mo-12 years",
    },
    details: {
      es: "Ubicado en 6151 Thornton Ave #500, Des Moines. Cuidado y enseñanza de niños de 6 meses a 12 años.",
      en: "Located at 6151 Thornton Ave #500. Care and teaching for children ages 6mo-12 years.",
    },
    ageReq: {
      es: "Edades 16 años en adelante",
      en: "Ages 16 and over",
    },
    location: {
      es: "6151 Thornton Ave #500, Des Moines, IA",
      en: "6151 Thornton Ave #500, Des Moines, IA",
    },
    contact: {
      name: "Angel Julius",
      phone: "515-229-7103",
      email: "angeljulius@live.com",
      notesEs: "Contacta a Angel Julius al 515-229-7103 o angeljulius@live.com.",
      notesEn: "Contact Angel Julius at 515-229-7103 or angeljulius@live.com.",
    },
  },
];

export function getSavedJobListings(): (JobListing & { school_id?: string })[] {
  return LINCOLN_JOB_LISTINGS;
}

export function JobBoardWidget({ className = "" }: { className?: string }) {
  const { lang } = useI18n();
  const { selectedSchool } = useSchool();
  const bi: "es" | "en" = lang === "es" ? "es" : "en";
  const schoolName = selectedSchool.name;
  const [allJobs, setAllJobs] = useState<(JobListing & { school_id?: string })[]>(() =>
    getSavedJobListings(),
  );
  const [search, setSearch] = useState("");
  const [selectedAge, setSelectedAge] = useState<"all" | "14-15" | "16-17" | "18+">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let mounted = true;

    async function loadFromSupabase() {
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "job_listings")
            .maybeSingle();
          if (!error && data?.value && Array.isArray(data.value) && mounted) {
            setAllJobs(data.value as (JobListing & { school_id?: string })[]);
          }
        } catch {
          // ignore
        }
      }
    }

    void loadFromSupabase();

    const update = () => {
      void loadFromSupabase();
    };

    window.addEventListener("dmps-jobs-updated", update);
    return () => {
      mounted = false;
      window.removeEventListener("dmps-jobs-updated", update);
    };
  }, []);

  const filteredJobs = allJobs.filter((job) => {
    // School filter
    if (job.school_id && job.school_id !== "all" && job.school_id !== selectedSchool.id) {
      return false;
    }
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search.trim() ||
      job.employer.toLowerCase().includes(searchLower) ||
      (job.positions[bi] || "").toLowerCase().includes(searchLower) ||
      (job.details[bi] || "").toLowerCase().includes(searchLower) ||
      (job.location && (job.location[bi] || "").toLowerCase().includes(searchLower));

    // Age filter
    let matchesAge = true;
    if (selectedAge === "14-15") {
      matchesAge = job.ageCategory === "14-15" || job.ageCategory === "all";
    } else if (selectedAge === "16-17") {
      matchesAge =
        job.ageCategory === "14-15" || job.ageCategory === "16-17" || job.ageCategory === "all";
    } else if (selectedAge === "18+") {
      matchesAge = true;
    }

    // Category filter
    const matchesCategory = selectedCategory === "all" || job.category === selectedCategory;

    return matchesSearch && matchesAge && matchesCategory;
  });

  return (
    <section
      id="job-board"
      className={`rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm ${className}`}
    >
      {/* HEADER TITLE BAR */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-extrabold text-primary border border-primary/20">
            <Briefcase className="size-4 text-primary" />
            <span>
              {lang === "es"
                ? `Bolsa de Trabajo Comunitaria — ${schoolName}`
                : `${schoolName} Community Job Board`}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {lang === "es"
                ? `${LINCOLN_JOB_LISTINGS.length} Empleos Verificados`
                : `${LINCOLN_JOB_LISTINGS.length} Verified Job Openings`}
            </span>
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {lang === "es" ? "Oportunidades de Empleo para Estudiantes" : `${schoolName} Job Board`}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
            {lang === "es"
              ? `A continuación se muestran las empresas de la comunidad que han proporcionado información sobre sus vacantes de empleo para estudiantes y graduados de ${schoolName}.`
              : `Below are community businesses that have provided information about job openings for ${schoolName} students and graduates.`}
          </p>
        </div>

        {/* WORK PERMIT INSTRUCTIONS CALLOUT BANNER (FOR AGES 14-15) */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <FileText className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <span className="font-extrabold text-amber-900 dark:text-amber-200">
                {lang === "es"
                  ? "Instrucciones del Permiso de Trabajo Infantil de Iowa (Edades 14-15):"
                  : "Iowa Child Labor Permit Instructions (Ages 14-15):"}
              </span>
              <p className="text-amber-800 dark:text-amber-300 leading-snug">
                {lang === "es"
                  ? "Si tienes entre 14 y 15 años, debes obtener un permiso de trabajo antes de comenzar a laborar. Consulta la guía oficial de la División del Trabajo de Iowa."
                  : "If you are ages 14-15, this link provides directions to obtain an official Iowa work permit."}
              </p>
            </div>
          </div>

          <a
            href="https://www.iowadivisionoflabor.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs shrink-0 w-full sm:w-auto"
          >
            <span>
              {lang === "es"
                ? "Ver Permiso de Trabajo (iowadivisionoflabor.gov)"
                : "Work Permit Instructions (iowadivisionoflabor.gov)"}
            </span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {/* FILTERS AND SEARCH ROW */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* SEARCH BAR */}
          <div className="relative md:col-span-5">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === "es"
                  ? "Buscar por empresa, puesto o zona..."
                  : "Search by employer, job position, or location..."
              }
              className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
            />
          </div>

          {/* AGE FILTER BUTTONS */}
          <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-extrabold text-muted-foreground shrink-0 mr-1 hidden sm:inline">
              {lang === "es" ? "Edad:" : "Age:"}
            </span>
            {[
              { id: "all", labelEs: "Todas", labelEn: "All Ages" },
              { id: "14-15", labelEs: "14-15 Años", labelEn: "Ages 14-15" },
              { id: "16-17", labelEs: "16-17 Años", labelEn: "Ages 16-17" },
              { id: "18+", labelEs: "18+ / Graduados", labelEn: "18+ / Seniors" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSelectedAge(btn.id as typeof selectedAge)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  selectedAge === btn.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {lang === "es" ? btn.labelEs : btn.labelEn}
              </button>
            ))}
          </div>

          {/* CATEGORY SELECTOR */}
          <div className="md:col-span-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs appearance-none"
              >
                <option value="all">
                  {lang === "es" ? "Todas las Categorías" : "All Categories"}
                </option>
                <option value="food">
                  {lang === "es" ? "Restaurantes y Comida" : "Food & Dining"}
                </option>
                <option value="retail">
                  {lang === "es" ? "Tiendas y Comercio" : "Retail & Sales"}
                </option>
                <option value="youth">
                  {lang === "es" ? "Diversión y Jóvenes" : "Youth & Events"}
                </option>
                <option value="camp">
                  {lang === "es" ? "Campamentos de Verano" : "Summer Camps"}
                </option>
                <option value="trade">
                  {lang === "es" ? "Oficios y Logística" : "Trades & Logistics"}
                </option>
                <option value="care">
                  {lang === "es" ? "Cuidado y Educación" : "Care & Education"}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* JOBS GRID */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredJobs.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm space-y-2">
            <Briefcase className="size-8 mx-auto text-muted-foreground/50" />
            <p className="font-semibold">
              {lang === "es"
                ? "No se encontraron empleos que coincidan con sus filtros."
                : "No job openings matched your filter criteria."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedAge("all");
                setSelectedCategory("all");
              }}
              className="text-xs font-extrabold text-primary hover:underline"
            >
              {lang === "es" ? "Restablecer filtros" : "Reset filters"}
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-background p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-md"
            >
              <div className="space-y-3.5">
                {/* TOP HEADER BADGES */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="size-4.5 text-primary shrink-0" />
                    <span className="text-sm font-extrabold text-foreground truncate">
                      {job.employer}
                    </span>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    <Sparkles className="size-3 text-primary" />
                    {job.ageCategory === "14-15"
                      ? "14+ Años"
                      : job.ageCategory === "16-17"
                        ? "16+ Años"
                        : job.ageCategory === "18+"
                          ? "18+ Años / Senior"
                          : "Todas las Edades"}
                  </span>
                </div>

                {/* POSITION TITLE */}
                <div>
                  <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {job.positions[bi]}
                  </h3>
                </div>

                {/* DETAILS TEXT */}
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {job.details[bi]}
                </p>

                {/* PAY & REQUIREMENTS TAGS */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
                  {job.pay ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      <DollarSign className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{job.pay[bi]}</span>
                    </span>
                  ) : null}

                  {job.location ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-secondary-foreground">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{job.location[bi]}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* CONTACT FOOTER */}
              <div className="mt-5 pt-3.5 border-t border-border/60 space-y-2.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {lang === "es" ? "Contacto y Cómo Aplicar:" : "Contact & How to Apply:"}
                </div>

                {job.contact.notesEs || job.contact.notesEn ? (
                  <p className="text-xs text-muted-foreground italic">
                    {lang === "es" ? job.contact.notesEs : job.contact.notesEn}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {job.contact.phone ? (
                    <a
                      href={`tel:${job.contact.phone.replace(/[^0-9]/g, "")}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shadow-2xs"
                    >
                      <Phone className="size-3.5 text-primary group-hover:text-primary-foreground" />
                      <span>{job.contact.phone}</span>
                    </a>
                  ) : null}

                  {job.contact.email ? (
                    <a
                      href={`mailto:${job.contact.email}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shadow-2xs"
                    >
                      <Mail className="size-3.5 text-primary group-hover:text-primary-foreground" />
                      <span className="truncate max-w-[180px]">{job.contact.email}</span>
                    </a>
                  ) : null}

                  {job.contact.applyUrl ? (
                    <a
                      href={job.contact.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs ml-auto"
                    >
                      <span>{lang === "es" ? "Aplicar en Línea" : "Apply Online"}</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER NOTICE */}
      <div className="mt-8 rounded-2xl bg-secondary/50 p-4 text-center text-xs text-muted-foreground">
        {lang === "es"
          ? `Esta bolsa de empleo es administrada de forma comunitaria e informada por la oficina de consejería de ${schoolName}. Para agregar o actualizar vacantes, consulte en la oficina escolar.`
          : `This job board is maintained for community reference as provided by the ${schoolName} counseling office. To submit or update listings, please contact the school office.`}
      </div>
    </section>
  );
}
