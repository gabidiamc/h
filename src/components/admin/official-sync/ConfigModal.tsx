import { useState, useEffect } from "react";
import { X, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfficialSourceRecord, AutomationMode } from "@/lib/official-sync/types";

interface ConfigModalProps {
  source: OfficialSourceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: {
    sourceId: string;
    automationMode: AutomationMode;
    updateFrequencyMinutes: number;
    requiresReview: boolean;
    isEnabled: boolean;
    notes?: string;
  }) => Promise<void>;
}

export function ConfigModal({ source, isOpen, onClose, onSave }: ConfigModalProps) {
  const [mode, setMode] = useState<AutomationMode>("semi_automatic");
  const [frequency, setFrequency] = useState<number>(360);
  const [requiresReview, setRequiresReview] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (source) {
      setMode(source.automation_mode || "semi_automatic");
      setFrequency(source.update_frequency_minutes || 360);
      setRequiresReview(source.requires_review || false);
      setIsEnabled(source.is_enabled !== false);
      setNotes(source.notes || "");
    }
  }, [source]);

  if (!isOpen || !source) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        sourceId: source.id,
        automationMode: mode,
        updateFrequencyMinutes: Number(frequency),
        requiresReview,
        isEnabled,
        notes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              Configuración de Fuente Oficial
            </span>
            <h3 className="text-base font-bold text-foreground mt-0.5">{source.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Automation Mode */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Modo de Automatización</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as AutomationMode)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="automatic">
                Automático — Solo para fuentes con API/Feed oficial estructurado
              </option>
              <option value="semi_automatic">
                Semiautomático — Obtención periódica con revisión recomendada
              </option>
              <option value="manual">
                Manual — Requiere vista previa y confirmación explícita
              </option>
              <option value="disabled">Deshabilitado — Pausar toda sincronización</option>
            </select>
          </div>

          {/* Update Frequency */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Frecuencia de Comprobación</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={30}>Cada 30 minutos (Alertas de emergencia y noticias)</option>
              <option value={360}>Cada 6 horas (Calendarios escolares)</option>
              <option value={720}>Cada 12 horas (Menús de nutrición / deportes)</option>
              <option value={1440}>Cada 24 horas (Contactos y programas)</option>
              <option value={10080}>Cada semana (Documentos oficiales y políticas)</option>
            </select>
          </div>

          {/* Review Requirement Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/30 p-3">
            <div>
              <p className="font-bold text-foreground">Revisión administrativa obligatoria</p>
              <p className="text-[11px] text-muted-foreground">
                Si está activada, ningún cambio detectado se publicará automáticamente sin
                aprobación del personal.
              </p>
            </div>
            <input
              type="checkbox"
              checked={requiresReview}
              onChange={(e) => setRequiresReview(e.target.checked)}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          {/* Enabled Status */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/30 p-3">
            <div>
              <p className="font-bold text-foreground">Fuente habilitada</p>
              <p className="text-[11px] text-muted-foreground">
                Permite que el motor consulte esta fuente periódicamente.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">Notas administrativas</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre la fuente oficial o instrucciones para el personal..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="rounded-xl bg-primary text-primary-foreground font-bold text-xs gap-1.5"
            >
              <Save className="size-3.5" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
