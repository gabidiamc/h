/**
 * Convierte imágenes elegidas desde el dispositivo en imágenes optimizadas
 * (redimensionadas y comprimidas) listas para guardarse y mostrarse en la tienda.
 */

const MAX_DIMENSION = 900;
const QUALITY = 0.74;

export async function fileToOptimizedImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Imagen inválida."));
      image.src = dataUrl;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", QUALITY);
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

export async function avatarFileToOptimizedImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Imagen inválida."));
      image.src = dataUrl;
    });

    const AVATAR_MAX = 350;
    const scale = Math.min(1, AVATAR_MAX / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", 0.82);
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

export async function filesToOptimizedImages(files: FileList | File[]): Promise<string[]> {
  const list = Array.from(files as File[]);
  const results: string[] = [];
  for (const file of list) {
    try {
      results.push(await fileToOptimizedImage(file));
    } catch (e) {
      console.error("[imageUpload]", e);
    }
  }
  return results;
}
