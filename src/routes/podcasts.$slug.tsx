import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  Headphones,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Radio,
  RotateCcw,
  RotateCw,
  Sparkles,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { TranscriptPlayer } from "@/components/podcast/transcript-player";
import { SpotifyEmbedPlayer } from "@/components/podcast/spotify-player";
import { PodcastCommentsSection } from "@/components/podcast/podcast-comments-section";
import {
  fetchEpisodeBySlugOrId,
  fetchPodcastBySlugOrId,
  fetchPodcastEpisodes,
  fetchTranscriptsByEpisodeIds,
  formatDurationTimestamp,
  recordPodcastAnalyticsEvent,
  type PodcastEpisodeRow,
} from "@/lib/podcasts";
import {
  PLAYBACK_SPEEDS,
  usePodcastPlayer,
  type PlaybackSpeed,
} from "@/lib/podcast-player-context";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/podcasts/$slug")({
  head: () => ({
    meta: [
      { title: "Podcast — DMPS Family Info" },
      {
        name: "description",
        content:
          "Escucha los episodios y lee la transcripción sincronizada en el portal oficial para familias de DMPS.",
      },
    ],
  }),
  component: PublicPodcastDetailPage,
});

const LANG_NAMES: Record<string, string> = {
  es: "Español",
  en: "English",
  ksw: "Karen",
};

function PublicPodcastDetailPage() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    playEpisode,
    togglePlayPause,
    pause,
    seekTo,
    skipBy,
    setVolume,
    toggleMute,
    setPlaybackRate,
  } = usePodcastPlayer();

  const [openTranscriptEpisodeId, setOpenTranscriptEpisodeId] = useState<string | null>(null);
  const [openVideoEpisodeId, setOpenVideoEpisodeId] = useState<string | null>(null);

  // Resolve slug as either a podcast or an episode (e.g. /podcasts/episode-1)
  const { data: routeData, isLoading: loadingPodcast } = useQuery({
    queryKey: ["podcasts", "resolved_detail", slug],
    queryFn: async () => {
      // 1. Try to fetch podcast by slug or id
      const pod = await fetchPodcastBySlugOrId(slug, { onlyPublished: true });
      if (pod) {
        return { podcast: pod, featuredEpisode: null as PodcastEpisodeRow | null };
      }
      // 2. Try to fetch episode by slug or id
      const ep = await fetchEpisodeBySlugOrId(slug, { onlyPublished: true });
      if (ep) {
        const parentPod = await fetchPodcastBySlugOrId(ep.podcast_id, { onlyPublished: true });
        if (parentPod) {
          return { podcast: parentPod, featuredEpisode: ep };
        }
      }
      return { podcast: null, featuredEpisode: null as PodcastEpisodeRow | null };
    },
  });

  const podcast = routeData?.podcast || null;
  const featuredEpisode = routeData?.featuredEpisode || null;

  const { data: episodes = [], isLoading: loadingEpisodes } = useQuery({
    queryKey: ["podcast_episodes", "public", podcast?.id],
    queryFn: () =>
      podcast
        ? fetchPodcastEpisodes({ podcastId: podcast.id, onlyPublished: true })
        : Promise.resolve([]),
    enabled: Boolean(podcast?.id),
  });

  const { data: transcriptsMap = {} } = useQuery({
    queryKey: ["podcast_transcripts", "public", episodes.map((e) => e.id).join(",")],
    queryFn: () =>
      fetchTranscriptsByEpisodeIds(
        episodes.map((e) => e.id),
        { onlyPublished: true },
      ),
    enabled: episodes.length > 0,
  });

  const handlePlayEpisode = (ep: PodcastEpisodeRow) => {
    if (currentEpisode?.id === ep.id) {
      togglePlayPause();
      return;
    }
    const tr = transcriptsMap[ep.id] || null;
    playEpisode(ep, podcast, {
      queue: episodes,
      transcript: tr,
    });
    if (tr && !openTranscriptEpisodeId) {
      setOpenTranscriptEpisodeId(ep.id);
    }
  };

  const cyclePlaybackRate = () => {
    const idx = PLAYBACK_SPEEDS.indexOf(playbackRate);
    const next = PLAYBACK_SPEEDS[(idx + 1) % PLAYBACK_SPEEDS.length] as PlaybackSpeed;
    setPlaybackRate(next);
  };

  return (
    <PublicShell>
      <main
        id="main-content"
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12"
      >
        <div className="mb-6">
          <Link
            to="/podcasts"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span>{lang === "en" ? "Back to all podcasts" : "Volver a todos los podcasts"}</span>
          </Link>
        </div>

        {loadingPodcast ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin text-primary" />
            <span>Cargando podcast...</span>
          </div>
        ) : !podcast ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
            <Headphones className="mx-auto size-8 text-muted-foreground" />
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Podcast no encontrado
            </h1>
            <p className="text-sm text-muted-foreground">
              El podcast o episodio solicitado no existe o aún no ha sido publicado.
            </p>
            <Button asChild variant="outline">
              <Link to="/podcasts">Ver podcasts disponibles</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Podcast Show Header with Banner, Cover & Logo */}
            <section className="overflow-hidden rounded-xl border border-border bg-card">
              {podcast.banner_url && (
                <div className="relative h-44 w-full overflow-hidden border-b border-border bg-muted sm:h-64">
                  <img
                    src={podcast.banner_url}
                    alt={podcast.name}
                    className="h-full w-full object-cover object-center"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement)?.classList.add("hidden");
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-primary sm:size-28">
                  {podcast.cover_url || podcast.logo_url ? (
                    <img
                      src={podcast.cover_url || podcast.logo_url || ""}
                      alt={podcast.name}
                      className="size-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Headphones className="size-10" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {podcast.logo_url && (
                      <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2 py-0.5">
                        <img
                          src={podcast.logo_url}
                          alt=""
                          className="h-4 w-4 rounded-full object-contain"
                          onError={(e) => {
                            (e.currentTarget.parentElement as HTMLElement)?.classList.add("hidden");
                          }}
                        />
                        <span className="font-medium text-foreground">Canal oficial</span>
                      </div>
                    )}
                    <span>{LANG_NAMES[podcast.language] || podcast.language}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {episodes.length}{" "}
                      {lang === "en" ? "published episodes" : "episodios publicados"}
                    </span>
                  </div>

                  <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                    {podcast.name}
                  </h1>

                  {podcast.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {podcast.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById("comentarios-podcast");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="gap-2 text-xs border-primary/30 hover:bg-primary/10"
                    >
                      <MessageSquare className="size-3.5 text-primary" />
                      <span>
                        {lang === "en" ? "Leave a public comment" : "Comentar en el podcast"}
                      </span>
                      {podcast.comments && podcast.comments.length > 0 && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {podcast.comments.length}
                        </span>
                      )}
                    </Button>
                  </div>

                  {podcast.spotify_url && (
                    <div className="pt-2">
                      <SpotifyEmbedPlayer
                        spotifyUrl={podcast.spotify_url}
                        title={`Canal oficial en Spotify: ${podcast.name}`}
                        compact={true}
                        allowExpand={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Featured Episode Banner if route opened directly to an episode */}
            {featuredEpisode && (
              <aside
                aria-label="Episodio seleccionado"
                className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    Episodio seleccionado
                  </span>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {featuredEpisode.title}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => handlePlayEpisode(featuredEpisode)}
                  size="sm"
                  className={
                    featuredEpisode.spotify_url && !featuredEpisode.audio_url
                      ? "gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-transform"
                      : "gap-2 shrink-0 active:scale-95 transition-transform"
                  }
                >
                  {currentEpisode?.id === featuredEpisode.id && isPlaying ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4 fill-current" />
                  )}
                  <span>
                    {currentEpisode?.id === featuredEpisode.id && isPlaying
                      ? lang === "en"
                        ? "Pause"
                        : "Pausar"
                      : currentEpisode?.id === featuredEpisode.id && !isPlaying
                        ? lang === "en"
                          ? "Resume"
                          : "Reanudar"
                        : lang === "en"
                          ? "Play"
                          : "Reproducir"}
                  </span>
                </Button>
              </aside>
            )}

            {/* Episodes List */}
            <section className="space-y-4">
              <h2 className="font-heading text-xl font-bold text-foreground">
                {lang === "en" ? "Episodes" : "Episodios"} ({episodes.length})
              </h2>

              {loadingEpisodes ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Cargando episodios...</span>
                </div>
              ) : episodes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
                  Aún no hay episodios publicados en este podcast.
                </div>
              ) : (
                <div className="space-y-4">
                  {episodes.map((ep) => {
                    const tr = transcriptsMap[ep.id];
                    const isThisActive = currentEpisode?.id === ep.id;
                    const isThisPlaying = isThisActive && isPlaying;
                    const isTranscriptShown =
                      openTranscriptEpisodeId === ep.id ||
                      (isThisActive && Boolean(tr) && openTranscriptEpisodeId === null);
                    const isVideoShown = openVideoEpisodeId === ep.id;

                    const effectiveDur = Math.max(
                      duration || ep.duration_seconds || 0,
                      isThisActive ? currentTime : 0,
                    );

                    return (
                      <article
                        key={ep.id}
                        className={`rounded-xl border bg-card p-5 space-y-4 transition-colors ${
                          isThisActive
                            ? "border-primary/50 shadow-md ring-1 ring-primary/20"
                            : "border-border"
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="flex items-start gap-4 min-w-0">
                            {ep.cover_url || podcast.cover_url || podcast.logo_url ? (
                              <img
                                src={ep.cover_url || podcast.cover_url || podcast.logo_url || ""}
                                alt={ep.title}
                                className="size-16 shrink-0 rounded-lg border border-border object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
                                <Headphones className="size-7" />
                              </div>
                            )}
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
                                <span>
                                  Temporada {ep.season_number} · Episodio {ep.episode_number}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{formatDurationTimestamp(ep.duration_seconds)}</span>
                                {ep.published_at && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>
                                      {new Date(ep.published_at).toLocaleDateString(
                                        lang === "en" ? "en-US" : "es-US",
                                        {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        },
                                      )}
                                    </span>
                                  </>
                                )}
                                {ep.spotify_url && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <Radio className="size-3 text-[#1DB954]" />
                                      <span>Spotify Web</span>
                                    </span>
                                  </>
                                )}
                              </div>

                              <h3 className="font-heading text-lg font-semibold text-foreground">
                                {ep.title}
                              </h3>

                              {ep.description && (
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                  {ep.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              onClick={() => handlePlayEpisode(ep)}
                              className={
                                ep.spotify_url && !ep.audio_url
                                  ? "gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-transform"
                                  : "gap-2 active:scale-95 transition-transform"
                              }
                            >
                              {isThisPlaying ? (
                                <Pause className="size-4" />
                              ) : (
                                <Play className="size-4 fill-current" />
                              )}
                              <span>
                                {isThisPlaying
                                  ? lang === "en"
                                    ? "Pause"
                                    : "Pausar"
                                  : isThisActive
                                    ? lang === "en"
                                      ? "Resume"
                                      : "Reanudar"
                                    : lang === "en"
                                      ? "Play Audio"
                                      : "Reproducir"}
                              </span>
                            </Button>

                            {/* Only show video control when real video exists */}
                            {ep.video_url && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpenVideoEpisodeId(isVideoShown ? null : ep.id)}
                                className="gap-1.5"
                              >
                                <Video className="size-4 text-primary" />
                                <span>{isVideoShown ? "Ocultar video" : "Ver video"}</span>
                              </Button>
                            )}

                            {tr && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  setOpenTranscriptEpisodeId(
                                    isTranscriptShown ? "__closed__" : ep.id,
                                  )
                                }
                                className="gap-1.5"
                              >
                                <AlignLeft className="size-4 text-primary" />
                                <span>
                                  {isTranscriptShown ? "Ocultar transcripción" : "Transcripción"}
                                </span>
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const el = document.getElementById("comentarios-podcast");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <MessageSquare className="size-3.5 text-primary" />
                              <span>{lang === "en" ? "Comment" : "Comentar"}</span>
                            </Button>
                          </div>
                        </div>

                        {/* Spotify Integrated Player (Plays audio & video directly on the website) */}
                        {ep.spotify_url && (
                          <div className="pt-1">
                            <SpotifyEmbedPlayer
                              spotifyUrl={ep.spotify_url}
                              title={ep.title}
                              compact={false}
                              allowExpand={true}
                            />
                          </div>
                        )}

                        {/* Interactive In-Page Playback Bar for Active Episode */}
                        {isThisActive && (
                          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-2.5">
                            {/* Progress bar and timestamps */}
                            <div className="flex items-center gap-3">
                              <span className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground">
                                {formatDurationTimestamp(currentTime)}
                              </span>
                              <input
                                type="range"
                                min={0}
                                max={effectiveDur || 100}
                                step={1}
                                value={currentTime}
                                aria-label="Progreso del audio"
                                onChange={(e) => seekTo(Number(e.target.value))}
                                className="h-1.5 flex-1 cursor-pointer accent-primary"
                              />
                              <span className="w-12 font-mono text-xs tabular-nums text-muted-foreground">
                                {formatDurationTimestamp(effectiveDur)}
                              </span>
                            </div>

                            {/* Controls: -15s, Play/Pause, +30s, Speed, Volume */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => skipBy(-15)}
                                  title="Retroceder 15 segundos (-15s)"
                                  className="h-8 px-2 text-xs gap-1 font-mono text-muted-foreground hover:text-foreground"
                                >
                                  <RotateCcw className="size-3.5" />
                                  <span>-15s</span>
                                </Button>

                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  onClick={togglePlayPause}
                                  className="h-8 px-3 text-xs gap-1.5"
                                >
                                  {isPlaying ? (
                                    <Pause className="size-3.5" />
                                  ) : (
                                    <Play className="size-3.5 fill-current" />
                                  )}
                                  <span>{isPlaying ? "Pausar" : "Reanudar"}</span>
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => skipBy(30)}
                                  title="Adelantar 30 segundos (+30s)"
                                  className="h-8 px-2 text-xs gap-1 font-mono text-muted-foreground hover:text-foreground"
                                >
                                  <RotateCw className="size-3.5" />
                                  <span>+30s</span>
                                </Button>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Speed Cycle */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={cyclePlaybackRate}
                                  title="Cambiar velocidad de reproducción"
                                  className="h-8 px-2.5 font-mono text-xs font-semibold tabular-nums"
                                >
                                  {playbackRate}x
                                </Button>

                                {/* Volume Slider */}
                                <div className="hidden sm:flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleMute}
                                    title={isMuted ? "Activar sonido" : "Silenciar"}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  >
                                    {isMuted || volume === 0 ? (
                                      <VolumeX className="size-3.5" />
                                    ) : (
                                      <Volume2 className="size-3.5" />
                                    )}
                                  </Button>
                                  <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={isMuted ? 0 : volume}
                                    aria-label="Volumen del reproductor"
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="h-1.5 w-16 cursor-pointer accent-primary"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Optional Episode Video Player */}
                        {isVideoShown && ep.video_url && (
                          <div className="overflow-hidden rounded-xl border border-border bg-black">
                            <video
                              src={ep.video_url}
                              controls
                              playsInline
                              onPlay={() => {
                                pause();
                                void recordPodcastAnalyticsEvent({
                                  podcastId: ep.podcast_id,
                                  episodeId: ep.id,
                                  eventType: "play_start",
                                  positionSeconds: 0,
                                  durationSeconds: ep.duration_seconds || 0,
                                  listenedSeconds: 0,
                                  playbackMode: "video",
                                  language: ep.language,
                                }).catch(() => {});
                              }}
                              onPause={(e) => {
                                void recordPodcastAnalyticsEvent({
                                  podcastId: ep.podcast_id,
                                  episodeId: ep.id,
                                  eventType: "play_pause",
                                  positionSeconds: (e.target as HTMLVideoElement).currentTime,
                                  durationSeconds:
                                    (e.target as HTMLVideoElement).duration ||
                                    ep.duration_seconds ||
                                    0,
                                  listenedSeconds: 0,
                                  playbackMode: "video",
                                  language: ep.language,
                                }).catch(() => {});
                              }}
                              onEnded={(e) => {
                                void recordPodcastAnalyticsEvent({
                                  podcastId: ep.podcast_id,
                                  episodeId: ep.id,
                                  eventType: "play_complete",
                                  positionSeconds:
                                    (e.target as HTMLVideoElement).duration ||
                                    ep.duration_seconds ||
                                    0,
                                  durationSeconds:
                                    (e.target as HTMLVideoElement).duration ||
                                    ep.duration_seconds ||
                                    0,
                                  listenedSeconds:
                                    (e.target as HTMLVideoElement).duration ||
                                    ep.duration_seconds ||
                                    0,
                                  playbackMode: "video",
                                  language: ep.language,
                                }).catch(() => {});
                              }}
                              className="mx-auto max-h-96 w-full object-contain"
                            />
                          </div>
                        )}

                        {/* Interactive Synchronized Transcript Player */}
                        {isTranscriptShown && tr && (
                          <TranscriptPlayer transcript={tr} episode={ep} podcast={podcast} />
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Public Community Comments Section (No account required) */}
            <div id="comentarios-podcast" className="pt-2 scroll-mt-20">
              <PodcastCommentsSection
                podcast={podcast}
                episodeId={featuredEpisode?.id || currentEpisode?.id || null}
              />
            </div>
          </div>
        )}
      </main>
    </PublicShell>
  );
}
