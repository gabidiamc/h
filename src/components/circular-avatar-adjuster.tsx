import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  RefreshCw,
  Check,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FileUploadInput } from "@/components/file-upload-input";

interface CircularAvatarAdjusterProps {
  avatarUrl: string;
  onChangeAvatarUrl: (url: string) => void;
  scale: number;
  onChangeScale: (scale: number) => void;
  offsetX: number;
  onChangeOffsetX: (x: number) => void;
  offsetY: number;
  onChangeOffsetY: (y: number) => void;
  rotate: number;
  onChangeRotate: (rotate: number) => void;
}

export function CircularAvatarAdjuster({
  avatarUrl,
  onChangeAvatarUrl,
  scale,
  onChangeScale,
  offsetX,
  onChangeOffsetX,
  offsetY,
  onChangeOffsetY,
  rotate,
  onChangeRotate,
}: CircularAvatarAdjusterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialOffsets, setInitialOffsets] = useState({ x: 0, y: 0 });

  // Handle Drag / Pan inside the circular viewport
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!avatarUrl) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialOffsets({ x: offsetX, y: offsetY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Convert pixel delta to percentage offset (roughly proportional to 120px viewport)
    const newX = Math.round(initialOffsets.x + (deltaX / 120) * 100);
    const newY = Math.round(initialOffsets.y + (deltaY / 120) * 100);

    // Limit offset to reasonable bounds
    onChangeOffsetX(Math.max(-100, Math.min(100, newX)));
    onChangeOffsetY(Math.max(-100, Math.min(100, newY)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleRotateCw = () => {
    const next = (rotate + 90) % 360;
    onChangeRotate(next);
  };

  const handleResetTransforms = () => {
    onChangeScale(1);
    onChangeOffsetX(0);
    onChangeOffsetY(0);
    onChangeRotate(0);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
      {/* Upload or change URL */}
      <FileUploadInput
        value={avatarUrl}
        onChange={onChangeAvatarUrl}
        label="Foto de perfil (Redonda)"
        helperText="Sube una foto desde tu dispositivo o pega un enlace de imagen"
        placeholder="https://... o selecciona archivo"
        accept="image/*"
      />

      {avatarUrl ? (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-6 rounded-xl border border-border/80 bg-card p-4">
          {/* Interactive Circular Preview */}
          <div className="flex flex-col items-center gap-2">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative size-32 shrink-0 cursor-grab overflow-hidden rounded-full border-4 border-primary/30 bg-muted shadow-md select-none touch-none ${
                isDragging ? "cursor-grabbing border-primary" : ""
              }`}
              title="Arrastra con el ratón o dedo para reubicar la imagen"
            >
              <img
                src={avatarUrl}
                alt="Vista previa circular"
                draggable={false}
                className="size-full object-cover pointer-events-none transition-transform duration-75"
                style={{
                  transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale}) rotate(${rotate}deg)`,
                  transformOrigin: "center center",
                }}
              />
              <div className="absolute inset-0 grid place-items-center bg-black/0 hover:bg-black/10 transition-colors pointer-events-none">
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100">
                  Arrastrar
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Move className="size-3" /> Arrastra para encuadrar
            </span>
          </div>

          {/* Direct Controls: Zoom slider, Rotate, Reset */}
          <div className="flex-1 w-full space-y-3">
            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1">
                  <ZoomIn className="size-3.5 text-primary" /> Tamaño / Zoom:{" "}
                  {Math.round(scale * 100)}%
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-1.5 text-[11px]"
                    onClick={() => onChangeScale(Math.max(0.5, Number((scale - 0.1).toFixed(2))))}
                  >
                    -
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-1.5 text-[11px]"
                    onClick={() => onChangeScale(Math.min(3, Number((scale + 0.1).toFixed(2))))}
                  >
                    +
                  </Button>
                </div>
              </div>
              <Slider
                value={[scale]}
                min={0.5}
                max={2.5}
                step={0.05}
                onValueChange={([val]) => onChangeScale(val)}
                className="py-1"
              />
            </div>

            {/* Rotation & Position Details */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs"
                onClick={handleRotateCw}
              >
                <RotateCw className="size-3.5 text-primary" />
                <span>Rotar ({rotate}°)</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                onClick={handleResetTransforms}
              >
                <RefreshCw className="size-3.5" />
                <span>Centrar</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-xs text-muted-foreground">
          <ImageIcon className="size-4" />
          <span>Sube una imagen para habilitar el encuadre circular interactivo</span>
        </div>
      )}
    </div>
  );
}
