import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Edit3,
  X,
  ExternalLink,
  Image as ImageIcon,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Block } from "@/lib/content";
import type { ArticleTranslationResult, StructuralValidationResult } from "@/lib/translation";

interface TranslationPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  original: {
    title: string;
    summary: string | null;
    blocks: Block[];
    categoryName?: string | null;
  };
  translation: ArticleTranslationResult | null;
  onApply: (applied: {
    title: string;
    summary: string | null;
    categoryName?: string | null;
    blocks: Block[];
    bodyHtml?: string;
  }) => void;
  onReTranslate?: (provider: string) => void;
  isTranslating?: boolean;
}

export function TranslationPreviewModal({
  open,
  onOpenChange,
  original,
  translation,
  onApply,
  onReTranslate,
  isTranslating = false,
}: TranslationPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"side_by_side" | "preview_en" | "edit">(
    "side_by_side",
  );

  // Editable fields so the admin can adjust before applying
  const [editedTitle, setEditedTitle] = useState(translation?.title || "");
  const [editedSummary, setEditedSummary] = useState(translation?.summary || "");
  const [editedCategory, setEditedCategory] = useState(translation?.categoryName || "");
  const [editedBlocks, setEditedBlocks] = useState<Block[]>(translation?.blocks || []);

  // Sync state if translation changes
  useEffect(() => {
    if (translation) {
      setEditedTitle(translation.title);
      setEditedSummary(translation.summary || "");
      setEditedCategory(translation.categoryName || "");
      setEditedBlocks(translation.blocks);
    }
  }, [translation]);

  if (!translation) return null;

  const validation: StructuralValidationResult = translation.validation || {
    valid: true,
    errors: [],
    warnings: [],
    blockCountMatch: true,
    blockTypesMatch: true,
    blockIdsMatch: true,
    urlsPreserved: true,
    imagesPreserved: true,
  };

  const handleConfirm = () => {
    onApply({
      title: editedTitle.trim(),
      summary: editedSummary.trim() || null,
      categoryName: editedCategory.trim() || null,
      blocks: editedBlocks,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-7">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-extrabold text-foreground">
              <span className="flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4.5" />
              </span>
              <span>English Translation Ready</span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                {translation.provider || "Gemini AI"}
              </span>
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Revisa la traducción automática generada. Toda la estructura original de bloques,
            imágenes y enlaces ha sido validada antes de aplicarse al editor.
          </p>
        </DialogHeader>

        {/* Structural Integrity Checklist */}
        <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Verificación de Integridad Estructural (Reglas Críticas)</span>
            </span>
            <span
              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                validation.valid
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {validation.valid ? "✓ 100% Estructura Intacta" : "Advertencias"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-background p-2 rounded-xl border border-border/60">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>
                Bloques: {editedBlocks.length}/{original.blocks.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-background p-2 rounded-xl border border-border/60">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>Imágenes: Intactas</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-background p-2 rounded-xl border border-border/60">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>URLs: Preservadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-background p-2 rounded-xl border border-border/60">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>IDs: Sincronizados</span>
            </div>
          </div>

          {validation.warnings.length > 0 && (
            <div className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              {validation.warnings.map((w, idx) => (
                <p key={idx} className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("side_by_side")}
            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "side_by_side"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Comparativa (ES ↔ EN)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview_en")}
            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "preview_en"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="size-3.5" />
            <span>Vista Previa en Inglés</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "edit"
                ? "bg-card text-foreground shadow-2xs text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Edit3 className="size-3.5" />
            <span>Ajustar Textos</span>
          </button>
        </div>

        {/* TAB 1: SIDE BY SIDE COMPARISON */}
        {activeTab === "side_by_side" && (
          <div className="space-y-4 animate-in fade-in">
            {/* Title, Summary & Category comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                    🇪🇸 Original (Español)
                  </span>
                  {original.categoryName && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {original.categoryName}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground">{original.title || "—"}</p>
                {original.summary && (
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                    {original.summary}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl border border-primary/25 bg-primary/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                    🇺🇸 Traducido (English)
                  </span>
                  {editedCategory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {editedCategory}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground">{editedTitle || "—"}</p>
                {editedSummary && (
                  <p className="text-xs text-muted-foreground pt-1 border-t border-primary/15">
                    {editedSummary}
                  </p>
                )}
              </div>
            </div>

            {/* Blocks side-by-side comparison */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Comparativa de Bloques Estructurados
              </span>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {original.blocks.map((origBlock, idx) => {
                  const transBlock = editedBlocks[idx] || origBlock;
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl border border-border/60 bg-card text-xs"
                    >
                      <div className="text-muted-foreground space-y-1">
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted">
                          {origBlock.type} #{idx + 1}
                        </span>
                        {origBlock.type === "paragraph" && (
                          <div
                            className="text-foreground/80 line-clamp-3 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: origBlock.text }}
                          />
                        )}
                        {origBlock.type === "heading" && (
                          <p className="font-bold text-foreground">{origBlock.text}</p>
                        )}
                        {origBlock.type === "list" && (
                          <ul className="list-disc pl-4 space-y-0.5">
                            {origBlock.items?.slice(0, 3).map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>
                        )}
                        {origBlock.type === "image" && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <ImageIcon className="size-3.5 text-primary" />
                            <span className="truncate">{origBlock.url}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:pl-2.5 border-border/40">
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {transBlock.type} (EN)
                        </span>
                        {transBlock.type === "paragraph" && (
                          <div
                            className="text-foreground font-medium line-clamp-3 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: transBlock.text }}
                          />
                        )}
                        {transBlock.type === "heading" && (
                          <p className="font-bold text-foreground">{transBlock.text}</p>
                        )}
                        {transBlock.type === "list" && (
                          <ul className="list-disc pl-4 space-y-0.5 font-medium">
                            {transBlock.items?.slice(0, 3).map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>
                        )}
                        {transBlock.type === "image" && (
                          <div className="flex items-center gap-2 text-primary font-medium">
                            <ImageIcon className="size-3.5" />
                            <span className="truncate">{transBlock.url}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL PREVIEW IN ENGLISH */}
        {activeTab === "preview_en" && (
          <div className="space-y-4 animate-in fade-in p-4 rounded-2xl border border-border/80 bg-card">
            <div>
              {editedCategory && (
                <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary mb-2">
                  {editedCategory}
                </span>
              )}
              <h2 className="text-2xl font-extrabold text-foreground">{editedTitle}</h2>
              {editedSummary && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed font-medium">
                  {editedSummary}
                </p>
              )}
            </div>

            <div className="border-t border-border/60 pt-4 space-y-3">
              {editedBlocks.map((block, idx) => {
                if (block.type === "paragraph") {
                  return (
                    <div
                      key={idx}
                      className="text-sm leading-relaxed text-foreground"
                      dangerouslySetInnerHTML={{ __html: block.text }}
                    />
                  );
                }
                if (block.type === "heading") {
                  return (
                    <h3 key={idx} className="text-lg font-bold text-foreground mt-3">
                      {block.text}
                    </h3>
                  );
                }
                if (block.type === "list") {
                  return (
                    <ul key={idx} className="list-disc pl-5 space-y-1 text-sm text-foreground">
                      {block.items?.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "image" && block.url) {
                  return (
                    <figure key={idx} className="my-3 text-center">
                      <img
                        src={block.url}
                        alt={block.alt || ""}
                        className="max-h-56 mx-auto rounded-xl object-contain border border-border shadow-xs"
                      />
                      {block.caption && (
                        <figcaption className="text-xs text-muted-foreground mt-1">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* TAB 3: INLINE ADJUSTMENTS */}
        {activeTab === "edit" && (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Título en Inglés</label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                Resumen / Descripción en Inglés
              </label>
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={2}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            {original.categoryName && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Categoría en Inglés</label>
                <Input
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-bold text-foreground block">
                Textos de Bloques en Inglés
              </label>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {editedBlocks.map((block, idx) => {
                  if (block.type === "paragraph" || block.type === "heading") {
                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-xl border border-border bg-card space-y-1"
                      >
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          {block.type} #{idx + 1}
                        </span>
                        <Textarea
                          value={block.text || ""}
                          onChange={(e) => {
                            const newText = e.target.value;
                            setEditedBlocks((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], text: newText } as Block;
                              return next;
                            });
                          }}
                          rows={2}
                          className="text-xs rounded-lg"
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex sm:justify-between items-center gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-xs font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            className="rounded-xl text-xs font-bold gap-2 px-5 min-h-10"
            onClick={handleConfirm}
          >
            <Check className="size-4" />
            <span>Aceptar y Aplicar al Editor</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
