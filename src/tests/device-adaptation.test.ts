import { describe, it, expect } from "vitest";
import { adaptHtmlForDevice, detectDeviceProfile } from "../lib/device-adaptation";

describe("Device Adaptation System (Desktop vs Mobile Division)", () => {
  it("detects desktop profile by default in test environment", () => {
    expect(detectDeviceProfile()).toBe("desktop");
  });

  it("preserves original desktop HTML verbatim when target is desktop", () => {
    const desktopHtml = `
<figure style="height: 0px; float: left; margin: 0px;"><img src="https://example.com/art.jpg" style="left: 120px; top: 40px; width: 500px; height: 350px;" /></figure>
<p>Article content on computer layout.</p>
    `.trim();

    const output = adaptHtmlForDevice(desktopHtml, "desktop");
    expect(output).toBe(desktopHtml);
  });

  it("reorganizes desktop floated and offset images into vertical mobile flow", () => {
    const desktopHtml = `
<figure style="float: left; margin: 1rem;"><img src="https://example.com/photo.jpg" style="float: left; left: 150px; top: 80px; width: 600px; height: 400px; margin-right: 1.5rem;" /></figure>
<p>Text that was squeezed next to the float on computer screens.</p>
    `.trim();

    const mobileHtml = adaptHtmlForDevice(desktopHtml, "mobile");

    // Float must be neutralized
    expect(mobileHtml).not.toContain("float: left;");
    expect(mobileHtml).toContain("float: none;");

    // Offsets neutralized
    expect(mobileHtml).not.toContain("left: 150px;");
    expect(mobileHtml).toContain("left: 0px;");
    expect(mobileHtml).not.toContain("top: 80px;");
    expect(mobileHtml).toContain("top: 0px;");

    // Responsive bounds enforced
    expect(mobileHtml).toContain("max-width: 100%;");
    expect(mobileHtml).toContain("height: auto;");
  });

  it("restores collapsed free-flow sticker figures so they never vanish on mobile", () => {
    const freeFlowFigure = `
<figure data-free-flow="true" style="height: 0px; line-height: 0; margin: 0px; padding: 0px; position: static;">
  <img src="https://example.com/sticker.png" style="width: 250px; height: 250px; z-index: -5;" />
</figure>
<p>Subsequent paragraph that should not overlap the sticker on phones.</p>
    `.trim();

    const mobileHtml = adaptHtmlForDevice(freeFlowFigure, "mobile");

    // Must not have height 0 or line-height 0
    expect(mobileHtml).not.toContain("height: 0px;");
    expect(mobileHtml).toContain("height: auto;");
    expect(mobileHtml).not.toContain("line-height: 0;");
    expect(mobileHtml).toContain("line-height: normal;");

    // Margin must be natural
    expect(mobileHtml).toContain("margin: 1.25rem auto;");

    // Negative z-index must be lifted to 1
    expect(mobileHtml).not.toContain("z-index: -5;");
    expect(mobileHtml).toContain("z-index: 1;");
  });

  it("preserves exact structural sequence between paragraphs and images", () => {
    const sequentialArticle = `
<h2>Section Title</h2>
<p>Intro paragraph.</p>
<figure><img src="https://example.com/img1.jpg" style="width: 500px;" /></figure>
<p>Middle paragraph.</p>
<figure><img src="https://example.com/img2.jpg" style="width: 500px;" /></figure>
<p>Conclusion paragraph.</p>
    `.trim();

    const mobileHtml = adaptHtmlForDevice(sequentialArticle, "mobile");

    const idxTitle = mobileHtml.indexOf("Section Title");
    const idxP1 = mobileHtml.indexOf("Intro paragraph.");
    const idxImg1 = mobileHtml.indexOf("https://example.com/img1.jpg");
    const idxP2 = mobileHtml.indexOf("Middle paragraph.");
    const idxImg2 = mobileHtml.indexOf("https://example.com/img2.jpg");
    const idxP3 = mobileHtml.indexOf("Conclusion paragraph.");

    expect(idxTitle).toBeGreaterThan(-1);
    expect(idxP1).toBeGreaterThan(idxTitle);
    expect(idxImg1).toBeGreaterThan(idxP1);
    expect(idxP2).toBeGreaterThan(idxImg1);
    expect(idxImg2).toBeGreaterThan(idxP2);
    expect(idxP3).toBeGreaterThan(idxImg2);
  });
});
