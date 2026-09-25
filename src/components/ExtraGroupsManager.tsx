import React from "react";
import { X, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { ProductExtra, ProductExtraGroup, ProductExtraOption } from "../types";
import { fileToOptimizedImage } from "../lib/imageUpload";

interface ExtraGroupsManagerProps {
  groups: ProductExtraGroup[];
  onChange: (groups: ProductExtraGroup[]) => void;
  onClose: () => void;
}

export const ExtraGroupsManager: React.FC<ExtraGroupsManagerProps> = ({
  groups,
  onChange,
  onClose,
}) => {
  const updateGroup = (groupId: string, updates: Partial<ProductExtraGroup>) =>
    onChange(groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)));

  const updateExtra = (groupId: string, extraId: string, updates: Partial<ProductExtra>) =>
    onChange(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              extras: (g.extras || []).map((x) => (x.id === extraId ? { ...x, ...updates } : x)),
            }
          : g,
      ),
    );

  const updateOption = (
    groupId: string,
    extraId: string,
    optionId: string,
    updates: Partial<ProductExtraOption>,
  ) =>
    onChange(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              extras: (g.extras || []).map((x) =>
                x.id === extraId
                  ? {
                      ...x,
                      options: (x.options || []).map((o) =>
                        o.id === optionId ? { ...o, ...updates } : o,
                      ),
                    }
                  : x,
              ),
            }
          : g,
      ),
    );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-stone-200 relative space-y-4 max-h-[88vh] overflow-y-auto text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900">Grupos de Personalizables</h3>
          <p className="text-[11px] text-stone-500">
            Crea un grupo una sola vez (ej. "Peluches", "Tarjetas") y actívalo en los productos que
            quieras.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange([
              ...groups,
              { id: "grp-" + Date.now(), name: "", description: "", extras: [] },
            ])
          }
          className="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo grupo
        </button>

        {groups.length === 0 && (
          <p className="text-[11px] text-stone-400 italic">Aún no has creado grupos.</p>
        )}

        {groups.map((group) => (
          <div
            key={group.id}
            className="border border-stone-200 rounded-2xl p-3 space-y-3 bg-stone-50/60"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nombre del grupo (Ej. Peluches)"
                value={group.name}
                onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                className="flex-1 px-2.5 py-2 bg-white border border-stone-200 rounded-lg font-bold"
              />
              <button
                type="button"
                onClick={() => onChange(groups.filter((g) => g.id !== group.id))}
                className="text-rose-700 hover:text-rose-900"
                title="Eliminar grupo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Descripción del grupo (opcional)"
              value={group.description || ""}
              onChange={(e) => updateGroup(group.id, { description: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-[11px]"
            />

            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-stone-700">Extras del grupo</p>
              <button
                type="button"
                onClick={() =>
                  updateGroup(group.id, {
                    extras: [
                      ...(group.extras || []),
                      { id: "extra-" + Date.now(), name: "", price: 0, description: "" },
                    ],
                  })
                }
                className="px-2 py-1 bg-stone-200 hover:bg-stone-300 rounded-lg text-[10px] font-bold text-stone-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Extra
              </button>
            </div>

            {(group.extras || []).map((extra) => (
              <div
                key={extra.id}
                className="bg-white border border-stone-200 rounded-xl p-2.5 space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre (Ej. Peluche mediano)"
                    value={extra.name}
                    onChange={(e) => updateExtra(group.id, extra.id, { name: e.target.value })}
                    className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio extra"
                    value={Number.isFinite(extra.price) ? extra.price : 0}
                    onChange={(e) =>
                      updateExtra(group.id, extra.id, { price: parseFloat(e.target.value) || 0 })
                    }
                    className="px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <textarea
                    rows={2}
                    placeholder="Descripción (acepta **negritas** y saltos de línea)"
                    value={extra.description || ""}
                    onChange={(e) =>
                      updateExtra(group.id, extra.id, { description: e.target.value })
                    }
                    className="flex-1 px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateGroup(group.id, {
                        extras: (group.extras || []).filter((x) => x.id !== extra.id),
                      })
                    }
                    className="text-rose-700 hover:text-rose-900"
                    title="Eliminar extra"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-t border-stone-100 pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-stone-700">
                      Opciones con foto{" "}
                      <span className="font-normal text-stone-400">(ej. distintos peluches)</span>
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        updateExtra(group.id, extra.id, {
                          options: [
                            ...(extra.options || []),
                            { id: "opt-" + Date.now(), name: "", available: true },
                          ],
                        })
                      }
                      className="px-2 py-1 bg-stone-200 hover:bg-stone-300 rounded-lg text-[10px] font-bold text-stone-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Opción
                    </button>
                  </div>

                  {(extra.options || []).map((opt) => (
                    <div
                      key={opt.id}
                      className="flex flex-wrap items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-2"
                    >
                      {opt.image ? (
                        <img
                          src={opt.image}
                          alt={opt.name}
                          className="w-10 h-10 object-cover rounded-lg border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <label className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 border border-rose-200">
                        <Upload className="w-3 h-3" /> Foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            try {
                              const optimized = await fileToOptimizedImage(file);
                              if (optimized)
                                updateOption(group.id, extra.id, opt.id, { image: optimized });
                            } catch (err) {
                              console.error("Error procesando foto de opción:", err);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre de la opción"
                        value={opt.name}
                        onChange={(e) =>
                          updateOption(group.id, extra.id, opt.id, { name: e.target.value })
                        }
                        className="flex-1 min-w-[120px] px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-[11px]"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Precio"
                        value={opt.price ?? ""}
                        onChange={(e) =>
                          updateOption(group.id, extra.id, opt.id, {
                            price: e.target.value === "" ? undefined : parseFloat(e.target.value),
                          })
                        }
                        className="w-20 px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-[11px]"
                      />
                      <label className="flex items-center gap-1 text-[10px] font-semibold text-stone-600">
                        <input
                          type="checkbox"
                          checked={opt.available !== false}
                          onChange={(e) =>
                            updateOption(group.id, extra.id, opt.id, {
                              available: e.target.checked,
                            })
                          }
                        />
                        Activo
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateExtra(group.id, extra.id, {
                            options: (extra.options || []).filter((o) => o.id !== opt.id),
                          })
                        }
                        className="text-rose-700 hover:text-rose-900"
                        title="Eliminar opción"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
