import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_PUBLIC_MENU_ITEMS } from "../lib/navigation";

describe("DMPS Info — Quiénes somos Suite (ABOUT-01..15)", () => {
  const routePath = path.resolve(process.cwd(), "src/routes/quienes-somos.tsx");
  const routeContent = fs.existsSync(routePath) ? fs.readFileSync(routePath, "utf-8") : "";
  const normalizedContent = routeContent.replace(/\s+/g, " ");

  // ABOUT-01: La ruta /quienes-somos carga.
  it("[ABOUT-01] la ruta /quienes-somos existe y define createFileRoute('/quienes-somos')", () => {
    expect(fs.existsSync(routePath)).toBe(true);
    expect(routeContent).toContain('createFileRoute("/quienes-somos")');
    expect(routeContent).toContain("export const Route =");
  });

  // ABOUT-02: El título "Quiénes somos" aparece.
  it("[ABOUT-02] el título principal 'Quiénes somos' aparece con etiqueta de encabezado", () => {
    expect(routeContent).toContain("<h1");
    expect(routeContent).toContain("Quiénes somos");
    expect(normalizedContent).toContain(
      "Un proyecto independiente creado para hacer la información más fácil de encontrar, entender y utilizar.",
    );
  });

  // ABOUT-03: La información de DMPS Info aparece.
  it("[ABOUT-03] la sección '¿Qué es DMPS Info?' explica la plataforma comunitaria y su origen", () => {
    expect(routeContent).toContain("¿Qué es DMPS Info?");
    expect(normalizedContent).toContain(
      "plataforma independiente enfocada en reunir y organizar información útil",
    );
    expect(routeContent).toContain("¿Por qué existe DMPS Info?");
    expect(normalizedContent).toContain(
      "Hacer que encontrar información útil para la comunidad sea más fácil",
    );
  });

  // ABOUT-04: Las funciones actuales aparecen.
  it("[ABOUT-04] las 5 funciones y tarjetas actuales aparecen explícitamente", () => {
    expect(routeContent).toContain("Información escolar");
    expect(routeContent).toContain("DART y transporte");
    expect(routeContent).toContain("Noticias y comunicados");
    expect(routeContent).toContain("Recursos para familias");
    expect(routeContent).toContain("Comunidad");

    // Verificar las descripciones requeridas
    expect(normalizedContent).toContain(
      "Recursos e información relacionada con escuelas y estudiantes.",
    );
    expect(normalizedContent).toContain(
      "Información de rutas, transporte y herramientas relacionadas con el desplazamiento de la comunidad.",
    );
    expect(normalizedContent).toContain(
      "Un espacio para encontrar información y avisos relevantes.",
    );
    expect(normalizedContent).toContain(
      "Recursos que pueden ser útiles para estudiantes y familias.",
    );
    expect(normalizedContent).toContain(
      "Información y recursos que puedan ayudar a conectar a la comunidad con diferentes servicios.",
    );
  });

  // ABOUT-05: La independencia del proyecto está claramente indicada.
  it("[ABOUT-05] la independencia del proyecto está claramente indicada en múltiples secciones", () => {
    expect(routeContent).toContain("Un proyecto independiente");
    expect(normalizedContent).toContain(
      "DMPS Info no nació como una iniciativa oficial de Des Moines Public Schools.",
    );
    expect(routeContent).toContain("Independiente por diseño");
    expect(routeContent).toContain("Transparencia");
    expect(normalizedContent).toContain(
      "DMPS Info es un proyecto independiente y no representa necesariamente a Des Moines Public Schools, DART ni a ninguna otra institución pública.",
    );
  });

  // ABOUT-06: El creador indica a Jeferson Martinez.
  it("[ABOUT-06] el creador indica a Jeferson Martinez", () => {
    expect(routeContent).toContain("Quién está detrás de DMPS Info");
    expect(routeContent).toContain("Jeferson Martinez");
  });

  // ABOUT-07: La visión futura aparece.
  it("[ABOUT-07] la visión futura 'Lo que viene' y el roadmap conceptual de crecimiento aparecen", () => {
    expect(routeContent).toContain("Lo que viene");
    expect(routeContent).toContain("Más servicios");
    expect(routeContent).toContain("Ayudar a más familias");
    expect(routeContent).toContain("Crecimiento independiente");

    // Roadmap conceptual
    expect(routeContent).toContain("Visión de crecimiento");
    expect(routeContent).toContain("Información y recursos");
    expect(routeContent).toContain("Más herramientas y servicios");
    expect(routeContent).toContain("Más personas conectadas");
    expect(routeContent).toContain("Plataforma integral");
    expect(normalizedContent).toContain(
      "Visión de evolución conceptual, no funcionalidades ya implementadas.",
    );
  });

  // ABOUT-08: No existen afirmaciones falsas de afiliación oficial.
  it("[ABOUT-08] no existen afirmaciones de que DMPS Info o DMPS Transit son agencias públicas oficiales", () => {
    expect(normalizedContent).toContain("DMPS Info no reemplaza los canales oficiales");
    expect(normalizedContent).toContain("consultar siempre las fuentes oficiales correspondientes");
    expect(normalizedContent).toContain("DMPS Transit no es propiedad de una institución pública");
  });

  // ABOUT-09: No existen estadísticas inventadas.
  it("[ABOUT-09] no inventa estadísticas numéricas, premios, usuarios o asociaciones falsas", () => {
    expect(routeContent).not.toContain("más de 10,000");
    expect(routeContent).not.toContain("100% de las familias");
    expect(routeContent).not.toContain("galardonada");
    expect(routeContent).not.toContain("patrocinado por el gobierno");
    expect(routeContent).not.toContain("premio");
  });

  // ABOUT-10: La navegación funciona.
  it("[ABOUT-10] la navegación interna cuenta con botones a '/' y a '/transporte/dart' y está en el menú", () => {
    expect(routeContent).toContain('to="/"');
    expect(routeContent).toContain("Explorar DMPS Info");
    expect(routeContent).toContain('to="/transporte/dart"');
    expect(routeContent).toContain("Conocer la App Escolar");

    // Verificar presencia en DEFAULT_PUBLIC_MENU_ITEMS
    const headerItem = DEFAULT_PUBLIC_MENU_ITEMS.find((i) => i.id === "nav_quienes_somos");
    expect(headerItem).toBeDefined();
    expect(headerItem?.path).toBe("/quienes-somos");

    const resItem = DEFAULT_PUBLIC_MENU_ITEMS.find((i) => i.id === "res_quienes_somos");
    expect(resItem).toBeDefined();
    expect(resItem?.path).toBe("/quienes-somos");

    const footerItem = DEFAULT_PUBLIC_MENU_ITEMS.find((i) => i.id === "footer_quienes_somos");
    expect(footerItem).toBeDefined();
    expect(footerItem?.path).toBe("/quienes-somos");
  });

  // ABOUT-11: Responsive mobile.
  it("[ABOUT-11] cuenta con clases responsivas para visualización óptima en móvil", () => {
    expect(routeContent).toContain("grid");
    expect(routeContent).toContain("sm:grid-cols-2");
    expect(routeContent).toContain("px-4");
    expect(routeContent).toContain("py-8");
    expect(routeContent).toContain("flex-col");
    expect(routeContent).toContain("sm:flex-row");
  });

  // ABOUT-12: Responsive desktop.
  it("[ABOUT-12] cuenta con contención max-w y diseño adaptado a pantallas amplias de escritorio", () => {
    expect(routeContent).toContain("max-w-5xl");
    expect(routeContent).toContain("lg:grid-cols-4");
    expect(routeContent).toContain("lg:grid-cols-3");
    expect(routeContent).toContain("sm:p-10");
  });

  // ABOUT-13: Accessibility checks.
  it("[ABOUT-13] cumple con jerarquía de encabezados, aria-labelledby, y etiquetas semánticas", () => {
    expect(routeContent).toContain("<h1");
    expect(routeContent).toContain("<h2");
    expect(routeContent).toContain("<h3");
    expect(routeContent).toContain("aria-labelledby=");
    expect(routeContent).toContain('aria-hidden="true"');
    expect(routeContent).toContain("<blockquote");
  });

  // ABOUT-14: No broken existing routes.
  it("[ABOUT-14] las rutas y páginas principales existentes siguen existiendo intactas", () => {
    const existingRoutes = [
      "src/routes/index.tsx",
      "src/routes/transporte.dart.tsx",
      "src/routes/faq.tsx",
      "src/routes/calendario.tsx",
      "src/routes/contact.tsx",
      "src/routes/programas.tsx",
      "src/routes/admin.tsx",
    ];

    for (const route of existingRoutes) {
      const fullPath = path.resolve(process.cwd(), route);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  // ABOUT-15: Existing DMPS Info functionality remains intact.
  it("[ABOUT-15] las funcionalidades preexistentes de menú y navegación continúan intactas", () => {
    const homeItem = DEFAULT_PUBLIC_MENU_ITEMS.find((i) => i.id === "nav_home");
    expect(homeItem).toBeDefined();

    const dartItem = DEFAULT_PUBLIC_MENU_ITEMS.find((i) => i.id === "res_dart");
    expect(dartItem).toBeDefined();
    expect(dartItem?.path).toBe("/transporte/dart");
  });
});
