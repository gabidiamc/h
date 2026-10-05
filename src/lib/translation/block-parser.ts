/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Block } from "@/lib/content";

/**
 * Converts rich HTML content from visual editor into an array of structured Block objects.
 * Uses the browser DOMParser to safely extract headings, paragraphs, lists, images, and callouts.
 */
export function htmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) return [];

  // If running in browser with DOMParser
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const body = doc.body;
      const blocks: Block[] = [];
      let blockIndex = 1;

      for (let i = 0; i < body.children.length; i++) {
        const el = body.children[i] as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const id = `blk_${blockIndex++}`;

        if (/^h[1-6]$/.test(tag)) {
          blocks.push({
            type: "heading",
            level: tag,
            text: el.textContent?.trim() || "",
            id,
          } as any);
        } else if (tag === "figure") {
          const img = el.querySelector("img");
          const caption = el.querySelector("figcaption");
          if (img && (img.getAttribute("src") || img.src)) {
            blocks.push({
              type: "image",
              url: img.getAttribute("src") || img.src,
              alt: img.getAttribute("alt") || "",
              caption: caption?.textContent?.trim() || undefined,
              id,
            });
          } else {
            blocks.push({
              type: "paragraph",
              text: el.outerHTML,
              id,
            });
          }
        } else if (tag === "img") {
          const img = el as HTMLImageElement;
          blocks.push({
            type: "image",
            url: img.getAttribute("src") || img.src,
            alt: img.getAttribute("alt") || "",
            id,
          });
        } else if (tag === "ul" || tag === "ol") {
          const lis = Array.from(el.querySelectorAll("li"));
          blocks.push({
            type: "list",
            items: lis.map((li) => li.innerHTML.trim()),
            id,
          });
        } else if (
          tag === "div" &&
          (el.style.backgroundColor?.includes("eff6ff") ||
            el.className?.includes("callout") ||
            el.textContent?.includes("💡"))
        ) {
          blocks.push({
            type: "callout",
            text: el.innerHTML.replace(/^💡\s*/, "").trim(),
            id,
          });
        } else {
          // Paragraph, button wrapper, or custom block
          blocks.push({
            type: "paragraph",
            text: el.outerHTML,
            id,
          });
        }
      }

      if (blocks.length > 0) return blocks;
    } catch {
      // Fallback below
    }
  }

  // Fallback: single paragraph block
  return [{ type: "paragraph", text: html, id: "blk_1" }];
}

/**
 * Converts structured Block[] back to clean HTML.
 */
export function blocksToHtml(blocks: Block[]): string {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return "";
  return blocks
    .map((b) => {
      if (b.type === "paragraph") {
        const txt = b.text || "";
        return txt.trim().startsWith("<") && txt.trim().endsWith(">") ? txt : `<p>${txt}</p>`;
      }
      if (b.type === "heading") {
        const lvl = (b as any).level || "h2";
        return `<${lvl}>${b.text || ""}</${lvl}>`;
      }
      if (b.type === "callout") {
        return `<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem 1.25rem; border-radius: 0.75rem; margin: 1rem 0; color: #1e3a8a; font-weight: 500;">💡 ${b.text || ""}</div>`;
      }
      if (b.type === "list") {
        const items = Array.isArray(b.items)
          ? b.items.map((i: string) => `<li>${i}</li>`).join("")
          : "";
        return `<ul>${items}</ul>`;
      }
      if (b.type === "image" && b.url) {
        return `<figure data-layer-mode="inline" data-free-flow="false" style="margin: 1.25rem auto; text-align: center; display: block; clear: both;"><img src="${b.url}" alt="${b.alt || ""}" data-layer-mode="inline" data-free-flow="false" data-x="0" data-y="0" data-rotation="0" data-z-index="2" style="width: 100%; max-width: 640px; height: auto; border-radius: 1rem; display: block; margin-left: auto; margin-right: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />${b.caption ? `<figcaption style="text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">${b.caption}</figcaption>` : ""}</figure>`;
      }
      if (b.type === "link" && b.url) {
        return `<p><a href="${b.url}" target="_blank" rel="noopener noreferrer">${b.label || b.url}</a></p>`;
      }
      return (b as any).text ? `<p>${(b as any).text}</p>` : "";
    })
    .join("\n");
}
