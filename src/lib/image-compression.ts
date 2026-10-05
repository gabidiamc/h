/**
 * Utility to compress and optimize images client-side before storing or transmitting.
 * Reduces raw 5MB-15MB camera photos to lightweight 50KB-120KB images (max 1280px dimension, JPEG/WebP @ 82% quality).
 * Prevents LocalStorage QuotaExceededError and ensures ultra-fast page load on slow internet connections.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/webp" | "image/png";
}

/**
 * Detects whether an image has transparency (alpha channel / no background).
 */
export async function detectImageTransparency(source: string | File): Promise<boolean> {
  if (!source) return false;

  if (typeof source !== "string") {
    if (source.type === "image/svg+xml" || source.name.toLowerCase().endsWith(".svg")) {
      return true;
    }
  } else if (source.startsWith("data:image/svg") || source.toLowerCase().includes(".svg")) {
    return true;
  }

  return new Promise((resolve) => {
    const handleUrl = (dataUrl: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const sampleW = Math.min(100, Math.max(1, img.width));
          const sampleH = Math.min(100, Math.max(1, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = sampleW;
          canvas.height = sampleH;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            resolve(false);
            return;
          }
          ctx.clearRect(0, 0, sampleW, sampleH);
          ctx.drawImage(img, 0, 0, sampleW, sampleH);
          const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

          // Check if any sampled pixel has an alpha value < 250
          for (let i = 3; i < imgData.length; i += 4) {
            if (imgData[i] < 250) {
              resolve(true);
              return;
            }
          }
          resolve(false);
        } catch {
          // If cross-origin or canvas read error, assume false or check mime type
          resolve(dataUrl.startsWith("data:image/png"));
        }
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    };

    if (typeof source === "string") {
      handleUrl(source);
    } else {
      const reader = new FileReader();
      reader.onload = () => handleUrl(reader.result as string);
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(source);
    }
  });
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {},
): Promise<string> {
  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
  const isWebp = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");

  // If it's a PDF or non-image, read normally as Data URL
  if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".pdf")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error("No data URL found"));
        return;
      }

      // If it's an SVG, don't rasterize to canvas to preserve crisp vector scaling & transparency
      if (isSvg || dataUrl.startsWith("data:image/svg")) {
        resolve(dataUrl);
        return;
      }

      // Check if image has transparency so we don't accidentally turn transparent background into black/white
      let detectedMime: "image/jpeg" | "image/webp" | "image/png" = "image/jpeg";
      if (isPng || isWebp) {
        const isTransparent = await detectImageTransparency(dataUrl);
        if (isTransparent) {
          detectedMime = isPng ? "image/png" : "image/webp";
        }
      }

      const {
        maxWidth = 1280,
        maxHeight = 1280,
        quality = 0.85,
        mimeType = options.mimeType ?? detectedMime,
      } = options;

      compressDataUrl(dataUrl, { maxWidth, maxHeight, quality, mimeType })
        .then(resolve)
        .catch(() => {
          // If canvas compression fails, return raw dataUrl safely
          resolve(dataUrl);
        });
    };
    reader.readAsDataURL(file);
  });
}

export async function compressDataUrl(
  dataUrl: string,
  options: CompressionOptions = {},
): Promise<string> {
  const isPng = dataUrl.startsWith("data:image/png");
  const isWebp = dataUrl.startsWith("data:image/webp");
  const defaultMime = isPng ? "image/png" : isWebp ? "image/webp" : "image/jpeg";

  const { maxWidth = 1280, maxHeight = 1280, quality = 0.82, mimeType = defaultMime } = options;

  // Don't compress non-image data URLs or SVGs
  if (!dataUrl.startsWith("data:image/") || dataUrl.startsWith("data:image/svg")) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let { width, height } = img;

      // Calculate proportional scaling
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // High-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // If output is strictly JPEG, paint white background for transparent images
      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Clear canvas for transparent PNG/WebP
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const compressed = canvas.toDataURL(mimeType, quality);
        // Only return compressed if it succeeded and isn't empty
        if (compressed && compressed.length > 50 && compressed.length < dataUrl.length) {
          resolve(compressed);
        } else if (compressed && compressed.length > 50 && mimeType === "image/jpeg") {
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * Strips redundant data-original-src attributes and compresses any oversized
 * inline base64 images inside an HTML string so database upserts never time out.
 */
export async function compactHtmlImages(html: string): Promise<string> {
  if (!html) return "";
  // 1. Remove redundant data-original-src attributes that duplicate base64 strings
  let cleaned = html.replace(/\sdata-original-src="[^"]*"/gi, "");

  // 2. Find all base64 data:image URLs and compress any that exceed 120KB
  const regex = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;
  const matches = Array.from(new Set(cleaned.match(regex) || []));

  for (const dataUrl of matches) {
    if (dataUrl.length > 120_000 && !dataUrl.startsWith("data:image/svg")) {
      try {
        const smaller = await compressDataUrl(dataUrl, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.74,
          mimeType: "image/jpeg",
        });
        if (smaller && smaller.length < dataUrl.length) {
          cleaned = cleaned.split(dataUrl).join(smaller);
        }
      } catch {
        // ignore compression failure
      }
    }
  }

  return cleaned;
}

/**
 * Temporarily replaces base64 data:image URLs in HTML with lightweight tokens
 * before sending HTML to AI/dictionary translation, then restores them afterward.
 */
export function maskBase64ImagesForTranslation(html: string): {
  maskedHtml: string;
  restore: (translatedHtml: string) => string;
} {
  const vault: string[] = [];
  const maskedHtml = html.replace(
    /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g,
    (match) => {
      const idx = vault.length;
      vault.push(match);
      return `__DMPS_IMG_DATA_${idx}__`;
    },
  );

  return {
    maskedHtml,
    restore: (translatedHtml: string) =>
      translatedHtml.replace(/__DMPS_IMG_DATA_(\d+)__/g, (_, numStr) => {
        const idx = parseInt(numStr, 10);
        return vault[idx] ?? "";
      }),
  };
}
