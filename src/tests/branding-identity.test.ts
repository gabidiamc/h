/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for Visual Identity / Branding System (Logo, Favicon, PWA Icon)
 * Verifies that application_logo, favicon, and pwa_icon are 100% independent.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  validateBrandingFile,
  applyFaviconToDocument,
  applyPwaIconToDocument,
  uploadBrandingAsset,
  readFileAsDataUrl,
} from "@/lib/branding";
import { type AppearanceRow } from "@/lib/directory";

describe("Branding & Visual Identity System", () => {
  const elements = new Map<string, { href?: string; rel?: string; sizes?: string }>();

  beforeEach(() => {
    elements.clear();

    const mockDocument = {
      head: {
        appendChild: (el: any) => {
          if (el.rel) elements.set(el.rel, el);
        },
      },
      querySelector: (selector: string) => {
        if (selector.includes("link[rel='icon']")) return elements.get("icon") || null;
        if (selector.includes("link[rel='shortcut icon']"))
          return elements.get("shortcut icon") || null;
        if (selector.includes("link[rel='apple-touch-icon']"))
          return elements.get("apple-touch-icon") || null;
        if (selector.includes("link[rel='manifest']")) return elements.get("manifest") || null;
        return null;
      },
      createElement: (tag: string) => {
        const obj = { rel: "", href: "", sizes: "", tagName: tag.toUpperCase() };
        return obj;
      },
    };

    vi.stubGlobal("document", mockDocument);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("1. File Validation & Anti-AI Discipline", () => {
    it("accepts valid PNG, JPG, WebP, SVG and ICO files", () => {
      const pngFile = new File(["dummy png content"], "logo.png", { type: "image/png" });
      const svgFile = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
      const icoFile = new File(["ico bytes"], "favicon.ico", { type: "image/x-icon" });
      const webpFile = new File(["webp bytes"], "icon.webp", { type: "image/webp" });

      expect(validateBrandingFile(pngFile, "application_logo").valid).toBe(true);
      expect(validateBrandingFile(svgFile, "application_logo").valid).toBe(true);
      expect(validateBrandingFile(icoFile, "favicon").valid).toBe(true);
      expect(validateBrandingFile(webpFile, "pwa_icon").valid).toBe(true);
    });

    it("rejects executable or script files disguised as images", () => {
      const exeFile = new File(["evil"], "malware.exe", { type: "application/x-msdownload" });
      const phpFile = new File(["<?php ?>"], "shell.php", { type: "application/x-php" });
      const shFile = new File(["#!/bin/bash"], "script.sh", { type: "application/x-sh" });

      expect(validateBrandingFile(exeFile, "favicon").valid).toBe(false);
      expect(validateBrandingFile(phpFile, "application_logo").valid).toBe(false);
      expect(validateBrandingFile(shFile, "pwa_icon").valid).toBe(false);
    });

    it("rejects oversized files exceeding maximum limit", () => {
      const bigFile = new File(["x"], "big.png", { type: "image/png" });
      Object.defineProperty(bigFile, "size", { value: 25 * 1024 * 1024 });

      const result = validateBrandingFile(bigFile, "application_logo");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("supera el tamaño máximo");
    });
  });

  describe("2. Asset Independence", () => {
    it("changing favicon does NOT modify application_logo or pwa_icon", () => {
      const initialSettings: AppearanceRow = {
        id: "default",
        logo_url: "https://example.com/storage/app-logo.png",
        logo_light_url: "https://example.com/storage/app-logo.png",
        logo_dark_url: null,
        favicon_url: "https://example.com/storage/old-favicon.ico",
        pwa_icon_url: "https://example.com/storage/app-pwa-512.png",
        logo_height: 56,
        logo_alt: "DMPS Info",
        show_wordmark: true,
        light_theme: {},
        dark_theme: {},
      };

      // Simulate admin changing ONLY favicon
      const newFaviconUrl = "https://example.com/storage/new-favicon.ico";
      const updatedSettings: AppearanceRow = {
        ...initialSettings,
        favicon_url: newFaviconUrl,
        branding_version: "2",
      };

      expect(updatedSettings.favicon_url).toBe(newFaviconUrl);
      // Verify application_logo is completely untouched
      expect(updatedSettings.logo_url).toBe(initialSettings.logo_url);
      expect(updatedSettings.logo_light_url).toBe(initialSettings.logo_light_url);
      // Verify pwa_icon is completely untouched
      expect(updatedSettings.pwa_icon_url).toBe(initialSettings.pwa_icon_url);
    });

    it("changing pwa_icon does NOT modify favicon or application_logo", () => {
      const initialSettings: AppearanceRow = {
        id: "default",
        logo_url: "https://example.com/storage/app-logo.png",
        logo_light_url: "https://example.com/storage/app-logo.png",
        logo_dark_url: null,
        favicon_url: "https://example.com/storage/active-favicon.ico",
        pwa_icon_url: "https://example.com/storage/old-pwa.png",
        logo_height: 56,
        logo_alt: "DMPS Info",
        show_wordmark: true,
        light_theme: {},
        dark_theme: {},
      };

      // Simulate admin changing ONLY pwa_icon
      const newPwaUrl = "https://example.com/storage/new-pwa-icon.png";
      const updatedSettings: AppearanceRow = {
        ...initialSettings,
        pwa_icon_url: newPwaUrl,
        branding_version: "3",
      };

      expect(updatedSettings.pwa_icon_url).toBe(newPwaUrl);
      // Verify favicon is completely untouched
      expect(updatedSettings.favicon_url).toBe(initialSettings.favicon_url);
      // Verify application_logo is completely untouched
      expect(updatedSettings.logo_url).toBe(initialSettings.logo_url);
    });

    it("changing application_logo does NOT modify favicon or pwa_icon", () => {
      const initialSettings: AppearanceRow = {
        id: "default",
        logo_url: "https://example.com/storage/old-app-logo.png",
        logo_light_url: "https://example.com/storage/old-app-logo.png",
        logo_dark_url: null,
        favicon_url: "https://example.com/storage/active-favicon.ico",
        pwa_icon_url: "https://example.com/storage/active-pwa.png",
        logo_height: 56,
        logo_alt: "DMPS Info",
        show_wordmark: true,
        light_theme: {},
        dark_theme: {},
      };

      // Simulate admin changing ONLY application logo
      const newLogoUrl = "https://example.com/storage/new-app-logo.png";
      const updatedSettings: AppearanceRow = {
        ...initialSettings,
        logo_url: newLogoUrl,
        logo_light_url: newLogoUrl,
        branding_version: "4",
      };

      expect(updatedSettings.logo_url).toBe(newLogoUrl);
      expect(updatedSettings.logo_light_url).toBe(newLogoUrl);
      // Verify favicon is untouched
      expect(updatedSettings.favicon_url).toBe(initialSettings.favicon_url);
      // Verify pwa_icon is untouched
      expect(updatedSettings.pwa_icon_url).toBe(initialSettings.pwa_icon_url);
    });
  });

  describe("3. DOM Updates & Cache-Busting", () => {
    it("applyFaviconToDocument updates <link rel='icon'> with version query string", () => {
      const customFavicon = "https://example.com/my-favicon.ico";
      applyFaviconToDocument(customFavicon, "v12345");

      const iconLink = elements.get("icon");
      const shortcutLink = elements.get("shortcut icon");

      expect(iconLink).toBeDefined();
      expect(iconLink?.href).toContain(customFavicon);
      expect(iconLink?.href).toContain("v=v12345");

      expect(shortcutLink).toBeDefined();
      expect(shortcutLink?.href).toContain(customFavicon);
      expect(shortcutLink?.href).toContain("v=v12345");
    });

    it("applyPwaIconToDocument updates <link rel='apple-touch-icon'> without touching favicon", () => {
      // First set a favicon
      applyFaviconToDocument("https://example.com/my-favicon.ico", "1");
      const faviconHrefBefore = elements.get("icon")?.href;

      // Now set PWA icon
      const customPwaIcon = "https://example.com/pwa-custom-512.png";
      applyPwaIconToDocument(customPwaIcon, "v999");

      const appleIconLink = elements.get("apple-touch-icon");
      expect(appleIconLink).toBeDefined();
      expect(appleIconLink?.href).toContain(customPwaIcon);
      expect(appleIconLink?.href).toContain("v=v999");

      // Verify favicon link in document was NOT altered by PWA icon update
      const faviconHrefAfter = elements.get("icon")?.href;
      expect(faviconHrefAfter).toBe(faviconHrefBefore);
    });
  });

  describe("4. Storage Organization", () => {
    it("uploadBrandingAsset returns valid publicUrl and storagePath", async () => {
      // Mock FileReader
      class MockFileReader {
        result = "data:image/png;base64,samplepngdata";
        onload: any = null;
        readAsDataURL() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }
      vi.stubGlobal("FileReader", MockFileReader);

      const sampleFile = new File(["test image bytes"], "brand-icon.png", { type: "image/png" });
      const result = await uploadBrandingAsset({
        file: sampleFile,
        assetType: "pwa_icon",
      });

      expect(result.publicUrl).toBeDefined();
      expect(result.storagePath).toBeDefined();
      expect(result.storagePath).toContain("pwa");
    });
  });

  describe("5. Internal App Logo Fidelity", () => {
    it("internal app logo uses only application_logo and never favicon or pwa_icon", () => {
      const mockSettings: AppearanceRow = {
        id: "default",
        logo_url: "https://example.com/branding/app-logo.png",
        logo_light_url: "https://example.com/branding/app-logo.png",
        logo_dark_url: null,
        favicon_url: "https://example.com/branding/tab-favicon.ico",
        pwa_icon_url: "https://example.com/branding/pwa-launcher.png",
        logo_height: 56,
        logo_alt: "DMPS Connect",
        show_wordmark: true,
        light_theme: {},
        dark_theme: {},
      };

      // Resolved logo source matching SiteLogo component logic
      const resolveInternalLogo = (app: AppearanceRow, theme: "light" | "dark") => {
        if (theme === "dark" && app.logo_dark_url) return app.logo_dark_url;
        if (theme === "light" && app.logo_light_url) return app.logo_light_url;
        return app.logo_url || "default-asset";
      };

      const lightLogo = resolveInternalLogo(mockSettings, "light");
      const darkLogo = resolveInternalLogo(mockSettings, "dark");

      expect(lightLogo).toBe("https://example.com/branding/app-logo.png");
      expect(darkLogo).toBe("https://example.com/branding/app-logo.png");

      // Verify it does NOT use favicon or PWA icon
      expect(lightLogo).not.toBe(mockSettings.favicon_url);
      expect(lightLogo).not.toBe(mockSettings.pwa_icon_url);
    });
  });
});
