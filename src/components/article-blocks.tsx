/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import { ExternalLink, Info, TriangleAlert, CircleCheck, Sparkles } from "lucide-react";

import type { Block } from "@/lib/content";
import { useI18n } from "@/lib/i18n";
import {
  CanvaSvgMaskDefs,
  syncArticleCanvasMinHeight,
} from "@/components/canva-image-direct-editor";

const CALLOUT = {
  info: {
    wrap: "border-primary/25 bg-primary/10 text-primary-foreground",
    Icon: Info,
    tone: "text-primary",
  },
  important: {
    wrap: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
    Icon: TriangleAlert,
    tone: "text-amber-500",
  },
  warning: {
    wrap: "border-warning/40 bg-warning/10 text-warning-foreground",
    Icon: TriangleAlert,
    tone: "text-warning-foreground",
  },
  urgent: {
    wrap: "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-100",
    Icon: TriangleAlert,
    tone: "text-rose-500",
  },
  success: {
    wrap: "border-leaf/40 bg-leaf/10 text-leaf-foreground",
    Icon: CircleCheck,
    tone: "text-leaf-foreground",
  },
  verified: {
    wrap: "border-leaf/40 bg-leaf/10 text-leaf-foreground",
    Icon: CircleCheck,
    tone: "text-leaf-foreground",
  },
  luxury: {
    wrap: "border-amber-500/50 bg-slate-950 text-amber-400 shadow-md",
    Icon: Sparkles,
    tone: "text-amber-400",
  },
} as const;

function FormattedText({ text, className = "" }: { text?: string; className?: string }) {
  if (!text) return null;

  // Convert markdown **bold** to <strong>bold</strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Convert markdown [text](url) to <a href="url" target="_blank" rel="noopener noreferrer" class="text-primary font-bold underline">$1</a>
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary font-bold underline">$1</a>',
  );

  const hasHtml = html.includes("<") || html.includes(">");

  if (hasHtml) {
    return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return <span className={className}>{text}</span>;
}

export function ArticleBlocks({ blocks }: { blocks: Block[] }) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const syncAll = () => {
      root
        .querySelectorAll<HTMLElement>(".article-rendered-content")
        .forEach((el) => syncArticleCanvasMinHeight(el));
    };
    syncAll();
    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
    imgs.forEach((img) => img.addEventListener("load", syncAll));
    const timer = setTimeout(syncAll, 150);
    return () => {
      clearTimeout(timer);
      imgs.forEach((img) => img.removeEventListener("load", syncAll));
    };
  }, [blocks]);

  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      <CanvaSvgMaskDefs />
      <div ref={containerRef} className="space-y-6">
        {blocks.map((block: any, index: number) => {
          const key = `${block.type}-${index}`;
          switch (block.type) {
            case "heading": {
              const Tag = (block.level || "h2") as any;
              const sizeClass =
                block.level === "h1"
                  ? "text-3xl sm:text-4xl font-extrabold"
                  : block.level === "h3"
                    ? "text-xl sm:text-2xl font-bold"
                    : block.level === "h4"
                      ? "text-lg font-bold"
                      : "text-2xl sm:text-3xl font-extrabold";

              return (
                <Tag
                  key={key}
                  className={`pt-2 tracking-tight ${sizeClass}`}
                  style={{
                    color: block.color || undefined,
                    textAlign: block.align || "left",
                  }}
                >
                  <FormattedText text={block.text} />
                </Tag>
              );
            }

            case "paragraph": {
              const hasInlineImages =
                Array.isArray(block.inlineImages) && block.inlineImages.length > 0;
              const textContent = block.text || "";
              let html = textContent.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
              html = html.replace(
                /\[(.*?)\]\((.*?)\)/g,
                '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary font-bold underline">$1</a>',
              );
              const isHtml = html.includes("<") || html.includes(">");

              if (isHtml) {
                return (
                  <div
                    key={key}
                    className="article-rendered-content clear-both leading-relaxed font-sans text-foreground/90 transition-colors"
                    style={{
                      color: block.color || undefined,
                      backgroundColor: block.bgColor || undefined,
                      textAlign: block.align || "left",
                      fontSize:
                        block.fontSize === "sm"
                          ? "0.95rem"
                          : block.fontSize === "lg"
                            ? "1.2rem"
                            : block.fontSize === "xl"
                              ? "1.35rem"
                              : undefined,
                      padding: block.bgColor ? "1rem" : undefined,
                      borderRadius: block.bgColor ? "1rem" : undefined,
                    }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              }

              return (
                <div
                  key={key}
                  className="article-rendered-content clear-both leading-relaxed font-sans text-foreground/90 transition-colors"
                  style={{
                    color: block.color || undefined,
                    backgroundColor: block.bgColor || undefined,
                    textAlign: block.align || "left",
                    fontSize:
                      block.fontSize === "sm"
                        ? "0.95rem"
                        : block.fontSize === "lg"
                          ? "1.2rem"
                          : block.fontSize === "xl"
                            ? "1.35rem"
                            : undefined,
                    padding: block.bgColor ? "1rem" : undefined,
                    borderRadius: block.bgColor ? "1rem" : undefined,
                  }}
                >
                  {/* Render inline or floating images attached to this paragraph */}
                  {hasInlineImages &&
                    block.inlineImages.map((img: any, imgIdx: number) => {
                      const isImgTransparent = Boolean(
                        img.transparent ||
                        (img.url &&
                          (img.url.startsWith("data:image/svg") ||
                            img.url.includes(".svg") ||
                            img.url.includes("transparent"))),
                      );
                      return (
                        <img
                          key={imgIdx}
                          src={img.url}
                          alt={img.alt || ""}
                          loading="lazy"
                          data-transparent={isImgTransparent ? "true" : "false"}
                          className={`transition-transform hover:scale-[1.01] ${
                            isImgTransparent
                              ? "bg-transparent border-0 shadow-none drop-shadow-md object-contain"
                              : "rounded-2xl border border-border/80 object-cover shadow-sm"
                          } ${
                            img.align === "left"
                              ? "float-left mr-5 mb-3 max-w-[45%] sm:max-w-[35%]"
                              : img.align === "right"
                                ? "float-right ml-5 mb-3 max-w-[45%] sm:max-w-[35%]"
                                : "mx-auto mb-4 block max-w-full"
                          }`}
                        />
                      );
                    })}

                  <p>{textContent}</p>
                  <div className="clear-both" />
                </div>
              );
            }

            case "image": {
              const isTransparent = Boolean(
                block.transparent ||
                block.noBackground ||
                (block.url &&
                  (block.url.startsWith("data:image/svg") ||
                    block.url.includes(".svg") ||
                    block.url.includes("transparent"))),
              );

              const alignClass =
                block.align === "left"
                  ? "float-left mr-6 mb-4 max-w-[45%]"
                  : block.align === "right"
                    ? "float-right ml-6 mb-4 max-w-[45%]"
                    : block.align === "full"
                      ? "w-full"
                      : block.width === "small"
                        ? "mx-auto max-w-[25%]"
                        : block.width === "medium"
                          ? "mx-auto max-w-[50%]"
                          : block.width === "large"
                            ? "mx-auto max-w-[75%]"
                            : "mx-auto w-full";

              const ImageElement = (
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  loading="lazy"
                  data-transparent={isTransparent ? "true" : "false"}
                  className={`w-full transition-transform hover:scale-[1.005] ${
                    isTransparent
                      ? "bg-transparent border-0 shadow-none drop-shadow-md object-contain"
                      : "rounded-2xl border border-border/80 object-cover shadow-soft"
                  }`}
                />
              );

              return (
                <figure
                  key={key}
                  data-transparent={isTransparent ? "true" : undefined}
                  className={`space-y-2 clear-both ${alignClass}`}
                >
                  {block.linkUrl ? (
                    <a
                      href={block.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {ImageElement}
                    </a>
                  ) : (
                    ImageElement
                  )}
                  {block.caption ? (
                    <figcaption className="text-center text-sm font-medium text-muted-foreground">
                      {block.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            }

            case "callout": {
              const styleKey = (block.level || block.variant || "info") as keyof typeof CALLOUT;
              const style = CALLOUT[styleKey] || CALLOUT.info;
              const Icon = style.Icon;

              return (
                <div
                  key={key}
                  className={`clear-both flex gap-3.5 rounded-2xl border p-4 sm:p-5 shadow-xs ${style.wrap}`}
                  style={{
                    textAlign: block.align || "left",
                  }}
                >
                  <Icon className={`mt-0.5 size-5 shrink-0 ${style.tone}`} aria-hidden="true" />
                  <div className="flex flex-col gap-1 min-w-0">
                    {block.title ? (
                      <h4 className="font-bold text-base">
                        <FormattedText text={block.title} />
                      </h4>
                    ) : null}
                    <div className="text-base font-semibold leading-relaxed">
                      <FormattedText text={block.text} />
                    </div>
                  </div>
                </div>
              );
            }

            case "button":
            case "link": {
              return (
                <div
                  key={key}
                  className="clear-both py-2"
                  style={{ textAlign: block.align || "left" }}
                >
                  <a
                    href={block.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl px-6 py-3 text-base font-bold shadow-soft transition-all hover:opacity-95 hover:shadow-md"
                    style={{
                      backgroundColor: block.bgColor || "#3b82f6",
                      color: block.textColor || "#ffffff",
                    }}
                  >
                    {block.text || block.label || t("articleBlocks.viewMore")}
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </div>
              );
            }

            case "list":
              return (
                <ul key={key} className="clear-both space-y-3 pl-1">
                  {(block.items || []).map((item: string, i: number) => (
                    <li key={i} className="flex gap-3 text-lg leading-relaxed text-foreground/90">
                      <span
                        className="mt-2.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <FormattedText text={item} />
                    </li>
                  ))}
                </ul>
              );

            case "video":
              return (
                <figure key={key} className="clear-both space-y-2">
                  <div className="aspect-video overflow-hidden rounded-2xl border border-border shadow-soft">
                    <iframe
                      src={block.url}
                      title={block.title || block.caption || "Video"}
                      loading="lazy"
                      allowFullScreen
                      className="size-full"
                    />
                  </div>
                  {block.title || block.caption ? (
                    <figcaption className="text-center text-sm font-medium text-muted-foreground">
                      {block.title || block.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );

            case "divider":
              return <hr key={key} className="my-6 border-t-2 border-dashed border-border/80" />;

            default:
              return null;
          }
        })}
      </div>
    </>
  );
}
