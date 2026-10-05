import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Layers,
  QrCode,
  RotateCw,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OfficialDataBadge } from "@/components/official-badge";
import { PublicShell } from "@/components/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminSession } from "@/lib/admin";
import {
  APP_ARTICLE_UPDATED_EVENT,
  AppArticleData,
  DEFAULT_APP_ARTICLE,
  fetchAppArticle,
  getLocalizedAppArticle,
} from "@/lib/app-article";
import { SITE_SETTINGS_QUERY_OPTIONS } from "@/lib/site-settings-service";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/transporte/dart")({
  head: () => ({
    meta: [
      {
        title: "Aplicación Escolar Oficial — DMPS Family Info",
      },
      {
        name: "description",
        content:
          "Descubre la aplicación móvil oficial de Des Moines Public Schools. Consulta calificaciones, asistencias, avisos escolares y descarga la app para iOS, Android y Web.",
      },
      {
        property: "og:title",
        content: "Aplicación Escolar Oficial — Familias DMPS",
      },
      {
        property: "og:description",
        content:
          "Toda la información, enlace de descarga y detalles de la aplicación oficial para las familias y estudiantes del distrito escolar.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://familiasdmps.app/transporte/dart" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/transporte/dart" }],
  }),
  component: AppArticlePublicPage,
});

export function AppArticlePublicPage() {
  const { t, lang } = useI18n();
  const { session } = useAdminSession();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Load App Article data with React Query
  const {
    data: rawArticle = DEFAULT_APP_ARTICLE,
    refetch,
    isLoading,
  } = useQuery<AppArticleData>({
    queryKey: ["app_article_featured"],
    queryFn: () => fetchAppArticle(),
    ...SITE_SETTINGS_QUERY_OPTIONS,
  });

  const article = useMemo(() => getLocalizedAppArticle(rawArticle, lang), [rawArticle, lang]);

  // Listen to live updates from the Admin panel in same or other tab
  useEffect(() => {
    const handleUpdate = () => {
      void refetch();
    };
    window.addEventListener(APP_ARTICLE_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(APP_ARTICLE_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refetch]);

  const handleCopyLink = () => {
    if (navigator.clipboard && article.appUrl) {
      navigator.clipboard
        .writeText(article.appUrl)
        .then(() => {
          toast.success(
            lang === "es"
              ? "Enlace de la app copiado al portapapeles."
              : (lang as string) === "kar"
                ? "အပလီခ့ၡၢၣ်တၢ်ဆဲးကျိး ဘၣ်တၢ်ကူးပာ်လံ."
                : "App link copied to clipboard.",
          );
        })
        .catch(() => {
          toast.info(`Link: ${article.appUrl}`);
        });
    } else {
      toast.info(`Link: ${article.appUrl}`);
    }
  };

  return (
    <PublicShell>
      <div className="relative min-h-screen pb-16">
        {/* Subtle background ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl"
        />

        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
          {/* Breadcrumb / Category Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-border/50">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">
                {t("nav.home")}
              </Link>
              <span>/</span>
              <Link to="/apps" className="hover:text-foreground transition-colors">
                {lang === "es"
                  ? "Herramientas Digitales"
                  : (lang as string) === "kar"
                    ? "စဲးဖီကဟၣ်တၢ်ပရၢ"
                    : "Digital Tools"}
              </Link>
              <span>/</span>
              <span className="font-semibold text-foreground">
                {lang === "es"
                  ? "Artículo de la App"
                  : (lang as string) === "kar"
                    ? "အပလီခ့ၡၢၣ်တၢ်ပရၢ"
                    : "Featured App"}
              </span>
            </nav>

            <div className="flex items-center gap-2">
              <OfficialDataBadge
                sourceName="Ride DART Official"
                sourceUrl="https://www.ridedart.com"
              />
              {session && (
                <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-lg">
                  <Link to="/admin/dart/configuracion">
                    <Sparkles className="mr-1.5 size-3 text-primary" />
                    <span>
                      {lang === "es"
                        ? "Editar en Admin"
                        : (lang as string) === "kar"
                          ? "မၤဂ့ၤထီၣ်ဖဲ Admin"
                          : "Edit in Admin"}
                    </span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Content Column */}
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold">
                  <Sparkles className="mr-1.5 size-3.5" />
                  {article.badgeText ||
                    (lang === "es"
                      ? "Aplicación Oficial Recomendada"
                      : (lang as string) === "kar"
                        ? "ကၠိတၢ်ဘိးဘၣ်သစူၤအပလီခ့ၡၢၣ်"
                        : "Recommended Official App")}
                </Badge>
                {article.platform && (
                  <Badge variant="secondary" className="text-xs">
                    {article.platform}
                  </Badge>
                )}
                {article.version && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {article.version}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                {article.title}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {article.subtitle}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl px-6 py-6 text-base font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <a
                    href={article.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <Download className="size-5" />
                    <span>
                      {lang === "es"
                        ? "Descargar / Abrir App"
                        : (lang as string) === "kar"
                          ? "ဒိးန့ၢ် / အိးထီၣ် အပလီခ့ၡၢၣ်"
                          : "Download / Open App"}
                    </span>
                    <ArrowUpRight className="size-4 opacity-80" />
                  </a>
                </Button>

                {article.secondaryUrl && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="rounded-2xl px-5 py-6 font-semibold"
                  >
                    <a
                      href={article.secondaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <ExternalLink className="size-4 text-muted-foreground" />
                      <span>
                        {article.secondaryUrlLabel ||
                          (lang === "es"
                            ? "Tienda Alternativa"
                            : (lang as string) === "kar"
                              ? "ဒိးန့ၢ်ကျဲအဂၤ"
                              : "Alternative Store")}
                      </span>
                    </a>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsQrOpen(true)}
                  title={
                    lang === "es"
                      ? "Escanear código QR en móvil"
                      : (lang as string) === "kar"
                        ? "QR လိၣ်"
                        : "Scan QR code on mobile"
                  }
                  className="size-12 rounded-2xl border border-border bg-card shadow-xs hover:bg-muted"
                >
                  <QrCode className="size-5 text-foreground" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyLink}
                  title={
                    lang === "es"
                      ? "Copiar enlace directo"
                      : (lang as string) === "kar"
                        ? "ကူးတၢ်ဆဲးကျိး"
                        : "Copy direct link"
                  }
                  className="size-12 rounded-2xl border border-border bg-card shadow-xs hover:bg-muted"
                >
                  <Copy className="size-5 text-foreground" />
                </Button>
              </div>

              {/* Developer & Security Trust Note */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>
                  {article.developer
                    ? lang === "es"
                      ? `Verificado por ${article.developer}`
                      : (lang as string) === "kar"
                        ? `${article.developer} အုၣ်သးဝဲ`
                        : `Verified by ${article.developer}`
                    : lang === "es"
                      ? "Canal seguro y verificado para familias de Des Moines"
                      : (lang as string) === "kar"
                        ? "တၢ်ဘံၣ်တၢ်ဘၢကျဲလၢ Des Moines ဟံၣ်ဖိဃီဖိအဂီၢ်"
                        : "Secure verified channel for Des Moines families"}
                </span>
              </div>
            </div>

            {/* Right Photo Column - Space adapts to the image */}
            <div className="lg:col-span-5 flex justify-center">
              <div
                onClick={() => setIsImageModalOpen(true)}
                className="group relative inline-block w-fit max-w-full cursor-zoom-in overflow-hidden rounded-3xl border border-border/80 bg-card p-2 shadow-xl transition-all hover:border-primary/40 hover:shadow-2xl"
              >
                <div className="relative inline-block overflow-hidden rounded-2xl">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    className="block h-auto max-h-[75vh] w-auto max-w-full rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_APP_ARTICLE.imageUrl;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 drop-shadow-md">
                      <Smartphone className="size-3.5 shrink-0" />
                      {lang === "es"
                        ? "Fotografía de la App"
                        : (lang as string) === "kar"
                          ? "အပလီခ့ၡၢၣ်တၢ်ဂီၤ"
                          : "App Screenshot"}
                    </span>
                    <span className="rounded-md bg-black/50 px-2 py-0.5 backdrop-blur-xs">
                      {lang === "es"
                        ? "Clic para ampliar"
                        : (lang as string) === "kar"
                          ? "ဃုထၢဒ်သိးကဒိၣ်ထီၣ်"
                          : "Click to enlarge"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features Cards */}
          {article.features && article.features.length > 0 && (
            <div className="mt-14 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  {lang === "es"
                    ? "Funciones Destacadas para Estudiantes y Padres"
                    : (lang as string) === "kar"
                      ? "တၢ်ခွဲးတၢ်ယာ်အရ့ဒိၣ်တဖၣ်လၢ ဟံၣ်ဖိဃီဖိအဂီၢ်"
                      : "Key Features for Students & Families"}
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {article.features.map((feature, idx) => (
                  <Card
                    key={idx}
                    className="rounded-2xl border border-border/80 bg-card/60 p-4 backdrop-blur-xs transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {feature}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Article Detailed Information Body */}
          <div className="mt-14 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm">
              <div className="max-w-3xl space-y-6">
                <div className="border-b border-border/60 pb-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {lang === "es"
                      ? "Acerca de la Aplicación y Guía de Uso"
                      : (lang as string) === "kar"
                        ? "အပလီခ့ၡၢၣ်တၢ်ဂ့ၢ် ဒီးတၢ်နဲၣ်ကျဲ"
                        : "About the Application & User Guide"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lang === "es"
                      ? "Todo lo que necesitas saber para instalar, configurar y aprovechar esta herramienta."
                      : (lang as string) === "kar"
                        ? "တၢ်ပရၢခဲလၢာ်လၢ ဟံၣ်ဖိဃီဖိလိၣ်ဘၣ်ဝဲ ဒ်သိးကသူဝဲတၢ်ပရၢအံၤ."
                        : "Everything you need to know to install, configure, and use this tool."}
                  </p>
                </div>

                {/* Formatted body with paragraphs and headings */}
                <div className="space-y-4 text-foreground/90 leading-relaxed text-base sm:text-lg">
                  {article.description.split("\n\n").map((paragraph, index) => {
                    const trimmed = paragraph.trim();
                    if (!trimmed) return null;

                    // Markdown heading 3
                    if (trimmed.startsWith("###")) {
                      return (
                        <h3
                          key={index}
                          className="pt-4 text-xl sm:text-2xl font-bold tracking-tight text-foreground"
                        >
                          {trimmed.replace(/^###\s*/, "")}
                        </h3>
                      );
                    }

                    // Numbered list item
                    if (/^\d+\.\s/.test(trimmed)) {
                      return (
                        <div key={index} className="space-y-2 pl-2">
                          {trimmed.split("\n").map((item, itemIdx) => {
                            const itemContent = item.replace(/^\d+\.\s*/, "");
                            const parts = itemContent.split("**");
                            return (
                              <div key={itemIdx} className="flex items-start gap-2.5 text-base">
                                <span className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                                <p className="text-muted-foreground">
                                  {parts.map((p, pIdx) =>
                                    pIdx % 2 === 1 ? (
                                      <strong key={pIdx} className="text-foreground font-bold">
                                        {p}
                                      </strong>
                                    ) : (
                                      p
                                    ),
                                  )}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    // Standard paragraph with bold text parsing
                    const parts = trimmed.split("**");
                    return (
                      <p key={index} className="text-muted-foreground leading-relaxed">
                        {parts.map((part, pIdx) =>
                          pIdx % 2 === 1 ? (
                            <strong key={pIdx} className="text-foreground font-bold">
                              {part}
                            </strong>
                          ) : (
                            part
                          ),
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3-Step Quick Start Guide */}
          <div className="mt-14 space-y-6">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {lang === "es"
                ? "¿Cómo Comenzar en 3 Sencillos Pasos?"
                : (lang as string) === "kar"
                  ? "ကျဲသၢဘိလၢ ကစးထီၣ်အဂီၢ်"
                  : "How to Get Started in 3 Simple Steps"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="rounded-3xl border border-border bg-card p-6 shadow-xs">
                <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm mb-4">
                  01
                </div>
                <h3 className="font-bold text-base text-foreground mb-1">
                  {lang === "es"
                    ? "Descarga la App"
                    : (lang as string) === "kar"
                      ? "ဒိးန့ၢ် အပလီခ့ၡၢၣ်"
                      : "Download the App"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "es"
                    ? "Haz clic en el enlace de descarga o escanea el código QR desde tu teléfono celular o tablet."
                    : (lang as string) === "kar"
                      ? "ဃုထၢဒိးန့ၢ်တၢ်ဆဲးကျိး မ့တမ့ၢ် QR လိၣ်ဖဲလီတဲစိ."
                      : "Click the download link or scan the QR code from your mobile device."}
                </p>
              </Card>

              <Card className="rounded-3xl border border-border bg-card p-6 shadow-xs">
                <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm mb-4">
                  02
                </div>
                <h3 className="font-bold text-base text-foreground mb-1">
                  {lang === "es"
                    ? "Inicia Sesión"
                    : (lang as string) === "kar"
                      ? "နုာ်လီၤမံၤ"
                      : "Log In"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "es"
                    ? "Utiliza las credenciales institucionales otorgadas por la escuela. Si no las recuerdas, contacta a la secretaría escolar."
                    : (lang as string) === "kar"
                      ? "သူကၠိတၢ်မၤနီၣ်မံၤလၢ ကၠိဟ့ၣ်ဝဲနၤတဖၣ်. မ့ၢ်လိၣ်တၢ်မၤစၢၤန့ၣ် ဆဲးကျိးဝဲၤဒၢး."
                      : "Use your institutional credentials provided by the school. Contact the main office if needed."}
                </p>
              </Card>

              <Card className="rounded-3xl border border-border bg-card p-6 shadow-xs">
                <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm mb-4">
                  03
                </div>
                <h3 className="font-bold text-base text-foreground mb-1">
                  {lang === "es"
                    ? "Activa Alertas"
                    : (lang as string) === "kar"
                      ? "အိးထီၣ်တၢ်ဟ့ၣ်ပလီၢ်"
                      : "Enable Alerts"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === "es"
                    ? "Permite notificaciones para no perderte ningún reporte de asistencia, eventos climáticos o mensajes docentes."
                    : (lang as string) === "kar"
                      ? "အိးထီၣ်တၢ်ဟ့ၣ်ပလီၢ်တဖၣ် ဒ်သိးတၢ်ဟဲကၠိဒီးတၢ်ပရၢတဂျုၤသးတဂ့ၤ."
                      : "Allow push notifications to never miss attendance notices, weather alerts, or school updates."}
                </p>
              </Card>
            </div>
          </div>

          {/* Bottom Conversion & Download Box */}
          <div className="mt-14 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-8 sm:p-12 text-center">
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="inline-flex size-14 rounded-3xl bg-primary/15 text-primary items-center justify-center shadow-xs">
                <Smartphone className="size-7" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {lang === "es"
                  ? `Accede ahora a ${article.title}`
                  : (lang as string) === "kar"
                    ? `နုာ်လီၤသူ ${article.title}`
                    : `Access ${article.title} Now`}
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {lang === "es"
                  ? "Descárgala de manera gratuita y mantén la información escolar de tus hijos siempre a tu alcance."
                  : (lang as string) === "kar"
                    ? "ဒိးန့ၢ်အခ့အဖျါတအိၣ် ဒီးပာ်ဘူးကၠိတၢ်ပရၢခဲလၢာ်လၢ နစုတီၤ."
                    : "Download for free and keep your student's school info right at your fingertips."}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Button asChild size="lg" className="rounded-2xl px-8 font-bold shadow-md">
                  <a
                    href={article.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <span>
                      {lang === "es"
                        ? "Abrir Enlace Oficial"
                        : (lang as string) === "kar"
                          ? "အိးထီၣ်တၢ်ဆဲးကျိး"
                          : "Open Official Link"}
                    </span>
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setIsQrOpen(true)}
                  className="rounded-2xl font-semibold"
                >
                  <QrCode className="mr-2 size-4" />
                  <span>
                    {lang === "es"
                      ? "Ver Código QR"
                      : (lang as string) === "kar"
                        ? "ကွၢ် QR လိၣ်"
                        : "View QR Code"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold">
              {lang === "es"
                ? "Código QR de la Aplicación"
                : (lang as string) === "kar"
                  ? "အပလီခ့ၡၢၣ် QR လိၣ်"
                  : "Application QR Code"}
            </DialogTitle>
            <DialogDescription>
              {lang === "es"
                ? "Apunta la cámara de tu teléfono para abrir directamente el enlace en tu dispositivo."
                : (lang as string) === "kar"
                  ? "ကွၢ်ဒီးလီတဲစိ ကမဲရၤ ဒ်သိးကအိးထီၣ်တၢ်ဆဲးကျိးဖဲလီတဲစိ."
                  : "Point your phone camera to open the link directly on your device."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(article.appUrl)}`}
                alt="Código QR de la app"
                className="size-52 rounded-lg"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-foreground break-all max-w-xs">
                {article.appUrl}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {lang === "es"
                  ? "Compatible con iOS y Android"
                  : (lang as string) === "kar"
                    ? "iOS ဒီး Android သူဝဲသ့"
                    : "Compatible with iOS and Android"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox Image Dialog */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl p-2 rounded-3xl overflow-hidden bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[300px] max-h-[85vh]">
            <img
              src={article.imageUrl}
              alt={article.title}
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto object-contain rounded-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}
