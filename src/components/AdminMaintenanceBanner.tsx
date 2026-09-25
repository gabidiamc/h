import React from "react";
import { AlertTriangle, Eye, PowerOff, ShieldCheck, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";

export const AdminMaintenanceBanner: React.FC = () => {
  const {
    isMaintenanceActive,
    isAdmin,
    toggleMaintenanceMode,
    previewAsVisitor,
    setPreviewAsVisitor,
    activeTab,
    setActiveTab,
  } = useApp();

  if (!isMaintenanceActive || !isAdmin || previewAsVisitor) {
    return null;
  }

  return (
    <aside
      aria-label="Aviso de modo mantenimiento para administrador"
      className="bg-amber-600 text-stone-950 px-3 py-2 sm:py-2.5 shadow-md relative z-50 transition-all border-b border-amber-700"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-stone-950" />
          </span>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-stone-950 shrink-0" />
            <span className="font-bold text-stone-950 uppercase tracking-wide text-[11px]">
              Modo Mantenimiento Activado
            </span>
            <span className="hidden md:inline font-normal text-amber-950">
              — La tienda está cerrada al público. Solo tú puedes navegar y previsualizar cambios.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-banner-preview-visitor"
            onClick={() => setPreviewAsVisitor(true)}
            className="px-2.5 py-1 bg-amber-700/80 hover:bg-amber-800 text-stone-950 hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Ver la pantalla tal como la ven tus clientes"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Previsualizar</span>
          </button>

          {activeTab !== "admin" && (
            <button
              id="btn-banner-go-admin"
              onClick={() => setActiveTab("admin")}
              className="px-2.5 py-1 bg-amber-950 hover:bg-black text-amber-100 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Panel Dueña</span>
            </button>
          )}

          <button
            id="btn-banner-turn-off"
            onClick={() => toggleMaintenanceMode(false)}
            className="px-3 py-1 bg-white hover:bg-stone-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            title="Abrir la tienda nuevamente al público"
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>Abrir Tienda al Público</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
