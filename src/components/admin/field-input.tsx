/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Crop,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  Search,
  Check,
  RotateCcw,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImageFile } from "@/lib/image-compression";
import { ImageAdjuster } from "@/components/image-adjuster";
import { CanvaDirectImageField } from "@/components/canva-image-direct-editor";
import { CategoryIcon, CATEGORY_ICON_PRESETS } from "@/components/category-icon";

export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "date"
    | "datetime"
    | "select"
    | "url"
    | "image"
    | "icon";
  options?: { value: string; label: string }[];
  required?: boolean;
  help?: string;
};

export function CategoryIconPicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  const isCustomImage =
    value &&
    (value.startsWith("data:image/") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("blob:") ||
      value.startsWith("/"));

  const [activeTab, setActiveTab] = useState<"preset" | "custom">(() =>
    isCustomImage ? "custom" : "preset",
  );
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("Todos");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const groups = [
    "Todos",
    "Educación",
    "Transporte y Horarios",
    "Salud y Comunidad",
    "Deportes y Nutrición",
    "Tecnología y Otros",
  ];

  const filteredPresets = useMemo(() => {
    return CATEGORY_ICON_PRESETS.filter((p) => {
      if (selectedGroup !== "Todos" && p.group !== selectedGroup) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.label.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, selectedGroup]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const optimized = await compressImageFile(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.9,
      });
      onChange(optimized);
      setActiveTab("custom");
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onChange(reader.result as string);
          setActiveTab("custom");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
      {/* 1. Real-time Preview Area: Cómo quedará el icono */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-12 rounded-xl bg-card border border-border shadow-xs p-2">
            <CategoryIcon name={value || "BookOpen"} className="size-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Vista Previa en Vivo</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {isCustomImage ? "Icono Personalizado" : value || "BookOpen"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Así se mostrará el icono en las tarjetas de categorías, menús de navegación y temas
              públicos.
            </p>
          </div>
        </div>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("BookOpen")}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            <RotateCcw className="size-3.5 mr-1" />
            <span>Restablecer por defecto</span>
          </Button>
        )}
      </div>

      {/* 2. Selector Tabs: Biblioteca vs Subir */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("preset")}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "preset"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="size-3.5 text-primary" />
          <span>Menú de Iconos (Biblioteca)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("custom")}
          className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "custom"
              ? "bg-card text-foreground shadow-2xs text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="size-3.5 text-primary" />
          <span>Subir Mi Propio Icono</span>
        </button>
      </div>

      {/* TAB 1: BIBLIOTECA DE ICONOS */}
      {activeTab === "preset" && (
        <div className="space-y-3 animate-in fade-in">
          {/* Search bar & group chips */}
          <div className="relative">
            <Search className="size-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar icono por nombre o tema (ej: bus, libro, comida, salud, deporte, escuela)..."
              className="pl-8 text-xs h-9 rounded-xl"
            />
          </div>

          {/* Group filters */}
          <div className="flex flex-wrap gap-1">
            {groups.map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                  selectedGroup === grp
                    ? "bg-primary text-white border-primary"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                {grp}
              </button>
            ))}
          </div>

          {/* Grid of icons */}
          <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 border border-border/60 rounded-xl bg-muted/20">
            {filteredPresets.map((preset) => {
              const isSelected = value === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onChange(preset.name)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-start transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs ring-1 ring-primary/40"
                      : "border-border/60 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className="size-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                    <CategoryIcon
                      name={preset.name}
                      className={`size-4.5 ${isSelected ? "text-primary" : "text-foreground"}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold truncate leading-tight">{preset.label}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{preset.name}</p>
                  </div>
                  {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SUBIR ICONO PERSONALIZADO */}
      {activeTab === "custom" && (
        <div className="space-y-3.5 p-3.5 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.svg"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto h-10 gap-2 rounded-xl text-xs font-bold border-primary/30 text-primary hover:bg-primary/10"
            >
              <Upload className="size-4" />
              <span>
                {isUploading
                  ? "Optimizando icono..."
                  : "Elegir icono desde mi dispositivo (PNG, SVG, etc.)"}
              </span>
            </Button>
            <span className="text-[11px] text-muted-foreground">
              o pega el enlace directo del icono:
            </span>
          </div>

          <div className="flex gap-2">
            <Input
              id={id}
              placeholder="https://... o data:image/png;base64,..."
              value={isCustomImage ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 rounded-xl text-xs flex-1 bg-card"
            />
            {isCustomImage && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange("BookOpen")}
                className="size-9 rounded-xl text-destructive hover:bg-destructive/10"
                title="Eliminar icono personalizado"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>

          {isCustomImage && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border/80">
              <div className="size-12 rounded-lg bg-muted/40 border border-border flex items-center justify-center p-1 overflow-hidden shrink-0">
                <img src={value} alt="Icono personalizado" className="size-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">Icono Personalizado Activo</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Se escalará de forma nítida en la barra superior, temas y tarjetas.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: any;
  onChange: (v: any) => void;
}) {
  const id = `f-${field.name}`;
  const type = field.type ?? (field.name === "icon" ? "icon" : "text");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<"classic" | "canva">("classic");

  if (type === "checkbox") {
    return (
      <label className="flex min-h-11 items-center gap-3 font-medium cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-5 rounded border-border text-primary focus:ring-primary"
        />
        {field.label}
      </label>
    );
  }

  if (type === "icon" || field.name === "icon") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-xs font-bold text-foreground block">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <CategoryIconPicker
          id={id}
          value={String(value || "")}
          onChange={(newVal) => onChange(newVal)}
        />
        {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !file.type.startsWith("image/") &&
      !file.type.includes("pdf") &&
      !file.name.endsWith(".pdf")
    ) {
      setUploadError("Por favor seleccione un archivo válido (PNG, JPG, PDF, SVG, WebP, etc.).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError("El archivo es demasiado grande. Seleccione un archivo menor a 20MB.");
      return;
    }

    setIsUploading(true);
    try {
      const optimizedUrl = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.82,
        mimeType: "image/jpeg",
      });
      onChange(optimizedUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) onChange(result);
      };
      reader.onerror = () => {
        setUploadError("Error al leer el archivo. Intente nuevamente.");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const files = Array.from(clipboardData.files || []);
    const imgFile = files.find((f) => f.type.startsWith("image/"));
    if (imgFile) {
      e.preventDefault();
      try {
        setIsUploading(true);
        const optimized = await compressImageFile(imgFile, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.85,
        });
        onChange(optimized);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) onChange(reader.result as string);
        };
        reader.readAsDataURL(imgFile);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    const items = Array.from(clipboardData.items || []);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          try {
            setIsUploading(true);
            const optimized = await compressImageFile(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.85,
            });
            onChange(optimized);
          } catch {
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
          } finally {
            setIsUploading(false);
          }
          return;
        }
      }
    }

    const text = clipboardData.getData("text/plain")?.trim();
    if (
      text &&
      (text.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(text) ||
        (text.startsWith("http") &&
          (text.includes("images.unsplash.com") ||
            text.includes("cloudinary.com") ||
            text.includes("imgur.com"))))
    ) {
      e.preventDefault();
      onChange(text);
    }
  };

  if (type === "image" && editorMode === "canva") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={id}
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <Sparkles className="size-4 text-primary" />
            <span>{field.label} (Modo Canva Activo)</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditorMode("classic")}
            className="h-7 text-xs font-semibold rounded-lg text-foreground hover:bg-muted"
          >
            ← Volver a Subida Clásica
          </Button>
        </div>
        <CanvaDirectImageField
          id={id}
          label={field.label}
          value={typeof value === "string" ? value : null}
          onChange={(v) => onChange(v)}
        />
      </div>
    );
  }

  if (type === "url" || type === "image") {
    const isPdf =
      typeof value === "string" &&
      (value.includes("application/pdf") || value.toLowerCase().endsWith(".pdf"));

    return (
      <div onPaste={handlePaste} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm font-semibold text-foreground">
            {field.label}
          </Label>

          {type === "image" && (
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setEditorMode("classic")}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  editorMode === "classic"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📁 Subida Clásica
              </button>
              <button
                type="button"
                onClick={() => setEditorMode("canva")}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  editorMode === "canva"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-primary hover:text-primary/80"
                }`}
              >
                <Sparkles className="size-3" />
                <span>Canva (Extra)</span>
              </button>
            </div>
          )}
        </div>

        {value ? (
          <div className="relative flex items-center gap-4 p-3 rounded-2xl border border-border bg-card/60 shadow-xs">
            <div className="relative size-16 shrink-0 rounded-xl border border-border/80 bg-muted/40 p-1 flex items-center justify-center overflow-hidden">
              {isPdf ? (
                <span className="text-2xl">📄</span>
              ) : (
                <img
                  src={String(value)}
                  alt={field.label}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {isPdf ? "Documento PDF cargado" : "Archivo cargado"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate font-mono">
                {String(value).startsWith("data:") ? "Archivo local (Data URL)" : String(value)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!isPdf && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdjusterOpen(true)}
                    className="h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
                    title="Ajustar imagen en ventana flotante (Sistema anterior)"
                  >
                    <Crop className="size-3.5" />
                    <span className="hidden sm:inline">Ajustar (Clásico)</span>
                  </Button>
                  {type === "image" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditorMode("canva")}
                      className="h-8 rounded-xl px-2.5 gap-1.5 text-xs font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/15"
                      title="Editar visualmente con Canva (Extra)"
                    >
                      <Sparkles className="size-3.5" />
                      <span className="hidden sm:inline">Modo Canva</span>
                    </Button>
                  )}
                </>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(null)}
                className="h-8 rounded-xl px-2.5 gap-1 text-xs"
                title="Quitar archivo"
              >
                <Trash2 className="size-3.5" />
                <span className="hidden sm:inline">Quitar</span>
              </Button>
            </div>

            {/* Canvas Image Adjuster Dialog */}
            {!isPdf && isAdjusterOpen && (
              <ImageAdjuster
                isOpen={isAdjusterOpen}
                onClose={() => setIsAdjusterOpen(false)}
                imageUrl={String(value)}
                onSave={(newVal) => {
                  onChange(newVal);
                  setIsAdjusterOpen(false);
                }}
                title={`Ajustar imagen: ${field.label}`}
                defaultAspectRatio="original"
                saveLabel="Guardar y Aplicar al Recurso"
              />
            )}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-11 rounded-xl font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/5 shrink-0"
            disabled={isUploading}
          >
            <Upload className="size-4" />
            <span>{isUploading ? "Cargando..." : "Subir desde dispositivo"}</span>
          </Button>

          <Input
            id={id}
            type="text"
            placeholder="o pega una URL directa de imagen o presiona Ctrl+V..."
            value={value ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              onChange(raw === "" ? null : raw);
            }}
            className="min-h-11 rounded-xl text-sm flex-1"
          />
        </div>

        {uploadError ? <p className="text-xs font-medium text-destructive">{uploadError}</p> : null}
        {field.help ? (
          <p className="text-xs text-muted-foreground">{field.help}</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            💡 Puedes subir un archivo, escribir una URL o simplemente copiar una foto y pegarla con{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold border border-border">
              Ctrl+V
            </kbd>
            .
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-foreground">
        {field.label}
      </Label>
      {type === "textarea" ? (
        <Textarea
          id={id}
          value={value ?? ""}
          required={field.required ?? false}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-24 rounded-xl text-base"
        />
      ) : type === "select" ? (
        <select
          id={id}
          value={value ?? ""}
          required={field.required ?? false}
          onChange={(e) => onChange(e.target.value || null)}
          className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-base"
        >
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={
            type === "number"
              ? "number"
              : type === "date"
                ? "date"
                : type === "datetime"
                  ? "datetime-local"
                  : "text"
          }
          value={type === "datetime" ? toLocalDatetime(value) : (value ?? "")}
          required={field.required ?? false}
          onChange={(e) => {
            const raw = e.target.value;
            if (type === "number") onChange(raw === "" ? null : Number(raw));
            else if (type === "datetime") onChange(raw ? new Date(raw).toISOString() : null);
            else onChange(raw === "" ? null : raw);
          }}
          className="min-h-11 rounded-xl text-base"
        />
      )}
      {field.help ? <p className="text-xs text-muted-foreground">{field.help}</p> : null}
    </div>
  );
}

function toLocalDatetime(value: any) {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
