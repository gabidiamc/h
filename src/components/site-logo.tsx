import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import logoName from "@/assets/dmps-info-logo.png";
import logoMark from "@/assets/dmps-info-logo.png";
import { fetchAppearance } from "@/lib/directory";
import { useTheme } from "@/lib/theme";
import { useSchool } from "@/lib/school";

export interface AppearanceRow {
  logo_url?: string | null;
  logo_dark_url?: string | null;
  logo_light_url?: string | null;
  logo_alt?: string | null;
  logo_height?: number | null;
  favicon_url?: string | null;
  show_wordmark?: boolean | null;
}

export function SiteLogo({
  variant = "full",
  className = "",
  compact = false,
}: {
  variant?: "full" | "mark";
  className?: string;
  compact?: boolean;
}) {
  const { resolved } = useTheme();
  const [realtimeAppearance, setRealtimeAppearance] = useState<AppearanceRow | null>(null);

  const { data: queriedAppearance, refetch } = useQuery({
    queryKey: ["appearance"],
    queryFn: fetchAppearance,
    staleTime: 5 * 1000,
  });

  const appearance = realtimeAppearance ?? queriedAppearance;

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<AppearanceRow>;
      if (customEvt?.detail && typeof customEvt.detail === "object") {
        setRealtimeAppearance(customEvt.detail);
      } else {
        setRealtimeAppearance(null);
      }
      void refetch();
    };
    window.addEventListener("dmps_appearance_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("dmps_appearance_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refetch]);

  useEffect(() => {
    if (appearance?.favicon_url) {
      let iconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!iconLink) {
        iconLink = document.createElement("link");
        iconLink.rel = "icon";
        document.head.appendChild(iconLink);
      }
      iconLink.href = appearance.favicon_url;
    }
  }, [appearance?.favicon_url]);

  const { selectedSchool } = useSchool();
  // Primary custom logo takes priority; fallback to theme-specific overrides if configured
  let custom: string | null = null;
  if (resolved === "dark" && appearance?.logo_dark_url) {
    custom = appearance.logo_dark_url;
  } else if (resolved === "light" && appearance?.logo_light_url) {
    custom = appearance.logo_light_url;
  } else if (appearance?.logo_url) {
    custom = appearance.logo_url;
  }

  const src = custom || (variant === "full" ? logoName : logoMark);
  const alt = appearance?.logo_alt ?? `DMPS Connect & Portal de Familias — ${selectedSchool.name}`;
  // Keep height proportional so it never cuts or distorts
  const configuredHeight = appearance?.logo_height ?? 56;
  const targetHeight = compact ? 42 : Math.min(Math.max(configuredHeight, 36), 110);

  return (
    <Link
      to="/"
      className={`group relative inline-flex min-w-0 max-w-full items-center gap-2.5 sm:gap-3.5 py-1 focus-visible:outline-none transition-transform duration-300 ${className}`}
      aria-label="DMPS Connect & Portal de Familias — Inicio"
    >
      {/* Animated logo wrapper - using the real contour of the image without round boxes or bubbles */}
      <div className="relative shrink-0 flex items-center justify-center animate-logo-float transition-transform duration-300 ease-out group-hover:scale-105 group-active:scale-95">
        {/* Base Logo Image */}
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-auto h-auto shrink-0 object-contain select-none transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-md"
          style={{
            maxHeight: `${targetHeight}px`,
            maxWidth: compact ? "160px" : "280px",
            height: "auto",
            width: "auto",
          }}
          loading="eager"
        />

        {/* White beam light sweep passing directly IN FRONT OF the logo and masked to its real contour */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden select-none"
          style={{
            WebkitMaskImage: `url("${src}")`,
            maskImage: `url("${src}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 -translate-x-full animate-logo-shimmer"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.98) 50%, rgba(255,255,255,0.2) 70%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Auto-adapting text: DMPS Connect & Portal de Familias */}
      {appearance?.show_wordmark === false ? null : (
        <span className="flex min-w-0 flex-1 flex-col justify-center leading-tight transition-transform duration-200 group-hover:translate-x-0.5">
          <span className="truncate font-display text-sm sm:text-base md:text-lg font-extrabold text-foreground flex items-center gap-1.5 tracking-tight">
            <span>DMPS Connect</span>
            <Sparkles
              className="size-3.5 text-primary/80 animate-sparkle shrink-0"
              aria-hidden="true"
            />
          </span>
          <span className="truncate text-[11px] sm:text-xs font-semibold text-primary/90 flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full animate-pulse shrink-0 ${
                selectedSchool.id === "lincoln"
                  ? "bg-blue-600 shadow-xs shadow-blue-500/50"
                  : "bg-rose-600 shadow-xs shadow-rose-500/50"
              }`}
            />
            <span className="truncate">Portal de Familias</span>
            <span className="text-muted-foreground/60 hidden sm:inline" aria-hidden="true">
              •
            </span>
            <span className="text-muted-foreground text-[10px] sm:text-[11px] truncate hidden sm:inline">
              {selectedSchool.shortName}
            </span>
          </span>
        </span>
      )}
    </Link>
  );
}
