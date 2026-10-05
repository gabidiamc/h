/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
  Music2,
  Radio,
  Sparkles,
  Video,
} from "lucide-react";
import { parseSpotifyUrl } from "@/lib/spotify";
import {
  loadSpotifyIframeApi,
  setActiveSpotifyController,
  clearActiveSpotifyController,
  type SpotifyEmbedController,
} from "@/lib/spotify-iframe-api";
import { usePodcastPlayer } from "@/lib/podcast-player-context";

export interface SpotifyEmbedPlayerProps {
  spotifyUrl: string;
  title?: string;
  compact?: boolean;
  allowExpand?: boolean;
  className?: string;
  autoPlay?: boolean;
}

export function SpotifyEmbedPlayer({
  spotifyUrl,
  title,
  compact = false,
  allowExpand = true,
  className = "",
  autoPlay = false,
}: SpotifyEmbedPlayerProps) {
  const parsed = parseSpotifyUrl(spotifyUrl);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SpotifyEmbedController | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { syncFromSpotify } = usePodcastPlayer();

  const currentHeight = isExpanded ? 352 : 152;
  const initialHeightRef = useRef(currentHeight);
  const canonicalUrl = parsed?.canonicalUrl;
  const embedSourceUrl =
    autoPlay && parsed && !parsed.embedUrl.includes("autoplay=1")
      ? `${parsed.embedUrl}&autoplay=1`
      : parsed?.embedUrl || "";

  // Dynamic height adjustment without destroying the controller
  useEffect(() => {
    if (embedContainerRef.current) {
      embedContainerRef.current.style.height = `${currentHeight}px`;
      const iframe = embedContainerRef.current.querySelector("iframe");
      if (iframe) {
        iframe.style.height = `${currentHeight}px`;
        iframe.height = String(currentHeight);
      }
    }
  }, [currentHeight]);

  // Initialize Spotify IFrame API Controller
  useEffect(() => {
    if (!canonicalUrl || typeof window === "undefined") return;

    let isMounted = true;
    loadSpotifyIframeApi()
      .then((IFrameAPI) => {
        if (!isMounted || !embedContainerRef.current) return;

        // Clear existing container contents before mounting controller
        embedContainerRef.current.innerHTML = "";

        const options = {
          uri: canonicalUrl,
          width: "100%",
          height: initialHeightRef.current,
        };

        IFrameAPI.createController(embedContainerRef.current, options, (controller) => {
          if (!isMounted) {
            controller.destroy?.();
            return;
          }
          controllerRef.current = controller;
          setActiveSpotifyController(controller, canonicalUrl);
          setIsLoaded(true);

          controller.addListener("playback_update", (e: any) => {
            if (!isMounted) return;
            const posSec = (Number(e.data?.position) || 0) / 1000;
            const durSec = (Number(e.data?.duration) || 0) / 1000;
            const isPaused = Boolean(e.data?.isPaused);
            syncFromSpotify(posSec, durSec, !isPaused);
          });

          controller.addListener("ready", () => {
            if (isMounted) setIsLoaded(true);
          });
        });
      })
      .catch(() => {
        // Fallback to standard iframe if Spotify script is blocked or delayed
      });

    return () => {
      isMounted = false;
      if (controllerRef.current) {
        clearActiveSpotifyController(controllerRef.current, canonicalUrl);
        try {
          controllerRef.current.destroy?.();
        } catch {
          // ignore
        }
        controllerRef.current = null;
      }
    };
  }, [canonicalUrl, syncFromSpotify]);

  if (!parsed) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
        Enlace de Spotify no válido o no reconocido.
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-card p-3 shadow-md space-y-2 transition-all ${className}`}
    >
      {/* Header bar indicating in-site playback */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-xs">
            <Radio className="size-3.5" />
          </span>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 truncate">
              {title || (parsed.type === "show" ? "Podcast en Spotify" : "Episodio de Spotify")}
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Web Embed
              </span>
            </span>
            <span className="block text-[11px] text-muted-foreground truncate">
              Reproducción directa conectada con los controles de DMPS INFO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {allowExpand && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={isExpanded ? "Vista compacta" : "Expandir (video y lista)"}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="size-3 text-primary" />
                  <span>Compactar</span>
                </>
              ) : (
                <>
                  <Video className="size-3 text-emerald-500" />
                  <span>Ver video / Expandir</span>
                </>
              )}
            </button>
          )}

          <a
            href={parsed.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-emerald-500 hover:bg-muted transition-colors"
            title="Abrir enlace directo en Spotify si lo deseas"
          >
            <ExternalLink className="size-3" />
            <span className="sr-only">Abrir en Spotify</span>
          </a>
        </div>
      </div>

      {/* Embedded Spotify IFrame / Controller Container */}
      <div className="relative w-full overflow-hidden rounded-xl bg-black/5 dark:bg-black/20">
        {!isLoaded && (
          <div
            className="flex w-full items-center justify-center bg-muted/40 text-xs text-muted-foreground transition-opacity"
            style={{ height: `${currentHeight}px` }}
          >
            <Loader2 className="mr-2 size-4 animate-spin text-[#1DB954]" />
            <span>Cargando reproductor oficial de Spotify...</span>
          </div>
        )}

        {/* Dynamic container for Spotify IFrame API Controller */}
        <div
          ref={embedContainerRef}
          className="w-full rounded-xl overflow-hidden"
          style={{ minHeight: `${currentHeight}px` }}
        >
          {/* Fallback iframe rendered initially while script loads */}
          <iframe
            ref={iframeRef}
            src={embedSourceUrl}
            title={title || "Reproductor oficial de Spotify"}
            width="100%"
            height={currentHeight}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className={`w-full rounded-xl transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
            }`}
            style={{
              borderRadius: "12px",
              border: "none",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <Sparkles className="size-3 text-emerald-500" />
          <span>Controles de pausa, adelanto (+30s) y retroceso (-15s) vinculados a la app.</span>
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/80">Spotify Controller</span>
      </div>
    </div>
  );
}
