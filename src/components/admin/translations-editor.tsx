/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldInput, type Field } from "@/components/admin/field-input";
import { supabase } from "@/integrations/supabase/client";
import { upsertRow } from "@/lib/admin";
import { notifyContentUpdated } from "@/lib/sync";
import { translateToEnglish, translateToKaren, autoTranslateBlocks } from "@/lib/auto-translator";
import { Sparkles } from "lucide-react";

export const LANGS = [
  { code: "es", label: "Español (Principal)", native: "Español" },
  { code: "en", label: "Inglés (English)", native: "English" },
  { code: "ksw", label: "S'gaw Karen (ကညီကျိာ်)", native: "ကညီကျိာ်" },
];

export function TranslationsEditor({
  table,
  fkColumn,
  parentId,
  fields,
  onEsChange,
}: {
  table: string;
  fkColumn: string;
  parentId: string;
  fields: Field[];
  onEsChange?: (esFields: Record<string, any>) => void;
}) {
  const queryClient = useQueryClient();
  const [lang, setLang] = useState("es");
  const key = ["admin", table, parentId];

  const rows = useQuery({
    queryKey: key,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from(table)
          .select("*")
          .eq(fkColumn, parentId);
        if (!error && Array.isArray(data)) {
          const sorted = [...data].sort((a, b) =>
            String(b.updated_at || "").localeCompare(String(a.updated_at || "")),
          );
          return sorted;
        }
      } catch (err) {
        console.warn(`[Translations read error for ${table}]:`, err);
      }
      return [];
    },
  });

  const existing = (rows.data ?? []).find((r) => r["language_code"] === lang);
  const current =
    existing ??
    ({
      [fkColumn]: parentId,
      language_code: lang,
    } as any);

  const [draft, setDraft] = useState<any | null>(null);
  const value = draft && draft["language_code"] === lang ? draft : current;

  const save = useMutation({
    mutationFn: async (payload: any) => {
      const cleanFields: Record<string, any> = {};
      for (const f of fields) {
        if (payload[f.name] !== undefined) {
          cleanFields[f.name] = payload[f.name];
        }
      }
      const body = {
        id: existing?.["id"] || `tr_${parentId}_${lang}`,
        [fkColumn]: parentId,
        language_code: lang,
        ...cleanFields,
        updated_at: new Date().toISOString(),
      };

      await upsertRow(table, body);
      if (lang === "es" && onEsChange) {
        onEsChange(cleanFields);
      }
      notifyContentUpdated(table);
    },
    onSuccess: () => {
      toast.success("✓ Traducción guardada y sincronizada en Supabase");
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al guardar traducción");
    },
  });

  const handleAutoTranslate = () => {
    const esRow = (rows.data ?? []).find((r) => r["language_code"] === "es") || {};
    const updatedDraft = { ...value, language_code: lang };

    fields.forEach((f) => {
      const esVal = esRow[f.name];
      if (typeof esVal === "string" && esVal.trim()) {
        if (lang === "en") {
          updatedDraft[f.name] = translateToEnglish(esVal);
        } else if (lang === "ksw") {
          updatedDraft[f.name] = translateToKaren(esVal);
        }
      } else if (Array.isArray(esVal)) {
        if (lang === "en") {
          updatedDraft[f.name] = autoTranslateBlocks(esVal).en;
        } else if (lang === "ksw") {
          updatedDraft[f.name] = autoTranslateBlocks(esVal).ksw;
        }
      }
    });

    setDraft(updatedDraft);
    toast.success(
      `Traducción automática generada para ${lang === "en" ? "Inglés" : "S'gaw Karen"}.`,
    );
  };

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Textos por idioma</h3>
        {lang !== "es" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAutoTranslate}
            className="gap-1.5 text-xs font-semibold"
          >
            <Sparkles className="size-3.5 text-amber-500" />
            Auto-Traducir desde Español
          </Button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <Button
            key={l.code}
            type="button"
            variant={lang === l.code ? "default" : "outline"}
            className="min-h-11 rounded-xl"
            onClick={() => {
              setDraft(null);
              setLang(l.code);
            }}
          >
            {l.label}
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Estado de la traducción:</span>
            <select
              className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium"
              value={value?.["translation_status"] || "draft"}
              onChange={(e) =>
                setDraft({
                  ...value,
                  language_code: lang,
                  translation_status: e.target.value,
                  reviewed_at:
                    e.target.value === "approved"
                      ? new Date().toISOString()
                      : value?.["reviewed_at"],
                })
              }
            >
              <option value="draft">Borrador (Draft)</option>
              <option value="needs_review">Necesita revisión (Needs Review)</option>
              <option value="approved">Aprobada y Verificada (Approved)</option>
            </select>
          </div>
          {lang === "ksw" && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠️ Nota: La traducción en S'gaw Karen debe ser revisada manualmente por personal
              competente antes de marcarse como aprobada.
            </p>
          )}
        </div>

        {fields.map((f) => (
          <FieldInput
            key={f.name}
            field={f}
            value={value?.[f.name]}
            onChange={(v) => setDraft({ ...value, language_code: lang, [f.name]: v })}
          />
        ))}
        <Button
          type="button"
          disabled={save.isPending}
          className="min-h-11 rounded-xl"
          onClick={() => save.mutate(value)}
        >
          {save.isPending ? "Guardando…" : "Guardar traducción"}
        </Button>
      </div>
    </div>
  );
}
