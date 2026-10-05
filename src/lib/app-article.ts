/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { notifySaveSuccess } from "./storage-engine";
import { notifyContentUpdated } from "./sync";
import type { LanguageCode } from "./i18n";
import { autoTranslateText, hasSpanishContent } from "./auto-translator";
import { getCachedSiteSetting, saveSiteSetting } from "./site-settings-service";

export interface AppArticleData {
  id: string;
  // Spanish (Principal)
  title: string;
  subtitle: string;
  badgeText: string;
  platform: string;
  appUrl: string;
  secondaryUrl?: string;
  secondaryUrlLabel?: string;
  imageUrl: string;
  description: string;
  features: string[];
  developer?: string;
  version?: string;
  // English (Inglés)
  titleEn?: string;
  subtitleEn?: string;
  badgeTextEn?: string;
  platformEn?: string;
  appUrlEn?: string;
  secondaryUrlLabelEn?: string;
  imageUrlEn?: string;
  descriptionEn?: string;
  featuresEn?: string[];
  versionEn?: string;
  updatedAt: string;
}

export const APP_ARTICLE_TRANSLATIONS: Record<
  "en" | "kar",
  {
    title: string;
    subtitle: string;
    badgeText: string;
    platform: string;
    secondaryUrlLabel: string;
    version: string;
    features: string[];
    description: string;
  }
> = {
  en: {
    title: "DMPS Connect & Family Portal",
    subtitle:
      "The official mobile application for real-time grades, attendance records, school alerts, schedules, and direct communication with Des Moines Public Schools staff.",
    badgeText: "Recommended Official Application",
    platform: "iOS • Android • Web Portal",
    secondaryUrlLabel: "Download on Google Play",
    version: "v4.2 Official (Updated)",
    features: [
      "Automatic real-time notifications",
      "Grades and assignments for each class",
      "Daily school attendance tracking",
      "Direct messaging and official announcements",
      "District calendar and conference dates",
      "Multilingual support in Spanish and English",
    ],
    description: `Welcome to the digital hub for the Des Moines Public Schools community. This mobile app is designed so every parent, guardian, and student has easy access to all the academic and community information needed day-to-day.

### Why download the app?
Through a modern and fully translated interface, families can check their students' progress without having to make phone calls or travel to school offices.

### Key Benefits for Families:
1. **Instant Grades & Assignments**: Check grades updated by teachers and due dates across Abraham Lincoln High School, East High School, and all DMPS campuses.
2. **Attendance Tracking & Alerts**: Receive real-time alerts when a tardy, excused absence, or unexcused absence is recorded.
3. **Secure Messaging**: Connect directly with school counselors, teachers, and administrators with built-in translation assistance.
4. **District Calendar & Events**: Stay informed about early dismissal Wednesdays, parent-teacher conferences, professional development days, and holidays.
5. **Free Permanent Access**: Completely free for all enrolled students, parents, and caregivers.

### How to log in for the first time?
Log in using the institutional credentials provided during school registration. If you need help retrieving your username or password, visit your school's main office or reach out to your Bilingual Family Liaison.`,
  },
  kar: {
    title: "DMPS Connect ဒီး ဟံၣ်ဖိဃီဖိတၢ်ပရၢ",
    subtitle:
      "ကၠိအပလီခ့ၡၢၣ်လၢ ကွၢ်နီၣ်ဂံၢ်, တၢ်ဟဲကၠိ, ကၠိတၢ်ဟ့ၣ်ပလီၢ်တဖၣ်, တၢ်ဆၢကတီၢ် ဒီးတၢ်ဆဲးကျိးလိာ်သးဒီး Des Moines Public Schools သရၣ်သရၣ်မုၣ်တဖၣ်.",
    badgeText: "တၢ်ဘိးဘၣ်သစူၤ အပလီခ့ၡၢၣ်",
    platform: "iOS • Android • Web Portal",
    secondaryUrlLabel: "ဒိးန့ၢ်ဖဲ Google Play",
    version: "v4.2 Official",
    features: [
      "တၢ်ဟ့ၣ်ပလီၢ်လၢ အဆိကတီၢ်",
      "ကၠိဖိနီၣ်ဂံၢ်ဒီး ကၠိတၢ်မၤတဖၣ်",
      "တၢ်ဟဲကၠိ မုၢ်နံၤဒဲးတၢ်မၤနီၣ်",
      "တၢ်ဆဲးကျိးသကိးလၢ တၢ်ပရၢ",
      "ကၠိလါဆၣ်တၢ်ရဲၣ်တၢ်ကျဲၤ ဒီးမုၢ်နံၤထံၣ်လိာ်မိၢ်ပၢ်",
      "ကျိာ်လၢအါဘိတၢ်မၤစၢၤ",
    ],
    description: `တၢ်တူၢ်လိာ်ဆူ Des Moines Public Schools ဟံၣ်ဖိဃီဖိ ဒီးကၠိဖိတၢ်ပရၢအပူၤ. ကၠိအပလီခ့ၡၢၣ်အံၤ ကမၤစၢၤဟံၣ်ဖိဃီဖိ ဒ်သိးကဒိးန့ၢ် တၢ်ကူၣ်ဘၣ်ကူၣ်သ့တၢ်ပရၢ ခဲလၢာ်အဂီၢ်.

### ဘၣ်မနုၤအဃိ ကဘၣ်ဒိးန့ၢ် အပလီခ့ၡၢၣ်လဲၣ်?
ဟံၣ်ဖိဃီဖိတဖၣ် ကွၢ်နီၣ်ဂံၢ်ဒီးတၢ်ဟဲကၠိတၢ်ပရၢ သ့ဝဲလၢ အဆိကတီၢ်.

### တၢ်မၤစၢၤအရ့ဒိၣ်တဖၣ်:
၁. **နီၣ်ဂံၢ်ဒီး ကၠိတၢ်မၤတဖၣ်**: ကွၢ်သရၣ်သရၣ်မုၣ်တဖၣ် အတၢ်ဟ့ၣ်နီၣ်ဂံၢ်ဖဲ Lincoln, East ဒီး DMPS ကၠိခဲလၢာ်.
၂. **တၢ်ဟဲကၠိ တၢ်မၤနီၣ်**: ဒိးန့ၢ်တၢ်ဟ့ၣ်ပလီၢ် ဖဲကၠိဖိတဟဲကၠိ မ့တမ့ၢ် ဟဲကၠိနှီုတၢ်ဆၢကတီၢ်တဘၣ်အခါ.
၃. **တၢ်ဆဲးကျိး**: ဆဲးကျိးသရၣ်, သရၣ်မုၣ် ဒီးပှၤဟ့ၣ်ကူၣ်တၢ်ဖိတဖၣ်.
၄. **ကၠိလါဆၣ်**: သ့ၣ်ညါ မုၢ်ပဟဲနံၤ ကၠိဟးထီၣ်အဆိ, မုၢ်နံၤထံၣ်လိာ်မိၢ်ပၢ် ဒီးမုၢ်နံၤအိၣ်ဘှံးတဖၣ်.
၅. **အခ့အဖျါတအိၣ်**: ဟံၣ်ဖိဃီဖိဒီး ကၠိဖိကိးဂၤဒဲး သူဝဲအခ့အဖျါတအိၣ်ဘၣ်.`,
  },
};

export const DEFAULT_APP_ARTICLE: AppArticleData = {
  id: "featured_app",
  title: "DMPS Connect & Portal de Familias",
  subtitle:
    "La aplicación móvil oficial para acceder a calificaciones en tiempo real, asistencias, avisos escolares, horarios y comunicación directa con el personal de Des Moines Public Schools.",
  badgeText: "Aplicación Oficial Recomendada",
  platform: "iOS • Android • Portal Web",
  appUrl: "https://apps.apple.com/us/app/infinite-campus-parent/id1383293860",
  secondaryUrl:
    "https://play.google.com/store/apps/details?id=com.infinitecampus.parent.campussphere",
  secondaryUrlLabel: "Descargar en Google Play",
  imageUrl:
    "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
  description: `Bienvenido al centro digital de la comunidad de Des Moines Public Schools. Esta aplicación ha sido diseñada para que cada padre, madre, tutor y estudiante tenga a mano toda la información académica y comunitaria necesaria en el día a día.

### ¿Por qué descargar la app?
A través de una interfaz moderna y completamente traducida, las familias pueden consultar el progreso de sus estudiantes sin depender de trámites presenciales o llamadas telefónicas. 

### Principales Beneficios para Familias:
1. **Calificaciones y Tareas al Instante**: Consulta las notas actualizadas por los profesores y los plazos de entrega de trabajos en Abraham Lincoln High School y todas las escuelas de DMPS.
2. **Registro de Asistencia y Notificaciones**: Recibe avisos en tiempo real cuando se registre una tardanza o ausencia justificada o imprevista.
3. **Mensajería Segura**: Comunícate de manera directa con consejeros escolares, maestros y administradores con soporte de traducción integrado.
4. **Calendario y Eventos del Distrito**: Entérate de días de salida temprana, conferencias de padres y maestros, descansos pedagógicos y festividades oficiales.
5. **Acceso Gratuito y Permanente**: Disponible sin ningún costo para toda la comunidad de estudiantes y familias matriculadas.

### ¿Cómo iniciar sesión por primera vez?
Para ingresar, utiliza las mismas credenciales institucionales otorgadas durante la matrícula escolar. Si requieres asistencia para recuperar tu usuario o contraseña, puedes acudir a la oficina principal de tu escuela o comunicarte con la línea de ayuda familiar.`,
  features: [
    "Notificaciones automáticas en tiempo real",
    "Calificaciones y tareas de cada clase",
    "Reporte diario de asistencia escolar",
    "Mensajería directa y avisos oficiales",
    "Calendario distrital y días de conferencias",
    "Soporte multilingüe en español e inglés",
  ],
  developer: "Des Moines Public Schools & Infinite Campus",
  version: "v4.2 Oficial (Actualizada)",
  // English defaults
  titleEn: APP_ARTICLE_TRANSLATIONS.en.title,
  subtitleEn: APP_ARTICLE_TRANSLATIONS.en.subtitle,
  badgeTextEn: APP_ARTICLE_TRANSLATIONS.en.badgeText,
  platformEn: APP_ARTICLE_TRANSLATIONS.en.platform,
  appUrlEn: "https://apps.apple.com/us/app/infinite-campus-parent/id1383293860",
  secondaryUrlLabelEn: APP_ARTICLE_TRANSLATIONS.en.secondaryUrlLabel,
  imageUrlEn:
    "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
  descriptionEn: APP_ARTICLE_TRANSLATIONS.en.description,
  featuresEn: [...APP_ARTICLE_TRANSLATIONS.en.features],
  versionEn: APP_ARTICLE_TRANSLATIONS.en.version,
  updatedAt: new Date().toISOString(),
};

const STORAGE_TABLE = "app_articles";
const ARTICLE_DOC_ID = "featured_app";
export const APP_ARTICLE_UPDATED_EVENT = "dmps:app-article-updated";

function ensureBilingualAppArticle(raw: AppArticleData): AppArticleData {
  const isDefault =
    !raw.title || raw.title === DEFAULT_APP_ARTICLE.title || raw.title.includes("DMPS Connect");
  const enDef = APP_ARTICLE_TRANSLATIONS.en;

  const titleEn =
    raw.titleEn && raw.titleEn.trim() && !hasSpanishContent(raw.titleEn)
      ? raw.titleEn
      : isDefault
        ? enDef.title
        : autoTranslateText(raw.title || DEFAULT_APP_ARTICLE.title, "en");

  const subtitleEn =
    raw.subtitleEn && raw.subtitleEn.trim() && !hasSpanishContent(raw.subtitleEn)
      ? raw.subtitleEn
      : isDefault
        ? enDef.subtitle
        : autoTranslateText(raw.subtitle || DEFAULT_APP_ARTICLE.subtitle, "en");

  const badgeTextEn =
    raw.badgeTextEn && raw.badgeTextEn.trim() && !hasSpanishContent(raw.badgeTextEn)
      ? raw.badgeTextEn
      : isDefault
        ? enDef.badgeText
        : autoTranslateText(raw.badgeText || DEFAULT_APP_ARTICLE.badgeText, "en");

  const platformEn =
    raw.platformEn && raw.platformEn.trim() && !hasSpanishContent(raw.platformEn)
      ? raw.platformEn
      : isDefault
        ? enDef.platform
        : autoTranslateText(raw.platform || DEFAULT_APP_ARTICLE.platform, "en");

  const secondaryUrlLabelEn =
    raw.secondaryUrlLabelEn &&
    raw.secondaryUrlLabelEn.trim() &&
    !hasSpanishContent(raw.secondaryUrlLabelEn)
      ? raw.secondaryUrlLabelEn
      : raw.secondaryUrlLabel
        ? autoTranslateText(raw.secondaryUrlLabel, "en")
        : enDef.secondaryUrlLabel;

  const descriptionEn =
    raw.descriptionEn && raw.descriptionEn.trim() && !hasSpanishContent(raw.descriptionEn)
      ? raw.descriptionEn
      : isDefault
        ? enDef.description
        : autoTranslateText(raw.description || DEFAULT_APP_ARTICLE.description, "en");

  const featuresEn =
    Array.isArray(raw.featuresEn) &&
    raw.featuresEn.length > 0 &&
    !raw.featuresEn.some((f) => hasSpanishContent(f))
      ? raw.featuresEn
      : isDefault
        ? [...enDef.features]
        : (raw.features || DEFAULT_APP_ARTICLE.features).map((f) => autoTranslateText(f, "en"));

  const versionEn =
    raw.versionEn && raw.versionEn.trim() && !hasSpanishContent(raw.versionEn)
      ? raw.versionEn
      : isDefault
        ? enDef.version
        : raw.version
          ? autoTranslateText(raw.version, "en")
          : enDef.version;

  const imageUrl = raw.imageUrl || raw.imageUrlEn || DEFAULT_APP_ARTICLE.imageUrl;
  const imageUrlEn = raw.imageUrlEn || raw.imageUrl || DEFAULT_APP_ARTICLE.imageUrlEn;

  return {
    ...DEFAULT_APP_ARTICLE,
    ...raw,
    imageUrl,
    imageUrlEn,
    titleEn,
    subtitleEn,
    badgeTextEn,
    platformEn,
    secondaryUrlLabelEn,
    descriptionEn,
    featuresEn,
    versionEn,
  };
}

/**
 * Reads the app article directly from Supabase site_settings with immediate fallback.
 */
export async function fetchAppArticle(): Promise<AppArticleData> {
  try {
    const raw = await getCachedSiteSetting<AppArticleData>(
      "featured_app_article",
      DEFAULT_APP_ARTICLE,
    );
    if (raw && typeof raw === "object") {
      return ensureBilingualAppArticle(raw);
    }
  } catch (error) {
    console.info("[AppArticle] Supabase fetch notice:", error);
  }

  return DEFAULT_APP_ARTICLE;
}

/**
 * Persists the updated app article directly to Supabase site_settings.
 */
export async function saveAppArticle(
  data: Partial<AppArticleData> & { title: string; appUrl: string; description: string },
): Promise<AppArticleData> {
  const merged: AppArticleData = ensureBilingualAppArticle({
    ...DEFAULT_APP_ARTICLE,
    ...data,
    id: ARTICLE_DOC_ID,
    updatedAt: new Date().toISOString(),
  });

  await saveSiteSetting("featured_app_article", merged);

  notifyContentUpdated("site_settings");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(APP_ARTICLE_UPDATED_EVENT, { detail: merged }));
  }

  notifySaveSuccess("Artículo y enlace de la app guardados correctamente en Supabase (ES / EN)");
  return merged;
}

export function getLocalizedAppArticle(
  rawArticle: AppArticleData,
  lang: LanguageCode | string,
): AppArticleData {
  const article = ensureBilingualAppArticle(rawArticle);

  if (lang === "es") {
    return {
      ...article,
      imageUrl: article.imageUrl || article.imageUrlEn || DEFAULT_APP_ARTICLE.imageUrl,
    };
  }

  if (lang === "kar" || lang === "ksw") {
    const karLoc = APP_ARTICLE_TRANSLATIONS.kar;
    return {
      ...article,
      title: karLoc.title,
      subtitle: karLoc.subtitle,
      badgeText: karLoc.badgeText,
      platform: karLoc.platform,
      secondaryUrlLabel: karLoc.secondaryUrlLabel,
      features: karLoc.features,
      description: karLoc.description,
      imageUrl: article.imageUrlEn || article.imageUrl || DEFAULT_APP_ARTICLE.imageUrl,
    };
  }

  // English version
  return {
    ...article,
    title: article.titleEn || autoTranslateText(article.title, "en"),
    subtitle: article.subtitleEn || autoTranslateText(article.subtitle, "en"),
    badgeText: article.badgeTextEn || autoTranslateText(article.badgeText, "en"),
    platform: article.platformEn || autoTranslateText(article.platform, "en"),
    appUrl: article.appUrlEn || article.appUrl,
    secondaryUrlLabel:
      article.secondaryUrlLabelEn ||
      (article.secondaryUrlLabel
        ? autoTranslateText(article.secondaryUrlLabel, "en")
        : APP_ARTICLE_TRANSLATIONS.en.secondaryUrlLabel),
    imageUrl: article.imageUrlEn || article.imageUrl || DEFAULT_APP_ARTICLE.imageUrl,
    description: article.descriptionEn || autoTranslateText(article.description, "en"),
    features:
      article.featuresEn && article.featuresEn.length > 0
        ? article.featuresEn
        : article.features.map((f) => autoTranslateText(f, "en")),
    version:
      article.versionEn || (article.version ? autoTranslateText(article.version, "en") : undefined),
  };
}
