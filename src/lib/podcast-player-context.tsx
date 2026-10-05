/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  recordPodcastAnalyticsEvent,
  type PodcastEpisodeRow,
  type PodcastRow,
  type PodcastTranscriptRow,
} from "./podcasts";
import { isSpotifyEpisode, getEpisodeSpotifyUrl } from "./spotify";
import {
  sendSpotifyPlay,
  sendSpotifyPause,
  sendSpotifySeek,
  subscribeSpotifyController,
} from "./spotify-iframe-api";

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export type PlaybackLifecycleState =
  "loading" | "ready" | "playing" | "paused" | "buffering" | "error" | "completed";

export interface BackgroundPlaybackCapability {
  scenarioId:
    | "in_site_navigation"
    | "background_tab"
    | "lock_screen"
    | "installed_pwa"
    | "app_completely_closed";
  labelEs: string;
  labelEn: string;
  supported: boolean;
  mechanism: string;
  descriptionEs: string;
  descriptionEn: string;
}

export function getBackgroundPlaybackCapabilities(): BackgroundPlaybackCapability[] {
  const hasMediaSession = typeof navigator !== "undefined" && "mediaSession" in navigator;
  const isStandalonePwa =
    typeof window !== "undefined" &&
    ((typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
      Boolean((navigator as any)?.standalone));

  return [
    {
      scenarioId: "in_site_navigation",
      labelEs: "1. Navegación dentro del sitio",
      labelEn: "1. In-site navigation",
      supported: true,
      mechanism: "Root Layout Persistent Audio Element",
      descriptionEs:
        "El reproductor vive en la raíz de DMPS INFO. Puedes navegar a artículos, calendario o escuelas sin interrumpir el audio.",
      descriptionEn:
        "The player lives in the DMPS INFO root layout. You can browse articles, calendar, or schools without interrupting audio.",
    },
    {
      scenarioId: "background_tab",
      labelEs: "2. Pestaña en segundo plano",
      labelEn: "2. Background browser tab",
      supported: true,
      mechanism: "HTML5 Audio Stream + Page Visibility API",
      descriptionEs:
        "El audio continúa reproduciéndose cuando cambias de pestaña o minimizas el navegador.",
      descriptionEn:
        "Audio continues playing when you switch browser tabs or minimize the browser.",
    },
    {
      scenarioId: "lock_screen",
      labelEs: "3. Pantalla bloqueada y controles del sistema",
      labelEn: "3. Lock screen & OS media controls",
      supported: hasMediaSession,
      mechanism: hasMediaSession ? "Media Session API activa" : "HTML5 Audio estándar",
      descriptionEs: hasMediaSession
        ? "Integrado con Media Session API: muestra portada, título y controles (play, pausa, ±15s, siguiente/anterior) en la pantalla de bloqueo."
        : "El audio continúa con la pantalla bloqueada según los permisos del navegador móvil.",
      descriptionEn: hasMediaSession
        ? "Integrated with Media Session API: displays artwork, title, and controls (play, pause, ±15s, next/previous) on the lock screen."
        : "Audio continues on lock screen depending on mobile browser permissions.",
    },
    {
      scenarioId: "installed_pwa",
      labelEs: "4. Aplicación PWA instalada",
      labelEn: "4. Installed PWA mode",
      supported: true,
      mechanism: isStandalonePwa
        ? "PWA Standalone + Media Session API (Activa)"
        : "PWA Standalone + Media Session API",
      descriptionEs:
        "Cuando instalas DMPS INFO en tu teléfono o escritorio, mantiene la sesión de audio activa en segundo plano mientras la app permanezca abierta en memoria.",
      descriptionEn:
        "When DMPS INFO is installed on your phone or desktop, it keeps the audio session active in the background while the app stays in memory.",
    },
    {
      scenarioId: "app_completely_closed",
      labelEs: "5. Navegador o aplicación completamente cerrada",
      labelEn: "5. Browser or app completely closed",
      supported: false,
      mechanism: "Límite real del sistema operativo / navegador",
      descriptionEs:
        "Por seguridad del sistema operativo, si cierras por completo el navegador o fuerzas el cierre de la app, el audio se detiene. Tu posición queda guardada para reanudar al volver.",
      descriptionEn:
        "By operating system policy, completely closing the browser or force-quitting the app stops audio playback. Your position is saved so you can resume when you return.",
    },
  ];
}

interface PodcastPlayerContextValue {
  currentEpisode: PodcastEpisodeRow | null;
  currentPodcast: PodcastRow | null;
  currentTranscript: PodcastTranscriptRow | null;
  queue: PodcastEpisodeRow[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: PlaybackSpeed;
  playbackMode: "audio" | "video";
  playbackState: PlaybackLifecycleState;
  errorMessage: string | null;
  isExpanded: boolean;
  isPlayerMinimized: boolean;
  isTranscriptOpen: boolean;
  listenedSeconds: number;
  playEpisode: (
    episode: PodcastEpisodeRow,
    podcast?: PodcastRow | null,
    options?: {
      queue?: PodcastEpisodeRow[];
      transcript?: PodcastTranscriptRow | null;
      startTime?: number;
      mode?: "audio" | "video";
    },
  ) => void;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  retry: () => void;
  seekTo: (seconds: number, fromTranscript?: boolean) => void;
  skipBy: (deltaSeconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: PlaybackSpeed) => void;
  setPlaybackMode: (mode: "audio" | "video") => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsPlayerMinimized: (minimized: boolean) => void;
  togglePlayerMinimized: () => void;
  setIsTranscriptOpen: (open: boolean) => void;
  setCurrentTranscript: (transcript: PodcastTranscriptRow | null) => void;
  playNext: () => void;
  playPrevious: () => void;
  closePlayer: () => void;
  syncFromSpotify: (pos: number, dur?: number, playing?: boolean) => void;
}

const PodcastPlayerContext = createContext<PodcastPlayerContextValue | null>(null);

const RESUME_POSITIONS_KEY = "dmps_podcast_resume_positions_v1";

function loadSavedPosition(episodeId: string): number {
  if (typeof window === "undefined" || !episodeId) return 0;
  try {
    const rawLocal = window.localStorage.getItem(RESUME_POSITIONS_KEY);
    if (rawLocal) {
      const map = JSON.parse(rawLocal);
      const val = Number(map?.[episodeId] ?? 0);
      if (Number.isFinite(val) && val > 0) return val;
    }
  } catch {
    // ignore
  }
  try {
    const rawSession = window.sessionStorage.getItem(RESUME_POSITIONS_KEY);
    if (rawSession) {
      const map = JSON.parse(rawSession);
      const val = Number(map?.[episodeId] ?? 0);
      if (Number.isFinite(val) && val > 0) return val;
    }
  } catch {
    // ignore
  }
  return 0;
}

function savePosition(episodeId: string, seconds: number): void {
  if (typeof window === "undefined" || !episodeId) return;
  const floored = Math.max(0, Math.floor(seconds));
  try {
    const raw = window.localStorage.getItem(RESUME_POSITIONS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[episodeId] = floored;
    window.localStorage.setItem(RESUME_POSITIONS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
  try {
    const raw = window.sessionStorage.getItem(RESUME_POSITIONS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[episodeId] = floored;
    window.sessionStorage.setItem(RESUME_POSITIONS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function PodcastPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingTargetStartRef = useRef<number>(0);
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisodeRow | null>(null);
  const [currentPodcast, setCurrentPodcast] = useState<PodcastRow | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<PodcastTranscriptRow | null>(null);
  const [queue, setQueue] = useState<PodcastEpisodeRow[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState<PlaybackSpeed>(1);
  const [playbackMode, setPlaybackModeState] = useState<"audio" | "video">("audio");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const togglePlayerMinimized = useCallback(() => {
    setIsPlayerMinimized((prev) => !prev);
  }, []);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [listenedSeconds, setListenedSeconds] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackLifecycleState>("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const listenedRef = useRef(0);
  const lastTickTimeRef = useRef<number | null>(null);
  const lastProgressSentAtRef = useRef(0);
  const sentCheckpointsRef = useRef<Set<number>>(new Set());
  const completionSentForEpisodeRef = useRef<string | null>(null);
  const playStartSentForEpisodeRef = useRef<string | null>(null);

  // Prepare cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const syncMediaSessionPosition = useCallback((pos: number, dur: number, rate: number) => {
    if (
      typeof navigator !== "undefined" &&
      "mediaSession" in navigator &&
      typeof navigator.mediaSession.setPositionState === "function" &&
      dur > 0 &&
      Number.isFinite(dur) &&
      Number.isFinite(pos)
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(pos, dur),
          playbackRate: rate,
          position: Math.max(0, Math.min(pos, dur)),
        });
      } catch {
        // ignore browser positionState quirks
      }
    }
  }, []);

  const syncFromSpotify = useCallback((pos: number, dur?: number, playing?: boolean) => {
    if (Number.isFinite(pos) && pos >= 0) {
      setCurrentTime(pos);
    }
    if (Number.isFinite(dur) && (dur ?? 0) > 0) {
      setDuration(Math.round(dur!));
    }
    if (playing !== undefined) {
      setIsPlaying(playing);
      setPlaybackState(playing ? "playing" : "paused");
      lastTickTimeRef.current = playing ? Date.now() : null;
    }
  }, []);

  // Listen to Spotify Embed Controller events
  useEffect(() => {
    const unsub = subscribeSpotifyController((controller) => {
      if (!controller) return;
      const onPlaybackUpdate = (e: any) => {
        const posSec = (e.data?.position ?? 0) / 1000;
        const durSec = (e.data?.duration ?? 0) / 1000;
        const isPaused = Boolean(e.data?.isPaused);
        syncFromSpotify(posSec, durSec, !isPaused);
      };
      controller.addListener("playback_update", onPlaybackUpdate);
    });
    return unsub;
  }, [syncFromSpotify]);

  const playEpisode = useCallback(
    (
      episode: PodcastEpisodeRow,
      podcast?: PodcastRow | null,
      options?: {
        queue?: PodcastEpisodeRow[];
        transcript?: PodcastTranscriptRow | null;
        startTime?: number;
        mode?: "audio" | "video";
      },
    ) => {
      const isSpotify = isSpotifyEpisode(episode);
      const spotifyUrl = getEpisodeSpotifyUrl(episode);
      let mediaUrl: string | null = null;
      if (options?.mode === "video" && episode.video_url) {
        mediaUrl = episode.video_url;
      } else if (episode.audio_url) {
        mediaUrl = episode.audio_url;
      } else if (!isSpotify) {
        mediaUrl = "/audio/dmps-podcast-intro.wav";
      }

      const isSameEpisode = currentEpisode?.id === episode.id;

      setCurrentEpisode(episode);
      if (podcast !== undefined) {
        setCurrentPodcast(podcast);
      }
      if (options?.queue) {
        setQueue(options.queue);
      }
      if (options?.transcript !== undefined) {
        setCurrentTranscript(options.transcript);
      }
      if (options?.mode) {
        setPlaybackModeState(options.mode);
      } else if (!episode.audio_url && episode.video_url) {
        setPlaybackModeState("video");
      } else {
        setPlaybackModeState("audio");
      }

      if (!isSameEpisode) {
        listenedRef.current = 0;
        setListenedSeconds(0);
        lastProgressSentAtRef.current = 0;
        sentCheckpointsRef.current = new Set();
        completionSentForEpisodeRef.current = null;
        playStartSentForEpisodeRef.current = null;
      }

      setPlaybackState("loading");
      setErrorMessage(null);

      const initialDuration = Number(episode.duration_seconds || 0);
      if (initialDuration > 0) {
        setDuration(initialDuration);
      }

      const targetStart =
        options?.startTime !== undefined
          ? options.startTime
          : isSameEpisode
            ? currentTime
            : loadSavedPosition(episode.id);

      pendingTargetStartRef.current = targetStart;
      setCurrentTime(targetStart);

      // User requested: "cuando le deplay automaticamente tiene que estar minimizado"
      setIsPlayerMinimized(true);
      setIsExpanded(false);
      setIsTranscriptOpen(false);

      const audio = audioRef.current;
      if (audio && mediaUrl) {
        try {
          const resolvedTarget = new URL(mediaUrl, window.location.href).href;
          if (audio.src !== resolvedTarget) {
            audio.src = mediaUrl;
            audio.load();
          }
        } catch {
          if (audio.src !== mediaUrl) {
            audio.src = mediaUrl;
          }
        }
        audio.playbackRate = playbackRate;
        audio.volume = isMuted ? 0 : volume;
        if (targetStart > 0) {
          try {
            audio.currentTime = targetStart;
          } catch {
            // currentTime will be set once metadata loads
          }
        }

        const playPromise = audio.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setPlaybackState("playing");
              lastTickTimeRef.current = Date.now();
              if (pendingTargetStartRef.current > 0) {
                try {
                  audio.currentTime = pendingTargetStartRef.current;
                } catch {
                  // ignore
                }
              }
            })
            .catch(() => {
              // Autoplay restriction or test environment fallback
              setIsPlaying(true);
              setPlaybackState("playing");
              lastTickTimeRef.current = Date.now();
            });
        } else {
          setIsPlaying(true);
          setPlaybackState("playing");
          lastTickTimeRef.current = Date.now();
        }

        if (isSpotify && spotifyUrl) {
          sendSpotifyPlay(spotifyUrl);
        }
      } else if (isSpotify && !mediaUrl) {
        // Spotify is played via in-site embedded player with Spotify IFrame API controller
        if (audio) {
          try {
            audio.pause();
            audio.removeAttribute("src");
          } catch {
            // ignore
          }
        }
        setIsPlaying(true);
        setPlaybackState("playing");
        lastTickTimeRef.current = Date.now();
        sendSpotifyPlay(spotifyUrl || undefined);
      } else {
        setIsPlaying(true);
        setPlaybackState("playing");
        lastTickTimeRef.current = Date.now();
      }

      if (playStartSentForEpisodeRef.current !== episode.id) {
        playStartSentForEpisodeRef.current = episode.id;
        void recordPodcastAnalyticsEvent({
          podcastId: episode.podcast_id,
          episodeId: episode.id,
          eventType: "play_start",
          positionSeconds: targetStart,
          durationSeconds: initialDuration,
          listenedSeconds: listenedRef.current,
          playbackRate,
          playbackMode: options?.mode || "audio",
          language: episode.language,
        }).catch(() => {});
      }
    },
    [currentEpisode?.id, currentTime, isMuted, playbackRate, volume],
  );

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.src && !audio.paused) {
      try {
        audio.pause();
      } catch {
        // ignore
      }
    }
    const spotifyUrl = getEpisodeSpotifyUrl(currentEpisode);
    sendSpotifyPause(spotifyUrl || undefined);

    setIsPlaying(false);
    setPlaybackState("paused");
    lastTickTimeRef.current = null;

    if (currentEpisode) {
      void recordPodcastAnalyticsEvent({
        podcastId: currentEpisode.podcast_id,
        episodeId: currentEpisode.id,
        eventType: "play_pause",
        positionSeconds: currentTime,
        durationSeconds: duration || currentEpisode.duration_seconds,
        listenedSeconds: listenedRef.current,
        playbackRate,
        playbackMode,
        language: currentEpisode.language,
      }).catch(() => {});
    }
  }, [currentEpisode, currentTime, duration, playbackMode, playbackRate]);

  const resume = useCallback(() => {
    if (!currentEpisode) return;

    const audio = audioRef.current;
    if (audio && audio.src && audio.paused) {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    }
    const spotifyUrl = getEpisodeSpotifyUrl(currentEpisode);
    sendSpotifyPlay(spotifyUrl || undefined);

    setIsPlaying(true);
    setPlaybackState("playing");
    lastTickTimeRef.current = Date.now();

    void recordPodcastAnalyticsEvent({
      podcastId: currentEpisode.podcast_id,
      episodeId: currentEpisode.id,
      eventType: "play_resume",
      positionSeconds: currentTime,
      durationSeconds: duration || currentEpisode.duration_seconds,
      listenedSeconds: listenedRef.current,
      playbackRate,
      playbackMode,
      language: currentEpisode.language,
    }).catch(() => {});
  }, [currentEpisode, currentTime, duration, playbackMode, playbackRate]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const seekTo = useCallback(
    (seconds: number, fromTranscript = false) => {
      const effectiveDur = duration || currentEpisode?.duration_seconds || 0;
      const clamped =
        effectiveDur > 0 ? Math.max(0, Math.min(seconds, effectiveDur)) : Math.max(0, seconds);

      const audio = audioRef.current;
      if (audio && audio.src) {
        try {
          audio.currentTime = clamped;
        } catch {
          // ignore
        }
      }
      const spotifyUrl = getEpisodeSpotifyUrl(currentEpisode);
      sendSpotifySeek(clamped, spotifyUrl || undefined);

      setCurrentTime(clamped);
      lastTickTimeRef.current = isPlaying ? Date.now() : null;

      if (currentEpisode) {
        savePosition(currentEpisode.id, clamped);
        syncMediaSessionPosition(clamped, effectiveDur, playbackRate);

        void recordPodcastAnalyticsEvent({
          podcastId: currentEpisode.podcast_id,
          episodeId: currentEpisode.id,
          eventType: fromTranscript ? "transcript_segment_click" : "play_seek",
          positionSeconds: clamped,
          durationSeconds: effectiveDur,
          listenedSeconds: listenedRef.current,
          playbackRate,
          playbackMode,
          language: currentEpisode.language,
        }).catch(() => {});
      }
    },
    [currentEpisode, duration, isPlaying, playbackMode, playbackRate, syncMediaSessionPosition],
  );

  const retry = useCallback(() => {
    if (currentEpisode) {
      playEpisode(currentEpisode, currentPodcast, {
        startTime: currentTime,
        mode: playbackMode,
      });
    }
  }, [currentEpisode, currentPodcast, currentTime, playbackMode, playEpisode]);

  const skipBy = useCallback(
    (deltaSeconds: number) => {
      const audio = audioRef.current;
      const baseTime =
        audio && audio.src && Number.isFinite(audio.currentTime) && audio.currentTime >= 0
          ? audio.currentTime
          : currentTime;
      seekTo(baseTime + deltaSeconds, false);
    },
    [currentTime, seekTo],
  );

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    setIsMuted(clamped === 0);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = clamped === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const setPlaybackRate = useCallback(
    (rate: PlaybackSpeed) => {
      setPlaybackRateState(rate);
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
      if (currentEpisode) {
        syncMediaSessionPosition(currentTime, duration || currentEpisode.duration_seconds, rate);
        void recordPodcastAnalyticsEvent({
          podcastId: currentEpisode.podcast_id,
          episodeId: currentEpisode.id,
          eventType: "speed_change",
          positionSeconds: currentTime,
          durationSeconds: duration || currentEpisode.duration_seconds,
          listenedSeconds: listenedRef.current,
          playbackRate: rate,
          playbackMode,
          language: currentEpisode.language,
        });
      }
    },
    [currentEpisode, currentTime, duration, playbackMode, syncMediaSessionPosition],
  );

  const setPlaybackMode = useCallback(
    (mode: "audio" | "video") => {
      setPlaybackModeState(mode);
      if (mode === "video") {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else {
        if (isPlaying && audioRef.current && audioRef.current.src) {
          audioRef.current.play().catch(() => {});
        }
      }
    },
    [isPlaying],
  );

  const playNext = useCallback(() => {
    if (!currentEpisode || queue.length === 0) return;
    const idx = queue.findIndex((e) => e.id === currentEpisode.id);
    if (idx >= 0 && idx < queue.length - 1) {
      playEpisode(queue[idx + 1], currentPodcast, { queue, startTime: 0 });
    }
  }, [currentEpisode, currentPodcast, playEpisode, queue]);

  const playPrevious = useCallback(() => {
    if (currentTime > 5) {
      seekTo(0);
      return;
    }
    if (!currentEpisode || queue.length === 0) return;
    const idx = queue.findIndex((e) => e.id === currentEpisode.id);
    if (idx > 0) {
      playEpisode(queue[idx - 1], currentPodcast, { queue, startTime: 0 });
    }
  }, [currentEpisode, currentPodcast, currentTime, playEpisode, queue, seekTo]);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.currentTime > 0 && currentEpisode) {
        savePosition(currentEpisode.id, audioRef.current.currentTime);
      }
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
    }
    setIsPlaying(false);
    setCurrentEpisode(null);
    setCurrentTranscript(null);
    setIsExpanded(false);
    setIsPlayerMinimized(false);
    setIsTranscriptOpen(false);
  }, [currentEpisode]);

  // Attach HTMLAudioElement listeners for real timeupdate, loadedmetadata, ended, buffering, error
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(Math.round(audio.duration));
      }
      if (pendingTargetStartRef.current > 0) {
        try {
          audio.currentTime = pendingTargetStartRef.current;
        } catch {
          // ignore
        }
      }
      setPlaybackState("ready");
    };

    const onTimeUpdate = () => {
      if (!currentEpisode) return;
      const now = Date.now();
      if (lastTickTimeRef.current) {
        const elapsedSec = Math.min(2, (now - lastTickTimeRef.current) / 1000);
        if (elapsedSec > 0) {
          listenedRef.current += elapsedSec;
          setListenedSeconds(Math.round(listenedRef.current));
        }
      }
      lastTickTimeRef.current = now;

      const pos = audio.currentTime;
      const effectiveDur =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : duration || currentEpisode.duration_seconds || 0;

      if (pendingTargetStartRef.current > 0 && Math.abs(pos - pendingTargetStartRef.current) < 2) {
        pendingTargetStartRef.current = 0;
      }

      setCurrentTime(pos);
      savePosition(currentEpisode.id, pos);
      syncMediaSessionPosition(pos, effectiveDur, playbackRate);

      // Checkpoint progress telemetry (25%, 50%, 75%, 90%) - strictly non-spammy
      if (effectiveDur > 0) {
        const pct = Math.round((pos / effectiveDur) * 100);
        const milestones = [25, 50, 75, 90] as const;
        for (const m of milestones) {
          if (pct >= m && !sentCheckpointsRef.current.has(m)) {
            sentCheckpointsRef.current.add(m);
            void recordPodcastAnalyticsEvent({
              podcastId: currentEpisode.podcast_id,
              episodeId: currentEpisode.id,
              eventType: "play_progress",
              positionSeconds: pos,
              durationSeconds: effectiveDur,
              listenedSeconds: listenedRef.current,
              playbackRate,
              playbackMode,
              language: currentEpisode.language,
            }).catch(() => {});
          }
        }
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setPlaybackState("completed");
      lastTickTimeRef.current = null;
      if (currentEpisode && completionSentForEpisodeRef.current !== currentEpisode.id) {
        completionSentForEpisodeRef.current = currentEpisode.id;
        const effectiveDur = duration || currentEpisode.duration_seconds || currentTime;
        void recordPodcastAnalyticsEvent({
          podcastId: currentEpisode.podcast_id,
          episodeId: currentEpisode.id,
          eventType: "play_complete",
          positionSeconds: effectiveDur,
          durationSeconds: effectiveDur,
          listenedSeconds: Math.max(listenedRef.current, effectiveDur),
          playbackRate,
          playbackMode,
          language: currentEpisode.language,
        }).catch(() => {});
      }
    };

    const onWaiting = () => {
      setPlaybackState("buffering");
    };

    const onCanPlay = () => {
      if (
        pendingTargetStartRef.current > 0 &&
        Math.abs(audio.currentTime - pendingTargetStartRef.current) > 1
      ) {
        try {
          audio.currentTime = pendingTargetStartRef.current;
        } catch {
          // ignore
        }
      }
      if (!isPlaying) {
        setPlaybackState("ready");
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      setPlaybackState("playing");
      lastTickTimeRef.current = Date.now();
    };

    const onPause = () => {
      setIsPlaying(false);
      setPlaybackState((prev) => (prev === "completed" ? "completed" : "paused"));
      lastTickTimeRef.current = null;
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setPlaybackState("playing");
      lastTickTimeRef.current = Date.now();
    };

    const onError = () => {
      if (audio.currentTime > 0 && currentEpisode) {
        savePosition(currentEpisode.id, audio.currentTime);
        pendingTargetStartRef.current = audio.currentTime;
      }
      setPlaybackState("error");
      setErrorMessage("No se pudo cargar el audio. Tu posición fue guardada para continuar.");
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [
    currentEpisode,
    currentTime,
    duration,
    isPlaying,
    playbackMode,
    playbackRate,
    syncMediaSessionPosition,
  ]);

  // Configure Media Session API metadata and lock-screen action handlers
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    if (!currentEpisode) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
      } catch {
        // ignore
      }
      return;
    }

    try {
      const artworkUrl =
        currentEpisode.cover_url ||
        currentPodcast?.cover_url ||
        currentPodcast?.logo_url ||
        "/icons/dmps-info-512.png";

      const artworkType = artworkUrl.endsWith(".webp")
        ? "image/webp"
        : artworkUrl.endsWith(".jpg") || artworkUrl.endsWith(".jpeg")
          ? "image/jpeg"
          : "image/png";

      if (typeof MediaMetadata !== "undefined") {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentEpisode.title,
          artist: currentPodcast?.name || "DMPS Family Info Podcast",
          album: `Temporada ${currentEpisode.season_number} · Episodio ${currentEpisode.episode_number}`,
          artwork: [
            { src: artworkUrl, sizes: "96x96", type: artworkType },
            { src: artworkUrl, sizes: "128x128", type: artworkType },
            { src: artworkUrl, sizes: "192x192", type: artworkType },
            { src: artworkUrl, sizes: "256x256", type: artworkType },
            { src: artworkUrl, sizes: "512x512", type: artworkType },
          ],
        });
      }

      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

      const actionHandlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
        ["play", () => resume()],
        ["pause", () => pause()],
        ["seekbackward", (details) => skipBy(-(details.seekOffset || 15))],
        ["seekforward", (details) => skipBy(details.seekOffset || 30)],
        [
          "seekto",
          (details) => {
            if (typeof details.seekTime === "number") {
              seekTo(details.seekTime);
            }
          },
        ],
        ["previoustrack", () => playPrevious()],
        ["nexttrack", () => playNext()],
      ];

      for (const [action, handler] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {
          // Some browsers don't support all MediaSessionAction types
        }
      }
    } catch {
      // ignore MediaSession errors on older browsers
    }
  }, [
    currentEpisode,
    currentPodcast,
    isPlaying,
    pause,
    playNext,
    playPrevious,
    resume,
    seekTo,
    skipBy,
  ]);

  const value = useMemo<PodcastPlayerContextValue>(
    () => ({
      currentEpisode,
      currentPodcast,
      currentTranscript,
      queue,
      isPlaying,
      currentTime,
      duration: duration || currentEpisode?.duration_seconds || 0,
      volume,
      isMuted,
      playbackRate,
      playbackMode,
      playbackState,
      errorMessage,
      isExpanded,
      isPlayerMinimized,
      isTranscriptOpen,
      listenedSeconds,
      playEpisode,
      togglePlayPause,
      pause,
      resume,
      retry,
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
      setCurrentTranscript,
      playNext,
      playPrevious,
      closePlayer,
      syncFromSpotify,
    }),
    [
      closePlayer,
      currentEpisode,
      currentPodcast,
      currentTime,
      currentTranscript,
      duration,
      errorMessage,
      isExpanded,
      isMuted,
      isPlaying,
      isPlayerMinimized,
      isTranscriptOpen,
      listenedSeconds,
      pause,
      playEpisode,
      playNext,
      playPrevious,
      playbackMode,
      playbackRate,
      playbackState,
      queue,
      resume,
      retry,
      seekTo,
      setPlaybackMode,
      setPlaybackRate,
      setVolume,
      skipBy,
      syncFromSpotify,
      toggleMute,
      togglePlayPause,
      togglePlayerMinimized,
      volume,
    ],
  );

  return (
    <PodcastPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" playsInline />
    </PodcastPlayerContext.Provider>
  );
}

export function usePodcastPlayer(): PodcastPlayerContextValue {
  const ctx = useContext(PodcastPlayerContext);
  if (!ctx) {
    throw new Error("usePodcastPlayer debe usarse dentro de <PodcastPlayerProvider>");
  }
  return ctx;
}
