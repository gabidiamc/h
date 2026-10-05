/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileAudio,
  FileVideo,
  Globe,
  Headphones,
  Layers,
  Loader2,
  Mic,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePodcast,
  deletePodcastEpisode,
  fetchEpisodeTranscript,
  fetchPodcastAnalyticsSummary,
  fetchPodcastEpisodes,
  fetchPodcasts,
  formatDurationTimestamp,
  generateAutomaticTranscriptForEpisode,
  parseTimestampToSeconds,
  removeEpisodeMediaFile,
  saveEpisodeTranscript,
  savePodcast,
  savePodcastEpisode,
  slugifyPodcastText,
  type EpisodeAnalyticsMetrics,
  type PodcastEpisodeRow,
  type PodcastRow,
  type PodcastStatus,
  type TranscriptSegment,
} from "@/lib/podcasts";
import { getBackgroundPlaybackCapabilities, usePodcastPlayer } from "@/lib/podcast-player-context";
import { PodcastMediaUploader } from "@/components/podcast/podcast-media-uploader";
import { PodcastImageUploader } from "@/components/podcast/podcast-image-uploader";
import { FileUploadInput } from "@/components/file-upload-input";
import { TranscriptPlayer } from "@/components/podcast/transcript-player";
import {
  isSpotifyUrl,
  parseSpotifyUrl,
  fetchSpotifyOEmbed,
  fetchPodcastMetadata,
} from "@/lib/spotify";
import { SpotifyEmbedPlayer } from "@/components/podcast/spotify-player";

export const Route = createFileRoute("/admin/podcasts")({
  component: AdminPodcastStudioPage,
});

type StudioView =
  | "podcasts_list"
  | "podcast_form"
  | "episodes_manager"
  | "episode_form"
  | "transcript_studio"
  | "analytics_dashboard";

const LANGUAGE_LABELS: Record<string, string> = {
  es: "Español (ES)",
  en: "English (EN)",
  ksw: "Karen (KSW)",
};

const STATUS_LABELS: Record<PodcastStatus, string> = {
  draft: "Borrador (draft)",
  published: "Publicado (published)",
  archived: "Archivado (archived)",
};

const TRANSCRIPT_STATUS_LABELS: Record<string, string> = {
  none: "Sin transcripción",
  processing: "Procesando...",
  review_ready: "Lista para revisión",
  published: "Publicada",
  failed: "Error al generar",
};

function AdminPodcastStudioPage() {
  const queryClient = useQueryClient();
  const {
    currentEpisode: activePlayerEpisode,
    isPlaying,
    playEpisode,
    togglePlayPause,
  } = usePodcastPlayer();

  const [view, setView] = useState<StudioView>("podcasts_list");
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [analyticsEpisodeFilter, setAnalyticsEpisodeFilter] = useState<string | null>(null);
  const [showArchitectureNotes, setShowArchitectureNotes] = useState(false);

  // Podcast Form State (Create / Edit) — defaults to 'draft', never auto-publishes
  const [podcastForm, setPodcastForm] = useState<{
    id?: string;
    name: string;
    slug: string;
    description: string;
    language: string;
    school_id: string;
    logo_url: string;
    logo_storage_path: string | null;
    cover_url: string;
    cover_storage_path: string | null;
    banner_url: string;
    banner_storage_path: string | null;
    spotify_url: string;
    status: PodcastStatus;
  }>({
    name: "",
    slug: "",
    description: "",
    language: "es",
    school_id: "all",
    logo_url: "",
    logo_storage_path: null,
    cover_url: "",
    cover_storage_path: null,
    banner_url: "",
    banner_storage_path: null,
    spotify_url: "",
    status: "draft",
  });
  const [isSavingPodcast, setIsSavingPodcast] = useState(false);

  // Episode Form State (Create / Edit) — defaults to 'draft', never auto-publishes
  const [episodeForm, setEpisodeForm] = useState<{
    id?: string;
    podcast_id: string;
    title: string;
    slug: string;
    description: string;
    episode_number: number;
    season_number: number;
    published_at: string;
    duration_seconds: number;
    spotify_url: string;
    audio_url: string;
    audio_storage_path: string | null;
    audio_mime_type: string | null;
    audio_size_bytes: number | null;
    video_url: string;
    video_storage_path: string | null;
    video_mime_type: string | null;
    video_size_bytes: number | null;
    cover_url: string;
    cover_storage_path: string | null;
    language: string;
    status: PodcastStatus;
  }>({
    podcast_id: "",
    title: "",
    slug: "",
    description: "",
    episode_number: 1,
    season_number: 1,
    published_at: new Date().toISOString().slice(0, 10),
    duration_seconds: 0,
    spotify_url: "",
    audio_url: "",
    audio_storage_path: null,
    audio_mime_type: null,
    audio_size_bytes: null,
    video_url: "",
    video_storage_path: null,
    video_mime_type: null,
    video_size_bytes: null,
    cover_url: "",
    cover_storage_path: null,
    language: "es",
    status: "draft",
  });
  const [isSavingEpisode, setIsSavingEpisode] = useState(false);
  const [isFetchingSpotifyMetadata, setIsFetchingSpotifyMetadata] = useState(false);

  // Transcript Studio State
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [transcriptFullText, setTranscriptFullText] = useState("");
  const [transcriptLanguage, setTranscriptLanguage] = useState("es");
  const [transcriptStatus, setTranscriptStatus] = useState<string>("draft");
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);

  // Queries
  const {
    data: podcasts = [],
    isLoading: loadingPodcasts,
    refetch: refetchPodcasts,
  } = useQuery({
    queryKey: ["podcasts", "admin"],
    queryFn: () => fetchPodcasts({ onlyPublished: false }),
  });

  const selectedPodcast = useMemo(
    () => podcasts.find((p) => p.id === selectedPodcastId) || null,
    [podcasts, selectedPodcastId],
  );

  const {
    data: episodes = [],
    isLoading: loadingEpisodes,
    refetch: refetchEpisodes,
  } = useQuery({
    queryKey: ["podcast_episodes", "admin", selectedPodcastId],
    queryFn: () =>
      selectedPodcastId
        ? fetchPodcastEpisodes({ podcastId: selectedPodcastId, onlyPublished: false })
        : Promise.resolve([]),
    enabled: Boolean(selectedPodcastId),
  });

  const selectedEpisode = useMemo(
    () => episodes.find((e) => e.id === selectedEpisodeId) || null,
    [episodes, selectedEpisodeId],
  );

  const {
    data: analyticsSummary,
    isLoading: loadingAnalytics,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["podcast_analytics", selectedPodcastId],
    queryFn: () =>
      fetchPodcastAnalyticsSummary({
        podcastId: selectedPodcastId || undefined,
      }),
  });

  const episodeMetricsMap = useMemo(() => {
    const map = new Map<string, EpisodeAnalyticsMetrics>();
    for (const m of analyticsSummary?.episodes || []) {
      map.set(m.episodeId, m);
    }
    return map;
  }, [analyticsSummary]);

  const invalidateAllPodcastQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["podcasts"] }),
      queryClient.invalidateQueries({ queryKey: ["podcast_episodes"] }),
      queryClient.invalidateQueries({ queryKey: ["podcast_transcripts"] }),
      queryClient.invalidateQueries({ queryKey: ["podcast_analytics"] }),
    ]);
  };

  // Handlers: Podcasts
  const openCreatePodcast = () => {
    setPodcastForm({
      id: `pod_${Date.now()}`,
      name: "",
      slug: "",
      description: "",
      language: "es",
      school_id: "all",
      logo_url: "",
      logo_storage_path: null,
      cover_url: "",
      cover_storage_path: null,
      banner_url: "",
      banner_storage_path: null,
      spotify_url: "",
      status: "draft",
    });
    setView("podcast_form");
  };

  const openEditPodcast = (pod: PodcastRow) => {
    setSelectedPodcastId(pod.id);
    setPodcastForm({
      id: pod.id,
      name: pod.name,
      slug: pod.slug,
      description: pod.description || "",
      language: pod.language || "es",
      school_id: pod.school_id || "all",
      logo_url: pod.logo_url || "",
      logo_storage_path: pod.logo_storage_path || null,
      cover_url: pod.cover_url || "",
      cover_storage_path: pod.cover_storage_path || null,
      banner_url: pod.banner_url || "",
      banner_storage_path: pod.banner_storage_path || null,
      spotify_url: pod.spotify_url || pod.metadata?.spotify_url || "",
      status: pod.status || "draft",
    });
    setView("podcast_form");
  };

  const handleSavePodcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastForm.name.trim()) {
      toast.error("Ingresa el nombre del podcast.");
      return;
    }
    setIsSavingPodcast(true);
    try {
      const saved = await savePodcast({
        id: podcastForm.id,
        name: podcastForm.name,
        slug: podcastForm.slug,
        description: podcastForm.description,
        language: podcastForm.language,
        school_id: podcastForm.school_id,
        logo_url: podcastForm.logo_url || null,
        logo_storage_path: podcastForm.logo_storage_path,
        cover_url: podcastForm.cover_url || null,
        cover_storage_path: podcastForm.cover_storage_path,
        banner_url: podcastForm.banner_url || null,
        banner_storage_path: podcastForm.banner_storage_path,
        spotify_url: podcastForm.spotify_url?.trim() || null,
        status: podcastForm.status,
      });
      await invalidateAllPodcastQueries();
      setSelectedPodcastId(saved.id);
      toast.success(`Podcast "${saved.name}" guardado con estado ${STATUS_LABELS[saved.status]}.`);
      setView("podcasts_list");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar el podcast.");
    } finally {
      setIsSavingPodcast(false);
    }
  };

  const handleDeletePodcast = async (pod: PodcastRow) => {
    try {
      await deletePodcast(pod.id);
      await invalidateAllPodcastQueries();
      if (selectedPodcastId === pod.id) {
        setSelectedPodcastId(null);
      }
      toast.success(`Podcast "${pod.name}" eliminado.`);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar el podcast.");
    }
  };

  // Handlers: Episodes
  const openManageEpisodes = (pod: PodcastRow) => {
    setSelectedPodcastId(pod.id);
    setSelectedEpisodeId(null);
    setView("episodes_manager");
  };

  const openCreateEpisode = () => {
    if (!selectedPodcast) return;
    const nextEpNum =
      episodes.length > 0 ? Math.max(...episodes.map((e) => e.episode_number)) + 1 : 1;
    setEpisodeForm({
      id: "", // Real Stage 3: episode record must exist in DB before uploading media
      podcast_id: selectedPodcast.id,
      title: "",
      slug: "",
      description: "",
      episode_number: nextEpNum,
      season_number: 1,
      published_at: new Date().toISOString().slice(0, 10),
      duration_seconds: 0,
      spotify_url: "",
      audio_url: "",
      audio_storage_path: null,
      audio_mime_type: null,
      audio_size_bytes: null,
      video_url: "",
      video_storage_path: null,
      video_mime_type: null,
      video_size_bytes: null,
      cover_url: "",
      cover_storage_path: null,
      language: selectedPodcast.language || "es",
      status: "draft",
    });
    setView("episode_form");
  };

  const openEditEpisode = (ep: PodcastEpisodeRow) => {
    setSelectedEpisodeId(ep.id);
    setEpisodeForm({
      id: ep.id,
      podcast_id: ep.podcast_id,
      title: ep.title,
      slug: ep.slug,
      description: ep.description || "",
      episode_number: ep.episode_number,
      season_number: ep.season_number,
      published_at: ep.published_at
        ? String(ep.published_at).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      duration_seconds: ep.duration_seconds,
      spotify_url: ep.spotify_url || ep.metadata?.spotify_url || "",
      audio_url: ep.audio_url || "",
      audio_storage_path: ep.audio_storage_path,
      audio_mime_type: ep.audio_mime_type,
      audio_size_bytes: ep.audio_size_bytes,
      video_url: ep.video_url || "",
      video_storage_path: ep.video_storage_path,
      video_mime_type: ep.video_mime_type,
      video_size_bytes: ep.video_size_bytes,
      cover_url: ep.cover_url || "",
      cover_storage_path: ep.cover_storage_path,
      language: ep.language || "es",
      status: ep.status || "draft",
    });
    setView("episode_form");
  };

  const [isFetchingPodcastMetadata, setIsFetchingPodcastMetadata] = useState(false);

  const handleAutoFillPodcastFromLink = async (customUrl?: string) => {
    const url = (customUrl || podcastForm.spotify_url || "").trim();
    if (!url) {
      toast.info("Ingresa o pega un enlace del podcast primero.");
      return;
    }
    setIsFetchingPodcastMetadata(true);
    try {
      const data = await fetchPodcastMetadata(url);
      if (data && (data.name || data.title)) {
        const pName = (data.name || data.title || "").trim();
        const pDesc = (data.description || "").trim();
        setPodcastForm((prev) => ({
          ...prev,
          name: pName || prev.name,
          description: pDesc || prev.description,
          slug:
            prev.slug.trim() && prev.slug !== "nuevo-podcast"
              ? prev.slug
              : slugifyPodcastText(pName || prev.name),
          cover_url: data.coverUrl || prev.cover_url,
          spotify_url: url.includes("spotify.com") ? url : prev.spotify_url || url,
        }));
        toast.success("¡Nombre y descripción del podcast rellenados automáticamente!");
      } else {
        toast.info("Enlace leído. Puedes revisar el nombre y descripción.");
      }
    } catch {
      toast.error("No se pudo obtener información del enlace del podcast.");
    } finally {
      setIsFetchingPodcastMetadata(false);
    }
  };

  const handleAutoFillFromSpotify = async (customUrl?: string) => {
    const url = (customUrl || episodeForm.spotify_url || "").trim();
    if (!url) return;
    setIsFetchingSpotifyMetadata(true);
    try {
      const data = await fetchPodcastMetadata(url);
      if (data && (data.title || data.name)) {
        const epTitle = (data.title || data.name || "").trim();
        const epDesc = (data.description || "").trim();
        setEpisodeForm((prev) => ({
          ...prev,
          title: epTitle || prev.title,
          description: epDesc || prev.description,
          slug:
            prev.slug.trim() && prev.slug !== "nuevo-episodio"
              ? prev.slug
              : slugifyPodcastText(epTitle || prev.title),
          cover_url: data.coverUrl || prev.cover_url,
          spotify_url: url.includes("spotify.com") ? url : prev.spotify_url || url,
        }));
        toast.success("¡Título, descripción y portada del episodio rellenados automáticamente!");
      } else {
        toast.info("Enlace verificado. Puedes editar el título y detalles manualmente.");
      }
    } catch {
      toast.error("No se pudo obtener información automática de Spotify.");
    } finally {
      setIsFetchingSpotifyMetadata(false);
    }
  };

  const handleSaveEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!episodeForm.title.trim()) {
      toast.error("Ingresa el título del episodio.");
      return;
    }
    setIsSavingEpisode(true);
    try {
      const isNew = !episodeForm.id;
      const saved = await savePodcastEpisode({
        id: episodeForm.id || undefined,
        podcast_id: episodeForm.podcast_id,
        title: episodeForm.title,
        slug: episodeForm.slug,
        description: episodeForm.description,
        episode_number: Number(episodeForm.episode_number || 1),
        season_number: Number(episodeForm.season_number || 1),
        published_at: episodeForm.published_at
          ? new Date(episodeForm.published_at).toISOString()
          : null,
        duration_seconds: Number(episodeForm.duration_seconds || 0),
        spotify_url: episodeForm.spotify_url?.trim() || null,
        audio_url: episodeForm.audio_url || null,
        audio_storage_path: episodeForm.audio_storage_path,
        audio_mime_type: episodeForm.audio_mime_type,
        audio_size_bytes: episodeForm.audio_size_bytes,
        video_url: episodeForm.video_url || null,
        video_storage_path: episodeForm.video_storage_path,
        video_mime_type: episodeForm.video_mime_type,
        video_size_bytes: episodeForm.video_size_bytes,
        cover_url: episodeForm.cover_url || null,
        cover_storage_path: episodeForm.cover_storage_path,
        language: episodeForm.language,
        status: episodeForm.status,
      });
      await invalidateAllPodcastQueries();
      setSelectedEpisodeId(saved.id);
      setEpisodeForm((prev) => ({
        ...prev,
        id: saved.id,
        slug: saved.slug,
      }));

      if (isNew) {
        if (saved.spotify_url) {
          toast.success(
            `Episodio "${saved.title}" vinculado a Spotify con éxito. ¡Listo para reproducirse en la web sin subir archivos de audio!`,
          );
          setView("episodes_manager");
        } else {
          toast.success(
            `Episodio "${saved.title}" registrado correctamente con ID real (${saved.id}). Ahora puedes subir el Audio, Video y Portada.`,
          );
        }
      } else {
        toast.success(`Episodio "${saved.title}" guardado (${STATUS_LABELS[saved.status]}).`);
        setView("episodes_manager");
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string } | null;
      toast.error(errorObj?.message || "No se pudo guardar el episodio.");
    } finally {
      setIsSavingEpisode(false);
    }
  };

  const handleToggleEpisodePublish = async (ep: PodcastEpisodeRow) => {
    const nextStatus: PodcastStatus = ep.status === "published" ? "draft" : "published";
    try {
      await savePodcastEpisode({
        ...ep,
        status: nextStatus,
        published_at:
          nextStatus === "published"
            ? ep.published_at || new Date().toISOString()
            : ep.published_at,
      });
      await invalidateAllPodcastQueries();
      toast.success(
        nextStatus === "published"
          ? `Episodio "${ep.title}" publicado en el sitio público.`
          : `Episodio "${ep.title}" pasado a borrador.`,
      );
    } catch (err: any) {
      toast.error(err?.message || "No se pudo cambiar el estado del episodio.");
    }
  };

  const handleDeleteEpisode = async (ep: PodcastEpisodeRow) => {
    try {
      await deletePodcastEpisode(ep.id);
      await invalidateAllPodcastQueries();
      toast.success(`Episodio "${ep.title}" eliminado.`);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar el episodio.");
    }
  };

  const handlePreviewEpisode = async (ep: PodcastEpisodeRow) => {
    if (activePlayerEpisode?.id === ep.id) {
      togglePlayPause();
      return;
    }
    const tr = await fetchEpisodeTranscript(ep.id);
    playEpisode(ep, selectedPodcast, {
      queue: episodes,
      transcript: tr,
    });
    toast.info(`Reproduciendo vista previa: "${ep.title}" en el reproductor global.`);
  };

  // Handlers: Transcript Studio (Phase 8)
  const openTranscriptStudio = async (ep: PodcastEpisodeRow) => {
    setSelectedEpisodeId(ep.id);
    setView("transcript_studio");
    const existing = await fetchEpisodeTranscript(ep.id);
    if (existing) {
      setTranscriptSegments(existing.segments);
      setTranscriptFullText(existing.full_text);
      setTranscriptLanguage(existing.language || ep.language || "es");
      setTranscriptStatus(existing.status);
    } else {
      setTranscriptSegments([]);
      setTranscriptFullText("");
      setTranscriptLanguage(ep.language || "es");
      setTranscriptStatus("none");
    }
  };

  const handleGenerateAutomaticTranscript = async () => {
    if (!selectedEpisode) return;
    setIsGeneratingTranscript(true);
    setTranscriptStatus("processing");
    try {
      const generated = await generateAutomaticTranscriptForEpisode({
        episode: selectedEpisode,
        podcastName: selectedPodcast?.name || "DMPS Family Info",
      });
      setTranscriptSegments(generated.segments);
      setTranscriptFullText(generated.full_text);
      setTranscriptLanguage(generated.language);
      setTranscriptStatus(generated.status);
      await invalidateAllPodcastQueries();
      toast.success(
        "Transcripción generada para revisión. Revísala y edítala antes de publicarla.",
      );
    } catch (err: any) {
      setTranscriptStatus("failed");
      toast.error(err?.message || "Error al generar la transcripción automática.");
    } finally {
      setIsGeneratingTranscript(false);
    }
  };

  const handleSaveTranscriptReview = async (publishNow: boolean) => {
    if (!selectedEpisode) return;
    setIsSavingTranscript(true);
    try {
      const rebuiltFullText =
        transcriptSegments.length > 0
          ? transcriptSegments
              .map((s) => `${s.speaker ? `${s.speaker}: ` : ""}${s.text}`)
              .join("\n\n")
          : transcriptFullText;

      const saved = await saveEpisodeTranscript({
        episodeId: selectedEpisode.id,
        language: transcriptLanguage,
        fullText: rebuiltFullText,
        segments: transcriptSegments,
        status: publishNow ? "published" : "review_ready",
        publish: publishNow,
      });

      setTranscriptFullText(saved.full_text);
      setTranscriptStatus(saved.status);
      await invalidateAllPodcastQueries();

      toast.success(
        publishNow
          ? "Transcripción publicada. Ahora es visible e interactiva para las familias."
          : "Transcripción guardada en estado de revisión (sin publicar aún).",
      );
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar la transcripción.");
    } finally {
      setIsSavingTranscript(false);
    }
  };

  const updateSegmentField = (
    index: number,
    field: keyof TranscriptSegment,
    value: string | number,
  ) => {
    setTranscriptSegments((prev) =>
      prev.map((seg, i) => (i === index ? { ...seg, [field]: value } : seg)),
    );
  };

  const addTranscriptSegment = () => {
    setTranscriptSegments((prev) => {
      const last = prev[prev.length - 1];
      const nextStart = last ? last.endTime : 0;
      const nextEnd = nextStart + 10;
      return [
        ...prev,
        {
          id: `seg_${Date.now()}`,
          startTime: nextStart,
          endTime: nextEnd,
          speaker: "Locutor (DMPS)",
          text: "",
        },
      ];
    });
  };

  const removeTranscriptSegment = (index: number) => {
    setTranscriptSegments((prev) => prev.filter((_, i) => i !== index));
  };

  const backgroundCapabilities = useMemo(() => getBackgroundPlaybackCapabilities(), []);

  return (
    <div className="space-y-6 pb-24">
      {/* Studio Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>DMPS INFO</span>
            <span aria-hidden="true">·</span>
            <span>Producción Multimedia Familiar</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Podcast Studio
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Administra podcasts, episodios en audio y video, transcripciones sincronizadas con IA y
            métricas reales de escucha para las familias de Des Moines Public Schools.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowArchitectureNotes((prev) => !prev)}
            className="gap-1.5"
          >
            <ShieldCheck className="size-4 text-primary" />
            <span>Arquitectura y Storage</span>
          </Button>

          <Button
            type="button"
            variant={view === "analytics_dashboard" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setAnalyticsEpisodeFilter(null);
              setView("analytics_dashboard");
            }}
            className="gap-1.5"
          >
            <BarChart3 className="size-4" />
            <span>Podcast Analytics</span>
          </Button>

          <Button type="button" size="sm" onClick={openCreatePodcast} className="gap-1.5">
            <Plus className="size-4" />
            <span>Crear Podcast</span>
          </Button>
        </div>
      </div>

      {/* Architecture & Storage Audit Summary Drawer */}
      {showArchitectureNotes && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Informe de Auditoría & Arquitectura de Producción (Podcast Studio V1)
              </h2>
              <p className="text-xs text-muted-foreground">
                Integrado con Supabase Auth (`public.can_manage_content()`), Supabase Storage y DMPS
                Analytics.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowArchitectureNotes(false)}
            >
              Cerrar
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">
                01. Base de Datos y Consultas Optimizadas
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Tablas: <code>public.podcasts</code>, <code>public.podcast_episodes</code>,{" "}
                <code>public.podcast_transcripts</code> y{" "}
                <code>public.podcast_analytics_events</code>. Consultas explícitas sin{" "}
                <code>SELECT *</code> y conteo de episodios por lote sin N+1 queries.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">
                02. Bucket Supabase Storage (`podcast-media`)
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Estructura: <code>podcasts/&#123;podcast_id&#125;/branding/*</code> y{" "}
                <code>podcasts/&#123;podcast_id&#125;/episodes/&#123;episode_id&#125;/*</code>.
                Políticas RLS: lectura pública y escritura restringida a{" "}
                <code>public.can_manage_content()</code>. Reemplazo seguro sin borrar el archivo
                anterior hasta confirmar el nuevo.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-foreground">
                03. Capacidades Reales de Reproducción
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {backgroundCapabilities.map((cap) => (
                  <li key={cap.scenarioId} className="flex items-center justify-between gap-2">
                    <span>{cap.labelEs}</span>
                    <span className="font-mono text-[11px] text-foreground">
                      {cap.supported ? "Soportado" : "Límite OS"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* VIEW 1: PODCASTS LIST */}
      {view === "podcasts_list" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Podcasts registrados ({podcasts.length})
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void refetchPodcasts()}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className="size-3.5" />
              <span>Actualizar</span>
            </Button>
          </div>

          {loadingPodcasts ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Cargando podcasts desde Supabase...
            </div>
          ) : podcasts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-3">
              <Headphones className="mx-auto size-8 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Aún no hay podcasts creados
                </h3>
                <p className="mx-auto max-w-md text-xs text-muted-foreground">
                  Crea el primer podcast oficial para las familias de DMPS. Puedes agregar portada,
                  banner, logo, episodios en audio o video y transcripciones con IA.
                </p>
              </div>
              <Button type="button" onClick={openCreatePodcast} className="gap-1.5">
                <Plus className="size-4" />
                <span>Crear primer podcast</span>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {podcasts.map((pod) => (
                <div
                  key={pod.id}
                  className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-muted-foreground">
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
                        <Mic className="size-6 text-primary" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3 className="font-heading text-base font-semibold text-foreground">
                        {pod.name}
                      </h3>
                      {pod.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {pod.description}
                        </p>
                      )}
                      {/* Clean unboxed metadata with typographic separators */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{LANGUAGE_LABELS[pod.language] || pod.language}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {pod.episode_count ?? 0} episodios ({pod.published_episode_count ?? 0}{" "}
                          publicados)
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            pod.status === "published"
                              ? "font-medium text-emerald-600 dark:text-emerald-400"
                              : "font-medium text-amber-600 dark:text-amber-400"
                          }
                        >
                          {STATUS_LABELS[pod.status]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Actualizado{" "}
                          {new Date(pod.updated_at).toLocaleDateString("es-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openManageEpisodes(pod)}
                      className="gap-1.5"
                    >
                      <Layers className="size-3.5" />
                      <span>Administrar episodios</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditPodcast(pod)}
                      className="gap-1.5"
                    >
                      <Edit3 className="size-3.5" />
                      <span>Editar</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPodcastId(pod.id);
                        setAnalyticsEpisodeFilter(null);
                        setView("analytics_dashboard");
                      }}
                      className="gap-1.5"
                    >
                      <BarChart3 className="size-3.5" />
                      <span>Analytics</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDeletePodcast(pod)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Eliminar podcast"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* VIEW 2: CREATE / EDIT PODCAST FORM */}
      {view === "podcast_form" && (
        <form
          onSubmit={handleSavePodcastSubmit}
          className="space-y-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setView("podcasts_list")}
                className="gap-1"
              >
                <ArrowLeft className="size-4" />
                <span>Volver</span>
              </Button>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {podcasts.some((p) => p.id === podcastForm.id)
                  ? "Editar Podcast"
                  : "Crear Nuevo Podcast"}
              </h2>
            </div>

            <span className="text-xs text-muted-foreground">
              No se publica automáticamente — revisa el estado antes de guardar
            </span>
          </div>

          {/* Autocompletar desde enlace del podcast */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Autocompletar podcast desde enlace (Spotify, RSS o Web)</span>
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Al subir o pegar el link del podcast, se rellenará automáticamente el nombre,
                  descripción y portada.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isFetchingPodcastMetadata || !podcastForm.spotify_url}
                onClick={() => handleAutoFillPodcastFromLink()}
                className="gap-1.5 text-xs shrink-0 self-start sm:self-auto bg-card hover:bg-muted"
              >
                {isFetchingPodcastMetadata ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5 text-primary" />
                )}
                <span>Rellenar nombre y descripción</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                value={podcastForm.spotify_url || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setPodcastForm((prev) => ({ ...prev, spotify_url: val }));
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (pasted && (pasted.startsWith("http://") || pasted.startsWith("https://"))) {
                    setTimeout(() => handleAutoFillPodcastFromLink(pasted), 120);
                  }
                }}
                onBlur={() => {
                  if (podcastForm.spotify_url && !podcastForm.name) {
                    handleAutoFillPodcastFromLink();
                  }
                }}
                placeholder="Pega aquí el enlace: ej. https://open.spotify.com/show/..., feed RSS o URL del podcast"
                className="text-xs font-mono bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nombre del Podcast *</label>
              <Input
                required
                value={podcastForm.name}
                onChange={(e) => setPodcastForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej. Voces de las Familias DMPS"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Slug (URL pública)</label>
              <Input
                value={podcastForm.slug}
                onChange={(e) => setPodcastForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="Se genera automáticamente desde el nombre"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Idioma principal</label>
              <select
                value={podcastForm.language}
                onChange={(e) => setPodcastForm((prev) => ({ ...prev, language: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="es">Español (es)</option>
                <option value="en">English (en)</option>
                <option value="ksw">Karen (ksw)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Estado (no se publica automáticamente)
              </label>
              <select
                value={podcastForm.status}
                onChange={(e) =>
                  setPodcastForm((prev) => ({
                    ...prev,
                    status: e.target.value as PodcastStatus,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="draft">Borrador (draft)</option>
                <option value="published">Publicado (published)</option>
                <option value="archived">Archivado (archived)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Descripción</label>
              <Textarea
                rows={3}
                value={podcastForm.description}
                onChange={(e) =>
                  setPodcastForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe el propósito y temas de este podcast para las familias..."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Radio className="size-3.5 text-[#1DB954]" />
                <span>Enlace de Spotify del Show / Canal (Opcional)</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  (open.spotify.com/show/...)
                </span>
              </label>
              <Input
                value={podcastForm.spotify_url || ""}
                onChange={(e) =>
                  setPodcastForm((prev) => ({ ...prev, spotify_url: e.target.value }))
                }
                placeholder="https://open.spotify.com/show/... (canal oficial en Spotify)"
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Si tu podcast está publicado en Spotify, puedes vincular el programa completo para
                habilitar el reproductor oficial del canal en la cabecera del podcast.
              </p>
              {podcastForm.spotify_url && parseSpotifyUrl(podcastForm.spotify_url) && (
                <div className="pt-2">
                  <SpotifyEmbedPlayer
                    spotifyUrl={podcastForm.spotify_url}
                    title={podcastForm.name || "Canal de Spotify"}
                    compact={true}
                    allowExpand={false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Media Branding Uploads: Portada, Banner, Logo */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Imágenes y Branding del Podcast
              </h3>
              <p className="text-xs text-muted-foreground">
                Sube las imágenes del podcast como en el resto de la aplicación. Puedes seleccionar
                archivos de tu dispositivo, arrastrarlos o pegarlos directamente con{" "}
                <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-foreground font-semibold border border-border">
                  Ctrl+V
                </kbd>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <PodcastImageUploader
                type="cover"
                label="Portada del Podcast (1:1)"
                helperText="JPG, PNG, WebP o SVG. Portada oficial para tarjetas, reproductores y miniaturas."
                podcastId={podcastForm.id || "pod_default"}
                currentUrl={podcastForm.cover_url}
                currentStoragePath={podcastForm.cover_storage_path}
                onChange={({ url, storagePath }) =>
                  setPodcastForm((prev) => ({
                    ...prev,
                    cover_url: url,
                    cover_storage_path: storagePath || (url ? prev.cover_storage_path : null),
                  }))
                }
                onDelete={() => {
                  setPodcastForm((prev) => ({
                    ...prev,
                    cover_url: "",
                    cover_storage_path: null,
                  }));
                }}
              />

              <PodcastImageUploader
                type="banner"
                label="Banner de Cabecera (16:9)"
                helperText="JPG, PNG, WebP (16:9). Imagen panorámica destacada para la cabecera del podcast."
                podcastId={podcastForm.id || "pod_default"}
                currentUrl={podcastForm.banner_url}
                currentStoragePath={podcastForm.banner_storage_path}
                onChange={({ url, storagePath }) =>
                  setPodcastForm((prev) => ({
                    ...prev,
                    banner_url: url,
                    banner_storage_path: storagePath || (url ? prev.banner_storage_path : null),
                  }))
                }
                onDelete={() => {
                  setPodcastForm((prev) => ({
                    ...prev,
                    banner_url: "",
                    banner_storage_path: null,
                  }));
                }}
              />

              <PodcastImageUploader
                type="logo"
                label="Ícono / Logo del Podcast"
                helperText="PNG con fondo transparente o SVG. Emblema distintivo del programa o canal."
                podcastId={podcastForm.id || "pod_default"}
                currentUrl={podcastForm.logo_url}
                currentStoragePath={podcastForm.logo_storage_path}
                onChange={({ url, storagePath }) =>
                  setPodcastForm((prev) => ({
                    ...prev,
                    logo_url: url,
                    logo_storage_path: storagePath || (url ? prev.logo_storage_path : null),
                  }))
                }
                onDelete={() => {
                  setPodcastForm((prev) => ({
                    ...prev,
                    logo_url: "",
                    logo_storage_path: null,
                  }));
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setView("podcasts_list")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSavingPodcast} className="gap-1.5">
              {isSavingPodcast ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span>Guardar Podcast</span>
            </Button>
          </div>
        </form>
      )}

      {/* VIEW 3: EPISODES MANAGER */}
      {view === "episodes_manager" && selectedPodcast && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setView("podcasts_list")}
                className="gap-1"
              >
                <ArrowLeft className="size-4" />
                <span>Podcasts</span>
              </Button>
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {selectedPodcast.name} — Episodios ({episodes.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Idioma: {LANGUAGE_LABELS[selectedPodcast.language] || selectedPodcast.language} ·{" "}
                  Estado: {STATUS_LABELS[selectedPodcast.status]}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAnalyticsEpisodeFilter(null);
                  setView("analytics_dashboard");
                }}
                className="gap-1.5"
              >
                <BarChart3 className="size-4" />
                <span>Analytics del Podcast</span>
              </Button>
              <Button type="button" size="sm" onClick={openCreateEpisode} className="gap-1.5">
                <Plus className="size-4" />
                <span>Nuevo Episodio</span>
              </Button>
            </div>
          </div>

          {loadingEpisodes ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Cargando episodios...
            </div>
          ) : episodes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center space-y-3">
              <FileAudio className="mx-auto size-8 text-muted-foreground" />
              <div className="space-y-1">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  Este podcast aún no tiene episodios
                </h3>
                <p className="mx-auto max-w-md text-xs text-muted-foreground">
                  Sube un episodio en MP3 o video MP4, genera su transcripción automática y revísala
                  antes de publicarlo.
                </p>
              </div>
              <Button type="button" onClick={openCreateEpisode} className="gap-1.5">
                <Plus className="size-4" />
                <span>Subir primer episodio</span>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {episodes.map((ep) => {
                const epMetrics = episodeMetricsMap.get(ep.id);
                const isThisPlaying = activePlayerEpisode?.id === ep.id && isPlaying;

                return (
                  <div
                    key={ep.id}
                    className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center lg:p-5"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
                        <span>
                          T{ep.season_number} · Ep. {ep.episode_number}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDurationTimestamp(ep.duration_seconds)}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {ep.published_at
                            ? new Date(ep.published_at).toLocaleDateString("es-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Sin fecha"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {ep.audio_url && ep.video_url
                            ? "Audio + Video"
                            : ep.video_url
                              ? "Video MP4"
                              : ep.audio_url
                                ? "Audio MP3"
                                : "Sin archivo multimedia"}
                        </span>
                      </div>

                      <h3 className="font-heading text-base font-semibold text-foreground">
                        {ep.title}
                      </h3>

                      {ep.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {ep.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className={
                            ep.status === "published"
                              ? "font-semibold text-emerald-600 dark:text-emerald-400"
                              : "font-semibold text-amber-600 dark:text-amber-400"
                          }
                        >
                          Estado: {STATUS_LABELS[ep.status]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Transcripción:{" "}
                          <strong className="text-foreground">
                            {TRANSCRIPT_STATUS_LABELS[ep.transcript_status] || ep.transcript_status}
                          </strong>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          Escuchas: {epMetrics?.totalPlays ?? 0} · Completado prom.:{" "}
                          {epMetrics?.avgCompletionPercent ?? 0}%
                        </span>
                      </div>
                    </div>

                    {/* Episode Actions: Editar, Preview, Transcript, Publish/Unpublish, Analytics */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handlePreviewEpisode(ep)}
                        className="gap-1.5"
                      >
                        {isThisPlaying ? (
                          <Pause className="size-3.5 text-primary" />
                        ) : (
                          <Play className="size-3.5 text-primary" />
                        )}
                        <span>{isThisPlaying ? "Pausar" : "Preview"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void openTranscriptStudio(ep)}
                        className="gap-1.5"
                      >
                        <AlignLeft className="size-3.5 text-primary" />
                        <span>Transcripción</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditEpisode(ep)}
                        className="gap-1.5"
                      >
                        <Edit3 className="size-3.5" />
                        <span>Editar</span>
                      </Button>

                      <Button
                        type="button"
                        variant={ep.status === "published" ? "outline" : "default"}
                        size="sm"
                        onClick={() => void handleToggleEpisodePublish(ep)}
                        className="gap-1.5"
                      >
                        <Globe className="size-3.5" />
                        <span>{ep.status === "published" ? "Despublicar" : "Publicar"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAnalyticsEpisodeFilter(ep.id);
                          setView("analytics_dashboard");
                        }}
                        className="gap-1.5"
                      >
                        <BarChart3 className="size-3.5" />
                        <span>Analytics</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteEpisode(ep)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Eliminar episodio"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* VIEW 4: CREATE / EDIT EPISODE FORM */}
      {view === "episode_form" && selectedPodcast && (
        <form
          onSubmit={handleSaveEpisodeSubmit}
          className="space-y-6 rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setView("episodes_manager")}
                className="gap-1"
              >
                <ArrowLeft className="size-4" />
                <span>Episodios</span>
              </Button>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {episodes.some((e) => e.id === episodeForm.id)
                  ? "Editar Episodio"
                  : `Nuevo Episodio — ${selectedPodcast.name}`}
              </h2>
            </div>

            <span className="text-xs text-muted-foreground">
              Estado predeterminado: Borrador (no se publica automáticamente)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground">Título del Episodio *</label>
              <Input
                required
                value={episodeForm.title}
                onChange={(e) => setEpisodeForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ej. Guía de inscripción escolar e Infinite Campus"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Estado</label>
              <select
                value={episodeForm.status}
                onChange={(e) =>
                  setEpisodeForm((prev) => ({
                    ...prev,
                    status: e.target.value as PodcastStatus,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="draft">Borrador (draft)</option>
                <option value="published">Publicado (published)</option>
                <option value="archived">Archivado (archived)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Temporada</label>
              <Input
                type="number"
                min={1}
                value={episodeForm.season_number}
                onChange={(e) =>
                  setEpisodeForm((prev) => ({
                    ...prev,
                    season_number: Number(e.target.value || 1),
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Número de Episodio</label>
              <Input
                type="number"
                min={1}
                value={episodeForm.episode_number}
                onChange={(e) =>
                  setEpisodeForm((prev) => ({
                    ...prev,
                    episode_number: Number(e.target.value || 1),
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Duración (segundos)</label>
              <Input
                type="number"
                min={0}
                value={episodeForm.duration_seconds}
                onChange={(e) =>
                  setEpisodeForm((prev) => ({
                    ...prev,
                    duration_seconds: Number(e.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Fecha de publicación</label>
              <Input
                type="date"
                value={episodeForm.published_at}
                onChange={(e) =>
                  setEpisodeForm((prev) => ({
                    ...prev,
                    published_at: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Idioma</label>
              <select
                value={episodeForm.language}
                onChange={(e) => setEpisodeForm((prev) => ({ ...prev, language: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="es">Español (es)</option>
                <option value="en">English (en)</option>
                <option value="ksw">Karen (ksw)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-3">
              <label className="text-xs font-semibold text-foreground">
                Descripción y notas del episodio
              </label>
              <Textarea
                rows={3}
                value={episodeForm.description}
                onChange={(e) =>
                  setEpisodeForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Resumen detallado, enlaces útiles y puntos clave tratados en este episodio..."
              />
            </div>
          </div>

          {/* Spotify Direct Integration Section (No need to upload audio) */}
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-xs">
                  <Radio className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    Integración Directa con Spotify
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Sin subir audio
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pega el enlace de Spotify para reproducir el episodio (audio o video)
                    directamente dentro de la web sin necesidad de subir archivos ni abrir apps
                    externas.
                  </p>
                </div>
              </div>

              {Boolean(episodeForm.spotify_url) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isFetchingSpotifyMetadata}
                  onClick={() => handleAutoFillFromSpotify()}
                  className="gap-1.5 text-xs h-8 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                >
                  {isFetchingSpotifyMetadata ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5 text-emerald-500" />
                  )}
                  <span>Autocompletar título y descripción</span>
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>
                  Enlace de Spotify o audio del Episodio (autocompleta título y descripción)
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  (open.spotify.com/episode/... o enlace web)
                </span>
              </label>

              <div className="relative">
                <Input
                  value={episodeForm.spotify_url || ""}
                  onChange={(e) =>
                    setEpisodeForm((prev) => ({
                      ...prev,
                      spotify_url: e.target.value,
                    }))
                  }
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted && (pasted.startsWith("http://") || pasted.startsWith("https://"))) {
                      setTimeout(() => handleAutoFillFromSpotify(pasted), 120);
                    }
                  }}
                  onBlur={() => {
                    if (episodeForm.spotify_url && !episodeForm.title) {
                      handleAutoFillFromSpotify();
                    }
                  }}
                  placeholder="Ej. https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5 o enlace"
                  className="pr-10 text-xs font-mono"
                />
                {episodeForm.spotify_url && (
                  <button
                    type="button"
                    onClick={() =>
                      setEpisodeForm((prev) => ({
                        ...prev,
                        spotify_url: "",
                      }))
                    }
                    className="absolute right-2.5 top-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground"
                    title="Borrar enlace de Spotify"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Status Verification & Live Preview */}
              {episodeForm.spotify_url ? (
                parseSpotifyUrl(episodeForm.spotify_url) ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        ✓ Enlace de Spotify verificado:{" "}
                        <strong>No necesitas subir ningún archivo de audio</strong>. El reproductor
                        oficial se ejecutará dentro de la página web automáticamente.
                      </span>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-background/90 p-3">
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
                        Vista previa interactiva del reproductor dentro del sitio:
                      </span>
                      <SpotifyEmbedPlayer
                        spotifyUrl={episodeForm.spotify_url}
                        title={episodeForm.title || "Vista previa de Spotify"}
                        compact={false}
                        allowExpand={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                    Formato no reconocido. Asegúrate de incluir un enlace de Spotify válido (ej.
                    https://open.spotify.com/episode/...).
                  </div>
                )
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  💡 <strong>Ventaja:</strong> Al usar Spotify, ahorras espacio de almacenamiento y
                  los oyentes pueden escuchar y ver el contenido directamente aquí en la web.
                </p>
              )}
            </div>
          </div>

          {/* Episode creation guidance banner when unsaved */}
          {!episodeForm.id && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-foreground sm:col-span-3">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>
                  {episodeForm.spotify_url
                    ? "Paso 1: Guarda el episodio para registrar el enlace de Spotify"
                    : "Paso 1: Guarda el episodio para asignarle un ID en la base de datos"}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {episodeForm.spotify_url
                  ? "Con tu enlace de Spotify verificado, solo haz clic en 'Guardar episodio' para que quede registrado. ¡No requieres subir archivos de audio!"
                  : "El registro del episodio debe existir en public.podcast_episodes antes de poder subir archivos multimedia. Si prefieres usar Spotify, pega el enlace arriba y no necesitarás subir archivos de audio."}
              </p>
              <div className="mt-3">
                <Button type="submit" disabled={isSavingEpisode} size="sm" className="gap-1.5">
                  {isSavingEpisode ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  <span>Guardar episodio</span>
                </Button>
              </div>
            </div>
          )}

          {/* Spotify active notice */}
          {Boolean(episodeForm.spotify_url && parseSpotifyUrl(episodeForm.spotify_url)) && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-5 text-[#1DB954] shrink-0" />
                <span>
                  <strong>Enlace de Spotify verificado:</strong> No necesitas subir ningún archivo
                  de audio ni video. El reproductor incrustado de Spotify permitirá a los oyentes
                  escuchar y ver el contenido directamente aquí en la página web.
                </span>
              </div>
            </div>
          )}

          {/* Media Uploads: Audio MP3, Video MP4 opcional, Portada opcional */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <PodcastMediaUploader
              label="Audio del Episodio (MP3 / WAV / M4A / OGG / WEBM)"
              helperText={
                episodeForm.spotify_url
                  ? "Opcional: ya cuentas con el enlace de Spotify configurado"
                  : "Hasta 200 MB · Detecta duración automáticamente"
              }
              category="audio"
              role="audio"
              podcastId={selectedPodcast.id}
              episodeId={episodeForm.id || undefined}
              currentUrl={episodeForm.audio_url}
              currentStoragePath={episodeForm.audio_storage_path}
              currentMimeType={episodeForm.audio_mime_type}
              currentSizeBytes={episodeForm.audio_size_bytes}
              disabled={!episodeForm.id}
              disabledMessage="Guarda el episodio primero para habilitar la subida de audio."
              onUploaded={(res) => {
                setEpisodeForm((prev) => ({
                  ...prev,
                  audio_url: res.publicUrl,
                  audio_storage_path: res.storagePath,
                  audio_mime_type: res.mimeType,
                  audio_size_bytes: res.sizeBytes,
                  duration_seconds:
                    res.durationSeconds > 0 ? res.durationSeconds : prev.duration_seconds,
                }));
                invalidateAllPodcastQueries();
                toast.success("Audio subido y asociado al episodio con éxito.");
              }}
              onDelete={async () => {
                if (episodeForm.id) {
                  await removeEpisodeMediaFile({
                    episodeId: episodeForm.id,
                    podcastId: selectedPodcast.id,
                    role: "audio",
                    storagePath: episodeForm.audio_storage_path,
                  });
                  await invalidateAllPodcastQueries();
                }
                setEpisodeForm((prev) => ({
                  ...prev,
                  audio_url: "",
                  audio_storage_path: null,
                  audio_mime_type: null,
                  audio_size_bytes: null,
                }));
                toast.success("Audio eliminado del episodio y de Storage.");
              }}
            />

            <PodcastMediaUploader
              label="Video Opcional (MP4 / WebM / OGG)"
              helperText="Hasta 500 MB · Compatible con reproductor híbrido"
              category="video"
              role="video"
              podcastId={selectedPodcast.id}
              episodeId={episodeForm.id || undefined}
              currentUrl={episodeForm.video_url}
              currentStoragePath={episodeForm.video_storage_path}
              currentMimeType={episodeForm.video_mime_type}
              currentSizeBytes={episodeForm.video_size_bytes}
              disabled={!episodeForm.id}
              disabledMessage="Guarda el episodio primero para habilitar la subida de video."
              onUploaded={(res) => {
                setEpisodeForm((prev) => ({
                  ...prev,
                  video_url: res.publicUrl,
                  video_storage_path: res.storagePath,
                  video_mime_type: res.mimeType,
                  video_size_bytes: res.sizeBytes,
                  duration_seconds:
                    prev.duration_seconds === 0 && res.durationSeconds > 0
                      ? res.durationSeconds
                      : prev.duration_seconds,
                }));
                invalidateAllPodcastQueries();
                toast.success("Video subido y asociado al episodio con éxito.");
              }}
              onDelete={async () => {
                if (episodeForm.id) {
                  await removeEpisodeMediaFile({
                    episodeId: episodeForm.id,
                    podcastId: selectedPodcast.id,
                    role: "video",
                    storagePath: episodeForm.video_storage_path,
                  });
                  await invalidateAllPodcastQueries();
                }
                setEpisodeForm((prev) => ({
                  ...prev,
                  video_url: "",
                  video_storage_path: null,
                  video_mime_type: null,
                  video_size_bytes: null,
                }));
                toast.success("Video eliminado del episodio y de Storage.");
              }}
            />

            <PodcastImageUploader
              type="cover"
              label="Portada del Episodio (Cover 1:1)"
              helperText="Opcional: Si se omite, se usa automáticamente la portada general del podcast."
              podcastId={selectedPodcast.id}
              episodeId={episodeForm.id || undefined}
              currentUrl={episodeForm.cover_url}
              currentStoragePath={episodeForm.cover_storage_path}
              disabled={!episodeForm.id}
              disabledMessage="Paso 1: Guarda primero los datos básicos del episodio para habilitar la subida de portada a Storage."
              onChange={({ url, storagePath }) => {
                setEpisodeForm((prev) => ({
                  ...prev,
                  cover_url: url,
                  cover_storage_path: storagePath || (url ? prev.cover_storage_path : null),
                }));
                invalidateAllPodcastQueries();
              }}
              onDelete={async () => {
                if (episodeForm.id) {
                  await removeEpisodeMediaFile({
                    episodeId: episodeForm.id,
                    podcastId: selectedPodcast.id,
                    role: "cover",
                    storagePath: episodeForm.cover_storage_path,
                  });
                  await invalidateAllPodcastQueries();
                }
                setEpisodeForm((prev) => ({
                  ...prev,
                  cover_url: "",
                  cover_storage_path: null,
                }));
                toast.success("Portada del episodio eliminada.");
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setView("episodes_manager")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSavingEpisode} className="gap-1.5">
              {isSavingEpisode ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span>{episodeForm.id ? "Guardar cambios del episodio" : "Crear episodio"}</span>
            </Button>
          </div>
        </form>
      )}

      {/* VIEW 5: TRANSCRIPT STUDIO (GENERATE -> PROCESSING -> PREVIEW -> REVIEW -> EDIT -> SAVE -> PUBLISH) */}
      {view === "transcript_studio" && selectedEpisode && (
        <section className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setView("episodes_manager")}
                className="gap-1"
              >
                <ArrowLeft className="size-4" />
                <span>Episodios</span>
              </Button>
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Estudio de Transcripción — {selectedEpisode.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Flujo editorial: Subida → Generar transcripción → Procesando → Vista previa →
                  Revisión → Edición → Guardar → Publicar
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isGeneratingTranscript}
                onClick={handleGenerateAutomaticTranscript}
                className="gap-1.5"
              >
                {isGeneratingTranscript ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Sparkles className="size-4 text-primary" />
                )}
                <span>
                  {isGeneratingTranscript ? "Procesando transcripción..." : "Generar transcripción"}
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSavingTranscript || isGeneratingTranscript}
                onClick={() => void handleSaveTranscriptReview(false)}
                className="gap-1.5"
              >
                <Save className="size-4" />
                <span>Guardar revisión (Sin publicar)</span>
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isSavingTranscript || isGeneratingTranscript}
                onClick={() => void handleSaveTranscriptReview(true)}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                <span>Publicar transcripción</span>
              </Button>
            </div>
          </div>

          {/* Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-4 py-2.5 text-xs">
            <div>
              Estado actual de la transcripción:{" "}
              <strong className="text-foreground">
                {TRANSCRIPT_STATUS_LABELS[transcriptStatus] || transcriptStatus}
              </strong>
            </div>
            <div className="text-muted-foreground">
              Segmentos con marca de tiempo: {transcriptSegments.length}
            </div>
          </div>

          {/* Segment Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Segmentos sincronizados (Timestamps + Locutor + Texto)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTranscriptSegment}
                className="gap-1 text-xs"
              >
                <Plus className="size-3.5" />
                <span>Agregar segmento</span>
              </Button>
            </div>

            {transcriptSegments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  No hay segmentos generados todavía
                </p>
                <p className="text-xs text-muted-foreground">
                  Haz clic en <strong>"Generar transcripción"</strong> para producir automáticamente
                  los segmentos con marcas de tiempo o agrégalos manualmente.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {transcriptSegments.map((seg, idx) => (
                  <div
                    key={seg.id}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-[90px_90px_150px_1fr_auto] sm:items-start"
                  >
                    <div>
                      <label className="block text-[10px] text-muted-foreground">
                        Inicio (seg / MM:SS)
                      </label>
                      <Input
                        value={formatDurationTimestamp(seg.startTime)}
                        onChange={(e) =>
                          updateSegmentField(
                            idx,
                            "startTime",
                            parseTimestampToSeconds(e.target.value),
                          )
                        }
                        className="h-8 font-mono text-xs tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted-foreground">
                        Fin (seg / MM:SS)
                      </label>
                      <Input
                        value={formatDurationTimestamp(seg.endTime)}
                        onChange={(e) =>
                          updateSegmentField(
                            idx,
                            "endTime",
                            parseTimestampToSeconds(e.target.value),
                          )
                        }
                        className="h-8 font-mono text-xs tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted-foreground">
                        Locutor / Speaker
                      </label>
                      <Input
                        value={seg.speaker || ""}
                        onChange={(e) => updateSegmentField(idx, "speaker", e.target.value)}
                        placeholder="Locutor"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted-foreground">
                        Texto del segmento
                      </label>
                      <Textarea
                        rows={2}
                        value={seg.text}
                        onChange={(e) => updateSegmentField(idx, "text", e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTranscriptSegment(idx)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Eliminar segmento"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Preview before Publishing */}
          {transcriptSegments.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Eye className="size-4 text-primary" />
                <span>Vista previa interactiva del reproductor de transcripción</span>
              </h3>
              <TranscriptPlayer
                transcript={{
                  id: `preview_${selectedEpisode.id}`,
                  episode_id: selectedEpisode.id,
                  language: transcriptLanguage,
                  full_text: transcriptFullText,
                  segments: transcriptSegments,
                  status: "review_ready",
                  provider: "gemini-3.5-transcribe",
                  generated_at: new Date().toISOString(),
                  reviewed_at: new Date().toISOString(),
                  published_at: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }}
                episode={selectedEpisode}
                podcast={selectedPodcast}
                compact
              />
            </div>
          )}
        </section>
      )}

      {/* VIEW 6: PODCAST ANALYTICS (REAL METRICS & PER-EPISODE BREAKDOWN) */}
      {view === "analytics_dashboard" && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setView(selectedPodcastId ? "episodes_manager" : "podcasts_list")}
                className="gap-1"
              >
                <ArrowLeft className="size-4" />
                <span>Volver</span>
              </Button>
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Podcast Analytics —{" "}
                  {selectedPodcast ? selectedPodcast.name : "Todos los Podcasts"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Métricas reales calculadas desde <code>public.podcast_analytics_events</code>{" "}
                  (cero datos simulados).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPodcastId || "all"}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPodcastId(val === "all" ? null : val);
                  setAnalyticsEpisodeFilter(null);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="all">Todos los podcasts</option>
                {podcasts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetchAnalytics()}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="size-3.5" />
                <span>Refrescar</span>
              </Button>
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Consultando métricas reales de escucha...
            </div>
          ) : (
            <>
              {/* Top-level Real KPIs */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="block text-xs text-muted-foreground">
                    Reproducciones (Inicios)
                  </span>
                  <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-foreground">
                    {analyticsSummary?.totalPlays ?? 0}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="block text-xs text-muted-foreground">Oyentes únicos</span>
                  <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-foreground">
                    {analyticsSummary?.uniqueListeners ?? 0}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="block text-xs text-muted-foreground">Tiempo escuchado</span>
                  <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-foreground">
                    {formatDurationTimestamp(analyticsSummary?.totalListenedSeconds ?? 0)}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="block text-xs text-muted-foreground">% Completado prom.</span>
                  <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-foreground">
                    {analyticsSummary?.avgCompletionPercent ?? 0}%
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="block text-xs text-muted-foreground">Finalizaciones</span>
                  <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-foreground">
                    {analyticsSummary?.completionsCount ?? 0} (
                    {analyticsSummary?.completionRatePercent ?? 0}%)
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="block text-xs text-muted-foreground">
                    Pausas / Saltos Transcripción
                  </span>
                  <span className="mt-1 block font-mono text-2xl font-bold tabular-nums text-foreground">
                    {analyticsSummary?.pausesCount ?? 0} /{" "}
                    {analyticsSummary?.transcriptClicksCount ?? 0}
                  </span>
                </div>
              </div>

              {/* Device & Language Breakdown */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    Escuchas por Dispositivo
                  </h3>
                  {(analyticsSummary?.byDevice || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Sin eventos de reproducción registrados aún.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {analyticsSummary?.byDevice.map((d) => (
                        <div key={d.device} className="flex items-center justify-between text-xs">
                          <span className="capitalize text-foreground">{d.device}</span>
                          <span className="font-mono tabular-nums text-muted-foreground">
                            {d.count} ({d.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="font-heading text-sm font-semibold text-foreground">
                    Escuchas por Idioma
                  </h3>
                  {(analyticsSummary?.byLanguage || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Sin eventos de reproducción registrados aún.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {analyticsSummary?.byLanguage.map((l) => (
                        <div key={l.language} className="flex items-center justify-between text-xs">
                          <span className="uppercase text-foreground">
                            {LANGUAGE_LABELS[l.language] || l.language}
                          </span>
                          <span className="font-mono tabular-nums text-muted-foreground">
                            {l.count} ({l.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Per-Episode Individual Metrics Table */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      Métricas individuales por episodio
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Incluye reproducciones, oyentes únicos, duración escuchada, porcentaje
                      completado e hitos de retención (25%, 50%, 75%, 100%).
                    </p>
                  </div>
                  {analyticsEpisodeFilter && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnalyticsEpisodeFilter(null)}
                      className="text-xs"
                    >
                      Mostrar todos los episodios
                    </Button>
                  )}
                </div>

                {(analyticsSummary?.episodes || []).length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No hay episodios registrados para mostrar métricas individuales.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="pb-2.5 pr-4 font-semibold">Episodio</th>
                          <th className="pb-2.5 px-3 font-semibold text-right">Inicios</th>
                          <th className="pb-2.5 px-3 font-semibold text-right">Oyentes</th>
                          <th className="pb-2.5 px-3 font-semibold text-right">Tiempo escuchado</th>
                          <th className="pb-2.5 px-3 font-semibold text-right">Prom. escuchado</th>
                          <th className="pb-2.5 px-3 font-semibold text-right">% Completado</th>
                          <th className="pb-2.5 px-3 font-semibold text-right">
                            Retención 25/50/75/100%
                          </th>
                          <th className="pb-2.5 pl-3 font-semibold text-right">Pausas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                        {(analyticsSummary?.episodes || [])
                          .filter(
                            (ep) =>
                              !analyticsEpisodeFilter || ep.episodeId === analyticsEpisodeFilter,
                          )
                          .map((ep) => (
                            <tr key={ep.episodeId} className="hover:bg-muted/30">
                              <td className="py-3 pr-4 font-sans">
                                <span className="font-semibold text-foreground block">
                                  T{ep.seasonNumber} E{ep.episodeNumber} — {ep.title}
                                </span>
                                {ep.lastPlayedAt && (
                                  <span className="text-[11px] text-muted-foreground">
                                    Última escucha:{" "}
                                    {new Date(ep.lastPlayedAt).toLocaleString("es-US")}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-foreground">
                                {ep.totalPlays}
                              </td>
                              <td className="py-3 px-3 text-right">{ep.uniqueListeners}</td>
                              <td className="py-3 px-3 text-right">
                                {formatDurationTimestamp(ep.totalListenedSeconds)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {formatDurationTimestamp(ep.avgListenedSeconds)}
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-primary">
                                {ep.avgCompletionPercent}%
                              </td>
                              <td className="py-3 px-3 text-right text-muted-foreground">
                                {ep.milestone25Count} / {ep.milestone50Count} /{" "}
                                {ep.milestone75Count} / {ep.milestone100Count}
                              </td>
                              <td className="py-3 pl-3 text-right">{ep.pausesCount}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
