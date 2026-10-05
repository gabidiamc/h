/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Trophy,
  BookOpen,
  Users,
  Image as ImageIcon,
  HelpCircle,
  Eye,
  Send,
  Save,
  Globe,
  ExternalLink,
  RotateCcw,
  Check,
  Tag,
  Clock,
  MapPin,
  Mail,
  ShieldCheck,
  AlertCircle,
  FolderTree,
  ChevronRight,
  Wand2,
  FileText,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listRows, upsertRow, logAudit } from "@/lib/admin";
import { useSchool } from "@/lib/school";
import { ArticleBlocks } from "@/components/article-blocks";
import { FileUploadInput } from "@/components/file-upload-input";

export const Route = createFileRoute("/admin/creador-ia")({
  component: AdminAICreatorPage,
});

const PRESET_BANNERS = [
  {
    label: "Voluntariado y Comunidad",
    url: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
    category: "cat_ayuda_familias",
  },
  {
    label: "Campus Escolar y Estudiantes",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    category: "cat_empieza_aqui",
  },
  {
    label: "Deportes y Atletismo",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    category: "cat_empieza_aqui",
  },
  {
    label: "Artes y Música",
    url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    category: "cat_empieza_aqui",
  },
  {
    label: "Eventos y Ceremonias",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    category: "cat_calendario_horarios",
  },
  {
    label: "Lincoln High School Oficial",
    url: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80",
    category: "cat_empieza_aqui",
  },
];

function AdminAICreatorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { adminSchoolFilter, schools } = useSchool();

  // Load existing categories
  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => listRows("categories"),
  });
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  // Stepper state: 1 (Config), 2 (Questions), 3 (Review & Edit), 4 (Approved/Published)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [contentType, setContentType] = useState<"article" | "sport" | "activity" | "event">(
    "article",
  );
  const [schoolId, setSchoolId] = useState<string>(
    adminSchoolFilter && adminSchoolFilter !== "all" ? adminSchoolFilter : "all",
  );
  const [cardTitle, setCardTitle] = useState("Voluntariado y Silver Cord");
  const [categoryId, setCategoryId] = useState<string>("cat_ayuda_familias");
  const [bannerUrl, setBannerUrl] = useState(
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
  );
  const [userNotes, setUserNotes] = useState(
    "Silver Cord reconoce horas de servicio voluntario para estudiantes. Los estudiantes envían sus horas en Infinite Campus.",
  );

  // Questions State
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Generated Content State
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeLang, setActiveLang] = useState<"es" | "en">("es");
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  // Editable fields in Step 3
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTitleEn, setEditTitleEn] = useState("");
  const [editSummaryEn, setEditSummaryEn] = useState("");
  const [editContentEn, setEditContentEn] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [editAdvisor, setEditAdvisor] = useState("Isabella Andersen");
  const [editEmail, setEditEmail] = useState("isabella.andersen@dmschools.org");

  // Publishing State
  const [publishedItem, setPublishedItem] = useState<{
    id: string;
    slug: string;
    type: string;
    url: string;
  } | null>(null);

  const selectedCategoryObj = useMemo(() => {
    return categories.find((c: any) => c.id === categoryId) || categories[0];
  }, [categories, categoryId]);

  // Quick preset loader
  const loadPreset = (type: "silver_cord" | "soccer" | "orientation") => {
    if (type === "silver_cord") {
      setContentType("article");
      setCardTitle("Voluntariado y Silver Cord");
      setCategoryId("cat_ayuda_familias");
      setBannerUrl(
        "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
      );
      setUserNotes(
        "Silver Cord reconoce las horas de servicio voluntario realizadas por estudiantes. Los estudiantes deben enviar sus horas para que aparezcan en Infinite Campus. Incluye enlace para enviar horas y reglas de qué cuenta y qué no.",
      );
      toast.info("Ejemplo 'Voluntariado y Silver Cord' cargado");
    } else if (type === "soccer") {
      setContentType("sport");
      setCardTitle("Fútbol Soccer Masculino 2026-2027");
      setCategoryId("cat_empieza_aqui");
      setBannerUrl(
        "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
      );
      setUserNotes(
        "Pruebas de selección (tryouts) para el equipo de fútbol en primavera. Entrenamientos en el estadio de la escuela. Requiere examen físico al día en Bound.",
      );
      toast.info("Ejemplo 'Fútbol Soccer' cargado");
    } else {
      setContentType("event");
      setCardTitle("Noche Informativa para Familias de Nuevo Ingreso");
      setCategoryId("cat_calendario_horarios");
      setBannerUrl(
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
      );
      setUserNotes(
        "Reunión comunitaria en el auditorio escolar con traducción simultánea al español. Conoce a los maestros, enlaces bilingües y el horario de clases.",
      );
      toast.info("Ejemplo 'Noche Informativa' cargado");
    }
  };

  // Step 1 -> Step 2: Request AI Questions
  const handleProceedToQuestions = async () => {
    if (!cardTitle.trim()) {
      toast.error("Por favor escribe el título de la tarjeta");
      return;
    }

    setIsLoadingQuestions(true);
    try {
      const schoolLabel =
        schoolId === "all"
          ? "Des Moines Public Schools (Distrito)"
          : schools.find((s) => s.id === schoolId)?.name || schoolId;

      const catLabel = selectedCategoryObj?.name || "General";

      const res = await fetch("/api/ai-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "questions",
          contentType,
          cardTitle,
          categoryName: catLabel,
          schoolName: schoolLabel,
          userNotes,
        }),
      });

      const json = await res.json();
      if (json.questions && Array.isArray(json.questions)) {
        setQuestions(json.questions);
        // Pre-fill smart defaults for known queries
        const initialAnswers: Record<string, string> = {};
        if (cardTitle.toLowerCase().includes("silver cord")) {
          json.questions.forEach((q: string) => {
            if (q.toLowerCase().includes("advisor") || q.toLowerCase().includes("contacto")) {
              initialAnswers[q] =
                "Isabella Andersen (Asesora Oficial de Silver Cord), isabella.andersen@dmschools.org";
            } else if (
              q.toLowerCase().includes("formulario") ||
              q.toLowerCase().includes("plataforma")
            ) {
              initialAnswers[q] = "Formulario oficial de DMPS en línea y portal de Infinite Campus";
            } else if (q.toLowerCase().includes("sí cuentan") || q.toLowerCase().includes("si")) {
              initialAnswers[q] =
                "Bancos de alimentos, escuelas públicas, parques municipales, centros comunitarios sin pago";
            } else if (q.toLowerCase().includes("no cuentan") || q.toLowerCase().includes("no")) {
              initialAnswers[q] =
                "Trabajos remunerados, empresas privadas comerciales, tareas normales de limpieza escolar";
            } else if (q.toLowerCase().includes("tiempo") || q.toLowerCase().includes("cuándo")) {
              initialAnswers[q] = "Aproximadamente 24 a 48 horas tras la verificación del asesor";
            }
          });
        }
        setAnswers(initialAnswers);
        setStep(2);
      } else {
        toast.error("No se pudieron obtener preguntas de la IA.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al comunicarse con el asistente de IA.");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Step 2 -> Step 3: Generate Content
  const handleGenerateContent = async () => {
    setIsGenerating(true);
    try {
      const schoolLabel =
        schoolId === "all"
          ? "Des Moines Public Schools (Distrito)"
          : schools.find((s) => s.id === schoolId)?.name || schoolId;

      const catLabel = selectedCategoryObj?.name || "General";

      const res = await fetch("/api/ai-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          contentType,
          cardTitle,
          categoryName: catLabel,
          schoolName: schoolLabel,
          bannerUrl,
          userNotes,
          answers,
        }),
      });

      const json = await res.json();
      if (json.result) {
        const r = json.result;
        setGeneratedResult(r);
        setEditTitle(r.title || cardTitle);
        setEditSummary(r.summary || "");
        setEditContent(r.content || "");
        setEditTitleEn(r.title_en || cardTitle);
        setEditSummaryEn(r.summary_en || "");
        setEditContentEn(r.content_en || "");
        setEditBannerUrl(r.banner_url || bannerUrl);
        setStep(3);
        toast.success("¡Contenido generado exitosamente con estructura verídica!");
      } else {
        toast.error("Error al generar contenido estructurado.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar la solicitud con IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert simple markdown lines to Block[] for persistent storage
  const markdownToBlocks = (md: string): any[] => {
    const lines = md.split("\n");
    const blocks: any[] = [];
    let currentList: string[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        blocks.push({ type: "list", items: [...currentList] });
        currentList = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) {
        flushList();
        continue;
      }

      if (line.startsWith("### ")) {
        flushList();
        blocks.push({ type: "heading", text: line.replace(/^###\s+/, "") });
      } else if (line.startsWith("## ")) {
        flushList();
        blocks.push({ type: "heading", text: line.replace(/^##\s+/, "") });
      } else if (line.startsWith("# ")) {
        flushList();
        blocks.push({ type: "heading", text: line.replace(/^#\s+/, "") });
      } else if (line.startsWith("* ") || line.startsWith("- ") || /^\d+\.\s+/.test(line)) {
        currentList.push(line.replace(/^(\*|-|\d+\.)\s+/, ""));
      } else if (line.startsWith("> ")) {
        flushList();
        blocks.push({
          type: "callout",
          title: "Información Clave",
          text: line.replace(/^>\s+/, ""),
          variant: "verified",
        });
      } else {
        flushList();
        blocks.push({ type: "paragraph", text: line });
      }
    }
    flushList();
    return blocks;
  };

  // Step 3 -> Publish or Draft
  const saveAndPublishMutation = useMutation({
    mutationFn: async (targetStatus: "published" | "draft") => {
      const baseSlug = cardTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      const newId = `${contentType}_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const esBlocks = markdownToBlocks(editContent);
      const enBlocks = markdownToBlocks(editContentEn || editContent);

      if (contentType === "article") {
        // Save article translations
        const trEs = {
          id: `tr_${newId}_es`,
          article_id: newId,
          language_code: "es",
          title: editTitle,
          summary: editSummary,
          content_blocks: esBlocks,
          updated_at: nowIso,
        };
        const trEn = {
          id: `tr_${newId}_en`,
          article_id: newId,
          language_code: "en",
          title: editTitleEn || editTitle,
          summary: editSummaryEn || editSummary,
          content_blocks: enBlocks,
          updated_at: nowIso,
        };

        await upsertRow("article_translations", trEs);
        await upsertRow("article_translations", trEn);

        // Save main article row
        const articleRow = {
          id: newId,
          slug: uniqueSlug,
          title: editTitle,
          summary: editSummary,
          category_id: categoryId,
          school_id: schoolId,
          card_banner_url: editBannerUrl,
          featured_image_url: editBannerUrl,
          status: targetStatus,
          is_featured: true,
          published_at: targetStatus === "published" ? nowIso : null,
          updated_at: nowIso,
          verified_at: nowIso.slice(0, 10),
          source_name:
            schoolId === "all"
              ? "Des Moines Public Schools"
              : schools.find((s) => s.id === schoolId)?.name || schoolId,
          article_translations: [trEs, trEn],
        };

        await upsertRow("articles", articleRow);
        await logAudit(
          "create",
          "articles",
          newId,
          `Generado con IA y ${targetStatus === "published" ? "publicado" : "guardado como borrador"}`,
        );

        return {
          id: newId,
          slug: uniqueSlug,
          type: "article",
          url: `/articles/${uniqueSlug}`,
        };
      }

      if (contentType === "event") {
        const todayStr = nowIso.slice(0, 10);
        const eventRow = {
          id: newId,
          slug: uniqueSlug,
          title: editTitle,
          description: editContent,
          event_type: "academic",
          start_date: todayStr,
          end_date: todayStr,
          start_time: "18:00",
          end_time: "19:30",
          all_day: false,
          location:
            schoolId === "all"
              ? "Sede del Distrito DMPS"
              : `Campus Principal de ${schools.find((s) => s.id === schoolId)?.name || schoolId}`,
          official_url: "https://dmschools.org",
          image_url: editBannerUrl,
          is_featured: true,
          is_cancelled: false,
          status: targetStatus,
          school_id: schoolId,
          category_id: categoryId,
          updated_at: nowIso,
          event_translations: [
            { language_code: "es", title: editTitle, description: editContent },
            {
              language_code: "en",
              title: editTitleEn || editTitle,
              description: editContentEn || editContent,
            },
          ],
        };

        await upsertRow("events", eventRow);
        await logAudit("create", "events", newId, "Evento generado con IA");
        return {
          id: newId,
          slug: uniqueSlug,
          type: "event",
          url: "/eventos",
        };
      }

      if (contentType === "sport" || contentType === "activity") {
        const activityRow = {
          id: newId,
          slug: uniqueSlug,
          name: editTitle,
          activity_type: contentType === "sport" ? "sport" : "club",
          season: "year_round",
          school_id: schoolId,
          school_level: "high",
          grades: "9-12",
          gender: "coed",
          description: editContent,
          schedule: "Lunes a Jueves 3:45 PM - 5:30 PM",
          location:
            schoolId === "all"
              ? "Des Moines Public Schools"
              : `Instalaciones de ${schools.find((s) => s.id === schoolId)?.name || schoolId}`,
          requirements: "Examen físico anual en Bound y registro escolar",
          forms_url: "https://dmschools.org/athletics",
          registration_info: "Inscripciones abiertas para estudiantes elegibles",
          official_url: "https://dmschools.org",
          image_url: editBannerUrl,
          enrollment_open: true,
          status: targetStatus,
          updated_at: nowIso,
          activity_translations: [
            { language_code: "es", name: editTitle, description: editContent },
            {
              language_code: "en",
              name: editTitleEn || editTitle,
              description: editContentEn || editContent,
            },
          ],
        };

        await upsertRow("activities", activityRow);
        await logAudit("create", "activities", newId, "Deporte/Actividad generada con IA");
        return {
          id: newId,
          slug: uniqueSlug,
          type: "activity",
          url: "/deportes-actividades",
        };
      }

      throw new Error("Tipo de contenido no soportado");
    },
    onSuccess: (res, targetStatus) => {
      setPublishedItem(res);
      setStep(4);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["articles"] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["activities"] });

      if (targetStatus === "published") {
        toast.success("¡Publicado en vivo con éxito! Ya es visible públicamente.");
      } else {
        toast.info("Guardado como borrador.");
      }
    },
    onError: (err: any) => {
      toast.error(`Error al guardar: ${err?.message || err}`);
    },
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-amber-500/10 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-extrabold text-primary">
              <Sparkles className="size-3.5" />
              <span>Generador Asistido con Inteligencia Artificial</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Creador de Contenido Inteligente
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Crea artículos completos, deportes, actividades y eventos con datos verídicos de DMPS,
              estructura guiada con emojis, enlaces oficiales, revisión paso a paso y publicación
              inmediata.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold gap-2 text-xs"
              onClick={() => loadPreset("silver_cord")}
            >
              <Sparkles className="size-3.5 text-amber-500" />
              Ejemplo: Silver Cord
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold gap-2 text-xs"
              onClick={() => loadPreset("soccer")}
            >
              <Trophy className="size-3.5 text-emerald-500" />
              Ejemplo: Deportes
            </Button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mt-8 pt-6 border-t border-border/80 grid grid-cols-4 gap-2 text-center">
          <div
            className={`rounded-2xl p-2.5 transition-all text-xs font-bold ${
              step === 1
                ? "bg-primary text-primary-foreground shadow-sm"
                : step > 1
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            1. Tarjeta y Banner
          </div>
          <div
            className={`rounded-2xl p-2.5 transition-all text-xs font-bold ${
              step === 2
                ? "bg-primary text-primary-foreground shadow-sm"
                : step > 2
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            2. Preguntas de Precisión
          </div>
          <div
            className={`rounded-2xl p-2.5 transition-all text-xs font-bold ${
              step === 3
                ? "bg-primary text-primary-foreground shadow-sm"
                : step > 3
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            3. Revisión y Edición
          </div>
          <div
            className={`rounded-2xl p-2.5 transition-all text-xs font-bold ${
              step === 4 ? "bg-emerald-600 text-white shadow-sm" : "bg-muted text-muted-foreground"
            }`}
          >
            4. Aprobado y Público
          </div>
        </div>
      </div>

      {/* STEP 1: CONFIGURATION */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-3xl border-border/80 shadow-xs">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Tag className="size-5 text-primary" />
                  Configuración de la Tarjeta y Publicación
                </CardTitle>
                <CardDescription>
                  Define el tipo, título, escuela y categoría de la tarjeta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Content Type Selector */}
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-2">
                    Tipo de contenido
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "article", label: "Artículo / Guía", icon: BookOpen },
                      { id: "sport", label: "Deporte Escolar", icon: Trophy },
                      { id: "activity", label: "Club / Actividad", icon: Users },
                      { id: "event", label: "Evento / Fecha", icon: Calendar },
                    ].map((t) => {
                      const Icon = t.icon;
                      const active = contentType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setContentType(t.id as any)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                            active
                              ? "border-primary bg-primary/10 text-primary font-extrabold shadow-2xs"
                              : "border-border bg-card text-muted-foreground hover:bg-muted font-medium"
                          }`}
                        >
                          <Icon className="size-5 mb-1" />
                          <span className="text-xs">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* School Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Escuela Asignada
                    </label>
                    <select
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      className="w-full min-h-11 rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      <option value="all">Todas las escuelas (Distrito DMPS)</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Categoría Temática
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full min-h-11 rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card Title */}
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Título de la Tarjeta
                  </label>
                  <Input
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    placeholder="Ej: Voluntariado y Silver Cord"
                    className="min-h-12 rounded-xl text-sm font-bold"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Este título aparecerá en la portada y en la tarjeta del listado.
                  </p>
                </div>

                {/* Banner Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Banner de la Tarjeta (Imagen)
                    </label>
                    <span className="text-[11px] text-primary font-bold">
                      Sugerencias de alta calidad
                    </span>
                  </div>

                  <Input
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="min-h-11 rounded-xl text-xs"
                  />

                  {/* Preset Banner Thumbnails */}
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_BANNERS.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setBannerUrl(b.url);
                          setCategoryId(b.category);
                        }}
                        className={`relative group overflow-hidden rounded-xl border transition-all ${
                          bannerUrl === b.url
                            ? "ring-2 ring-primary border-primary"
                            : "border-border/80 hover:opacity-90"
                        }`}
                        title={b.label}
                      >
                        <img
                          src={b.url}
                          alt={b.label}
                          className="h-14 w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-[9px] text-white font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {b.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3">
                    <FileUploadInput
                      value={bannerUrl}
                      onChange={(url) => setBannerUrl(url)}
                      label="O subir imagen de banner propia desde tu dispositivo"
                    />
                  </div>
                </div>

                {/* Topic / User Notes */}
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Instrucciones o notas clave para la IA (opcional)
                  </label>
                  <Textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Pega notas, detalles de fechas, nombres de asesores o enlaces oficiales para que la IA los use..."
                    rows={3}
                    className="rounded-xl text-xs leading-relaxed"
                  />
                </div>

                {/* Continue button */}
                <Button
                  onClick={handleProceedToQuestions}
                  disabled={isLoadingQuestions}
                  className="w-full min-h-12 rounded-xl text-sm font-bold gap-2 shadow-soft"
                >
                  {isLoadingQuestions ? (
                    <>
                      <Sparkles className="size-4 animate-spin" />
                      Analizando tema y generando preguntas de precisión...
                    </>
                  ) : (
                    <>
                      Siguiente: Generar Preguntas Inteligentes
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-primary" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      Vista previa de la tarjeta
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary">
                    En Tiempo Real
                  </Badge>
                </div>

                {/* Card Item simulation */}
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
                  {bannerUrl && (
                    <div className="relative h-44 w-full overflow-hidden bg-muted">
                      <img
                        src={bannerUrl}
                        alt={cardTitle}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-sm flex items-center gap-1">
                          <Sparkles className="size-3 text-amber-400" />
                          {contentType === "sport"
                            ? "Deportes"
                            : contentType === "event"
                              ? "Evento"
                              : "Guía Oficial"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <span>
                        {schoolId === "all"
                          ? "Distrito DMPS"
                          : schools.find((s) => s.id === schoolId)?.short_name ||
                            schools.find((s) => s.id === schoolId)?.name ||
                            schoolId}
                      </span>
                      <span>•</span>
                      <span>{selectedCategoryObj?.name || "Categoría"}</span>
                    </div>

                    <h3 className="font-extrabold text-base text-foreground line-clamp-2">
                      {cardTitle || "Título de la tarjeta"}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {userNotes ||
                        "La IA generará automáticamente el contenido completo, pasos, enlaces oficiales y contactos."}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-primary border-t border-border/60">
                      <span>Leer publicación completa</span>
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    Garantía de Contenido Verídico
                  </div>
                  <p>
                    En el siguiente paso, la IA te hará preguntas específicas de DMPS para que toda
                    la información (asesores, correos @dmschools.org, plataformas) sea verídica.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PRECISION QUESTIONS */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <Card className="rounded-3xl border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <HelpCircle className="size-5 text-amber-500" />
                    Preguntas de Precisión de la IA
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Para asegurar que todo el contenido sea verídico y específico de Des Moines
                    Public Schools, responde o ajusta estas preguntas clave:
                  </CardDescription>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="rounded-xl font-bold gap-1 text-xs"
                >
                  <ArrowLeft className="size-3.5" />
                  Volver al Paso 1
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card p-4 space-y-2"
                >
                  <label className="text-xs font-extrabold text-foreground flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    {q}
                  </label>
                  <Input
                    value={answers[q] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
                    placeholder="Escribe la respuesta o deja que la IA use los datos oficiales..."
                    className="min-h-11 rounded-xl text-xs"
                  />
                </div>
              ))}

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl font-bold text-xs"
                  onClick={() => {
                    const filled: Record<string, string> = {};
                    questions.forEach((q) => {
                      if (!answers[q]) {
                        filled[q] = "Completar con directrices y asesor oficial de DMPS";
                      } else {
                        filled[q] = answers[q];
                      }
                    });
                    setAnswers(filled);
                    toast.info("Respuestas completadas con lineamientos de DMPS");
                  }}
                >
                  <Wand2 className="size-3.5 mr-1.5 text-primary" />
                  Autocompletar con estándares de DMPS
                </Button>

                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className="min-h-12 px-6 rounded-xl font-bold text-sm gap-2 shadow-soft"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="size-4 animate-spin" />
                      Generando artículo con emojis, reglas y enlaces...
                    </>
                  ) : (
                    <>
                      Generar Publicación Completa con IA
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: REVIEW & EDIT */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in">
          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold text-xs gap-1.5"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="size-3.5" />
                Editar Respuestas
              </Button>

              <div className="flex items-center rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setActiveLang("es")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeLang === "es"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground"
                  }`}
                >
                  Español (ES)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeLang === "en"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground"
                  }`}
                >
                  English (EN)
                </button>
              </div>
            </div>

            {/* Approval & Publish Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => saveAndPublishMutation.mutate("draft")}
                disabled={saveAndPublishMutation.isPending}
                className="min-h-11 rounded-xl text-xs font-bold gap-2"
              >
                <Save className="size-4" />
                Guardar como Borrador
              </Button>

              <Button
                onClick={() => saveAndPublishMutation.mutate("published")}
                disabled={saveAndPublishMutation.isPending}
                className="min-h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm gap-2 shadow-soft"
              >
                {saveAndPublishMutation.isPending ? (
                  <>
                    <Sparkles className="size-4 animate-spin" />
                    Publicando en vivo...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Aprobar y Hacer Público Ahora
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Editor */}
            <div className="lg:col-span-6 space-y-5">
              <Card className="rounded-3xl border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Editor de Contenido Generado
                  </CardTitle>
                  <CardDescription>
                    Modifica cualquier texto, emoji o enlace a tu gusto antes de publicarlo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      Título ({activeLang.toUpperCase()})
                    </label>
                    <Input
                      value={activeLang === "es" ? editTitle : editTitleEn}
                      onChange={(e) =>
                        activeLang === "es"
                          ? setEditTitle(e.target.value)
                          : setEditTitleEn(e.target.value)
                      }
                      className="min-h-11 rounded-xl font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      Resumen breve ({activeLang.toUpperCase()})
                    </label>
                    <Textarea
                      value={activeLang === "es" ? editSummary : editSummaryEn}
                      onChange={(e) =>
                        activeLang === "es"
                          ? setEditSummary(e.target.value)
                          : setEditSummaryEn(e.target.value)
                      }
                      rows={2}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      URL del Banner de la Publicación
                    </label>
                    <Input
                      value={editBannerUrl}
                      onChange={(e) => setEditBannerUrl(e.target.value)}
                      className="min-h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      Cuerpo del Contenido ({activeLang.toUpperCase()} - Formato con Emojis)
                    </label>
                    <Textarea
                      value={activeLang === "es" ? editContent : editContentEn}
                      onChange={(e) =>
                        activeLang === "es"
                          ? setEditContent(e.target.value)
                          : setEditContentEn(e.target.value)
                      }
                      rows={16}
                      className="rounded-xl font-mono text-xs leading-relaxed"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Live Public Page Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="sticky top-4">
                <Card className="rounded-3xl border-border/80 shadow-xs overflow-hidden">
                  <div className="bg-muted/40 px-5 py-3 border-b border-border/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                        Vista Previa en Vivo (Página Pública)
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {activeLang === "es" ? "Español" : "English"}
                    </Badge>
                  </div>

                  <CardContent className="p-6 space-y-6 max-h-[800px] overflow-y-auto">
                    {/* Top Banner */}
                    {editBannerUrl && (
                      <div className="overflow-hidden rounded-2xl border border-border/60 shadow-xs max-h-60">
                        <img
                          src={editBannerUrl}
                          alt={editTitle}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="size-3" />
                          Información Verificada DMPS
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">
                          {selectedCategoryObj?.name || "General"}
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                        {activeLang === "es" ? editTitle : editTitleEn}
                      </h1>

                      {(activeLang === "es" ? editSummary : editSummaryEn) && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {activeLang === "es" ? editSummary : editSummaryEn}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-border/80 pt-4">
                      {/* Render markdown content preview with exact blocks & styling */}
                      <ArticleBlocks
                        blocks={markdownToBlocks(activeLang === "es" ? editContent : editContentEn)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: APPROVED & PUBLISHED */}
      {step === 4 && publishedItem && (
        <div className="mx-auto max-w-2xl text-center space-y-6 py-8 animate-in zoom-in-95">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-foreground">
              ¡Contenido Aprobado y Publicado con Éxito!
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              La publicación ha sido guardada en la base de datos persistente y ahora está
              disponible públicamente para todas las familias y estudiantes.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold text-foreground">Publicación Guardada:</span>
              <Badge variant="outline" className="text-emerald-600 font-bold">
                En vivo
              </Badge>
            </div>
            <div className="text-base font-bold text-foreground">{editTitle}</div>
            <div className="text-xs text-muted-foreground">{editSummary}</div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to={publishedItem.url as any}>
              <Button className="min-h-11 rounded-xl px-6 font-bold gap-2 shadow-soft">
                <ExternalLink className="size-4" />
                Ver publicación en vivo
              </Button>
            </Link>

            <Button
              variant="outline"
              className="min-h-11 rounded-xl px-5 font-bold"
              onClick={() => {
                setStep(1);
                setPublishedItem(null);
                setCardTitle("");
                setUserNotes("");
                setQuestions([]);
                setAnswers({});
              }}
            >
              <Sparkles className="size-4 mr-1.5 text-primary" />
              Crear otra publicación con IA
            </Button>

            <Link to="/admin">
              <Button variant="ghost" className="min-h-11 rounded-xl px-5 font-bold">
                Volver al Panel Admin
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
