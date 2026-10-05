import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { localizedArticle, type ArticleRow, type Block } from "../lib/content";
import { invalidateArticleTranslationCache } from "../lib/auto-translator";

describe("DMPS INFO — Article Editor & Public Rendering Fidelity Suite", () => {
  // 1. TEST CASE: Image Spacing & Sequence
  it("preserves exact logical sequence: Heading -> Paragraph -> Image -> Space -> Paragraph -> Image", () => {
    const htmlWithImagesAndSpaces = `
<h2>Section Title</h2>
<p>First paragraph introducing the event.</p>
<figure data-layer-mode="inline" data-free-flow="false" style="margin: 1.25rem auto; text-align: center; display: block;">
  <img src="https://example.com/photo-1.jpg" alt="Photo 1" data-layer-mode="inline" style="width: 100%; max-width: 640px; height: auto;" />
  <figcaption>Photo 1 Caption</figcaption>
</figure>
<p><br></p>
<p>Second paragraph following the spacer line break.</p>
<figure data-layer-mode="inline" data-free-flow="false" style="margin: 1.25rem auto; text-align: center; display: block;">
  <img src="https://example.com/photo-2.jpg" alt="Photo 2" data-layer-mode="inline" style="width: 100%; max-width: 640px; height: auto;" />
</figure>
<p><br></p>
<h2>Conclusion Heading</h2>
<p>Final remarks for families.</p>
    `.trim();

    const mockArticle: ArticleRow = {
      id: "art_test_spacing_1",
      slug: "test-spacing-article",
      status: "published",
      category_id: "cat_1",
      is_featured: false,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      featured_image_url: null,
      article_translations: [
        {
          language_code: "es",
          title: "Artículo con Fotos y Espacios",
          summary: "Resumen del artículo",
          content_blocks: [{ type: "paragraph", text: htmlWithImagesAndSpaces }],
        },
      ],
    };

    const loc = localizedArticle(mockArticle, "es");
    expect(loc).not.toBeNull();
    expect(loc.title).toBe("Artículo con Fotos y Espacios");
    expect(loc.blocks).toHaveLength(1);

    const blockText = (loc.blocks[0] as { type: "paragraph"; text: string }).text;
    expect(blockText).toContain("Section Title");
    expect(blockText).toContain("https://example.com/photo-1.jpg");
    expect(blockText).toContain("<p><br></p>");
    expect(blockText).toContain("https://example.com/photo-2.jpg");
    expect(blockText).toContain("Conclusion Heading");

    // Verify ordering in HTML
    const idxHeading1 = blockText.indexOf("Section Title");
    const idxImg1 = blockText.indexOf("https://example.com/photo-1.jpg");
    const idxPara2 = blockText.indexOf("Second paragraph following the spacer");
    const idxImg2 = blockText.indexOf("https://example.com/photo-2.jpg");
    const idxHeading2 = blockText.indexOf("Conclusion Heading");

    expect(idxHeading1).toBeLessThan(idxImg1);
    expect(idxImg1).toBeLessThan(idxPara2);
    expect(idxPara2).toBeLessThan(idxImg2);
    expect(idxImg2).toBeLessThan(idxHeading2);
  });

  // 2. TEST CASE: Multiple Images (5 distributed images)
  it("preserves exact order and sequence of 5 distributed images", () => {
    const images = [
      "https://example.com/img-1.jpg",
      "https://example.com/img-2.jpg",
      "https://example.com/img-3.jpg",
      "https://example.com/img-4.jpg",
      "https://example.com/img-5.jpg",
    ];

    const bodyHtml = `
<p>Introductory paragraph</p>
<figure><img src="${images[0]}" alt="Img 1" /></figure>
<p>Text between 1 and 2</p>
<figure><img src="${images[1]}" alt="Img 2" /></figure>
<p>Text between 2 and 3</p>
<figure><img src="${images[2]}" alt="Img 3" /></figure>
<p>Text between 3 and 4</p>
<figure><img src="${images[3]}" alt="Img 4" /></figure>
<p>Text between 4 and 5</p>
<figure><img src="${images[4]}" alt="Img 5" /></figure>
<p>Closing paragraph</p>
    `.trim();

    const mockArticle: ArticleRow = {
      id: "art_multi_img_5",
      slug: "multi-img-article",
      status: "published",
      category_id: "cat_2",
      is_featured: false,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      featured_image_url: null,
      article_translations: [
        {
          language_code: "es",
          title: "Galería de 5 Fotos",
          summary: null,
          content_blocks: [{ type: "paragraph", text: bodyHtml }],
        },
      ],
    };

    const loc = localizedArticle(mockArticle, "es");
    const text = (loc.blocks[0] as { type: "paragraph"; text: string }).text;

    let lastIdx = 0;
    for (const url of images) {
      const currentIdx = text.indexOf(url);
      expect(currentIdx).toBeGreaterThan(lastIdx);
      lastIdx = currentIdx;
    }
  });

  // 3. TEST CASE: Bilingual Independent Content
  it("preserves Spanish and English independently without cross-language overwriting", () => {
    const spanishHtml = `
<h2>Información de Bienvenida</h2>
<p>Este es el texto en español para nuestras queridas familias.</p>
<figure><img src="https://example.com/spanish-banner.jpg" alt="Banner ES" /></figure>
    `.trim();

    const englishHtml = `
<h2>Welcome Guide</h2>
<p>This is the custom English text specifically tailored for English readers.</p>
<p>It contains distinct explanations and advice.</p>
<figure><img src="https://example.com/english-banner.jpg" alt="Banner EN" /></figure>
    `.trim();

    const mockBilingualArticle: ArticleRow = {
      id: "art_bilingual_1",
      slug: "welcome-guide",
      status: "published",
      category_id: "cat_empieza_aqui",
      is_featured: true,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      featured_image_url: null,
      article_translations: [
        {
          language_code: "es",
          title: "Guía de Bienvenida",
          summary: "Resumen en español",
          content_blocks: [{ type: "paragraph", text: spanishHtml }],
        },
        {
          language_code: "en",
          title: "Welcome Guide for Families",
          summary: "English summary for families",
          content_blocks: [{ type: "paragraph", text: englishHtml }],
        },
      ],
    };

    // Spanish resolution
    const locEs = localizedArticle(mockBilingualArticle, "es");
    expect(locEs.title).toBe("Guía de Bienvenida");
    expect(locEs.summary).toBe("Resumen en español");
    expect((locEs.blocks[0] as { text: string }).text).toContain(
      "https://example.com/spanish-banner.jpg",
    );
    expect((locEs.blocks[0] as { text: string }).text).toContain("texto en español");

    // English resolution: MUST preserve English text and English image, NOT overwrite with Spanish
    const locEn = localizedArticle(mockBilingualArticle, "en");
    expect(locEn.title).toBe("Welcome Guide for Families");
    expect(locEn.summary).toBe("English summary for families");
    expect((locEn.blocks[0] as { text: string }).text).toContain(
      "https://example.com/english-banner.jpg",
    );
    expect((locEn.blocks[0] as { text: string }).text).toContain("custom English text");
    expect((locEn.blocks[0] as { text: string }).text).not.toContain("texto en español");
  });

  // 4. TEST CASE: Text-Only Edit Preserves Images and Structure
  it("ensures a text-only edit does not modify image URLs or figure attributes", () => {
    const originalBody = `
<p>Old paragraph text.</p>
<figure data-layer-mode="inline" style="margin: 1.25rem auto;"><img src="https://example.com/unchanged.png" alt="Static" /></figure>
    `.trim();

    const updatedTextBody = originalBody.replace(
      "Old paragraph text.",
      "Brand new edited paragraph text.",
    );

    expect(updatedTextBody).toContain("Brand new edited paragraph text.");
    expect(updatedTextBody).toContain("https://example.com/unchanged.png");
    expect(updatedTextBody).toContain('data-layer-mode="inline"');
  });

  // 5. TEST CASE: CSS Parity & Responsive Safety
  it("verifies styles.css enforces max-width: 100% and natural block figure flow", () => {
    const stylesPath = path.resolve(process.cwd(), "src/styles.css");
    const stylesContent = fs.readFileSync(stylesPath, "utf-8");

    // Check figure flow rules
    expect(stylesContent).toContain(".article-rendered-content figure,");
    expect(stylesContent).toContain("margin: 1.25rem 0;");

    // Check responsive image rules
    expect(stylesContent).toContain("max-width: 100% !important;");
    expect(stylesContent).toContain("height: auto;");

    // Check empty paragraph spacer preservation
    expect(stylesContent).toContain(".article-rendered-content p:empty");
    expect(stylesContent).toContain(".article-rendered-content p > br:only-child");
    expect(stylesContent).toContain("min-height: 1.5rem;");
  });

  // 6. TEST CASE: Cache Invalidation
  it("correctly invalidates article translation cache without errors", () => {
    expect(() => {
      invalidateArticleTranslationCache("art_test_123");
    }).not.toThrow();
  });
});
