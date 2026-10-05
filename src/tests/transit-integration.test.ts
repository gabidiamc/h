import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_APP_ARTICLE } from "../lib/app-article";

describe("DMPS Info — Featured App Article & Admin Editor Suite", () => {
  // APP-01: Public App route exists in place of old DART space
  it("[APP-01] provides public route /transporte/dart and gateway /dart hosting the App space", () => {
    const publicAppPath = path.resolve(process.cwd(), "src/routes/transporte.dart.tsx");
    const gatewayPath = path.resolve(process.cwd(), "src/routes/dart.tsx");

    expect(fs.existsSync(publicAppPath)).toBe(true);
    expect(fs.existsSync(gatewayPath)).toBe(true);

    const publicContent = fs.readFileSync(publicAppPath, "utf-8");
    expect(publicContent).toContain('Route = createFileRoute("/transporte/dart")');
    expect(publicContent).toContain("AppArticlePublicPage");
  });

  // APP-02: Old DART school routes space and system eliminated from the public view
  it("[APP-02] eliminates the old DART school routes and replaces with the App article", () => {
    const publicAppPath = path.resolve(process.cwd(), "src/routes/transporte.dart.tsx");
    const content = fs.readFileSync(publicAppPath, "utf-8");

    // DART bus route system is replaced
    expect(content).not.toContain("DEFAULT_DART_ROUTES");
    expect(content).not.toContain("TransitIntegrationContainer");
    expect(content).toContain("fetchAppArticle");
  });

  // APP-03: Displays app link, app photo, description, and information
  it("[APP-03] renders the app link, photo, and detailed information/description", () => {
    const publicAppPath = path.resolve(process.cwd(), "src/routes/transporte.dart.tsx");
    const content = fs.readFileSync(publicAppPath, "utf-8");

    // App link
    expect(content).toContain("article.appUrl");
    expect(content).toContain("Descargar / Abrir App");

    // App photo
    expect(content).toContain("article.imageUrl");
    expect(content).toContain("Fotografía de la App");

    // Information and description
    expect(content).toContain("article.description");
    expect(content).toContain("article.title");
    expect(content).toContain("article.features");
  });

  // APP-04: Admin panel editor exists and is secured
  it("[APP-04] provides an Admin Panel editor to edit the app link, photo, description and details", () => {
    const adminEditorPath = path.resolve(process.cwd(), "src/routes/admin.dart.configuracion.tsx");
    const adminIndexPath = path.resolve(process.cwd(), "src/routes/admin.dart.index.tsx");

    expect(fs.existsSync(adminEditorPath)).toBe(true);
    expect(fs.existsSync(adminIndexPath)).toBe(true);

    const editorContent = fs.readFileSync(adminEditorPath, "utf-8");
    expect(editorContent).toContain("app_article_editor");
    expect(editorContent).toContain("Gestión del Artículo de la App");
    expect(editorContent).toContain("appUrl");
    expect(editorContent).toContain("imageUrl");
    expect(editorContent).toContain("description");
    expect(editorContent).toContain("saveAppArticle");

    const indexContent = fs.readFileSync(adminIndexPath, "utf-8");
    expect(indexContent).toContain("robots");
    expect(indexContent).toContain("noindex, nofollow");
  });

  // APP-05: Admin sidebar and dashboard navigation links to the App editor
  it("[APP-05] links to the App editor in admin-shell sidebar and admin dashboard", () => {
    const shellPath = path.resolve(process.cwd(), "src/components/admin/admin-shell.tsx");
    const dashboardPath = path.resolve(process.cwd(), "src/routes/admin.index.tsx");

    const shellContent = fs.readFileSync(shellPath, "utf-8");
    expect(shellContent).toContain("Artículo de la App");
    expect(shellContent).toContain("/admin/dart/configuracion");

    const dashContent = fs.readFileSync(dashboardPath, "utf-8");
    expect(dashContent).toContain("Artículo y Enlace de la App");
    expect(dashContent).toContain("/admin/dart/configuracion");
  });

  // APP-06: Firebase Blueprint and Firestore Rules include AppArticle
  it("[APP-06] defines AppArticle in firebase-blueprint.json and secures it in firestore.rules", () => {
    const blueprintPath = path.resolve(process.cwd(), "firebase-blueprint.json");
    const rulesPath = path.resolve(process.cwd(), "firestore.rules");

    const blueprint = JSON.parse(fs.readFileSync(blueprintPath, "utf-8"));
    expect(blueprint.entities.AppArticle).toBeDefined();
    expect(blueprint.firestore["/app_articles/{articleId}"]).toBeDefined();

    const rules = fs.readFileSync(rulesPath, "utf-8");
    expect(rules).toContain("match /app_articles/{articleId}");
    expect(rules).toContain("isValidAppArticle");
  });

  // APP-07: Default App Article has valid fields
  it("[APP-07] provides sensible and complete initial default app article data", () => {
    expect(DEFAULT_APP_ARTICLE.title).toBeTruthy();
    expect(DEFAULT_APP_ARTICLE.appUrl).toMatch(/^https?:\/\//);
    expect(DEFAULT_APP_ARTICLE.imageUrl).toMatch(/^https?:\/\//);
    expect(DEFAULT_APP_ARTICLE.description.length).toBeGreaterThan(50);
    expect(DEFAULT_APP_ARTICLE.features.length).toBeGreaterThan(0);
  });
});
