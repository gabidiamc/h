/**
 * DMPS INFO - Device Adaptation System
 *
 * Automatically divides and optimizes articles for different device categories:
 * - Desktop / Computers: Full multi-column, float, and free-layer Canva layouts.
 * - Mobile / Phones: Reorganizes all images, callouts, and text blocks into an
 *   optimized, single-column vertical flow with responsive bounds and balanced spacing.
 */

export type DeviceProfile = "desktop" | "mobile";

/**
 * Detects whether the current environment is a phone/mobile device or a desktop computer.
 * Runs safely on both browser and server/test environments.
 */
export function detectDeviceProfile(): DeviceProfile {
  if (typeof window === "undefined") {
    return "desktop";
  }

  // 1. Check viewport width (phones generally < 768px)
  const isNarrow = window.innerWidth < 768;

  // 2. Check touch capability (phones/handhelds)
  const hasTouch =
    ("maxTouchPoints" in navigator && navigator.maxTouchPoints > 0) ||
    window.matchMedia("(pointer: coarse)").matches;

  // 3. User agent hints for phones
  const ua = navigator.userAgent || "";
  const isPhoneUa = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  if (isNarrow || (hasTouch && isPhoneUa)) {
    return "mobile";
  }

  return "desktop";
}

/**
 * Reorganizes and optimizes article HTML according to target device parameters.
 * - Desktop: Keeps original coordinates, floats, and rich desktop placements intact.
 * - Mobile: Strips disruptive floats and absolute offsets, restores collapsed figures,
 *   and enforces clean vertical stacked flow with auto-scaled images.
 */
export function adaptHtmlForDevice(html: string, targetDevice: DeviceProfile): string {
  if (!html || typeof html !== "string") return "";

  // If targeting desktop, preserve original markup exactly
  if (targetDevice === "desktop") {
    return html;
  }

  // Mobile optimization:
  let mobileHtml = html;

  // 1. Neutralize figures collapsed for desktop free-flow overlays (height: 0 -> natural flow)
  mobileHtml = mobileHtml.replace(
    /<figure([^>]*?)style="([^"]*?)"([^>]*?)>/gi,
    (match, before, styleStr, after) => {
      let cleanedStyle = styleStr
        .replace(/height:\s*0px;?/gi, "height: auto;")
        .replace(/line-height:\s*0;?/gi, "line-height: normal;")
        .replace(/margin:\s*0px;?/gi, "margin: 1.25rem auto;")
        .replace(/padding:\s*0px;?/gi, "")
        .replace(/float:\s*(left|right);?/gi, "float: none;")
        .replace(/position:\s*static;?/gi, "position: relative;");

      if (!cleanedStyle.includes("margin:")) {
        cleanedStyle += "; margin: 1.25rem auto;";
      }
      if (!cleanedStyle.includes("text-align:")) {
        cleanedStyle += "; text-align: center;";
      }

      return `<figure${before}style="${cleanedStyle.trim()}"${after}>`;
    },
  );

  // 2. Neutralize inline image dimensions and offsets that cause horizontal scrolling or text squeezing on phones
  mobileHtml = mobileHtml.replace(
    /<img([^>]*?)style="([^"]*?)"([^>]*?)>/gi,
    (match, before, styleStr, after) => {
      let cleanedStyle = styleStr
        // Remove disruptive offsets
        .replace(/left:\s*[-0-9.]+px;?/gi, "left: 0px;")
        .replace(/right:\s*[-0-9.]+px;?/gi, "right: auto;")
        .replace(/top:\s*[-0-9.]+px;?/gi, "top: 0px;")
        .replace(/bottom:\s*[-0-9.]+px;?/gi, "bottom: auto;")
        // Remove floats
        .replace(/float:\s*(left|right);?/gi, "float: none;")
        .replace(/margin-right:\s*[-0-9.]+rem;?/gi, "margin-right: auto;")
        .replace(/margin-left:\s*[-0-9.]+rem;?/gi, "margin-left: auto;")
        // Ensure auto height and bounded max-width
        .replace(/height:\s*[-0-9.]+px;?/gi, "height: auto;")
        // Ensure negative z-index is not buried
        .replace(/z-index:\s*-[0-9]+;?/gi, "z-index: 1;");

      if (!cleanedStyle.includes("max-width:")) {
        cleanedStyle += "; max-width: 100%;";
      }
      if (!cleanedStyle.includes("height:")) {
        cleanedStyle += "; height: auto;";
      }
      if (!cleanedStyle.includes("display:")) {
        cleanedStyle += "; display: block;";
      }
      if (!cleanedStyle.includes("margin-left:")) {
        cleanedStyle += "; margin-left: auto; margin-right: auto;";
      }

      return `<img${before}style="${cleanedStyle.trim()}"${after}>`;
    },
  );

  return mobileHtml;
}
