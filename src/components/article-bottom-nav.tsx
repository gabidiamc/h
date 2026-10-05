import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import type { ArticleBottomNav as ArticleBottomNavType } from "@/lib/content";

interface ArticleBottomNavProps {
  bottomNav?: ArticleBottomNavType | null;
  category?: { id?: string; slug?: string; name?: string } | null;
  currentSlug?: string;
  lang?: "es" | "en" | string;
}

export function ArticleBottomNav({ bottomNav, category, lang = "es" }: ArticleBottomNavProps) {
  // If not enabled or no nav configuration, do not render this section
  if (!bottomNav || !bottomNav.enabled) {
    return null;
  }

  const isEs = lang === "es";

  // 1. Back button config
  const back = bottomNav.back || { enabled: true, targetType: "category" };
  const backEnabled = back.enabled !== false;

  let backHref = "/topics";
  let isBackBrowser = false;
  let isBackExternal = false;

  if (back.targetType === "category") {
    backHref = category?.slug ? `/topics/${category.slug}` : "/topics";
  } else if (back.targetType === "topics") {
    backHref = "/topics";
  } else if (back.targetType === "browser_back") {
    isBackBrowser = true;
  } else if (back.targetType === "custom_url") {
    backHref = back.targetUrl || "/topics";
    if (backHref.startsWith("http://") || backHref.startsWith("https://")) {
      isBackExternal = true;
    }
  }

  const backLabel =
    back.label?.trim() ||
    (back.targetType === "category" && category?.name
      ? `${isEs ? "Volver a" : "Back to"} ${category.name}`
      : isEs
        ? "Volver a Temas"
        : "Back to Topics");

  const backSublabel =
    back.sublabel?.trim() || (isEs ? "Regresar al catálogo" : "Return to catalog");

  // 2. Next button config
  const next = bottomNav.next || { enabled: false };
  const nextEnabled = next.enabled !== false && (next.targetSlug || next.targetUrl);

  let nextHref = "#";
  let isNextExternal = false;

  if (next.targetType === "article") {
    nextHref = next.targetSlug ? `/articles/${next.targetSlug}` : "#";
  } else if (next.targetType === "internal_page") {
    nextHref = next.targetUrl || "/";
  } else if (next.targetType === "external_url") {
    nextHref = next.targetUrl || "#";
    isNextExternal = true;
  }

  const nextLabel =
    next.label?.trim() ||
    next.targetTitle?.trim() ||
    (isEs ? "Continuar con el siguiente tema" : "Continue to next topic");

  const nextSublabel = next.sublabel?.trim() || (isEs ? "Siguiente artículo" : "Next article");

  if (!backEnabled && !nextEnabled) {
    return null;
  }

  return (
    <nav
      aria-label={isEs ? "Navegación entre artículos" : "Article navigation"}
      className="mt-12 pt-8 border-t border-border/80"
    >
      <div
        className={`grid gap-4 ${
          backEnabled && nextEnabled ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* BOTÓN DE VOLVER */}
        {backEnabled && (
          <div>
            {isBackBrowser ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && window.history.length > 1) {
                    window.history.back();
                  } else {
                    window.location.href = backHref;
                  }
                }}
                className="group flex w-full h-full min-h-[88px] flex-col justify-center rounded-2xl border border-border/80 bg-card p-4 sm:p-5 text-start transition-all duration-200 hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  <ArrowLeft className="size-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
                  <span>{isEs ? "Volver" : "Back"}</span>
                </div>
                <span className="mt-1.5 text-base sm:text-lg font-bold text-foreground line-clamp-2">
                  {backLabel}
                </span>
                {backSublabel && (
                  <span className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {backSublabel}
                  </span>
                )}
              </button>
            ) : isBackExternal ? (
              <a
                href={backHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full h-full min-h-[88px] flex-col justify-center rounded-2xl border border-border/80 bg-card p-4 sm:p-5 text-start transition-all duration-200 hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  <ArrowLeft className="size-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
                  <span>{isEs ? "Volver" : "Back"}</span>
                </div>
                <span className="mt-1.5 text-base sm:text-lg font-bold text-foreground line-clamp-2">
                  {backLabel}
                </span>
                {backSublabel && (
                  <span className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {backSublabel}
                  </span>
                )}
              </a>
            ) : (
              <Link
                to={backHref}
                className="group flex w-full h-full min-h-[88px] flex-col justify-center rounded-2xl border border-border/80 bg-card p-4 sm:p-5 text-start transition-all duration-200 hover:border-primary/50 hover:bg-muted/30 hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  <ArrowLeft className="size-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
                  <span>{isEs ? "Volver" : "Back"}</span>
                </div>
                <span className="mt-1.5 text-base sm:text-lg font-bold text-foreground line-clamp-2">
                  {backLabel}
                </span>
                {backSublabel && (
                  <span className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {backSublabel}
                  </span>
                )}
              </Link>
            )}
          </div>
        )}

        {/* BOTÓN DE SIGUIENTE */}
        {nextEnabled && (
          <div>
            {isNextExternal ? (
              <a
                href={nextHref}
                target={next.openInNewTab ? "_blank" : undefined}
                rel={next.openInNewTab ? "noopener noreferrer" : undefined}
                className="group flex w-full h-full min-h-[88px] flex-col justify-center rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 text-start transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-primary/40 sm:text-end"
              >
                <div className="flex items-center justify-between sm:flex-row-reverse gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary">
                    <span>{isEs ? "Siguiente" : "Next"}</span>
                    <ExternalLink className="size-3.5" />
                  </div>
                  {nextSublabel && (
                    <span className="text-[11px] font-semibold text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/60">
                      {nextSublabel}
                    </span>
                  )}
                </div>
                <span className="mt-1.5 text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {nextLabel}
                </span>
              </a>
            ) : (
              <Link
                to={nextHref}
                className="group flex w-full h-full min-h-[88px] flex-col justify-center rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 text-start transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-primary/40 sm:text-end"
              >
                <div className="flex items-center justify-between sm:flex-row-reverse gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-primary">
                    <span>{isEs ? "Siguiente" : "Next"}</span>
                    <ArrowRight className="size-4 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                  </div>
                  {nextSublabel && (
                    <span className="text-[11px] font-semibold text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/60">
                      {nextSublabel}
                    </span>
                  )}
                </div>
                <span className="mt-1.5 text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {nextLabel}
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
