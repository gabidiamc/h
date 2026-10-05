/* eslint-disable @typescript-eslint/no-explicit-any, no-empty */
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";

import type { ArticleRow, CategoryRow } from "@/lib/content";
import { useLocalizedArticle } from "@/lib/content";
import { useI18n } from "@/lib/i18n";

export function ArticleCard({ article }: { article: ArticleRow; category?: CategoryRow | null }) {
  const { t, lang } = useI18n();
  const [imgError, setImgError] = useState(false);

  const locArticle = useLocalizedArticle(article, lang) || {
    title: article.slug,
    summary: null,
    blocks: [],
    bannerUrl: article.card_banner_url || article.featured_image_url || null,
    isFallback: false,
    isAutoTranslated: false,
  };

  const cleanSummary = locArticle.summary?.replace(/<[^>]*>/g, "").replace(/\*\*(.*?)\*\*/g, "$1");

  // Robust parsing of banner images from all available fields, language maps, content envelopes and blocks
  const bannerUrl = useMemo(() => {
    // 1. Direct from localized article
    if (
      locArticle.bannerUrl &&
      typeof locArticle.bannerUrl === "string" &&
      locArticle.bannerUrl.trim()
    ) {
      return locArticle.bannerUrl.trim();
    }

    // 2. Direct columns on article
    if (
      article.card_banner_url &&
      typeof article.card_banner_url === "string" &&
      article.card_banner_url.trim()
    ) {
      return article.card_banner_url.trim();
    }
    if (
      article.featured_image_url &&
      typeof article.featured_image_url === "string" &&
      article.featured_image_url.trim()
    ) {
      return article.featured_image_url.trim();
    }

    // 3. Card banners map (object or serialized JSON string)
    let bannersObj: Record<string, string> | null = null;
    if (article.card_banners && typeof article.card_banners === "object") {
      bannersObj = article.card_banners as Record<string, string>;
    } else if (
      typeof article.card_banners === "string" &&
      article.card_banners.trim().startsWith("{")
    ) {
      try {
        bannersObj = JSON.parse(article.card_banners);
      } catch {}
    }
    if (bannersObj) {
      if (bannersObj[lang] && typeof bannersObj[lang] === "string" && bannersObj[lang].trim()) {
        return bannersObj[lang].trim();
      }
      if (bannersObj.es && typeof bannersObj.es === "string" && bannersObj.es.trim()) {
        return bannersObj.es.trim();
      }
      if (bannersObj.en && typeof bannersObj.en === "string" && bannersObj.en.trim()) {
        return bannersObj.en.trim();
      }
      const firstVal = Object.values(bannersObj).find((v) => typeof v === "string" && v.trim());
      if (firstVal) return firstVal.trim();
    }

    // 4. Featured images map
    let featObj: Record<string, string> | null = null;
    if (article.featured_images && typeof article.featured_images === "object") {
      featObj = article.featured_images as Record<string, string>;
    } else if (
      typeof article.featured_images === "string" &&
      article.featured_images.trim().startsWith("{")
    ) {
      try {
        featObj = JSON.parse(article.featured_images);
      } catch {}
    }
    if (featObj) {
      if (featObj[lang] && typeof featObj[lang] === "string" && featObj[lang].trim()) {
        return featObj[lang].trim();
      }
      if (featObj.es && typeof featObj.es === "string" && featObj.es.trim()) {
        return featObj.es.trim();
      }
      const firstVal = Object.values(featObj).find((v) => typeof v === "string" && v.trim());
      if (firstVal) return firstVal.trim();
    }

    // 5. Envelope _meta in article.content
    let contentMeta: Record<string, any> = (article as any)._meta || {};
    if (article.content) {
      if (typeof article.content === "object" && (article.content as any)._meta) {
        contentMeta = { ...contentMeta, ...(article.content as any)._meta };
      } else if (typeof article.content === "string" && article.content.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(article.content);
          if (parsed?._meta) contentMeta = { ...contentMeta, ...parsed._meta };
        } catch {}
      }
    }
    if (
      contentMeta.card_banner_url &&
      typeof contentMeta.card_banner_url === "string" &&
      contentMeta.card_banner_url.trim()
    ) {
      return contentMeta.card_banner_url.trim();
    }
    if (
      contentMeta.featured_image_url &&
      typeof contentMeta.featured_image_url === "string" &&
      contentMeta.featured_image_url.trim()
    ) {
      return contentMeta.featured_image_url.trim();
    }
    if (contentMeta.card_banners && typeof contentMeta.card_banners === "object") {
      const cb = contentMeta.card_banners;
      if (cb[lang] && typeof cb[lang] === "string" && cb[lang].trim()) return cb[lang].trim();
      if (cb.es && typeof cb.es === "string" && cb.es.trim()) return cb.es.trim();
      const firstVal = Object.values(cb).find((v) => typeof v === "string" && (v as string).trim());
      if (firstVal) return (firstVal as string).trim();
    }

    // 6. Common aliases
    for (const key of [
      "image_url",
      "photo_url",
      "photo",
      "cover_url",
      "banner_url",
      "banner",
      "thumbnail_url",
    ]) {
      const val = (article as any)[key] || contentMeta[key];
      if (typeof val === "string" && val.trim()) return val.trim();
    }

    // 7. First image found inside blocks
    if (locArticle.blocks && Array.isArray(locArticle.blocks)) {
      for (const b of locArticle.blocks) {
        if (b.type === "image" && (b as any).url) {
          return String((b as any).url).trim();
        }
        if (b.type === "paragraph" && typeof b.text === "string" && b.text.includes("<img")) {
          const m = b.text.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (m?.[1]) return m[1].trim();
        }
      }
    }

    return null;
  }, [article, locArticle, lang]);

  const cardBg = article.card_bg?.trim() || (article as any)._meta?.card_bg?.trim() || null;

  // Check if background might be dark
  const isDarkBg =
    cardBg &&
    (cardBg.includes("#0") ||
      cardBg.includes("#1") ||
      cardBg.includes("#2") ||
      cardBg.includes("#3") ||
      cardBg.includes("rgb(0") ||
      cardBg.includes("rgb(1") ||
      cardBg.includes("rgb(2") ||
      cardBg.includes("rgb(3") ||
      cardBg.includes("0f172a") ||
      cardBg.includes("1e293b") ||
      cardBg.includes("1e3a8a"));

  return (
    <Link
      to="/articles/$slug"
      params={{ slug: article.slug }}
      data-tutorial="card-details"
      style={cardBg ? { background: cardBg } : undefined}
      className={`surface-card category-card-animated group flex h-full flex-col justify-between overflow-hidden p-0 rounded-2xl transition-all duration-300 hover:border-primary/50 ${
        isDarkBg ? "text-white border-white/20" : ""
      }`}
    >
      {bannerUrl && !imgError && (
        <div className="relative w-full overflow-hidden border-b border-border/50 bg-muted/20">
          <img
            src={bannerUrl}
            alt={locArticle.title || "Banner del artículo"}
            className="w-full h-auto max-h-[600px] object-cover rounded-t-2xl transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => {
              // Only hide if error is persistent on non-data URLs
              if (!bannerUrl.startsWith("data:image/")) {
                setImgError(true);
              }
            }}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {/* Summary / Description only */}
          <p
            className={`text-sm leading-relaxed line-clamp-4 ${
              isDarkBg ? "text-slate-100 font-medium" : "text-foreground/90 font-medium"
            }`}
          >
            {cleanSummary || locArticle.title}
          </p>
        </div>

        {/* Footer read link */}
        <div
          className={`mt-6 pt-4 border-t flex items-center justify-between text-sm font-bold ${
            isDarkBg ? "border-white/20 text-white" : "border-border/60 text-primary"
          }`}
        >
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            {t("common.readMore")}
          </span>
          <span
            className={`grid size-8 place-items-center rounded-xl transition-all duration-300 group-hover:translate-x-1.5 ${
              isDarkBg
                ? "bg-white/20 text-white group-hover:bg-white group-hover:text-slate-900"
                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20"
            }`}
          >
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
