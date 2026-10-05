import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Heading2,
  Heading3,
  Type,
  Image as ImageIcon,
  Palette,
  Highlighter,
  AlertCircle,
  Link as LinkIcon,
  Trash2,
  Sparkles,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  X,
  Sliders,
  Check,
  Crop,
  Upload,
  Layers,
  Video,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Unlink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileUploadInput } from "@/components/file-upload-input";
import { ImageAdjuster } from "@/components/image-adjuster";
import { compressImageFile, detectImageTransparency } from "@/lib/image-compression";
import { toast } from "sonner";
import {
  CanvaDirectOverlay,
  applyCanvaStateToImgElement,
  extractCanvaStateFromImgElement,
  syncArticleCanvasMinHeight,
  type CanvaLayerMode,
} from "@/components/canva-image-direct-editor";
import { ArticleButtonDesignerDialog } from "./article-button-designer-dialog";
import { ArticleVideoDialog } from "./article-video-dialog";
import { ImageLinkDialog } from "./image-link-dialog";

const PRESET_TEXT_COLORS = [
  { name: "Por defecto", hex: "inherit" },
  { name: "Rojo", hex: "#ef4444" },
  { name: "Azul", hex: "#2563eb" },
  { name: "Verde", hex: "#10b981" },
  { name: "Dorado", hex: "#d97706" },
  { name: "Morado", hex: "#8b5cf6" },
  { name: "Rosa", hex: "#ec4899" },
  { name: "Gris Oscuro", hex: "#1f2937" },
];

const PRESET_BG_COLORS = [
  { name: "Sin resalte", hex: "transparent" },
  { name: "Amarillo", hex: "#fef08a" },
  { name: "Verde", hex: "#dcfce7" },
  { name: "Azul", hex: "#e0f2fe" },
  { name: "Rosa", hex: "#fce7f3" },
  { name: "Morado", hex: "#f3e8ff" },
];

interface VisualRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function VisualRichEditor({
  value,
  onChange,
  placeholder = "Escribe aquí el contenido del artículo...",
}: VisualRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);

  // Dialogs
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [dialogIsTransparent, setDialogIsTransparent] = useState(false);
  const dialogFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDialogFile, setIsUploadingDialogFile] = useState(false);

  // Classic Adjuster Modal Dialog (Extra fallback)
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);

  // Drag & drop feedback
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  // Button Designer Dialog
  const [buttonDesignerOpen, setButtonDesignerOpen] = useState(false);
  const [buttonDesignerMode, setButtonDesignerMode] = useState<"next_article" | "custom_link">(
    "next_article",
  );

  // Video Embed Dialog
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  // Image Link Dialog
  const [imageLinkDialogOpen, setImageLinkDialogOpen] = useState(false);

  // Prevent parent value loop from unmounting selected image DOM node
  const isInternalUpdateRef = useRef(false);

  // In-Editor Image Selection & Canva Direct Editing
  const [selectedImageEl, setSelectedImageEl] = useState<HTMLImageElement | null>(null);
  const [editorImages, setEditorImages] = useState<HTMLImageElement[]>([]);
  const [, setImageStateTick] = useState(0);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const refreshEditorImages = () => {
    if (!editorRef.current) return;
    const imgs = Array.from(editorRef.current.querySelectorAll<HTMLImageElement>("img"));
    imgs.forEach((img, idx) => {
      if (!img.getAttribute("data-editor-img-id")) {
        img.setAttribute(
          "data-editor-img-id",
          `img_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        );
      }
    });
    setEditorImages(imgs);
    syncArticleCanvasMinHeight(editorRef.current);
    setImageStateTick((t) => t + 1);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  // Sync value to editor DOM only when value changes externally (not during internal editing)
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      if (value !== currentHtml) {
        const selectedId = selectedImageEl?.getAttribute("data-editor-img-id");
        editorRef.current.innerHTML = value || "";
        if (selectedId) {
          const restored = editorRef.current.querySelector<HTMLImageElement>(
            `[data-editor-img-id="${selectedId}"]`,
          );
          if (restored) setSelectedImageEl(restored);
        }
        refreshEditorImages();
      }
    }
  }, [value, selectedImageEl]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalUpdateRef.current = true;
      refreshEditorImages();
      onChange(editorRef.current.innerHTML);
    }
  };

  // Click on editor listener to detect when an image is clicked (including images behind text!)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        const img = target as HTMLImageElement;
        if (!img.getAttribute("data-editor-img-id")) {
          img.setAttribute(
            "data-editor-img-id",
            "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
          );
        }
        setSelectedImageEl(img);
        refreshEditorImages();
        return;
      }

      // Also detect clicks on images placed BEHIND text (negative z-index)
      const allImgs = Array.from(editor.querySelectorAll<HTMLImageElement>("img"));
      if (allImgs.length > 0) {
        const hitCandidates = allImgs.filter((img) => {
          const r = img.getBoundingClientRect();
          return (
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom
          );
        });
        if (hitCandidates.length > 0) {
          hitCandidates.sort((a, b) => {
            const zA = parseInt(a.dataset.zIndex || a.style.zIndex || "1", 10) || 1;
            const zB = parseInt(b.dataset.zIndex || b.style.zIndex || "1", 10) || 1;
            return zB - zA;
          });
          const hitImg = hitCandidates[0];
          if (!hitImg.getAttribute("data-editor-img-id")) {
            hitImg.setAttribute(
              "data-editor-img-id",
              "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
            );
          }
          setSelectedImageEl(hitImg);
          refreshEditorImages();
        }
      }
    };

    editor.addEventListener("click", handleClick);
    return () => {
      editor.removeEventListener("click", handleClick);
    };
  }, []);

  // Move selected image up or down among paragraphs in article text
  const moveSelectedImageInText = (direction: "up" | "down") => {
    if (!selectedImageEl || !editorRef.current) return;
    const block =
      selectedImageEl.closest("figure") || selectedImageEl.closest("a") || selectedImageEl;
    if (direction === "up") {
      const prev = block.previousElementSibling;
      if (prev) {
        prev.before(block);
        handleInput();
      }
    } else {
      const next = block.nextElementSibling;
      if (next) {
        next.after(block);
        handleInput();
      }
    }
  };

  // Attach link to image
  const handleApplyImageLink = (url: string, openInNewTab: boolean) => {
    if (!selectedImageEl) return;
    const existingA = selectedImageEl.closest("a");
    if (existingA) {
      existingA.setAttribute("href", url);
      if (openInNewTab) {
        existingA.setAttribute("target", "_blank");
        existingA.setAttribute("rel", "noopener noreferrer");
      } else {
        existingA.removeAttribute("target");
        existingA.removeAttribute("rel");
      }
    } else {
      const a = document.createElement("a");
      a.setAttribute("href", url);
      if (openInNewTab) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
      a.style.display = "inline-block";
      a.style.maxWidth = "100%";
      a.style.textDecoration = "none";
      selectedImageEl.parentNode?.insertBefore(a, selectedImageEl);
      a.appendChild(selectedImageEl);
    }
    selectedImageEl.dataset.linkUrl = url;
    handleInput();
  };

  // Remove link from image
  const handleRemoveImageLink = () => {
    if (!selectedImageEl) return;
    const existingA = selectedImageEl.closest("a");
    if (existingA) {
      existingA.replaceWith(selectedImageEl);
    }
    delete selectedImageEl.dataset.linkUrl;
    handleInput();
  };

  // Insert button HTML
  const handleInsertButton = (buttonHtml: string, position: "end" | "cursor") => {
    if (position === "end" && editorRef.current) {
      editorRef.current.innerHTML += buttonHtml;
      handleInput();
    } else {
      insertHtmlAtSelection(buttonHtml);
    }
  };

  // Insert video HTML
  const handleInsertVideo = (videoHtml: string) => {
    insertHtmlAtSelection(videoHtml);
  };

  const insertHtmlAtSelection = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const el = document.createElement("div");
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node: ChildNode | null;
        let lastNode: ChildNode | null = null;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        handleInput();
        return;
      }
    }

    // Fallback: append
    try {
      const success = document.execCommand("insertHTML", false, html);
      if (!success) {
        editorRef.current.innerHTML += html;
      }
    } catch {
      editorRef.current.innerHTML += html;
    }
    handleInput();
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const applyTextColor = (hex: string) => {
    if (hex === "inherit") {
      exec("removeFormat");
    } else {
      exec("foreColor", hex);
    }
    setShowColorMenu(false);
  };

  const applyBgColor = (hex: string) => {
    exec("hiliteColor", hex);
    setShowBgMenu(false);
  };

  const insertCallout = () => {
    const calloutHtml = `
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1rem 0; color: #1e3a8a; font-weight: 500;">
        💡 <strong>Nota importante:</strong> Escribe aquí el aviso o información destacada...
      </div>
      <p><br></p>
    `;
    insertHtmlAtSelection(calloutHtml);
  };

  // Dedicated helper to insert an image into the article content in natural document flow
  const insertImageHtml = (src: string, caption = "", isTransparent = false) => {
    const captionHtml = caption.trim()
      ? `<figcaption style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">${caption.trim()}</figcaption>`
      : "";
    const imgId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const style = isTransparent
      ? "width: 100%; max-width: 640px; height: auto; display: block; margin-left: auto; margin-right: auto; background: transparent; border: none; box-shadow: none; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.12)); object-fit: contain; transition: none;"
      : "width: 100%; max-width: 640px; height: auto; border-radius: 1rem; border: 1px solid rgba(0,0,0,0.1); display: block; margin-left: auto; margin-right: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: none;";

    const imgHtml = `
      <figure data-layer-mode="inline" data-free-flow="false" ${isTransparent ? 'data-transparent="true"' : ""} style="margin: 1.25rem auto; text-align: center; display: block; clear: both;">
        <img src="${src}" alt="${caption.trim() || "Imagen"}" data-editor-img-id="${imgId}" data-transparent="${isTransparent ? "true" : "false"}" data-layer-mode="inline" data-free-flow="false" data-x="0" data-y="0" data-rotation="0" data-z-index="2" data-opacity="1" style="${style}" />
        ${captionHtml}
      </figure>
    `;
    insertHtmlAtSelection(imgHtml);

    // Auto-select inserted image so controls appear immediately
    setTimeout(() => {
      const inserted = editorRef.current?.querySelector<HTMLImageElement>(
        `[data-editor-img-id="${imgId}"]`,
      );
      if (inserted) {
        setSelectedImageEl(inserted);
      } else {
        const imgs = editorRef.current?.querySelectorAll("img");
        if (imgs && imgs.length > 0) {
          setSelectedImageEl(imgs[imgs.length - 1]);
        }
      }
      refreshEditorImages();
    }, 80);
  };

  // Insert image from Dialog (classic upload or URL)
  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    insertImageHtml(imageUrl.trim(), imageCaption.trim(), dialogIsTransparent);
    setImageUrl("");
    setImageCaption("");
    setDialogIsTransparent(false);
    setImageDialogOpen(false);
  };

  // Upload file from Dialog
  const handleDialogFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDialogFile(true);
      const isTr = await detectImageTransparency(file);
      if (isTr) {
        setDialogIsTransparent(true);
      }
      const optimized = await compressImageFile(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.76,
        mimeType: isTr ? "image/png" : "image/jpeg",
      });
      setImageUrl(optimized);
      if (!imageCaption) {
        setImageCaption(file.name.replace(/\.[^/.]+$/, ""));
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingDialogFile(false);
      if (dialogFileInputRef.current) dialogFileInputRef.current.value = "";
    }
  };

  // 📋 Robust Paste Handler: Captures screenshots, copied files, and copied image blobs!
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check for files in clipboard
    const files = Array.from(clipboardData.files || []);
    const imageFile = files.find((f) => f.type.startsWith("image/"));

    if (imageFile) {
      e.preventDefault();
      e.stopPropagation();
      try {
        const isTr = await detectImageTransparency(imageFile);
        const optimized = await compressImageFile(imageFile, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.76,
          mimeType: isTr ? "image/png" : "image/jpeg",
        });
        insertImageHtml(optimized, imageFile.name || "Imagen pegada", isTr);
        if (isTr) toast.success("✨ Imagen sin fondo detectada e insertada.");
      } catch {
        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === "string") {
            const isTr = await detectImageTransparency(reader.result);
            insertImageHtml(reader.result, "Imagen pegada", isTr);
          }
        };
        reader.readAsDataURL(imageFile);
      }
      return;
    }

    // 2. Check for image items (e.g. screenshots from snipping tool, copied from web)
    const items = Array.from(clipboardData.items || []);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          try {
            const isTr = await detectImageTransparency(file);
            const optimized = await compressImageFile(file, {
              maxWidth: 1024,
              maxHeight: 1024,
              quality: 0.76,
              mimeType: isTr ? "image/png" : "image/jpeg",
            });
            insertImageHtml(optimized, "Imagen pegada", isTr);
            if (isTr) toast.success("✨ Imagen sin fondo detectada e insertada.");
          } catch {
            const reader = new FileReader();
            reader.onload = async () => {
              if (typeof reader.result === "string") {
                const isTr = await detectImageTransparency(reader.result);
                insertImageHtml(reader.result, "Imagen pegada", isTr);
              }
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    }

    // 3. Check for direct image URL in pasted plain text
    const plainText = clipboardData.getData("text/plain")?.trim();
    if (
      plainText &&
      (plainText.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(plainText) ||
        (plainText.startsWith("http") &&
          (plainText.includes("images.unsplash.com") ||
            plainText.includes("imgur.com") ||
            plainText.includes("cloudinary.com") ||
            plainText.includes("googleusercontent.com"))))
    ) {
      e.preventDefault();
      e.stopPropagation();
      detectImageTransparency(plainText).then((isTr) => {
        insertImageHtml(plainText, "Imagen", isTr);
        if (isTr) toast.success("✨ Imagen sin fondo detectada e insertada.");
      });
      return;
    }

    // 4. Check for HTML with <img> tags copied from another web page
    const html = clipboardData.getData("text/html");
    if (html && html.includes("<img")) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const imgs = doc.querySelectorAll("img");
      if (imgs.length > 0 && (!doc.body.textContent || doc.body.textContent.trim().length === 0)) {
        e.preventDefault();
        e.stopPropagation();
        imgs.forEach(async (img) => {
          if (img.src) {
            const isTr = await detectImageTransparency(img.src);
            insertImageHtml(img.src, img.alt || "Imagen pegada", isTr);
          }
        });
        return;
      }

      // Mixed text and images: let browser paste, then sanitize img styles
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.querySelectorAll("img").forEach((img) => {
            if (!img.style.maxWidth) img.style.maxWidth = "100%";
            if (!img.style.borderRadius) img.style.borderRadius = "0.75rem";
            if (!img.style.height) img.style.height = "auto";
          });
          handleInput();
        }
      }, 60);
    }
  };

  // Drag & drop support: drag image files straight into the editor!
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types?.includes("Files")) {
      e.preventDefault();
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    const imgFile = files.find((f) => f.type.startsWith("image/"));
    if (imgFile) {
      e.preventDefault();
      e.stopPropagation();
      try {
        const isTr = await detectImageTransparency(imgFile);
        const optimized = await compressImageFile(imgFile, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.76,
          mimeType: isTr ? "image/png" : "image/jpeg",
        });
        insertImageHtml(optimized, imgFile.name || "Imagen subida", isTr);
        if (isTr) toast.success("✨ Imagen sin fondo detectada e insertada.");
      } catch {
        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === "string") {
            const isTr = await detectImageTransparency(reader.result);
            insertImageHtml(reader.result, imgFile.name || "Imagen subida", isTr);
          }
        };
        reader.readAsDataURL(imgFile);
      }
    }
  };

  // Toggle transparency (Sin Fondo) for currently selected in-article image
  const toggleSelectedImageTransparency = () => {
    if (!selectedImageEl) return;
    const isCurrent =
      selectedImageEl.dataset.transparent === "true" ||
      selectedImageEl.getAttribute("data-transparent") === "true";
    const next = !isCurrent;
    selectedImageEl.dataset.transparent = next ? "true" : "false";

    const figure = selectedImageEl.closest("figure");
    if (next) {
      selectedImageEl.style.background = "transparent";
      selectedImageEl.style.backgroundColor = "transparent";
      selectedImageEl.style.border = "none";
      selectedImageEl.style.boxShadow = "none";
      selectedImageEl.style.filter = "drop-shadow(0 4px 10px rgba(0,0,0,0.12))";
      selectedImageEl.style.objectFit = "contain";
      if (figure) figure.dataset.transparent = "true";
      toast.success("✨ Imagen del artículo configurada sin fondo (transparente)");
    } else {
      selectedImageEl.style.background = "";
      selectedImageEl.style.backgroundColor = "";
      selectedImageEl.style.border = "1px solid rgba(0,0,0,0.1)";
      selectedImageEl.style.borderRadius = "1rem";
      selectedImageEl.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      selectedImageEl.style.filter = "none";
      selectedImageEl.style.objectFit = "cover";
      if (figure) delete figure.dataset.transparent;
      toast.info("Imagen con marco y fondo estándar");
    }

    handleInput();
    setImageStateTick((t) => t + 1);
  };

  // Quick toolbar image sizing & align presets
  const updateSelectedImageWidth = (percent: number) => {
    if (!selectedImageEl || !editorRef.current) return;
    const containerW = editorRef.current.clientWidth || 680;
    const targetPx = Math.round((containerW * percent) / 100);
    const curState = extractCanvaStateFromImgElement(selectedImageEl);
    const ratio = (curState.height || 240) / (curState.width || 360);
    applyCanvaStateToImgElement(selectedImageEl, {
      ...curState,
      width: targetPx,
      height: Math.round(targetPx * ratio),
    });
    handleInput();
  };

  const updateSelectedImageRotation = (deltaDeg: number) => {
    if (!selectedImageEl) return;
    const curState = extractCanvaStateFromImgElement(selectedImageEl);
    const newRot = ((curState.rotation || 0) + deltaDeg + 360) % 360;
    applyCanvaStateToImgElement(selectedImageEl, {
      ...curState,
      rotation: newRot,
    });
    handleInput();
  };

  const setSelectedImageAbsoluteRotation = (deg: number) => {
    if (!selectedImageEl) return;
    const curState = extractCanvaStateFromImgElement(selectedImageEl);
    const normalized = ((deg % 360) + 360) % 360;
    applyCanvaStateToImgElement(selectedImageEl, {
      ...curState,
      rotation: normalized,
    });
    handleInput();
  };

  const setSelectedImageLayerMode = (mode: CanvaLayerMode) => {
    if (!selectedImageEl) return;
    const curState = extractCanvaStateFromImgElement(selectedImageEl);
    let nextZ = curState.zIndex || 10;
    if (mode === "behind-text") {
      nextZ = nextZ < 0 ? nextZ : -5;
    } else if (mode === "in-front") {
      nextZ = nextZ > 0 ? Math.max(10, nextZ) : 10;
    } else {
      nextZ = 2;
    }
    applyCanvaStateToImgElement(selectedImageEl, {
      ...curState,
      layerMode: mode,
      freeFlow: mode !== "inline",
      x: mode === "inline" ? 0 : curState.x || 0,
      y: mode === "inline" ? 0 : curState.y || 0,
      zIndex: nextZ,
    });
    handleInput();
  };

  const setSelectedImageOpacity = (opacity: number) => {
    if (!selectedImageEl) return;
    const curState = extractCanvaStateFromImgElement(selectedImageEl);
    applyCanvaStateToImgElement(selectedImageEl, {
      ...curState,
      opacity,
    });
    handleInput();
  };

  const resetSelectedImagePosition = () => {
    if (!selectedImageEl) return;
    const curState = extractCanvaStateFromImgElement(selectedImageEl);
    applyCanvaStateToImgElement(selectedImageEl, {
      ...curState,
      x: 0,
      y: 0,
    });
    handleInput();
  };

  const bringSelectedImageForward = () => {
    if (!selectedImageEl || !editorRef.current) return;
    const curState = extractCanvaStateFromImgElement(selectedImageEl);
    const allImgs = Array.from(editorRef.current.querySelectorAll<HTMLImageElement>("img")).filter(
      (i) => i !== selectedImageEl,
    );

    if (curState.layerMode === "behind-text") {
      // Among behind-text images, raise z-index up towards -1; if already above all behind-text images, keep at -1
      const behindZs = allImgs
        .map((i) => parseInt(i.dataset.zIndex || i.style.zIndex || "10", 10))
        .filter((z) => z < 0);
      const maxBehindZ = behindZs.length > 0 ? Math.max(...behindZs) : -5;
      const nextZ = Math.min(-1, Math.max((curState.zIndex || -5) + 1, maxBehindZ + 1));
      applyCanvaStateToImgElement(selectedImageEl, {
        ...curState,
        zIndex: nextZ,
      });
    } else {
      const frontZs = allImgs
        .map((i) => parseInt(i.dataset.zIndex || i.style.zIndex || "10", 10))
        .filter((z) => z > 0);
      const maxFrontZ = frontZs.length > 0 ? Math.max(...frontZs) : 10;
      const nextZ = Math.max((curState.zIndex || 10) + 1, maxFrontZ + 1);
      applyCanvaStateToImgElement(selectedImageEl, {
        ...curState,
        layerMode: "in-front",
        freeFlow: true,
        zIndex: nextZ,
      });
    }
    handleInput();
  };

  const sendSelectedImageBackward = () => {
    if (!selectedImageEl || !editorRef.current) return;
    const curState = extractCanvaStateFromImgElement(selectedImageEl);
    const allImgs = Array.from(editorRef.current.querySelectorAll<HTMLImageElement>("img")).filter(
      (i) => i !== selectedImageEl,
    );

    if (curState.layerMode === "behind-text") {
      const behindZs = allImgs
        .map((i) => parseInt(i.dataset.zIndex || i.style.zIndex || "10", 10))
        .filter((z) => z < 0);
      const minBehindZ = behindZs.length > 0 ? Math.min(...behindZs) : -5;
      const nextZ = Math.min((curState.zIndex || -5) - 1, minBehindZ - 1);
      applyCanvaStateToImgElement(selectedImageEl, {
        ...curState,
        zIndex: nextZ,
      });
    } else {
      const frontZs = allImgs
        .map((i) => parseInt(i.dataset.zIndex || i.style.zIndex || "10", 10))
        .filter((z) => z > 0);
      const minFrontZ = frontZs.length > 0 ? Math.min(...frontZs) : 10;
      const nextZ = Math.max(1, Math.min((curState.zIndex || 10) - 1, minFrontZ - 1));
      applyCanvaStateToImgElement(selectedImageEl, {
        ...curState,
        zIndex: nextZ,
      });
    }
    handleInput();
  };

  const updateSelectedImageAlign = (
    align: "left" | "center" | "right" | "float-left" | "float-right",
  ) => {
    if (!selectedImageEl) return;
    const parentFigure = selectedImageEl.closest("figure");

    if (align === "float-left") {
      selectedImageEl.style.float = "left";
      selectedImageEl.style.margin = "0.5rem 1.25rem 0.5rem 0";
      selectedImageEl.style.display = "inline-block";
      if (parentFigure) parentFigure.style.textAlign = "left";
    } else if (align === "float-right") {
      selectedImageEl.style.float = "right";
      selectedImageEl.style.margin = "0.5rem 0 0.5rem 1.25rem";
      selectedImageEl.style.display = "inline-block";
      if (parentFigure) parentFigure.style.textAlign = "right";
    } else if (align === "left") {
      selectedImageEl.style.float = "none";
      selectedImageEl.style.display = "block";
      selectedImageEl.style.marginLeft = "0";
      selectedImageEl.style.marginRight = "auto";
      selectedImageEl.style.marginTop = "1rem";
      selectedImageEl.style.marginBottom = "1rem";
      if (parentFigure) parentFigure.style.textAlign = "left";
    } else if (align === "right") {
      selectedImageEl.style.float = "none";
      selectedImageEl.style.display = "block";
      selectedImageEl.style.marginLeft = "auto";
      selectedImageEl.style.marginRight = "0";
      selectedImageEl.style.marginTop = "1rem";
      selectedImageEl.style.marginBottom = "1rem";
      if (parentFigure) parentFigure.style.textAlign = "right";
    } else {
      // Center
      selectedImageEl.style.float = "none";
      selectedImageEl.style.display = "block";
      selectedImageEl.style.marginLeft = "auto";
      selectedImageEl.style.marginRight = "auto";
      selectedImageEl.style.marginTop = "1rem";
      selectedImageEl.style.marginBottom = "1rem";
      if (parentFigure) parentFigure.style.textAlign = "center";
    }
    handleInput();
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;

    const text = linkText.trim() || linkUrl.trim();
    const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${text}</a>`;
    insertHtmlAtSelection(linkHtml);
    setLinkUrl("");
    setLinkText("");
    setLinkDialogOpen(false);
  };

  const deleteSelectedImage = () => {
    if (!selectedImageEl) return;
    const parentFigure = selectedImageEl.closest("figure");
    if (parentFigure) {
      parentFigure.remove();
    } else {
      selectedImageEl.remove();
    }
    setSelectedImageEl(null);
    handleInput();
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
      {/* Visual Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/80 bg-muted/40 p-2 text-foreground">
        {/* Basic Text Formats */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Negrita (Ctrl+B)"
          onClick={() => exec("bold")}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Cursiva (Ctrl+I)"
          onClick={() => exec("italic")}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Subrayado (Ctrl+U)"
          onClick={() => exec("underline")}
        >
          <Underline className="size-4" />
        </Button>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Text Color Dropdown */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold hover:bg-background"
            onClick={() => {
              setShowColorMenu(!showColorMenu);
              setShowBgMenu(false);
            }}
          >
            <Palette className="size-4 text-primary" />
            <span>Color</span>
          </Button>

          {showColorMenu && (
            <div className="absolute left-0 top-10 z-50 flex w-48 flex-col rounded-xl border border-border bg-popover p-2 shadow-lg animate-in fade-in zoom-in-95">
              <span className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Color de letra
              </span>
              <div className="grid grid-cols-4 gap-1.5 p-1">
                {PRESET_TEXT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    className="size-7 rounded-full border border-border/60 transition-transform hover:scale-110 focus:outline-hidden"
                    style={{ backgroundColor: c.hex === "inherit" ? "#ffffff" : c.hex }}
                    onClick={() => applyTextColor(c.hex)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Dropdown */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold hover:bg-background"
            onClick={() => {
              setShowBgMenu(!showBgMenu);
              setShowColorMenu(false);
            }}
          >
            <Highlighter className="size-4 text-amber-500" />
            <span>Resaltar</span>
          </Button>

          {showBgMenu && (
            <div className="absolute left-0 top-10 z-50 flex w-48 flex-col rounded-xl border border-border bg-popover p-2 shadow-lg animate-in fade-in zoom-in-95">
              <span className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Fondo de texto
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1">
                {PRESET_BG_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    className="flex items-center gap-1.5 rounded-lg border border-border/60 p-1.5 text-xs transition-transform hover:scale-105"
                    onClick={() => applyBgColor(c.hex)}
                  >
                    <span
                      className="size-4 rounded-md border border-border"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="truncate text-[11px]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Text Block Headers */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Párrafo normal"
          onClick={() => exec("formatBlock", "<p>")}
        >
          <Type className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-lg px-2 text-xs font-bold hover:bg-background"
          title="Título grande"
          onClick={() => exec("formatBlock", "<h2>")}
        >
          <Heading2 className="size-4 mr-1" /> Título
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-lg px-2 text-xs font-bold hover:bg-background"
          title="Subtítulo mediano"
          onClick={() => exec("formatBlock", "<h3>")}
        >
          <Heading3 className="size-4 mr-1" /> Subtítulo
        </Button>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Alinear a la izquierda"
          onClick={() => exec("justifyLeft")}
        >
          <AlignLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Centrar texto"
          onClick={() => exec("justifyCenter")}
        >
          <AlignCenter className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Alinear a la derecha"
          onClick={() => exec("justifyRight")}
        >
          <AlignRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg hover:bg-background"
          title="Lista con viñetas"
          onClick={() => exec("insertUnorderedList")}
        >
          <List className="size-4" />
        </Button>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Insert Elements */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={insertCallout}
        >
          <AlertCircle className="size-4" />
          <span>Aviso</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => {
            saveSelection();
            setLinkDialogOpen(true);
          }}
        >
          <LinkIcon className="size-4" />
          <span>Enlace</span>
        </Button>

        {/* Traditional Image Upload & Insert Button */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => {
            saveSelection();
            setImageDialogOpen(true);
          }}
          title="Subir o insertar imagen (Sistema clásico)"
        >
          <ImageIcon className="size-4 text-primary" />
          <span>Imagen</span>
        </Button>

        <div className="h-5 w-px bg-border/80 mx-1" />

        {/* Custom Interactive Button / CTA */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => {
            saveSelection();
            setButtonDesignerMode("custom_link");
            setButtonDesignerOpen(true);
          }}
          title="Insertar botón interactivo decorado en el artículo"
        >
          <Sparkles className="size-4 text-primary" />
          <span>Botón / CTA</span>
        </Button>

        {/* Video Embed */}
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-background"
          onClick={() => {
            saveSelection();
            setVideoDialogOpen(true);
          }}
          title="Insertar video interactivo (YouTube o MP4)"
        >
          <Video className="size-4 text-primary" />
          <span>Video</span>
        </Button>
      </div>

      {/* Layer Strip for All Images in the Article (Click any image to select/move even if behind text or another photo) */}
      {editorImages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-muted/25 px-3 py-1.5 text-xs">
          <span className="font-bold text-muted-foreground flex items-center gap-1">
            <Layers className="size-3.5 text-primary" />
            <span>Imágenes en el artículo ({editorImages.length}):</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {editorImages.map((img, idx) => {
              const isSelected = selectedImageEl === img;
              const imgState = extractCanvaStateFromImgElement(img);
              const layerLabel =
                imgState.layerMode === "behind-text"
                  ? "Detrás de letras"
                  : imgState.layerMode === "inline"
                    ? "Con espacio"
                    : "Sobre letras";
              return (
                <button
                  key={img.getAttribute("data-editor-img-id") || idx}
                  type="button"
                  onClick={() => setSelectedImageEl(img)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                  title="Haz clic para seleccionar, mover, rotar o cambiar la capa de esta imagen"
                >
                  <img
                    src={img.src}
                    alt=""
                    className="size-4 rounded-xs object-cover border border-white/20"
                  />
                  <span>Foto {idx + 1}</span>
                  <span
                    className={`rounded px-1 py-0.2 text-[9px] font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {layerLabel} • Capa {imgState.zIndex}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="ml-auto text-[10px] text-muted-foreground hidden sm:inline">
            💡 Arrastra cualquier imagen libremente a donde quieras en el artículo
          </span>
        </div>
      )}

      {/* Quick Image Action Bar (Visible when an image is selected) */}
      {selectedImageEl &&
        (() => {
          const selState = extractCanvaStateFromImgElement(selectedImageEl);
          return (
            <div className="flex flex-col gap-2 border-b border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-semibold animate-in fade-in duration-150">
              {/* Row 1: Layering (Above/Below Letters & Above/Below Other Photos) + Free Rotation */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-primary font-bold flex items-center gap-1 mr-1">
                    <Move className="size-3.5" />
                    <span>Posición y Capas:</span>
                  </span>

                  {/* Layer vs Text */}
                  <button
                    type="button"
                    onClick={() => setSelectedImageLayerMode("in-front")}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      selState.layerMode === "in-front"
                        ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                    title="Poner imagen por arriba de las letras y mover libremente sin restricciones"
                  >
                    <ChevronUp className="size-3.5" />
                    <span>Por arriba de letras</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedImageLayerMode("behind-text")}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      selState.layerMode === "behind-text"
                        ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                    title="Poner imagen por abajo/detrás de las letras (las letras se ven encima de la foto)"
                  >
                    <ChevronDown className="size-3.5" />
                    <span>Por abajo de letras</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedImageLayerMode("inline")}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                      selState.layerMode === "inline"
                        ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                    title="Separar párrafos arriba y abajo con espacio normal"
                  >
                    <span>Con espacio en texto</span>
                  </button>

                  <div className="h-4 w-px bg-border/80 mx-1" />

                  {/* Layer vs Other Photos */}
                  <span className="text-muted-foreground mr-0.5">Entre fotos:</span>
                  <button
                    type="button"
                    onClick={bringSelectedImageForward}
                    className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold hover:bg-muted text-foreground"
                    title="Subir esta foto por arriba de otras fotos"
                  >
                    <Layers className="size-3.5 text-primary" />
                    <span>⬆️ Sobre otra foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={sendSelectedImageBackward}
                    className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold hover:bg-muted text-foreground"
                    title="Bajar esta foto por debajo de otras fotos"
                  >
                    <Layers className="size-3.5" />
                    <span>⬇️ Bajo otra foto</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={deleteSelectedImage}
                    className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-destructive hover:bg-destructive/20 text-[11px] font-bold"
                    title="Eliminar imagen"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Eliminar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageEl(null)}
                    className="rounded-md p-1 hover:bg-muted text-muted-foreground"
                    title="Cerrar barra"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Free Rotation (Slider + Buttons), Opacity, Size, Alignment & Link */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-primary/15">
                {/* Rotation Controls */}
                <div className="flex items-center gap-1 bg-background/90 border border-border rounded-lg px-2 py-0.5">
                  <RotateCw className="size-3.5 text-primary" />
                  <span className="text-[11px] text-muted-foreground">Rotar:</span>
                  <button
                    type="button"
                    onClick={() => updateSelectedImageRotation(-90)}
                    className="rounded px-1.5 py-0.5 text-[11px] hover:bg-muted font-bold"
                    title="Rotar -90°"
                  >
                    -90°
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedImageRotation(-15)}
                    className="rounded px-1.5 py-0.5 text-[11px] hover:bg-muted font-medium"
                    title="Rotar -15°"
                  >
                    -15°
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={Math.round(selState.rotation || 0)}
                    onChange={(e) => setSelectedImageAbsoluteRotation(parseInt(e.target.value, 10))}
                    className="h-1.5 w-20 cursor-pointer accent-primary"
                    title="Desliza para rotar libremente a cualquier ángulo (0° a 360°)"
                  />
                  <span className="min-w-8 text-center font-mono text-[11px] font-bold text-primary">
                    {Math.round(selState.rotation || 0)}°
                  </span>
                  <button
                    type="button"
                    onClick={() => updateSelectedImageRotation(15)}
                    className="rounded px-1.5 py-0.5 text-[11px] hover:bg-muted font-medium"
                    title="Rotar +15°"
                  >
                    +15°
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSelectedImageRotation(90)}
                    className="rounded px-1.5 py-0.5 text-[11px] hover:bg-muted font-bold"
                    title="Rotar +90°"
                  >
                    +90°
                  </button>
                  {selState.rotation !== 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedImageAbsoluteRotation(0)}
                      className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20"
                    >
                      0°
                    </button>
                  )}
                </div>

                {/* Opacity Slider (Great for images behind text!) */}
                <div className="flex items-center gap-1.5 bg-background/90 border border-border rounded-lg px-2 py-0.5">
                  <span className="text-[11px] text-muted-foreground">Opacidad:</span>
                  <input
                    type="range"
                    min="0.15"
                    max="1"
                    step="0.05"
                    value={selState.opacity ?? 1}
                    onChange={(e) => setSelectedImageOpacity(parseFloat(e.target.value))}
                    className="h-1.5 w-16 cursor-pointer accent-primary"
                    title="Ajusta la transparencia (ideal cuando la foto está por abajo de las letras)"
                  />
                  <span className="font-mono text-[11px]">
                    {Math.round((selState.opacity ?? 1) * 100)}%
                  </span>
                </div>

                {/* Quick Sizes */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Tamaño:</span>
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => updateSelectedImageWidth(pct)}
                      className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] hover:bg-muted font-medium"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* Reset X/Y if moved */}
                {(selState.x !== 0 || selState.y !== 0) && (
                  <button
                    type="button"
                    onClick={resetSelectedImagePosition}
                    className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted font-medium text-muted-foreground"
                    title="Devolver a X=0, Y=0"
                  >
                    Centrar X/Y
                  </button>
                )}

                {/* Toggle Sin Fondo (Transparente) */}
                <button
                  type="button"
                  onClick={toggleSelectedImageTransparency}
                  className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                    selectedImageEl.dataset.transparent === "true" ||
                    selectedImageEl.getAttribute("data-transparent") === "true"
                      ? "border border-amber-500/60 bg-amber-500/20 text-amber-800 dark:text-amber-200 shadow-2xs"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                  title="Activar/Desactivar modo sin fondo (ideal para imágenes transparentes, logos, stickers e ilustraciones en el artículo)"
                >
                  <Sparkles
                    className={`size-3.5 ${
                      selectedImageEl.dataset.transparent === "true" ||
                      selectedImageEl.getAttribute("data-transparent") === "true"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span>
                    {selectedImageEl.dataset.transparent === "true" ||
                    selectedImageEl.getAttribute("data-transparent") === "true"
                      ? "Sin Fondo ✓"
                      : "Sin Fondo"}
                  </span>
                </button>

                {/* Link to Article or URL */}
                <button
                  type="button"
                  onClick={() => setImageLinkDialogOpen(true)}
                  className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] hover:bg-primary/20 font-bold text-primary"
                  title="Hacer que la imagen sea interactiva con un enlace"
                >
                  <LinkIcon className="size-3.5" />
                  <span>{selectedImageEl.closest("a") ? "Cambiar Enlace" : "Poner Enlace"}</span>
                </button>

                {/* Classic Adjuster Modal */}
                <button
                  type="button"
                  onClick={() => setIsAdjusterOpen(true)}
                  className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-muted-foreground hover:bg-muted font-medium text-[11px]"
                  title="Abrir ajustador clásico en ventana flotante"
                >
                  <Crop className="size-3.5" />
                  <span>Recorte Clásico</span>
                </button>
              </div>
            </div>
          );
        })()}

      {/* Main Visual Canvas Container with In-Place Canva Direct Overlay */}
      <div
        ref={editorContainerRef}
        className="relative min-h-[280px] max-h-[550px] overflow-y-auto overflow-x-hidden"
      >
        {/* Main ContentEditable Canvas with Paste & Drop Support */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`article-rendered-content min-h-[280px] p-4 sm:p-5 text-base leading-relaxed text-foreground outline-hidden transition-colors ${
            isDraggingOver ? "bg-primary/5 ring-2 ring-inset ring-primary/40" : ""
          }`}
          data-placeholder={placeholder}
        />

        {/* Drag & Drop Overlay Badge */}
        {isDraggingOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-2xl bg-background px-4 py-2 text-sm font-bold text-primary shadow-lg border border-primary/30">
              <Upload className="size-5 animate-bounce" />
              <span>Suelta aquí la imagen para insertarla en el artículo</span>
            </div>
          </div>
        )}

        {/* Canva Direct Editing Overlay (Renders directly over the selected image) */}
        {selectedImageEl && editorContainerRef.current && (
          <CanvaDirectOverlay
            targetElement={selectedImageEl}
            containerElement={editorContainerRef.current}
            imageUrl={selectedImageEl.dataset.originalSrc || selectedImageEl.src}
            onUpdate={(newState) => {
              applyCanvaStateToImgElement(selectedImageEl, newState);
              handleInput();
            }}
            onDuplicate={() => {
              const clone = selectedImageEl.cloneNode(true) as HTMLImageElement;
              selectedImageEl.parentNode?.insertBefore(clone, selectedImageEl.nextSibling);
              setSelectedImageEl(clone);
              handleInput();
            }}
            onDelete={() => {
              deleteSelectedImage();
            }}
            onDeselect={() => {
              setSelectedImageEl(null);
            }}
            onBringForward={bringSelectedImageForward}
            onSendBackward={sendSelectedImageBackward}
            onMoveUp={() => moveSelectedImageInText("up")}
            onMoveDown={() => moveSelectedImageInText("down")}
            onAlign={(align) => updateSelectedImageAlign(align)}
            onOpenLink={() => setImageLinkDialogOpen(true)}
          />
        )}
      </div>

      {/* Classic Image Upload & Insert Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="size-5 text-primary" />
              <span>Subir o Insertar Imagen (Sistema Tradicional)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Option 1: Upload from computer/phone */}
            <div className="space-y-2 rounded-2xl border border-border p-3.5 bg-muted/20">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                Opción 1: Subir foto desde el dispositivo
              </span>
              <input
                ref={dialogFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDialogFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => dialogFileInputRef.current?.click()}
                className="w-full min-h-11 rounded-xl font-bold gap-2 border-primary/30 text-primary hover:bg-primary/10"
                disabled={isUploadingDialogFile}
              >
                <Upload className="size-4" />
                <span>
                  {isUploadingDialogFile
                    ? "Optimizando imagen..."
                    : "Seleccionar archivo de imagen"}
                </span>
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Admite JPG, PNG, WEBP, GIF. O simplemente copia cualquier foto y pégala con{" "}
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground font-semibold border border-border">
                  Ctrl+V
                </kbd>{" "}
                en el artículo.
              </p>
            </div>

            {/* Option 2: Image URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Opción 2: O escribe la dirección Web (URL de imagen)
              </label>
              <Input
                placeholder="https://ejemplo.com/foto.jpg o pega un enlace de imagen..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="min-h-11 rounded-xl text-xs"
              />
            </div>

            {/* Image Preview if provided */}
            {imageUrl && (
              <div className="space-y-1 rounded-xl border border-border bg-card p-2 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Vista Previa
                </span>
                <div className="max-h-48 overflow-hidden rounded-lg bg-black/5 flex items-center justify-center p-1">
                  <img
                    src={imageUrl}
                    alt="Previsualización"
                    className="max-h-44 object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Optional Caption */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Pie de foto o descripción (Opcional)
              </label>
              <Input
                placeholder="Ejemplo: Participantes del taller escolar 2026"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="min-h-11 rounded-xl text-xs"
              />
            </div>

            {/* Toggle Imagen Sin Fondo (Transparente) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl border border-border/80 bg-muted/20">
              <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dialogIsTransparent}
                  onChange={(e) => setDialogIsTransparent(e.target.checked)}
                  className="size-4 rounded accent-primary cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>Imagen sin fondo (Transparente / Logo / Sticker)</span>
                </span>
              </label>
              <span className="text-[11px] font-medium text-muted-foreground">
                {dialogIsTransparent ? "✨ Sin recuadro gris forzado" : "Marco y fondo estándar"}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setImageDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="min-h-11 rounded-xl font-bold bg-primary text-primary-foreground"
              onClick={handleInsertImage}
              disabled={!imageUrl.trim()}
            >
              Insertar en el Artículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classic Image Adjuster Modal (Extra fallback if requested) */}
      {isAdjusterOpen && selectedImageEl && (
        <ImageAdjuster
          isOpen={isAdjusterOpen}
          onClose={() => setIsAdjusterOpen(false)}
          imageUrl={selectedImageEl.src}
          onSave={(newVal) => {
            selectedImageEl.src = newVal;
            delete selectedImageEl.dataset.originalSrc;
            handleInput();
            setIsAdjusterOpen(false);
          }}
          title="Ajustar imagen (Sistema clásico)"
          defaultAspectRatio="original"
          saveLabel="Guardar Cambios en Artículo"
        />
      )}

      {/* Insert Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insertar Enlace</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground">
                Texto visible del enlace
              </label>
              <Input
                placeholder="Ejemplo: Haz clic aquí para ver más"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="mt-1 min-h-11 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground">Dirección Web (URL)</label>
              <Input
                placeholder="https://ejemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="mt-1 min-h-11 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="min-h-11 rounded-xl"
              onClick={() => setLinkDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="min-h-11 rounded-xl" onClick={handleInsertLink}>
              Insertar Enlace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interactive Button Designer Dialog */}
      <ArticleButtonDesignerDialog
        open={buttonDesignerOpen}
        onOpenChange={setButtonDesignerOpen}
        onInsert={handleInsertButton}
        defaultMode={buttonDesignerMode}
      />

      {/* Interactive Video Embed Dialog */}
      <ArticleVideoDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        onInsert={handleInsertVideo}
      />

      {/* Image Link Dialog (Clickable Images) */}
      <ImageLinkDialog
        open={imageLinkDialogOpen}
        onOpenChange={setImageLinkDialogOpen}
        targetImageEl={selectedImageEl}
        onApplyLink={handleApplyImageLink}
        onRemoveLink={handleRemoveImageLink}
      />
    </div>
  );
}
