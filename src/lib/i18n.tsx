import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { enB, esB, karB } from "./i18n/group-b";
import { enAC, esAC, karAC } from "./i18n/group-ac";
import { enD, esD, karD } from "./i18n/group-d";
import { karE } from "./i18n/group-e";
import { trackLanguageChange } from "@/analytics";

export type LanguageCode = "en" | "es";

export const LANGUAGES: {
  code: LanguageCode;
  label: string;
  english: string;
  dir: "ltr" | "rtl";
}[] = [
  { code: "es", label: "Español", english: "Spanish", dir: "ltr" },
  { code: "en", label: "English", english: "English", dir: "ltr" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "site.name": "DMPS Family Info",
  "site.tagline": "Information and resources for Des Moines Public Schools families",
  "site.official": "Official information hub for Des Moines Public Schools families.",
  "nav.home": "Home",
  "nav.categories": "Categories",
  "nav.resources": "Resources",
  "nav.resourcesMenuLabel": "Interactive Resources & Tools",
  "nav.articles": "Informational Articles",
  "nav.announcements": "Announcements",
  "nav.faq": "Questions",
  "nav.calendar": "Calendar",
  "nav.events": "Events",
  "nav.programs": "Programs",
  "nav.sports": "Sports & Activities",
  "nav.calendarDesc": "Key dates and school year calendar",
  "nav.eventsDesc": "School and community events, workshops and activities",
  "nav.programsDesc": "Academic and community programs",
  "nav.sportsDesc": "Athletics, sports and school clubs",
  "nav.dartDesc": "DART interactive bus map and routes",
  "nav.announcementsDesc": "Official alerts and district news",
  "nav.faqDesc": "Answers to frequently asked questions",
  "nav.contact": "Contact",
  "nav.accessibility": "Accessibility",
  "nav.menu": "Menu",
  "nav.openMenu": "Open navigation menu",
  "nav.closeMenu": "Close navigation menu",
  "nav.skip": "Skip to main content",
  "nav.staff": "Staff sign in",
  "nav.dart": "DART Routes",
  "lang.select": "Select language",
  "lang.label": "Language",
  "home.title": "How can we help your family today?",
  "home.subtitle":
    "Find clear answers about enrollment, school meals, buses, health and more. No account needed.",
  "home.searchPlaceholder": "Search for a resource, article or question…",
  "home.searchButton": "Search",
  "home.popular": "Informational Articles by Topic",
  "home.popularHint": "Explore reading articles on enrollment, health, meals, busing, and support.",
  "home.announcements": "Latest announcements",
  "home.featured": "Featured Articles & Reading Material",
  "home.viewAll": "View all",
  "home.quickLinks": "Quick links",
  "home.help.title": "Need help in your language?",
  "home.help.body":
    "Interpretation and translation are always free. Ask any school office or call the family line.",
  "search.title": "Search results",
  "search.for": "Results for",
  "search.none": "No results found",
  "search.noneHint": "Try fewer words, or browse the resources below.",
  "search.count": "results",
  "search.placeholder": "Search articles and resources",
  "search.filters": "Filter by topic",
  "search.all": "All topics",
  "categories.title": "Informational Articles for Families",
  "categories.subtitle": "Articles, policy guidelines and reading material categorized by topic.",
  "categories.articles": "articles",
  "category.empty": "No articles in this section yet.",
  "article.updated": "Updated",
  "article.inThisArticle": "In this article",
  "article.related": "Related articles",
  "article.helpful": "Was this page helpful?",
  "article.yes": "Yes",
  "article.no": "No",
  "article.thanks": "Thank you for your feedback.",
  "article.back": "Back to",
  "article.notTranslated":
    "This article is not yet available in your language. It is shown in English.",
  "article.print": "Print",
  "announcements.title": "Announcements",
  "announcements.subtitle": "Current news and alerts for DMPS families.",
  "announcements.none": "There are no active announcements right now.",
  "announcements.expires": "Active until",
  "level.info": "Information",
  "level.important": "Important",
  "level.urgent": "Urgent",
  "faq.title": "Frequently asked questions",
  "faq.subtitle": "Short answers to the questions families ask most.",
  "contact.title": "Contact us",
  "contact.subtitle": "Reach the district family support team.",
  "contact.email": "Email",
  "contact.phone": "Phone",
  "contact.hours": "Hours",
  "contact.hoursValue": "Monday to Friday, 8:00 a.m. – 4:30 p.m.",
  "accessibility.title": "Accessibility",
  "accessibility.subtitle": "Our commitment to an accessible site for every family.",
  "footer.rights": "Des Moines Public Schools",
  "footer.official": "Official district information",
  "footer.reviewUs": "Review us on",
  "common.loading": "Loading",
  "common.readMore": "Read article",
  "common.error": "Something went wrong. Please try again.",
  "auth.title": "Staff sign in",
  "auth.subtitle": "Only authorized district staff can manage content.",
  "auth.email": "Email address",
  "auth.password": "Password",
  "auth.signIn": "Sign in",
  "auth.signOut": "Sign out",
  "auth.backToSite": "Back to the public site",
};

const es: Dict = {
  "site.name": "DMPS Family Info",
  "site.tagline": "Información y recursos para las familias de las Escuelas Públicas de Des Moines",
  "site.official":
    "Centro oficial de información para las familias de las Escuelas Públicas de Des Moines.",
  "nav.home": "Inicio",
  "nav.categories": "Categorías",
  "nav.resources": "Recursos",
  "nav.resourcesMenuLabel": "Recursos y Herramientas Interactivas",
  "nav.articles": "Artículos Informativos",
  "nav.announcements": "Anuncios",
  "nav.faq": "Preguntas",
  "nav.calendar": "Calendario",
  "nav.events": "Eventos",
  "nav.programs": "Programas",
  "nav.sports": "Deportes y Actividades",
  "nav.calendarDesc": "Fechas clave y calendario escolar",
  "nav.eventsDesc": "Eventos escolares, comunitarios, talleres y actividades",
  "nav.programsDesc": "Programas académicos y comunitarios",
  "nav.sportsDesc": "Deportes, atletismo y clubes escolares",
  "nav.dartDesc": "Mapa interactivo de autobuses DART y rutas",
  "nav.announcementsDesc": "Avisos, alertas y noticias oficiales",
  "nav.faqDesc": "Respuestas a las preguntas frecuentes",
  "nav.contact": "Contacto",
  "nav.accessibility": "Accesibilidad",
  "nav.menu": "Menú",
  "nav.openMenu": "Abrir el menú de navegación",
  "nav.closeMenu": "Cerrar el menú de navegación",
  "nav.skip": "Ir al contenido principal",
  "nav.staff": "Acceso del personal",
  "nav.dart": "Rutas (DART)",
  "lang.select": "Seleccionar idioma",
  "lang.label": "Idioma",
  "home.title": "¿Cómo podemos ayudar a su familia hoy?",
  "home.subtitle":
    "Encuentre respuestas claras sobre inscripción, comidas, rutas de autobuses, salud y más.",
  "home.searchPlaceholder": "Busque un recurso, artículo o pregunta…",
  "home.searchButton": "Buscar",
  "home.popular": "Artículos Informativos por Tema",
  "home.popularHint":
    "Explore artículos de lectura sobre inscripciones, salud, comidas, transporte y apoyo familiar.",
  "home.announcements": "Anuncios recientes",
  "home.featured": "Artículos y Lecturas Destacadas",
  "home.viewAll": "Ver todos",
  "home.quickLinks": "Enlaces rápidos",
  "home.help.title": "¿Necesita ayuda en su idioma?",
  "home.help.body":
    "La interpretación y la traducción siempre son gratuitas. Pregunte en cualquier oficina escolar.",
  "search.title": "Resultados de búsqueda",
  "search.for": "Resultados para",
  "search.none": "No se encontraron resultados",
  "search.noneHint": "Use menos palabras o explore los recursos disponibles.",
  "search.count": "resultados",
  "search.placeholder": "Buscar artículos y recursos",
  "search.filters": "Filtrar por sección",
  "search.all": "Todos los recursos",
  "categories.title": "Artículos Informativos para Familias",
  "categories.subtitle":
    "Artículos, guías sobre políticas y lecturas informativas clasificadas por tema.",
  "categories.articles": "artículos",
  "category.empty": "Todavía no hay artículos en esta sección.",
  "article.updated": "Actualizado",
  "article.inThisArticle": "En este artículo",
  "article.related": "Artículos relacionados",
  "article.helpful": "¿Le resultó útil esta página?",
  "article.yes": "Sí",
  "article.no": "No",
  "article.thanks": "Gracias por su comentario.",
  "article.back": "Volver a",
  "article.notTranslated":
    "Este artículo aún no está disponible en su idioma. Se muestra en inglés.",
  "article.print": "Imprimir",
  "announcements.title": "Anuncios",
  "announcements.subtitle": "Noticias y alertas actuales para las familias de DMPS.",
  "announcements.none": "No hay anuncios activos en este momento.",
  "announcements.expires": "Vigente hasta",
  "level.info": "Información",
  "level.important": "Important",
  "level.urgent": "Urgente",
  "faq.title": "Preguntas frecuentes",
  "faq.subtitle": "Respuestas breves a las preguntas más comunes de las familias.",
  "contact.title": "Contáctenos",
  "contact.subtitle": "Comuníquese con el equipo de apoyo a las familias.",
  "contact.email": "Correo electrónico",
  "contact.phone": "Teléfono",
  "contact.hours": "Horario",
  "contact.hoursValue": "De lunes a viernes, 8:00 a.m. – 4:30 p.m.",
  "accessibility.title": "Accesibilidad",
  "accessibility.subtitle": "Nuestro compromiso con un sitio accesible para cada familia.",
  "footer.rights": "Escuelas Públicas de Des Moines",
  "footer.official": "Información oficial del distrito",
  "footer.reviewUs": "Califícanos en",
  "common.loading": "Cargando",
  "common.readMore": "Leer artículo",
  "common.error": "Algo salió mal. Inténtelo de nuevo.",
  "auth.title": "Acceso del personal",
  "auth.subtitle": "Solo el personal autorizado puede administrar el contenido.",
  "auth.email": "Correo electrónico",
  "auth.password": "Contraseña",
  "auth.signIn": "Iniciar sesión",
  "auth.signOut": "Cerrar sesión",
  "auth.backToSite": "Volver al sitio público",
};

const ar: Dict = {
  "site.tagline": "معلومات وموارد لعائلات مدارس دي موين العامة",
  "site.official": "المركز الرسمي للمعلومات لعائلات مدارس دي موين العامة.",
  "nav.home": "الرئيسية",
  "nav.categories": "المواضيع",
  "nav.announcements": "الإعلانات",
  "nav.faq": "الأسئلة",
  "nav.contact": "اتصل بنا",
  "nav.accessibility": "إمكانية الوصول",
  "nav.menu": "القائمة",
  "nav.openMenu": "فتح قائمة التنقل",
  "nav.closeMenu": "إغلاق قائمة التنقل",
  "nav.skip": "الانتقال إلى المحتوى الرئيسي",
  "nav.staff": "دخول الموظفين",
  "lang.select": "اختر اللغة",
  "lang.label": "اللغة",
  "home.title": "كيف يمكننا مساعدة عائلتك اليوم؟",
  "home.subtitle":
    "اعثر على إجابات واضحة حول التسجيل والوجبات والحافلات والصحة والمزيد. لا حاجة لإنشاء حساب.",
  "home.searchPlaceholder": "ابحث عن موضوع أو نموذج أو سؤال…",
  "home.searchButton": "بحث",
  "home.popular": "المواضيع الشائعة",
  "home.popularHint": "تصفح المواضيع التي تسأل عنها العائلات كثيرًا.",
  "home.announcements": "أحدث الإعلانات",
  "home.featured": "مفيد الآن",
  "home.viewAll": "عرض الكل",
  "home.quickLinks": "روابط سريعة",
  "home.help.title": "هل تحتاج مساعدة بلغتك؟",
  "home.help.body": "الترجمة الفورية والتحريرية مجانية دائمًا. اسأل في أي مكتب مدرسي.",
  "search.title": "نتائج البحث",
  "search.for": "نتائج عن",
  "search.none": "لا توجد نتائج",
  "search.noneHint": "جرّب كلمات أقل أو تصفح المواضيع.",
  "search.count": "نتائج",
  "search.placeholder": "ابحث في المقالات والموارد",
  "search.filters": "تصفية حسب الموضوع",
  "search.all": "كل المواضيع",
  "categories.title": "كل المواضيع",
  "categories.subtitle": "كل ما تحتاجه العائلات، مرتبًا حسب الموضوع.",
  "categories.articles": "مقالات",
  "category.empty": "لا توجد مقالات في هذا الموضوع بعد.",
  "article.updated": "آخر تحديث",
  "article.inThisArticle": "في هذه المقالة",
  "article.related": "مقالات ذات صلة",
  "article.helpful": "هل كانت هذه الصفحة مفيدة؟",
  "article.yes": "نعم",
  "article.no": "لا",
  "article.thanks": "شكرًا على ملاحظاتك.",
  "article.back": "العودة إلى",
  "article.notTranslated": "هذه المقالة غير متوفرة بلغتك بعد، وتُعرض بالإنجليزية.",
  "article.print": "طباعة",
  "announcements.title": "الإعلانات",
  "announcements.subtitle": "الأخبار والتنبيهات الحالية للعائلات.",
  "announcements.none": "لا توجد إعلانات نشطة حاليًا.",
  "announcements.expires": "سارٍ حتى",
  "level.info": "معلومة",
  "level.important": "مهم",
  "level.urgent": "عاجل",
  "faq.title": "الأسئلة المتكررة",
  "faq.subtitle": "إجابات قصيرة لأكثر أسئلة العائلات شيوعًا.",
  "contact.title": "اتصل بنا",
  "contact.subtitle": "تواصل مع فريق دعم الأسرة في المنطقة التعليمية.",
  "contact.email": "البريد الإلكتروني",
  "contact.phone": "الهاتف",
  "contact.hours": "ساعات العمل",
  "contact.hoursValue": "الاثنين إلى الجمعة، 8:00 ص – 4:30 م",
  "accessibility.title": "إمكانية الوصول",
  "accessibility.subtitle": "التزامنا بموقع متاح لكل عائلة.",
  "footer.rights": "مدارس دي موين العامة",
  "footer.official": "معلومات رسمية من المنطقة التعليمية",
  "footer.reviewUs": "قيّمنا على",
  "common.loading": "جارٍ التحميل",
  "common.readMore": "اقرأ المزيد",
  "common.error": "حدث خطأ ما. حاول مرة أخرى.",
  "auth.title": "دخول الموظفين",
  "auth.subtitle": "يمكن للموظفين المصرح لهم فقط إدارة المحتوى.",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.signIn": "تسجيل الدخول",
  "auth.signOut": "تسجيل الخروج",
  "auth.backToSite": "العودة إلى الموقع العام",
};

const sw: Dict = {
  "site.tagline": "Taarifa na rasilimali kwa familia za Shule za Umma za Des Moines",
  "site.official": "Kituo rasmi cha taarifa kwa familia za Shule za Umma za Des Moines.",
  "nav.home": "Mwanzo",
  "nav.categories": "Mada",
  "nav.announcements": "Matangazo",
  "nav.faq": "Maswali",
  "nav.contact": "Wasiliana",
  "nav.accessibility": "Ufikivu",
  "nav.menu": "Menyu",
  "nav.openMenu": "Fungua menyu",
  "nav.closeMenu": "Funga menyu",
  "nav.skip": "Rukia hadi maudhui makuu",
  "nav.staff": "Kuingia kwa wafanyakazi",
  "lang.select": "Chagua lugha",
  "lang.label": "Lugha",
  "home.title": "Tunawezaje kusaidia familia yako leo?",
  "home.subtitle":
    "Pata majibu wazi kuhusu usajili, chakula, mabasi, afya na zaidi. Hakuna akaunti inayohitajika.",
  "home.searchPlaceholder": "Tafuta mada, fomu au swali…",
  "home.searchButton": "Tafuta",
  "home.popular": "Mada maarufu",
  "home.popularHint": "Vinjari mada ambazo familia huuliza zaidi.",
  "home.announcements": "Matangazo mapya",
  "home.featured": "Yenye msaada sasa",
  "home.viewAll": "Ona yote",
  "home.quickLinks": "Viungo vya haraka",
  "home.help.title": "Unahitaji msaada kwa lugha yako?",
  "home.help.body": "Ukalimani na tafsiri ni bure kila wakati. Uliza ofisi yoyote ya shule.",
  "search.title": "Matokeo ya utafutaji",
  "search.for": "Matokeo ya",
  "search.none": "Hakuna matokeo",
  "search.noneHint": "Jaribu maneno machache au vinjari mada.",
  "search.count": "matokeo",
  "search.placeholder": "Tafuta makala na rasilimali",
  "search.filters": "Chuja kwa mada",
  "search.all": "Mada zote",
  "categories.title": "Mada zote",
  "categories.subtitle": "Kila kitu familia zinahitaji, kimepangwa kwa mada.",
  "categories.articles": "makala",
  "category.empty": "Bado hakuna makala katika mada hii.",
  "article.updated": "Imesasishwa",
  "article.inThisArticle": "Katika makala hii",
  "article.related": "Makala zinazohusiana",
  "article.helpful": "Je, ukurasa huu ulisaidia?",
  "article.yes": "Ndiyo",
  "article.no": "Hapana",
  "article.thanks": "Asante kwa maoni yako.",
  "article.back": "Rudi kwa",
  "article.notTranslated": "Makala hii bado haipo kwa lugha yako. Inaonyeshwa kwa Kiingereza.",
  "article.print": "Chapisha",
  "announcements.title": "Matangazo",
  "announcements.subtitle": "Habari na tahadhari za sasa kwa familia.",
  "announcements.none": "Hakuna matangazo yanayoendelea kwa sasa.",
  "announcements.expires": "Halali hadi",
  "level.info": "Taarifa",
  "level.important": "Muhimu",
  "level.urgent": "Dharura",
  "faq.title": "Maswali yanayoulizwa mara kwa mara",
  "faq.subtitle": "Majibu mafupi kwa maswali familia huuliza zaidi.",
  "contact.title": "Wasiliana nasi",
  "contact.subtitle": "Fikia timu ya msaada kwa familia.",
  "contact.email": "Barua pepe",
  "contact.phone": "Simu",
  "contact.hours": "Saa za kazi",
  "contact.hoursValue": "Jumatatu hadi Ijumaa, 8:00 asubuhi – 4:30 jioni",
  "accessibility.title": "Ufikivu",
  "accessibility.subtitle": "Ahadi yetu ya tovuti inayofikika kwa kila familia.",
  "footer.rights": "Shule za Umma za Des Moines",
  "footer.official": "Taarifa rasmi za wilaya",
  "footer.reviewUs": "Tukadirie kwenye",
  "common.loading": "Inapakia",
  "common.readMore": "Soma zaidi",
  "common.error": "Kuna hitilafu. Tafadhali jaribu tena.",
  "auth.title": "Kuingia kwa wafanyakazi",
  "auth.subtitle": "Ni wafanyakazi walioidhinishwa pekee wanaoweza kusimamia maudhui.",
  "auth.email": "Barua pepe",
  "auth.password": "Nenosiri",
  "auth.signIn": "Ingia",
  "auth.signOut": "Toka",
  "auth.backToSite": "Rudi kwenye tovuti ya umma",
};

const vi: Dict = {
  "site.tagline": "Thông tin và tài nguyên cho gia đình Trường Công lập Des Moines",
  "site.official": "Trung tâm thông tin chính thức cho gia đình Trường Công lập Des Moines.",
  "nav.home": "Trang chủ",
  "nav.categories": "Chủ đề",
  "nav.announcements": "Thông báo",
  "nav.faq": "Câu hỏi",
  "nav.contact": "Liên hệ",
  "nav.accessibility": "Khả năng tiếp cận",
  "nav.menu": "Menu",
  "nav.openMenu": "Mở menu điều hướng",
  "nav.closeMenu": "Đóng menu điều hướng",
  "nav.skip": "Chuyển đến nội dung chính",
  "nav.staff": "Nhân viên đăng nhập",
  "lang.select": "Chọn ngôn ngữ",
  "lang.label": "Ngôn ngữ",
  "home.title": "Hôm nay chúng tôi có thể giúp gì cho gia đình bạn?",
  "home.subtitle":
    "Tìm câu trả lời rõ ràng về ghi danh, bữa ăn, xe buýt, sức khỏe và hơn thế nữa. Không cần tài khoản.",
  "home.searchPlaceholder": "Tìm chủ đề, mẫu đơn hoặc câu hỏi…",
  "home.searchButton": "Tìm kiếm",
  "home.popular": "Chủ đề phổ biến",
  "home.popularHint": "Xem những chủ đề gia đình hỏi nhiều nhất.",
  "home.announcements": "Thông báo mới nhất",
  "home.featured": "Hữu ích ngay bây giờ",
  "home.viewAll": "Xem tất cả",
  "home.quickLinks": "Liên kết nhanh",
  "home.help.title": "Cần trợ giúp bằng ngôn ngữ của bạn?",
  "home.help.body": "Thông dịch và biên dịch luôn miễn phí. Hãy hỏi bất kỳ văn phòng trường nào.",
  "search.title": "Kết quả tìm kiếm",
  "search.for": "Kết quả cho",
  "search.none": "Không tìm thấy kết quả",
  "search.noneHint": "Hãy thử ít từ hơn hoặc xem các chủ đề.",
  "search.count": "kết quả",
  "search.placeholder": "Tìm bài viết và tài nguyên",
  "search.filters": "Lọc theo chủ đề",
  "search.all": "Tất cả chủ đề",
  "categories.title": "Tất cả chủ đề",
  "categories.subtitle": "Mọi thứ gia đình cần, được sắp xếp theo chủ đề.",
  "categories.articles": "bài viết",
  "category.empty": "Chưa có bài viết trong chủ đề này.",
  "article.updated": "Cập nhật",
  "article.inThisArticle": "Trong bài viết này",
  "article.related": "Bài viết liên quan",
  "article.helpful": "Trang này có hữu ích không?",
  "article.yes": "Có",
  "article.no": "Không",
  "article.thanks": "Cảm ơn phản hồi của bạn.",
  "article.back": "Quay lại",
  "article.notTranslated":
    "Bài viết này chưa có bằng ngôn ngữ của bạn nên được hiển thị bằng tiếng Anh.",
  "article.print": "In",
  "announcements.title": "Thông báo",
  "announcements.subtitle": "Tin tức và cảnh báo hiện tại cho các gia đình.",
  "announcements.none": "Hiện không có thông báo nào.",
  "announcements.expires": "Có hiệu lực đến",
  "level.info": "Thông tin",
  "level.important": "Quan trọng",
  "level.urgent": "Khẩn cấp",
  "faq.title": "Câu hỏi thường gặp",
  "faq.subtitle": "Câu trả lời ngắn cho các câu hỏi phổ biến nhất.",
  "contact.title": "Liên hệ",
  "contact.subtitle": "Liên hệ nhóm hỗ trợ gia đình của học khu.",
  "contact.email": "Email",
  "contact.phone": "Điện thoại",
  "contact.hours": "Giờ làm việc",
  "contact.hoursValue": "Thứ Hai đến thứ Sáu, 8:00 – 16:30",
  "accessibility.title": "Khả năng tiếp cận",
  "accessibility.subtitle": "Cam kết của chúng tôi về một trang web dễ tiếp cận.",
  "footer.rights": "Trường Công lập Des Moines",
  "footer.official": "Thông tin chính thức của học khu",
  "footer.reviewUs": "Đánh giá chúng tôi trên",
  "common.loading": "Đang tải",
  "common.readMore": "Đọc thêm",
  "common.error": "Đã xảy ra lỗi. Vui lòng thử lại.",
  "auth.title": "Nhân viên đăng nhập",
  "auth.subtitle": "Chỉ nhân viên được ủy quyền mới có thể quản lý nội dung.",
  "auth.email": "Địa chỉ email",
  "auth.password": "Mật khẩu",
  "auth.signIn": "Đăng nhập",
  "auth.signOut": "Đăng xuất",
  "auth.backToSite": "Quay lại trang công khai",
};

// S'gaw Karen. Strings without a confirmed translation fall back to English.
const kar: Dict = {
  "nav.home": "ဟံၣ်",
  "nav.categories": "တၢ်ဂ့ၢ်တဖၣ်",
  "nav.announcements": "တၢ်ဘိးဘၣ်သ့ၣ်ညါ",
  "nav.faq": "တၢ်သံကွၢ်တဖၣ်",
  "nav.contact": "ဆဲးကျိး",
  "nav.menu": "စရီ",
  "lang.select": "ဃုထၢကျိာ်",
  "lang.label": "ကျိာ်",
  "home.searchButton": "ဃုသ့ၣ်ညါ",
  "home.popular": "တၢ်ဂ့ၢ်လၢပှၤဃုအါ",
  "home.announcements": "တၢ်ဘိးဘၣ်သ့ၣ်ညါအသီ",
  "home.viewAll": "ကွၢ်ခဲလၢာ်",
  "announcements.title": "တၢ်ဘိးဘၣ်သ့ၣ်ညါ",
  "faq.title": "တၢ်သံကွၢ်လၢပှၤသံကွၢ်အါ",
  "contact.title": "ဆဲးကျိးပှၤ",
  "article.yes": "မ့ၢ်",
  "article.no": "တမ့ၢ်ဘၣ်",
  "common.loading": "စးထီၣ်ဒံး",
  "common.readMore": "ဖးအါထီၣ်",
};

const extraEn: Dict = {
  "theme.select": "Appearance",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "Use device setting",
  "nav.calendar": "Calendar",
  "nav.schools": "Schools",
  "nav.school": "Lincoln High School",
  "home.scope": "Information for Lincoln High School families",
  "home.scopeHint":
    "We only publish details confirmed on official Lincoln High School, DMPS or DART sources.",
  "nav.programs": "Programs",
  "nav.sports": "Sports & activities",
  "nav.admin": "Administrative access",
  "calendar.title": "School calendar",
  "calendar.subtitle": "Key dates, holidays, conferences and family events.",
  "calendar.month": "Month",
  "calendar.list": "List",
  "calendar.today": "Today",
  "calendar.none": "No events for this period.",
  "calendar.cancelled": "Cancelled",
  "calendar.addToCalendar": "Add to my calendar",
  "calendar.allTypes": "All event types",
  "calendar.allSchools": "All schools",
  "schools.title": "Schools and locations",
  "schools.subtitle": "Find a DMPS school, its contact details and hours.",
  "schools.none": "No schools match your filters yet.",
  "schools.allLevels": "All levels",
  "schools.website": "Official website",
  "schools.verified": "Verified on",
  "programs.title": "School programs",
  "programs.subtitle": "Academic, arts, language, health and family programs.",
  "programs.none": "No programs match your filters yet.",
  "programs.allTypes": "All program types",
  "programs.open": "Enrollment open",
  "programs.free": "Free",
  "programs.howToJoin": "How to participate",
  "sports.title": "Sports and activities",
  "sports.subtitle": "Athletics, clubs, arts, music and student leadership.",
  "sports.none": "No activities match your filters yet.",
  "sports.allSeasons": "All seasons",
  "sports.howToJoin": "How to join",
  "common.filters": "Filters",
  "common.search": "Search",
  "common.clear": "Clear",
  "common.official": "Official link",
  "common.contact": "Contact",
  "common.updated": "Last updated",
  "report.button": "Report incorrect information",
  "report.title": "Report incorrect information",
  "report.subtitle": "Tell us what looks wrong. Your report goes to the district team for review.",
  "report.kind": "What is the problem?",
  "report.kind.phone": "Wrong phone number",
  "report.kind.link": "Broken link",
  "report.kind.date": "Wrong date",
  "report.kind.outdated": "Outdated information",
  "report.kind.translation": "Translation problem",
  "report.message": "Details",
  "report.email": "Your email (optional)",
  "report.send": "Send report",
  "report.thanks": "Thank you. Our team will review this.",
};

const extraEs: Dict = {
  "theme.select": "Apariencia",
  "theme.light": "Claro",
  "theme.dark": "Oscuro",
  "theme.system": "Usar configuración del dispositivo",
  "nav.calendar": "Calendario",
  "nav.schools": "Escuelas",
  "nav.school": "Lincoln High School",
  "home.scope": "Información para familias de Lincoln High School",
  "home.scopeHint":
    "Solo publicamos datos confirmados en fuentes oficiales de Lincoln High School, DMPS o DART.",
  "nav.programs": "Programas",
  "nav.sports": "Deportes y actividades",
  "nav.admin": "Acceso administrativo",
  "calendar.title": "Calendario escolar",
  "calendar.subtitle": "Fechas importantes, vacaciones, conferencias y eventos familiares.",
  "calendar.month": "Mes",
  "calendar.list": "Lista",
  "calendar.today": "Hoy",
  "calendar.none": "No hay eventos en este período.",
  "calendar.cancelled": "Cancelado",
  "calendar.addToCalendar": "Agregar a mi calendario",
  "calendar.allTypes": "Todos los tipos de evento",
  "calendar.allSchools": "Todas las escuelas",
  "schools.title": "Escuelas y ubicaciones",
  "schools.subtitle": "Encuentre una escuela de DMPS, sus datos de contacto y horario.",
  "schools.none": "Ninguna escuela coincide con los filtros.",
  "schools.allLevels": "Todos los niveles",
  "schools.website": "Sitio web oficial",
  "schools.verified": "Verificado el",
  "programs.title": "Programas escolares",
  "programs.subtitle": "Programas académicos, de artes, idiomas, salud y familias.",
  "programs.none": "Ningún programa coincide con los filtros.",
  "programs.allTypes": "Todos los tipos de programa",
  "programs.open": "Inscripción abierta",
  "programs.free": "Gratuito",
  "programs.howToJoin": "Cómo participar",
  "sports.title": "Deportes y actividades",
  "sports.subtitle": "Deportes, clubes, artes, música y liderazgo estudiantil.",
  "sports.none": "Ninguna actividad coincide con los filtros.",
  "sports.allSeasons": "Todas las temporadas",
  "sports.howToJoin": "Cómo participar",
  "common.filters": "Filtros",
  "common.search": "Buscar",
  "common.clear": "Limpiar",
  "common.official": "Enlace oficial",
  "common.contact": "Contacto",
  "common.updated": "Última actualización",
  "report.button": "Reportar información incorrecta",
  "report.title": "Reportar información incorrecta",
  "report.subtitle":
    "Cuéntenos qué parece incorrecto. Su reporte se envía al equipo del distrito para su revisión.",
  "report.kind": "¿Cuál es el problema?",
  "report.kind.phone": "Teléfono incorrecto",
  "report.kind.link": "Enlace roto",
  "report.kind.date": "Fecha incorrecta",
  "report.kind.outdated": "Información desactualizada",
  "report.kind.translation": "Problema de traducción",
  "report.message": "Detalles",
  "report.email": "Su correo (opcional)",
  "report.send": "Enviar reporte",
  "report.thanks": "Gracias. Nuestro equipo lo revisará.",
};

const extraKar: Dict = {
  "site.name": "DMPS ဟံၣ်ဖိဃီဖိ တၢ်ဂ့ၢ်တၢ်ကျိၤ",
  "site.tagline": "တၢ်ဂ့ၢ်တၢ်ကျိၤဒီးတၢ်မၤစၢၤလၢ Des Moines ကၠိဖိအဟံၣ်ဖိဃီဖိအဂီၢ်",
  "nav.resources": "တၢ်မၤစၢၤတဖၣ်",
  "nav.articles": "လံာ်တၢ်ကွဲးတဖၣ်",
  "nav.calendar": "နံၤသဘျ့လံာ်နံၣ်လံာ်လါ",
  "nav.programs": "တၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်",
  "nav.schools": "ကၠိတဖၣ်",
  "nav.search": "ဃုသ့ၣ်ညါ",
  "common.close": "ကးတံာ်",
  "common.back": "က့ၤကဒါ",
  "common.viewAll": "ကွၢ်ခဲလၢာ်",
  "theme.select": "တၢ်ဟဲအိၣ်ဖျါ",
  "theme.light": "ကပီၤ",
  "theme.dark": "ခံး",
  "contact.subtitle": "ဆဲးကျိးပှၤလၢလီတဲစိမ့တမ့ၢ်အံမ့(လ်)",
  "contacts.subtitle": "ဆဲးကျိးတၢ်ဂ့ၢ်လၢကၠိကရၢအပူၤ",
  "contacts.none": "တၢ်ဆဲးကျိးတအိၣ်ဒံးဘၣ်.",
  "accessibility.title": "တၢ်နုာ်လီၤသ့",
};

const extraContactsEn: Dict = {
  "contacts.subtitle": "Phone numbers, emails and hours published by district staff.",
  "contacts.none": "No contacts have been published yet.",
};

const extraContactsEs: Dict = {
  "contacts.subtitle": "Teléfonos, correos y horarios publicados por el personal del distrito.",
  "contacts.none": "Todavía no se han publicado contactos.",
  "contact.title": "Contáctenos",
  "contact.subtitle": "Comuníquese con el equipo de apoyo a las familias.",
  "accessibility.title": "Accesibilidad",
  "accessibility.subtitle": "Queremos que cada familia pueda usar este sitio sin barreras.",
};

const extraAppsEn: Dict = {
  "nav.apps": "Apps",
  "apps.title": "Official apps for families",
  "apps.subtitle":
    "All the official apps you need in one place, with direct links to the App Store and Google Play.",
  "liaisons.subtitle": "Bilingual Family Liaisons for Lincoln High School.",
  "liaisons.role": "Bilingual Family Liaison",
  "liaisons.office": "Office of Schools | Climate, Culture & Community",
  "nav.bellSchedule": "Bell schedule",
  "bell.title": "2026-2027 Bell Schedule",
  "bell.subtitle": "Lincoln High School period and lunch times. Tap the image to enlarge.",
};

const extraAppsEs: Dict = {
  "nav.apps": "Aplicaciones",
  "apps.title": "Aplicaciones oficiales para familias",
  "apps.subtitle":
    "Todas las aplicaciones oficiales en un solo lugar, con enlaces directos a App Store y Google Play.",
  "liaisons.subtitle": "Enlaces Bilingües de Familia de Lincoln High School.",
  "liaisons.role": "Enlace Bilingüe de Familia",
  "liaisons.office": "Oficina de Escuelas | Clima, Cultura y Comunidad",
  "nav.bellSchedule": "Horario de campanas",
  "bell.title": "Horario de Campanas 2026-2027",
  "bell.subtitle":
    "Horas de cada periodo y almuerzos de Lincoln High School. Toca la imagen para verla más grande.",
};

const extraOnboardingEn: Dict = {
  "onboarding.reopen": "How to use DMPS Info",
  "onboarding.stepOf": "Step {current} of {total}",
  "onboarding.next": "Next",
  "onboarding.back": "Back",
  "onboarding.start": "Get started",
  "onboarding.skip": "Skip",
  "onboarding.skipStep": "Skip step",
  "onboarding.exit": "Exit",
  "onboarding.doAction": "Do this to continue",
  "onboarding.typeExample": "Type example",
  "onboarding.finish": "Finish",
  "onboarding.practiceAgain": "Practice again",

  "onboarding.resume.title": "Do you want to continue where you left off?",
  "onboarding.resume.desc":
    "You have a saved tour in progress. Choose whether to resume or start fresh.",
  "onboarding.resume.continue": "Continue",
  "onboarding.resume.restart": "Start over",
  "onboarding.quickTours": "Quick Tours",
  "onboarding.tour.menu": "How to use the menu",
  "onboarding.tour.search": "How to search",
  "onboarding.tour.school": "How to choose school",
  "onboarding.tour.lang": "How to change language",
  "onboarding.tour.categories": "Explore topics",
  "onboarding.tour.notices": "District announcements",
  "onboarding.tour.full": "Full tour",

  "onboarding.step1.title": "Main navigation menu",
  "onboarding.step1.text":
    "Access all sections: Home, Guides, Teams, Volunteers, BFL Status, Calendar, Programs, DART Bus, Announcements, FAQs, and Direct Contact.",
  "onboarding.step1.instruction": "Open the menu to explore every service and feature.",
  "onboarding.step1.keyword": "Menu",

  "onboarding.menu.openButton": "Open navigation menu",
  "onboarding.menu.closeButton": "Close navigation menu",
  "onboarding.menu.exploreOptions": "Explore all menu sections",
  "onboarding.menu.opt.home.title": "Home",
  "onboarding.menu.opt.home.desc": "Main hub with quick search, notices, and essential links.",
  "onboarding.menu.opt.articles.title": "Articles & Guides",
  "onboarding.menu.opt.articles.desc":
    "Official family handbooks, enrollment guides, and student conduct code.",
  "onboarding.menu.opt.teams.title": "Teams (Lincoln NGOT)",
  "onboarding.menu.opt.teams.desc": "Freshman transition teams and academic support liaisons.",
  "onboarding.menu.opt.voluntarios.title": "Volunteers (DMPS Hub)",
  "onboarding.menu.opt.voluntarios.desc":
    "Community volunteering opportunities and hours logging at hub.familiasdmps.app.",
  "onboarding.menu.opt.bflStatus.title": "BFL Status",
  "onboarding.menu.opt.bflStatus.desc":
    "Live liaison availability, family queue system, and event kiosk at status.familiasdmps.app.",
  "onboarding.menu.opt.calendar.title": "School Calendar",
  "onboarding.menu.opt.calendar.desc":
    "Key dates, holidays, parent conferences, and early dismissals.",
  "onboarding.menu.opt.programs.title": "District Programs",
  "onboarding.menu.opt.programs.desc":
    "Language support (ELL), special education, and academic programs.",
  "onboarding.menu.opt.sports.title": "Sports & Activities",
  "onboarding.menu.opt.sports.desc":
    "Middle and high school athletic schedules, clubs, and events.",
  "onboarding.menu.opt.dart.title": "DART Transportation",
  "onboarding.menu.opt.dart.desc":
    "School bus routes, live maps, stops, and student bus pass info.",
  "onboarding.menu.opt.notices.title": "Official Announcements",
  "onboarding.menu.opt.notices.desc":
    "Urgent weather alerts, district notices, and superintendent updates.",
  "onboarding.menu.opt.faq.title": "Frequently Asked Questions",
  "onboarding.menu.opt.faq.desc": "Instant answers to common family questions and procedures.",
  "onboarding.menu.opt.contact.title": "Contacts & Directory",
  "onboarding.menu.opt.contact.desc":
    "Direct phone numbers and emails for schools and bilingual liaisons.",

  "onboarding.step2.title": "Find information quickly",
  "onboarding.step2.text": "Type a word like “calendar”, “transportation”, or “sports”.",
  "onboarding.step2.instruction": "Type a keyword in the search bar.",
  "onboarding.step2.keyword": "Search",

  "onboarding.step3.title": "Choose your school",
  "onboarding.step3.text": "This helps display information specific to your school.",
  "onboarding.step3.instruction": "Tap to view or select your school.",
  "onboarding.step3.keyword": "Your school",

  "onboarding.step4.title": "Use your language",
  "onboarding.step4.text": "You can change the application language whenever you need.",
  "onboarding.step4.instruction": "Select English, Español, or S'gaw Karen.",
  "onboarding.step4.keyword": "Language",

  "onboarding.step5.title": "Explore categories",
  "onboarding.step5.text": "Here you will find articles and guides organized by topic.",
  "onboarding.step5.instruction": "Select any topic category to explore.",
  "onboarding.step5.keyword": "Categories",

  "onboarding.step6.title": "Information cards and guides",
  "onboarding.step6.text": "Each card contains related information, dates, and official links.",
  "onboarding.step6.instruction": "Tap any card to open the full guide.",
  "onboarding.step6.keyword": "Guides",

  "onboarding.step7.title": "District announcements",
  "onboarding.step7.text": "Important alerts, weather updates, and school news appear here.",
  "onboarding.step7.instruction": "Check here for the latest district updates.",
  "onboarding.step7.keyword": "Announcements",

  "onboarding.step8.title": "You're ready to start!",
  "onboarding.step8.text": "Use the menu to explore and search to find information quickly.",
  "onboarding.step8.instruction": "Tap Finish or practice again anytime.",
  "onboarding.step8.keyword": "DMPS Info",

  "onboarding.exit.title": "Do you want to exit the tutorial?",
  "onboarding.exit.text": "You can reopen it anytime from the menu under “How to use DMPS Info”.",
  "onboarding.exit.resume": "Continue tutorial",
  "onboarding.exit.confirm": "Exit tutorial",
  "onboarding.resetWelcome": "Reset tutorial progress",
  "onboarding.resetSuccess": "Tutorial progress has been reset",
};

const extraOnboardingEs: Dict = {
  "onboarding.reopen": "Cómo usar DMPS Info",
  "onboarding.stepOf": "Paso {current} de {total}",
  "onboarding.next": "Siguiente",
  "onboarding.back": "Atrás",
  "onboarding.start": "Comenzar",
  "onboarding.skip": "Saltar",
  "onboarding.skipStep": "Saltar paso",
  "onboarding.exit": "Salir",
  "onboarding.doAction": "Hazlo para continuar",
  "onboarding.typeExample": "Escribir ejemplo",
  "onboarding.finish": "Finalizar",
  "onboarding.practiceAgain": "Volver a practicar",

  "onboarding.resume.title": "¿Quieres continuar donde te quedaste?",
  "onboarding.resume.desc":
    "Tienes un recorrido guardado en progreso. Elige si deseas reanudarlo o empezar desde el inicio.",
  "onboarding.resume.continue": "Continuar",
  "onboarding.resume.restart": "Empezar de nuevo",
  "onboarding.quickTours": "Recorridos directos",
  "onboarding.tour.menu": "Cómo usar el menú",
  "onboarding.tour.search": "Cómo buscar información",
  "onboarding.tour.school": "Cómo cambiar de escuela",
  "onboarding.tour.lang": "Cómo cambiar el idioma",
  "onboarding.tour.categories": "Explorar temas",
  "onboarding.tour.notices": "Avisos del distrito",
  "onboarding.tour.full": "Recorrido completo",

  "onboarding.step1.title": "Menú principal y navegación",
  "onboarding.step1.text":
    "Accede a todas las secciones: Inicio, Guías, Equipos, Voluntarios, BFL Status, Calendario, Programas, DART, Avisos, Preguntas y Contacto.",
  "onboarding.step1.instruction":
    "Toca 'Abrir menú' para ver todas las opciones disponibles y su contenido.",
  "onboarding.step1.keyword": "Menú",

  "onboarding.menu.openButton": "Abrir menú de navegación",
  "onboarding.menu.closeButton": "Cerrar menú de navegación",
  "onboarding.menu.exploreOptions": "Explorar todas las opciones del menú",
  "onboarding.menu.opt.home.title": "Inicio",
  "onboarding.menu.opt.home.desc":
    "Página principal con buscador rápido, avisos y enlaces esenciales.",
  "onboarding.menu.opt.articles.title": "Artículos y Guías",
  "onboarding.menu.opt.articles.desc":
    "Manuales para familias, guías de inscripción y código de conducta.",
  "onboarding.menu.opt.teams.title": "Equipos (Lincoln NGOT)",
  "onboarding.menu.opt.teams.desc":
    "Equipos de transición para estudiantes de noveno grado y tutores.",
  "onboarding.menu.opt.voluntarios.title": "Voluntarios (DMPS Hub)",
  "onboarding.menu.opt.voluntarios.desc":
    "Portal oficial para voluntariado y registro de horas en hub.familiasdmps.app.",
  "onboarding.menu.opt.bflStatus.title": "BFL Status",
  "onboarding.menu.opt.bflStatus.desc":
    "Disponibilidad en tiempo real de enlaces bilingües y turnos en status.familiasdmps.app.",
  "onboarding.menu.opt.calendar.title": "Calendario Escolar",
  "onboarding.menu.opt.calendar.desc":
    "Fechas clave del año: días festivos, conferencias y salidas tempranas.",
  "onboarding.menu.opt.programs.title": "Programas del Distrito",
  "onboarding.menu.opt.programs.desc":
    "Programas académicos, apoyo para estudiantes de inglés y educación especial.",
  "onboarding.menu.opt.sports.title": "Deportes y Actividades",
  "onboarding.menu.opt.sports.desc":
    "Horarios deportivos de secundarias y preparatorias, clubes y eventos.",
  "onboarding.menu.opt.dart.title": "DART Transporte",
  "onboarding.menu.opt.dart.desc":
    "Rutas de autobús escolar DART, mapas en vivo y pases para estudiantes.",
  "onboarding.menu.opt.notices.title": "Avisos Oficiales",
  "onboarding.menu.opt.notices.desc":
    "Alertas urgentes, cierres por clima y comunicados del distrito escolar.",
  "onboarding.menu.opt.faq.title": "Preguntas Frecuentes",
  "onboarding.menu.opt.faq.desc":
    "Respuestas rápidas a las dudas más comunes de los padres y tutores.",
  "onboarding.menu.opt.contact.title": "Contacto y Directorio",
  "onboarding.menu.opt.contact.desc":
    "Teléfonos y correos directos de escuelas y enlaces familiares bilingües.",

  "onboarding.step2.title": "Encuentra información rápido",
  "onboarding.step2.text": "Escribe una palabra como “calendario”, “transporte” o “deportes”.",
  "onboarding.step2.instruction": "Escribe una palabra clave en el buscador.",
  "onboarding.step2.keyword": "Buscar",

  "onboarding.step3.title": "Elige tu escuela",
  "onboarding.step3.text": "Esto ayuda a mostrar información relacionada con tu escuela.",
  "onboarding.step3.instruction": "Toca para ver o cambiar de escuela.",
  "onboarding.step3.keyword": "Tu escuela",

  "onboarding.step4.title": "Usa tu idioma",
  "onboarding.step4.text": "Puedes cambiar el idioma de la aplicación cuando lo necesites.",
  "onboarding.step4.instruction": "Selecciona Español, English o S'gaw Karen.",
  "onboarding.step4.keyword": "Idioma",

  "onboarding.step5.title": "Explora las categorías",
  "onboarding.step5.text": "Aquí encontrarás artículos y recursos organizados por tema.",
  "onboarding.step5.instruction": "Selecciona una categoría temática.",
  "onboarding.step5.keyword": "Categorías",

  "onboarding.step6.title": "Tarjetas y guías informativas",
  "onboarding.step6.text": "Cada tarjeta contiene información, fechas y enlaces oficiales.",
  "onboarding.step6.instruction": "Abre cualquier tarjeta para ver la guía completa.",
  "onboarding.step6.keyword": "Guías",

  "onboarding.step7.title": "Avisos y novedades",
  "onboarding.step7.text":
    "Alertas importantes, cierres por clima y novedades escolares aparecen aquí.",
  "onboarding.step7.instruction": "Revisa aquí las últimas novedades del distrito.",
  "onboarding.step7.keyword": "Avisos",

  "onboarding.step8.title": "¡Ya sabes cómo comenzar!",
  "onboarding.step8.text":
    "Usa el menú para explorar y el buscador para encontrar información rápidamente.",
  "onboarding.step8.instruction": "Toca Finalizar o vuelve a practicar cuando quieras.",
  "onboarding.step8.keyword": "DMPS Info",

  "onboarding.exit.title": "¿Quieres salir del tutorial?",
  "onboarding.exit.text":
    "Puedes volver a abrirlo en cualquier momento desde el menú en “Cómo usar DMPS Info”.",
  "onboarding.exit.resume": "Continuar tutorial",
  "onboarding.exit.confirm": "Salir del tutorial",
  "onboarding.resetWelcome": "Restablecer progreso del tutorial",
  "onboarding.resetSuccess": "Se ha restablecido el progreso del tutorial",
};

const extraOnboardingKar: Dict = {
  "onboarding.reopen": "မၤသ့ DMPS Info ဒ်လဲၣ်",
  "onboarding.stepOf": "ပတီၢ် {current} လၢ {total}",
  "onboarding.next": "ဆူညါ",
  "onboarding.back": "လၢခံ",
  "onboarding.start": "စးထီၣ်",
  "onboarding.skip": "လဲၤပူၤ",
  "onboarding.skipStep": "လဲၤပူၤပတီၢ်",
  "onboarding.exit": "ဟးထီၣ်",
  "onboarding.doAction": "မၤအီၤလၢကဆူညါ",
  "onboarding.typeExample": "ကွဲးနမူနာ",
  "onboarding.finish": "ဝံၤလံ",
  "onboarding.practiceAgain": "မၤကဒါက့ၤ",

  "onboarding.resume.title": "နအဲၣ်ဒိးဆူညါဖဲနပတုာ်တၢ်အလီၢ်ဧါ?",
  "onboarding.resume.desc": "နတၢ်သိၣ်လိအိၣ်ဒံးလၢကျဲ. ဃုထၢလၢကဆူညါ မ့တမ့ၢ် စးထီၣ်ကဒါက့ၤ.",
  "onboarding.resume.continue": "ဆူညါ",
  "onboarding.resume.restart": "စးထီၣ်ကဒါက့ၤ",
  "onboarding.quickTours": "တၢ်သိၣ်လိအချ့",
  "onboarding.tour.menu": "မၤသ့ခိၣ်မံခၠူးဒ်လဲၣ်",
  "onboarding.tour.search": "ဃုထံၣ်တၢ်ကစီၣ်ဒ်လဲၣ်",
  "onboarding.tour.school": "ဆီတလဲကၠိဒ်လဲၣ်",
  "onboarding.tour.lang": "ဆီတလဲကျိာ်ဒ်လဲၣ်",
  "onboarding.tour.categories": "ဃုထံၣ်န့ၢ်တၢ်ပနီၣ်တဖၣ်",
  "onboarding.tour.notices": "တၢ်ဘိးဘီသီတဖၣ်",
  "onboarding.tour.full": "တၢ်သိၣ်လိခဲလၢာ်",

  "onboarding.step1.title": "ခိၣ်မံခၠူးဒီးတၢ်လဲၤဆူတၢ်လီၢ်တဖၣ်",
  "onboarding.step1.text":
    "နနုာ်လီၤကွၢ်သ့: ဟံၣ်, လံာ်ပတြီာ်, NGOT ကရူၢ်, တၢ်မၤမၤသး (Hub), BFL Status, ကၠိလံာ်တၢ်ရဲၣ်တၢ်ကျဲၤ, တၢ်ရဲၣ်တၢ်ကျဲၤတဖၣ်, DART သိလ့ၣ်, တၢ်ဘိးဘီ, တၢ်သံကွၢ် ဒီးတၢ်ဆုးသန့.",
  "onboarding.step1.instruction": "ထိး 'အိးထီၣ်ခိၣ်မံခၠူး' လၢကကွၢ်တၢ်နီၤဖးခဲလၢာ်.",
  "onboarding.step1.keyword": "ခိၣ်မံခၠူး",

  "onboarding.menu.openButton": "အိးထီၣ်ခိၣ်မံခၠူး",
  "onboarding.menu.closeButton": "ပိာ်ခိၣ်မံခၠူး",
  "onboarding.menu.exploreOptions": "ကွၢ်ခိၣ်မံခၠူးအတၢ်နီၤဖးခဲလၢာ်",
  "onboarding.menu.opt.home.title": "ဟံၣ် / စးထီၣ်",
  "onboarding.menu.opt.home.desc":
    "လံာ်ကဘျံးအခိၣ်ဒိၣ်ဒီးတၢ်ဃုအလီၢ်, တၢ်ဘိးဘီ ဒီးတၢ်ဂ့ၢ်အရ့ဒိၣ်တဖၣ်.",
  "onboarding.menu.opt.articles.title": "လံာ်ပတြီာ်ဒီးတၢ်နဲၣ်ကျဲ",
  "onboarding.menu.opt.articles.desc":
    "လံာ်တၢ်နဲၣ်ကျဲလၢဟံၣ်ဖိဃီဖိအဂီၢ်, တၢ်မၤနုာ်မံၤ ဒီးတၢ်လုးတၢ်သကဲးအတၢ်သိၣ်တၢ်သီ.",
  "onboarding.menu.opt.teams.title": "တၢ်မၤစၢၤကရူၢ် (Lincoln NGOT)",
  "onboarding.menu.opt.teams.desc": "ကရူၢ်လၢအမၤစၢၤကၠိဖိလၢအနုာ်လီၤဆူ ပတီၢ် ၉ ဒီးပှၤသိၣ်တၢ်တဖၣ်.",
  "onboarding.menu.opt.voluntarios.title": "တၢ်မၤမၤသး (DMPS Hub)",
  "onboarding.menu.opt.voluntarios.desc":
    "တၢ်ခွဲးတၢ်ယာ်လၢတၢ်မၤမၤသး ဒီးတၢ်ပာ်ဖျါအနၣ်ရံၣ်လၢ hub.familiasdmps.app.",
  "onboarding.menu.opt.bflStatus.title": "BFL Status",
  "onboarding.menu.opt.bflStatus.desc":
    "ပှၤမၤတၢ်ဖိအတၢ်အိၣ်အသးလၢဆၢကတီၢ်ခဲအံၤ ဒီးတၢ်ဆၢတဲာ်လၢ status.familiasdmps.app.",
  "onboarding.menu.opt.calendar.title": "ကၠိလံာ်တၢ်ရဲၣ်တၢ်ကျဲၤ",
  "onboarding.menu.opt.calendar.desc":
    "မုၢ်နံၤအရ့ဒိၣ်တဖၣ်, မုၢ်နံၤတၢ်အိၣ်ဘှံး, တၢ်အိၣ်ဖှိၣ် ဒီးမုၢ်နံၤဟးထီၣ်အချ့.",
  "onboarding.menu.opt.programs.title": "ကၠိအဒုးအိၣ်တၢ်ရဲၣ်တၢ်ကျဲၤ",
  "onboarding.menu.opt.programs.desc":
    "တၢ်မၤစၢၤလၢကျိာ် (ELL), တၢ်ကူၣ်ဘၣ်ကူၣ်သ့လီၤဆီ ဒီးတၢ်မၤစၢၤအဂၤတဖၣ်.",
  "onboarding.menu.opt.sports.title": "တၢ်လုးတၢ်သကဲးဒီးတၢ်မၤတဖၣ်",
  "onboarding.menu.opt.sports.desc":
    "Middle/High School တၢ်လုးတၢ်သကဲးတၢ်ရဲၣ်တၢ်ကျဲၤ, ကရူၢ် ဒီးတၢ်မၤလၢကၠိပူၤ.",
  "onboarding.menu.opt.dart.title": "DART တၢ်လဲၤတၢ်က့ၤ",
  "onboarding.menu.opt.dart.desc":
    "ကၠိသိလ့ၣ်ကျဲတဖၣ်, တၢ်ပတုာ်လီၢ်, တၢ်ဂီၤခီဒီးကၠိဖိအတၢ်လဲၤတၢ်က့ၤလံာ်လဲ.",
  "onboarding.menu.opt.notices.title": "တၢ်ဘိးဘီသီတဖၣ်",
  "onboarding.menu.opt.notices.desc": "တၢ်ဘိးဘီအရ့ဒိၣ်, မုၢ်ဖီတဖၣ်ဒီးတၢ်ကစီၣ်လၢကၠိတၢ်ပၢဆှၢအိၣ်.",
  "onboarding.menu.opt.faq.title": "တၢ်သံကွၢ်လၢတၢ်သံကွၢ်အါတဖၣ်",
  "onboarding.menu.opt.faq.desc": "တၢ်စံးဆၢချ့ချ့လၢဟံၣ်ဖိဃီဖိအတၢ်သံကွၢ်တဖၣ်အဂီၢ်.",
  "onboarding.menu.opt.contact.title": "ဆုးသန့ဒီးလီတဲစိ",
  "onboarding.menu.opt.contact.desc": "ကၠိတဖၣ်ဒီးပှၤဆုးသန့တဖၣ်အလီတဲစိ ဒီးအီးမဲလ်လၢတၢ်မၤစၢၤအဂီၢ်.",

  "onboarding.step2.title": "ဃုထံၣ်န့ၢ်တၢ်ကစီၣ်ချ့ချ့",
  "onboarding.step2.text":
    "ကွဲးတၢ်ကတိၤဒ်အမ့ၢ် “လံာ်တၢ်ရဲၣ်တၢ်ကျဲၤ”, “တၢ်လဲၤတၢ်က့ၤ” မ့တမ့ၢ် “တၢ်လုးတၢ်သကဲး”.",
  "onboarding.step2.instruction": "ကွဲးတၢ်ကတိၤအရ့ဒိၣ်လၢတၢ်ဃုအလီၢ်.",
  "onboarding.step2.keyword": "ဃုတၢ်",

  "onboarding.step3.title": "ဃုထၢနကၠိ",
  "onboarding.step3.text": "အံၤမၤစၢၤပာ်ဖျါထီၣ်တၢ်ကစီၣ်လၢအဘၣ်ဃးဒီးနကၠိ.",
  "onboarding.step3.instruction": "ထိးလၢကကွၢ် မ့တမ့ၢ် ဆီတလဲကၠိ.",
  "onboarding.step3.keyword": "နကၠိ",

  "onboarding.step4.title": "သူနကလုာ်ကျိာ်",
  "onboarding.step4.text": "နဆီတလဲအပၠီခ့းရှၢးအကျိာ်သ့ဖဲနလိၣ်ဘၣ်အခါကိးခါဒဲး.",
  "onboarding.step4.instruction": "ဃုထၢ English, Español, မ့တမ့ၢ် ကညီကျိာ်.",
  "onboarding.step4.keyword": "ကျိာ်",

  "onboarding.step5.title": "ဃုထံၣ်န့ၢ်တၢ်ပနီၣ်တဖၣ်",
  "onboarding.step5.text": "ဖဲအံၤနကထံၣ်ဘၣ်တၢ်ကစီၣ်လၢဘၣ်တၢ်ရဲၣ်လီၤအီၤလၢတၢ်ဂ့ၢ်အကလုာ်.",
  "onboarding.step5.instruction": "ဃုထၢတၢ်ပနီၣ်တခါခါလၢကမၤကွၢ်.",
  "onboarding.step5.keyword": "တၢ်ပနီၣ်",

  "onboarding.step6.title": "လံာ်ပတြီာ်ဒီးတၢ်နဲၣ်ကျဲတဖၣ်",
  "onboarding.step6.text": "လံာ်ပတြီာ်တခါဒဲးပၣ်ဃုာ်ဒီးတၢ်ဂ့ၢ်, မုၢ်နံၤမုၢ်သီ ဒီးစရီဘၣ်ဃးတဖၣ်.",
  "onboarding.step6.instruction": "အိးထီၣ်လံာ်ပတြီာ်တခါခါလၢကဖတ်တၢ်နဲၣ်ကျဲ.",
  "onboarding.step6.keyword": "လံာ်ပတြီာ်",

  "onboarding.step7.title": "တၢ်ဘိးဘီဒီးတၢ်ကစီၣ်သီတဖၣ်",
  "onboarding.step7.text": "တၢ်ဘိးဘီအရ့ဒိၣ်, တၢ်ကပတုာ်ကၠိဒီးတၢ်ကစီၣ်တဖၣ်ကဖျါထီၣ်ဖဲအံၤ.",
  "onboarding.step7.instruction": "ကွၢ်တၢ်ဘိးဘီသီကတၢၢ်တဖၣ်ဖဲအံၤ.",
  "onboarding.step7.keyword": "တၢ်ဘိးဘီ",

  "onboarding.step8.title": "နစးထီၣ်သ့လံ!",
  "onboarding.step8.text": "သူခိၣ်မံခၠူးလၢကဃုကွၢ် ဒီးတၢ်ဃုအလီၢ်လၢကဃုထံၣ်တၢ်ကစီၣ်ချ့ချ့.",
  "onboarding.step8.instruction": "ထိး 'ဝံၤလံ' မ့တမ့ၢ် မၤကဒါက့ၤအခါကိးခါဒဲး.",
  "onboarding.step8.keyword": "DMPS Info",

  "onboarding.exit.title": "နအဲၣ်ဒိးဟးထီၣ်ကွံာ်လၢတၢ်သိၣ်လိအံၤဧါ?",
  "onboarding.exit.text": "နအိးထီၣ်ကဒါက့ၤအီၤသ့ဖဲခိၣ်မံခၠူးပူၤလၢ “မၤသ့ DMPS Info ဒ်လဲၣ်”.",
  "onboarding.exit.resume": "ဆူညါဒီးတၢ်သိၣ်လိ",
  "onboarding.exit.confirm": "ဟးထီၣ်တၢ်သိၣ်လိ",
  "onboarding.resetWelcome": "မၤသီထီၣ်ကဒါက့ၤတၢ်သိၣ်လိအတၢ်လဲၤခီဖျိ",
  "onboarding.resetSuccess": "တၢ်သိၣ်လိအတၢ်လဲၤခီဖျိဘၣ်တၢ်မၤသီထီၣ်ကဒါက့ၤအီၤလံ",
};

const extraServicesEn: Dict = {
  "nav.voluntarios": "Volunteers",
  "nav.bflStatus": "BFL Status",
  "nav.voluntariosDesc": "Opportunities, hours, and volunteer portal",
  "nav.bflStatusDesc": "Staff availability, queues, and kiosk",
  "services.hubBadge": "DMPS Connect Service",
  "services.voluntarios.title": "Volunteers",
  "services.voluntarios.desc":
    "Find volunteer opportunities, check your applications, log your hours, and review your profile.",
  "services.voluntarios.button": "Open Volunteer Portal",
  "services.bfl.title": "BFL Status",
  "services.bfl.desc":
    "System to check staff availability, manage queues, assign families, and access the kiosk during events.",
  "services.bfl.button": "Open BFL Status",
  "services.externalNoticeTitle": "External DMPS Connect Service",
  "services.externalNoticeDesc":
    "By clicking the button below, you will enter another DMPS Connect service in a new, secure tab.",
  "services.opensInNewTab": "Opens in a new tab",
  "services.highlightsTitle": "Key Features & Capabilities",
  "services.unavailable": "Service temporarily unavailable",
  "services.unavailableDesc":
    "The link for this service portal is currently being configured or maintained by administrators.",
};

const extraServicesEs: Dict = {
  "nav.voluntarios": "Voluntarios",
  "nav.bflStatus": "BFL Status",
  "nav.voluntariosDesc": "Oportunidades, registro de horas y solicitudes",
  "nav.bflStatusDesc": "Disponibilidad de personal, filas y kiosco",
  "services.hubBadge": "Servicio DMPS Connect",
  "services.voluntarios.title": "Voluntarios",
  "services.voluntarios.desc":
    "Encuentra oportunidades de voluntariado, consulta tus solicitudes, registra tus horas y revisa tu perfil.",
  "services.voluntarios.button": "Abrir Portal de Voluntarios",
  "services.bfl.title": "BFL Status",
  "services.bfl.desc":
    "Sistema para consultar la disponibilidad del personal, administrar filas, asignar familias y acceder al kiosco durante eventos.",
  "services.bfl.button": "Abrir BFL Status",
  "services.externalNoticeTitle": "Servicio Externo de DMPS Connect",
  "services.externalNoticeDesc":
    "Al presionar el botón a continuación, ingresarás a otro servicio de DMPS Connect en una pestaña nueva y segura.",
  "services.opensInNewTab": "Se abre en una pestaña nueva",
  "services.highlightsTitle": "Funciones y características del portal",
  "services.unavailable": "Servicio temporalmente no disponible",
  "services.unavailableDesc":
    "El enlace para este portal aún no ha sido configurado o se encuentra en mantenimiento por los administradores.",
};

const extraServicesKar: Dict = {
  "nav.voluntarios": "တၢ်မၤမၤသးတဖၣ်",
  "nav.bflStatus": "BFL Status",
  "nav.voluntariosDesc": "တၢ်ခွဲးတၢ်ယာ်, တၢ်မၤအနၣ်ရံၣ် ဒီးပီၢ်ရၣ်",
  "nav.bflStatusDesc": "ပှၤမၤတၢ်ဖိအတၢ်အိၣ်အသး, တၢ်ဆၢတဲာ် ဒီးကံၢ်အီး(kiosk)",
  "services.hubBadge": "DMPS Connect တၢ်မၤစၢၤ",
  "services.voluntarios.title": "တၢ်မၤမၤသးတဖၣ်",
  "services.voluntarios.desc":
    "ဃုထံၣ်န့ၢ်တၢ်မၤမၤသးအတၢ်ခွဲးတၢ်ယာ်, သမံသလဲကွၢ်နတၢ်ဃ့ထီၣ်တဖၣ်, ပာ်ဖျါထီၣ်နတၢ်မၤမၤသးအနၣ်ရံၣ် ဒီးကွၢ်ကဒါက့ၤနတၢ်ပာ်ဖျါ.",
  "services.voluntarios.button": "အိးထီၣ်တၢ်မၤမၤသးပီၢ်ရၣ်",
  "services.bfl.title": "BFL Status",
  "services.bfl.desc":
    "တၢ်ရဲၣ်တၢ်ကျဲၤလၢကကွၢ်ပှၤမၤတၢ်ဖိအတၢ်အိၣ်အသး, ပၢဆှၢတၢ်ဆၢတဲာ်တဖၣ်, ဟ့ၣ်လီၤဟံၣ်ဖိဃီဖိ ဒီးလဲၤနုာ်ဆူ ကံၢ်အီး(kiosk) ဖဲတၢ်ရဲၣ်တၢ်ကျဲၤအဆၢကတီၢ်.",
  "services.bfl.button": "အိးထီၣ် BFL Status",
  "services.externalNoticeTitle": "DMPS Connect အဂၤတခါအတၢ်မၤစၢၤ",
  "services.externalNoticeDesc":
    "ဖဲနထိးဘတံၣ်အံၤအခါ, နကလဲၤနုာ်ဆူ DMPS Connect အဂၤတခါအတၢ်မၤစၢၤအပူၤလၢ တၢ်အိးထီၣ်လံာ်ကဘျံးသီတဘျံးအပူၤ.",
  "services.opensInNewTab": "အိးထီၣ်လၢလံာ်ကဘျံးသီတဘျံးပူၤ",
  "services.highlightsTitle": "တၢ်မၤစၢၤဒီးတၢ်သ့တၢ်ဘၣ်အရ့ဒိၣ်တဖၣ်",
  "services.unavailable": "တၢ်မၤစၢၤတၢ်အံၤတအိၣ်ဒံးဘၣ်စိၤစိၤ",
  "services.unavailableDesc": "တၢ်ဘိးဘီဘၣ်ဃးပီၢ်ရၣ်အံၤ ပှၤပၢဆှၢတၢ်ဖိတဖၣ်တဒံးမၤဂ့ၤထီၣ်အီၤဘၣ်.",
};

const extraLifecycleEn: Dict = {
  "lifecycle.status.active": "Active",
  "lifecycle.status.upcoming": "Upcoming",
  "lifecycle.status.completed": "Completed",
  "lifecycle.status.out_of_season": "Out of season",
  "lifecycle.status.registration_closed": "Registration closed",
  "lifecycle.status.archived": "Archived",
  "lifecycle.status.cancelled": "Cancelled",
  "lifecycle.status.postponed": "Postponed",
  "lifecycle.status.pending_date": "Date pending confirmation",
  "lifecycle.status.previous_season": "Previous season",
  "lifecycle.registration_ended_notice": "The registration period has ended.",
  "lifecycle.ended_on": "Ended on {date}",
  "lifecycle.starts_on": "Starts on {date}",
  "lifecycle.filter.active": "Current",
  "lifecycle.filter.upcoming": "Upcoming",
  "lifecycle.filter.completed": "Completed",
  "lifecycle.filter.out_of_season": "Out of season",
  "lifecycle.filter.all": "All",
  "search.no_active_fallback":
    "We did not find active information, but these previous results may be helpful.",
  "admin.lifecycle.title": "Lifecycle & Expiration Management",
  "admin.lifecycle.desc":
    "Manage content validity dates, upcoming expirations, and logical restoration.",
};

const extraLifecycleEs: Dict = {
  "lifecycle.status.active": "Activo",
  "lifecycle.status.upcoming": "Próximamente",
  "lifecycle.status.completed": "Finalizado",
  "lifecycle.status.out_of_season": "Fuera de temporada",
  "lifecycle.status.registration_closed": "Registro cerrado",
  "lifecycle.status.archived": "Archivado",
  "lifecycle.status.cancelled": "Cancelado",
  "lifecycle.status.postponed": "Pospuesto",
  "lifecycle.status.pending_date": "Fecha pendiente de confirmación",
  "lifecycle.status.previous_season": "Temporada anterior",
  "lifecycle.registration_ended_notice": "El periodo de registro ha finalizado.",
  "lifecycle.ended_on": "Finalizó el {date}",
  "lifecycle.starts_on": "Inicia el {date}",
  "lifecycle.filter.active": "Vigente",
  "lifecycle.filter.upcoming": "Próximamente",
  "lifecycle.filter.completed": "Finalizado",
  "lifecycle.filter.out_of_season": "Fuera de temporada",
  "lifecycle.filter.all": "Todo",
  "search.no_active_fallback":
    "No encontramos información vigente, pero estos resultados anteriores pueden ser útiles.",
  "admin.lifecycle.title": "Control de Vigencia y Vencimientos",
  "admin.lifecycle.desc":
    "Administre fechas de vigencia, próximos vencimientos y restauración lógica de contenido.",
};

const extraLifecycleKar: Dict = {
  "lifecycle.status.active": "တၢ်မၤအိၣ်ဒံး",
  "lifecycle.status.upcoming": "ကဟဲကဒါဒံး",
  "lifecycle.status.completed": "ဝံၤဝတံၤလံ",
  "lifecycle.status.out_of_season": "တၢ်ဆၢကတီၢ်ပူၤကွံာ်လံ",
  "lifecycle.status.registration_closed": "တၢ်မၤမံၤပိာ်ဖျါလံ",
  "lifecycle.status.archived": "ပာ်ကရၢၢ်လံ",
  "lifecycle.status.cancelled": "တၢ်ပတုာ်လံ",
  "lifecycle.status.postponed": "တၢ်ဆုဒံး",
  "lifecycle.status.pending_date": "တၢ်ဆၢကတီၢ်တဘၣ်တၢ်ပာ်ပနီၣ်ဒံးဘၣ်",
  "lifecycle.status.previous_season": "တၢ်ဆၢကတီၢ်လၢပူၤကွံာ်",
  "lifecycle.registration_ended_notice": "တၢ်မၤမံၤအတၢ်ဆၢကတီၢ်ပူၤကွံာ်လံ.",
  "lifecycle.ended_on": "ဝံၤဝတံၤဖဲ {date}",
  "lifecycle.starts_on": "စးထီၣ်ဖဲ {date}",
  "lifecycle.filter.active": "လၢအခဲအံၤ",
  "lifecycle.filter.upcoming": "ကဟဲကဒါဒံး",
  "lifecycle.filter.completed": "ဝံၤဝတံၤလံ",
  "lifecycle.filter.out_of_season": "တၢ်ဆၢကတီၢ်ပူၤကွံာ်လံ",
  "lifecycle.filter.all": "ခဲလၢာ်",
  "search.no_active_fallback":
    "ပတထံၣ်န့ၢ်တၢ်ကစီၣ်လၢအခဲအံၤဘၣ်, ဘၣ်ဆၣ်တၢ်ကစီၣ်လၢပူၤကွံာ်တဖၣ်အံၤမ့ၢ်တၢ်မၤစၢၤသ့.",
  "admin.lifecycle.title": "တၢ်ပၢဆှၢတၢ်ဆၢကတီၢ်ဒီးတၢ်လၢာ်",
  "admin.lifecycle.desc": "ပၢဆှၢတၢ်ဆၢကတီၢ်, တၢ်လၢာ်ကဟဲဘူး, ဒီးမၤသီထီၣ်ကဒါက့ၤတၢ်ကစီၣ်.",
};

Object.assign(
  en,
  extraEn,
  extraContactsEn,
  enB,
  enD,
  enAC,
  extraAppsEn,
  extraOnboardingEn,
  extraServicesEn,
  extraLifecycleEn,
);
Object.assign(
  es,
  extraEs,
  extraContactsEs,
  esB,
  esD,
  esAC,
  extraAppsEs,
  extraOnboardingEs,
  extraServicesEs,
  extraLifecycleEs,
);

Object.assign(
  kar,
  extraKar,
  karB,
  karD,
  karAC,
  karE,
  extraOnboardingKar,
  extraServicesKar,
  extraLifecycleKar,
);

const DICTS: Record<LanguageCode, Dict> = { en, es };

const STORAGE_KEY = "dmps-language";

const missingTranslations = new Set<string>();

/** Records untranslated keys in-memory so the admin panel can report coverage. */
function reportMissingTranslation(lang: LanguageCode, key: string) {
  const id = `${lang}:${key}`;
  if (missingTranslations.has(id)) return;
  missingTranslations.add(id);
  if (typeof window !== "undefined") {
    (window as unknown as { __dmpsMissingTranslations?: string[] }).__dmpsMissingTranslations =
      Array.from(missingTranslations);
  }
}

export function getTranslationCoverage() {
  const total = Object.keys(es).length;
  const report = (code: LanguageCode) => {
    const dict = DICTS[code];
    const translated = Object.keys(es).filter((k) => Boolean(dict[k])).length;
    return { code, total, translated, pending: total - translated };
  };
  return {
    total,
    languages: (["en"] as LanguageCode[]).map(report),
    missingKeys: Array.from(missingTranslations),
  };
}

type I18nValue = {
  lang: LanguageCode;
  dir: "ltr" | "rtl";
  setLang: (code: LanguageCode) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("es");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored && DICTS[stored]) {
      setLangState(stored);
      return;
    }
    const browser = window.navigator.language.slice(0, 2).toLowerCase();
    const match = LANGUAGES.find((l) => l.code === browser);
    if (match) setLangState(match.code);
  }, []);

  const dir = useMemo(() => LANGUAGES.find((l) => l.code === lang)?.dir ?? "ltr", [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((code: LanguageCode) => {
    setLangState((prev) => {
      if (prev !== code) {
        trackLanguageChange(code, prev);
      }
      return code;
    });
    window.localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback(
    (key: string) => {
      const hit = DICTS[lang][key];
      if (hit) return hit;
      if (lang !== "es") reportMissingTranslation(lang, key);
      // Spanish is the fallback language, English second, never a raw key.
      return es[key] ?? en[key] ?? key;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
