/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Block } from "@/lib/content";
import type {
  ArticleTranslationRequest,
  ArticleTranslationResult,
  StructuralValidationResult,
} from "./types";

/**
 * Extracts all URLs from an HTML string or text.
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const urls: string[] = [];

  // Match href="..." and src="..."
  const attrRegex = /(?:href|src)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(text)) !== null) {
    if (match[1]) urls.push(match[1].trim());
  }

  // Match raw http/https URLs
  const rawUrlRegex = /https?:\/\/[^\s<>"']+/gi;
  while ((match = rawUrlRegex.exec(text)) !== null) {
    if (match[0] && !urls.includes(match[0].trim())) {
      urls.push(match[0].trim());
    }
  }

  return urls;
}

/**
 * Validates the structural integrity of a translated article against the original article.
 * Enforces Phase 20 & 21 rules:
 * - Same number of blocks
 * - Same block types in exact order
 * - Same block IDs
 * - Same image URLs
 * - Same link URLs
 * - No lost visual elements
 */
export function validateArticleTranslation(
  original: ArticleTranslationRequest,
  translatedBlocks: Block[],
  translatedTitle: string,
  translatedSummary: string | null,
): StructuralValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Title validation
  if (original.title.trim() && !translatedTitle?.trim()) {
    errors.push("El título traducido no puede estar vacío.");
  }

  // 2. Summary validation
  if (original.summary && original.summary.trim() && !translatedSummary?.trim()) {
    warnings.push("La descripción/resumen original tenía contenido pero la traducción está vacía.");
  }

  // 3. Block count validation
  const origBlocks = original.blocks || [];
  const transBlocks = translatedBlocks || [];
  const blockCountMatch = origBlocks.length === transBlocks.length;

  if (!blockCountMatch) {
    errors.push(
      `El número de bloques no coincide: original tiene ${origBlocks.length}, traducción tiene ${transBlocks.length}.`,
    );
  }

  let blockTypesMatch = true;
  let blockIdsMatch = true;
  let urlsPreserved = true;
  let imagesPreserved = true;

  // 4. Per-block comparative validation
  const compareCount = Math.min(origBlocks.length, transBlocks.length);
  for (let i = 0; i < compareCount; i++) {
    const ob = origBlocks[i];
    const tb = transBlocks[i];

    // Check block type
    if (ob.type !== tb.type) {
      blockTypesMatch = false;
      errors.push(
        `Bloque #${i + 1}: El tipo de bloque cambió de '${ob.type}' a '${tb.type}'. Debe ser idéntico.`,
      );
      continue;
    }

    // Check block ID
    const origId = (ob as any).id;
    const transId = (tb as any).id;
    if (origId && transId && origId !== transId) {
      blockIdsMatch = false;
      errors.push(`Bloque #${i + 1}: El ID de bloque '${origId}' fue alterado a '${transId}'.`);
    }

    // Specific block type checks
    if (ob.type === "image") {
      const origImg = ob as { url: string; alt?: string; caption?: string };
      const transImg = tb as { url: string; alt?: string; caption?: string };
      if (origImg.url !== transImg.url) {
        imagesPreserved = false;
        errors.push(
          `Bloque #${i + 1} (Imagen): La URL de la imagen fue alterada de '${origImg.url}' a '${transImg.url}'.`,
        );
      }
    } else if (ob.type === "video") {
      const origVid = ob as { url: string; caption?: string };
      const transVid = tb as { url: string; caption?: string };
      if (origVid.url !== transVid.url) {
        urlsPreserved = false;
        errors.push(`Bloque #${i + 1} (Video): La URL del video fue alterada.`);
      }
    } else if (ob.type === "link") {
      const origLink = ob as { url: string; label: string };
      const transLink = tb as { url: string; label: string };
      if (origLink.url !== transLink.url) {
        urlsPreserved = false;
        errors.push(
          `Bloque #${i + 1} (Enlace): La URL del enlace fue alterada de '${origLink.url}' a '${transLink.url}'.`,
        );
      }
    } else if (ob.type === "heading") {
      const origLvl = (ob as any).level || "h2";
      const transLvl = (tb as any).level || "h2";
      if (origLvl !== transLvl) {
        warnings.push(
          `Bloque #${i + 1} (Encabezado): El nivel del encabezado cambió de '${origLvl}' a '${transLvl}'.`,
        );
      }
    } else if (ob.type === "list") {
      const origList = ob as { items: string[] };
      const transList = tb as { items: string[] };
      if (Array.isArray(origList.items) && Array.isArray(transList.items)) {
        if (origList.items.length !== transList.items.length) {
          warnings.push(
            `Bloque #${i + 1} (Lista): El número de elementos cambió de ${origList.items.length} a ${transList.items.length}.`,
          );
        }
      }
    } else if (ob.type === "paragraph") {
      // Check that all URLs in the original paragraph are preserved in translated paragraph
      const origUrls = extractUrls(ob.text || "");
      const transUrls = extractUrls((tb as { text: string }).text || "");
      for (const u of origUrls) {
        if (!transUrls.includes(u)) {
          // Check if url appears partially or encoded
          const found = transUrls.some((tu) => tu.includes(u) || u.includes(tu));
          if (!found) {
            urlsPreserved = false;
            warnings.push(
              `Bloque #${i + 1} (Párrafo): La URL '${u}' no se detectó en la traducción.`,
            );
          }
        }
      }
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    blockCountMatch,
    blockTypesMatch,
    blockIdsMatch,
    urlsPreserved,
    imagesPreserved,
  };
}
