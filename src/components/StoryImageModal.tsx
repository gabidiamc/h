import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Link2,
  Sparkles,
  Camera,
  Check,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  Crown,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { fileToOptimizedImage } from "../lib/imageUpload";
import { INITIAL_HOMEPAGE_CONFIG } from "../data/initialData";

interface StoryImageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_STORY_IMAGES = [
  {
    label: "Artesana con Ramo Rojo",
    url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Ramo de Rosas de Listón",
    url: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Taller & Creación Manual",
    url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Rosas Satinadas Rosa Pastel",
    url: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Detalle de Pétalos & Lazo",
    url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Regalo Romántico Elegante",
    url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
  },
];

export const StoryImageModal: React.FC<StoryImageModalProps> = ({ isOpen, onClose }) => {
  const { homepageConfig, updateHomepageConfig, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<"upload" | "url" | "presets">("upload");
  const [currentUrl, setCurrentUrl] = useState<string>(
    homepageConfig.aboutUs?.imageUrl || INITIAL_HOMEPAGE_CONFIG.aboutUs.imageUrl,
  );
  const [inputUrl, setInputUrl] = useState<string>(
    homepageConfig.aboutUs?.imageUrl || INITIAL_HOMEPAGE_CONFIG.aboutUs.imageUrl,
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).");
      return;
    }
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const optimized = await fileToOptimizedImage(file);
      setCurrentUrl(optimized);
      setInputUrl(optimized);
    } catch (err) {
      console.error(err);
      setErrorMessage("No se pudo procesar la imagen seleccionada. Intenta con otra.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) {
      setErrorMessage("Ingresa un enlace de imagen válido.");
      return;
    }
    setErrorMessage(null);
    setCurrentUrl(inputUrl.trim());
  };

  const handleSave = () => {
    if (!currentUrl.trim()) {
      setErrorMessage("Selecciona o ingresa una imagen.");
      return;
    }

    updateHomepageConfig({
      aboutUs: {
        ...homepageConfig.aboutUs,
        imageUrl: currentUrl.trim(),
      },
    });

    showToast({
      title: "Foto de Historia Actualizada ✨",
      subtitle:
        "La imagen de 'Hecho con pasión por Monse' se actualizó correctamente en la tienda.",
    });

    onClose();
  };

  const handleResetToDefault = () => {
    const defaultUrl = INITIAL_HOMEPAGE_CONFIG.aboutUs.imageUrl;
    setCurrentUrl(defaultUrl);
    setInputUrl(defaultUrl);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-xs">
              <Crown className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                  Cambiar Foto de Historia
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 uppercase tracking-wider">
                  Dueña
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                Sección:{" "}
                <strong className="text-white font-medium">Hecho con pasión por Monse</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 ml-2 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Grid Preview + Control */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            {/* Live Preview Column */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                Vista previa en página
              </span>
              <div className="w-full max-w-[220px] aspect-4/5 rounded-2xl overflow-hidden shadow-md border-2 border-rose-200 bg-stone-100 relative group flex items-center justify-center p-1.5">
                {currentUrl ? (
                  <img
                    src={currentUrl}
                    alt="Vista previa de la artesana"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-center p-4 text-stone-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-1 stroke-1" />
                    <span className="text-xs">Sin imagen</span>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2 rounded-xl">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    <span>Optimizando foto...</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-stone-400 text-center mt-2">
                Formato vertical (4:5) recomendado
              </p>
            </div>

            {/* Selector Options Column */}
            <div className="sm:col-span-7 space-y-4">
              {/* Tabs */}
              <div className="flex p-1 bg-stone-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "upload"
                      ? "bg-white text-stone-900 shadow-2xs font-bold"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "url"
                      ? "bg-white text-stone-900 shadow-2xs font-bold"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Enlace URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("presets")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === "presets"
                      ? "bg-white text-stone-900 shadow-2xs font-bold"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Catálogo</span>
                </button>
              </div>

              {/* Tab 1: Upload from device */}
              {activeTab === "upload" && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-rose-500 bg-rose-50/70 scale-[0.99]"
                        : "border-stone-300 hover:border-rose-400 hover:bg-rose-50/30 bg-stone-50/60"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center mb-2 shadow-2xs">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-stone-800">
                      Toca aquí para seleccionar una foto
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      o arrastra un archivo desde tu galería o cámara
                    </p>
                    <span className="inline-block mt-3 px-3 py-1 bg-white border border-stone-200 rounded-lg text-[10px] font-semibold text-stone-600 shadow-2xs">
                      JPG, PNG, WebP de cualquier tamaño
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: URL input */}
              {activeTab === "url" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Dirección Web (URL) de la imagen:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="https://ejemplo.com/foto-artesana.jpg"
                        className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Puedes pegar un enlace directo de Cloudinary, Unsplash, Google Fotos o tu propio
                    servidor.
                  </p>
                </div>
              )}

              {/* Tab 3: Presets */}
              {activeTab === "presets" && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-600 font-medium">
                    Elige una imagen seleccionada para el taller:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {PRESET_STORY_IMAGES.map((preset, index) => {
                      const isSelected = currentUrl === preset.url;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setCurrentUrl(preset.url);
                            setInputUrl(preset.url);
                          }}
                          className={`relative p-1.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? "border-rose-600 bg-rose-50/70 ring-2 ring-rose-500/30"
                              : "border-stone-200 hover:border-rose-300 hover:bg-stone-50 bg-white"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="block text-[11px] font-bold text-stone-800 truncate">
                              {preset.label}
                            </span>
                            {isSelected && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700">
                                <Check className="w-2.5 h-2.5" /> Seleccionada
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reset helper */}
              <div className="pt-1 flex items-center justify-between border-t border-stone-100 text-xs">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-stone-500 hover:text-stone-800 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer imagen inicial</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 sm:px-6 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Imagen en Portada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
