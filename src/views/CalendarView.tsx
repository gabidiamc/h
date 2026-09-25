import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const CalendarView: React.FC = () => {
  const {
    calendarDates,
    importantDates,
    checkDateAvailability,
    siteSettings,
    setActiveTab,
    setSelectedProductId,
  } = useApp();

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2025, 1, 1)); // Feb 2025
  const [selectedDateString, setSelectedDateString] = useState<string>("2025-02-14");

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthYearLabel = currentMonth.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  // Generate calendar days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  // Leading empty days for Sunday start
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const formatted = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push(formatted);
  }

  // Selected date info
  const selectedAvailability = checkDateAvailability(selectedDateString);
  const selectedEvent = importantDates.find((d) => d.date === selectedDateString);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="bg-linear-to-br from-rose-950 via-rose-900 to-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-semibold backdrop-blur-xs">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Disponibilidad en Tiempo Real</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            Calendario de Cupos & Fechas Importantes
          </h1>
          <p className="text-xs sm:text-sm text-rose-100/80 leading-relaxed">
            Cada ramo de flores de listón se dobla y fija a mano con dedicación artesanal. Por ello,
            limitamos los pedidos por día para garantizar una calidad impecable.
          </p>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Box */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-md space-y-6">
          {/* Month Header Nav */}
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 capitalize">
              {monthYearLabel}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-700 transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-700 transition-colors"
                title="Siguiente mes"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Disponible (&gt;2 cupos)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Pocos cupos (1 o 2)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Capacidad completa (0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-stone-400" />
              <span>Bloqueado / Cerrado</span>
            </div>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-stone-400">
            <span>Dom</span>
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayStr, idx) => {
              if (!dayStr) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-square rounded-2xl opacity-20 bg-stone-100"
                  />
                );
              }

              const dateObj = new Date(dayStr + "T00:00:00");
              const dayNum = dateObj.getDate();
              const avail = checkDateAvailability(dayStr);
              const isSelected = selectedDateString === dayStr;
              const hasEvent = importantDates.some((d) => d.date === dayStr);

              // Color indicator class
              let colorBadgeClass = "bg-emerald-50 text-emerald-900 border-emerald-200";
              let dotColor = "bg-emerald-500";

              if (avail.isBlocked) {
                colorBadgeClass = "bg-stone-100 text-stone-500 border-stone-300";
                dotColor = "bg-stone-400";
              } else if (avail.status === "FULL") {
                colorBadgeClass = "bg-rose-50 text-rose-900 border-rose-300";
                dotColor = "bg-rose-600";
              } else if (avail.status === "FEW_SLOTS") {
                colorBadgeClass = "bg-amber-50 text-amber-900 border-amber-300";
                dotColor = "bg-amber-500";
              }

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDateString(dayStr)}
                  className={`aspect-square rounded-2xl p-1.5 sm:p-2 border transition-all flex flex-col justify-between text-left relative cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-rose-700 shadow-md font-bold scale-102 bg-white"
                      : "hover:border-rose-300"
                  } ${colorBadgeClass}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs sm:text-sm">{dayNum}</span>
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  </div>

                  {/* Badges or event mark */}
                  <div className="w-full truncate text-[9px] sm:text-[10px]">
                    {hasEvent ? (
                      <span className="text-rose-700 font-bold block truncate">
                        ★ {importantDates.find((d) => d.date === dayStr)?.title}
                      </span>
                    ) : avail.isBlocked ? (
                      <span className="text-stone-400">Cerrado</span>
                    ) : avail.status === "FULL" ? (
                      <span className="text-rose-600 font-bold">Lleno</span>
                    ) : (
                      <span className="text-stone-500">{avail.remainingSlots} libres</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector (Right Column) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-rose-100 shadow-md space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
              Detalles del Día Seleccionado
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              {new Date(selectedDateString + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>
          </div>

          {/* Status Indicator Box */}
          {selectedAvailability.isBlocked ? (
            <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200 text-stone-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <XCircle className="w-4 h-4 text-stone-600" />
                <span>Fecha No Disponible</span>
              </div>
              <p className="text-xs text-stone-600">
                Motivo: {selectedAvailability.blockReason || "Cerrado por descanso del taller"}
              </p>
            </div>
          ) : selectedAvailability.status === "FULL" ? (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Capacidad al Máximo</span>
              </div>
              <p className="text-xs text-rose-800">
                Hemos alcanzado el límite de {selectedAvailability.maxCapacity} pedidos para este
                día. Por favor elige otra fecha cercana.
              </p>
            </div>
          ) : selectedAvailability.status === "FEW_SLOTS" ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>¡Quedan Pocos Cupos!</span>
              </div>
              <p className="text-xs text-amber-800">
                Solo quedan <strong>{selectedAvailability.remainingSlots}</strong> lugares
                disponibles de {selectedAvailability.maxCapacity} totales. Te sugerimos apartar hoy
                mismo.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Disponibilidad Confirmada</span>
              </div>
              <p className="text-xs text-emerald-800">
                Hay <strong>{selectedAvailability.remainingSlots}</strong> cupos disponibles en el
                taller para confeccionar tu ramo o caja sorpresa.
              </p>
            </div>
          )}

          {/* Event description if any */}
          {selectedEvent && (
            <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100 space-y-2">
              <span className="text-2xl block">{selectedEvent.emoji}</span>
              <h4 className="font-serif text-sm font-bold text-rose-950">{selectedEvent.title}</h4>
              <p className="text-xs text-rose-900/80 leading-relaxed">
                {selectedEvent.subtitle} {selectedEvent.notes}
              </p>
            </div>
          )}

          {/* Workshop schedule info */}
          <div className="border-t border-stone-100 pt-4 space-y-2 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-700" />
              <span>Horario de entrega: {siteSettings.businessHours}</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Anticipación mínima recomendada: 3 a 5 días para modelos con 50 rosas de listón.
            </p>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            {!selectedAvailability.isBlocked && selectedAvailability.status !== "FULL" ? (
              <button
                onClick={() => {
                  setActiveTab("productos");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full py-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Elegir Ramo para esta Fecha</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3.5 bg-stone-200 text-stone-400 rounded-2xl text-xs font-semibold cursor-not-allowed"
              >
                Fecha sin disponibilidad
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
