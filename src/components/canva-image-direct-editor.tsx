import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Square,
  Circle,
  Star,
  Heart,
  Hexagon,
  Crop,
  RotateCw,
  Trash2,
  Copy,
  Layers,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  AlignCenter,
  AlignLeft,
  AlignRight,
  ZoomIn,
  ZoomOut,
  Sliders,
  Upload,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Link as LinkIcon,
} from "lucide-react";

export type CanvaShapeType =
  "rect" | "square" | "rounded" | "circle" | "oval" | "star" | "heart" | "hexagon" | "diamond";

export type CanvaLayerMode = "in-front" | "behind-text" | "inline";

export interface CanvaImageState {
  width: number;
  height: number;
  rotation: number;
  shape: CanvaShapeType;
  cropZoom: number; // 1.0 to 4.0
  cropPanX: number; // in pixels
  cropPanY: number; // in pixels
  isLocked?: boolean;
  align?: "left" | "center" | "right" | "float-left" | "float-right";
  zIndex?: number;
  x?: number; // Free horizontal offset (px) without restrictions
  y?: number; // Free vertical offset (px) without restrictions
  layerMode?: CanvaLayerMode; // "in-front" (sobre letras), "behind-text" (detrás de letras), "inline" (con espacio)
  freeFlow?: boolean; // Collapse figure height so moving image leaves no gap in text
  opacity?: number; // 0.15 to 1.0
  transparent?: boolean; // Imagen sin fondo (transparente) sin borde rígido ni caja gris
}

/**
 * Ensures any .article-rendered-content container expands its minHeight
 * to accommodate images moved freely to lower Y coordinates.
 */
export function syncArticleCanvasMinHeight(container: HTMLElement | null) {
  if (!container) return;
  const imgs = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
  if (imgs.length === 0) {
    container.style.minHeight = "";
    return;
  }
  const cRect = container.getBoundingClientRect();
  let maxBottom = 0;
  for (const img of imgs) {
    const r = img.getBoundingClientRect();
    const bottomRel = r.bottom - cRect.top + container.scrollTop;
    if (bottomRel > maxBottom) {
      maxBottom = bottomRel;
    }
  }
  if (maxBottom > 0) {
    const targetMin = Math.ceil(maxBottom + 36);
    container.style.minHeight = `${Math.max(220, targetMin)}px`;
  }
}

export const CANVA_SHAPES: {
  id: CanvaShapeType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  clipPath: string;
  borderRadius?: string;
  aspectRatio?: string;
}[] = [
  {
    id: "rect",
    label: "Rectángulo",
    icon: Square,
    clipPath: "none",
  },
  {
    id: "square",
    label: "Cuadrado (1:1)",
    icon: Square,
    clipPath: "none",
    aspectRatio: "1 / 1",
  },
  {
    id: "rounded",
    label: "Redondeado",
    icon: Square,
    clipPath: "none",
    borderRadius: "1.5rem",
  },
  {
    id: "circle",
    label: "Círculo",
    icon: Circle,
    clipPath: "circle(50% at 50% 50%)",
    aspectRatio: "1 / 1",
  },
  {
    id: "oval",
    label: "Óvalo",
    icon: Circle,
    clipPath: "ellipse(50% 40% at 50% 50%)",
  },
  {
    id: "star",
    label: "Estrella",
    icon: Star,
    clipPath:
      "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
    aspectRatio: "1 / 1",
  },
  {
    id: "heart",
    label: "Corazón",
    icon: Heart,
    clipPath: "url(#canva-mask-heart)",
    aspectRatio: "1 / 1",
  },
  {
    id: "hexagon",
    label: "Hexágono",
    icon: Hexagon,
    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    aspectRatio: "1 / 1",
  },
  {
    id: "diamond",
    label: "Diamante",
    icon: Square,
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    aspectRatio: "1 / 1",
  },
];

/**
 * Global SVG Definitions for objectBoundingBox clip paths (e.g. Heart)
 */
export function CanvaSvgMaskDefs() {
  return (
    <svg
      width="0"
      height="0"
      className="absolute pointer-events-none opacity-0 overflow-hidden"
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        <clipPath id="canva-mask-heart" clipPathUnits="objectBoundingBox">
          <path d="M 0.5, 0.84 C 0.12, 0.56, 0, 0.40, 0, 0.25 C 0, 0.11, 0.11, 0, 0.26, 0 C 0.36, 0, 0.45, 0.06, 0.5, 0.15 C 0.55, 0.06, 0.64, 0, 0.74, 0 C 0.89, 0, 1, 0.11, 1, 0.25 C 1, 0.40, 0.88, 0.56, 0.5, 0.84 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/**
 * Apply live Canva transformation & mask styles to an HTMLImageElement
 */
export function applyCanvaStateToImgElement(img: HTMLImageElement, state: CanvaImageState) {
  // Never duplicate large base64 strings into data-original-src
  if (img.dataset.originalSrc && img.dataset.originalSrc.startsWith("data:")) {
    delete img.dataset.originalSrc;
  }

  const posX = Math.round(state.x || 0);
  const posY = Math.round(state.y || 0);
  const layerMode: CanvaLayerMode =
    state.layerMode ||
    (state.zIndex !== undefined && state.zIndex < 0 ? "behind-text" : "in-front");
  const isFreeFlow =
    state.freeFlow !== undefined
      ? state.freeFlow
      : layerMode === "in-front" || layerMode === "behind-text" || posX !== 0 || posY !== 0;

  // Size & instant response (no laggy CSS transitions)
  img.style.width = `${state.width}px`;
  img.style.height = `${state.height}px`;
  img.style.maxWidth = isFreeFlow || posX !== 0 || posY !== 0 ? "none" : "100%";
  img.style.objectFit = "cover";
  img.style.transition = "none";
  img.style.opacity = String(state.opacity ?? 1);

  // Free X / Y position without restrictions
  img.style.position = "relative";
  img.style.left = `${posX}px`;
  img.style.top = `${posY}px`;

  // Rotation
  img.style.transform = state.rotation ? `rotate(${state.rotation}deg)` : "none";
  img.style.transformOrigin = "center center";

  // Parent figure flow handling (prevent blank holes in text when moving freely)
  const parentFigure = img.closest("figure") as HTMLElement | null;
  if (parentFigure) {
    parentFigure.dataset.layerMode = layerMode;
    if (isFreeFlow && layerMode !== "inline") {
      parentFigure.dataset.freeFlow = "true";
      parentFigure.style.height = "0px";
      parentFigure.style.margin = "0px";
      parentFigure.style.padding = "0px";
      parentFigure.style.overflow = "visible";
      parentFigure.style.lineHeight = "0";
      parentFigure.style.position = "static";
    } else {
      delete parentFigure.dataset.freeFlow;
      parentFigure.style.height = "auto";
      parentFigure.style.margin = "1.25rem auto";
      parentFigure.style.padding = "";
      parentFigure.style.overflow = "visible";
      parentFigure.style.lineHeight = "";
      parentFigure.style.position = "static";
    }
  }

  // Alignment
  if (state.align === "left") {
    img.style.marginLeft = "0";
    img.style.marginRight = "auto";
    img.style.float = "none";
    img.style.display = "block";
    if (parentFigure) parentFigure.style.textAlign = "left";
  } else if (state.align === "right") {
    img.style.marginLeft = "auto";
    img.style.marginRight = "0";
    img.style.float = "none";
    img.style.display = "block";
    if (parentFigure) parentFigure.style.textAlign = "right";
  } else if (state.align === "float-left") {
    img.style.float = "left";
    img.style.marginRight = "1.25rem";
    img.style.marginBottom = "1rem";
    img.style.marginLeft = "0";
    img.style.display = "inline-block";
    if (parentFigure) parentFigure.style.textAlign = "left";
  } else if (state.align === "float-right") {
    img.style.float = "right";
    img.style.marginLeft = "1.25rem";
    img.style.marginBottom = "1rem";
    img.style.marginRight = "0";
    img.style.display = "inline-block";
    if (parentFigure) parentFigure.style.textAlign = "right";
  } else {
    // Centered by default
    img.style.marginLeft = "auto";
    img.style.marginRight = "auto";
    img.style.float = "none";
    img.style.display = "block";
    if (parentFigure) parentFigure.style.textAlign = "center";
  }

  // Shape mask
  const shapeDef = CANVA_SHAPES.find((s) => s.id === state.shape);
  if (shapeDef) {
    if (state.shape === "rounded") {
      img.style.borderRadius = "1.5rem";
      img.style.clipPath = "none";
      img.style.setProperty("-webkit-clip-path", "none");
    } else if (state.shape === "rect") {
      img.style.borderRadius = "0.5rem";
      img.style.clipPath = "none";
      img.style.setProperty("-webkit-clip-path", "none");
    } else {
      img.style.borderRadius = "0px";
      img.style.clipPath = shapeDef.clipPath;
      img.style.setProperty("-webkit-clip-path", shapeDef.clipPath);
    }

    if (shapeDef.aspectRatio) {
      img.style.aspectRatio = shapeDef.aspectRatio;
    } else {
      img.style.aspectRatio = "";
    }
  }

  // Internal Crop Pan & Zoom inside the mask (via object-position)
  if (state.cropPanX !== 0 || state.cropPanY !== 0) {
    img.style.objectPosition = `calc(50% + ${state.cropPanX}px) calc(50% + ${state.cropPanY}px)`;
  } else {
    img.style.objectPosition = "center center";
  }

  // Z-Index & Layering (behind-text uses negative z-index inside isolated .article-rendered-content; in-front uses >= 10)
  let effectiveZ = state.zIndex ?? 10;
  if (layerMode === "behind-text") {
    effectiveZ = effectiveZ < 0 ? effectiveZ : -5;
  } else if (layerMode === "in-front") {
    effectiveZ = effectiveZ > 0 ? Math.max(10, effectiveZ) : 10;
  } else {
    effectiveZ = effectiveZ > 0 ? effectiveZ : 2;
  }
  img.style.zIndex = String(effectiveZ);

  const isTransparent = Boolean(
    state.transparent !== undefined
      ? state.transparent
      : img.dataset.transparent === "true" ||
          img.getAttribute("data-transparent") === "true" ||
          img.classList.contains("img-transparent"),
  );

  if (isTransparent) {
    img.dataset.transparent = "true";
    img.style.background = "transparent";
    img.style.backgroundColor = "transparent";
    img.style.border = "none";
    img.style.boxShadow = "none";
    img.style.filter = "drop-shadow(0 4px 10px rgba(0,0,0,0.12))";
    img.style.objectFit = "contain";
    if (parentFigure) parentFigure.dataset.transparent = "true";
  } else {
    img.dataset.transparent = "false";
    if (img.style.filter?.includes("drop-shadow")) {
      img.style.filter = "none";
    }
    if (parentFigure) delete parentFigure.dataset.transparent;
  }

  // Dataset attributes for lossless full state restoration
  img.dataset.shape = state.shape;
  img.dataset.rotation = String(state.rotation || 0);
  img.dataset.cropZoom = String(state.cropZoom || 1.0);
  img.dataset.cropPanX = String(state.cropPanX || 0);
  img.dataset.cropPanY = String(state.cropPanY || 0);
  img.dataset.locked = state.isLocked ? "true" : "false";
  img.dataset.align = state.align || "center";
  img.dataset.x = String(posX);
  img.dataset.y = String(posY);
  img.dataset.layerMode = layerMode;
  img.dataset.freeFlow = isFreeFlow ? "true" : "false";
  img.dataset.zIndex = String(effectiveZ);
  img.dataset.opacity = String(state.opacity ?? 1);

  const articleContainer = img.closest(".article-rendered-content") as HTMLElement | null;
  if (articleContainer) {
    syncArticleCanvasMinHeight(articleContainer);
  }
}

/**
 * Extract Canva state from an existing HTMLImageElement
 */
export function extractCanvaStateFromImgElement(img: HTMLImageElement): CanvaImageState {
  const width = img.offsetWidth || parseInt(img.style.width, 10) || 380;
  const height = img.offsetHeight || parseInt(img.style.height, 10) || 260;

  const transform = img.style.transform || "";
  const rotMatch = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
  const rotation = parseFloat(img.dataset.rotation || (rotMatch ? rotMatch[1] : "0")) || 0;

  const shape = (img.dataset.shape as CanvaShapeType) || "rect";
  const cropZoom = parseFloat(img.dataset.cropZoom || "1.0") || 1.0;
  const cropPanX = parseFloat(img.dataset.cropPanX || "0") || 0;
  const cropPanY = parseFloat(img.dataset.cropPanY || "0") || 0;
  const isLocked = img.dataset.locked === "true";
  const align = (img.dataset.align as CanvaImageState["align"]) || "center";
  const rawZ = parseInt(img.dataset.zIndex || img.style.zIndex || "10", 10);
  const zIndex = Number.isNaN(rawZ) ? 10 : rawZ;
  const x = parseFloat(img.dataset.x || img.style.left || "0") || 0;
  const y = parseFloat(img.dataset.y || img.style.top || "0") || 0;
  const layerMode: CanvaLayerMode =
    (img.dataset.layerMode as CanvaLayerMode) ||
    (zIndex < 0
      ? "behind-text"
      : img.dataset.freeFlow === "true" && (Math.abs(x) > 1 || Math.abs(y) > 1)
        ? "in-front"
        : "inline");
  const freeFlow =
    img.dataset.freeFlow !== undefined ? img.dataset.freeFlow === "true" : layerMode !== "inline";
  const opacity = parseFloat(img.dataset.opacity || img.style.opacity || "1") || 1;
  const transparent =
    img.dataset.transparent === "true" ||
    img.getAttribute("data-transparent") === "true" ||
    img.classList.contains("img-transparent");

  return {
    width,
    height,
    rotation,
    shape,
    cropZoom,
    cropPanX,
    cropPanY,
    isLocked,
    align,
    zIndex,
    x,
    y,
    layerMode,
    freeFlow,
    opacity,
    transparent,
  };
}

/**
 * Helper to render masked Canva state to high-resolution dataURL
 */
export async function renderCanvaImageToDataUrl(
  imageSrc: string,
  state: CanvaImageState,
  maxWidth = 1600,
  maxHeight = 1600,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        let targetW = Math.max(60, state.width || img.width);
        let targetH = Math.max(60, state.height || img.height);

        if (
          state.shape === "square" ||
          state.shape === "circle" ||
          state.shape === "star" ||
          state.shape === "heart" ||
          state.shape === "hexagon" ||
          state.shape === "diamond"
        ) {
          const s = Math.min(targetW, targetH);
          targetW = s;
          targetH = s;
        }

        // Scale to max dimensions
        if (targetW > maxWidth || targetH > maxHeight) {
          const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Apply clip path for mask
        ctx.save();
        const w = targetW;
        const h = targetH;

        if (state.shape === "rounded") {
          const r = Math.min(24, Math.min(w, h) / 4);
          ctx.beginPath();
          if (typeof ctx.roundRect === "function") {
            ctx.roundRect(0, 0, w, h, r);
          } else {
            ctx.rect(0, 0, w, h);
          }
          ctx.clip();
        } else if (state.shape === "circle") {
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
          ctx.clip();
        } else if (state.shape === "oval") {
          ctx.beginPath();
          ctx.ellipse(w / 2, h / 2, w / 2, h * 0.4, 0, 0, Math.PI * 2);
          ctx.clip();
        } else if (state.shape === "star") {
          const pts = [
            [0.5, 0.0],
            [0.61, 0.35],
            [0.98, 0.35],
            [0.68, 0.57],
            [0.79, 0.91],
            [0.5, 0.7],
            [0.21, 0.91],
            [0.32, 0.57],
            [0.02, 0.35],
            [0.39, 0.35],
          ];
          ctx.beginPath();
          pts.forEach(([px, py], i) => {
            if (i === 0) ctx.moveTo(px * w, py * h);
            else ctx.lineTo(px * w, py * h);
          });
          ctx.closePath();
          ctx.clip();
        } else if (state.shape === "heart") {
          ctx.beginPath();
          ctx.moveTo(w * 0.5, h * 0.84);
          ctx.bezierCurveTo(w * 0.12, h * 0.56, 0, h * 0.4, 0, h * 0.25);
          ctx.bezierCurveTo(0, h * 0.11, w * 0.11, 0, w * 0.26, 0);
          ctx.bezierCurveTo(w * 0.36, 0, w * 0.45, h * 0.06, w * 0.5, h * 0.15);
          ctx.bezierCurveTo(w * 0.55, h * 0.06, w * 0.64, 0, w * 0.74, 0);
          ctx.bezierCurveTo(w * 0.89, 0, w, h * 0.11, w, h * 0.25);
          ctx.bezierCurveTo(w, h * 0.4, w * 0.88, h * 0.56, w * 0.5, h * 0.84);
          ctx.closePath();
          ctx.clip();
        } else if (state.shape === "hexagon") {
          const pts = [
            [0.25, 0],
            [0.75, 0],
            [1.0, 0.5],
            [0.75, 1.0],
            [0.25, 1.0],
            [0.0, 0.5],
          ];
          ctx.beginPath();
          pts.forEach(([px, py], i) => {
            if (i === 0) ctx.moveTo(px * w, py * h);
            else ctx.lineTo(px * w, py * h);
          });
          ctx.closePath();
          ctx.clip();
        } else if (state.shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(w * 0.5, 0);
          ctx.lineTo(w, h * 0.5);
          ctx.lineTo(w * 0.5, h);
          ctx.lineTo(0, h * 0.5);
          ctx.closePath();
          ctx.clip();
        }

        // Calculate cover sizing + crop zoom & pan
        const baseScale = Math.max(w / img.width, h / img.height);
        const finalScale = baseScale * (state.cropZoom || 1);
        const drawW = img.width * finalScale;
        const drawH = img.height * finalScale;
        const drawX = (w - drawW) / 2 + (state.cropPanX || 0);
        const drawY = (h - drawH) / 2 + (state.cropPanY || 0);

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();

        const mime = state.shape === "rect" ? "image/jpeg" : "image/png";
        const result = canvas.toDataURL(mime, 0.92);
        resolve(result);
      } catch (err) {
        console.error("Canvas export error:", err);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Direct In-Place Canva Overlay Component
 * Renders directly on top of the selected image element inside any container!
 */
export interface CanvaDirectOverlayProps {
  targetElement: HTMLElement;
  containerElement: HTMLElement;
  imageUrl: string;
  initialState?: Partial<CanvaImageState>;
  onUpdate: (newState: CanvaImageState) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onDeselect: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onAlign?: (align: "left" | "center" | "right" | "float-left" | "float-right") => void;
  onOpenLink?: () => void;
}

export function CanvaDirectOverlay({
  targetElement,
  containerElement,
  imageUrl,
  initialState,
  onUpdate,
  onDuplicate,
  onDelete,
  onDeselect,
  onBringForward,
  onSendBackward,
  onMoveUp,
  onMoveDown,
  onAlign,
  onOpenLink,
}: CanvaDirectOverlayProps) {
  // Current Transform State
  const [state, setState] = useState<CanvaImageState>(() => ({
    ...extractCanvaStateFromImgElement(targetElement as HTMLImageElement),
    ...initialState,
  }));

  // Re-sync state when targetElement changes
  useEffect(() => {
    if (targetElement && targetElement.tagName === "IMG") {
      setState((prev) => ({
        ...prev,
        ...extractCanvaStateFromImgElement(targetElement as HTMLImageElement),
        ...initialState,
      }));
    }
  }, [targetElement, initialState]);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<CanvaImageState[]>([state]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Edit Modes
  const [isCropMode, setIsCropMode] = useState(false);
  const [activeRotationTooltip, setActiveRotationTooltip] = useState<number | null>(null);

  // Smart Snap Guides
  const [snapGuideX, setSnapGuideX] = useState<number | null>(null);

  // Touch / Gesture Refs for Mobile
  const touchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const lastTapTimeRef = useRef<number>(0);

  // Pointer Drag Ref
  const dragRef = useRef<{
    type: "move" | "rotate" | "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w" | "panCrop";
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
    startImgX: number;
    startImgY: number;
    startRotation: number;
    centerX: number;
    centerY: number;
    startCropPanX: number;
    startCropPanY: number;
    lastDx?: number;
    lastDy?: number;
  } | null>(null);

  // Live apply state to image element
  const applyLive = useCallback(
    (next: CanvaImageState) => {
      setState(next);
      if (targetElement && targetElement.tagName === "IMG") {
        applyCanvaStateToImgElement(targetElement as HTMLImageElement, next);
      }
      onUpdate(next);
    },
    [targetElement, onUpdate],
  );

  // Push history on state commit
  const commitState = useCallback(
    (newState: CanvaImageState) => {
      applyLive(newState);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newState];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [applyLive, historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      applyLive(prev);
    }
  }, [applyLive, historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      applyLive(next);
    }
  }, [applyLive, historyIndex, history]);

  // Keyboard Shortcuts: Delete, Esc, Ctrl+Z, Ctrl+Y, Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (!state.isLocked && onDelete) {
          e.preventDefault();
          onDelete();
        }
      } else if (e.key === "Escape") {
        if (isCropMode) {
          setIsCropMode(false);
        } else {
          onDeselect();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (onDuplicate) onDuplicate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, isCropMode, onDelete, onDeselect, onDuplicate, redo, undo]);

  // Click Outside to Deselect
  useEffect(() => {
    const handleOutsidePointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        targetElement.contains(target) ||
        target.closest(".canva-direct-overlay-ui") ||
        target.closest(".canva-direct-toolbar") ||
        target.closest(".canva-direct-image-field") ||
        target.closest("[role='dialog']") ||
        target.closest(".quick-image-actions") ||
        target.closest(".article-quick-bar") ||
        (containerElement && containerElement.contains(target)) ||
        target.closest("button") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea")
      ) {
        return;
      }
      if (isCropMode) {
        setIsCropMode(false);
      } else {
        onDeselect();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("pointerdown", handleOutsidePointer);
    }, 60);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, [targetElement, containerElement, isCropMode, onDeselect]);

  // Track Target Element Position relative to Container
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const updateRect = useCallback(() => {
    if (!targetElement || !containerElement) return;
    const tRect = targetElement.getBoundingClientRect();
    const cRect = containerElement.getBoundingClientRect();
    const unrotatedW = targetElement.offsetWidth || state.width || tRect.width;
    const unrotatedH = targetElement.offsetHeight || state.height || tRect.height;
    const centerXRel = tRect.left + tRect.width / 2 - cRect.left + containerElement.scrollLeft;
    const centerYRel = tRect.top + tRect.height / 2 - cRect.top + containerElement.scrollTop;

    setRect({
      left: centerXRel - unrotatedW / 2,
      top: centerYRel - unrotatedH / 2,
      width: unrotatedW,
      height: unrotatedH,
    });
  }, [targetElement, containerElement, state.width, state.height]);

  useEffect(() => {
    updateRect();
    const interval = setInterval(updateRect, 80);
    window.addEventListener("resize", updateRect);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateRect);
    };
  }, [updateRect]);

  // Pointer Down Handler for Handles / Drag
  const handlePointerDown = (
    e: React.PointerEvent,
    type: "move" | "rotate" | "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w" | "panCrop",
  ) => {
    if (state.isLocked) return;

    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore if pointer capture fails
    }

    const tRect = targetElement.getBoundingClientRect();
    const centerX = tRect.left + tRect.width / 2;
    const centerY = tRect.top + tRect.height / 2;
    const currentImgX =
      parseFloat(targetElement.dataset.x || targetElement.style.left || String(state.x || 0)) || 0;
    const currentImgY =
      parseFloat(targetElement.dataset.y || targetElement.style.top || String(state.y || 0)) || 0;

    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: state.width,
      startHeight: state.height,
      startLeft: rect.left,
      startTop: rect.top,
      startImgX: currentImgX,
      startImgY: currentImgY,
      startRotation: state.rotation,
      centerX,
      centerY,
      startCropPanX: state.cropPanX,
      startCropPanY: state.cropPanY,
    };
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const {
      type,
      startX,
      startY,
      startWidth,
      startHeight,
      startImgX,
      startImgY,
      centerX,
      centerY,
      startCropPanX,
      startCropPanY,
    } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    dragRef.current.lastDx = dx;
    dragRef.current.lastDy = dy;

    if (type === "rotate") {
      const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let deg = Math.round((rad * 180) / Math.PI) + 90;
      if (deg < 0) deg += 360;
      if (deg >= 360) deg -= 360;

      // Soft Magnetic Snap within 3 degrees to cardinal/diagonal angles unless Shift is held
      if (!e.shiftKey) {
        const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const s of snapAngles) {
          if (Math.abs(deg - s) <= 3) {
            deg = s === 360 ? 0 : s;
            break;
          }
        }
      }

      setActiveRotationTooltip(deg);
      applyLive({ ...state, rotation: deg });
      updateRect();
      return;
    }

    if (type === "panCrop") {
      const next = {
        ...state,
        cropPanX: startCropPanX + dx,
        cropPanY: startCropPanY + dy,
      };
      applyLive(next);
      return;
    }

    if (type === "move") {
      const newX = Math.round(startImgX + dx);
      const newY = Math.round(startImgY + dy);

      // Smart Center Guide Check
      const cRect = containerElement.getBoundingClientRect();
      const editorCenterX = cRect.width / 2;
      const currentCenterX = dragRef.current.startLeft + state.width / 2 + dx;

      if (Math.abs(currentCenterX - editorCenterX) <= 6) {
        setSnapGuideX(editorCenterX);
      } else {
        setSnapGuideX(null);
      }

      const nextLayerMode: CanvaLayerMode =
        state.layerMode === "inline" ? "in-front" : state.layerMode || "in-front";
      const next: CanvaImageState = {
        ...state,
        x: newX,
        y: newY,
        layerMode: nextLayerMode,
        freeFlow: true,
      };
      applyLive(next);
      updateRect();
      return;
    }

    // Resizing with Proportional Handling on Corners
    let newW = startWidth;
    let newH = startHeight;
    const isProportional =
      type === "nw" ||
      type === "ne" ||
      type === "se" ||
      type === "sw" ||
      state.shape === "square" ||
      state.shape === "circle" ||
      state.shape === "star" ||
      state.shape === "heart" ||
      state.shape === "hexagon" ||
      state.shape === "diamond";

    const aspectRatio = startWidth / (startHeight || 1);

    if (type === "se") {
      newW = Math.max(40, startWidth + dx);
      newH = isProportional ? newW / aspectRatio : Math.max(40, startHeight + dy);
    } else if (type === "sw") {
      newW = Math.max(40, startWidth - dx);
      newH = isProportional ? newW / aspectRatio : Math.max(40, startHeight + dy);
    } else if (type === "ne") {
      newW = Math.max(40, startWidth + dx);
      newH = isProportional ? newW / aspectRatio : Math.max(40, startHeight - dy);
    } else if (type === "nw") {
      newW = Math.max(40, startWidth - dx);
      newH = isProportional ? newW / aspectRatio : Math.max(40, startHeight - dy);
    } else if (type === "e") {
      newW = Math.max(40, startWidth + dx);
    } else if (type === "w") {
      newW = Math.max(40, startWidth - dx);
    } else if (type === "s") {
      newH = Math.max(40, startHeight + dy);
    } else if (type === "n") {
      newH = Math.max(40, startHeight - dy);
    }

    const next = { ...state, width: Math.round(newW), height: Math.round(newH) };
    applyLive(next);
    updateRect();
  };

  // Pointer Up Handler
  const handlePointerUp = () => {
    if (!dragRef.current) return;
    commitState({ ...state });
    dragRef.current = null;
    setActiveRotationTooltip(null);
    setSnapGuideX(null);
    updateRect();
  };

  // Shape Selection Handler
  const handleSelectShape = (shapeId: CanvaShapeType) => {
    let nextW = state.width;
    let nextH = state.height;

    // Enforce 1:1 ratio for geometric shapes
    if (
      shapeId === "square" ||
      shapeId === "circle" ||
      shapeId === "star" ||
      shapeId === "heart" ||
      shapeId === "hexagon" ||
      shapeId === "diamond"
    ) {
      const minDim = Math.min(nextW, nextH);
      nextW = minDim;
      nextH = minDim;
    }

    const next: CanvaImageState = {
      ...state,
      shape: shapeId,
      width: nextW,
      height: nextH,
    };
    commitState(next);
  };

  // Wheel zoom in Crop Mode
  const handleWheel = (e: React.WheelEvent) => {
    if (!isCropMode) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = Math.min(4.0, Math.max(1.0, state.cropZoom + delta));
    const next = { ...state, cropZoom: parseFloat(newZoom.toFixed(2)) };
    applyLive(next);
  };

  // Touch handlers for mobile pinch-to-zoom in Crop Mode
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isCropMode) {
      // Check double tap
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        setIsCropMode(true);
      }
      lastTapTimeRef.current = now;
      return;
    }

    if (e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      touchDistanceRef.current = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      initialZoomRef.current = state.cropZoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isCropMode && e.touches.length === 2 && touchDistanceRef.current) {
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const factor = dist / touchDistanceRef.current;
      const newZoom = Math.min(4.0, Math.max(1.0, initialZoomRef.current * factor));
      const next = { ...state, cropZoom: parseFloat(newZoom.toFixed(2)) };
      applyLive(next);
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  return (
    <>
      <CanvaSvgMaskDefs />

      {/* Smart Snap Guide Line (Center) */}
      {snapGuideX !== null && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-50 border-l-2 border-dashed border-primary"
          style={{ left: `${snapGuideX}px` }}
        >
          <span className="absolute top-2 left-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
            Centro
          </span>
        </div>
      )}

      {/* Canva Bounding Box & Transformation Frame */}
      <div
        className={`canva-direct-overlay-ui absolute z-40 select-none ${
          state.isLocked
            ? "border-2 border-amber-500/90 cursor-default"
            : isCropMode
              ? "border-2 border-primary"
              : "border-2 border-primary shadow-sm cursor-move"
        } transition-[border-color]`}
        style={{
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          transform: `rotate(${state.rotation}deg)`,
          transformOrigin: "center center",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          if (!isCropMode) {
            handlePointerDown(e, "move");
          }
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsCropMode(true);
        }}
      >
        {/* Layer & Position Status Pill */}
        {!isCropMode && (
          <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
            <Layers className="size-2.5 text-primary" />
            <span>
              {state.layerMode === "behind-text"
                ? "Detrás de letras"
                : state.layerMode === "inline"
                  ? "Con espacio"
                  : "Sobre letras"}
            </span>
            {state.rotation ? <span>• {state.rotation}°</span> : null}
          </div>
        )}

        {/* Floating Rotation Indicator Tooltip */}
        {activeRotationTooltip !== null && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-1 text-xs font-bold text-background shadow-md">
            {activeRotationTooltip}°
          </div>
        )}

        {/* Lock Indicator Badge */}
        {state.isLocked && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <Lock className="size-3" />
            <span>Bloqueado</span>
          </div>
        )}

        {/* CROP MODE OVERLAY: Semi-transparent backdrop showing uncropped photo outside mask */}
        {isCropMode && (
          <div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => handlePointerDown(e, "panCrop")}
            onWheel={handleWheel}
          >
            {/* Ghosted underlying image preview */}
            <div className="absolute -inset-24 pointer-events-none flex items-center justify-center overflow-visible opacity-35 filter grayscale-[20%]">
              <img
                src={imageUrl}
                alt="Encuadre"
                className="max-w-none transition-none"
                style={{
                  width: `${state.width * state.cropZoom}px`,
                  height: `${state.height * state.cropZoom}px`,
                  transform: `translate(${state.cropPanX}px, ${state.cropPanY}px)`,
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Visual Crop Guideline Box */}
            <div className="absolute inset-0 border-2 border-dashed border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 left-0 size-3 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-0 right-0 size-3 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-0 left-0 size-3 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 size-3 border-b-2 border-r-2 border-primary" />
            </div>

            {/* Crop Mode Quick Controller Bar */}
            <div
              className="canva-direct-toolbar absolute -bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 shadow-xl border border-border backdrop-blur-md"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                <ZoomOut className="size-3.5" />
                <input
                  type="range"
                  min="1"
                  max="3.5"
                  step="0.05"
                  value={state.cropZoom}
                  onChange={(e) => {
                    const next = { ...state, cropZoom: parseFloat(e.target.value) };
                    applyLive(next);
                  }}
                  className="h-1.5 w-20 sm:w-28 cursor-pointer accent-primary"
                />
                <ZoomIn className="size-3.5" />
                <span className="min-w-8 text-right font-mono text-[11px] text-foreground">
                  {Math.round(state.cropZoom * 100)}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCropMode(false)}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                <Check className="size-3.5" />
                <span>Listo</span>
              </button>
            </div>
          </div>
        )}

        {/* ROTATION HANDLE (Above Top Edge with connecting stalk) */}
        {!state.isLocked && !isCropMode && (
          <div className="absolute -top-8 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <div
              className="group flex size-6 cursor-grab items-center justify-center rounded-full border-2 border-primary bg-background shadow-md transition-transform hover:scale-110 active:cursor-grabbing"
              title="Arrastra para rotar la imagen libremente"
              onPointerDown={(e) => handlePointerDown(e, "rotate")}
            >
              <RotateCw className="size-3 text-primary group-hover:rotate-45 transition-transform" />
            </div>
            {/* Connecting Hairline */}
            <div className="h-2 w-0.5 bg-primary" />
          </div>
        )}

        {/* 8 RESIZE HANDLES (4 Corners + 4 Sides with 44px touch hit-box) */}
        {!state.isLocked && !isCropMode && (
          <>
            {/* NW Corner */}
            <div
              className="absolute -top-2 -left-2 size-4 cursor-nwse-resize rounded-sm border-2 border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "nw")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* NE Corner */}
            <div
              className="absolute -top-2 -right-2 size-4 cursor-nesw-resize rounded-sm border-2 border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "ne")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* SE Corner */}
            <div
              className="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-sm border-2 border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "se")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* SW Corner */}
            <div
              className="absolute -bottom-2 -left-2 size-4 cursor-nesw-resize rounded-sm border-2 border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "sw")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* N Side */}
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2 w-4 cursor-ns-resize rounded-full border border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "n")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* S Side */}
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2 w-4 cursor-ns-resize rounded-full border border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "s")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* E Side */}
            <div
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-4 w-2 cursor-ew-resize rounded-full border border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "e")}
            >
              <div className="absolute -inset-3" />
            </div>

            {/* W Side */}
            <div
              className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-4 w-2 cursor-ew-resize rounded-full border border-primary bg-background shadow-xs hover:scale-125 transition-transform"
              onPointerDown={(e) => handlePointerDown(e, "w")}
            >
              <div className="absolute -inset-3" />
            </div>
          </>
        )}
      </div>

      {/* DISCREET FLOATING CANVA TOOLBAR (Docked near the bottom or top of the image) */}
      <div
        className="canva-direct-toolbar absolute z-50 flex max-w-[95vw] flex-wrap items-center gap-1.5 rounded-2xl bg-card/95 p-1.5 shadow-2xl border border-border backdrop-blur-md"
        style={{
          left: `${Math.max(10, rect.left)}px`,
          top: `${rect.top + rect.height + 14}px`,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Shape / Mask Picker Chips */}
        <div className="flex items-center gap-1 overflow-x-auto p-0.5 border-r border-border pr-1.5">
          {CANVA_SHAPES.map((shape) => {
            const Icon = shape.icon;
            const isSelected = state.shape === shape.id;
            return (
              <button
                key={shape.id}
                type="button"
                onClick={() => handleSelectShape(shape.id)}
                title={`Aplicar máscara: ${shape.label}`}
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
              </button>
            );
          })}
        </div>

        {/* Recortar (Crop Mode) */}
        <button
          type="button"
          onClick={() => setIsCropMode(!isCropMode)}
          title="Recortar y reencuadrar dentro de la forma (Doble clic)"
          className={`flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold transition-colors ${
            isCropMode
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <Crop className="size-3.5 text-primary" />
          <span className="hidden sm:inline">Recortar</span>
        </button>

        {/* Sin Fondo (Transparente) */}
        <button
          type="button"
          onClick={() => {
            const next = { ...state, transparent: !state.transparent };
            commitState(next);
          }}
          title={
            state.transparent
              ? "Quitar modo sin fondo (volver a borde y fondo estándar)"
              : "Hacer imagen sin fondo (transparente, ideal para logos y stickers)"
          }
          className={`flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold transition-colors ${
            state.transparent
              ? "bg-amber-500 text-white shadow-xs"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <Sparkles className="size-3.5" />
          <span>{state.transparent ? "Sin Fondo ✓" : "Sin Fondo"}</span>
        </button>

        {/* Move Up / Down in Article Text */}
        {(onMoveUp || onMoveDown) && (
          <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                title="Mover arriba (antes del párrafo anterior)"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronUp className="size-4" />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                title="Mover abajo (después del párrafo siguiente)"
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronDown className="size-4" />
              </button>
            )}
          </div>
        )}

        {/* Alignment in Article */}
        {onAlign && (
          <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
            <button
              type="button"
              onClick={() => onAlign("float-left")}
              title="Flotar a la izquierda"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <AlignLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAlign("center")}
              title="Centrar en el texto"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <AlignCenter className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAlign("float-right")}
              title="Flotar a la derecha"
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <AlignRight className="size-3.5" />
            </button>
          </div>
        )}

        {/* Image Link (Clickable Image) */}
        {onOpenLink && (
          <button
            type="button"
            onClick={onOpenLink}
            title="Poner o cambiar enlace a la imagen"
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-foreground hover:bg-muted border-l border-border pl-2"
          >
            <LinkIcon className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Enlace</span>
          </button>
        )}

        {/* Layer Mode Controls: Above Letters / Behind Letters / Inline */}
        <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
          <button
            type="button"
            onClick={() => {
              const next: CanvaImageState = {
                ...state,
                layerMode: "in-front",
                freeFlow: true,
                zIndex: state.zIndex && state.zIndex > 0 ? Math.max(10, state.zIndex) : 10,
              };
              commitState(next);
            }}
            title="Poner por arriba de las letras (Sobre el texto, movible sin restricciones)"
            className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition-colors ${
              (state.layerMode || "in-front") === "in-front"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <ArrowUp className="size-3" />
            <span>Sobre letras</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next: CanvaImageState = {
                ...state,
                layerMode: "behind-text",
                freeFlow: true,
                zIndex: state.zIndex && state.zIndex < 0 ? state.zIndex : -5,
              };
              commitState(next);
            }}
            title="Poner por abajo de las letras (Detrás del texto, las letras se leen encima de la foto)"
            className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition-colors ${
              state.layerMode === "behind-text"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <ArrowDown className="size-3" />
            <span>Detrás de letras</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next: CanvaImageState = {
                ...state,
                layerMode: "inline",
                freeFlow: false,
                x: 0,
                y: 0,
                zIndex: 2,
              };
              commitState(next);
            }}
            title="Modo en bloque con espacio (separa los párrafos arriba y abajo)"
            className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-bold transition-colors ${
              state.layerMode === "inline"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>Con espacio</span>
          </button>
        </div>

        {/* Quick Rotation Controls */}
        <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
          <button
            type="button"
            onClick={() => {
              const nextRot = ((state.rotation || 0) - 90 + 360) % 360;
              commitState({ ...state, rotation: nextRot });
            }}
            title="Rotar -90° a la izquierda"
            className="flex h-7 items-center gap-0.5 rounded-lg px-1.5 text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCw className="size-3 -scale-x-100" />
            <span>-90°</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const nextRot = ((state.rotation || 0) + 90) % 360;
              commitState({ ...state, rotation: nextRot });
            }}
            title="Rotar +90° a la derecha"
            className="flex h-7 items-center gap-0.5 rounded-lg px-1.5 text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCw className="size-3" />
            <span>+90°</span>
          </button>
          {state.rotation !== 0 && (
            <button
              type="button"
              onClick={() => commitState({ ...state, rotation: 0 })}
              title="Restablecer rotación a 0°"
              className="flex h-7 items-center rounded-lg px-1.5 text-[10px] font-bold text-primary hover:bg-primary/10"
            >
              0°
            </button>
          )}
        </div>

        {/* Bring Forward / Send Backward (Between Photos) */}
        {onBringForward && onSendBackward && (
          <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
            <button
              type="button"
              onClick={() => {
                onBringForward();
                if (targetElement && targetElement.tagName === "IMG") {
                  setState(extractCanvaStateFromImgElement(targetElement as HTMLImageElement));
                }
              }}
              title="Subir por arriba de otra foto (Traer al frente)"
              className="flex h-7 items-center gap-1 rounded-lg px-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Layers className="size-3 text-primary" />
              <ArrowUp className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                onSendBackward();
                if (targetElement && targetElement.tagName === "IMG") {
                  setState(extractCanvaStateFromImgElement(targetElement as HTMLImageElement));
                }
              }}
              title="Bajar por debajo de otra foto (Enviar atrás)"
              className="flex h-7 items-center gap-1 rounded-lg px-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Layers className="size-3" />
              <ArrowDown className="size-3" />
            </button>
          </div>
        )}

        {/* Duplicate */}
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicar imagen (Ctrl+D)"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
        )}

        {/* Lock / Unlock */}
        <button
          type="button"
          onClick={() => {
            const next = { ...state, isLocked: !state.isLocked };
            commitState(next);
          }}
          title={state.isLocked ? "Desbloquear posición" : "Bloquear posición"}
          className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
            state.isLocked
              ? "bg-amber-500 text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {state.isLocked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-l border-border pl-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Deshacer (Ctrl+Z)"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Rehacer (Ctrl+Y)"
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <Redo2 className="size-3.5" />
          </button>
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar imagen (Supr / Backspace)"
            className="flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}

        {/* Deselect / Close Overlay Button */}
        <button
          type="button"
          onClick={onDeselect}
          title="Cerrar edición"
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </>
  );
}

/**
 * CanvaDirectImageField
 * Clean, modern in-place Canva image editor component for form inputs (e.g. article cover, sport, tournament)
 */
export interface CanvaDirectImageFieldProps {
  id?: string;
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  aspectRatio?: string;
}

export function CanvaDirectImageField({ id, label, value, onChange }: CanvaDirectImageFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSelected, setIsSelected] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange(dataUrl);
      setIsSelected(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-semibold text-foreground">{label}</label>}

      {value ? (
        <div
          ref={containerRef}
          className="relative min-h-[260px] max-h-[460px] w-full rounded-2xl border border-border bg-muted/20 p-6 flex items-center justify-center overflow-hidden select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Target Image */}
          <img
            ref={imgRef}
            src={value}
            alt={label || "Imagen"}
            referrerPolicy="no-referrer"
            onClick={() => setIsSelected(true)}
            className={`max-h-[360px] max-w-full cursor-pointer transition-all ${
              isSelected ? "ring-2 ring-primary/40" : "hover:brightness-105"
            }`}
            style={{
              borderRadius: "0.75rem",
              objectFit: "cover",
            }}
          />

          {/* Quick Selection Prompt */}
          {!isSelected && isHovered && (
            <div
              onClick={() => setIsSelected(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] cursor-pointer transition-opacity"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-lg">
                <Sparkles className="size-3.5" />
                <span>Haz clic para editar estilo Canva (tamaño, rotar, formas, recorte)</span>
              </span>
            </div>
          )}

          {/* Canva Direct Overlay when Selected */}
          {isSelected && imgRef.current && containerRef.current && (
            <CanvaDirectOverlay
              targetElement={imgRef.current}
              containerElement={containerRef.current}
              imageUrl={value}
              onUpdate={async (newState) => {
                applyCanvaStateToImgElement(imgRef.current!, newState);
                // Export high-res canvas if cropped/masked
                const baked = await renderCanvaImageToDataUrl(value, newState);
                onChange(baked);
              }}
              onDeselect={() => setIsSelected(false)}
              onDelete={() => {
                onChange(null);
                setIsSelected(false);
              }}
            />
          )}

          {/* Floating Actions on Top Right */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-xl bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm border border-border hover:bg-muted"
              title="Reemplazar imagen"
            >
              <Upload className="size-3" />
              <span>Cambiar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setIsSelected(false);
              }}
              className="flex items-center gap-1 rounded-xl bg-destructive/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-destructive"
              title="Quitar imagen"
            >
              <Trash2 className="size-3" />
              <span>Quitar</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Haz clic para subir o arrastra una imagen
            </p>
            <p className="text-xs text-muted-foreground">
              Edición visual directa estilo Canva con máscaras y recorte
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
