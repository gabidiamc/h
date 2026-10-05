import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Headphones,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  PLAYBACK_SPEEDS,
  usePodcastPlayer,
  type PlaybackSpeed,
} from "@/lib/podcast-player-context";
import { formatDurationTimestamp } from "@/lib/podcasts";
import { isSpotifyEpisode, getEpisodeSpotifyUrl } from "@/lib/spotify";
import { TranscriptPlayer } from "./transcript-player";
import { SpotifyEmbedPlayer } from "./spotify-player";

export function GlobalPodcastPlayer() {
  const {
    currentEpisode,
    currentPodcast,
    currentTranscript,
    queue,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    playbackMode,
    isExpanded,
    isPlayerMinimized,
    isTranscriptOpen,
    togglePlayPause,
    seekTo,
    skipBy,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setPlaybackMode,
    setIsExpanded,
    setIsPlayerMinimized,
    togglePlayerMinimized,
    setIsTranscriptOpen,
    playNext,
    playPrevious,
    closePlayer,
  } = usePodcastPlayer();

  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  if (!currentEpisode) {
    return null;
  }

  const effectiveDuration = Math.max(duration || currentEpisode.duration_seconds || 0, currentTime);
  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  const coverImage =
    currentEpisode.cover_url || currentPodcast?.cover_url || currentPodcast?.logo_url || null;

  const spotifyUrl = getEpisodeSpotifyUrl(currentEpisode);
  const isSpotify = Boolean(spotifyUrl);

  const hasQueueNavigation = queue.length > 1;
  const hasVideo = Boolean(currentEpisode.video_url);
  const hasTranscript = Boolean(
    currentTranscript &&
    (currentTranscript.segments.length > 0 || currentTranscript.full_text.trim().length > 0),
  );

  // If player is minimized: render sleek, non-intrusive floating mini-pill
  // Audio continues uninterrupted in the background provider!
  if (isPlayerMinimized) {
    return (
      <>
        {/* Persistent background Spotify Player keeps audio playing and controller alive */}
        {isSpotify && spotifyUrl && (
          <div
            className="fixed -left-[9999px] top-0 size-1 opacity-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <SpotifyEmbedPlayer
              spotifyUrl={spotifyUrl}
              title={currentEpisode.title}
              autoPlay={isPlaying}
              allowExpand={false}
            />
          </div>
        )}

        <aside
          aria-label="Reproductor minimizado DMPS INFO"
          className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 flex flex-col rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 max-w-[calc(100vw-1.5rem)] sm:max-w-md text-card-foreground overflow-hidden"
        >
          {/* Interactive thin scrubber on mini-pill */}
          <div className="relative h-1.5 w-full bg-muted cursor-pointer">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={effectiveDuration || 100}
              step={1}
              value={currentTime}
              aria-label="Posición de reproducción"
              onChange={(e) => seekTo(Number(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          <div className="flex items-center gap-2.5 p-2">
            {/* Cover Art / Icon with animated playing indicator */}
            <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-primary/10 text-primary">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={currentEpisode.title}
                  className="size-full object-cover"
                />
              ) : isSpotify ? (
                <Radio className="size-5 text-[#1DB954]" />
              ) : (
                <Headphones className="size-5" />
              )}
              {isPlaying && (
                <span className="absolute bottom-1 right-1 flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
              )}
            </div>

            {/* Title and Time info */}
            <div className="min-w-0 flex-1 pr-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {currentEpisode.title}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono tabular-nums">
                <span className="truncate max-w-[120px]">
                  {currentPodcast?.name || "Podcast DMPS"}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {formatDurationTimestamp(currentTime)} /{" "}
                  {formatDurationTimestamp(effectiveDuration)}
                </span>
              </div>
            </div>

            {/* Quick controls: -15s, Play/Pause, +30s */}
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => skipBy(-15)}
                title="Retroceder 15s"
                aria-label="Retroceder 15 segundos"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
              >
                <RotateCcw className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={togglePlayPause}
                title={isPlaying ? "Pausar" : "Reproducir"}
                aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
                className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={() => skipBy(30)}
                title="Adelantar 30s"
                aria-label="Adelantar 30 segundos"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
              >
                <RotateCw className="size-3.5" />
              </button>

              {/* Maximize / Expand button */}
              <button
                type="button"
                onClick={() => setIsPlayerMinimized(false)}
                title="Expandir controles completos del reproductor"
                aria-label="Expandir controles completos"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
              >
                <Maximize2 className="size-3.5" />
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={closePlayer}
                title="Cerrar reproductor"
                aria-label="Cerrar reproductor"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside
      aria-label="Reproductor global de podcast DMPS INFO"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 text-card-foreground shadow-2xl backdrop-blur-md transition-all pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]"
    >
      {/* Expandable drawer for Spotify, Transcript, or Video when open */}
      {(isTranscriptOpen ||
        (playbackMode === "video" && hasVideo) ||
        (isSpotify && isExpanded) ||
        isExpanded) && (
        <div className="mx-auto max-w-6xl border-b border-border/80 px-4 py-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {currentPodcast?.name || "DMPS Podcast"}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                T{currentEpisode.season_number} E{currentEpisode.episode_number}
              </span>
              {isSpotify && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Spotify Web Player
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsTranscriptOpen(false);
                setIsExpanded(false);
              }}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronDown className="size-4" />
              <span>Minimizar panel</span>
            </button>
          </div>

          {/* Spotify Direct In-Page Player */}
          {isSpotify && spotifyUrl && (
            <div className="mb-4">
              <SpotifyEmbedPlayer
                spotifyUrl={spotifyUrl}
                title={currentEpisode.title}
                autoPlay={true}
                allowExpand={true}
              />
            </div>
          )}

          {playbackMode === "video" && currentEpisode.video_url && (
            <div className="mb-4 overflow-hidden rounded-xl border border-border bg-black">
              <video
                src={currentEpisode.video_url}
                controls
                playsInline
                className="mx-auto max-h-72 w-full object-contain"
              />
            </div>
          )}

          {isTranscriptOpen && currentTranscript && (
            <TranscriptPlayer
              transcript={currentTranscript}
              episode={currentEpisode}
              podcast={currentPodcast}
              compact
            />
          )}
        </div>
      )}

      {/* Top thin interactive seek progress bar on mobile */}
      <div className="relative h-2 w-full bg-muted sm:hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progressPercent}%` }}
        />
        <input
          type="range"
          min={0}
          max={effectiveDuration || 100}
          step={1}
          value={currentTime}
          aria-label="Posición de reproducción"
          onChange={(e) => seekTo(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      {/* Main compact player bar */}
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Episode Identity */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary/10 text-primary">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={currentEpisode.title}
                  className="size-full object-cover"
                />
              ) : isSpotify ? (
                <Radio className="size-5 text-[#1DB954]" />
              ) : (
                <Headphones className="size-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {currentPodcast?.slug ? (
                  <Link
                    to="/podcasts/$slug"
                    params={{ slug: currentPodcast.slug }}
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {currentEpisode.title}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold text-foreground">
                    {currentEpisode.title}
                  </p>
                )}
                {isSpotify && (
                  <span className="shrink-0 rounded-full bg-[#1DB954]/15 px-2 py-0.5 text-[10px] font-semibold text-[#1DB954] border border-[#1DB954]/30">
                    Spotify
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <span className="truncate">{currentPodcast?.name || "DMPS Family Info"}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums sm:hidden">
                  {formatDurationTimestamp(currentTime)} /{" "}
                  {formatDurationTimestamp(effectiveDuration)}
                </span>
                <span className="hidden sm:inline">
                  Temporada {currentEpisode.season_number} · Ep. {currentEpisode.episode_number}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Playback Controls: Fully functional for native audio and Spotify */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {hasQueueNavigation && (
              <button
                type="button"
                onClick={playPrevious}
                title="Episodio anterior"
                aria-label="Episodio anterior"
                className="hidden min-h-10 min-w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                <SkipBack className="size-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => skipBy(-15)}
              title="Retroceder 15 segundos (-15s)"
              aria-label="Retroceder 15 segundos"
              className="inline-flex min-h-10 min-w-10 flex-col items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-4" />
              <span className="text-[9px] font-bold font-mono leading-none -mt-0.5">15</span>
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              title={isPlaying ? "Pausar" : "Reproducir"}
              aria-label={isPlaying ? "Pausar episodio" : "Reproducir episodio"}
              className="inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => skipBy(30)}
              title="Adelantar 30 segundos (+30s)"
              aria-label="Adelantar 30 segundos"
              className="inline-flex min-h-10 min-w-10 flex-col items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCw className="size-4" />
              <span className="text-[9px] font-bold font-mono leading-none -mt-0.5">30</span>
            </button>

            {hasQueueNavigation && (
              <button
                type="button"
                onClick={playNext}
                title="Siguiente episodio"
                aria-label="Siguiente episodio"
                className="hidden min-h-10 min-w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                <SkipForward className="size-4" />
              </button>
            )}

            {isSpotify && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={
                  isExpanded ? "Ocultar panel de Spotify" : "Abrir reproductor visual de Spotify"
                }
                className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors shadow-xs ml-1"
              >
                <Radio className="size-3.5 text-[#1DB954]" />
                <span>{isExpanded ? "Ocultar" : "Ver Spotify"}</span>
              </button>
            )}
          </div>

          {/* Desktop Seek Bar + Timestamps */}
          <div className="hidden max-w-md flex-1 items-center gap-2.5 md:flex">
            <span className="w-11 text-right font-mono text-xs tabular-nums text-muted-foreground">
              {formatDurationTimestamp(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={effectiveDuration || 100}
              step={1}
              value={currentTime}
              aria-label="Barra de progreso del episodio"
              onChange={(e) => seekTo(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer accent-primary"
            />
            <span className="w-11 font-mono text-xs tabular-nums text-muted-foreground">
              {formatDurationTimestamp(effectiveDuration)}
            </span>
          </div>

          {/* Speed, Volume, Transcript, Video & Close Controls */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {/* Speed Selector with direct speed menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSpeedMenuOpen((prev) => !prev)}
                title="Cambiar velocidad de reproducción"
                aria-label={`Velocidad de reproducción ${playbackRate}x`}
                aria-expanded={isSpeedMenuOpen}
                className="inline-flex min-h-10 items-center justify-center gap-0.5 rounded-lg border border-border/80 bg-muted/50 px-2 font-mono text-xs font-semibold tabular-nums text-foreground transition-colors hover:bg-muted"
              >
                <span>{playbackRate}x</span>
                <ChevronUp
                  className={`size-3 transition-transform ${isSpeedMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isSpeedMenuOpen && (
                <div
                  role="menu"
                  aria-label="Seleccionar velocidad"
                  className="absolute bottom-full right-0 mb-2 z-50 flex flex-col gap-0.5 rounded-xl border border-border bg-popover p-1.5 shadow-xl text-popover-foreground min-w-28"
                >
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                    Velocidad
                  </div>
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(speed);
                        setIsSpeedMenuOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium transition-colors ${
                        playbackRate === speed
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{speed}x</span>
                      {speed === 1 && (
                        <span className="text-[10px] opacity-75 font-sans">Normal</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume Controls (Desktop) */}
            <div className="hidden items-center gap-1.5 lg:flex">
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? "Activar sonido" : "Silenciar"}
                aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                aria-label="Volumen"
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-1.5 w-20 cursor-pointer accent-primary"
              />
            </div>

            {/* Video Toggle when episode has video */}
            {hasVideo && (
              <button
                type="button"
                onClick={() => setPlaybackMode(playbackMode === "video" ? "audio" : "video")}
                title="Alternar video del episodio"
                className={`inline-flex min-h-10 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                  playbackMode === "video"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Video className="size-4" />
                <span className="hidden sm:inline">Video</span>
              </button>
            )}

            {/* Transcript Drawer Toggle */}
            {hasTranscript && (
              <button
                type="button"
                onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                title="Mostrar u ocultar transcripción sincronizada"
                className={`inline-flex min-h-10 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                  isTranscriptOpen
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <AlignLeft className="size-4" />
                <span className="hidden sm:inline">Transcripción</span>
                {isTranscriptOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronUp className="size-3.5" />
                )}
              </button>
            )}

            {/* Minimize Player Button (Keeps audio playing) */}
            <button
              type="button"
              onClick={() => setIsPlayerMinimized(true)}
              title="Minimizar reproductor (el audio sigue reproduciéndose)"
              aria-label="Minimizar reproductor"
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Minimize2 className="size-4" />
            </button>

            {/* Close Player */}
            <button
              type="button"
              onClick={closePlayer}
              title="Cerrar reproductor"
              aria-label="Cerrar reproductor"
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
