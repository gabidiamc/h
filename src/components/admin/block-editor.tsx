/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  Image as ImageIcon,
  Copy,
  Eye,
  Edit3,
  Link as LinkIcon,
  Sparkles,
  Type,
  Layout,
  ExternalLink,
  Info,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  MoveLeft,
  MoveRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type Block = Record<string, any> & { type: string };

const TYPES = [
  { value: "paragraph", label: "Párrafo enriquecido" },
  { value: "heading", label: "Título / Encabezado" },
  { value: "image", label: "Imagen (Flotante o Bloque)" },
  { value: "callout", label: "Aviso / Tarjeta de color" },
  { value: "button", label: "Botón / Enlace destacado" },
  { value: "list", label: "Lista de elementos" },
  { value: "video", label: "Video incrustado" },
  { value: "divider", label: "Línea divisora" },
];

const PRESET_COLORS = [
  { name: "Por defecto", hex: "" },
  { name: "Rojo Tebex", hex: "#ef4444" },
  { name: "Rosa Neón", hex: "#ec4899" },
  { name: "Naranja Ámbar", hex: "#f59e0b" },
  { name: "Dorado / Oro", hex: "#eab308" },
  { name: "Verde Esmeralda", hex: "#10b981" },
  { name: "Azul Zafiro", hex: "#3b82f6" },
  { name: "Violeta / Púrpura", hex: "#8b5cf6" },
  { name: "Gris Oscuro", hex: "#1f2937" },
  { name: "Blanco", hex: "#ffffff" },
];

const PRESET_HIGHLIGHTS = [
  { name: "Sin resalte", hex: "" },
  { name: "Amarillo suave", hex: "#fef08a" },
  { name: "Verde suave", hex: "#dcfce7" },
  { name: "Azul suave", hex: "#e0f2fe" },
  { name: "Rosa suave", hex: "#fce7f3" },
  { name: "Púrpura suave", hex: "#f3e8ff" },
  { name: "Gris oscuro", hex: "#334155" },
];

const SAMPLE_IMAGES = [
  {
    label: "Escuela / Campus",
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop",
  },
  {
    label: "Estudiantes / Clase",
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop",
  },
  {
    label: "Deportes / Evento",
    url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop",
  },
  {
    label: "Graduación",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop",
  },
  {
    label: "Biblioteca / Libros",
    url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop",
  },
];

export function emptyBlock(type: string): Block {
  switch (type) {
    case "heading":
      return { type, text: "", level: "h2", color: "", align: "left" };
    case "paragraph":
      return {
        type,
        text: "",
        color: "",
        bgColor: "",
        align: "left",
        fontSize: "base",
        inlineImages: [],
      };
    case "image":
      return {
        type,
        url: "",
        alt: "",
        caption: "",
        align: "center",
        width: "medium",
        float: "none",
        linkUrl: "",
        transparent: false,
      };
    case "callout":
      return { type, text: "", level: "info", color: "", align: "left" };
    case "button":
      return {
        type,
        text: "Ver más información",
        url: "#",
        bgColor: "#3b82f6",
        textColor: "#ffffff",
        align: "left",
      };
    case "list":
      return { type, items: [""], style: "bullet", color: "" };
    case "video":
      return { type, url: "", title: "" };
    case "divider":
      return { type, style: "solid" };
    default:
      return { type: "paragraph", text: "", align: "left" };
  }
}

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const [previewMode, setPreviewMode] = useState(false);
  const [activeImageDialogIndex, setActiveImageDialogIndex] = useState<number | null>(null);
  const [activeLinkDialogIndex, setActiveLinkDialogIndex] = useState<number | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [newImageAlign, setNewImageAlign] = useState<"left" | "right" | "center" | "inline">(
    "left",
  );
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Track active selection across textareas to prevent losing focus/cursor jumping
  const selectionCacheRef = React.useRef<{
    [key: number]: { start: number; end: number; text: string };
  }>({});

  function recordSelection(blockIndex: number) {
    const textarea = document.getElementById(
      `block-textarea-${blockIndex}`,
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      selectionCacheRef.current[blockIndex] = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
        text: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd),
      };
    }
  }

  function restoreCursor(blockIndex: number, newPos: number) {
    requestAnimationFrame(() => {
      const textarea = document.getElementById(
        `block-textarea-${blockIndex}`,
      ) as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newPos, newPos);
      }
    });
  }

  function update(index: number, patch: Partial<Block>) {
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function move(index: number, delta: number) {
    const next = [...blocks];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    next[index] = next[target]!;
    next[target] = a;
    onChange(next);
  }

  function duplicate(index: number) {
    const next = [...blocks];
    const cloned = JSON.parse(JSON.stringify(blocks[index]));
    next.splice(index + 1, 0, cloned);
    onChange(next);
  }

  function addInlineImageToBlock(blockIndex: number) {
    if (!newImageUrl.trim()) return;
    const block = blocks[blockIndex];
    const currentInline = block?.inlineImages || [];
    const updatedInline = [
      ...currentInline,
      {
        url: newImageUrl.trim(),
        alt: newImageAlt.trim(),
        align: newImageAlign,
      },
    ];
    update(blockIndex, { inlineImages: updatedInline });
    setNewImageUrl("");
    setNewImageAlt("");
    setActiveImageDialogIndex(null);
  }

  function removeInlineImage(blockIndex: number, imgIdx: number) {
    const block = blocks[blockIndex];
    const updated = (block?.inlineImages || []).filter((_: any, idx: number) => idx !== imgIdx);
    update(blockIndex, { inlineImages: updated });
  }

  function moveInlineImage(blockIndex: number, imgIdx: number, delta: number) {
    const block = blocks[blockIndex];
    const inline = [...(block?.inlineImages || [])];
    const target = imgIdx + delta;
    if (target < 0 || target >= inline.length) return;
    const temp = inline[imgIdx];
    inline[imgIdx] = inline[target];
    inline[target] = temp;
    update(blockIndex, { inlineImages: inline });
  }

  function applyFormattingTag(blockIndex: number, tag: string) {
    const textarea = document.getElementById(
      `block-textarea-${blockIndex}`,
    ) as HTMLTextAreaElement | null;
    const saved = selectionCacheRef.current[blockIndex];
    const val = blocks[blockIndex]?.text || "";

    const start = textarea ? textarea.selectionStart : (saved?.start ?? val.length);
    const end = textarea ? textarea.selectionEnd : (saved?.end ?? val.length);
    const selectedText = val.substring(start, end) || "texto";

    let replacement = "";
    if (tag === "bold") replacement = `<strong>${selectedText}</strong>`;
    else if (tag === "italic") replacement = `<em>${selectedText}</em>`;
    else if (tag === "underline") replacement = `<u>${selectedText}</u>`;
    else if (tag === "strike") replacement = `<s>${selectedText}</s>`;
    else if (tag === "code")
      replacement = `<code class="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">${selectedText}</code>`;

    const newText = val.substring(0, start) + replacement + val.substring(end);
    update(blockIndex, { text: newText });
    restoreCursor(blockIndex, start + replacement.length);
  }

  function applyColorToSelection(blockIndex: number, colorHex: string, isBg = false) {
    if (!colorHex) return;
    const textarea = document.getElementById(
      `block-textarea-${blockIndex}`,
    ) as HTMLTextAreaElement | null;
    const saved = selectionCacheRef.current[blockIndex];
    const val = blocks[blockIndex]?.text || "";

    const start = textarea ? textarea.selectionStart : (saved?.start ?? val.length);
    const end = textarea ? textarea.selectionEnd : (saved?.end ?? val.length);
    const selectedText = val.substring(start, end) || "texto con color";

    const styleAttr = isBg ? `background-color: ${colorHex}` : `color: ${colorHex}`;
    const replacement = `<span style="${styleAttr}">${selectedText}</span>`;

    const newText = val.substring(0, start) + replacement + val.substring(end);
    update(blockIndex, { text: newText });
    restoreCursor(blockIndex, start + replacement.length);
  }

  function openLinkModal(blockIndex: number) {
    const textarea = document.getElementById(
      `block-textarea-${blockIndex}`,
    ) as HTMLTextAreaElement | null;
    recordSelection(blockIndex);
    const saved = selectionCacheRef.current[blockIndex];
    const val = blocks[blockIndex]?.text || "";
    const start = textarea ? textarea.selectionStart : (saved?.start ?? 0);
    const end = textarea ? textarea.selectionEnd : (saved?.end ?? 0);
    const selectedText = val.substring(start, end);

    setLinkText(selectedText || "");
    setLinkUrl("https://");
    setActiveLinkDialogIndex(activeLinkDialogIndex === blockIndex ? null : blockIndex);
  }

  function insertLinkToSelection(blockIndex: number) {
    if (!linkUrl.trim()) return;
    const textarea = document.getElementById(
      `block-textarea-${blockIndex}`,
    ) as HTMLTextAreaElement | null;
    const saved = selectionCacheRef.current[blockIndex];
    const val = blocks[blockIndex]?.text || "";

    const start = textarea ? textarea.selectionStart : (saved?.start ?? val.length);
    const end = textarea ? textarea.selectionEnd : (saved?.end ?? val.length);
    const label = linkText.trim() || linkUrl.trim();

    const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" class="text-primary underline font-medium hover:opacity-80">${label}</a>`;
    const newText = val.substring(0, start) + linkHtml + val.substring(end);

    update(blockIndex, { text: newText });
    setActiveLinkDialogIndex(null);
    setLinkUrl("");
    setLinkText("");
    restoreCursor(blockIndex, start + linkHtml.length);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
          <h3 className="text-lg font-bold text-foreground">Editor de Contenido Tebex</h3>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Avanzado
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={previewMode ? "default" : "outline"}
            size="sm"
            className="gap-2 rounded-xl"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <>
                <Edit3 className="size-4" aria-hidden="true" />
                Modo Edición
              </>
            ) : (
              <>
                <Eye className="size-4" aria-hidden="true" />
                Vista Previa en Vivo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Blocks Container */}
      <div className="space-y-4">
        {blocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <Layout className="mx-auto size-10 opacity-40" aria-hidden="true" />
            <p className="mt-2 font-medium">No hay bloques de texto todavía.</p>
            <p className="text-xs">
              Haz clic abajo para agregar tu primer párrafo o imagen estilo Tebex.
            </p>
          </div>
        ) : null}

        {blocks.map((block, i) => (
          <div
            key={i}
            className={`group relative rounded-2xl border bg-background p-4 transition-all duration-200 ${
              previewMode
                ? "border-transparent bg-transparent p-1"
                : "border-border shadow-xs hover:border-primary/40"
            }`}
          >
            {/* Block Header Toolbar (Hidden in preview) */}
            {!previewMode && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                    #{i + 1}
                  </span>

                  {/* Type Selector */}
                  <select
                    value={block.type}
                    onChange={(e) => update(i, emptyBlock(e.target.value))}
                    aria-label="Tipo de bloque"
                    className="min-h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold text-foreground transition-colors focus:border-primary focus:outline-none"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  {/* Quick Color Pickers for Paragraph/Heading */}
                  {(block.type === "paragraph" ||
                    block.type === "heading" ||
                    block.type === "callout") && (
                    <div className="flex items-center gap-1.5 border-l border-border pl-2">
                      <Palette className="size-4 text-muted-foreground" aria-hidden="true" />
                      <input
                        type="color"
                        value={block.color || "#000000"}
                        title="Color del texto del bloque"
                        onChange={(e) => update(i, { color: e.target.value })}
                        className="size-7 cursor-pointer border-0 bg-transparent"
                      />
                      {block.type === "paragraph" && (
                        <>
                          <Highlighter
                            className="ml-1 size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <input
                            type="color"
                            value={block.bgColor || "#ffffff"}
                            title="Color de fondo del bloque"
                            onChange={(e) => update(i, { bgColor: e.target.value })}
                            className="size-7 cursor-pointer border-0 bg-transparent"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Move & Action Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg"
                    title="Mover arriba"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg"
                    title="Mover abajo"
                    disabled={i === blocks.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg"
                    title="Duplicar bloque"
                    onClick={() => duplicate(i)}
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
                    title="Eliminar bloque"
                    onClick={() => onChange(blocks.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}

            {/* Block Body */}
            <div className="space-y-3">
              {/* --- PARAGRAPH BLOCK --- */}
              {block.type === "paragraph" && (
                <>
                  {!previewMode && (
                    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted/60 p-1.5 text-xs">
                      {/* Text styles */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        title="Negrita"
                        onClick={() => applyFormattingTag(i, "bold")}
                      >
                        <Bold className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        title="Cursiva"
                        onClick={() => applyFormattingTag(i, "italic")}
                      >
                        <Italic className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        title="Subrayado"
                        onClick={() => applyFormattingTag(i, "underline")}
                      >
                        <Underline className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        title="Tachado"
                        onClick={() => applyFormattingTag(i, "strike")}
                      >
                        <Strikethrough className="size-3.5" />
                      </Button>

                      <div className="h-4 w-px bg-border" />

                      {/* Alignments */}
                      <Button
                        type="button"
                        variant={block.align === "left" ? "secondary" : "ghost"}
                        size="icon"
                        className="size-8 rounded-lg"
                        title="Alinear a la izquierda"
                        onClick={() => update(i, { align: "left" })}
                      >
                        <AlignLeft className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant={block.align === "center" ? "secondary" : "ghost"}
                        size="icon"
                        className="size-8 rounded-lg"
                        title="Alinear al centro"
                        onClick={() => update(i, { align: "center" })}
                      >
                        <AlignCenter className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant={block.align === "right" ? "secondary" : "ghost"}
                        size="icon"
                        className="size-8 rounded-lg"
                        title="Alinear a la derecha"
                        onClick={() => update(i, { align: "right" })}
                      >
                        <AlignRight className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant={block.align === "justify" ? "secondary" : "ghost"}
                        size="icon"
                        className="size-8 rounded-lg"
                        title="Justificar"
                        onClick={() => update(i, { align: "justify" })}
                      >
                        <AlignJustify className="size-3.5" />
                      </Button>

                      <div className="h-4 w-px bg-border" />

                      {/* Font Size */}
                      <select
                        value={block.fontSize || "base"}
                        onChange={(e) => update(i, { fontSize: e.target.value })}
                        className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                      >
                        <option value="sm">Texto Pequeño</option>
                        <option value="base">Texto Normal</option>
                        <option value="lg">Texto Mediano</option>
                        <option value="xl">Texto Grande</option>
                      </select>

                      <div className="h-4 w-px bg-border" />

                      {/* Preset color swatches */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Color:
                        </span>
                        {PRESET_COLORS.slice(1, 7).map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            title={`Aplicar ${c.name}`}
                            onClick={() => applyColorToSelection(i, c.hex, false)}
                            className="size-5 rounded-full border border-black/20 transition-transform hover:scale-110"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>

                      <div className="h-4 w-px bg-border" />

                      {/* Insert Link Button */}
                      <Button
                        type="button"
                        variant={activeLinkDialogIndex === i ? "secondary" : "outline"}
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
                        onClick={() => openLinkModal(i)}
                      >
                        <LinkIcon className="size-3.5" /> Enlace
                      </Button>

                      {/* Add Inline/Floating Image Button */}
                      <Button
                        type="button"
                        variant={activeImageDialogIndex === i ? "secondary" : "outline"}
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg text-xs font-semibold text-primary"
                        onClick={() =>
                          setActiveImageDialogIndex(activeImageDialogIndex === i ? null : i)
                        }
                      >
                        <ImageIcon className="size-3.5" /> Imagen
                      </Button>
                    </div>
                  )}

                  {/* Link Modal / Panel */}
                  {activeLinkDialogIndex === i && !previewMode && (
                    <div className="mt-2 space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <LinkIcon className="size-3.5" /> Insertar Enlace en la Selección
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setActiveLinkDialogIndex(null)}
                        >
                          Cerrar
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="Texto del enlace (ej.: Ver documento oficial)"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          className="min-h-9 text-xs"
                        />
                        <Input
                          placeholder="URL de destino (https://...)"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          className="min-h-9 text-xs"
                        />
                      </div>
                      <Button
                        type="button"
                        className="min-h-9 w-full rounded-xl text-xs font-semibold"
                        onClick={() => insertLinkToSelection(i)}
                      >
                        Insertar Enlace
                      </Button>
                    </div>
                  )}

                  {/* Inline Image Modal / Panel */}
                  {activeImageDialogIndex === i && !previewMode && (
                    <div className="mt-2 space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">
                          Insertar Imagen Flotante o en Párrafo
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setActiveImageDialogIndex(null)}
                        >
                          Cerrar
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          placeholder="URL de la imagen (https://...)"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          className="min-h-9 text-xs"
                        />
                        <Input
                          placeholder="Texto alternativo / descripción"
                          value={newImageAlt}
                          onChange={(e) => setNewImageAlt(e.target.value)}
                          className="min-h-9 text-xs"
                        />
                      </div>

                      {/* Alignment / Float choice */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-muted-foreground">
                          Posición de la imagen:
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewImageAlign("left")}
                          className={`rounded-lg px-2.5 py-1 border text-xs font-medium ${
                            newImageAlign === "left"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background"
                          }`}
                        >
                          ⬅️ Flotante a la izquierda (Texto envuelve)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewImageAlign("right")}
                          className={`rounded-lg px-2.5 py-1 border text-xs font-medium ${
                            newImageAlign === "right"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background"
                          }`}
                        >
                          ➡️ Flotante a la derecha (Texto envuelve)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewImageAlign("center")}
                          className={`rounded-lg px-2.5 py-1 border text-xs font-medium ${
                            newImageAlign === "center"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background"
                          }`}
                        >
                          ↔️ Centrada en bloque
                        </button>
                      </div>

                      {/* Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Imágenes de ejemplo:
                        </span>
                        {SAMPLE_IMAGES.map((img) => (
                          <button
                            key={img.label}
                            type="button"
                            onClick={() => {
                              setNewImageUrl(img.url);
                              setNewImageAlt(img.label);
                            }}
                            className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted"
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>

                      <Button
                        type="button"
                        className="min-h-9 w-full rounded-xl text-xs font-semibold"
                        onClick={() => addInlineImageToBlock(i)}
                      >
                        Añadir Imagen al Párrafo
                      </Button>
                    </div>
                  )}

                  {/* List of Attached Inline Images with position controls */}
                  {block.inlineImages && block.inlineImages.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/30 p-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        Imágenes asociadas ({block.inlineImages.length}):
                      </span>
                      {block.inlineImages.map((img: any, imgIdx: number) => (
                        <div
                          key={imgIdx}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 text-xs shadow-xs"
                        >
                          <img src={img.url} alt="" className="size-7 rounded-md object-cover" />
                          <span className="max-w-[100px] truncate font-medium">
                            {img.align === "left"
                              ? "⬅️ Izq"
                              : img.align === "right"
                                ? "➡️ Der"
                                : "↔️ Centro"}
                          </span>
                          <button
                            type="button"
                            title="Mover antes"
                            disabled={imgIdx === 0}
                            onClick={() => moveInlineImage(i, imgIdx, -1)}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <MoveLeft className="size-3" />
                          </button>
                          <button
                            type="button"
                            title="Mover después"
                            disabled={imgIdx === block.inlineImages.length - 1}
                            onClick={() => moveInlineImage(i, imgIdx, 1)}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <MoveRight className="size-3" />
                          </button>
                          <button
                            type="button"
                            title="Eliminar imagen"
                            onClick={() => removeInlineImage(i, imgIdx)}
                            className="text-destructive hover:opacity-80"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Textarea or Visual Preview */}
                  {!previewMode ? (
                    <Textarea
                      id={`block-textarea-${i}`}
                      value={block.text || ""}
                      onChange={(e) => {
                        update(i, { text: e.target.value });
                        recordSelection(i);
                      }}
                      onSelect={() => recordSelection(i)}
                      onKeyUp={() => recordSelection(i)}
                      onMouseUp={() => recordSelection(i)}
                      onFocus={() => recordSelection(i)}
                      placeholder="Escribe el párrafo aquí... Puedes usar formato HTML (<strong>, <em>, <span style='color:#ef4444'>) o la barra de herramientas superior."
                      className="min-h-28 rounded-xl font-sans text-base leading-relaxed"
                      style={{
                        color: block.color || undefined,
                        backgroundColor: block.bgColor || undefined,
                        textAlign: block.align || "left",
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-xl border border-transparent p-2 leading-relaxed"
                      style={{
                        color: block.color || undefined,
                        backgroundColor: block.bgColor || undefined,
                        textAlign: block.align || "left",
                      }}
                    >
                      {/* Render attached inline images */}
                      {block.inlineImages?.map((img: any, imgIdx: number) => (
                        <img
                          key={imgIdx}
                          src={img.url}
                          alt={img.alt || ""}
                          className={`rounded-xl border border-border object-cover shadow-sm ${
                            img.align === "left"
                              ? "float-left mr-4 mb-2 max-w-[40%] sm:max-w-[30%]"
                              : img.align === "right"
                                ? "float-right ml-4 mb-2 max-w-[40%] sm:max-w-[30%]"
                                : "mx-auto mb-3 block max-w-full"
                          }`}
                        />
                      ))}
                      <div dangerouslySetInnerHTML={{ __html: block.text || "" }} />
                      <div className="clear-both" />
                    </div>
                  )}
                </>
              )}

              {/* --- HEADING BLOCK --- */}
              {block.type === "heading" && (
                <div className="space-y-2">
                  {!previewMode && (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={block.level || "h2"}
                        onChange={(e) => update(i, { level: e.target.value })}
                        className="min-h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                      >
                        <option value="h1">H1 - Título Principal</option>
                        <option value="h2">H2 - Subtítulo Grande</option>
                        <option value="h3">H3 - Encabezado Seccional</option>
                        <option value="h4">H4 - Encabezado Menor</option>
                      </select>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant={block.align === "left" ? "secondary" : "ghost"}
                          size="icon"
                          className="size-8 rounded-lg"
                          onClick={() => update(i, { align: "left" })}
                        >
                          <AlignLeft className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant={block.align === "center" ? "secondary" : "ghost"}
                          size="icon"
                          className="size-8 rounded-lg"
                          onClick={() => update(i, { align: "center" })}
                        >
                          <AlignCenter className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant={block.align === "right" ? "secondary" : "ghost"}
                          size="icon"
                          className="size-8 rounded-lg"
                          onClick={() => update(i, { align: "right" })}
                        >
                          <AlignRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {!previewMode ? (
                    <Input
                      value={block.text || ""}
                      onChange={(e) => update(i, { text: e.target.value })}
                      placeholder="Escribe el título aquí..."
                      className="min-h-11 rounded-xl font-bold text-lg"
                      style={{
                        color: block.color || undefined,
                        textAlign: block.align || "left",
                      }}
                    />
                  ) : (
                    <h2
                      className="font-extrabold text-2xl tracking-tight"
                      style={{
                        color: block.color || undefined,
                        textAlign: block.align || "left",
                      }}
                    >
                      {block.text}
                    </h2>
                  )}
                </div>
              )}

              {/* --- IMAGE BLOCK --- */}
              {block.type === "image" && (
                <div className="space-y-3">
                  {!previewMode && (
                    <>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          value={block.url || ""}
                          placeholder="https://... (URL de la imagen)"
                          onChange={(e) => update(i, { url: e.target.value })}
                          className="min-h-10 rounded-xl text-sm"
                        />
                        <Input
                          value={block.alt || ""}
                          placeholder="Texto alternativo"
                          onChange={(e) => update(i, { alt: e.target.value })}
                          className="min-h-10 rounded-xl text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {/* Alignment / Floating option */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            Alineación / Flotación:
                          </label>
                          <select
                            value={block.align || "center"}
                            onChange={(e) => update(i, { align: e.target.value })}
                            className="min-h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
                          >
                            <option value="center">↔️ Centrado Bloque</option>
                            <option value="left">
                              ⬅️ Flotante a la Izquierda (Texto alrededor)
                            </option>
                            <option value="right">
                              ➡️ Flotante a la Derecha (Texto alrededor)
                            </option>
                            <option value="full">↔️ Ancho Completo</option>
                          </select>
                        </div>

                        {/* Image Size */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            Tamaño:
                          </label>
                          <select
                            value={block.width || "medium"}
                            onChange={(e) => update(i, { width: e.target.value })}
                            className="min-h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
                          >
                            <option value="small">Pequeño (25%)</option>
                            <option value="medium">Mediano (50%)</option>
                            <option value="large">Grande (75%)</option>
                            <option value="full">Completo (100%)</option>
                          </select>
                        </div>

                        {/* Link URL */}
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                            Enlace (al hacer clic):
                          </label>
                          <Input
                            value={block.linkUrl || ""}
                            placeholder="https://..."
                            onChange={(e) => update(i, { linkUrl: e.target.value })}
                            className="min-h-9 text-xs"
                          />
                        </div>
                      </div>

                      {/* Toggle Imagen Sin Fondo (Transparente) */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-muted/20">
                        <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(block.transparent)}
                            onChange={(e) => update(i, { transparent: e.target.checked })}
                            className="size-4 rounded accent-primary cursor-pointer"
                          />
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-amber-500" />
                            <span>Imagen sin fondo (Transparente / Logo / Sticker)</span>
                          </span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          {block.transparent
                            ? "✨ Sin recuadro gris forzado"
                            : "Marco y fondo estándar"}
                        </span>
                      </div>

                      {/* Sample Gallery Picker */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Elegir de galería:
                        </span>
                        {SAMPLE_IMAGES.map((img) => (
                          <button
                            key={img.label}
                            type="button"
                            onClick={() => update(i, { url: img.url, alt: img.label })}
                            className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted"
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Image Preview Container */}
                  {block.url ? (
                    <div
                      className={`relative group/img overflow-hidden rounded-2xl p-2 ${
                        block.transparent
                          ? "border border-dashed border-amber-500/40 bg-transparent"
                          : "border border-border bg-muted/20"
                      }`}
                    >
                      <img
                        src={block.url}
                        alt={block.alt || ""}
                        className={`transition-all ${
                          block.transparent
                            ? "object-contain bg-transparent border-0 shadow-none drop-shadow-md"
                            : "rounded-xl object-cover shadow-sm"
                        } ${
                          block.align === "left"
                            ? "float-left mr-4 mb-2 max-w-[40%]"
                            : block.align === "right"
                              ? "float-right ml-4 mb-2 max-w-[40%]"
                              : block.width === "small"
                                ? "mx-auto max-w-[25%]"
                                : block.width === "medium"
                                  ? "mx-auto max-w-[50%]"
                                  : block.width === "large"
                                    ? "mx-auto max-w-[75%]"
                                    : "w-full"
                        }`}
                      />
                      {block.caption && (
                        <p className="mt-1 text-center text-xs text-muted-foreground">
                          {block.caption}
                        </p>
                      )}
                      <div className="clear-both" />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      Pega la URL de una imagen o selecciona de la galería superior.
                    </div>
                  )}
                </div>
              )}

              {/* --- CALLOUT / TARJETA BLOCK --- */}
              {block.type === "callout" && (
                <div className="space-y-2">
                  {!previewMode && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">Estilo:</label>
                      <select
                        value={block.level || "info"}
                        onChange={(e) => update(i, { level: e.target.value })}
                        className="min-h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                      >
                        <option value="info">Información (Azul)</option>
                        <option value="important">Importante (Naranja)</option>
                        <option value="urgent">Urgente (Rojo)</option>
                        <option value="success">Éxito / Confirmación (Verde)</option>
                        <option value="luxury">Elegante / Tebex (Oscuro Dorado)</option>
                      </select>
                    </div>
                  )}

                  <Textarea
                    value={block.text || ""}
                    onChange={(e) => update(i, { text: e.target.value })}
                    placeholder="Escribe el texto destacado del aviso..."
                    className="min-h-20 rounded-xl text-sm"
                  />
                </div>
              )}

              {/* --- BUTTON / ENLACE DESTACADO --- */}
              {block.type === "button" && (
                <div className="space-y-3">
                  {!previewMode && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        value={block.text || ""}
                        placeholder="Texto del botón (ej: Registrarme aquí)"
                        onChange={(e) => update(i, { text: e.target.value })}
                        className="min-h-10 text-sm font-semibold"
                      />
                      <Input
                        value={block.url || ""}
                        placeholder="Enlace URL (https://...)"
                        onChange={(e) => update(i, { url: e.target.value })}
                        className="min-h-10 text-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <a
                      href={block.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-5 font-bold shadow-sm"
                      style={{
                        backgroundColor: block.bgColor || "#3b82f6",
                        color: block.textColor || "#ffffff",
                      }}
                    >
                      {block.text || "Botón"}
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* --- LIST BLOCK --- */}
              {block.type === "list" && (
                <div className="space-y-2">
                  {((block.items as string[]) || [""]).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary" />
                      <Input
                        value={item}
                        placeholder={`Elemento ${idx + 1}`}
                        onChange={(e) => {
                          const items = [...((block.items as string[]) || [])];
                          items[idx] = e.target.value;
                          update(i, { items });
                        }}
                        className="min-h-10 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => {
                          const items = ((block.items as string[]) || []).filter(
                            (_, id) => id !== idx,
                          );
                          update(i, { items });
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl text-xs font-semibold"
                    onClick={() => update(i, { items: [...((block.items as string[]) || []), ""] })}
                  >
                    <Plus className="size-3.5" />
                    Agregar elemento a la lista
                  </Button>
                </div>
              )}

              {/* --- VIDEO BLOCK --- */}
              {block.type === "video" && (
                <div className="space-y-2">
                  <Input
                    value={block.url || ""}
                    placeholder="URL del video (ej: https://www.youtube.com/embed/...)"
                    onChange={(e) => update(i, { url: e.target.value })}
                    className="min-h-10 text-sm"
                  />
                  <Input
                    value={block.title || ""}
                    placeholder="Título del video"
                    onChange={(e) => update(i, { title: e.target.value })}
                    className="min-h-10 text-sm"
                  />
                </div>
              )}

              {/* --- DIVIDER BLOCK --- */}
              {block.type === "divider" && (
                <div className="py-2">
                  <hr className="border-t-2 border-dashed border-border" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Block Footer Bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/80 pt-4">
        <span className="text-xs font-bold text-muted-foreground">Agregar elemento:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/10 hover:text-primary"
          onClick={() => onChange([...blocks, emptyBlock("paragraph")])}
        >
          <Plus className="size-3.5" />
          Párrafo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/10 hover:text-primary"
          onClick={() => onChange([...blocks, emptyBlock("heading")])}
        >
          <Type className="size-3.5" />
          Título
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/10 hover:text-primary"
          onClick={() => onChange([...blocks, emptyBlock("image")])}
        >
          <ImageIcon className="size-3.5" />
          Imagen
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/10 hover:text-primary"
          onClick={() => onChange([...blocks, emptyBlock("callout")])}
        >
          <Info className="size-3.5" />
          Aviso
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/10 hover:text-primary"
          onClick={() => onChange([...blocks, emptyBlock("button")])}
        >
          <ExternalLink className="size-3.5" />
          Botón
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl text-xs font-semibold hover:bg-primary/10 hover:text-primary"
          onClick={() => onChange([...blocks, emptyBlock("list")])}
        >
          <Plus className="size-3.5" />
          Lista
        </Button>
      </div>
    </div>
  );
}
