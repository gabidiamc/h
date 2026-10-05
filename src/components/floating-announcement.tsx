import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { fetchPopupAnnouncement } from "@/lib/popup";
import { SITE_SETTINGS_QUERY_OPTIONS } from "@/lib/site-settings-service";
import { useI18n } from "@/lib/i18n";

const SESSION_KEY = "dmps_popup_dismissed_v1";

/**
 * Full-screen floating announcement configured by staff.
 * Shows once per visit (per browser session) until the visitor closes it.
 */
export function FloatingAnnouncement() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["popup-announcement"],
    queryFn: () => fetchPopupAnnouncement(),
    ...SITE_SETTINGS_QUERY_OPTIONS,
  });

  useEffect(() => {
    if (!data?.enabled) {
      setOpen(false);
      return;
    }
    if (typeof window === "undefined") return;
    const dismissed = window.sessionStorage.getItem(SESSION_KEY);
    if (dismissed === data.updated_at) return;
    setOpen(true);
  }, [data]);

  if (!open || !data?.enabled) return null;

  const close = () => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, data.updated_at);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={data.title || t("floatingAnnouncement.default")}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: data.background_color, color: data.text_color }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          aria-label={t("floatingAnnouncement.close")}
          className="absolute end-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/70"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {data.image_url ? (
          <img
            src={data.image_url}
            alt={data.title || t("floatingAnnouncement.default")}
            className="max-h-72 w-full object-cover"
          />
        ) : null}

        <div className="space-y-3 p-6">
          {data.title ? (
            <h2
              className="text-2xl font-extrabold leading-tight"
              style={{ color: data.accent_color }}
            >
              {data.title}
            </h2>
          ) : null}
          {data.message ? (
            <p className="whitespace-pre-line text-base leading-relaxed">{data.message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            {data.link_url ? (
              <a
                href={data.link_url}
                target={data.link_url.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                style={{ backgroundColor: data.accent_color }}
                className="inline-flex min-h-11 items-center rounded-full px-5 font-bold text-white"
              >
                {data.link_label || t("floatingAnnouncement.moreInfo")}
              </a>
            ) : null}
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center rounded-full border border-current/30 px-5 font-semibold"
            >
              {t("floatingAnnouncement.dismiss")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
