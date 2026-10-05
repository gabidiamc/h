/**
 * Información NGOT (Ninth Grade on Track) — EXCLUSIVA de Abraham Lincoln High School.
 * Fuente: "Paquete de Recursos Para Padres/Guardianes Sobre la Preparación Para el 9.º Grado"
 * (Escuela Preparatoria Abraham Lincoln, 2600 SW 9th Street, Des Moines, IA 50315).
 */

export interface TeamMember {
  subject: string;
  name: string | null;
  email: string | null;
  officeHours: string | null;
}

export interface NgotTeam {
  slug: string;
  name: string;
  tagline: string;
  members: TeamMember[];
}

const STANDARD_HOURS = "De lunes a jueves de 3:15 a 3:45 p.m. o con cita previa.";

export const NGOT_TEAMS: NgotTeam[] = [
  {
    slug: "aspire",
    name: "Equipo ASPIRE",
    tagline: "Equipo NGOT de 9.º grado — Lincoln High School",
    members: [
      {
        subject: "Álgebra 1",
        name: "Jonathan Le",
        email: "jonathan.le@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Biología",
        name: "Bria Singson",
        email: "bria.singson@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Inglés 1",
        name: "Chris Smith",
        email: "chris.smith@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Historia Moderna de Estados Unidos",
        name: "Logan Borst",
        email: "logan.borst@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Consultor de Inglés como Segunda Lengua",
        name: "Aaron Eisler",
        email: "aaron.eisler@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Administración",
        name: "Ocie Lowery",
        email: "ocie.lowery@dmschools.org",
        officeHours: "Con cita previa.",
      },
    ],
  },
  {
    slug: "breakthrough",
    name: "Equipo BREAKTHROUGH",
    tagline: "Equipo NGOT de 9.º grado — Lincoln High School",
    members: [
      {
        subject: "Álgebra 1",
        name: "Alex Koch",
        email: "alexander.koch@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Biología",
        name: "Hannah Biederman",
        email: "hannah.biderman@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Inglés 1",
        name: "Aubrey Newton-Simons",
        email: "aubrey.newton-simons@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Historia Moderna de Estados Unidos",
        name: "Stacy Schmidt",
        email: "stacy.schmidt@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Consultor de Educación Especial",
        name: "Rhodolf Teneng",
        email: "rhodolf.teneng@dmschools.org",
        officeHours: STANDARD_HOURS,
      },
      {
        subject: "Administración",
        name: "McKenzie Kennedy",
        email: "mckenzie.kennedy@dmschools.org",
        officeHours: "Con cita previa.",
      },
    ],
  },
  {
    slug: "empower",
    name: "Equipo EMPOWER",
    tagline: "Equipo NGOT de 9.º grado — Lincoln High School",
    members: [
      {
        subject: "Álgebra 1",
        name: "Bailey Knapp",
        email: "bailey.knapp@dmschools.org",
        officeHours: null,
      },
      { subject: "Biología", name: null, email: null, officeHours: null },
      {
        subject: "Inglés 1",
        name: "Sarah Antongiovanni (Sra. Anton)",
        email: "sarah.antongiovanni@dmschools.org",
        officeHours: "Horario publicado semanalmente o solo con cita previa.",
      },
      {
        subject: "Historia Moderna de Estados Unidos",
        name: "Mark Patterson",
        email: "mark.patterson@dmschools.org",
        officeHours: null,
      },
      { subject: "Consultor de Educación Especial", name: null, email: null, officeHours: null },
      { subject: "Administración", name: "Wes Wolven", email: null, officeHours: null },
    ],
  },
];

export function findNgotTeam(slug: string): NgotTeam | null {
  return NGOT_TEAMS.find((team) => team.slug === slug) ?? null;
}

/* ---------------- Contenido del paquete de 9.º grado (solo Lincoln) ---------------- */

export interface GuideBlock {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  image?: { url: string; alt: string };
}

export const NGOT_INTRO: GuideBlock = {
  heading: "¿Qué es NGOT (Ninth Grade on Track)?",
  paragraphs: [
    "Los profesores titulares comparten el mismo grupo de alumnos y colaboran para brindarles el apoyo necesario. Analizamos las calificaciones, la asistencia, el comportamiento y muchos otros factores que influyen en el éxito académico de los estudiantes.",
    "Durante el año escolar 2024-2025, la tasa promedio de reprobación de los estudiantes de 9.º grado fue del 31.63%. En el ciclo 2025-2026, el primer año con equipos NGOT, la tasa bajó al 22.49%. Queremos reducirla aún más, pero no podemos lograrlo solos.",
    "¡Necesitamos padres/guardianes que formen parte de este equipo! Su participación es fundamental para el éxito de sus hijos.",
  ],
};

export const NGOT_GUIDE: GuideBlock[] = [
  {
    heading: "1. ¿Qué necesita mi estudiante para sus clases?",
    paragraphs: ["Materiales que aporta el estudiante:"],
    bullets: [
      "Mochila",
      "Carpeta o archivador de organización",
      "Separadores o carpetas para cada clase",
      "Estuche para lápices",
      "Varios lápices y bolígrafos",
      "Marcadores resaltadores (highlighters)",
      "Papel rayado de hojas sueltas y borradores",
      "Al menos un cuaderno de espiral",
    ],
  },
  {
    heading: "Materiales proporcionados por la escuela",
    bullets: [
      "Computadora portátil y cargador (portátil perdido o dañado: más de $300; cargador: $30)",
      "Gafete estudiantil",
      "Materiales del curso",
    ],
  },
  {
    heading: "Materiales por asignatura",
    bullets: [
      "Matemáticas: una carpeta de tres anillos. Todo lo demás se proporciona.",
      "Historia: todos los materiales se proporcionan.",
      "Ciencias: un cuaderno. El resto se proporciona.",
      "Literatura: cuaderno de espiral para diarios. Todo lo demás se proporciona.",
      "Donaciones opcionales: pañuelos de papel, toallitas desinfectantes, gel antibacterial, lápices, libros usados en buen estado para jóvenes, curitas, productos de higiene femenina, notas adhesivas y útiles escolares en general.",
    ],
  },
  {
    heading: "2. ¿Cómo reporto la ausencia de mi estudiante?",
    paragraphs: [
      "Es muy importante reportar las ausencias. Si su estudiante asiste a Lincoln y a Central Campus, debe avisar a ambas escuelas.",
    ],
    bullets: [
      "Aplicación del Portal de Padres (Infinite Campus)",
      "Llamar o enviar mensaje de texto a las Coordinadoras Bilingües Familiares: Sra. Brenda Lucero (515-371-7143) o Sra. Verónica Ortiz (515-829-5522)",
      "Lincoln — Jamecia Williams: 515-242-7500 · jamecia.williams@dmschools.org",
      "Central Academy — Shelley Renes: 515-242-7653 · shelley.renes@dmschools.org",
      "Al reportar, incluya nombre del estudiante, número de identificación, motivo y si es día completo, salida anticipada o llegada tardía.",
    ],
  },
  {
    heading: "3. Política de dispositivos electrónicos personales",
    bullets: [
      "Durante el horario de aprendizaje no se permite el uso de dispositivos electrónicos personales bajo ninguna circunstancia.",
      "Si necesita comunicarse con su estudiante, llame a la oficina principal: 515-242-7500.",
    ],
  },
  {
    heading: "4. ¿Hay tutorías disponibles?",
    bullets: [
      "Sí. Hay tutorías extraescolares dos días por semana (fechas por confirmar). Comuníquese con el profesor de la asignatura correspondiente.",
      "También hay tutorías generales en la cafetería; la información se publica en ParentSquare.",
      "Si aún no tiene ParentSquare, contacte a la Sra. Lucero (515-371-7143) o la Sra. Ortiz (515-829-5522).",
    ],
  },
  {
    heading: "5. Otros recursos para su estudiante",
    bullets: [
      "Despensa de alimentos: comuníquese con su consejero académico o vaya a la sala 1120.",
      "Grupo para nuevas mamás: escriba a dawn.sherman@dmschools.org para horarios.",
      "Terapia en la escuela: inscríbase con su consejero académico.",
      "Coordinadores de Seguridad y Prácticas Restaurativas (RSC) por apellido: A-F Morgan Sickles (morgan.sickles@dmschools.org); G-M Isabel Márquez (isabel.marquez@dmschools.org); N-S Dan Zepeda (dan.zepeda@dmschools.org); T-Z Sharlene Claytor (sharlene.claytor@dmschools.org).",
      "Ropa y apoyo del programa SUCCESS: sala 1080 (puerta a la derecha), o escriba a pete.aguilar@dmschools.org o kristen.mclain@dmschools.org.",
      "Build Lincoln Higher (BLH), participación comunitaria: https://buildlincolnhigher.com/",
    ],
  },
  {
    heading: "Requisitos de graduación (DMPS)",
    image: {
      url: "/__l5e/assets-v1/3f3baa7b-4f14-4ce1-a131-651fcd4c2711/requisitos-graduacion.png",
      alt: "Requisitos de graduación DMPS — créditos por materia",
    },
    bullets: [
      "Literatura / Inglés: 4 créditos",
      "Matemáticas: 3 créditos",
      "Estudios Sociales: 3 créditos",
      "Ciencias: 3 créditos",
      "Artes Finas: 1.5 créditos",
      "Educación Física: 1 crédito",
      "Clases electivas: 7.5 créditos",
      "Total: 23 créditos",
      "Cada clase aprobada otorga medio crédito (0.5) por semestre en la mayoría de las materias.",
      "Se considera atrasado al estudiante con menos de 6.0 créditos en 9.º grado, 12.0 en 10.º y 16.0 en 11.º, o si no cumple un requisito específico del año (por ejemplo, reprobar Historia Moderna de Estados Unidos en 9.º grado).",
    ],
  },
  {
    heading: "Calificaciones e Infinite Campus",
    image: {
      url: "/__l5e/assets-v1/14b20128-dcc6-4053-a6c9-fc181ab881d9/guia-calificaciones-infinite-campus.png",
      alt: "Guía de Informe Sobre los Logros del Estudiante — Lincoln High School",
    },
    paragraphs: [
      "Infinite Campus muestra el progreso en tres niveles: desempeño en tareas individuales, entendimiento del tema (estándar) y calificación del semestre. Lincoln envía reportes de progreso dos veces al mes.",
    ],
    bullets: [
      "Calificación del semestre: A (Honores) 3.50-4.0 · A 3.0-3.49 · B 2.50-2.99 · C 2.0-2.49 · D 1.75-1.99 · F 0-1.74",
      "Desempeño en tareas: ET supera el objetivo · AT logra el objetivo · PT desarrollando el objetivo · NM no cumple el objetivo",
      "Acceso a Infinite Campus: https://www.dmschools.org/quick-links-parents/",
      "Más información sobre calificaciones: https://grading.dmschools.org",
      "Si necesita ayuda para entrar a Infinite Campus, llame a Lincoln al 515-242-7500.",
    ],
  },
];
