import React, { useRef, useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatBytes,
  uploadAndAssociateEpisodeMedia,
  uploadPodcastMedia,
  validatePodcastMediaFile,
  type UploadPodcastMediaResult,
} from "@/lib/podcasts";
import { toast } from "sonner";

export type PodcastImageType = "cover" | "banner" | "logo";

export interface PodcastImageUploaderProps {
  type: PodcastImageType;
  label: string;
  helperText?: string;
  podcastId: string;
  episodeId?: string;
  currentUrl?: string | null;
  currentStoragePath?: string | null;
  onChange: (result: { url: string; storagePath: string | null }) => void;
  onDelete?: () => Promise<void> | void;
  disabled?: boolean;
  disabledMessage?: string;
}

export function PodcastImageUploader({
  type,
  label,
  helperText,
  podcastId,
  episodeId,
  currentUrl = "",
  currentStoragePath = null,
  onChange,
  onDelete,
  disabled = false,
  disabledMessage,
}: PodcastImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [typedUrl, setTypedUrl] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);

  // Active display URL: local preview first, then currentUrl from props
  const effectiveUrl = localPreview || currentUrl || "";
  const hasImage = Boolean(effectiveUrl && !imageLoadError);

  useEffect(() => {
    // Reset image error state whenever effective URL changes
    setImageLoadError(false);
  }, [currentUrl, localPreview]);

  const handleFile = async (file: File) => {
    if (disabled) {
      toast.error(disabledMessage || "Subida no disponible.");
      return;
    }

    const inspection = validatePodcastMediaFile(file, "image");
    if (!inspection.valid) {
      setErrorMessage(inspection.error || "El archivo de imagen no es válido.");
      toast.error(inspection.error || "Imagen no válida.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setProgress(15);

    // Instant local object URL preview
    const previewObjUrl = URL.createObjectURL(file);
    setLocalPreview(previewObjUrl);
    setImageLoadError(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (episodeId && type === "cover") {
        // Episode cover upload with DB association
        const res = await uploadAndAssociateEpisodeMedia({
          episodeId,
          podcastId,
          role: "cover",
          file,
          previousStoragePath: currentStoragePath,
          signal: controller.signal,
          onProgress: (pct) => setProgress(pct),
        });

        setProgress(100);
        onChange({ url: res.publicUrl, storagePath: res.storagePath });
        toast.success("Portada del episodio subida a Storage correctamente.");
      } else {
        // Podcast branding: cover, banner or logo
        const res: UploadPodcastMediaResult = await uploadPodcastMedia({
          file,
          category: "image",
          podcastId,
          episodeId,
          role: type,
          assetRole: type,
          previousStoragePath: currentStoragePath,
          signal: controller.signal,
          onProgress: (pct) => setProgress(pct),
        });

        setProgress(100);
        onChange({ url: res.publicUrl, storagePath: res.storagePath });
        toast.success(
          `${label} subido a Supabase Storage con éxito (${formatBytes(inspection.sizeBytes)}).`,
        );
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string; name?: string } | null;
      if (errObj?.name === "AbortError") {
        toast.info("Subida cancelada.");
      } else {
        const msg = errObj?.message || "Error al subir la imagen.";
        setErrorMessage(msg);
        toast.error(`Error al subir imagen: ${msg}`);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || isUploading) return;
    const items = Array.from(e.clipboardData.items || []);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFile(file);
          return;
        }
      }
    }
    const text = e.clipboardData.getData("text/plain")?.trim();
    if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/"))) {
      e.preventDefault();
      onChange({ url: text, storagePath: null });
      setLocalPreview(null);
      setImageLoadError(false);
      toast.success("Enlace de imagen asignado.");
    }
  };

  const handleApplyTypedUrl = () => {
    const trimmed = typedUrl.trim();
    if (!trimmed) {
      toast.error("Ingresa una URL válida.");
      return;
    }
    onChange({ url: trimmed, storagePath: null });
    setLocalPreview(null);
    setImageLoadError(false);
    setShowUrlInput(false);
    setTypedUrl("");
    toast.success("URL de imagen aplicada.");
  };

  const handleClear = async () => {
    if (disabled) return;
    if (onDelete) {
      try {
        await onDelete();
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || "Error al eliminar";
        toast.error(msg);
      }
    }
    setLocalPreview(null);
    setImageLoadError(false);
    onChange({ url: "", storagePath: null });
    toast.info(`${label} removido.`);
  };

  // Aspect ratio helper classes
  const isBanner = type === "banner";
  const isLogo = type === "logo";

  return (
    <div
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-xl border p-4 space-y-3 transition-colors ${
        isDragging
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card"
      } ${disabled ? "opacity-75" : ""}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.svg,.gif,.avif"
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Header with Title and badges */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {isBanner ? "16:9 Panorámica" : isLogo ? "Logo / PNG" : "1:1 Cuadrada"}
          </span>
          {hasImage && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3" />
              <span>Visible</span>
            </span>
          )}
        </div>
      </div>

      {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}

      {/* Disabled warning */}
      {disabled && disabledMessage && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
          <p className="font-medium">{disabledMessage}</p>
        </div>
      )}

      {/* Live Preview Area */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-muted/20">
        {hasImage ? (
          <div
            className={`relative flex items-center justify-center overflow-hidden w-full ${
              isBanner
                ? "aspect-[16/9] max-h-52 bg-neutral-950"
                : isLogo
                  ? "h-32 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] dark:bg-[radial-gradient(#262626_1px,transparent_1px)]"
                  : "aspect-square max-h-48 mx-auto bg-neutral-900/5 dark:bg-neutral-100/5"
            }`}
          >
            <img
              src={effectiveUrl}
              alt={label}
              onError={() => setImageLoadError(true)}
              className={`size-full ${
                isLogo ? "object-contain p-4 max-h-28" : "object-cover"
              } transition-transform duration-300 hover:scale-[1.02]`}
            />

            {/* Subtle banner watermark */}
            {isBanner && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                <span className="text-[11px] font-medium flex items-center gap-1.5 opacity-90">
                  <Eye className="size-3" />
                  Vista previa de la cabecera
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => {
              if (!disabled && !isUploading) fileInputRef.current?.click();
            }}
            className={`flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:bg-muted/40 transition-colors ${
              isBanner ? "aspect-[16/9] max-h-44" : "py-8"
            }`}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2 shadow-2xs">
              <Upload className="size-6" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              Haz clic para subir o arrastra tu archivo
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              JPG, PNG, WebP o SVG (máx. 15 MB) · También puedes pegar con Ctrl+V
            </p>
          </div>
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-10 space-y-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-xs font-bold text-foreground">Subiendo a Supabase Storage...</p>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">{progress}%</span>
          </div>
        )}
      </div>

      {/* Error Callout */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error al procesar la imagen</p>
            <p className="text-[11px] opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Action Buttons & URL Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="h-8 rounded-lg text-xs font-semibold gap-1.5"
          >
            <Upload className="size-3.5 text-primary" />
            <span>{hasImage ? "Cambiar imagen" : "Subir archivo"}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlInput((v) => !v)}
            disabled={disabled || isUploading}
            className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
          >
            <LinkIcon className="size-3.5" />
            <span>{showUrlInput ? "Ocultar URL" : "Pegar URL"}</span>
          </Button>

          {effectiveUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
              className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
            >
              <a href={effectiveUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                <span>Ver original</span>
              </a>
            </Button>
          )}
        </div>

        {hasImage && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled || isUploading}
            className="h-8 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 gap-1.5"
          >
            <Trash2 className="size-3.5" />
            <span>Remover</span>
          </Button>
        )}
      </div>

      {/* URL Direct Input Bar */}
      {showUrlInput && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/60">
          <Input
            value={typedUrl}
            onChange={(e) => setTypedUrl(e.target.value)}
            placeholder="https://... pega la URL pública de la imagen"
            className="h-8 text-xs rounded-lg flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleApplyTypedUrl}
            disabled={!typedUrl.trim()}
            className="h-8 text-xs rounded-lg"
          >
            Aplicar
          </Button>
        </div>
      )}

      {/* Storage Path Indicator if present */}
      {currentStoragePath && (
        <div className="truncate rounded-md bg-muted/40 px-2 py-1 text-[10px] font-mono text-muted-foreground">
          <span className="font-semibold text-foreground mr-1">Storage:</span>
          {currentStoragePath}
        </div>
      )}
    </div>
  );
}
