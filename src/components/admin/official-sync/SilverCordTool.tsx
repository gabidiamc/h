/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  parseSilverCordPastedText,
  formatTotalVolunteerTime,
  loadLocalSilverCordEntries,
  saveLocalSilverCordEntries,
  type ParsedVolunteerEntry,
} from "@/lib/official-sync/connectors/silver-cord.importer";
import {
  saveSilverCordConfirmedEntries,
  getStudentSilverCordRecords,
  deleteStudentSilverCordRecord,
} from "@/lib/official-sync/functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Trash2,
  Clock,
  Building,
  Award,
  Lock,
  Layers,
  Save,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export function SilverCordTool() {
  const queryClient = useQueryClient();
  const [rawText, setRawText] = useState("");
  const [parsedEntries, setParsedEntries] = useState<ParsedVolunteerEntry[]>([]);
  const [excludedIndexes, setExcludedIndexes] = useState<Set<number>>(new Set());
  const [localRecords, setLocalRecords] = useState<ParsedVolunteerEntry[]>(() =>
    loadLocalSilverCordEntries(),
  );

  // Query: Fetch saved student records from Supabase (optional online sync)
  const {
    data: savedData,
    isLoading: isLoadingSaved,
    refetch: refetchSaved,
  } = useQuery({
    queryKey: ["student_silver_cord_records"],
    queryFn: async () => {
      try {
        const res = await getStudentSilverCordRecords();
        return res;
      } catch {
        return { records: [], totalHours: 0 };
      }
    },
    retry: false,
  });

  // Mutation: Save confirmed records to Supabase and LocalStorage
  const saveMutation = useMutation({
    mutationFn: async (entries: any[]) => {
      // Always persist to local browser storage first for 100% offline-ready reliability
      const current = loadLocalSilverCordEntries();
      const updated = [...entries, ...current];
      saveLocalSilverCordEntries(updated);
      setLocalRecords(updated);

      try {
        return await saveSilverCordConfirmedEntries({ data: { entries } });
      } catch {
        return {
          savedCount: entries.length,
          totalHours: entries.reduce((sum, e) => sum + (e.hours || 0), 0),
        };
      }
    },
    onSuccess: (res) => {
      toast.success(
        `Se guardaron ${res.savedCount} registros de voluntariado (${res.totalHours} horas totales).`,
      );
      setRawText("");
      setParsedEntries([]);
      setExcludedIndexes(new Set());
      void refetchSaved();
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al guardar registros de Silver Cord.");
    },
  });

  // Mutation: Delete record
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const current = loadLocalSilverCordEntries();
      const filtered = current.filter((r) => r.id !== recordId);
      saveLocalSilverCordEntries(filtered);
      setLocalRecords(filtered);

      try {
        await deleteStudentSilverCordRecord({ data: { recordId } });
      } catch {
        // Local deletion already succeeded
      }
    },
    onSuccess: () => {
      toast.success("Registro eliminado con éxito.");
      void refetchSaved();
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al eliminar registro.");
    },
  });

  const handleParse = () => {
    if (!rawText.trim()) {
      toast.error("Por favor pega el texto copiado de Infinite Campus.");
      return;
    }

    const result = parseSilverCordPastedText(rawText);
    if (result.entries.length === 0) {
      toast.error(
        "No se detectaron registros con formato válido. Asegúrate de copiar la tabla de horas de Infinite Campus.",
      );
      return;
    }

    setParsedEntries(result.entries);
    setExcludedIndexes(new Set());
    toast.success(
      `Se analizaron ${result.entries.length} actividades locales (${result.totalHours} horas detectadas).`,
    );
  };

  const toggleExclude = (index: number) => {
    const next = new Set(excludedIndexes);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExcludedIndexes(next);
  };

  const handleSaveConfirmed = () => {
    const activeEntries = parsedEntries
      .filter((_, idx) => !excludedIndexes.has(idx))
      .map((e) => ({
        date: e.date,
        organization: e.organization,
        activityDescription: e.activityDescription,
        hours: e.hours,
        gradeLevel: e.gradeLevel,
        schoolYear: e.schoolYear,
        supervisorName: e.supervisorName,
      }));

    if (activeEntries.length === 0) {
      toast.error("No hay registros seleccionados para guardar.");
      return;
    }

    saveMutation.mutate(activeEntries);
  };

  const activeEntriesCount = parsedEntries.length - excludedIndexes.size;
  const activeHoursTotal = parsedEntries
    .filter((_, idx) => !excludedIndexes.has(idx))
    .reduce((sum, e) => sum + e.hours, 0);

  const dbRecords = savedData?.records ?? [];
  const savedRecords =
    dbRecords.length > 0
      ? dbRecords
      : localRecords.map((l) => ({
          id: l.id,
          service_date: l.date,
          location_name: l.organization,
          activity_description: l.activityDescription,
          grade: l.gradeLevel,
          total_minutes: Math.round(l.hours * 60),
        }));

  const savedTotalHours =
    dbRecords.length > 0
      ? (savedData?.totalHours ?? 0)
      : Math.round(localRecords.reduce((sum, r) => sum + r.hours, 0) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Privacy Notice Card */}
      <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 text-xs text-foreground space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-primary">
          <Lock className="h-4 w-4" /> Compromiso de Privacidad y Cero Credenciales
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Importación basada en texto copiado de Infinite Campus. La aplicación{" "}
          <strong>
            no tiene conexión directa con Infinite Campus ni almacena credenciales de estudiantes
          </strong>
          . El análisis del texto se procesa localmente en tu navegador y únicamente los registros
          estructurados que confirmes se guardan en tu cuenta personal.
        </p>
      </div>

      {/* Stats of Saved Records */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-1 shadow-xs">
          <div className="text-xs text-muted-foreground">Horas Guardadas en tu Cuenta</div>
          <div className="text-2xl font-bold text-primary flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" />
            {savedTotalHours}{" "}
            <span className="text-xs font-normal text-muted-foreground">/ 160 hrs meta</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {savedTotalHours >= 160
              ? "¡Meta de Silver Cord alcanzada!"
              : `Faltan ${Math.max(0, 160 - savedTotalHours)} horas para el reconocimiento.`}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-1 shadow-xs">
          <div className="text-xs text-muted-foreground">Registros Confirmados</div>
          <div className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            {savedRecords.length}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Actividades comunitarias verificadas
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-1 shadow-xs">
          <div className="text-xs text-muted-foreground">Progreso Silver Cord</div>
          <div className="text-2xl font-bold text-foreground">
            {Math.min(100, Math.round((savedTotalHours / 160) * 100))}%
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (savedTotalHours / 160) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Importar Nuevas Horas desde Infinite
            Campus
          </h3>
          <p className="text-xs text-muted-foreground">
            Abre Infinite Campus en otra pestaña, ve a la sección de voluntariado / Silver Cord,
            selecciona el texto o tabla de tus horas, cópialo (Ctrl+C) y pégalo abajo:
          </p>
        </div>

        <Textarea
          placeholder="Pega aquí el texto copiado de Infinite Campus... (ej: 09/15/2026 Food Bank of Iowa 4.0 11th Grade)"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={5}
          className="font-mono text-xs"
        />

        <div className="flex items-center justify-between">
          <Button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="h-9 px-4 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Procesar Texto Localmente
          </Button>

          {rawText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRawText("");
                setParsedEntries([]);
              }}
              className="text-xs text-muted-foreground"
            >
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Preview Table of Parsed Entries before saving */}
      {parsedEntries.length > 0 && (
        <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Vista Previa de Registros a Guardar (
                {activeEntriesCount} seleccionados)
              </h4>
              <p className="text-xs text-muted-foreground">
                Revisa y desmarca las actividades que no desees guardar. Total activo:{" "}
                {activeHoursTotal} horas.
              </p>
            </div>

            <Button
              onClick={handleSaveConfirmed}
              disabled={saveMutation.isPending || activeEntriesCount === 0}
              className="h-9 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saveMutation.isPending ? "Guardando..." : "Guardar en mi Cuenta"}
            </Button>
          </div>

          <div className="rounded-xl border border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-12 text-center">Incluir</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Organización / Lugar</TableHead>
                  <TableHead>Descripción de Actividad</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedEntries.map((entry, idx) => {
                  const isExcluded = excludedIndexes.has(idx);
                  return (
                    <TableRow
                      key={idx}
                      className={isExcluded ? "opacity-40 bg-muted/20" : "hover:bg-muted/30"}
                    >
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleExclude(idx)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{entry.date}</TableCell>
                      <TableCell className="font-medium text-xs text-foreground">
                        {entry.organization}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.activityDescription}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[11px]">
                          {entry.gradeLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-primary">
                        {entry.hours} hrs
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Saved Records Table in User Account */}
      <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Historial de Horas Guardadas en tu Perfil ({savedRecords.length})
            </h4>
            <p className="text-xs text-muted-foreground">
              Registros almacenados de forma segura y privada para tu seguimiento de graduación.
            </p>
          </div>
        </div>

        {savedRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            Aún no has guardado registros de Silver Cord. Pega tus horas arriba para comenzar.
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Organización</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedRecords.map((r: any) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{r.service_date}</TableCell>
                    <TableCell className="font-medium text-xs text-foreground">
                      {r.location_name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.activity_description}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[11px]">
                        {r.grade || "Secundaria"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-xs text-primary">
                      {Math.round(((r.total_minutes || 0) / 60) * 10) / 10} hrs
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(r.id)}
                        disabled={deleteMutation.isPending}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Eliminar este registro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
