import type { LanguageCode } from "@/lib/i18n";
import { editDistance, normalizeText, singularize } from "@/lib/help/text";

export interface FamilyAdviceLink {
  label: string;
  url: string;
  isExternal?: boolean;
  isAppStore?: boolean;
  highlight?: boolean;
}

export interface FamilyAdvice {
  id: string;
  topic: string;
  badge: string;
  title: string;
  description: string;
  steps: string[];
  links: FamilyAdviceLink[];
  relatedPrompts: string[];
}

export interface AdviceTopicEntry {
  id: string;
  keywords: string[];
  phrases: string[];
  badge: { es: string; en: string };
  title: { es: string; en: string };
  description: { es: string; en: string };
  steps: { es: string[]; en: string[] };
  links: {
    es: FamilyAdviceLink[];
    en: FamilyAdviceLink[];
  };
  relatedPrompts: { es: string[]; en: string[] };
}

export const ADVICE_CATALOG: AdviceTopicEntry[] = [
  {
    id: "infinite-campus",
    keywords: [
      "campus",
      "infinite",
      "campues",
      "infinit",
      "portal",
      "calificaciones",
      "calificasiones",
      "notas",
      "grades",
      "asistencia",
      "faltas",
      "tardanzas",
      "boletin",
      "report card",
      "horario de mi hijo",
      "clave de activacion",
      "activation key",
    ],
    phrases: [
      "infinite campus",
      "que es infinite campus",
      "portal de padres",
      "parent portal",
      "ver calificaciones",
      "revisar notas",
    ],
    badge: {
      es: "Portal Oficial de Familias",
      en: "Official Family Portal",
    },
    title: {
      es: "Infinite Campus: Calificaciones, Asistencia y Tareas",
      en: "Infinite Campus: Grades, Attendance & Assignments",
    },
    description: {
      es: "Es la aplicación y portal oficial de Des Moines Public Schools donde puedes revisar las notas de tu estudiante, ausencias diarias, horarios y avisos de los maestros en tiempo real.",
      en: "It is the official DMPS parent portal and mobile app to track your student's real-time grades, daily attendance, class schedules, and teacher announcements.",
    },
    steps: {
      es: [
        "Descarga en tu celular la app oficial 'Campus Parent' o entra desde cualquier navegador.",
        "Inicia sesión con tu cuenta de familia. Si es tu primera vez, solicita tu Código de Activación (Activation Key) en la oficina de tu escuela.",
        "Activa las alertas automáticas para recibir un aviso en tu teléfono cada vez que se registre una nueva calificación o inasistencia.",
      ],
      en: [
        "Download the official 'Campus Parent' app on your phone or log in through your web browser.",
        "Sign in with your family account. If you are a new user, request your Activation Key from your school office.",
        "Enable push notifications to receive instant updates whenever a new grade or absence is recorded.",
      ],
    },
    links: {
      es: [
        {
          label: "Entrar al Portal Infinite Campus",
          url: "https://campus.dmschools.org/campus/portal/parents/desmoines.jsp",
          isExternal: true,
          highlight: true,
        },
        {
          label: "App Store (iPhone)",
          url: "https://apps.apple.com/us/app/campus-parent/id1384542545",
          isExternal: true,
          isAppStore: true,
        },
        {
          label: "Google Play (Android)",
          url: "https://play.google.com/store/apps/details?id=com.infinitecampus.parent.campusp",
          isExternal: true,
          isAppStore: true,
        },
      ],
      en: [
        {
          label: "Log in to Infinite Campus Portal",
          url: "https://campus.dmschools.org/campus/portal/parents/desmoines.jsp",
          isExternal: true,
          highlight: true,
        },
        {
          label: "App Store (iPhone)",
          url: "https://apps.apple.com/us/app/campus-parent/id1384542545",
          isExternal: true,
          isAppStore: true,
        },
        {
          label: "Google Play (Android)",
          url: "https://play.google.com/store/apps/details?id=com.infinitecampus.parent.campusp",
          isExternal: true,
          isAppStore: true,
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿Cómo recuperar mi contraseña de Infinite Campus?",
        "¿Cómo ver el reporte de calificaciones del trimestre?",
        "¿Cómo justificar una falta de mi estudiante?",
      ],
      en: [
        "How to reset Infinite Campus password?",
        "How to view quarterly report cards?",
        "How to excuse a student absence?",
      ],
    },
  },
  {
    id: "dart-bus-id",
    keywords: [
      "dart",
      "bus",
      "buses",
      "autobus",
      "autobuses",
      "camion",
      "camiones",
      "transporte",
      "id",
      "credencial",
      "pase",
      "tarjeta",
      "viajar gratis",
      "parada",
      "paradas",
      "ruta",
      "rutas",
      "chofer",
      "subir al camion",
    ],
    phrases: [
      "como usar dart",
      "dart con id",
      "viajar en dart",
      "camion escolar",
      "autobus escolar",
      "transporte gratis",
    ],
    badge: {
      es: "Transporte Gratuito para Estudiantes",
      en: "Free Student Transit",
    },
    title: {
      es: "Cómo viajar gratis en DART con tu ID Escolar",
      en: "How to Ride DART for Free with Student ID",
    },
    description: {
      es: "Todos los estudiantes de secundaria y preparatoria de DMPS viajan 100% GRATIS en los autobuses públicos de DART durante los días de clase, simplemente mostrando su credencial escolar vigente.",
      en: "All DMPS middle and high school students ride DART public transit buses 100% FREE on school days simply by showing their valid school ID badge.",
    },
    steps: {
      es: [
        "Lleva siempre tu credencial escolar física (ID vigente de tu escuela de DMPS o Lincoln).",
        "Al subir al autobús de DART, muestra tu credencial al conductor o acércala al lector electrónico si te lo solicitan.",
        "Usa la app MyDART o ridedart.com para ver la llegada del autobús en tiempo real y no esperar en el frío.",
      ],
      en: [
        "Always carry your physical student ID card (valid DMPS or Lincoln High School ID).",
        "Show your ID card to the bus driver when boarding or tap it on the scanner if prompted.",
        "Use the MyDART app or ridedart.com to track real-time bus arrivals and plan your transfer routes.",
      ],
    },
    links: {
      es: [
        {
          label: "Sitio Oficial de DART (Des Moines)",
          url: "https://www.ridedart.com",
          isExternal: true,
          highlight: true,
        },
        {
          label: "Descargar App MyDART",
          url: "https://www.ridedart.com/mydart-app",
          isExternal: true,
          isAppStore: true,
        },
        {
          label: "Ver Rutas y Paradas en vivo en este sitio",
          url: "/transporte/dart",
          highlight: false,
        },
      ],
      en: [
        {
          label: "Official DART Website (Des Moines)",
          url: "https://www.ridedart.com",
          isExternal: true,
          highlight: true,
        },
        {
          label: "Download MyDART App",
          url: "https://www.ridedart.com/mydart-app",
          isExternal: true,
          isAppStore: true,
        },
        {
          label: "View Live Routes & Stops on Site",
          url: "/transporte/dart",
          highlight: false,
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿Qué ruta de DART pasa cerca de Lincoln High School?",
        "¿Qué hacer si un estudiante perdió su ID escolar?",
        "¿DART opera durante los fines de semana?",
      ],
      en: [
        "Which DART route stops near Lincoln High School?",
        "What to do if a student lost their school ID?",
        "Does DART run during weekends?",
      ],
    },
  },
  {
    id: "enrollment-registration",
    keywords: [
      "inscribir",
      "inscripcion",
      "inscripciones",
      "matricula",
      "matricular",
      "registro",
      "registrar",
      "enrollment",
      "registration",
      "oler",
      "nuevo estudiante",
      "nueva familia",
      "kindergarten",
      "cambio de domicilio",
      "mudanza",
    ],
    phrases: [
      "como inscribir a mi hijo",
      "registro escolar",
      "matricula de estudiantes",
      "nueva inscripcion",
      "online registration",
    ],
    badge: {
      es: "Trámite e Inscripción Escolar",
      en: "School Enrollment",
    },
    title: {
      es: "Inscripción Escolar y Registro en Línea (OLER)",
      en: "School Enrollment & Online Registration (OLER)",
    },
    description: {
      es: "El registro para nuevos alumnos y la actualización anual de datos para familias actuales se realiza por internet a través del sistema oficial de DMPS.",
      en: "Annual registration and new student enrollment are completed online through the official Des Moines Public Schools portal.",
    },
    steps: {
      es: [
        "Si ya eres familia de DMPS, ingresa a Infinite Campus Parent y selecciona 'Online Registration' para verificar datos.",
        "Si eres una familia nueva, regístrate en el portal OLER con tu correo electrónico personal.",
        "Prepara tus documentos: comprobante de domicilio en Des Moines (recibo de luz/gas o renta), acta de nacimiento y registro de vacunas.",
      ],
      en: [
        "Existing families: log into Infinite Campus Parent and select 'Online Registration' to verify your address.",
        "New families: start your application on the DMPS OLER portal using an active email address.",
        "Have ready: proof of Des Moines residency (utility bill or lease), student birth certificate, and immunization records.",
      ],
    },
    links: {
      es: [
        {
          label: "Portal Oficial de Inscripciones DMPS",
          url: "https://www.dmschools.org/enrollment/",
          isExternal: true,
          highlight: true,
        },
        {
          label: "Centro de Bienvenida (Welcome Center)",
          url: "https://welcome.dmschools.org/",
          isExternal: true,
        },
        {
          label: "Directorio de Escuelas DMPS",
          url: "/escuelas",
        },
      ],
      en: [
        {
          label: "Official DMPS Enrollment Portal",
          url: "https://www.dmschools.org/enrollment/",
          isExternal: true,
          highlight: true,
        },
        {
          label: "DMPS Welcome Center",
          url: "https://welcome.dmschools.org/",
          isExternal: true,
        },
        {
          label: "School Directory",
          url: "/escuelas",
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿Qué documentos necesito para inscribir a mi hijo?",
        "¿Dónde está el Welcome Center de Des Moines?",
        "¿A qué escuela le toca asistir a mi estudiante por zona?",
      ],
      en: [
        "What documents are needed to enroll my student?",
        "Where is the Des Moines Welcome Center located?",
        "Which school is my student assigned to by boundary?",
      ],
    },
  },
  {
    id: "meals-nutrislice",
    keywords: [
      "almuerzo",
      "desayuno",
      "comida",
      "cafeteria",
      "nutricion",
      "menu",
      "menus",
      "nutrislice",
      "lunch",
      "breakfast",
      "meals",
      "comer gratis",
      "alergias de comida",
    ],
    phrases: [
      "menu escolar",
      "comida gratis",
      "que dan de comer",
      "almuerzo escolar",
      "desayuno gratis",
    ],
    badge: {
      es: "Alimentación 100% Gratuita (CEP)",
      en: "100% Free School Meals (CEP)",
    },
    title: {
      es: "Desayuno y Almuerzo Escolar Gratuito en Nutrislice",
      en: "Free School Breakfast & Lunch on Nutrislice",
    },
    description: {
      es: "Todos los estudiantes de DMPS reciben desayuno y almuerzo nutritivo completamente GRATIS todos los días de clase gracias a la provisión comunitaria federal (CEP). No necesitas llenar solicitudes de pago.",
      en: "All enrolled DMPS students receive wholesome breakfast and lunch 100% FREE every school day through the federal CEP provision. No payment or application is required.",
    },
    steps: {
      es: [
        "Tu hijo solo debe acudir a la cafetería escolar durante el horario de desayuno o almuerzo para recibir su comida.",
        "Consulta el menú del día, ingredientes y alérgenos en vivo en la plataforma Nutrislice de DMPS.",
        "Si tu estudiante tiene una alergia diagnosticada (maní, lácteos, etc.), entrega la forma médica oficial a la enfermera escolar.",
      ],
      en: [
        "Your student just walks to the school cafeteria during breakfast or lunch times to get a full nutritious tray.",
        "View today's live menus, ingredients, and allergen notices on the DMPS Nutrislice platform.",
        "If your child has medical dietary requirements or food allergies, submit the physician diet order to the school nurse.",
      ],
    },
    links: {
      es: [
        {
          label: "Ver Menús en Vivo en Nutrislice",
          url: "https://dmschools.nutrislice.com/",
          isExternal: true,
          highlight: true,
        },
        {
          label: "Departamento de Nutrición DMPS",
          url: "https://www.dmschools.org/departments/operations/food-nutrition/",
          isExternal: true,
        },
      ],
      en: [
        {
          label: "Check Live Menus on Nutrislice",
          url: "https://dmschools.nutrislice.com/",
          isExternal: true,
          highlight: true,
        },
        {
          label: "DMPS Food & Nutrition Dept",
          url: "https://www.dmschools.org/departments/operations/food-nutrition/",
          isExternal: true,
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿A qué hora sirven el desayuno en la escuela?",
        "¿Pueden los alumnos llevar su propio almuerzo de casa?",
        "¿Hay opciones vegetarianas en la cafetería escolar?",
      ],
      en: [
        "What time is school breakfast served?",
        "Can students bring their own lunch from home?",
        "Are there vegetarian options available in cafeteria?",
      ],
    },
  },
  {
    id: "school-calendar",
    keywords: [
      "calendario",
      "fechas",
      "vacaciones",
      "dias festivos",
      "sin clases",
      "no school",
      "salida temprana",
      "early dismissal",
      "miercoles",
      "conferencias",
      "dias de nieve",
      "mal tiempo",
    ],
    phrases: [
      "cuando no hay clases",
      "calendario escolar",
      "dias festivos",
      "salida temprana los miercoles",
      "vacaciones de invierno",
    ],
    badge: {
      es: "Fechas Clave y Vacaciones",
      en: "Key Dates & Recesses",
    },
    title: {
      es: "Calendario Escolar, Salidas Tempranas y Días Sin Clases",
      en: "School Calendar, Early Dismissals & Days Off",
    },
    description: {
      es: "Planifica con anticipación los días sin clases por conferencias, capacitación de maestros, días festivos y el horario de salida temprana de los miércoles.",
      en: "Plan ahead for student no-school days, conferences, teacher development work, holidays, and regular Wednesday early dismissals.",
    },
    steps: {
      es: [
        "Casi todos los miércoles del ciclo escolar tienen salida temprana (Early Dismissal) para desarrollo profesional docente.",
        "Revisa nuestro calendario interactivo para consultar conferencias familiares y días festivos de tu escuela.",
        "En caso de tormentas de nieve, revisa los mensajes SMS oficiales de DMPS o la portada de este portal para anuncios de cierres.",
      ],
      en: [
        "Most Wednesdays during the school year have scheduled early dismissals for teacher professional development.",
        "Check our interactive calendar for family conference dates, breaks, and school-specific event updates.",
        "During winter snowstorms, monitor official DMPS text alerts or local news stations for closure and delay notices.",
      ],
    },
    links: {
      es: [
        {
          label: "Ver Calendario Interactivo en este sitio",
          url: "/calendario",
          highlight: true,
        },
        {
          label: "Descargar Calendario Oficial DMPS (PDF)",
          url: "https://www.dmschools.org/calendars/",
          isExternal: true,
        },
      ],
      en: [
        {
          label: "View Interactive Calendar on Site",
          url: "/calendario",
          highlight: true,
        },
        {
          label: "Download Official DMPS Calendar (PDF)",
          url: "https://www.dmschools.org/calendars/",
          isExternal: true,
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿A qué hora salen los estudiantes los miércoles?",
        "¿Cuándo inician las vacaciones de primavera?",
        "¿Cómo saber si se cancelan clases por nieve?",
      ],
      en: [
        "What time do students dismiss on Wednesdays?",
        "When does Spring Break begin?",
        "How to know if school is canceled due to snow?",
      ],
    },
  },
  {
    id: "sports-bound",
    keywords: [
      "deportes",
      "bound",
      "sports",
      "futbol",
      "soccer",
      "baloncesto",
      "basketball",
      "volleyball",
      "atletismo",
      "entrenador",
      "coach",
      "examen fisico",
      "physical",
      "tryouts",
      "pruebas",
    ],
    phrases: [
      "como entrar a deportes",
      "registro en bound",
      "examen fisico deportivo",
      "equipos de futbol",
      "atletismo escolar",
    ],
    badge: {
      es: "Deportes y Atletismo",
      en: "Sports & Athletics",
    },
    title: {
      es: "Registro en Bound y Requisitos Médicos para Deportes",
      en: "Bound Registration & Physicals for School Sports",
    },
    description: {
      es: "Para formar parte de cualquier equipo deportivo en DMPS, los estudiantes deben estar registrados en la plataforma Bound y contar con un examen físico deportivo anual firmado por un médico.",
      en: "To participate in any school athletic team at DMPS, students must be registered on Bound and have an annual sports physical signed by a medical provider on file.",
    },
    steps: {
      es: [
        "Crea o ingresa a tu cuenta familiar en Bound y vincula a tu estudiante con su número de identificación escolar.",
        "Sube una foto clara del examen físico deportivo de Iowa (vigente por 13 meses) y firma los consentimientos digitales.",
        "Consulta las fechas de pruebas (tryouts) y calendarios de partidos en la sección de deportes de tu preparatoria.",
      ],
      en: [
        "Sign up or log in to your parent account on Bound and link your student using their student ID.",
        "Upload a clear copy of the Iowa athletic physical form (valid for 13 months) and sign required concussion forms.",
        "Check tryout dates, practice schedules, and game calendars in your school's sports directory.",
      ],
    },
    links: {
      es: [
        {
          label: "Plataforma Oficial Bound DMPS",
          url: "https://www.gobound.com",
          isExternal: true,
          highlight: true,
        },
        {
          label: "Ver Deportes y Actividades en este sitio",
          url: "/deportes-actividades",
        },
      ],
      en: [
        {
          label: "Official Bound DMPS Portal",
          url: "https://www.gobound.com",
          isExternal: true,
          highlight: true,
        },
        {
          label: "View Sports & Activities on Site",
          url: "/deportes-actividades",
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿Dónde conseguir el formulario de examen físico?",
        "¿Qué deportes hay disponibles en el semestre de otoño?",
        "¿Hay costo para unirse a los equipos deportivos escolares?",
      ],
      en: [
        "Where can I get the athletic physical exam form?",
        "What sports are offered during the Fall semester?",
        "Is there a fee to join high school sports teams?",
      ],
    },
  },
  {
    id: "health-nurse",
    keywords: [
      "salud",
      "enfermera",
      "enfermeria",
      "nurse",
      "vacunas",
      "vacuna",
      "inmunizacion",
      "immunization",
      "tdap",
      "meningococo",
      "dental",
      "vision",
      "pastillas",
      "medicamento",
      "alergias",
    ],
    phrases: [
      "vacunas obligatorias",
      "hablar con la enfermera",
      "medicamentos en la escuela",
      "certificado de vacunas de iowa",
    ],
    badge: {
      es: "Salud y Bienestar Escolar",
      en: "School Health & Wellness",
    },
    title: {
      es: "Vacunas Obligatorias y Servicios de Enfermería",
      en: "Required Immunizations & School Nurse Services",
    },
    description: {
      es: "La ley del estado de Iowa exige que los estudiantes cuenten con su registro de vacunas al día (incluidas Tdap y meningitis para 7° y 12° grado) y revisiones de salud para poder asistir a clases.",
      en: "Iowa state law requires up-to-date immunizations (including Tdap and Meningococcal for 7th & 12th grades) and dental/vision certificates for students to attend school.",
    },
    steps: {
      es: [
        "Solicita a tu pediatra o clínica local el Certificado Oficial de Inmunización del Estado de Iowa.",
        "Entrega el certificado en la oficina de enfermería de la escuela o adjúntalo en tu inscripción digital.",
        "Si tu hijo requiere tomar medicamento recetado en la escuela, entrégalo en su envase original a la enfermera junto con la receta médica firmada.",
      ],
      en: [
        "Obtain an official Iowa Certificate of Immunization from your pediatrician or local clinic.",
        "Submit the form to your school nurse's office or upload it via the digital registration portal.",
        "If your child needs prescription medication at school, deliver it in the original pharmacy bottle with the physician's signed form.",
      ],
    },
    links: {
      es: [
        {
          label: "Servicios de Salud Oficiales DMPS",
          url: "https://www.dmschools.org/departments/student-services/health-services/",
          isExternal: true,
          highlight: true,
        },
        {
          label: "Contactar a la Oficina Escolar",
          url: "/contact",
        },
      ],
      en: [
        {
          label: "Official DMPS Student Health Services",
          url: "https://www.dmschools.org/departments/student-services/health-services/",
          isExternal: true,
          highlight: true,
        },
        {
          label: "Contact School Office",
          url: "/contact",
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿Qué vacunas se necesitan para entrar a 7° o 12° grado?",
        "¿Dónde vacunarme gratis si no tengo seguro médico?",
        "¿Qué pasa si mi hijo se enferma durante las clases?",
      ],
      en: [
        "Which vaccines are needed for 7th or 12th grade?",
        "Where can I get free vaccines without health insurance?",
        "What happens if my child gets sick during class?",
      ],
    },
  },
  {
    id: "bell-schedules",
    keywords: [
      "campanas",
      "horario",
      "bell schedule",
      "entrada",
      "salida",
      "periodos",
      "a que hora entran",
      "a que hora salen",
      "tardanza",
      "asistencia",
      "llamar por falta",
    ],
    phrases: [
      "horario de campanas",
      "a que hora empiezan las clases",
      "horario de lincoln",
      "reportar una falta",
    ],
    badge: {
      es: "Horarios y Asistencia",
      en: "Schedules & Attendance",
    },
    title: {
      es: "Horarios de Entrada, Salida y Justificación de Ausencias",
      en: "Bell Schedules, Hours & Excusing Absences",
    },
    description: {
      es: "Conoce los horarios exactos de campanas, inicio de periodos escolares y a qué teléfono llamar para reportar ausencias antes del comienzo de clases.",
      en: "Find exact bell times, period schedules, and the direct attendance phone number to excuse absences before classes start.",
    },
    steps: {
      es: [
        "El día escolar habitual inicia a las 8:20 AM y concluye a las 3:25 PM (los miércoles termina aproximadamente a la 1:55 PM).",
        "Consulta el horario por periodos específicos de Lincoln High School en la sección de horarios de este portal.",
        "Si tu hijo no asistirá a clases, llama a la línea de asistencia de la escuela antes de las 8:30 AM para que la falta quede justificada.",
      ],
      en: [
        "Standard high school days start at 8:20 AM and end at 3:25 PM (Wednesdays dismiss early around 1:55 PM).",
        "Check period-by-period bell schedules for Lincoln High School in our dedicated schedule section.",
        "If your student cannot attend, call the school attendance hotline before 8:30 AM to excuse the absence.",
      ],
    },
    links: {
      es: [
        {
          label: "Ver Horarios de Campanas de Lincoln",
          url: "/horario-campanas",
          highlight: true,
        },
        {
          label: "Directorio Telefónico de Asistencia",
          url: "/contact",
        },
      ],
      en: [
        {
          label: "View Lincoln Bell Schedule",
          url: "/horario-campanas",
          highlight: true,
        },
        {
          label: "Attendance Phone Directory",
          url: "/contact",
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿A qué número llamo para reportar que mi hijo está enfermo?",
        "¿Qué horario aplica los días de salida temprana?",
        "¿Cuántas faltas sin justificar son permitidas?",
      ],
      en: [
        "What number do I call to report my student sick?",
        "What schedule applies on early dismissal days?",
        "How many unexcused absences are permitted?",
      ],
    },
  },
  {
    id: "language-bfl",
    keywords: [
      "idioma",
      "espanol",
      "interprete",
      "traduccion",
      "traducir",
      "bfl",
      "family liaison",
      "enlace familiar",
      "no hablo ingles",
      "swahili",
      "karen",
      "somali",
      "arabe",
      "ayuda en mi idioma",
    ],
    phrases: [
      "interprete en la escuela",
      "ayuda en espanol",
      "enlace de familias",
      "bilingual family liaison",
    ],
    badge: {
      es: "Apoyo Bilingüe para Familias",
      en: "Bilingual Family Support",
    },
    title: {
      es: "Apoyo en tu Idioma: Enlaces de Familias (BFL) e Intérpretes",
      en: "Support in Your Language: Family Liaisons (BFL) & Interpreters",
    },
    description: {
      es: "Des Moines Public Schools ofrece intérpretes gratuitos y enlaces bilingües de familias (BFL) para comunicarse con maestros, directores y oficinas sin barreras de idioma.",
      en: "Des Moines Public Schools provides free language interpretation and dedicated Bilingual Family Liaisons (BFL) so language is never a barrier.",
    },
    steps: {
      es: [
        "Tienes derecho a solicitar un intérprete gratuito para cualquier reunión, llamada telefónica o conferencia de padres y maestros.",
        "Ubica al Enlace de Familias (BFL) asignado a tu escuela para recibir apoyo directo en español, swahili, karen y más.",
        "Puedes cambiar el idioma de este sitio web en la esquina superior para leer avisos y guías traducidas.",
      ],
      en: [
        "You have the legal right to a free interpreter for any meeting, conference, or phone call with school staff.",
        "Connect with the Bilingual Family Liaison (BFL) assigned to your school for personalized assistance in your home language.",
        "Switch the language selector at the top of this portal to browse translated notices and guides.",
      ],
    },
    links: {
      es: [
        {
          label: "Directorio de Enlaces de Familia (BFL)",
          url: "/contact",
          highlight: true,
        },
        {
          label: "Iniciativa de Familias BFL",
          url: "/bfl-status",
        },
      ],
      en: [
        {
          label: "Directory of Family Liaisons (BFL)",
          url: "/contact",
          highlight: true,
        },
        {
          label: "BFL Family Initiatives",
          url: "/bfl-status",
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿Cómo solicito un intérprete para la conferencia escolar?",
        "¿Quién es el enlace de familias en Lincoln High School?",
        "¿Dónde puedo recibir clases de inglés para adultos en Des Moines?",
      ],
      en: [
        "How do I request an interpreter for parent conferences?",
        "Who is the Bilingual Family Liaison at Lincoln High School?",
        "Where can adults take free ESL classes in Des Moines?",
      ],
    },
  },
  {
    id: "silver-cord",
    keywords: [
      "silver cord",
      "voluntariado",
      "servicio comunitario",
      "horas de servicio",
      "voluntario",
      "servicio",
      "graduacion",
      "honores",
      "cordon plateado",
    ],
    phrases: [
      "programa silver cord",
      "horas de voluntariado",
      "como registrar horas silver cord",
      "servicio comunitario escolar",
    ],
    badge: {
      es: "Reconocimiento Comunitario",
      en: "Community Service Honors",
    },
    title: {
      es: "Silver Cord: 120 Horas de Servicio Comunitario",
      en: "Silver Cord: 120 Community Service Hours",
    },
    description: {
      es: "El galardón Silver Cord premia a los estudiantes de preparatoria que completan 120 horas de voluntariado comunitario a lo largo de sus 4 años de estudio, otorgándoles un cordón de honor para la graduación.",
      en: "The Silver Cord award honors high school students who complete 120 hours of volunteer community service during high school, conferring an honor cord at graduation.",
    },
    steps: {
      es: [
        "Participa en actividades de servicio comunitario no remuneradas en organizaciones benéficas, escuelas o parques.",
        "Lleva la hoja de registro y asegúrate de que el supervisor del voluntariado la firme con su nombre y teléfono.",
        "Entrega tu formato firmado al asesor de Silver Cord de la preparatoria antes del 1° de mayo de cada año escolar.",
      ],
      en: [
        "Complete unpaid volunteer service with non-profit agencies, churches, schools, or community programs.",
        "Track your hours on the official service form and obtain your volunteer supervisor's signature.",
        "Submit completed forms to your high school Silver Cord advisor before May 1 of each academic year.",
      ],
    },
    links: {
      es: [
        {
          label: "Guía de Voluntariado en este sitio",
          url: "/voluntarios",
          highlight: true,
        },
        {
          label: "Página Oficial DMPS",
          url: "https://www.dmschools.org",
          isExternal: true,
        },
      ],
      en: [
        {
          label: "Volunteer Guide on Site",
          url: "/voluntarios",
          highlight: true,
        },
        {
          label: "Official DMPS Website",
          url: "https://www.dmschools.org",
          isExternal: true,
        },
      ],
    },
    relatedPrompts: {
      es: [
        "¿Qué actividades SÍ cuentan para horas de Silver Cord?",
        "¿Cuántas horas se necesitan por año escolar?",
        "¿Dónde conseguir el formulario de registro de horas?",
      ],
      en: [
        "Which volunteer activities count toward Silver Cord?",
        "How many hours are recommended per school year?",
        "Where can I get the Silver Cord hour log form?",
      ],
    },
  },
];

/**
 * Searches the advice catalog using fuzzy match, phrase containment, and token overlap.
 */
export function matchFamilyAdvice(query: string, lang: LanguageCode): FamilyAdvice | null {
  const normQuery = normalizeText(query);
  if (!normQuery) return null;

  let bestEntry: AdviceTopicEntry | null = null;
  let highestScore = 0;

  for (const entry of ADVICE_CATALOG) {
    let score = 0;

    // Check direct phrase match
    for (const phrase of entry.phrases) {
      const normPhrase = normalizeText(phrase);
      if (normQuery.includes(normPhrase) || normPhrase.includes(normQuery)) {
        score += 260;
      }
    }

    // Check token and keyword matches with fuzzy tolerance
    const queryWords = normQuery.split(" ").filter((w) => w.length > 2);
    for (const kw of entry.keywords) {
      const normKw = normalizeText(kw);
      if (normQuery.includes(normKw)) {
        score += 120;
        continue;
      }
      for (const qw of queryWords) {
        if (qw === normKw || singularize(qw) === singularize(normKw)) {
          score += 90;
        } else if (qw.length >= 4 && normKw.length >= 4) {
          if (qw.startsWith(normKw) || normKw.startsWith(qw)) {
            score += 70;
          } else if (Math.abs(qw.length - normKw.length) <= 2) {
            const dist = editDistance(qw, normKw);
            if (dist <= (qw.length <= 5 ? 1 : 2)) {
              score += 65;
            }
          }
        }
      }
    }

    if (score > highestScore && score >= 70) {
      highestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry) {
    const l = lang === "en" ? "en" : "es";
    return {
      id: bestEntry.id,
      topic: bestEntry.title[l],
      badge: bestEntry.badge[l],
      title: bestEntry.title[l],
      description: bestEntry.description[l],
      steps: bestEntry.steps[l],
      links: bestEntry.links[l],
      relatedPrompts: bestEntry.relatedPrompts[l],
    };
  }

  // Dynamic fallback: when no catalog entry matches with certainty, synthesize an assertive, clear advice
  return synthesizeDynamicAdvice(query, lang);
}

/**
 * Synthesizes an assertive, concise advice card tailored to an arbitrary question.
 */
function synthesizeDynamicAdvice(query: string, lang: LanguageCode): FamilyAdvice | null {
  const norm = normalizeText(query);
  if (norm.length < 3) return null;

  const isEn = lang === "en";

  // Check common question patterns
  const isQuestion =
    norm.includes("como") ||
    norm.includes("que") ||
    norm.includes("donde") ||
    norm.includes("cuando") ||
    norm.includes("por que") ||
    norm.includes("cuanto") ||
    norm.includes("how") ||
    norm.includes("what") ||
    norm.includes("where") ||
    norm.includes("when");

  const cleanSubject = query
    .replace(/[¿?¡!]/g, "")
    .replace(/\b(como|que es|que|donde|cuando|por que|how to|what is|where is|when is)\b/gi, "")
    .trim();

  const displayTitle = isEn
    ? `Direct Guidance: ${cleanSubject ? cleanSubject.slice(0, 45) : "Your Question"}`
    : `Orientación Directa: ${cleanSubject ? cleanSubject.slice(0, 45) : "Tu consulta"}`;

  return {
    id: "dynamic-advice",
    topic: isEn ? "School Help & Resources" : "Ayuda y Recursos Escolares",
    badge: isEn ? "Personalized Tip" : "Respuesta Rápida",
    title: displayTitle,
    description: isEn
      ? "Here is direct guidance to help your family get the exact answer and connect with official school staff immediately."
      : "Te compartimos los pasos directos para resolver tu consulta y ponerte en contacto inmediato con el personal escolar oficial.",
    steps: isEn
      ? [
          "Check the verified district articles and guides listed below matching your query.",
          "For personal student records or specific assistance, contact your school office directly or call your Bilingual Family Liaison.",
          "Visit the official DMPS parent portal for real-time status and authorized forms.",
        ]
      : [
          "Revisa los artículos y avisos oficiales verificados que aparecen abajo con respecto a tu búsqueda.",
          "Para asuntos específicos de tu estudiante o ayuda en tu idioma, comunícate directamente con la oficina de tu escuela o con el Enlace de Familias (BFL).",
          "Consulta el portal oficial de DMPS para trámites autorizados y formularios.",
        ],
    links: isEn
      ? [
          {
            label: "School & District Phone Directory",
            url: "/contact",
            highlight: true,
          },
          {
            label: "Official DMPS Website",
            url: "https://www.dmschools.org",
            isExternal: true,
          },
        ]
      : [
          {
            label: "Directorio Telefónico y Contacto Escolar",
            url: "/contact",
            highlight: true,
          },
          {
            label: "Sitio Oficial de DMPS (Des Moines)",
            url: "https://www.dmschools.org",
            isExternal: true,
          },
        ],
    relatedPrompts: isEn
      ? [
          "How to call the school attendance hotline?",
          "How to request an interpreter?",
          "Where is the school office located?",
        ]
      : [
          "¿A qué número llamar para hablar con la escuela?",
          "¿Cómo pedir ayuda de un intérprete bilingüe?",
          "¿Dónde consultar los trámites oficiales de DMPS?",
        ],
  };
}

/**
 * Suggested initial prompts for the Consejos section when search is idle.
 */
export const INITIAL_CONSEJOS_SUGGESTIONS = {
  es: [
    { label: "📱 ¿Qué es Infinite Campus?", query: "que es infinite campus" },
    { label: "🚌 ¿Cómo usar DART con ID?", query: "como usar dart con el id" },
    { label: "📝 ¿Cómo inscribir a mi hijo?", query: "como inscribir a mi hijo" },
    { label: "🥗 ¿Cómo ver el menú escolar?", query: "menu y comida escolar nutrislice" },
    { label: "📅 ¿Cuándo no hay clases?", query: "calendario escolar y dias festivos" },
    { label: "⚽ ¿Cómo registrarse en Bound?", query: "deportes y bound" },
  ],
  en: [
    { label: "📱 What is Infinite Campus?", query: "what is infinite campus" },
    { label: "🚌 Free DART with Student ID?", query: "how to ride dart with student id" },
    { label: "📝 How to enroll a student?", query: "how to enroll new student" },
    { label: "🥗 School menus on Nutrislice?", query: "free school lunch and nutrislice menu" },
    { label: "📅 No-school days & calendar?", query: "school calendar and holidays" },
    { label: "⚽ Sports registration on Bound?", query: "sports registration on bound" },
  ],
};
