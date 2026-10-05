import React, { useState, useMemo } from "react";
import { Video, Check, Film, Play, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ArticleVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (html: string) => void;
}

export function ArticleVideoDialog({ open, onOpenChange, onInsert }: ArticleVideoDialogProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [widthPercent, setWidthPercent] = useState<number>(100);
  const [align, setAlign] = useState<"center" | "left" | "right">("center");

  // Parse embed URL from user input (YouTube, Vimeo, MP4)
  const embedInfo = useMemo(() => {
    const raw = url.trim();
    if (!raw) return null;

    // YouTube regex
    const ytMatch = raw.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (ytMatch && ytMatch[1]) {
      return {
        type: "youtube",
        id: ytMatch[1],
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`,
      };
    }

    // Vimeo regex
    const vimeoMatch = raw.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: "vimeo",
        id: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      };
    }

    // Direct MP4 / WebM video
    if (/\.(mp4|webm|ogg)($|\?)/i.test(raw)) {
      return {
        type: "direct",
        embedUrl: raw,
      };
    }

    // Generic iframe or fallback
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return {
        type: "generic",
        embedUrl: raw,
      };
    }

    return null;
  }, [url]);

  const handleInsert = () => {
    if (!embedInfo) return;

    const wrapperMargin =
      align === "left"
        ? "margin: 1.5rem auto 1.5rem 0;"
        : align === "right"
          ? "margin: 1.5rem 0 1.5rem auto;"
          : "margin: 1.5rem auto;";

    const widthStyle =
      widthPercent === 100 ? "width: 100%;" : `max-width: ${widthPercent}%; width: 100%;`;

    const captionHtml = caption.trim()
      ? `<figcaption style="text-align: center; font-size: 0.875rem; color: #64748b; font-weight: 500; margin-top: 0.5rem;">${caption.trim()}</figcaption>`
      : "";

    let mediaContent = "";
    if (embedInfo.type === "direct") {
      mediaContent = `
        <video src="${embedInfo.embedUrl}" controls preload="metadata" style="width: 100%; height: auto; border-radius: 1rem; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 14px rgba(0,0,0,0.08); display: block;"></video>
      `;
    } else {
      mediaContent = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 1rem; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 14px rgba(0,0,0,0.08); background-color: #0f172a;">
          <iframe src="${embedInfo.embedUrl}" title="${caption.trim() || "Video del artículo"}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>
        </div>
      `;
    }

    const fullHtml = `
      <figure class="article-video-wrapper" style="${widthStyle} ${wrapperMargin} clear: both;">
        ${mediaContent}
        ${captionHtml}
      </figure>
      <p><br></p>
    `;

    onInsert(fullHtml);
    setUrl("");
    setCaption("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
            <Video className="size-5 text-primary" />
            <span>Insertar Video Interactivo</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Agrega videos de YouTube, Vimeo o archivos directos MP4 para enriquecer la lectura del
            artículo.
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Enlace del Video (YouTube, Vimeo o enlace .mp4)
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ej: https://www.youtube.com/watch?v=... o https://youtu.be/..."
              className="rounded-xl text-xs h-10"
            />
            <span className="text-[11px] text-muted-foreground mt-1 block">
              💡 Soporta enlaces cortos de YouTube (youtu.be), videos de Vimeo y archivos directos
              .mp4
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Título o Pie de Video (Opcional)
            </label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ej: Tutorial de cómo solicitar el pase escolar DART paso a paso"
              className="rounded-xl text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Ancho del Reproductor
              </label>
              <select
                value={widthPercent}
                onChange={(e) => setWidthPercent(parseInt(e.target.value, 10))}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value={100}>Ancho Completo (100% - Recomendado)</option>
                <option value={85}>Grande (85%)</option>
                <option value={70}>Mediano (70%)</option>
                <option value={50}>Compacto (50%)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Alineación</label>
              <select
                value={align}
                onChange={(e) => setAlign(e.target.value as "left" | "center" | "right")}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="center">Centrado</option>
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
              </select>
            </div>
          </div>

          {/* Video Preview */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-2">
              Vista Previa del Reproductor
            </span>

            {embedInfo ? (
              <div className="space-y-2">
                <div
                  className="mx-auto aspect-video overflow-hidden rounded-xl border border-border shadow-md bg-black"
                  style={{ maxWidth: `${widthPercent}%` }}
                >
                  {embedInfo.type === "direct" ? (
                    <video src={embedInfo.embedUrl} controls className="size-full object-contain" />
                  ) : (
                    <iframe
                      src={embedInfo.embedUrl}
                      title="Vista previa"
                      className="size-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
                {caption.trim() && (
                  <p className="text-center text-xs text-muted-foreground font-medium">
                    {caption.trim()}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Film className="size-10 mb-2 opacity-40 text-primary" />
                <p className="text-xs font-medium">
                  Pega un enlace válido de YouTube o video para ver la vista previa en vivo
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex sm:justify-between items-center gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            type="button"
            className="rounded-xl text-xs font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={!embedInfo}
            className="rounded-xl text-xs font-bold gap-2 px-5 min-h-10"
            onClick={handleInsert}
          >
            <Check className="size-4" />
            <span>Insertar Video en Artículo</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
