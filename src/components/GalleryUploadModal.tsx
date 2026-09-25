import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Link2,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
  Tag,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { fileToOptimizedImage } from "../lib/imageUpload";

interface GalleryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GalleryUploadModal: React.FC<GalleryUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addGalleryItem, showToast } = useApp();

  const [mode, setMode] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Ramos");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = ["Ramos", "Parejas", "Graduaciones", "Cumpleaños", "Personalizados"];

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, etc.).");
      return;
    }
    setError(null);
    setIsProcessingImage(true);
    try {
      const optimized = await fileToOptimizedImage(file);
      setImageUrl(optimized);
    } catch (err: unknown) {
      console.error(err);
      setError("No se pudo procesar la imagen seleccionada. Intenta con otra.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError("Por favor selecciona o sube una imagen para la galería.");
      return;
    }
    if (!title.trim()) {
      setError("Por favor ingresa un título descriptivo para la foto.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Format date nicely if ISO (e.g. "2025-05-10" -> "Mayo 2025" or the full date)
      let formattedDate = date;
      try {
        const parts = date.split("-");
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          formattedDate = d.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        }
      } catch {
        formattedDate = date;
      }

      addGalleryItem({
        title: title.trim(),
        category,
        imageUrl: imageUrl.trim(),
        description: description.trim() || undefined,
        date: formattedDate,
      });

      showToast({
        title: "🌸 ¡Fotografía agregada a la Galería!",
        subtitle: `"${title.trim()}" ya está visible para todos nuestros clientes.`,
        imageUrl: imageUrl.trim(),
      });

      // Reset form
      setImageUrl("");
      setTitle("");
      setDescription("");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError("Hubo un error al guardar la foto. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-900 via-rose-800 to-stone-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-rose-100 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-xl bg-rose-500/20 text-rose-200 border border-rose-400/30">
              <Sparkles className="w-4 h-4 text-rose-300" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-200">
              Galería Hecho por Monce
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
            Subir Foto a la Galería
          </h2>
          <p className="text-xs text-rose-100/80 mt-1">
            Comparte fotos de ramos entregados, arreglos personalizados y momentos especiales.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher: Device vs URL */}
          <div className="flex items-center rounded-2xl bg-stone-100 p-1 border border-stone-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("file")}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "file"
                  ? "bg-white text-rose-950 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <UploadCloud className="w-4 h-4 text-rose-600" />
              <span>Desde mi Dispositivo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === "url"
                  ? "bg-white text-rose-950 shadow-xs font-bold"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Link2 className="w-4 h-4 text-stone-500" />
              <span>Pegar Enlace URL</span>
            </button>
          </div>

          {/* Image Upload Zone / URL input */}
          {mode === "file" ? (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="gallery-file-input"
              />

              {imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-rose-200 bg-stone-50 aspect-4/3 sm:aspect-16/10 flex items-center justify-center group">
                  <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-stone-900 rounded-xl text-xs font-bold hover:bg-stone-100 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Cambiar foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Foto lista</span>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? "border-rose-500 bg-rose-50/70 scale-[0.99]"
                      : "border-stone-300 hover:border-rose-400 bg-stone-50/60 hover:bg-rose-50/20"
                  }`}
                >
                  {isProcessingImage ? (
                    <div className="py-4 flex flex-col items-center gap-2 text-rose-700">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-bold">Optimizando fotografía...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-700 flex items-center justify-center shadow-xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-stone-800">
                          Toca para elegir una foto de tu dispositivo
                        </p>
                        <p className="text-[11px] text-stone-500">
                          O arrastra y suelta tu archivo aquí (JPG, PNG, WEBP)
                        </p>
                      </div>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
                        <ImageIcon className="w-3 h-3" />
                        <span>Se optimiza automáticamente para carga ultra rápida</span>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">URL de la Imagen Web</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto-ramo.jpg"
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-rose-500"
                />
              </div>
              {imageUrl && (
                <div className="relative rounded-xl overflow-hidden border border-stone-200 aspect-16/9 bg-stone-50 flex items-center justify-center max-h-36">
                  <img
                    src={imageUrl}
                    alt="Vista previa URL"
                    className="w-full h-full object-cover"
                    onError={() => setError("No se pudo cargar la imagen desde la URL ingresada.")}
                  />
                </div>
              )}
            </div>
          )}

          {/* Title input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              Título de la Fotografía o Ramo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Ramo Buchón de 100 Rosas Rojas con Tiara"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Category and Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-rose-600" />
                <span>Categoría</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>Fecha</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:border-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Description (optional) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              Descripción o Detalles Artesanales (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Confeccionado con listón de seda roja, mariposas doradas y corona de perlas."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-rose-500 resize-none transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessingImage || !imageUrl}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-800 hover:to-rose-900 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publicar en Galería</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
