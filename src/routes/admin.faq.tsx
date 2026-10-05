/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Save,
  Search,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  School,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchFaqs, type FaqRow } from "@/lib/content";
import { useSchool } from "@/lib/school";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { notifyContentUpdated } from "@/lib/sync";

export const Route = createFileRoute("/admin/faq")({
  head: () => ({
    meta: [
      { title: "Gestión de Preguntas Frecuentes — Administración DMPS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminFaqPage,
});

export default function AdminFaqPage() {
  const queryClient = useQueryClient();
  const { adminSchoolFilter, schools } = useSchool();
  const [schoolFilter, setSchoolFilter] = useState<string>(adminSchoolFilter || "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState("");
  const [order, setOrder] = useState(1);
  const [questionEs, setQuestionEs] = useState("");
  const [answerEs, setAnswerEs] = useState("");
  const [questionEn, setQuestionEn] = useState("");
  const [answerEn, setAnswerEn] = useState("");
  const [faqSchoolId, setFaqSchoolId] = useState("all");

  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  const saveFaqsState = useCallback(
    async (list: FaqRow[]) => {
      const rawFaqs = list.map((item) => ({
        id: item.id,
        display_order: item.display_order,
        category_id: item.category_id,
        school_id: item.school_id || "all",
        status: "published",
      }));

      const rawTranslations: Record<string, unknown>[] = [];
      list.forEach((item) => {
        item.faq_translations.forEach((tr) => {
          rawTranslations.push({
            id: `${item.id}-${tr.language_code}`,
            faq_id: item.id,
            language_code: tr.language_code,
            question: tr.question,
            answer: tr.answer,
          });
        });
      });

      if (isSupabaseConfigured()) {
        try {
          const { error: err1 } = await supabase
            .from("faqs")
            .upsert(rawFaqs as any, { onConflict: "id" });
          if (err1) {
            console.error("Error upserting faqs:", err1);
            throw err1;
          }

          const { error: err2 } = await supabase
            .from("faq_translations")
            .upsert(rawTranslations as any, { onConflict: "id" });
          if (err2) {
            console.error("Error upserting faq_translations:", err2);
            throw err2;
          }
        } catch (e: any) {
          console.error("Exception saving faqs to Supabase:", e);
          toast.error(`Error guardando en Supabase: ${e?.message || "Desconocido"}`);
          return;
        }
      }

      notifyContentUpdated("faqs");
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    [queryClient],
  );

  const loadCurrentFaqs = useCallback(async () => {
    try {
      const items = await fetchFaqs();
      setFaqs(items ?? []);
    } catch {
      setFaqs([]);
    }
  }, []);

  useEffect(() => {
    loadCurrentFaqs();
  }, [loadCurrentFaqs]);

  const filteredFaqs = faqs.filter((f) => {
    const school = f.school_id || "all";
    if (schoolFilter !== "all" && school !== "all" && school !== schoolFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const qEs = f.faq_translations.find((t) => t.language_code === "es")?.question || "";
      const aEs = f.faq_translations.find((t) => t.language_code === "es")?.answer || "";
      const qEn = f.faq_translations.find((t) => t.language_code === "en")?.question || "";
      const aEn = f.faq_translations.find((t) => t.language_code === "en")?.answer || "";
      if (
        !qEs.toLowerCase().includes(q) &&
        !aEs.toLowerCase().includes(q) &&
        !qEn.toLowerCase().includes(q) &&
        !aEn.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const handleOpenNew = () => {
    setEditingId(`faq-${Date.now()}`);
    setOrder(faqs.length + 1);
    setQuestionEs("");
    setAnswerEs("");
    setQuestionEn("");
    setAnswerEn("");
    setFaqSchoolId(schoolFilter !== "all" ? schoolFilter : "all");
    setIsNew(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (f: FaqRow) => {
    setEditingId(f.id);
    setOrder(f.display_order);
    const es = f.faq_translations.find((t) => t.language_code === "es");
    const en = f.faq_translations.find((t) => t.language_code === "en");
    setQuestionEs(es?.question || "");
    setAnswerEs(es?.answer || "");
    setQuestionEn(en?.question || "");
    setAnswerEn(en?.answer || "");
    setFaqSchoolId(f.school_id || "all");
    setIsNew(false);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, question: string) => {
    if (!window.confirm(`¿Deseas eliminar la pregunta frecuente: "${question}"?`)) return;
    if (isSupabaseConfigured()) {
      try {
        await supabase.from("faq_translations").delete().eq("faq_id", id);
        const { error } = await supabase.from("faqs").delete().eq("id", id);
        if (error) throw error;
      } catch (e: any) {
        console.error("Error deleting FAQ from Supabase:", e);
        toast.error(`Error eliminando de Supabase: ${e?.message || "Desconocido"}`);
        return;
      }
    }
    const updated = faqs.filter((f) => f.id !== id);
    setFaqs(updated);
    notifyContentUpdated("faqs");
    queryClient.invalidateQueries({ queryKey: ["faqs"] });
    toast.success("Pregunta eliminada correctamente.");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionEs.trim() || !answerEs.trim()) {
      toast.error("Por favor ingresa la pregunta y respuesta en español.");
      return;
    }

    const updatedRow: FaqRow = {
      id: editingId,
      display_order: order,
      category_id: null,
      school_id: faqSchoolId,
      faq_translations: [
        {
          language_code: "es",
          question: questionEs.trim(),
          answer: answerEs.trim(),
        },
        {
          language_code: "en",
          question: questionEn.trim() || questionEs.trim(),
          answer: answerEn.trim() || answerEs.trim(),
        },
      ],
    };

    let updated: FaqRow[];
    if (isNew) {
      updated = [...faqs, updatedRow];
    } else {
      updated = faqs.map((f) => (f.id === editingId ? updatedRow : f));
    }

    // Sort by display_order
    updated.sort((a, b) => a.display_order - b.display_order);

    setFaqs(updated);
    saveFaqsState(updated);
    setIsDialogOpen(false);
    toast.success(
      isNew ? "¡Pregunta frecuente creada con éxito!" : "¡Pregunta actualizada con éxito!",
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HelpCircle className="size-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Preguntas Frecuentes (FAQ)
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona las respuestas oficiales a dudas habituales sobre horarios, transporte,
            asistencia y servicios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl">
            <Link to="/faq" target="_blank" rel="noopener noreferrer">
              <span>Ver Página Pública</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>

          <Button onClick={handleOpenNew} size="sm" className="gap-2 rounded-xl font-bold">
            <Plus className="size-4" />
            <span>Nueva Pregunta</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <Card className="rounded-2xl border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en preguntas y respuestas..."
              className="pl-9 rounded-xl text-sm"
            />
          </div>

          <Select value={schoolFilter} onValueChange={setSchoolFilter}>
            <SelectTrigger className="w-full sm:w-[200px] rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Escuela" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todas las escuelas</SelectItem>
              {schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.short_name || s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => {
          const es = faq.faq_translations.find((t) => t.language_code === "es");
          const en = faq.faq_translations.find((t) => t.language_code === "en");
          const school = faq.school_id || "all";

          return (
            <Card
              key={faq.id}
              className="rounded-2xl border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                      #{faq.display_order || index + 1}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase rounded-md">
                      {school === "all"
                        ? "Distrito / Todas"
                        : schools.find((s) => s.id === school)?.short_name ||
                          schools.find((s) => s.id === school)?.name ||
                          school}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {es?.question || "Sin pregunta"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {es?.answer || "Sin respuesta"}
                  </p>

                  {en?.question && (
                    <div className="mt-2 rounded-xl bg-muted/30 p-2.5 text-xs text-muted-foreground border border-border/50">
                      <span className="font-bold text-foreground">EN: </span>
                      <span className="font-semibold text-foreground/90">{en.question}</span> —{" "}
                      {en.answer}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(faq)}
                    className="rounded-xl h-8 text-xs font-semibold gap-1.5 w-full sm:w-auto"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Editar</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(faq.id, es?.question || "")}
                    className="rounded-xl h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold w-full sm:w-auto"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isNew ? "Nueva Pregunta Frecuente" : "Editar Pregunta Frecuente"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define la pregunta y respuesta clara para las familias.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Orden de Aparición</Label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                  min={1}
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Escuela Dirigida</Label>
                <Select value={faqSchoolId} onValueChange={setFaqSchoolId}>
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas las escuelas (Distrito)</SelectItem>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Spanish */}
            <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border">
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                Contenido en Español (Principal)
              </span>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pregunta *</Label>
                <Input
                  value={questionEs}
                  onChange={(e) => setQuestionEs(e.target.value)}
                  placeholder="Ej. ¿A qué hora inician las clases?"
                  required
                  className="rounded-xl text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Respuesta Completa *</Label>
                <Textarea
                  value={answerEs}
                  onChange={(e) => setAnswerEs(e.target.value)}
                  rows={4}
                  placeholder="Redacta la respuesta clara con detalles, teléfonos y enlaces..."
                  required
                  className="rounded-xl text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* English */}
            <div className="space-y-3 rounded-2xl bg-muted/40 p-3.5 border border-border">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Contenido en Inglés (English)
              </span>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Question</Label>
                <Input
                  value={questionEn}
                  onChange={(e) => setQuestionEn(e.target.value)}
                  placeholder="E.g. What time does school start?"
                  className="rounded-xl text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Answer</Label>
                <Textarea
                  value={answerEn}
                  onChange={(e) => setAnswerEn(e.target.value)}
                  rows={3}
                  placeholder="English answer explanation..."
                  className="rounded-xl text-sm leading-relaxed"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl font-bold gap-2">
                <Save className="size-4" />
                <span>Guardar y Publicar</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
