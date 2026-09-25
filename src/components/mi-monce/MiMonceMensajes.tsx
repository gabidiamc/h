import React, { useState } from "react";
import {
  MessageSquareText,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Heart,
  Sparkles,
  X,
  BookOpen,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CustomerSavedMessage } from "../../types";

const INSPIRATIONAL_TEMPLATES: {
  title: string;
  category: CustomerSavedMessage["category"];
  message: string;
}[] = [
  {
    title: "Amor Eterno",
    category: "amor",
    message:
      "Como este ramo eterno que nunca se marchita, mi amor, admiración y gratitud por ti florecen con más fuerza cada día. Gracias por ser mi lugar favorito en el mundo.",
  },
  {
    title: "Aniversario Especial",
    category: "aniversario",
    message:
      "Feliz Aniversario, mi vida. Cada momento a tu lado es un regalo y volvería a elegirte hoy y siempre. Que estas rosas eternas celebren nuestra historia de amor.",
  },
  {
    title: "Cumpleaños Soñado",
    category: "cumpleanos",
    message:
      "¡Feliz Cumpleaños! Que tu vida siempre esté llena de luz, sonrisas y momentos tan mágicos como estas flores. Te mereces el universo entero.",
  },
  {
    title: "Día de las Madres",
    category: "agradecimiento",
    message:
      "Mamá hermosa, gracias por tu amor incondicional, tus abrazos que sanan y por ser la flor más hermosa de nuestro hogar. Te amo con todo mi corazón.",
  },
];

export const MiMonceMensajes: React.FC = () => {
  const { currentUser, saveCustomerMessage, deleteCustomerMessage } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMsg, setEditingMsg] = useState<CustomerSavedMessage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [category, setCategory] = useState<CustomerSavedMessage["category"]>("amor");
  const [message, setMessage] = useState<string>("");

  const savedMessages = currentUser?.savedMessages || [];

  const openAddModal = () => {
    setEditingMsg(null);
    setTitle("");
    setRecipient("");
    setCategory("amor");
    setMessage("");
    setIsModalOpen(true);
  };

  const openEditModal = (m: CustomerSavedMessage) => {
    setEditingMsg(m);
    setTitle(m.title);
    setRecipient(m.recipient || "");
    setCategory(m.category || "amor");
    setMessage(m.message);
    setIsModalOpen(true);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const record: CustomerSavedMessage = {
      id: editingMsg ? editingMsg.id : "msg-" + Date.now(),
      title: title.trim(),
      recipient: recipient.trim() || undefined,
      category,
      message: message.trim(),
      createdAt: editingMsg ? editingMsg.createdAt : new Date().toISOString(),
    };

    saveCustomerMessage(record);
    setIsModalOpen(false);
  };

  const handleUseTemplate = (tpl: (typeof INSPIRATIONAL_TEMPLATES)[0]) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    setMessage(tpl.message);
    setIsModalOpen(true);
  };

  const getCategoryBadge = (cat?: CustomerSavedMessage["category"]) => {
    switch (cat) {
      case "amor":
        return { label: "Amor ❤️", color: "bg-rose-100 text-rose-800" };
      case "aniversario":
        return { label: "Aniversario 💍", color: "bg-purple-100 text-purple-800" };
      case "cumpleanos":
        return { label: "Cumpleaños 🎂", color: "bg-amber-100 text-amber-800" };
      case "agradecimiento":
        return { label: "Gratitud 💐", color: "bg-emerald-100 text-emerald-800" };
      case "disculpa":
        return { label: "Disculpa 🕊️", color: "bg-sky-100 text-sky-800" };
      default:
        return { label: "Personalizado ✨", color: "bg-stone-100 text-stone-800" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-rose-600" />
            <h2 className="font-serif text-2xl font-bold text-stone-900">Mis Mensajes & Cartas</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Guarda tus dedicatorias favoritas para tarjetas caligráficas de tus ramos eternos.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Escribir Nuevo Mensaje</span>
        </button>
      </div>

      {/* Grid of Saved Messages */}
      {savedMessages.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-rose-100 shadow-xs space-y-3">
          <MessageSquareText className="w-12 h-12 text-rose-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No tienes mensajes guardados</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Guarda tus palabras más emotivas o utiliza nuestras cartas de inspiración a continuación
            para personalizarlas a tu gusto.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
          >
            + Escribir primer mensaje
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedMessages.map((m) => {
            const badge = getCategoryBadge(m.category);
            return (
              <div
                key={m.id}
                className="bg-white rounded-3xl p-5 border border-rose-100/90 shadow-[0_2px_14px_rgba(244,63,94,0.04)] hover:shadow-[0_6px_22px_rgba(244,63,94,0.07)] transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      {m.recipient && (
                        <span className="text-[11px] text-stone-500 font-medium">
                          Para: <strong>{m.recipient}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomerMessage(m.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif text-base font-bold text-stone-900 mt-2">{m.title}</h3>

                  <div className="mt-2.5 p-3.5 rounded-2xl bg-stone-50/80 border border-stone-100 text-stone-700 font-serif italic text-xs leading-relaxed">
                    "{m.message}"
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <span>{m.message.length} caracteres</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(m.id, m.message)}
                    className="px-3 py-1 bg-stone-100 hover:bg-rose-700 hover:text-white text-stone-700 rounded-xl font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === m.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar dedicatoria</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspirational Templates by Monce */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="font-serif text-base font-bold text-stone-900">
            Inspiración Floral de Monce
          </h3>
        </div>
        <p className="text-xs text-stone-500">
          ¿No sabes qué escribir? Puedes usar y personalizar estas dedicatorias con un solo clic:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INSPIRATIONAL_TEMPLATES.map((tpl, idx) => (
            <div
              key={idx}
              className="p-4 rounded-3xl bg-gradient-to-br from-rose-50/60 to-pink-50/40 border border-rose-100 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-900">{tpl.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-rose-800 border border-rose-200">
                  {tpl.category}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-serif italic line-clamp-3">
                "{tpl.message}"
              </p>
              <button
                type="button"
                onClick={() => handleUseTemplate(tpl)}
                className="w-full py-1.5 bg-white hover:bg-rose-700 hover:text-white text-rose-800 rounded-xl text-xs font-bold border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Usar y Personalizar</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add / Edit Message */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareText className="w-5 h-5 text-rose-700" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {editingMsg ? "Editar Dedicatoria" : "Nueva Dedicatoria"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Título del Mensaje *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Carta de Aniversario, Palabras para Mamá"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Destinatario (opcional)
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Ej. Sofía, Mamá..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as CustomerSavedMessage["category"])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                  >
                    <option value="amor">Amor</option>
                    <option value="aniversario">Aniversario</option>
                    <option value="cumpleanos">Cumpleaños</option>
                    <option value="agradecimiento">Gratitud</option>
                    <option value="disculpa">Disculpa</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    Dedicatoria / Texto de la Carta *
                  </label>
                  <span className="text-[10px] text-stone-400">{message.length} caracteres</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe aquí las palabras que se imprimirán en caligrafía para tu ramo eterno..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none font-serif"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Mensaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
