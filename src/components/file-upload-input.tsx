import React, { useRef, useState } from "react";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  Crop,
  Move,
  RotateCw,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageAdjuster } from "@/components/image-adjuster";
import { compressImageFile, detectImageTransparency } from "@/lib/image-compression";

interface FileUploadInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onTransparencyDetected?: (isTransparent: boolean) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  accept?: string;
  showPreview?: boolean;
  className?: string;
}

export function FileUploadInput({
  id,
  value,
  onChange,
  onTransparencyDetected,
  label,
  helperText,
  placeholder = "Pega un enlace o sube un archivo desde tu dispositivo...",
  accept = "image/*,.pdf,application/pdf",
  showPreview = true,
  className = "",
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);

  const isPdf =
    value.toLowerCase().includes("application/pdf") || value.toLowerCase().endsWith(".pdf");
  const isImage =
    value.startsWith("data:image") ||
    value.match(/\.(jpeg|jpg|png|gif|webp|svg|bmp|avif)($|\?)/i) ||
    (!isPdf && value.startsWith("http"));

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const isTransparent = await detectImageTransparency(file);
      if (onTransparencyDetected) {
        onTransparencyDetected(isTransparent);
      }
      const optimizedUrl = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.85,
      });
      onChange(optimizedUrl);
    } catch (err) {
      console.error("Error optimizing uploaded file:", err);
      // Fallback to basic file reader
      const reader = new FileReader();
      reader.onload = async () => {
        const res = reader.result as string;
        if (onTransparencyDetected) {
          const isTransparent = await detectImageTransparency(res);
          onTransparencyDetected(isTransparent);
        }
        onChange(res);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
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
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check for files
    const files = Array.from(clipboardData.files || []);
    const imgFile = files.find((f) => f.type.startsWith("image/") || f.type.includes("pdf"));
    if (imgFile) {
      e.preventDefault();
      e.stopPropagation();
      handleFile(imgFile);
      return;
    }

    // 2. Check items
    const items = Array.from(clipboardData.items || []);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          handleFile(file);
          return;
        }
      }
    }

    // 3. Check direct image or pdf url
    const text = clipboardData.getData("text/plain")?.trim();
    if (
      text &&
      (text.startsWith("data:image/") ||
        text.startsWith("blob:") ||
        /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|ico|pdf)($|\?)/i.test(text) ||
        text.startsWith("http://") ||
        text.startsWith("https://"))
    ) {
      e.preventDefault();
      onChange(text);
      if (onTransparencyDetected && (text.startsWith("data:image/") || text.startsWith("http"))) {
        detectImageTransparency(text).then((isTr) => {
          if (isTr) onTransparencyDetected(true);
        });
      }
    }
  };

  return (
    <div onPaste={handlePaste} className={`space-y-2 ${className}`}>
      {label && <label className="text-xs font-bold text-muted-foreground block">{label}</label>}

      {/* Input row + File selection button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="min-h-11 rounded-xl text-xs pr-10"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2.5 top-2.5 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Limpiar"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="min-h-11 rounded-xl gap-2 font-bold shrink-0 bg-card hover:bg-muted border-border"
        >
          <Upload className="size-4 text-primary" />
          <span>{isProcessing ? "Cargando..." : "Subir archivo"}</span>
        </Button>
      </div>

      {/* Drag and Drop Zone with Paste Support */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
        tabIndex={0}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary/20 ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border/80 bg-muted/20 hover:bg-muted/40"
        }`}
      >
        <Upload className="size-5 text-muted-foreground mb-1" />
        <p className="text-xs font-medium text-foreground">
          Haz clic, arrastra tu archivo o pega con{" "}
          <kbd className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold border border-border">
            Ctrl+V
          </kbd>
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {helperText || "Admite fotos (PNG, JPG, WEBP) o documentos PDF"}
        </p>
      </div>

      {/* Preview & Image Tools */}
      {showPreview && value && (
        <div className="relative mt-2 overflow-hidden rounded-xl border border-border bg-card p-2.5 shadow-2xs space-y-2">
          {isImage ? (
            <>
              <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg border border-border/50 bg-black/5 p-1">
                <img
                  src={value}
                  alt="Vista previa"
                  className="block h-auto max-h-[480px] w-auto max-w-full rounded-lg"
                />
              </div>

              {/* Quick Adjust Button */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                  <Check className="size-3.5 text-emerald-600" />
                  Imagen lista
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsAdjusterOpen(true)}
                  className="h-8 rounded-lg text-xs font-bold gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Crop className="size-3.5" />
                  <span>Ajustar (Mover / Escalar / Rotar)</span>
                </Button>
              </div>

              {/* Adjuster Modal */}
              {isAdjusterOpen && (
                <ImageAdjuster
                  isOpen={isAdjusterOpen}
                  onClose={() => setIsAdjusterOpen(false)}
                  imageUrl={value}
                  onSave={(newVal) => {
                    onChange(newVal);
                  }}
                  title={label ? `Ajustar imagen: ${label}` : "Ajustar Imagen"}
                />
              )}
            </>
          ) : isPdf ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 text-primary">
              <FileText className="size-8 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate">Documento PDF cargado</div>
                <div className="text-[10px] text-muted-foreground">
                  Listo para visualizar y descargar
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
              <Check className="size-4 text-emerald-600" />
              <span className="truncate">{value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
