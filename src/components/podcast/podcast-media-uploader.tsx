import React, { useRef, useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/lib/image-compression";
import {
  formatBytes,
  formatDurationTimestamp,
  uploadAndAssociateEpisodeMedia,
  uploadPodcastMedia,
  validatePodcastMediaFile,
  type MediaCategory,
  type MediaFileInspection,
  type PodcastEpisodeRow,
  type UploadPodcastMediaResult,
} from "@/lib/podcasts";

export type MediaLifecycleState =
  "Esperando archivo" | "Subiendo..." | "Subido" | "Error" | "Reemplazando...";

export interface PodcastMediaUploaderProps {
  label: string;
  helperText?: string;
  category: MediaCategory;
  role?: "audio" | "video" | "cover" | "banner" | "logo" | "episode_cover";
  assetRole?: "audio" | "video" | "cover" | "banner" | "logo" | "episode_cover";
  podcastId: string;
  episodeId?: string;
  currentUrl?: string | null;
  currentStoragePath?: string | null;
  currentMimeType?: string | null;
  currentSizeBytes?: number | null;
  disabled?: boolean;
  disabledMessage?: string;
  onUploaded?: (result: {
    publicUrl: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number;
    episode?: PodcastEpisodeRow;
  }) => void;
  onUrlChange?: (url: string) => void;
  onClear?: () => void;
  onDelete?: () => Promise<void> | void;
}

export function PodcastMediaUploader({
  label,
  helperText,
  category,
  role,
  assetRole,
  podcastId,
  episodeId,
  currentUrl = "",
  currentStoragePath = null,
  currentMimeType = null,
  currentSizeBytes = null,
  disabled = false,
  disabledMessage,
  onUploaded,
  onUrlChange,
  onClear,
  onDelete,
}: PodcastMediaUploaderProps) {
  const effectiveRole =
    role || assetRole || (category === "image" ? "cover" : (category as "audio" | "video"));

  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [inspection, setInspection] = useState<MediaFileInspection | null>(null);
  const [state, setState] = useState<MediaLifecycleState>(() =>
    currentStoragePath || currentUrl ? "Subido" : "Esperando archivo",
  );
  const [progress, setProgress] = useState<number>(() =>
    currentStoragePath || currentUrl ? 100 : 0,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number>(0);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  // Sync state if external currentUrl or currentStoragePath changes
  useEffect(() => {
    if (state !== "Subiendo..." && state !== "Reemplazando...") {
      if (currentStoragePath || currentUrl) {
        setState("Subido");
        setProgress(100);
      } else if (!selectedFile) {
        setState("Esperando archivo");
        setProgress(0);
      }
    }
  }, [currentStoragePath, currentUrl, selectedFile, state]);

  const acceptAttr =
    category === "audio"
      ? "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/aac,audio/webm,.mp3,.m4a,.wav,.ogg,.aac,.webm"
      : category === "video"
        ? "video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg"
        : "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

  const CategoryIconComponent =
    category === "audio" ? FileAudio : category === "video" ? FileVideo : ImageIcon;

  const currentFileName =
    selectedFile?.name ||
    (currentStoragePath ? currentStoragePath.split("/").pop() : "") ||
    (currentUrl ? currentUrl.split("/").pop()?.split("?")[0] : "") ||
    "";

  const currentType =
    inspection?.mimeType ||
    currentMimeType ||
    (category === "audio" ? "audio/mpeg" : category === "video" ? "video/mp4" : "image/webp");

  const currentSize = inspection?.sizeBytes ?? currentSizeBytes ?? 0;

  const startUploadWithFile = async (fileToUpload: File) => {
    if (disabled) {
      setState("Error");
      setErrorMessage(disabledMessage || "Subida no disponible.");
      return;
    }

    // Only audio and video require an existing episode in public.podcast_episodes.
    // Podcast branding images (cover, banner, logo) belong to the podcast and do not need an episodeId.
    if ((category === "audio" || category === "video") && !episodeId) {
      setState("Error");
      setErrorMessage(
        disabledMessage ||
          "El episodio debe guardarse primero en la base de datos antes de subir audio o video.",
      );
      return;
    }

    const info = validatePodcastMediaFile(fileToUpload, category);
    setSelectedFile(fileToUpload);
    setInspection(info);

    if (category === "image") {
      try {
        const compressed = await compressImageFile(fileToUpload, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.85,
        });
        setLocalPreviewUrl(compressed);
        onUrlChange?.(compressed);
      } catch {
        try {
          const objUrl = URL.createObjectURL(fileToUpload);
          setLocalPreviewUrl(objUrl);
        } catch {
          // ignore
        }
      }
    }

    if (!info.valid) {
      setState("Error");
      setErrorMessage(info.error || "Archivo no válido.");
      return;
    }

    const isReplacing = Boolean(currentStoragePath || currentUrl);
    setState(isReplacing ? "Reemplazando..." : "Subiendo...");
    setProgress(10);
    setErrorMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (episodeId && (role === "audio" || role === "video" || role === "cover")) {
        // Real Stage 3 integration: uploads to podcasts/{podcast_id}/episodes/{episode_id}/
        // and updates public.podcast_episodes immediately, safely cleaning old file afterwards
        const res = await uploadAndAssociateEpisodeMedia({
          episodeId,
          podcastId,
          role,
          file: fileToUpload,
          previousStoragePath: currentStoragePath,
          signal: controller.signal,
          onProgress: (pct) => setProgress(pct),
        });

        setState("Subido");
        setProgress(100);
        setDetectedDuration(res.durationSeconds);
        onUploaded?.(res);
      } else {
        // Fallback for podcast branding (cover, banner, logo)
        const res: UploadPodcastMediaResult = await uploadPodcastMedia({
          file: fileToUpload,
          category,
          podcastId,
          episodeId,
          assetRole: role,
          previousStoragePath: currentStoragePath,
          signal: controller.signal,
          onProgress: (pct) => setProgress(pct),
        });

        setState("Subido");
        setProgress(100);
        setDetectedDuration(res.durationSeconds);
        onUploaded?.(res);
      }
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string } | null;
      if (errorObj?.name === "AbortError") {
        setState(isReplacing ? "Subido" : "Esperando archivo");
        setErrorMessage(
          "Subida cancelada por el usuario. El archivo anterior se conserva intacto.",
        );
      } else {
        setState("Error");
        setErrorMessage(errorObj?.message || "Error al subir o asociar el archivo.");
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startUploadWithFile(file);
    }
    // reset input value so re-selecting same file triggers onChange
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const triggerSelectFile = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRetry = () => {
    if (selectedFile) {
      startUploadWithFile(selectedFile);
    } else {
      triggerSelectFile();
    }
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete();
      } else if (onClear) {
        onClear();
      }
      setSelectedFile(null);
      setInspection(null);
      setErrorMessage(null);
      setState("Esperando archivo");
      setProgress(0);
    } catch (err: unknown) {
      const errorObj = err as { message?: string } | null;
      setErrorMessage(errorObj?.message || "No se pudo eliminar el archivo.");
    }
  };

  const badgeStyle: Record<MediaLifecycleState, string> = {
    "Esperando archivo": "bg-muted text-muted-foreground border-border",
    "Subiendo...": "bg-primary/10 text-primary border-primary/20",
    "Reemplazando...": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    Subido: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    Error: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      {/* Hidden native input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleFileChange}
        disabled={disabled || state === "Subiendo..." || state === "Reemplazando..."}
        className="hidden"
      />

      {/* Header with Title and State badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <CategoryIconComponent className="size-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeStyle[state]}`}
          >
            {(state === "Subiendo..." || state === "Reemplazando...") && (
              <Loader2 className="size-3 animate-spin" />
            )}
            {state === "Subido" && <CheckCircle2 className="size-3" />}
            {state === "Error" && <AlertCircle className="size-3" />}
            <span>{state}</span>
          </span>
        </div>
      </div>

      {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}

      {/* Disabled Banner when Episode is Not Yet Created */}
      {disabled && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
          <p className="font-medium">
            {disabledMessage ||
              "Guarda el episodio primero en la base de datos para habilitar la subida."}
          </p>
        </div>
      )}

      {/* File Information Card (Nombre, Tipo, Tamaño, Progreso, Estado) */}
      <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs space-y-2.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <div>
            <span className="block text-[11px] text-muted-foreground font-medium">Nombre</span>
            <span
              className="font-medium text-foreground truncate block"
              title={currentFileName || "Ninguno"}
            >
              {currentFileName || "—"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-muted-foreground font-medium">Tipo</span>
            <span className="font-mono text-[11px] text-foreground truncate block">
              {currentType || "—"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-muted-foreground font-medium">Tamaño</span>
            <span className="font-mono tabular-nums text-foreground">
              {currentSize > 0 ? formatBytes(currentSize) : "—"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-muted-foreground font-medium">Progreso</span>
            <span className="font-mono tabular-nums font-semibold text-foreground">
              {progress}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {(state === "Subiendo..." || state === "Reemplazando..." || state === "Subido") && (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-300 ${
                  state === "Subido"
                    ? "bg-emerald-500"
                    : state === "Reemplazando..."
                      ? "bg-blue-500"
                      : "bg-primary"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Callout */}
        {state === "Error" && errorMessage && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Error al procesar el archivo</p>
              <p className="text-[11px] opacity-90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Confirmation Note */}
        {state === "Subido" && (currentStoragePath || currentUrl) && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>
              Archivo almacenado y verificado en Supabase Storage (`podcast-media`).
              {detectedDuration > 0 &&
                ` Duración detectada: ${formatDurationTimestamp(detectedDuration)}.`}
            </span>
          </div>
        )}

        {/* Reemplazando Note */}
        {state === "Reemplazando..." && (
          <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400">
            <Loader2 className="size-3.5 shrink-0 animate-spin" />
            <span>
              Subiendo nuevo archivo... El archivo anterior se conservará hasta confirmar la subida
              y actualización en la base de datos.
            </span>
          </div>
        )}

        {/* Actions Buttons: Seleccionar / Reemplazar / Eliminar / Reintentar / Cancelar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
          {state === "Esperando archivo" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerSelectFile}
              disabled={disabled}
              className="gap-1.5 text-xs h-9"
            >
              <Upload className="size-3.5 text-primary" />
              <span>Seleccionar archivo</span>
            </Button>
          )}

          {state === "Subido" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerSelectFile}
                disabled={disabled}
                className="gap-1.5 text-xs h-9"
              >
                <RotateCcw className="size-3.5 text-primary" />
                <span>Reemplazar archivo</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={disabled}
                className="gap-1.5 text-xs h-9 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                <span>Eliminar</span>
              </Button>
            </>
          )}

          {(state === "Subiendo..." || state === "Reemplazando...") && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={cancelUpload}
              className="gap-1.5 text-xs h-9"
            >
              <Loader2 className="size-3.5 animate-spin" />
              <span>Cancelar subida</span>
            </Button>
          )}

          {state === "Error" && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleRetry}
                disabled={disabled}
                className="gap-1.5 text-xs h-9"
              >
                <RotateCcw className="size-3.5" />
                <span>Reintentar subida</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerSelectFile}
                disabled={disabled}
                className="gap-1.5 text-xs h-9"
              >
                <Upload className="size-3.5" />
                <span>Seleccionar otro archivo</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Storage Path & URL details when file is present */}
      {(currentStoragePath || currentUrl) && state === "Subido" && (
        <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] font-mono text-muted-foreground space-y-1">
          {currentStoragePath && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-foreground">Storage Path:</span>
              <span className="truncate">{currentStoragePath}</span>
            </div>
          )}
          {currentUrl && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-foreground">URL pública:</span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-primary hover:underline"
              >
                {currentUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Media Previews */}
      {Boolean(localPreviewUrl || (currentUrl && state === "Subido")) && (
        <div className="pt-1">
          {category === "audio" && currentUrl && (
            <audio controls className="w-full h-9 rounded-md" src={currentUrl}>
              Tu navegador no soporta el reproductor de audio.
            </audio>
          )}

          {category === "video" && currentUrl && (
            <video
              controls
              className="w-full max-h-48 rounded-lg border border-border bg-black object-contain"
              src={currentUrl}
            >
              Tu navegador no soporta la reproducción de video.
            </video>
          )}

          {category === "image" && (
            <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-muted/20 p-2.5">
              <img
                src={localPreviewUrl || currentUrl || ""}
                alt={label}
                onError={(e) => {
                  if (localPreviewUrl && e.currentTarget.src !== localPreviewUrl) {
                    e.currentTarget.src = localPreviewUrl;
                  }
                }}
                className="h-16 w-16 rounded-lg border border-border object-cover bg-card shadow-2xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-foreground truncate block">
                  {currentFileName || "Vista previa de imagen"}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {state === "Subido"
                    ? "Archivo listo y cargado correctamente"
                    : "Vista previa del archivo seleccionado"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
