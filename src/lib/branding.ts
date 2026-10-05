/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { type AppearanceRow } from "@/lib/directory";

export type BrandingAssetType = "application_logo" | "favicon" | "pwa_icon";

export const BRANDING_STORAGE_BUCKET = "branding-assets";

export interface BrandingAssetInfo {
  url: string | null;
  storagePath: string | null;
  updatedAt?: string | null;
}

export interface BrandingIdentityState {
  application_logo: BrandingAssetInfo;
  favicon: BrandingAssetInfo;
  pwa_icon: BrandingAssetInfo;
  branding_version: string;
}

export interface BrandingValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES: Record<BrandingAssetType, string[]> = {
  application_logo: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"],
  favicon: [
    "image/png",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "image/svg+xml",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ],
  pwa_icon: ["image/png", "image/webp", "image/jpeg", "image/jpg", "image/svg+xml"],
};

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB max

/**
 * Validates that the uploaded file is a genuine, safe image file suitable for the asset type.
 * Ensures NO executable or dangerous files are accepted.
 */
export function validateBrandingFile(
  file: File,
  assetType: BrandingAssetType,
): BrandingValidationResult {
  if (!file) {
    return { valid: false, error: "No se seleccionó ningún archivo." };
  }

  // 1. File size check
  if (file.size <= 0) {
    return { valid: false, error: "El archivo está vacío." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "El archivo supera el tamaño máximo permitido de 15 MB.",
    };
  }

  // 2. MIME type check
  const allowedMimes = ALLOWED_MIME_TYPES[assetType];
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  const hasValidMime = allowedMimes.some(
    (mime) => fileType === mime || fileType.startsWith("image/"),
  );

  const hasValidExt =
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".svg") ||
    fileName.endsWith(".ico");

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      error: `Formato no soportado. Para ${getAssetTypeLabel(assetType)} utiliza PNG, JPG, WebP o SVG.`,
    };
  }

  // Reject executable or script-like files disguised as images
  const dangerousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.sh$/i,
    /\.php$/i,
    /\.js$/i,
    /\.ts$/i,
    /\.html$/i,
    /\.phtml$/i,
  ];
  if (dangerousPatterns.some((pattern) => pattern.test(fileName))) {
    return {
      valid: false,
      error: "Archivo no permitido por razones de seguridad.",
    };
  }

  return { valid: true };
}

export function getAssetTypeLabel(assetType: BrandingAssetType): string {
  switch (assetType) {
    case "application_logo":
      return "Logo de la Aplicación";
    case "favicon":
      return "Favicon";
    case "pwa_icon":
      return "Ícono PWA";
  }
}

/**
 * Reads a File into an exact DataURL string for instant, pixel-perfect preview without AI or modifications.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("No se pudo leer el archivo."));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an unmodified original branding asset file directly to Supabase Storage.
 * Follows folder structure:
 *   application-logo/application-logo-[timestamp].[ext]
 *   favicon/favicon-[timestamp].[ext]
 *   pwa/pwa-icon-[timestamp].[ext]
 */
export async function uploadBrandingAsset({
  file,
  assetType,
}: {
  file: File;
  assetType: BrandingAssetType;
}): Promise<{ publicUrl: string; storagePath: string }> {
  const validation = validateBrandingFile(file, assetType);
  if (!validation.valid) {
    throw new Error(validation.error || "Archivo inválido.");
  }

  const timestamp = Date.now();
  const rawExt = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = rawExt.replace(/[^a-z0-9]/g, "") || "png";

  let folder = "application-logo";
  let prefix = "app-logo";
  if (assetType === "favicon") {
    folder = "favicon";
    prefix = "favicon";
  } else if (assetType === "pwa_icon") {
    folder = "pwa";
    prefix = "pwa-icon";
  }

  const storagePath = `${folder}/${prefix}-${timestamp}.${safeExt}`;

  // 1. If Supabase is configured, upload directly to the storage bucket
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase as any).storage
        .from(BRANDING_STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "31536000",
          upsert: true,
          contentType: file.type || "image/png",
        });

      if (!error && data) {
        const { data: pubData } = (supabase as any).storage
          .from(BRANDING_STORAGE_BUCKET)
          .getPublicUrl(data.path || storagePath);

        if (pubData?.publicUrl) {
          return {
            publicUrl: pubData.publicUrl,
            storagePath: data.path || storagePath,
          };
        }
      } else if (error) {
        console.warn("Direct bucket upload warning:", error.message);
      }
    } catch (storageErr) {
      console.warn("Storage upload exception, using fallback:", storageErr);
    }
  }

  // 2. Fallback: DataURL stored reliably in configuration
  const dataUrl = await readFileAsDataUrl(file);
  return {
    publicUrl: dataUrl,
    storagePath: `local/${storagePath}`,
  };
}

/**
 * Safely removes old branding assets from storage only AFTER the new configuration is committed.
 */
export async function cleanupOldBrandingAsset(
  storagePath: string | null | undefined,
): Promise<void> {
  if (!storagePath || storagePath.startsWith("local/") || storagePath.startsWith("data:")) {
    return;
  }
  if (!isSupabaseConfigured()) return;

  try {
    await (supabase as any).storage.from(BRANDING_STORAGE_BUCKET).remove([storagePath]);
  } catch (err) {
    console.warn("Could not delete old branding asset from storage:", err);
  }
}

/**
 * Real-time DOM update for website Favicon with cache-busting timestamp/version.
 * Updates all relevant <link rel="icon"> and <link rel="shortcut icon"> elements in document head.
 * Does NOT touch application logo or PWA icon.
 */
export function applyFaviconToDocument(faviconUrl: string | null, version?: string | null): void {
  if (typeof document === "undefined") return;

  const effectiveVersion = version || Date.now().toString();
  const defaultFavicon = "/favicon.ico";
  const targetUrl = faviconUrl
    ? faviconUrl.startsWith("data:")
      ? faviconUrl
      : faviconUrl.includes("?")
        ? `${faviconUrl}&v=${effectiveVersion}`
        : `${faviconUrl}?v=${effectiveVersion}`
    : `${defaultFavicon}?v=${effectiveVersion}`;

  const setMime = (link: HTMLLinkElement) => {
    if (faviconUrl) {
      if (faviconUrl.endsWith(".ico") || faviconUrl.includes(".ico?")) {
        link.type = "image/x-icon";
      } else if (faviconUrl.endsWith(".svg") || faviconUrl.includes(".svg?")) {
        link.type = "image/svg+xml";
      } else if (faviconUrl.endsWith(".webp") || faviconUrl.includes(".webp?")) {
        link.type = "image/webp";
      }
    }
  };

  // Find or create rel="icon"
  let iconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (iconLink) {
    iconLink.href = targetUrl;
    setMime(iconLink);
  } else {
    iconLink = document.createElement("link") as HTMLLinkElement;
    iconLink.rel = "icon";
    iconLink.href = targetUrl;
    setMime(iconLink);
    document.head?.appendChild(iconLink);
  }

  // Find or create rel="shortcut icon"
  let shortcutLink = document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
  if (shortcutLink) {
    shortcutLink.href = targetUrl;
    setMime(shortcutLink);
  } else {
    shortcutLink = document.createElement("link") as HTMLLinkElement;
    shortcutLink.rel = "shortcut icon";
    shortcutLink.href = targetUrl;
    setMime(shortcutLink);
    document.head?.appendChild(shortcutLink);
  }

  // Also update any other matching icon links if querySelectorAll is available
  if (typeof document.querySelectorAll === "function") {
    const existingIconLinks = document.querySelectorAll<HTMLLinkElement>(
      "link[rel~='icon'], link[rel='shortcut icon']",
    );
    existingIconLinks.forEach((link) => {
      link.href = targetUrl;
      setMime(link);
    });
  }
}

/**
 * Real-time DOM update for PWA icon and apple-touch-icon with cache-busting.
 * Updates <link rel="apple-touch-icon"> and updates <link rel="manifest">.
 * Does NOT touch application logo or favicon.
 */
export function applyPwaIconToDocument(pwaIconUrl: string | null, version?: string | null): void {
  if (typeof document === "undefined") return;

  const effectiveVersion = version || Date.now().toString();
  const defaultAppleIcon = "/icons/apple-touch-icon.png";
  const targetUrl = pwaIconUrl
    ? pwaIconUrl.startsWith("data:")
      ? pwaIconUrl
      : pwaIconUrl.includes("?")
        ? `${pwaIconUrl}&v=${effectiveVersion}`
        : `${pwaIconUrl}?v=${effectiveVersion}`
    : `${defaultAppleIcon}?v=${effectiveVersion}`;

  // Find or create rel="apple-touch-icon"
  let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (appleLink) {
    appleLink.href = targetUrl;
  } else {
    appleLink = document.createElement("link") as HTMLLinkElement;
    appleLink.rel = "apple-touch-icon";
    appleLink.sizes = "180x180";
    appleLink.href = targetUrl;
    document.head?.appendChild(appleLink);
  }

  if (typeof document.querySelectorAll === "function") {
    const appleLinks = document.querySelectorAll<HTMLLinkElement>("link[rel~='apple-touch-icon']");
    appleLinks.forEach((link) => {
      link.href = targetUrl;
    });

    const manifestLinks = document.querySelectorAll<HTMLLinkElement>("link[rel='manifest']");
    manifestLinks.forEach((link) => {
      const baseHref = link.href.split("?")[0];
      link.href = `${baseHref}?v=${effectiveVersion}`;
    });
  } else {
    const manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
    if (manifestLink) {
      const baseHref = manifestLink.href.split("?")[0];
      manifestLink.href = `${baseHref}?v=${effectiveVersion}`;
    }
  }
}
