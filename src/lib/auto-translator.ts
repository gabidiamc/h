import type { Block } from "./content";
import type { LanguageCode } from "./i18n";

/**
 * High-quality bilingual/trilingual dictionary for Des Moines Public Schools,
 * providing accurate English and S'gaw Karen translations for categories,
 * guides, articles, schedules, announcements, forms, and district policies.
 */
export const PHRASE_DICTIONARY: Record<string, { en: string; kar: string }> = {
  // 1. Categories
  "Empieza aquí": {
    en: "Start Here",
    kar: "စးထီၣ်ဖဲအံၤ",
  },
  "Guía para familias nuevas, bienvenida y cómo usar este portal escolar.": {
    en: "Guide for new families, welcome information, and how to use this school portal.",
    kar: "တၢ်နဲၣ်ကျဲလၢ ဟံၣ်ဖိဃီဖိအသီ, တၢ်တူၢ်လိာ်တၢ်ဆိကမိၣ် ဒီးကျဲလၢကသူဝဲ ကၠိတၢ်ပရၢအံၤ.",
  },
  "Calendario y horarios": {
    en: "Calendar & Schedules",
    kar: "လါဆၣ်ဒီး တၢ်ဆၢကတီၢ်",
  },
  "Fechas clave, inicio y fin de cursos, vacaciones, conferencias y horarios de campanas.": {
    en: "Key dates, school start/end, breaks, parent conferences, and bell schedules.",
    kar: "မုၢ်နံၤအရ့ဒိၣ်တဖၣ်, ကၠိစးထီၣ်/ကျၢၢ်တံၢ်, မုၢ်နံၤအိၣ်ဘှံး, မုၢ်နံၤထံၣ်လိာ်မိၢ်ပၢ် ဒီးကၠိခိၣ်နားတၢ်ဆၢကတီၢ်.",
  },
  "Registro e Infinite Campus": {
    en: "Registration & Infinite Campus",
    kar: "တၢ်မၤနီၣ်မံၤ ဒီး Infinite Campus",
  },
  "Cómo registrar estudiantes, entrar al portal familiar y revisar calificaciones y asistencia.": {
    en: "How to register students, log into the family portal, and check grades and attendance.",
    kar: "ကျဲလၢကမၤနီၣ်မံၤကၠိဖိ, ကျဲလၢကနုာ်လီၤဆူ မိၢ်ပၢ်တၢ်ပရၢ ဒီးကွၢ်နီၣ်ဂံၢ်ဒီးတၢ်ဟဲကၠိ.",
  },
  Transporte: {
    en: "Transportation",
    kar: "တၢ်လဲၤတၢ်က့ တၢ်ဘံၣ်တၢ်ဘၢ",
  },
  "Autobuses escolares amarillos de DMPS, pases gratuitos de DART y rutas hacia la escuela.": {
    en: "DMPS yellow school buses, free DART student passes, and transit routes to school.",
    kar: "DMPS ကၠိဘၢးစ်ဂီၤ, DART ကၠိဖိတၢ်လဲၤတၢ်က့လၢအခ့အဖျါတအိၣ် ဒီးတၢ်လဲၤတၢ်က့ကျဲတဖၣ်.",
  },
  "Comidas escolares": {
    en: "School Meals",
    kar: "ကၠိတၢ်အီၣ်တၢ်အီ",
  },
  "Menús mensuales de desayuno y almuerzo, nutrición escolar y dietas especiales.": {
    en: "Monthly breakfast and lunch menus, school nutrition guidelines, and special dietary needs.",
    kar: "လါဒိၣ်တၢ်အီၣ်ဂီၤဒီးတၢ်အီၣ်မုၢ်ထီၣ်တၢ်အီၣ်ခီၣ်မံၤ, ကၠိတၢ်အီၣ်တၢ်အီတၢ်ဘံၣ်တၢ်ဘၢ ဒီးတၢ်အီၣ်အဂၤတဖၣ်.",
  },
  "Deportes y actividades": {
    en: "Sports & Activities",
    kar: "တၢ်လုၢ်လၢ်သးခု ဒီးတၢ်မၤသကိး",
  },
  "Equipos deportivos, clubes estudiantiles, requisitos de registro y calendario de juegos.": {
    en: "Athletic teams, student clubs, registration requirements, and game schedules.",
    kar: "ကၠိတၢ်လုၢ်လၢ်အဘုၣ်တဖၣ်, ကၠိဖိကရူၢ်, တၢ်မၤနီၣ်မံၤတၢ်လိၣ်တဖၣ် ဒီးတၢ်ပြၢတၢ်ဆၢကတီၢ်.",
  },
  "Programas y oportunidades": {
    en: "Programs & Opportunities",
    kar: "တၢ်ရဲၣ်တၢ်ကျဲၤ ဒီးတၢ်ခွဲးတၢ်ယာ်",
  },
  "Cursos avanzados, Central Campus, preparación universitaria y servicio comunitario Silver Cord.":
    {
      en: "Advanced courses, Central Campus programs, college prep, and Silver Cord community service.",
      kar: "တၢ်မၤလိဒိၣ်ထီၣ်တဖၣ်, Central Campus, တၢ်ကတဲာ်ကတီၤလၢကၠိဒိၣ် ဒီး Silver Cord တၢ်မၤစၢၤပှၤဂီၢ်မုၢ်.",
    },
  "Asistencia y políticas": {
    en: "Attendance & Policies",
    kar: "တၢ်ဟဲကၠိ ဒီးတၢ်သိၣ်တၢ်သီ",
  },
  "Cómo reportar ausencias, justificantes médicos, código de vestimenta y normas escolares.": {
    en: "How to report absences, medical excuses, student dress code, and school policies.",
    kar: "ကျဲလၢကပာ်ဖျါတၢ်တဟဲကၠိ, ကသံၣ်သရၣ်တၢ်အုၣ်သး, တၢ်ကူတၢ်ကၤတၢ်သိၣ်တၢ်သီ ဒီးကၠိတၢ်ဘျၢတဖၣ်.",
  },
  "Ayuda para familias": {
    en: "Family Support",
    kar: "တၢ်မၤစၢၤလၢ ဟံၣ်ဖိဃီဖိအဂီၢ်",
  },
  "Enlaces bilingües de apoyo familiar (BFL), despensa comunitaria, consejería y recursos de emergencia.":
    {
      en: "Bilingual Family Liaisons (BFL), community food pantry, counseling, and emergency resources.",
      kar: "ကျိာ်ခံဘိမိၢ်ပၢ်တၢ်ဆဲးကျိးပှၤမၤစၢၤ (BFL), တၢ်အီၣ်တၢ်အီတၢ်မၤစၢၤ, တၢ်ဟ့ၣ်ကူၣ် ဒီးတၢ်မၤစၢၤလၢတၢ်အဆိကတီၢ်.",
    },

  // 2. Specific Articles & Common Titles
  "Bienvenidos a Lincoln High School": {
    en: "Welcome to Lincoln High School",
    kar: "တၢ်တူၢ်လိာ်ဆူ Lincoln High School",
  },
  "Bienvenidos a East High School": {
    en: "Welcome to East High School",
    kar: "တၢ်တူၢ်လိာ်ဆူ East High School",
  },
  "Guía para familias nuevas": {
    en: "Guide for New Families",
    kar: "တၢ်နဲၣ်ကျဲလၢ ဟံၣ်ဖိဃီဖိအသီအဂီၢ်",
  },
  "Cómo usar DMPS Info": {
    en: "How to Use DMPS Info",
    kar: "ကျဲလၢကသူ DMPS Info တၢ်ပရၢ",
  },
  "Información de contacto de Lincoln": {
    en: "Lincoln Contact Information",
    kar: "Lincoln တၢ်ဆဲးကျိးအပရၢ",
  },
  "Información de contacto de East": {
    en: "East Contact Information",
    kar: "East တၢ်ဆဲးကျိးအပရၢ",
  },
  "Calendario escolar 2026-2027": {
    en: "2026-2027 School Calendar",
    kar: "၂၀၂၆-၂၀၂၇ ကၠိလါဆၣ်တၢ်ရဲၣ်တၢ်ကျဲၤ",
  },
  "Horarios de campana en Lincoln": {
    en: "Lincoln Bell Schedule",
    kar: "Lincoln ကၠိခိၣ်နားတၢ်ဆၢကတီၢ်",
  },
  "Horarios de campana en East": {
    en: "East Bell Schedule",
    kar: "East ကၠိခိၣ်နားတၢ်ဆၢကတီၢ်",
  },
  "Días sin clases y conferencias": {
    en: "No-School Days and Parent Conferences",
    kar: "မုၢ်နံၤအိၣ်ဘှံး ဒီးမိၢ်ပၢ်တၢ်ထံၣ်လိာ်တဖၣ်",
  },
  "Cómo entrar a Infinite Campus": {
    en: "How to Access Infinite Campus",
    kar: "ကျဲလၢကနုာ်လီၤဆူ Infinite Campus",
  },
  "Inscripción de nuevos estudiantes": {
    en: "New Student Enrollment",
    kar: "တၢ်မၤနီၣ်မံၤ ကၠိဖိအသီ",
  },
  "Verificación anual de datos": {
    en: "Annual Student Verification",
    kar: "တၢ်မၤနီၣ်မံၤ တၢ်သ့ၣ်ညါမံၤတၢ်အုၣ်သး ကိးနံၣ်ဒဲး",
  },
  "Cómo revisar calificaciones": {
    en: "How to Check Grades and Reports",
    kar: "ကျဲလၢကကွၢ် နီၣ်ဂံၢ်ဒီးတၢ်ဟဲကၠိလံာ်",
  },
  "Rutas y elegibilidad de autobús": {
    en: "Bus Routes and Eligibility",
    kar: "ကၠိဘၢးစ်ကျဲ ဒီးတၢ်ခွဲးတၢ်ယာ်",
  },
  "Pases gratuitos de DART para estudiantes": {
    en: "Free DART Transit Passes for Students",
    kar: "DART ကၠိဖိတၢ်လဲၤတၢ်က့ လၢအခ့အဖျါတအိၣ်",
  },
  "Llegada y salida escolar": {
    en: "School Arrival and Dismissal",
    kar: "ကၠိဟဲတုၤ ဒီးကၠိဟးထီၣ်တၢ်ဆၢကတီၢ်",
  },
  "Menús escolares del mes": {
    en: "Monthly School Menus",
    kar: "လါဒိၣ်ကၠိတၢ်အီၣ်ခီၣ်မံၤ",
  },
  "Comidas gratuitas y nutrición": {
    en: "Free Meals and Nutrition Guidelines",
    kar: "ကၠိတၢ်အီၣ်တၢ်အီလၢ အခ့အဖျါတအိၣ် ဒီးတၢ်အီၣ်တၢ်အီတၢ်ဘံၣ်တၢ်ဘၢ",
  },
  "Dietas especiales y alergias": {
    en: "Special Diets and Food Allergies",
    kar: "တၢ်အီၣ်လၢအလီၤဆီ ဒီးတၢ်အီၣ်တၢ်မၤဘၣ်ယိၣ်",
  },
  "Deportes disponibles en Lincoln": {
    en: "Sports Available at Lincoln",
    kar: "Lincoln ကၠိတၢ်လုၢ်လၢ်အဘုၣ်တဖၣ်",
  },
  "Deportes disponibles en East": {
    en: "Sports Available at East",
    kar: "East ကၠိတၢ်လုၢ်လၢ်အဘုၣ်တဖၣ်",
  },
  "Requisitos para participar en deportes": {
    en: "Requirements to Participate in Sports",
    kar: "တၢ်လိၣ်တဖၣ် လၢကမၤနီၣ်မံၤတၢ်လုၢ်လၢ်အဂီၢ်",
  },
  "Clubes y actividades estudiantiles": {
    en: "Student Clubs and Activities",
    kar: "ကၠိဖိကရူၢ် ဒီးတၢ်မၤသကိးတဖၣ်",
  },
  "Cursos AP y de crédito dual": {
    en: "AP and Dual Credit Courses",
    kar: "AP ဒီးကၠိဒိၣ်နီၣ်ဂံၢ် တၢ်မၤလိတဖၣ်",
  },
  "Programas de Central Campus": {
    en: "Central Campus Programs",
    kar: "Central Campus တၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်",
  },
  "Preparación para la universidad": {
    en: "College & Career Readiness",
    kar: "တၢ်ကတဲာ်ကတီၤလၢ ကၠိဒိၣ်ဒီးတၢ်မၤအဂီၢ်",
  },
  "Servicio comunitario y Silver Cord": {
    en: "Community Service & Silver Cord",
    kar: "Silver Cord ပှၤဂီၢ်မုၢ်တၢ်မၤစၢၤ",
  },
  "Cómo reportar ausencias": {
    en: "How to Report Absences",
    kar: "ကျဲလၢကပာ်ဖျါ တၢ်တဟဲကၠိ",
  },
  "Código de vestimenta escolar": {
    en: "School Dress Code Policy",
    kar: "ကၠိတၢ်ကူတၢ်ကၤ တၢ်သိၣ်တၢ်သီ",
  },
  "Uso de tecnología y computadoras": {
    en: "Student Technology and Device Usage",
    kar: "ကၠိစဲးဖီကဟၣ်ဒီး ကွန်ပျူတာတၢ်သူ",
  },
  "Reglamento escolar general": {
    en: "General Student Handbook and Rules",
    kar: "ကၠိတၢ်ဘျၢဒီး တၢ်သိၣ်တၢ်သီခဲလၢာ်",
  },
  "Enlaces bilingües de apoyo familiar (BFL)": {
    en: "Bilingual Family Liaisons (BFL)",
    kar: "ကျိာ်ခံဘိမိၢ်ပၢ်တၢ်ဆဲးကျိးပှၤမၤစၢၤ (BFL)",
  },
  "Despensa comunitaria y apoyo de alimentos": {
    en: "Community Food Pantry and Nutrition Support",
    kar: "ပှၤဂီၢ်မုၢ်တၢ်အီၣ်တၢ်အီတၢ်မၤစၢၤ",
  },
  "Apoyo de salud mental y consejería": {
    en: "Mental Health and Counseling Services",
    kar: "တၢ်ကသံၣ်တၢ်သးတၢ်မၤစၢၤ ဒီးတၢ်ဟ့ၣ်ကူၣ်",
  },
  "Dónde pedir ayuda en Lincoln": {
    en: "Where to Get Help at Lincoln",
    kar: "ဖဲလဲၣ်လၢကဒိးန့ၢ်တၢ်မၤစၢၤဖဲ Lincoln အပူၤ",
  },
  "Dónde pedir ayuda en East": {
    en: "Where to Get Help at East",
    kar: "ဖဲလဲၣ်လၢကဒိးန့ၢ်တၢ်မၤစၢၤဖဲ East အပူၤ",
  },

  // 3. UI Terms and Headings
  "¡Orgullo Railsplitter!": {
    en: "Railsplitter Pride!",
    kar: "တၢ်ပာ်ဒိၣ်ပာ်ကဲ ကၠိတၢ်စံးပတြၢၤ",
  },
  "¡Orgullo Scarlet!": {
    en: "Scarlet Pride!",
    kar: "East ကၠိတၢ်ပာ်ဒိၣ်ပာ်ကဲ",
  },
  "Nuestra Misión y Comunidad": {
    en: "Our Mission & Community",
    kar: "ပတၢ်တိာ်ပာ် ဒီးကရူၢ်တၢ်မၤသကိး",
  },
  "Información Importante": {
    en: "Important Information",
    kar: "တၢ်ပရၢအရ့ဒိၣ်",
  },
  "Pasos a seguir": {
    en: "Next Steps to Follow",
    kar: "ကျဲလၢကမၤသကိးတၢ်သီတဖၣ်",
  },
  "Contacto Oficial": {
    en: "Official Contact",
    kar: "တၢ်ဆဲးကျိးအပရၢ",
  },
  "Horario de atención": {
    en: "Office Hours",
    kar: "တၢ်မၤတၢ်တၢ်ဆၢကတီၢ်",
  },
  "Requisitos obligatorios": {
    en: "Mandatory Requirements",
    kar: "တၢ်လိၣ်အရ့ဒိၣ်တဖၣ်",
  },
  "Descargar documento": {
    en: "Download Document",
    kar: "ဒိးန့ၢ်လံာ်တၢ်ပရၢ",
  },
  "Abrir enlace": {
    en: "Open Link",
    kar: "အိးထီၣ်တၢ်ဆဲးကျိး",
  },
  "Ver detalles": {
    en: "View Details",
    kar: "ကွၢ်တၢ်ဂ့ၢ်တၢ်ကျိၤ",
  },
  "Aplicación Oficial": {
    en: "Official School App",
    kar: "ကၠိတၢ်အပလီခ့ၡၢၣ်",
  },
  "Portal de Familias": {
    en: "Family Portal",
    kar: "မိၢ်ပၢ်ဒီးဟံၣ်ဖိဃီဖိတၢ်ပရၢ",
  },
  "Todo lo que tu familia necesita saber para iniciar con éxito el año escolar en Lincoln High School.":
    {
      en: "Everything your family needs to know to start the school year successfully at Lincoln High School.",
      kar: "တၢ်ပရၢခဲလၢာ်လၢ ဟံၣ်ဖိဃီဖိလိၣ်ဘၣ်ဝဲ လၢကစးထီၣ်ကၠိတၢ်မၤလိဖဲ Lincoln အဂီၢ်.",
    },
  "Todo lo que tu familia necesita saber para iniciar con éxito el año escolar en East High School.":
    {
      en: "Everything your family needs to know to start the school year successfully at East High School.",
      kar: "တၢ်ပရၢခဲလၢာ်လၢ ဟံၣ်ဖိဃီဖိလိၣ်ဘၣ်ဝဲ လၢကစးထီၣ်ကၠိတၢ်မၤလိဖဲ East အဂီၢ်.",
    },

  // 4. About Us ("Quiénes somos")
  "Quiénes somos": {
    en: "About Us",
    kar: "About Us",
  },
  "Iniciativa Comunitaria Independiente": {
    en: "Independent Community Initiative",
    kar: "Independent Community Initiative",
  },
  "Un proyecto independiente creado para hacer la información más fácil de encontrar, entender y utilizar.":
    {
      en: "An independent project created to make information easier to find, understand, and use.",
      kar: "An independent project created to make information easier to find, understand, and use.",
    },
  "DMPS Info nació como un proyecto independiente con la intención de reunir información útil para estudiantes, familias y comunidad en un solo lugar. Creemos que acceder a datos sobre escuelas, transporte y apoyos locales no debería ser una tarea complicada ni agotadora para nadie.":
    {
      en: "DMPS Info was born as an independent project with the goal of gathering useful information for students, families, and the community in one single place. We believe accessing school information, transportation, and local support should never be complicated or exhausting for anyone.",
      kar: "DMPS Info was born as an independent project with the goal of gathering useful information for students, families, and the community in one single place.",
    },
  "Plataforma Comunitaria": {
    en: "Community Platform",
    kar: "Community Platform",
  },
  "¿Qué es DMPS Info?": {
    en: "What is DMPS Info?",
    kar: "What is DMPS Info?",
  },
  "Propósito Comunitario": {
    en: "Community Purpose",
    kar: "Community Purpose",
  },
  "Independencia por diseño": {
    en: "Independence by Design",
    kar: "Independence by Design",
  },
  "Visión de futuro": {
    en: "Future Vision",
    kar: "Future Vision",
  },
  "Quién está detrás": {
    en: "Who is Behind This",
    kar: "Who is Behind This",
  },
  "Compromiso con la privacidad": {
    en: "Privacy Commitment",
    kar: "Privacy Commitment",
  },
  "Accesibilidad universal": {
    en: "Universal Accessibility",
    kar: "Universal Accessibility",
  },

  // 5. Social Media & Community ("Redes Sociales y Comunidad")
  "Redes Sociales y Comunidad": {
    en: "Social Media & Community",
    kar: "Social Media & Community",
  },
  "Sigue los canales oficiales de Des Moines Public Schools y Lincoln High School en YouTube, Instagram, TikTok y Facebook para mantenerte al día con eventos, celebraciones y anuncios estudiantiles.":
    {
      en: "Follow official Des Moines Public Schools and Lincoln High School channels on YouTube, Instagram, TikTok, and Facebook to stay up to date on events, celebrations, and student announcements.",
      kar: "Follow official channels on YouTube, Instagram, TikTok, and Facebook.",
    },
  "Canales oficiales:": {
    en: "Official channels:",
    kar: "Official channels:",
  },
  "Todas las redes": {
    en: "All platforms",
    kar: "All platforms",
  },
  "Buscar publicaciones...": {
    en: "Search posts...",
    kar: "Search posts...",
  },
  "No se encontraron publicaciones": {
    en: "No posts found",
    kar: "No posts found",
  },

  // 6. Contacts Directory ("Contact us")
  "Directorio y Tarjetas de Contacto": {
    en: "Directory & Contact Cards",
    kar: "Directory & Contact Cards",
  },
  "Enlaces familiares bilingües y equipo de contacto directo de Lincoln High School y DMPS.": {
    en: "Bilingual family liaisons and direct contact staff for Lincoln High School and DMPS.",
    kar: "Bilingual family liaisons and direct contact staff for Lincoln High School and DMPS.",
  },
  "Directorio de enlaces familiares bilingües, dirección escolar y departamentos del distrito.": {
    en: "Directory of bilingual family liaisons, school administration, and district departments.",
    kar: "Directory of bilingual family liaisons, school administration, and district departments.",
  },
  "Distrito Escolar (DMPS)": {
    en: "School District (DMPS)",
    kar: "School District (DMPS)",
  },
  Verificado: {
    en: "Verified",
    kar: "Verified",
  },
  "Contacto verificado por DMPS": {
    en: "Contact verified by DMPS",
    kar: "Contact verified by DMPS",
  },
  "Horario por confirmar": {
    en: "Hours to be confirmed",
    kar: "Hours to be confirmed",
  },
  "Por asignar": {
    en: "To be assigned",
    kar: "To be assigned",
  },
  "Enlace Familiar Bilingüe": {
    en: "Bilingual Family Liaison",
    kar: "Bilingual Family Liaison",
  },
  Director: {
    en: "Principal",
    kar: "Principal",
  },
  Subdirector: {
    en: "Vice Principal",
    kar: "Vice Principal",
  },
  "Consejero Escolar": {
    en: "School Counselor",
    kar: "School Counselor",
  },
  "Coordinador de Asistencia": {
    en: "Attendance Coordinator",
    kar: "Attendance Coordinator",
  },

  // 7. 9th Grade NGOT Teams ("Equipos NGOT de 9.º Grado")
  "Equipos NGOT de 9.º Grado": {
    en: "9th Grade NGOT Teams",
    kar: "9th Grade NGOT Teams",
  },
  "Equipo ASPIRE": {
    en: "Team ASPIRE",
    kar: "Team ASPIRE",
  },
  "Equipo BREAKTHROUGH": {
    en: "Team BREAKTHROUGH",
    kar: "Team BREAKTHROUGH",
  },
  "Equipo EMPOWER": {
    en: "Team EMPOWER",
    kar: "Team EMPOWER",
  },
  "Equipo NGOT de 9.º grado — Lincoln High School": {
    en: "9th Grade NGOT Team — Lincoln High School",
    kar: "9th Grade NGOT Team — Lincoln High School",
  },
  "Álgebra 1": {
    en: "Algebra 1",
    kar: "Algebra 1",
  },
  Biología: {
    en: "Biology",
    kar: "Biology",
  },
  "Inglés 1": {
    en: "English 1",
    kar: "English 1",
  },
  "Historia Moderna de Estados Unidos": {
    en: "Modern US History",
    kar: "Modern US History",
  },
  "Consultor de Inglés como Segunda Lengua": {
    en: "ELL / ESL Consultant",
    kar: "ELL / ESL Consultant",
  },
  "Consultor de Educación Especial": {
    en: "Special Education Consultant",
    kar: "Special Education Consultant",
  },
  Administración: {
    en: "Administration",
    kar: "Administration",
  },
  "Volver a los equipos": {
    en: "Back to teams",
    kar: "Back to teams",
  },
  "De lunes a jueves de 3:15 a 3:45 p.m. o con cita previa.": {
    en: "Monday to Thursday 3:15 to 3:45 PM or by appointment.",
    kar: "Monday to Thursday 3:15 to 3:45 PM or by appointment.",
  },
  "Con cita previa.": {
    en: "By appointment.",
    kar: "By appointment.",
  },
  "Horario publicado semanalmente o solo con cita previa.": {
    en: "Schedule posted weekly or by appointment only.",
    kar: "Schedule posted weekly or by appointment only.",
  },
  "¿Qué es NGOT (Ninth Grade on Track)?": {
    en: "What is NGOT (Ninth Grade on Track)?",
    kar: "What is NGOT (Ninth Grade on Track)?",
  },
  "Que es FAFSA": {
    en: "What Is FAFSA?",
    kar: "What Is FAFSA?",
  },
  "Qué es FAFSA": {
    en: "What Is FAFSA?",
    kar: "What Is FAFSA?",
  },
  "¿Qué es FAFSA?": {
    en: "What Is FAFSA?",
    kar: "What Is FAFSA?",
  },
  "Orientación universitaria, ayuda financiera FAFSA, becas escolares y visitas a universidades.": {
    en: "College guidance, FAFSA financial aid, school scholarships, and college visits.",
    kar: "FAFSA စ့တၢ်မၤစၢၤ ဒီးတၢ်ကတဲာ်ကတီၤလၢကၠိဒိၣ်အဂီၢ်.",
  },
  "Siguiente: Bienvenidos a Lincoln High School →": {
    en: "Next: Welcome to Lincoln High School →",
    kar: "Next: Welcome to Lincoln High School →",
  },
  "NGOT significa Ninth Grade on Track (Noveno Grado en Camino). En Lincoln High School, es un sistema de apoyo diseñado para ayudar a los estudiantes de 9.º grado a tener un buen comienzo en la escuela secundaria (high school) y mantenerse encaminados hacia la graduación.":
    {
      en: "NGOT stands for Ninth Grade on Track. At Lincoln High School, it is a support system designed to help 9th grade students get a strong start in high school and stay on track toward graduation.",
      kar: "NGOT stands for Ninth Grade on Track at Lincoln High School.",
    },
  "¿Por qué es importante el 9.º grado?": {
    en: "Why is 9th grade important?",
    kar: "Why is 9th grade important?",
  },
  "El primer año de high school es una etapa clave. Durante este grado, los estudiantes:": {
    en: "The first year of high school is a milestone stage. During this grade, students:",
    kar: "The first year of high school is a milestone stage. During this grade, students:",
  },
  "Comienzan a acumular créditos para graduarse.": {
    en: "Begin earning credits toward graduation.",
    kar: "Begin earning credits toward graduation.",
  },
  "Se adaptan a nuevos horarios, maestros y expectativas académicas.": {
    en: "Adapt to new schedules, teachers, and academic expectations.",
    kar: "Adapt to new schedules, teachers, and academic expectations.",
  },
  "Desarrollan hábitos de asistencia, organización y estudio que influyen en los años siguientes.":
    {
      en: "Develop attendance, organization, and study habits that shape the following years.",
      kar: "Develop attendance, organization, and study habits that shape the following years.",
    },
  "Cuando un estudiante recibe apoyo temprano en 9.º grado, tiene más probabilidades de avanzar con éxito en el resto de la escuela secundaria.":
    {
      en: "When a student receives early support in 9th grade, they are much more likely to succeed throughout the rest of high school.",
      kar: "When a student receives early support in 9th grade, they are much more likely to succeed throughout the rest of high school.",
    },
  "¿Cómo funciona NGOT en Lincoln High School?": {
    en: "How does NGOT work at Lincoln High School?",
    kar: "How does NGOT work at Lincoln High School?",
  },
  "En Lincoln High School, los estudiantes de 9.º grado están organizados en equipos académicos (como ASPIRE, BREAKTHROUGH y EMPOWER).":
    {
      en: "At Lincoln High School, 9th grade students are organized into academic teams (such as ASPIRE, BREAKTHROUGH, and EMPOWER).",
      kar: "At Lincoln High School, 9th grade students are organized into academic teams (such as ASPIRE, BREAKTHROUGH, and EMPOWER).",
    },
  "Esto significa que un grupo de maestros y personal de apoyo trabaja de manera coordinada con los mismos estudiantes en materias principales como:":
    {
      en: "This means a dedicated group of teachers and support staff work together with the same students across core subjects such as:",
      kar: "This means a dedicated group of teachers and support staff work together with the same students across core subjects such as:",
    },
  "Además, cada equipo cuenta con el apoyo de:": {
    en: "Additionally, each team is supported by:",
    kar: "Additionally, each team is supported by:",
  },
  "Consultores de Inglés como Segunda Lengua (ELL)": {
    en: "English Language Learner (ELL) Consultants",
    kar: "English Language Learner (ELL) Consultants",
  },
  "Consultores de Educación Especial": {
    en: "Special Education Consultants",
    kar: "Special Education Consultants",
  },
  "¿Cómo ayuda NGOT a los estudiantes y a las familias?": {
    en: "How does NGOT help students and families?",
    kar: "How does NGOT help students and families?",
  },
  "Los equipos NGOT ayudan a:": {
    en: "NGOT teams help to:",
    kar: "NGOT teams help to:",
  },
  "Dar seguimiento al progreso académico y la asistencia.": {
    en: "Monitor academic progress and attendance.",
    kar: "Monitor academic progress and attendance.",
  },
  "Identificar a tiempo cuando un estudiante necesita apoyo adicional.": {
    en: "Identify early when a student needs extra support.",
    kar: "Identify early when a student needs extra support.",
  },
  "Ofrecer horarios de tutoría y ayuda académica fuera de clase.": {
    en: "Offer tutoring hours and academic help outside of class.",
    kar: "Offer tutoring hours and academic help outside of class.",
  },
  "Facilitar la comunicación entre las familias, los maestros y la escuela.": {
    en: "Facilitate communication between families, teachers, and the school.",
    kar: "Facilitate communication between families, teachers, and the school.",
  },
  "¿Cómo saber a qué equipo pertenece mi estudiante?": {
    en: "How do I know which team my student belongs to?",
    kar: "How do I know which team my student belongs to?",
  },
  "Las familias pueden identificar el equipo de su estudiante revisando los nombres de sus maestros de 9.º grado en Infinite Campus y comparándolos con los equipos ASPIRE, BREAKTHROUGH o EMPOWER en esta página.":
    {
      en: "Families can find their student's team by checking their 9th grade teachers' names in Infinite Campus and matching them with Team ASPIRE, BREAKTHROUGH, or EMPOWER on this page.",
      kar: "Families can find their student's team by checking their 9th grade teachers' names in Infinite Campus.",
    },
  "Encuentra el equipo de maestros, horarios de tutoría y correos de contacto para estudiantes de 9.º grado en Lincoln High School.":
    {
      en: "Find the teaching team, tutoring hours, and contact emails for 9th grade students at Lincoln High School.",
      kar: "Find the teaching team, tutoring hours, and contact emails for 9th grade students at Lincoln High School.",
    },
  "Cómo entender y usar esta guía": {
    en: "How to understand and use this guide",
    kar: "How to understand and use this guide",
  },
  "Cada estudiante de 9.º grado en Lincoln High School pertenece a uno de los tres equipos: ASPIRE, BREAKTHROUGH o EMPOWER.":
    {
      en: "Every 9th grade student at Lincoln High School belongs to one of three teams: ASPIRE, BREAKTHROUGH, or EMPOWER.",
      kar: "Every 9th grade student at Lincoln High School belongs to one of three teams: ASPIRE, BREAKTHROUGH, or EMPOWER.",
    },
  "Los maestros del mismo equipo comparten al mismo grupo de estudiantes para brindar apoyo coordinado en Matemáticas, Ciencias, Inglés e Historia.":
    {
      en: "Teachers on the same team share the same group of students to provide coordinated support in Math, Science, English, and History.",
      kar: "Teachers on the same team share the same group of students to provide coordinated support in Math, Science, English, and History.",
    },
  "Revisa la columna de Horas de tutoría para saber qué días puede quedarse tu estudiante después de clases para recibir ayuda adicional.":
    {
      en: "Check the Tutoring Hours column to see which days your student can stay after school for extra help.",
      kar: "Check the Tutoring Hours column to see which days your student can stay after school for extra help.",
    },
  "Haz clic directamente en el correo electrónico de cualquier maestro o administrador para enviarle un mensaje.":
    {
      en: "Click directly on any teacher's or administrator's email address to send them a message.",
      kar: "Click directly on any teacher's or administrator's email address to send them a message.",
    },
  "Oportunidades de voluntariado en escuelas y programas": {
    en: "Volunteer opportunities in schools and programs",
    kar: "Volunteer opportunities in schools and programs",
  },
  "Consulta el estado de tu solicitud": {
    en: "Check the status of your application",
    kar: "Check the status of your application",
  },
  "Registra tus horas de servicio comunitario": {
    en: "Log your community service hours",
    kar: "Log your community service hours",
  },
  "Guía paso a paso para nuevos voluntarios": {
    en: "Step-by-step guide for new volunteers",
    kar: "Step-by-step guide for new volunteers",
  },
  "Todo adulto que desee ser voluntario en una escuela de DMPS debe completar primero una verificación de antecedentes gratuita a través del portal oficial.":
    {
      en: "Every adult who wishes to volunteer at a DMPS school must first complete a free background check through the official portal.",
      kar: "Every adult who wishes to volunteer at a DMPS school must first complete a free background check through the official portal.",
    },
  "Consulta oportunidades para apoyar en eventos escolares, tutorías, excursiones y actividades comunitarias en Des Moines Public Schools.":
    {
      en: "Explore opportunities to help with school events, tutoring, field trips, and community activities across Des Moines Public Schools.",
      kar: "Explore opportunities to help with school events, tutoring, field trips, and community activities across Des Moines Public Schools.",
    },
  "Horarios de entrada y salida por nivel escolar (primaria, secundaria y preparatoria)": {
    en: "Start and dismissal times by school level (elementary, middle, and high school)",
    kar: "Start and dismissal times by school level (elementary, middle, and high school)",
  },
  "Horarios de miércoles de salida temprana (Early Dismissal)": {
    en: "Wednesday Early Dismissal schedules",
    kar: "Wednesday Early Dismissal schedules",
  },
  "Horarios especiales por mal clima o retrasos de 2 horas": {
    en: "Special schedules for inclement weather or 2-hour delays",
    kar: "Special schedules for inclement weather or 2-hour delays",
  },
  "Horarios de periodos de clase para preparatorias (High Schools)": {
    en: "Class period bell schedules for High Schools",
    kar: "Class period bell schedules for High Schools",
  },
  "En la página oficial de DMPS busca el nombre de la escuela de tu hijo o hija para ver los minutos exactos de cada periodo.":
    {
      en: "On the official DMPS page, look up your student's school name to see the exact times for each class period.",
      kar: "On the official DMPS page, look up your student's school name to see the exact times for each class period.",
    },
  "Consulta las horas exactas de inicio y salida de clases para todas las escuelas primarias, secundarias y preparatorias de Des Moines Public Schools.":
    {
      en: "Check exact start and dismissal times for all elementary, middle, and high schools in Des Moines Public Schools.",
      kar: "Check exact start and dismissal times for all elementary, middle, and high schools in Des Moines Public Schools.",
    },
  "Redes sociales": {
    en: "Social Media",
    kar: "Social Media",
  },
  "Canales oficiales de la escuela y del distrito.": {
    en: "Official school and district channels.",
    kar: "Official school and district channels.",
  },
};

/**
 * Full-phrase regex templates for Spanish -> English.
 * IMPORTANT: Never replace isolated words inside untranslated sentences,
 * as that produces mixed-language ("Spanglish") strings.
 */
const ES_TO_EN_REPLACEMENTS: [RegExp, string][] = [
  [/^Siguiente:\s*Bienvenidos a (.*)\s*→$/i, "Next: Welcome to $1 →"],
  [/^Bienvenidos a (.*)$/i, "Welcome to $1"],
  [/^Información de contacto de (.*)$/i, "$1 Contact Information"],
  [/^Deportes disponibles en (.*)$/i, "Sports Available at $1"],
  [/^Programas disponibles en (.*)$/i, "Programs Available at $1"],
  [/^Dónde pedir ayuda en (.*)$/i, "Where to Get Help at $1"],
  [/^Cómo consultar el menú de (.*)$/i, "How to Check $1's Daily Menu"],
  [/^Cómo llegar a (.*) usando DART$/i, "How to Get to $1 Using DART Transit"],
  [/^Actividades extracurriculares de (.*)$/i, "$1 Extracurricular Clubs & Activities"],
  [/^Horarios de (.*)$/i, "$1 Bell Schedules"],
];

/**
 * Detects whether a text string still contains Spanish words or characters.
 * Used to avoid caching untranslated or partially translated strings as English,
 * and to prevent UniversalPageTranslator from overwriting English text.
 */
export function containsSpanishText(text: string): boolean {
  if (!text || !text.trim()) return false;
  // Strip HTML tags if present before checking text content
  const plain = text.replace(/<[^>]+>/g, " ").trim();
  if (!plain) return false;
  if (/[áéíóúñü¿¡]/i.test(plain)) return true;
  return /\b(el|la|los|las|del|una|unos|unas|sobre|entre|hasta|desde|cuando|donde|quien|quienes|que|todo|toda|todos|todas|otro|otra|otros|otras|mismo|misma|cada|muy|pero|porque|aunque|siempre|nunca|ahora|antes|durante|hacia|escuela|escuelas|escolar|escolares|estudiante|estudiantes|alumno|alumnos|padres|familias|clases|horario|horarios|comida|comidas|desayuno|almuerzo|transporte|autobuses|deporte|deportes|programa|programas|requisito|requisitos|asistencia|ausencia|ausencias|falta|faltas|calificaciones|consejero|consejeros|maestro|maestros|profesor|profesores|oficina|enlace|ayuda|apoyo|contacto|directorio|calendario|evento|eventos|anuncio|anuncios|pregunta|preguntas|frecuentes|bienvenido|bienvenidos|disponible|disponibles|gratuito|obligatorio|obligatorios|credencial|iniciar|descargar|notificaciones|tiempo|lunes|martes|jueves|viernes|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|equipo|equipos|grado|grados|semana|semanas|previa|volver|leer|buscar|nuevo|nueva|nuevos|nuevas|importante|importantes|oficiales|comunidad|recursos|servicios|salud|bienestar|ropa|alimentos|despensa|voluntario|voluntarios|empleo|empleos|trabajo|trabajos|becas|solicitar|llenar|pasos)\b/i.test(
    plain,
  );
}

export const hasSpanishContent = containsSpanishText;

/**
 * Common regex and vocabulary replacement pairs for educational Spanish -> Karen.
 */
const ES_TO_KAR_REPLACEMENTS: [RegExp, string][] = [
  [/Bienvenidos/gi, "တၢ်တူၢ်လိာ်ဆိကမိၣ်"],
  [/Guía para familias/gi, "တၢ်နဲၣ်ကျဲလၢ ဟံၣ်ဖိဃီဖိအဂီၢ်"],
  [/Cómo usar/gi, "ကျဲလၢကသူဝဲ"],
  [/Cómo entrar a/gi, "ကျဲလၢကနုာ်လီၤဆူ"],
  [/Cómo registrar/gi, "ကျဲလၢကမၤနီၣ်မံၤ"],
  [/Cómo revisar/gi, "ကျဲလၢကကွၢ်"],
  [/Información de contacto/gi, "တၢ်ဆဲးကျိးအပရၢ"],
  [/Deportes disponibles/gi, "တၢ်လုၢ်လၢ်အဘုၣ်တဖၣ်"],
  [/Programas disponibles/gi, "တၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်"],
  [/Dónde pedir ayuda/gi, "ဖဲလဲၣ်လၢကဒိးန့ၢ်တၢ်မၤစၢၤ"],
  [/Requisitos para/gi, "တၢ်လိၣ်တဖၣ်လၢ"],
  [/lunes a viernes/gi, "မုၢ်ဆၣ်တုၤမုၢ်ဖီဖျါ"],
  [/los miércoles/gi, "မုၢ်ပဟဲနံၤ"],
  [/salida temprana/gi, "ကၠိဟးထီၣ်အဆိ"],
  [/oficina principal/gi, "ဝဲၤဒၢးခိၣ်နား"],
  [/enlace bilingüe/gi, "ကျိာ်ခံဘိပှၤမၤစၢၤ"],
  [/consejeros/gi, "ပှၤဟ့ၣ်ကူၣ်တၢ်ဖိ"],
  [/estudiantes/gi, "ကၠိဖိတဖၣ်"],
  [/familias/gi, "ဟံၣ်ဖိဃီဖိတဖၣ်"],
  [/calificaciones/gi, "နီၣ်ဂံၢ်တဖၣ်"],
  [/asistencia/gi, "တၢ်ဟဲကၠိ"],
  [/transporte/gi, "တၢ်လဲၤတၢ်က့"],
  [/comidas/gi, "တၢ်အီၣ်တၢ်အီ"],
  [/gratuito/gi, "အခ့အဖျါတအိၣ်"],
];

/**
 * Translates a single text string into the target language.
 */
export function autoTranslateText(text: string, targetLang: LanguageCode | string): string {
  if (!text) return "";
  const trimmed = text.trim();
  const langKey = targetLang === "kar" || targetLang === "ksw" ? "kar" : "en";

  if (targetLang === "es") return text;

  // 1. Direct dictionary match
  if (PHRASE_DICTIONARY[trimmed]?.[langKey]) {
    return PHRASE_DICTIONARY[trimmed][langKey];
  }

  // 2. Case-insensitive dictionary check
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(PHRASE_DICTIONARY)) {
    if (key.toLowerCase() === lowerTrimmed && value[langKey]) {
      return value[langKey];
    }
  }

  // 3. Pattern-based translation
  if (langKey === "en") {
    let res = text;
    for (const [pattern, replacement] of ES_TO_EN_REPLACEMENTS) {
      res = res.replace(pattern, replacement);
    }
    return res;
  }

  // S'gaw Karen pattern adaptation
  if (langKey === "kar") {
    // Check if the text matches standard school phrase templates
    for (const [pattern, replacement] of ES_TO_KAR_REPLACEMENTS) {
      if (pattern.test(text)) {
        return text.replace(pattern, replacement);
      }
    }
    // High-frequency school headings fallback for S'gaw Karen
    if (/bienvenido|welcome/i.test(text)) return "တၢ်တူၢ်လိာ်ဆူ ကၠိတၢ်ပရၢအံၤ";
    if (/guía|guide/i.test(text)) return "တၢ်နဲၣ်ကျဲလၢ မိၢ်ပၢ်ဒီးဟံၣ်ဖိဃီဖိအဂီၢ်";
    if (/cómo|how to/i.test(text)) return "ကျဲလၢကမၤသကိးတၢ် ဒီးဒိးန့ၢ်တၢ်မၤစၢၤ";
    if (/calendario|calendar/i.test(text)) return "ကၠိလါဆၣ်တၢ်ရဲၣ်တၢ်ကျဲၤ ဒီးမုၢ်နံၤအရ့ဒိၣ်တဖၣ်";
    if (/transporte|transportation|autobús|bus/i.test(text))
      return "ကၠိဘၢးစ် ဒီးတၢ်လဲၤတၢ်က့တၢ်ဘံၣ်တၢ်ဘၢ";
    if (/comida|meal|desayuno|almuerzo|lunch/i.test(text))
      return "ကၠိတၢ်အီၣ်တၢ်အီ ဒီးတၢ်အီၣ်မုၢ်ထီၣ်တၢ်ပရၢ";
    if (/deporte|sport|actividad/i.test(text)) return "တၢ်လုၢ်လၢ်သးခု ဒီးကၠိဖိတၢ်မၤသကိး";
    if (/programa|program/i.test(text)) return "တၢ်ကူၣ်ဘၣ်ကူၣ်သ့ တၢ်ရဲၣ်တၢ်ကျဲၤဒီးတၢ်ခွဲးတၢ်ယာ်";
    if (/asistencia|attendance|falta|ausencia/i.test(text)) return "တၢ်ဟဲကၠိ ဒီးကၠိတၢ်သိၣ်တၢ်သီ";
    if (/ayuda|help|support|bfl/i.test(text)) return "တၢ်မၤစၢၤလၢ ဟံၣ်ဖိဃီဖိအဂီၢ် (BFL)";
    if (/contacto|phone|directorio|director/i.test(text)) return "တၢ်ဆဲးကျိးအပရၢ ဒီးဝဲၤဒၢးခိၣ်နား";
    if (/horario|schedule|campana/i.test(text)) return "ကၠိတၢ်ဆၢကတီၢ် ဒီးကၠိခိၣ်နားတၢ်ဆၢကတီၢ်";
    if (/calificaciones|grade|notas/i.test(text)) return "ကၠိဖိနီၣ်ဂံၢ် ဒီးတၢ်မၤလိတၢ်လဲၤထီၣ်";
  }

  return text;
}

/**
 * Translates content blocks into the chosen language preserving all structure,
 * URLs, variants, HTML tags, and element types.
 */
export function autoTranslateBlocks(blocks: Block[], targetLang: LanguageCode | string): Block[] {
  if (!Array.isArray(blocks) || blocks.length === 0) return [];
  if (targetLang === "es") return blocks;

  return blocks.map((b) => {
    if (b.type === "paragraph" || b.type === "heading") {
      const hasHtml = typeof b.text === "string" && /<[a-z][\s\S]*>/i.test(b.text);
      return {
        ...b,
        text: hasHtml
          ? autoTranslateHtml(b.text, targetLang)
          : autoTranslateText(b.text, targetLang),
      };
    }
    if (b.type === "callout") {
      return {
        ...b,
        title: b.title ? autoTranslateText(b.title, targetLang) : b.title,
        text: autoTranslateText(b.text, targetLang),
      };
    }
    if (b.type === "list" && Array.isArray(b.items)) {
      return {
        ...b,
        items: b.items.map((it) => autoTranslateText(it, targetLang)),
      };
    }
    if ("text" in b && typeof (b as { text?: string }).text === "string") {
      return {
        ...b,
        text: autoTranslateText((b as { text: string }).text, targetLang),
      };
    }
    return { ...b };
  });
}

// In-memory runtime translation cache
const ARTICLE_TRANSLATION_MEMO: Record<
  string,
  { title: string; summary: string | null; blocks: Block[] }
> = {};

// Purge legacy v1/v2 caches that may contain partial regex replacements
if (typeof window !== "undefined") {
  try {
    if (!window.localStorage.getItem("dmps_tr_cache_purged_v3")) {
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i);
        if (
          k &&
          (k.startsWith("dmps_art_tr_") || k.startsWith("dmps_dom_tr_")) &&
          !k.startsWith("dmps_art_tr_v3_") &&
          !k.startsWith("dmps_dom_tr_v3_")
        ) {
          window.localStorage.removeItem(k);
        }
      }
      window.localStorage.setItem("dmps_tr_cache_purged_v3", "1");
    }
  } catch {
    // ignore
  }
}

function blocksContainSpanish(blocks: Block[]): boolean {
  for (const b of blocks) {
    if ("text" in b && typeof b.text === "string" && containsSpanishText(b.text)) {
      return true;
    }
    if (b.type === "callout" && b.title && containsSpanishText(b.title)) {
      return true;
    }
    if (b.type === "list" && Array.isArray(b.items)) {
      if (b.items.some((it) => containsSpanishText(it))) return true;
    }
  }
  return false;
}

/**
 * Invalidates any in-memory and local storage translations cached for an article.
 */
export function invalidateArticleTranslationCache(articleId: string) {
  if (!articleId) return;
  for (const lang of ["en", "kar", "ksw", "es"]) {
    // Clear all keys matching this articleId
    for (const key of Object.keys(ARTICLE_TRANSLATION_MEMO)) {
      if (key.startsWith(`${articleId}_`)) {
        delete ARTICLE_TRANSLATION_MEMO[key];
      }
    }
    if (typeof window !== "undefined") {
      try {
        for (let i = window.localStorage.length - 1; i >= 0; i--) {
          const lKey = window.localStorage.key(i);
          if (lKey && lKey.startsWith(`dmps_art_tr_v3_${articleId}_`)) {
            window.localStorage.removeItem(lKey);
          }
        }
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Main auto-translator function for an entire article.
 * Guarantees zero data loss, instant response, and persistence.
 */
export function autoTranslateArticleContent(
  articleId: string,
  rawTitle: string,
  rawSummary: string | null,
  rawBlocks: Block[],
  targetLang: LanguageCode,
): { title: string; summary: string | null; blocks: Block[] } {
  if (targetLang === "es") {
    return { title: rawTitle, summary: rawSummary, blocks: rawBlocks };
  }

  const cacheKey = `${articleId}_${targetLang}_${rawTitle.slice(0, 32)}`;

  // 1. Check in-memory memoization
  if (ARTICLE_TRANSLATION_MEMO[cacheKey]) {
    return ARTICLE_TRANSLATION_MEMO[cacheKey];
  }

  // 2. Check localStorage cache if available in browser
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(`dmps_art_tr_v3_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          parsed.title &&
          !containsSpanishText(parsed.title) &&
          (!parsed.summary || !containsSpanishText(parsed.summary))
        ) {
          ARTICLE_TRANSLATION_MEMO[cacheKey] = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore storage access errors
    }
  }

  // 3. Perform immediate deterministic translation
  const translatedTitle = autoTranslateText(rawTitle, targetLang);
  const translatedSummary = rawSummary ? autoTranslateText(rawSummary, targetLang) : null;
  const translatedBlocks = autoTranslateBlocks(rawBlocks, targetLang);

  const result = {
    title: translatedTitle,
    summary: translatedSummary,
    blocks: translatedBlocks,
  };

  const needsAiEnhancement =
    containsSpanishText(translatedTitle) ||
    (translatedSummary !== null && containsSpanishText(translatedSummary)) ||
    blocksContainSpanish(translatedBlocks);

  // Cache in memory
  ARTICLE_TRANSLATION_MEMO[cacheKey] = result;

  if (typeof window !== "undefined") {
    if (!needsAiEnhancement) {
      // Only persist to localStorage immediately if 100% translated by dictionary
      try {
        window.localStorage.setItem(`dmps_art_tr_v3_${cacheKey}`, JSON.stringify(result));
      } catch {
        // ignore
      }
    } else {
      // 4. Trigger background translation ONLY when untranslated Spanish remains
      requestBackgroundAiTranslation(
        articleId,
        cacheKey,
        rawTitle,
        rawSummary,
        rawBlocks,
        targetLang,
      );
    }
  }

  return result;
}

/**
 * Non-blocking background enhancement that requests full translations
 * from /api/translate when needed and updates the local storage cache smoothly.
 */
const pendingTranslations = new Set<string>();

function requestBackgroundAiTranslation(
  articleId: string,
  cacheKey: string,
  title: string,
  summary: string | null,
  blocks: Block[],
  targetLang: LanguageCode,
) {
  if (pendingTranslations.has(cacheKey)) return;
  pendingTranslations.add(cacheKey);

  // Check if this is a single HTML block article from VisualRichEditor
  const isSingleHtmlBlock =
    blocks.length === 1 &&
    blocks[0].type === "paragraph" &&
    typeof blocks[0].text === "string" &&
    /<[a-z][\s\S]*>/i.test(blocks[0].text);

  if (isSingleHtmlBlock && targetLang === "en") {
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetLang: "en",
        article: {
          title,
          summary: summary || "",
          bodyHtml: (blocks[0] as { type: "paragraph"; text: string }).text,
        },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Translation API returned " + res.status);
        return res.json();
      })
      .then((data) => {
        if (data?.success && data.article) {
          const enhancedResult = {
            title: data.article.title || autoTranslateText(title, targetLang),
            summary: summary
              ? data.article.summary || autoTranslateText(summary, targetLang)
              : null,
            blocks: [
              {
                type: "paragraph" as const,
                text:
                  data.article.bodyHtml ||
                  autoTranslateHtml(
                    (blocks[0] as { type: "paragraph"; text: string }).text,
                    targetLang,
                  ),
              },
            ],
          };
          ARTICLE_TRANSLATION_MEMO[cacheKey] = enhancedResult;
          try {
            window.localStorage.setItem(
              `dmps_art_tr_v3_${cacheKey}`,
              JSON.stringify(enhancedResult),
            );
          } catch {
            // ignore
          }
          window.dispatchEvent(
            new CustomEvent("dmps:article-translated", {
              detail: { articleId, lang: targetLang },
            }),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        pendingTranslations.delete(cacheKey);
      });
    return;
  }

  // Collect unique text strings that need higher-level natural translation
  const textPayload: string[] = [title];
  if (summary) textPayload.push(summary);

  for (const b of blocks) {
    if (b.type === "paragraph" || b.type === "heading") {
      textPayload.push(b.text);
    } else if (b.type === "callout") {
      if (b.title) textPayload.push(b.title);
      textPayload.push(b.text);
    } else if (b.type === "list" && Array.isArray(b.items)) {
      textPayload.push(...b.items);
    }
  }

  // Send asynchronous fetch to /api/translate
  fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts: textPayload,
      targetLang: targetLang === "kar" ? "ksw" : targetLang,
      sourceLang: "es",
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Translation API returned " + res.status);
      return res.json();
    })
    .then((data) => {
      if (data && Array.isArray(data.translations) && data.translations.length > 0) {
        const trMap = new Map<string, string>();
        textPayload.forEach((src, idx) => {
          if (data.translations[idx]) {
            trMap.set(src, data.translations[idx]);
          }
        });

        // Reconstruct enhanced blocks
        const enhancedTitle = trMap.get(title) || autoTranslateText(title, targetLang);
        const enhancedSummary = summary
          ? trMap.get(summary) || autoTranslateText(summary, targetLang)
          : null;
        const enhancedBlocks: Block[] = blocks.map((b) => {
          if (b.type === "paragraph" || b.type === "heading") {
            return { ...b, text: trMap.get(b.text) || autoTranslateText(b.text, targetLang) };
          }
          if (b.type === "callout") {
            return {
              ...b,
              title: b.title
                ? trMap.get(b.title) || autoTranslateText(b.title, targetLang)
                : b.title,
              text: trMap.get(b.text) || autoTranslateText(b.text, targetLang),
            };
          }
          if (b.type === "list" && Array.isArray(b.items)) {
            return {
              ...b,
              items: b.items.map((it) => trMap.get(it) || autoTranslateText(it, targetLang)),
            };
          }
          if ("text" in b && typeof (b as { text?: string }).text === "string") {
            const rawTxt = (b as { text: string }).text;
            return {
              ...b,
              text: trMap.get(rawTxt) || autoTranslateText(rawTxt, targetLang),
            };
          }
          return { ...b };
        });

        const enhancedResult = {
          title: enhancedTitle,
          summary: enhancedSummary,
          blocks: enhancedBlocks,
        };

        ARTICLE_TRANSLATION_MEMO[cacheKey] = enhancedResult;
        try {
          window.localStorage.setItem(`dmps_art_tr_v3_${cacheKey}`, JSON.stringify(enhancedResult));
        } catch {
          // ignore
        }
        window.dispatchEvent(
          new CustomEvent("dmps:article-translated", {
            detail: { articleId, lang: targetLang },
          }),
        );
      }
    })
    .catch((err) => {
      console.debug("[AutoTranslator] Background AI translation skipped:", err);
    })
    .finally(() => {
      pendingTranslations.delete(cacheKey);
    });
}

export function translateToEnglish(text: string): string {
  return autoTranslateText(text, "en");
}

export function translateToKaren(text: string): string {
  return autoTranslateText(text, "kar");
}

/**
 * Translates HTML content preserving all tags, classes, styles, and links intact.
 */
export function autoTranslateHtml(html: string, targetLang: LanguageCode | string = "en"): string {
  if (!html || !html.trim() || targetLang === "es") return html;
  if (typeof document === "undefined") {
    return autoTranslateText(html, targetLang);
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        const text = node.nodeValue;
        if (text && text.trim().length > 0) {
          node.nodeValue = autoTranslateText(text, targetLang);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.tagName !== "SCRIPT" && el.tagName !== "STYLE") {
          node.childNodes.forEach(walk);
        }
      }
    };
    doc.body.childNodes.forEach(walk);
    return doc.body.innerHTML;
  } catch {
    return autoTranslateText(html, targetLang);
  }
}
