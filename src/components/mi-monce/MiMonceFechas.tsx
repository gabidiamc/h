import React, { useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Heart,
  Gift,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CustomerPersonalDate } from "../../types";

interface MiMonceFechasProps {
  onOrderForDate?: (date: string, personName: string) => void;
}

export const MiMonceFechas: React.FC<MiMonceFechasProps> = ({ onOrderForDate }) => {
  const { currentUser, savePersonalDate, deletePersonalDate } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDate, setEditingDate] = useState<CustomerPersonalDate | null>(null);

  // Form state
  const [personName, setPersonName] = useState<string>("");
  const [relationship, setRelationship] = useState<string>("Pareja");
  const [eventType, setEventType] = useState<CustomerPersonalDate["eventType"]>("cumpleanos");
  const [dateStr, setDateStr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(7);

  const dates = currentUser?.savedDates || [];

  const openAddModal = () => {
    setEditingDate(null);
    setPersonName("");
    setRelationship("Pareja");
    setEventType("cumpleanos");
    setDateStr("");
    setNotes("");
    setReminderDaysBefore(7);
    setIsModalOpen(true);
  };

  const openEditModal = (d: CustomerPersonalDate) => {
    setEditingDate(d);
    setPersonName(d.personName);
    setRelationship(d.relationship);
    setEventType(d.eventType);
    setDateStr(d.date);
    setNotes(d.notes || "");
    setReminderDaysBefore(d.reminderDaysBefore || 7);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !dateStr) return;

    const record: CustomerPersonalDate = {
      id: editingDate ? editingDate.id : "date-" + Date.now(),
      personName: personName.trim(),
      relationship: relationship.trim(),
      eventType,
      date: dateStr,
      notes: notes.trim() || undefined,
      reminderDaysBefore,
      createdAt: editingDate ? editingDate.createdAt : new Date().toISOString(),
    };

    savePersonalDate(record);
    setIsModalOpen(false);
  };

  // Helper to compute countdown to next occurrence
  const getDaysCountdown = (dStr: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();
    let target = dStr;

    // If string is YYYY-MM-DD
    const parts = dStr.split("-");
    if (parts.length === 3) {
      target = `${currentYear}-${parts[1]}-${parts[2]}`;
      if (target < todayStr) {
        target = `${currentYear + 1}-${parts[1]}-${parts[2]}`;
      }
    }
    const diffTime = new Date(target).getTime() - new Date(todayStr).getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days, nextDateFormatted: target };
  };

  const getEventBadge = (type: CustomerPersonalDate["eventType"]) => {
    switch (type) {
      case "cumpleanos":
        return { label: "Cumpleaños 🎂", color: "bg-amber-100 text-amber-900 border-amber-200" };
      case "aniversario":
        return { label: "Aniversario 💍", color: "bg-rose-100 text-rose-900 border-rose-200" };
      case "san_valentin":
        return { label: "San Valentín ❤️", color: "bg-red-100 text-red-900 border-red-200" };
      case "dia_madres":
        return {
          label: "Día de las Madres 💐",
          color: "bg-pink-100 text-pink-900 border-pink-200",
        };
      case "graduacion":
        return { label: "Graduación 🎓", color: "bg-sky-100 text-sky-900 border-sky-200" };
      default:
        return {
          label: "Fecha Especial ✨",
          color: "bg-purple-100 text-purple-900 border-purple-200",
        };
    }
  };

  // Sort dates by closest upcoming
  const sortedDates = [...dates].sort((a, b) => {
    const countA = getDaysCountdown(a.date).days;
    const countB = getDaysCountdown(b.date).days;
    return countA - countB;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-600" />
            <h2 className="font-serif text-2xl font-bold text-stone-900">Mis Fechas Especiales</h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Guarda aniversarios, cumpleaños y eventos de tus seres queridos para apartar tu ramo
            eterno a tiempo.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Fecha</span>
        </button>
      </div>

      {/* Dates Grid */}
      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-rose-100 shadow-xs space-y-3">
          <Calendar className="w-12 h-12 text-rose-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">
            No tienes fechas especiales registradas
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Registra el cumpleaños o aniversario de tu persona favorita y nunca más olvidarás
            apartar un ramo a tiempo.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
          >
            + Añadir primera fecha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDates.map((d) => {
            const countdown = getDaysCountdown(d.date);
            const badge = getEventBadge(d.eventType);

            return (
              <div
                key={d.id}
                className="bg-white rounded-3xl p-5 border border-rose-100/90 shadow-[0_2px_14px_rgba(244,63,94,0.04)] hover:shadow-[0_6px_22px_rgba(244,63,94,0.07)] transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}
                    >
                      {badge.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar fecha"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePersonalDate(d.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                      {d.personName}
                    </h3>
                    <p className="text-xs text-stone-500">{d.relationship}</p>
                  </div>

                  {/* Countdown Banner */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-rose-800 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>
                        {countdown.days === 0
                          ? "¡Es hoy! 🎉"
                          : countdown.days === 1
                            ? "¡Es mañana!"
                            : `Faltan ${countdown.days} días`}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500">{d.date}</span>
                  </div>

                  {d.notes && (
                    <p className="text-[11px] text-stone-600 mt-2 italic line-clamp-2">
                      "{d.notes}"
                    </p>
                  )}
                </div>

                {onOrderForDate && (
                  <button
                    type="button"
                    onClick={() => onOrderForDate(d.date, d.personName)}
                    className="w-full py-2 bg-stone-50 hover:bg-rose-700 hover:text-white text-stone-700 rounded-xl text-xs font-bold border border-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Encargar ramo para esta fecha</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Date */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-700" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {editingDate ? "Editar Fecha Especial" : "Registrar Fecha Especial"}
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
                  Nombre de la Persona *
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Ej. Mi novia Sofía, Mamá, Amiga Andrea"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Relación</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                  >
                    <option value="Pareja">Pareja</option>
                    <option value="Mamá">Mamá</option>
                    <option value="Papá">Papá</option>
                    <option value="Hermana/o">Hermana/o</option>
                    <option value="Hija/o">Hija/o</option>
                    <option value="Amiga/o">Amiga/o</option>
                    <option value="Compañera/o">Compañera/o</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tipo de Ocasión
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) =>
                      setEventType(e.target.value as CustomerPersonalDate["eventType"])
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                  >
                    <option value="cumpleanos">Cumpleaños</option>
                    <option value="aniversario">Aniversario</option>
                    <option value="san_valentin">San Valentín</option>
                    <option value="dia_madres">Día de las Madres</option>
                    <option value="graduacion">Graduación</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Fecha del Evento *
                </label>
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Notas / Gustos del Ramo (opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Le fascinan las rosas eternas lila con mariposas y perlas..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
                  Guardar Fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
