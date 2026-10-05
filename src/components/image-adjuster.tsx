import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  RotateCw,
  RotateCcw,
  Move,
  RefreshCw,
  Check,
  X,
  Crop,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImageAdjusterProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (adjustedDataUrl: string) => void;
  title?: string;
  defaultAspectRatio?: AspectRatioOption;
  saveLabel?: string;
}

type AspectRatioOption = "16:9" | "4:3" | "1:1" | "original";

export function ImageAdjuster({
  isOpen,
  onClose,
  imageUrl,
  onSave,
  title = "Ajustar Imagen (Estilo Canvas)",
  defaultAspectRatio = "original",
  saveLabel = "Guardar y Aplicar",
}: ImageAdjusterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Transformation states
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees
  const [position, setPosition] = useState({ x: 0, y: 0 }); // offset in px from frame center

  // Aspect ratio for the crop frame
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(defaultAspectRatio);

  // Active interaction mode
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionType, setInteractionType] = useState<"move" | "resize" | "rotate" | null>(null);
  const [activeCorner, setActiveCorner] = useState<string | null>(null);

  // Stage container dimensions (measured dynamically)
  const [stageSize, setStageSize] = useState({ width: 660, height: 420 });

  // Loaded image ref
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 1, height: 1 });

  // Interaction tracking ref to avoid stale closures
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPos: { x: number; y: number };
    startScale: number;
    startRot: number;
    startDist: number;
    screenCenterX: number;
    screenCenterY: number;
  }>({
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
    startScale: 1,
    startRot: 0,
    startDist: 0,
    screenCenterX: 0,
    screenCenterY: 0,
  });

  // Observe stage container size
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          setStageSize({
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    };

    // Immediate and delayed measurement for modal animation
    measure();
    const timer = setTimeout(measure, 100);

    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isOpen]);

  // Reset & load image when opened
  useEffect(() => {
    if (isOpen && imageUrl) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setAspectRatio(defaultAspectRatio);
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imgRef.current = img;
        setImgNaturalSize({ width: img.width, height: img.height });
        setImageLoaded(true);
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl, defaultAspectRatio]);

  // Frame calculation based on selected aspect ratio & stage size
  const frame = useMemo(() => {
    const padding = 32;
    const maxW = Math.max(100, stageSize.width - padding * 2);
    const maxH = Math.max(100, stageSize.height - padding * 2);

    let targetRatio = 16 / 9;
    if (aspectRatio === "4:3") targetRatio = 4 / 3;
    else if (aspectRatio === "1:1") targetRatio = 1;
    else if (aspectRatio === "original" && imgNaturalSize.height > 0) {
      targetRatio = imgNaturalSize.width / imgNaturalSize.height;
    }

    let w = maxW;
    let h = w / targetRatio;

    if (h > maxH) {
      h = maxH;
      w = h * targetRatio;
    }

    w = Math.round(w);
    h = Math.round(h);

    const left = Math.round((stageSize.width - w) / 2);
    const top = Math.round((stageSize.height - h) / 2);

    return { width: w, height: h, left, top };
  }, [stageSize, aspectRatio, imgNaturalSize]);

  // Base image size calculation to comfortably cover the frame initially
  const imageBaseSize = useMemo(() => {
    const imgAspect = imgNaturalSize.width / imgNaturalSize.height || 1;
    const frameAspect = frame.width / frame.height;

    let baseW = frame.width;
    let baseH = frame.width / imgAspect;

    if (imgAspect > frameAspect) {
      // Image is wider than frame
      baseH = frame.height;
      baseW = frame.height * imgAspect;
    }

    return {
      width: Math.round(baseW),
      height: Math.round(baseH),
    };
  }, [frame, imgNaturalSize]);

  // Current image on-screen size & center position
  const currentW = Math.round(imageBaseSize.width * scale);
  const currentH = Math.round(imageBaseSize.height * scale);
  const imageCenterX = Math.round(stageSize.width / 2 + position.x);
  const imageCenterY = Math.round(stageSize.height / 2 + position.y);

  // Redraw canvas whenever transforms or frame changes
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = stageSize.width;
    canvas.height = stageSize.height;

    // Clear background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw workspace canvas background (dark slate with subtle grid)
    ctx.fillStyle = "#0b101b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 24;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 2. Draw the image with smooth interpolation
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(imageCenterX, imageCenterY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -currentW / 2, -currentH / 2, currentW, currentH);
    ctx.restore();

    // 3. Draw crop frame overlay (darkened area outside of frame)
    ctx.save();
    ctx.fillStyle = "rgba(4, 7, 15, 0.68)";

    // Top outer
    ctx.fillRect(0, 0, canvas.width, frame.top);
    // Bottom outer
    ctx.fillRect(
      0,
      frame.top + frame.height,
      canvas.width,
      canvas.height - (frame.top + frame.height),
    );
    // Left outer
    ctx.fillRect(0, frame.top, frame.left, frame.height);
    // Right outer
    ctx.fillRect(
      frame.left + frame.width,
      frame.top,
      canvas.width - (frame.left + frame.width),
      frame.height,
    );

    // Frame border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(frame.left, frame.top, frame.width, frame.height);

    // Rule of thirds guidelines inside frame
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    const thirdW = frame.width / 3;
    const thirdH = frame.height / 3;

    ctx.beginPath();
    ctx.moveTo(frame.left + thirdW, frame.top);
    ctx.lineTo(frame.left + thirdW, frame.top + frame.height);
    ctx.moveTo(frame.left + thirdW * 2, frame.top);
    ctx.lineTo(frame.left + thirdW * 2, frame.top + frame.height);

    ctx.moveTo(frame.left, frame.top + thirdH);
    ctx.lineTo(frame.left + frame.width, frame.top + thirdH);
    ctx.moveTo(frame.left, frame.top + thirdH * 2);
    ctx.lineTo(frame.left + frame.width, frame.top + thirdH * 2);
    ctx.stroke();

    ctx.restore();
  }, [stageSize, imageLoaded, imageCenterX, imageCenterY, currentW, currentH, rotation, frame]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Helper to compute center on screen
  const getScreenCenter = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.left + imageCenterX,
      y: rect.top + imageCenterY,
    };
  };

  // 1. Move image (click and drag inside image or anywhere on stage)
  const handleStartMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsInteracting(true);
    setInteractionType("move");

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...position },
      startScale: scale,
      startRot: rotation,
      startDist: 0,
      screenCenterX: 0,
      screenCenterY: 0,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 2. Resize with corner dots (like Canva / Figma handles)
  const handleStartResize = (e: React.PointerEvent, corner: string) => {
    e.stopPropagation();
    setIsInteracting(true);
    setInteractionType("resize");
    setActiveCorner(corner);

    const center = getScreenCenter();
    const dist = Math.hypot(e.clientX - center.x, e.clientY - center.y);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...position },
      startScale: scale,
      startRot: rotation,
      startDist: Math.max(20, dist),
      screenCenterX: center.x,
      screenCenterY: center.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 3. Rotate with top rotation handle
  const handleStartRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsInteracting(true);
    setInteractionType("rotate");

    const center = getScreenCenter();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...position },
      startScale: scale,
      startRot: rotation,
      startDist: 0,
      screenCenterX: center.x,
      screenCenterY: center.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Global pointer move handler when capturing
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteracting) return;

    if (interactionType === "move") {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: Math.round(dragRef.current.startPos.x + dx),
        y: Math.round(dragRef.current.startPos.y + dy),
      });
    } else if (interactionType === "resize") {
      const currentDist = Math.hypot(
        e.clientX - dragRef.current.screenCenterX,
        e.clientY - dragRef.current.screenCenterY,
      );
      const ratio = currentDist / dragRef.current.startDist;
      // Allow shrinking down to 5% (much smaller than normal) and up to 1000% (much larger)
      const newScale = Math.max(0.05, Math.min(10, dragRef.current.startScale * ratio));
      setScale(Number(newScale.toFixed(3)));
    } else if (interactionType === "rotate") {
      const angleRad = Math.atan2(
        e.clientY - dragRef.current.screenCenterY,
        e.clientX - dragRef.current.screenCenterX,
      );
      let deg = (angleRad * 180) / Math.PI + 90;
      deg = (deg + 360) % 360;

      // Magnetic snap to cardinal angles within 3.5 degrees
      const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
      for (const snap of snapAngles) {
        if (Math.abs(deg - snap) < 3.5) {
          deg = snap % 360;
          break;
        }
      }
      setRotation(Math.round(deg));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsInteracting(false);
    setInteractionType(null);
    setActiveCorner(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Optional mouse wheel to zoom smoothly
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setScale((prev) => Math.min(Math.max(0.05, Number((prev + delta).toFixed(3))), 10));
  };

  // Quick Action: Center image
  const handleCenterImage = () => {
    setPosition({ x: 0, y: 0 });
  };

  // Quick Action: Fill frame completely
  const handleFillFrame = () => {
    const scaleToCover = Math.max(
      frame.width / imageBaseSize.width,
      frame.height / imageBaseSize.height,
    );
    setScale(Number(scaleToCover.toFixed(3)));
    setPosition({ x: 0, y: 0 });
  };

  // Quick Action: Fit entire image inside frame
  const handleFitFrame = () => {
    const scaleToFit = Math.min(
      frame.width / imageBaseSize.width,
      frame.height / imageBaseSize.height,
    );
    setScale(Number(scaleToFit.toFixed(3)));
    setPosition({ x: 0, y: 0 });
  };

  // Quick Action: Rotate 90 degrees
  const handleRotate90 = (deg: number) => {
    setRotation((prev) => (prev + deg + 360) % 360);
  };

  // Reset all transforms
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Save the cropped & adjusted image high-resolution export
  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;

    // High resolution export proportional to the frame
    const exportWidth = 1280;
    const exportHeight = Math.round(exportWidth / (frame.width / frame.height));

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Scale factor from screen frame to high-res export
    const factor = exportWidth / frame.width;

    // Background fill
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Position relative to frame center
    const exportCenterX = exportWidth / 2 + position.x * factor;
    const exportCenterY = exportHeight / 2 + position.y * factor;

    ctx.translate(exportCenterX, exportCenterY);
    ctx.rotate((rotation * Math.PI) / 180);

    const exportImgW = currentW * factor;
    const exportImgH = currentH * factor;

    ctx.drawImage(img, -exportImgW / 2, -exportImgH / 2, exportImgW, exportImgH);
    ctx.restore();

    try {
      const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.85);
      onSave(dataUrl);
      onClose();
    } catch (err) {
      console.error("Export canvas error:", err);
      // Fallback export
      const fallbackUrl = canvasRef.current?.toDataURL("image/jpeg", 0.85);
      if (fallbackUrl) onSave(fallbackUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        id="image-adjuster-modal"
        className="max-w-3xl rounded-2xl p-0 overflow-hidden bg-card border-border shadow-2xl"
      >
        {/* Header with Title & Aspect Ratio Options */}
        <DialogHeader className="p-4 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Crop className="size-4 text-primary" />
            <span>{title}</span>
          </DialogTitle>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground px-2">Marco:</span>
            <button
              type="button"
              onClick={() => setAspectRatio("16:9")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                aspectRatio === "16:9"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              16:9 Banner
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio("4:3")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                aspectRatio === "4:3"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              4:3
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio("1:1")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                aspectRatio === "1:1"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              1:1
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio("original")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                aspectRatio === "original"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Original
            </button>
          </div>
        </DialogHeader>

        {/* Workspace Canvas Stage */}
        <div className="p-4 space-y-3">
          <div
            ref={containerRef}
            id="canvas-stage-container"
            className="relative w-full h-80 sm:h-96 md:h-[420px] rounded-xl overflow-hidden border border-border/80 select-none shadow-inner touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={handleStartMove}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Real-time instruction badge */}
            <div className="absolute top-3 left-3 z-30 pointer-events-none bg-slate-900/80 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md flex items-center gap-2 shadow-lg">
              <span className="size-2 rounded-full bg-blue-400 animate-ping" />
              <span>
                Arrastra los <b>puntos azules</b> en las esquinas para agrandar o achicar · Mueve la
                imagen libremente
              </span>
            </div>

            {/* Current scale/rotation pill */}
            <div className="absolute top-3 right-3 z-30 pointer-events-none bg-slate-900/80 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-md shadow-lg flex items-center gap-2">
              <span>{Math.round(scale * 100)}%</span>
              {rotation !== 0 && <span className="text-blue-400">· {rotation}°</span>}
            </div>

            {/* Background Canvas (Draws image & frame mask) */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Interactive Transform Bounding Box (Like Canva / Figma) */}
            {imageLoaded && (
              <div
                style={{
                  position: "absolute",
                  left: `${imageCenterX}px`,
                  top: `${imageCenterY}px`,
                  width: `${currentW}px`,
                  height: `${currentH}px`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  pointerEvents: "auto",
                }}
                className={`group border-2 transition-colors ${
                  isInteracting && interactionType === "resize"
                    ? "border-blue-400 border-dashed"
                    : "border-blue-500 hover:border-blue-400"
                } shadow-sm`}
                onPointerDown={handleStartMove}
                title="Arrastra para mover la imagen a cualquier posición"
              >
                {/* Moving grip area */}
                <div className="absolute inset-0 cursor-move" />

                {/* 1. Top Rotation Handle Stem & Knob */}
                <div
                  className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto"
                  onPointerDown={handleStartRotate}
                  title="Arrastra para rotar la imagen"
                >
                  <div className="size-5 rounded-full bg-white border-2 border-blue-600 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-125 transition-transform">
                    <RotateCw className="size-3 text-blue-600" />
                  </div>
                  <div className="w-0.5 h-2.5 bg-blue-500" />
                </div>

                {/* 2. Four Corner Resize Dots (Puntos de control) */}
                {/* Top-Left */}
                <div
                  id="handle-nw"
                  className="absolute -top-2.5 -left-2.5 size-5 rounded-full bg-white border-2 border-blue-600 shadow-lg cursor-nwse-resize hover:scale-130 active:scale-110 transition-transform flex items-center justify-center pointer-events-auto z-20 group-hover:ring-4 group-hover:ring-blue-400/30"
                  onPointerDown={(e) => handleStartResize(e, "nw")}
                  title="Haz clic y arrastra para cambiar tamaño"
                >
                  <div className="size-1.5 rounded-full bg-blue-600" />
                </div>

                {/* Top-Right */}
                <div
                  id="handle-ne"
                  className="absolute -top-2.5 -right-2.5 size-5 rounded-full bg-white border-2 border-blue-600 shadow-lg cursor-nesw-resize hover:scale-130 active:scale-110 transition-transform flex items-center justify-center pointer-events-auto z-20 group-hover:ring-4 group-hover:ring-blue-400/30"
                  onPointerDown={(e) => handleStartResize(e, "ne")}
                  title="Haz clic y arrastra para cambiar tamaño"
                >
                  <div className="size-1.5 rounded-full bg-blue-600" />
                </div>

                {/* Bottom-Right */}
                <div
                  id="handle-se"
                  className="absolute -bottom-2.5 -right-2.5 size-5 rounded-full bg-white border-2 border-blue-600 shadow-lg cursor-nwse-resize hover:scale-130 active:scale-110 transition-transform flex items-center justify-center pointer-events-auto z-20 group-hover:ring-4 group-hover:ring-blue-400/30"
                  onPointerDown={(e) => handleStartResize(e, "se")}
                  title="Haz clic y arrastra para cambiar tamaño"
                >
                  <div className="size-1.5 rounded-full bg-blue-600" />
                </div>

                {/* Bottom-Left */}
                <div
                  id="handle-sw"
                  className="absolute -bottom-2.5 -left-2.5 size-5 rounded-full bg-white border-2 border-blue-600 shadow-lg cursor-nesw-resize hover:scale-130 active:scale-110 transition-transform flex items-center justify-center pointer-events-auto z-20 group-hover:ring-4 group-hover:ring-blue-400/30"
                  onPointerDown={(e) => handleStartResize(e, "sw")}
                  title="Haz clic y arrastra para cambiar tamaño"
                >
                  <div className="size-1.5 rounded-full bg-blue-600" />
                </div>

                {/* 3. Mid-Edge Helper Dots */}
                {/* Top Center */}
                <div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3.5 rounded-full bg-white border border-blue-500 shadow cursor-ns-resize hover:scale-125 transition-transform flex items-center justify-center pointer-events-auto"
                  onPointerDown={(e) => handleStartResize(e, "n")}
                />
                {/* Bottom Center */}
                <div
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3.5 rounded-full bg-white border border-blue-500 shadow cursor-ns-resize hover:scale-125 transition-transform flex items-center justify-center pointer-events-auto"
                  onPointerDown={(e) => handleStartResize(e, "s")}
                />
                {/* Left Center */}
                <div
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 size-3.5 rounded-full bg-white border border-blue-500 shadow cursor-ew-resize hover:scale-125 transition-transform flex items-center justify-center pointer-events-auto"
                  onPointerDown={(e) => handleStartResize(e, "w")}
                />
                {/* Right Center */}
                <div
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 size-3.5 rounded-full bg-white border border-blue-500 shadow cursor-ew-resize hover:scale-125 transition-transform flex items-center justify-center pointer-events-auto"
                  onPointerDown={(e) => handleStartResize(e, "e")}
                />
              </div>
            )}
          </div>

          {/* Canvas Toolbar (Replaces the bulky slider bar with intuitive direct action buttons) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-border/70 bg-muted/25">
            {/* Quick scale status and fine +/- */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mr-1">
                <ZoomIn className="size-3.5 text-primary" />
                <span>Tamaño:</span>
              </span>
              <button
                type="button"
                onClick={() => setScale((prev) => Math.max(0.05, Number((prev - 0.1).toFixed(2))))}
                className="size-7 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted text-xs font-bold transition-colors"
                title="Reducir un 10%"
              >
                -
              </button>
              <div className="px-2 py-0.5 rounded-md bg-card border border-border/80 text-xs font-mono font-bold min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </div>
              <button
                type="button"
                onClick={() => setScale((prev) => Math.min(10, Number((prev + 0.1).toFixed(2))))}
                className="size-7 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted text-xs font-bold transition-colors"
                title="Aumentar un 10%"
              >
                +
              </button>
            </div>

            {/* Quick Presets & Fit Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCenterImage}
                className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg"
                title="Centrar imagen en el marco"
              >
                <Move className="size-3 text-primary" />
                <span>Centrar</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillFrame}
                className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg"
                title="Llenar todo el marco sin dejar bordes vacíos"
              >
                <Maximize2 className="size-3 text-blue-600" />
                <span>Llenar marco</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFitFrame}
                className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg"
                title="Ajustar imagen completa dentro del marco"
              >
                <Minimize2 className="size-3 text-amber-600" />
                <span>Ajustar dentro</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRotate90(90)}
                className="h-7 px-2 text-xs font-semibold gap-1 rounded-lg"
                title="Girar 90°"
              >
                <RotateCw className="size-3 text-emerald-600" />
                <span>90°</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-xs font-semibold gap-1 rounded-lg text-muted-foreground hover:text-foreground"
                title="Restablecer todos los cambios"
              >
                <RefreshCw className="size-3" />
                <span>Restablecer</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex flex-row items-center justify-between gap-2 sm:justify-between">
          <Button
            id="cancel-image-adjust"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs font-bold"
          >
            <X className="size-3.5 mr-1" />
            Cancelar
          </Button>

          <Button
            id="save-image-adjust"
            onClick={handleSave}
            className="rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md gap-1.5 hover:bg-primary/90"
          >
            <Check className="size-4" />
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
