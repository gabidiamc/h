export interface RibbonColorOption {
  name: string;
  hex: string;
}

/** Paleta base de 20 colores de listón más comunes. */
export const RIBBON_COLOR_PALETTE: RibbonColorOption[] = [
  { name: "Rojo Pasión", hex: "#C81D25" },
  { name: "Rosa Pastel", hex: "#F7C6D9" },
  { name: "Rosa Fucsia", hex: "#E5307A" },
  { name: "Vino Tinto", hex: "#6E1423" },
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Marfil", hex: "#F5EFE0" },
  { name: "Dorado", hex: "#D4AF37" },
  { name: "Plateado", hex: "#C0C0C0" },
  { name: "Negro", hex: "#1A1A1A" },
  { name: "Azul Marino", hex: "#1E2A5A" },
  { name: "Azul Cielo", hex: "#8FC5E8" },
  { name: "Turquesa", hex: "#2EC4B6" },
  { name: "Verde Esmeralda", hex: "#0F7B54" },
  { name: "Verde Menta", hex: "#A8E6C1" },
  { name: "Amarillo", hex: "#F5C518" },
  { name: "Naranja", hex: "#F2761F" },
  { name: "Durazno", hex: "#FFCBA4" },
  { name: "Lila", hex: "#B48CD9" },
  { name: "Morado", hex: "#6B2D8C" },
  { name: "Café Chocolate", hex: "#5B3A29" },
];

export const ALL_RIBBON_COLOR_NAMES: string[] = RIBBON_COLOR_PALETTE.map((c) => c.name);

/** Devuelve el color visual de un nombre de listón (o un gris suave si es un nombre libre). */
export function ribbonColorHex(name: string): string {
  const found = RIBBON_COLOR_PALETTE.find(
    (c) => c.name.toLowerCase() === (name || "").trim().toLowerCase(),
  );
  return found ? found.hex : "#D6D3D1";
}
