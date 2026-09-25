import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Upload,
  X,
  Calendar,
  DollarSign,
  Palette,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Heart,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { CustomRequestFile } from "../types";

interface CustomRequestViewProps {
  onOpenAuth: () => void;
}

export const CustomRequestView: React.FC<CustomRequestViewProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    submitCustomRequest,
    checkDateAvailability,
    setActiveTab,
    products,
  } = useApp();

  const [projectTitle, setProjectTitle] = useState("");
  const [productType, setProductType] = useState("Ramo buchón de rosas de listón");
  const isPeluche =
    productType.toLowerCase().includes("peluche") || productType.toLowerCase().includes("amigurumi");
  const [description, setDescription] = useState("");
  const [desiredColors, setDesiredColors] = useState("");
  const [theme, setTheme] = useState("");
  const [approximateBudget, setApproximateBudget] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [desiredTimeSlot, setDesiredTimeSlot] = useState("12:00 PM - 2:00 PM");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Files
  const [files, setFiles] = useState<CustomRequestFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Submission result
  const [submittedRequestTracking, setSubmittedRequestTracking] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = e.target.files;
    if (!selected) return;

    if (files.length + selected.length > 5) {
      setFileError("Puedes subir un máximo de 5 imágenes de inspiración.");
      return;
    }

    Array.from(selected).forEach((file: File) => {
      if (!file.type.startsWith("image/")) {
        setFileError("Solo se permiten archivos de imagen (JPG, PNG, WEBP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`La imagen "${file.name}" supera el tamaño máximo permitido de 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFiles((prev) => [
          ...prev,
          {
            id: "file-" + Date.now() + Math.random(),
            url: result,
            name: file.name,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    // Notice: for peluche, desiredColors is not required and omitted from form
    if (!projectTitle.trim() || !description.trim() || (!isPeluche && !desiredColors.trim()) || !desiredDate) {
      setFileError("Por favor completa todos los campos requeridos marcados con (*).");
      return;
    }

    // Date availability check
    const availability = checkDateAvailability(desiredDate);
    if (availability.isBlocked) {
      setFileError(
        `La fecha seleccionada está bloqueada: ${availability.blockReason || "Cerrado"}. Por favor elige otra fecha.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const newReq = submitCustomRequest({
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerPhone: currentUser.phone || "",
        projectTitle,
        productType,
        description,
        desiredColors: isPeluche ? "N/A - Peluche tejido a mano" : desiredColors,
        theme,
        approximateBudget: approximateBudget ? parseFloat(approximateBudget) : undefined,
        desiredDate,
        desiredTimeSlot,
        additionalNotes,
        files,
      });

      setSubmittedRequestTracking(newReq.trackingNumber);
      setSubmitting(false);
    } catch (err) {
      setFileError("Hubo un error al procesar tu solicitud. Intenta nuevamente.");
      setSubmitting(false);
    }
  };

  if (submittedRequestTracking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5 animate-in fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-stone-900">
          {isPeluche
            ? "¡Solicitud de Peluche Recibida con Éxito!"
            : "¡Solicitud Personalizada Enviada con Éxito!"}
        </h2>
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 inline-block text-left text-xs max-w-md">
          <p className="font-bold text-stone-900">Número de Seguimiento:</p>
          <p className="font-mono text-base font-bold text-rose-700">{submittedRequestTracking}</p>
          <p className="text-stone-500 mt-2">
            Estado actual:{" "}
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
              Solicitud recibida
            </span>
          </p>
          <p className="text-stone-600 mt-2 leading-relaxed">
            {isPeluche
              ? "La artesana Monse revisará las fotos y especificaciones de tu peluche para enviarte una cotización formal y el anticipo requerido en menos de 24 horas."
              : "La artesana Monse revisará tus fotografías y especificaciones para enviarte una cotización formal y el anticipo requerido en menos de 24 horas."}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("cuenta")}
            className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(225,29,72,0.3)] cursor-pointer"
          >
            Ver en Mi Cuenta & Pedidos
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSubmittedRequestTracking(null);
              setProjectTitle("");
              setDescription("");
              setDesiredColors("");
              setFiles([]);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            {isPeluche ? "Personalizar otro peluche" : "Enviar otra solicitud"}
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5 sm:space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          <span>Diseño & Confección Artesanal</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight">
          Crea Algo Único a la Medida
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Ramos eternos de listón satinado, peluches amigurumis tejidos a mano o arreglos especiales.
          Cuéntale tu sueño o idea a Monce y ella lo elaborará pétalo a pétalo o punto a punto con amor y calidad impecable.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-rose-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {fileError && (
          <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{fileError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Project basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                {isPeluche
                  ? "Nombre de tu peluche, personaje o idea *"
                  : "Nombre de tu proyecto o idea *"}
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder={
                  isPeluche
                    ? "Ej. Peluche de Snoopy a crochet, osito tierno con corazón..."
                    : "Ej. Ramo temático Stitch con 30 rosas azules"
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Tipo de Creación *
              </label>
              <div className="relative">
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm appearance-none focus:bg-white focus:outline-none focus:border-rose-500 cursor-pointer transition-colors"
                >
                  <optgroup label="🌸 Ramos y Flores de Listón">
                    <option value="Ramo buchón de rosas de listón">Ramo buchón de rosas de listón</option>
                    <option value="Ramo temático de graduación con birrete">
                      Ramo temático de graduación con birrete
                    </option>
                    <option value="Caja sorpresa de rosas y joyero">
                      Caja sorpresa con rosas y compartimento
                    </option>
                    <option value="Cúpula de cristal con rosa eterna">
                      Cúpula de cristal con rosa gigante
                    </option>
                    <option value="Corona o arreglo floral mixto">
                      Arreglo floral mixto o corona de flores
                    </option>
                    <option value="Letras o números con flores">
                      Iniciales o números rellenos de rosas
                    </option>
                    <option value="Otro diseño especial de flores">Otro diseño especial de flores</option>
                  </optgroup>
                  <optgroup label="🧸 Peluches Tejidos a Mano (Crochet & Amigurumi)">
                    <option value="Peluche de personaje favorito (anime, caricatura, videojuego)">
                      Peluche de personaje favorito (anime, caricatura, videojuego)
                    </option>
                    <option value="Peluche amigurumi de animalito o mascota personalizada">
                      Peluche amigurumi de animalito o mascota personalizada
                    </option>
                    <option value="Peluche tierno con corazón o dedicatoria tejida">
                      Peluche tierno con corazón o dedicatoria tejida
                    </option>
                    <option value="Pareja de peluches tejidos para novios o aniversario">
                      Pareja de peluches tejidos para novios o aniversario
                    </option>
                    <option value="Llaveros o mini peluches tejidos para recuerdos de eventos">
                      Llaveros o mini peluches tejidos para recuerdos de eventos
                    </option>
                    <option value="Peluche grande o diseño personalizado exclusivo">
                      Peluche grande o diseño personalizado exclusivo
                    </option>
                    <option value="Otro diseño especial de peluche tejido">
                      Otro diseño especial de peluche tejido
                    </option>
                  </optgroup>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-stone-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              {isPeluche
                ? "Descripción detallada del peluche que imaginas *"
                : "Descripción detallada de lo que imaginas *"}
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isPeluche
                  ? "Explica cómo deseas tu peluche: tamaño aproximado en cm, colores del estambre, detalles de vestimenta, accesorios o expresión especial..."
                  : "Explica cómo quieres que sea: cantidad estimada de rosas, adornos (mariposas, corona, luces, chocolates), si llevará envoltura negra, coreana, etc..."
              }
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Colors & Theme - NO listón colors for peluche */}
          <div className={`grid ${isPeluche ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-4`}>
            {!isPeluche && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Colores de listón deseados *
                </label>
                <div className="relative">
                  <Palette className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={desiredColors}
                    onChange={(e) => setDesiredColors(e.target.value)}
                    placeholder="Ej. Rosa pastel, blanco y toques dorados"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Tema u Ocasión (Opcional)
              </label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder={
                  isPeluche
                    ? "Ej. Cumpleaños / Aniversario / Para coleccionar"
                    : "Ej. Aniversario de 1 año / Graduación Médico / Cumpleaños"
                }
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* Budget & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Presupuesto aprox. ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="20"
                  value={approximateBudget}
                  onChange={(e) => setApproximateBudget(e.target.value)}
                  placeholder="Ej. 90"
                  className="w-full pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Fecha deseada de entrega *
              </label>
              <input
                type="date"
                required
                value={desiredDate}
                onChange={(e) => setDesiredDate(e.target.value)}
                min={new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Horario preferido
              </label>
              <div className="relative">
                <select
                  value={desiredTimeSlot}
                  onChange={(e) => setDesiredTimeSlot(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm appearance-none focus:bg-white focus:outline-none focus:border-rose-500 cursor-pointer transition-colors"
                >
                  <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                  <option value="12:00 PM - 2:00 PM">12:00 PM - 2:00 PM</option>
                  <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</option>
                  <option value="5:00 PM - 7:00 PM">5:00 PM - 7:00 PM</option>
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-stone-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Photos Upload with Preview */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-800">
                {isPeluche
                  ? `Fotos o Imágenes del Peluche (${files.length}/5)`
                  : `Fotos de Referencia o Inspiración (${files.length}/5)`}
              </label>
              <span className="text-[11px] text-stone-400">JPG, PNG o WEBP (Máx. 5MB c/u)</span>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-2xl p-5 sm:p-6 text-center bg-rose-50/20 transition-colors cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={files.length >= 5}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-stone-800">
                {isPeluche
                  ? "Haz clic aquí o arrastra imágenes del personaje o diseño de peluche"
                  : "Haz clic aquí o arrastra tus imágenes de inspiración"}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                {isPeluche
                  ? "Puedes subir fotos de internet, capturas o dibujos del peluche que deseas"
                  : "Puedes subir fotos de Pinterest, capturas de pantalla o paletas de color"}
              </p>
            </div>

            {/* File Previews */}
            {files.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Previsualización sin recortes ({files.length} foto{files.length > 1 ? "s" : ""})
                  </span>
                  <span className="text-[11px] text-rose-700">
                    Se adapta automáticamente al tamaño original
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="relative rounded-2xl overflow-hidden border border-rose-100 bg-stone-50 p-2 flex flex-col justify-between group shadow-2xs"
                    >
                      <div className="w-full h-[140px] flex items-center justify-center overflow-hidden rounded-xl bg-white">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="max-h-full max-w-full w-auto h-auto object-contain rounded-lg transition-transform group-hover:scale-105"
                        />
                      </div>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.88 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => removeFile(file.id)}
                        className="absolute top-3 right-3 min-w-[30px] min-h-[30px] flex items-center justify-center bg-black/70 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer shadow-md z-10"
                        title="Eliminar foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>

                      <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-stone-600">
                        <span className="truncate max-w-[120px] font-medium">{file.name}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          ✓
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              {isPeluche
                ? "Notas o Indicaciones Adicionales para la Artesana"
                : "Notas Adicionales para la Artesana"}
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={
                isPeluche
                  ? "Ej. Es un regalo sorpresa, incluir dedicatoria escrita o accesorio especial..."
                  : "Ej. Es sorpresa para una propuesta de noviazgo, o incluir dedicatoria específica..."
              }
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-[11px] sm:text-xs text-stone-500 text-center sm:text-left">
              * Al enviar la solicitud, el proyecto pasará al estado{" "}
              <strong>"Solicitud recibida"</strong> y podrás consultar la cotización en{" "}
              <em>Mi Cuenta</em>.
            </p>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              className="w-full sm:w-auto min-h-[46px] px-8 py-3 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-700 hover:to-rose-900 text-white font-bold rounded-xl text-xs sm:text-sm shadow-[0_4px_16px_rgba(225,29,72,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>
                {submitting
                  ? "Enviando..."
                  : isPeluche
                    ? "Enviar Solicitud de Peluche Tejido"
                    : "Enviar Solicitud Personalizada"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};
