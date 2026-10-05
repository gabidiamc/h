import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Info, Megaphone } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { localizedAnnouncement, type AnnouncementRow } from "@/lib/content";
import { trackAnnouncementClick } from "@/analytics";

const STYLES = {
  urgent: {
    wrap: "border-destructive/30 bg-destructive/5",
    chip: "bg-destructive text-destructive-foreground",
    Icon: AlertTriangle,
  },
  important: {
    wrap: "border-warning/40 bg-warning/10",
    chip: "bg-warning text-warning-foreground",
    Icon: Megaphone,
  },
  info: {
    wrap: "border-primary/20 bg-primary-soft",
    chip: "bg-primary text-primary-foreground",
    Icon: Info,
  },
} as const;

export function AnnouncementCard({ announcement }: { announcement: AnnouncementRow }) {
  const { lang, t } = useI18n();
  const [imageError, setImageError] = useState(false);
  const { title, message } = localizedAnnouncement(announcement, lang);
  const style = STYLES[announcement.level];
  const Icon = style.Icon;
  const bannerUrl = !imageError ? announcement.card_banner_url || null : null;
  const cardBg = announcement.card_bg?.trim() || null;
  const isDarkBg =
    cardBg &&
    (cardBg.includes("#0") ||
      cardBg.includes("#1") ||
      cardBg.includes("0f172a") ||
      cardBg.includes("e11d48"));

  return (
    <article
      style={cardBg ? { background: cardBg } : undefined}
      className={`rounded-2xl border overflow-hidden p-0 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${
        cardBg ? (isDarkBg ? "text-white border-white/20" : "border-border") : style.wrap
      }`}
      aria-labelledby={`ann-${announcement.id}`}
    >
      {bannerUrl && (
        <div className="relative w-full overflow-hidden border-b border-border/40 bg-muted/20">
          <img
            src={bannerUrl}
            alt={title}
            className="w-full h-auto max-h-[600px] object-cover transition-transform duration-500 hover:scale-105 rounded-t-2xl"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition-transform hover:scale-105 ${
              isDarkBg ? "bg-white/20 text-white" : style.chip
            }`}
          >
            <Icon className="size-3.5 animate-pulse" aria-hidden="true" />
            {t(`level.${announcement.level}`)}
          </span>
          {announcement.expires_at ? (
            <span className={`text-xs ${isDarkBg ? "text-slate-200" : "text-muted-foreground"}`}>
              {t("announcements.expires")}{" "}
              {new Date(announcement.expires_at).toLocaleDateString(lang)}
            </span>
          ) : null}
        </div>
        <h3
          id={`ann-${announcement.id}`}
          className={`mt-3 text-xl font-bold sm:text-2xl ${
            isDarkBg ? "text-white" : "text-foreground"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-2 text-base leading-relaxed ${
            isDarkBg ? "text-slate-200" : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
        {announcement.link_url ? (
          <a
            href={announcement.link_url}
            onClick={() =>
              trackAnnouncementClick(announcement.id, announcement.school_id, {
                level: announcement.level,
              })
            }
            className={`mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold underline underline-offset-4 ${
              isDarkBg ? "text-sky-300 hover:text-white" : "text-primary"
            }`}
          >
            {t("common.readMore")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function AnnouncementBanner({ announcement }: { announcement: AnnouncementRow }) {
  const { lang, t } = useI18n();
  const { title } = localizedAnnouncement(announcement, lang);

  return (
    <div className="bg-destructive text-destructive-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm sm:px-6">
        <AlertTriangle className="size-4 shrink-0 animate-bounce" aria-hidden="true" />
        <span className="font-bold uppercase tracking-wide">{t("level.urgent")}</span>
        <span className="min-w-0 flex-1 font-medium">{title}</span>
        <Link
          to="/announcements"
          onClick={() =>
            trackAnnouncementClick(announcement.id, announcement.school_id, {
              level: announcement.level,
              source: "urgent_banner",
            })
          }
          className="shrink-0 font-semibold underline underline-offset-4 transition-transform hover:scale-105"
        >
          {t("common.readMore")}
        </Link>
      </div>
    </div>
  );
}
