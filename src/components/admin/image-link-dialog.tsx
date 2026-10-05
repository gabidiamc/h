import React, { useState, useEffect } from "react";
import { Link as LinkIcon, ExternalLink, Unlink, Check, Search, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPublishedArticles, type ArticleRow } from "@/lib/content";

interface ImageLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetImageEl: HTMLImageElement | null;
  onApplyLink: (url: string, openInNewTab: boolean) => void;
  onRemoveLink: () => void;
}

export function ImageLinkDialog({
  open,
  onOpenChange,
  targetImageEl,
  onApplyLink,
  onRemoveLink,
}: ImageLinkDialogProps) {
  const [mode, setMode] = useState<"article" | "custom">("article");
  const [url, setUrl] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [search, setSearch] = useState("");
  const [hasExistingLink, setHasExistingLink] = useState(false);

  // Initialize dialog from current image state
  useEffect(() => {
    if (open && targetImageEl) {
      const parentLink = targetImageEl.closest("a");
      const currentHref = parentLink?.getAttribute("href") || targetImageEl.dataset.linkUrl || "";

      if (currentHref) {
        setHasExistingLink(true);
        if (currentHref.startsWith("/articles/")) {
          setMode("article");
          const slug = currentHref.replace("/articles/", "");
          setSelectedSlug(slug);
        } else {
          setMode("custom");
          setUrl(currentHref);
        }
        setOpenInNewTab(parentLink?.getAttribute("target") === "_blank");
      } else {
        setHasExistingLink(false);
        setUrl("");
        setSelectedSlug("");
      }

      // Load articles
      fetchPublishedArticles().then((data) => {
        setArticles(data || []);
      });
    }
  }, [open, targetImageEl]);

  const filteredArticles = articles.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const t = (a.article_translations?.[0]?.title || "").toLowerCase();
    const s = a.slug.toLowerCase();
    return t.includes(q) || s.includes(q);
  });

  const handleSave = () => {
    let finalUrl = "";
    if (mode === "article") {
      if (!selectedSlug) return;
      finalUrl = `/articles/${selectedSlug}`;
    } else {
      if (!url.trim()) return;
      finalUrl = url.trim();
    }

    onApplyLink(finalUrl, openInNewTab);
    onOpenChange(false);
  };

  const handleRemove = () => {
    onRemoveLink();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-foreground">
            <LinkIcon className="size-5 text-primary" />
            <span>Vincular Imagen con un Enlace</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Al hacer clic en esta imagen en el artículo, el lector será dirigido a este destino.
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Toggle Destination Type */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setMode("article")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "article"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-3.5 text-primary" />
              <span>A otro artículo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                mode === "custom"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ExternalLink className="size-3.5 text-primary" />
              <span>URL Externa o Libre</span>
            </button>
          </div>

          {mode === "article" ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar artículo..."
                  className="pl-9 text-xs rounded-xl h-9"
                />
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl border border-border/60 bg-muted/20 p-1">
                {filteredArticles.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    No se encontraron artículos
                  </p>
                ) : (
                  filteredArticles.map((art) => {
                    const title = art.article_translations?.[0]?.title || art.slug;
                    const isSelected = selectedSlug === art.slug;
                    return (
                      <button
                        key={art.id || art.slug}
                        type="button"
                        onClick={() => setSelectedSlug(art.slug)}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-bold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className="truncate">{title}</span>
                        {isSelected && <Check className="size-3.5 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Dirección Web (URL)
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.dmschools.org/..."
                className="rounded-xl text-xs h-9"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="rounded accent-primary"
            />
            <span>Abrir enlace en una nueva pestaña</span>
          </label>
        </div>

        <DialogFooter className="mt-4 flex sm:justify-between items-center gap-2 border-t border-border pt-4">
          {hasExistingLink ? (
            <Button
              variant="outline"
              type="button"
              className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 gap-1.5"
              onClick={handleRemove}
            >
              <Unlink className="size-3.5" />
              <span>Quitar Enlace</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              type="button"
              className="rounded-xl text-xs font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          )}

          <Button
            type="button"
            className="rounded-xl text-xs font-bold gap-1.5 px-5 min-h-10"
            onClick={handleSave}
            disabled={mode === "article" ? !selectedSlug : !url.trim()}
          >
            <Check className="size-4" />
            <span>Guardar Enlace</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
