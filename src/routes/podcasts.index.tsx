import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  AlignLeft,
  ArrowRight,
  Headphones,
  Loader2,
  Mic,
  Pause,
  Play,
  Radio,
  Search,
  Video,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchPodcastEpisodes,
  fetchPodcasts,
  fetchTranscriptsByEpisodeIds,
  formatDurationTimestamp,
  type PodcastEpisodeRow,
  type PodcastRow,
} from "@/lib/podcasts";
import { getBackgroundPlaybackCapabilities, usePodcastPlayer } from "@/lib/podcast-player-context";
import { useI18n } from "@/lib/i18n";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/podcasts/")({
  head: () => ({
    meta: [
      { title: "Podcasts para Familias — DMPS Family Info" },
      {
        name: "description",
        content:
          "Escucha episodios informativos, guías escolares y recursos oficiales con transcripción interactiva para las familias de Des Moines Public Schools.",
      },
    ],
  }),
  component: PublicPodcastsDirectoryPage,
});

const LANG_NAMES: Record<string, string> = {
  es: "Español",
  en: "English",
  ksw: "Karen",
};

function PublicPodcastsDirectoryPage() {
  const { lang } = useI18n();
  const { selectedSchool } = useSchool();
  const { currentEpisode, isPlaying, playEpisode, togglePlayPause } = usePodcastPlayer();

  const [searchQuery, setSearchQuery] = useState("");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [showPlaybackInfo, setShowPlaybackInfo] = useState(false);

  const { data: podcasts = [], isLoading: loadingPodcasts } = useQuery({
    queryKey: ["podcasts", "public", selectedSchool.id],
    queryFn: () =>
      fetchPodcasts({
        onlyPublished: true,
        schoolId: selectedSchool.id,
      }),
  });

  const { data: allPublishedEpisodes = [], isLoading: loadingEpisodes } = useQuery({
    queryKey: ["podcast_episodes", "public_all"],
    queryFn: () => fetchPodcastEpisodes({ onlyPublished: true }),
  });

  const podcastById = useMemo(() => {
    const map = new Map<string, PodcastRow>();
    for (const p of podcasts) {
      map.set(p.id, p);
    }
    return map;
  }, [podcasts]);

  const visibleEpisodes = useMemo(() => {
    return allPublishedEpisodes.filter((ep) => podcastById.has(ep.podcast_id));
  }, [allPublishedEpisodes, podcastById]);

  const { data: publishedTranscriptsMap = {} } = useQuery({
    queryKey: ["podcast_transcripts", "public_map", visibleEpisodes.map((e) => e.id).join(",")],
    queryFn: () =>
      fetchTranscriptsByEpisodeIds(
        visibleEpisodes.map((e) => e.id),
        { onlyPublished: true },
      ),
    enabled: visibleEpisodes.length > 0,
  });

  const filteredPodcasts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return podcasts.filter((p) => {
      if (langFilter !== "all" && p.language !== langFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [langFilter, podcasts, searchQuery]);

  const filteredEpisodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleEpisodes.filter((ep) => {
      if (langFilter !== "all" && ep.language !== langFilter) return false;
      if (!q) return true;
      const pod = podcastById.get(ep.podcast_id);
      return (
        ep.title.toLowerCase().includes(q) ||
        (ep.description && ep.description.toLowerCase().includes(q)) ||
        (pod && pod.name.toLowerCase().includes(q))
      );
    });
  }, [langFilter, podcastById, searchQuery, visibleEpisodes]);

  const handlePlayEpisode = (ep: PodcastEpisodeRow) => {
    if (currentEpisode?.id === ep.id) {
      togglePlayPause();
      return;
    }
    const pod = podcastById.get(ep.podcast_id) || null;
    const tr = publishedTranscriptsMap[ep.id] || null;
    playEpisode(ep, pod, {
      queue: filteredEpisodes,
      transcript: tr,
    });
  };

  const capabilities = useMemo(() => getBackgroundPlaybackCapabilities(), []);

  return (
    <PublicShell>
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12"
      >
        {/* Hero Header */}
        <section className="border-b border-border pb-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Headphones className="size-4" />
                <span>
                  {lang === "en"
                    ? "DMPS Family Audio & Video Guides"
                    : "Guías en Audio y Video para Familias DMPS"}
                </span>
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                {lang === "en"
                  ? "Official Family Podcasts & Audio Guides"
                  : "Podcasts y Episodios para Familias"}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                {lang === "en"
                  ? "Listen to verified school guides, district announcements, and step-by-step explanations while you browse the portal."
                  : "Escucha guías escolares verificadas, avisos del distrito y explicaciones paso a paso con transcripción interactiva mientras navegas por el portal."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPlaybackInfo((prev) => !prev)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Radio className="size-3.5 text-primary" />
                <span>
                  {lang === "en"
                    ? "Background Playback Capabilities"
                    : "Reproducción continua y en segundo plano"}
                </span>
              </button>
            </div>
          </div>

          {showPlaybackInfo && (
            <div className="mt-6 rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                {lang === "en"
                  ? "How continuous & background audio works on your device"
                  : "Cómo funciona la reproducción continua y en segundo plano en tu dispositivo"}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                {capabilities.map((cap) => (
                  <div
                    key={cap.scenarioId}
                    className="rounded-lg border border-border/70 bg-background p-3 space-y-1"
                  >
                    <p className="font-semibold text-foreground">
                      {lang === "en" ? cap.labelEn : cap.labelEs}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {lang === "en" ? cap.descriptionEn : cap.descriptionEs}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Interactive Language Filter */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "en"
                    ? "Search podcasts or episodes..."
                    : "Buscar podcasts o episodios..."
                }
                className="h-10 pl-9"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {(["all", "es", "en", "ksw"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLangFilter(code)}
                  className={`min-h-8 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    langFilter === code
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {code === "all" ? (lang === "en" ? "All languages" : "Todos") : LANG_NAMES[code]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loadingPodcasts || loadingEpisodes ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin text-primary" />
            <span>{lang === "en" ? "Loading podcasts..." : "Cargando podcasts..."}</span>
          </div>
        ) : filteredPodcasts.length === 0 ? (
          <div className="my-12 rounded-xl border border-dashed border-border bg-card p-12 text-center space-y-2">
            <Mic className="mx-auto size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {lang === "en"
                ? "No published podcasts available yet"
                : "Aún no hay podcasts publicados"}
            </h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              {lang === "en"
                ? "New episodes and audio guides for families will appear here once published by the DMPS team."
                : "Los nuevos episodios y guías en audio para las familias aparecerán aquí en cuanto sean publicados por el equipo de DMPS."}
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {/* Podcasts Grid */}
            <section className="space-y-4">
              <h2 className="font-heading text-xl font-bold text-foreground">
                {lang === "en" ? "Podcast Programs" : "Programas de Podcast"}
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredPodcasts.map((pod) => (
                  <Link
                    key={pod.id}
                    to="/podcasts/$slug"
                    params={{ slug: pod.slug }}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-primary">
                        {pod.cover_url || pod.logo_url ? (
                          <img
                            src={pod.cover_url || pod.logo_url || ""}
                            alt={pod.name}
                            className="size-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <Headphones className="size-8" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary">
                          {pod.name}
                        </h3>
                        {pod.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {pod.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <span>{LANG_NAMES[pod.language] || pod.language}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {pod.published_episode_count ?? 0}{" "}
                            {lang === "en" ? "episodes" : "episodios"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end border-t border-border/60 pt-3 text-xs font-semibold text-primary">
                      <span>
                        {lang === "en"
                          ? "View episodes & transcripts"
                          : "Ver episodios y transcripciones"}
                      </span>
                      <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Recent Episodes List */}
            {filteredEpisodes.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-heading text-xl font-bold text-foreground">
                  {lang === "en" ? "Latest Episodes" : "Episodios Recientes"}
                </h2>

                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                  {filteredEpisodes.map((ep) => {
                    const pod = podcastById.get(ep.podcast_id);
                    const tr = publishedTranscriptsMap[ep.id];
                    const isThisPlaying = currentEpisode?.id === ep.id && isPlaying;

                    return (
                      <article
                        key={ep.id}
                        className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {pod && (
                              <>
                                <Link
                                  to="/podcasts/$slug"
                                  params={{ slug: pod.slug }}
                                  className="font-semibold text-foreground hover:text-primary"
                                >
                                  {pod.name}
                                </Link>
                                <span aria-hidden="true">·</span>
                              </>
                            )}
                            <span className="font-mono tabular-nums">
                              T{ep.season_number} E{ep.episode_number}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {formatDurationTimestamp(ep.duration_seconds)}
                            </span>
                            {tr && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 text-primary">
                                  <AlignLeft className="size-3" />
                                  {lang === "en"
                                    ? "Interactive Transcript"
                                    : "Transcripción interactiva"}
                                </span>
                              </>
                            )}
                            {ep.video_url && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Video className="size-3" />
                                  Video
                                </span>
                              </>
                            )}
                            {ep.spotify_url && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Radio className="size-3 text-[#1DB954]" />
                                  Spotify Web
                                </span>
                              </>
                            )}
                          </div>

                          <h3 className="font-heading text-base font-semibold text-foreground">
                            {pod ? (
                              <Link
                                to="/podcasts/$slug"
                                params={{ slug: pod.slug }}
                                className="hover:text-primary"
                              >
                                {ep.title}
                              </Link>
                            ) : (
                              ep.title
                            )}
                          </h3>

                          {ep.description && (
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {ep.description}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => handlePlayEpisode(ep)}
                            className="gap-2"
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
                                : lang === "en"
                                  ? "Listen"
                                  : "Escuchar"}
                            </span>
                          </Button>

                          {pod && (
                            <Button variant="outline" asChild>
                              <Link to="/podcasts/$slug" params={{ slug: pod.slug }}>
                                {lang === "en" ? "Details" : "Ver episodio"}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </PublicShell>
  );
}
