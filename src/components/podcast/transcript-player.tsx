import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlignLeft, Clock, Play, Search, Volume2 } from "lucide-react";
import {
  formatDurationTimestamp,
  type PodcastEpisodeRow,
  type PodcastRow,
  type PodcastTranscriptRow,
  type TranscriptSegment,
} from "@/lib/podcasts";
import { usePodcastPlayer } from "@/lib/podcast-player-context";
import { Input } from "@/components/ui/input";

interface TranscriptPlayerProps {
  transcript: PodcastTranscriptRow;
  episode: PodcastEpisodeRow;
  podcast?: PodcastRow | null;
  compact?: boolean;
  className?: string;
}

export function hasReliableSegmentTimestamps(segments: TranscriptSegment[]): boolean {
  if (!Array.isArray(segments) || segments.length === 0) return false;
  return segments.some(
    (s) =>
      typeof s.startTime === "number" &&
      Number.isFinite(s.startTime) &&
      s.startTime >= 0 &&
      typeof s.endTime === "number" &&
      s.endTime > s.startTime,
  );
}

export function findActiveTranscriptSegmentId(
  segments: TranscriptSegment[],
  currentTimeSeconds: number,
): string | null {
  if (!hasReliableSegmentTimestamps(segments)) return null;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    const end =
      seg.endTime > seg.startTime ? seg.endTime : nextSeg ? nextSeg.startTime : seg.startTime + 10;
    if (currentTimeSeconds >= seg.startTime && currentTimeSeconds < end) {
      return seg.id;
    }
  }
  return null;
}

export function TranscriptPlayer({
  transcript,
  episode,
  podcast,
  compact = false,
  className = "",
}: TranscriptPlayerProps) {
  const { currentEpisode, isPlaying, currentTime, playEpisode, seekTo, resume } =
    usePodcastPlayer();

  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const activeSegmentRef = useRef<HTMLButtonElement | null>(null);

  const isCurrentEpisode = currentEpisode?.id === episode.id;
  const reliableTimestamps = useMemo(
    () => hasReliableSegmentTimestamps(transcript.segments),
    [transcript.segments],
  );

  const activeSegmentId = useMemo(() => {
    if (!isCurrentEpisode || !reliableTimestamps) return null;
    return findActiveTranscriptSegmentId(transcript.segments, currentTime);
  }, [currentTime, isCurrentEpisode, reliableTimestamps, transcript.segments]);

  useEffect(() => {
    if (
      autoScroll &&
      isCurrentEpisode &&
      isPlaying &&
      activeSegmentId &&
      activeSegmentRef.current
    ) {
      try {
        activeSegmentRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      } catch {
        // ignore scrollIntoView errors in headless browsers
      }
    }
  }, [activeSegmentId, autoScroll, isCurrentEpisode, isPlaying]);

  const filteredSegments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transcript.segments;
    return transcript.segments.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        (s.speaker && s.speaker.toLowerCase().includes(q)) ||
        formatDurationTimestamp(s.startTime).includes(q),
    );
  }, [searchQuery, transcript.segments]);

  const handleSegmentClick = (seg: TranscriptSegment) => {
    if (!reliableTimestamps) return;
    if (!isCurrentEpisode) {
      playEpisode(episode, podcast, {
        transcript,
        startTime: seg.startTime,
      });
    } else {
      seekTo(seg.startTime, true);
      if (!isPlaying) {
        resume();
      }
    }
  };

  return (
    <section
      aria-label="Transcripción del episodio"
      className={`rounded-xl border border-border bg-card ${compact ? "p-4" : "p-5 sm:p-6"} ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-2.5">
          <AlignLeft className="size-5 text-primary shrink-0" />
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">Transcripción</h3>
            <p className="text-xs text-muted-foreground">
              {reliableTimestamps
                ? "Haz clic en cualquier segmento para saltar a ese momento del audio"
                : "Texto completo revisado del episodio"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reliableTimestamps && (
            <button
              type="button"
              onClick={() => setAutoScroll((prev) => !prev)}
              className={`min-h-9 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                autoScroll
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Auto-seguimiento: {autoScroll ? "Activo" : "Pausado"}
            </button>
          )}
          <div className="relative w-48 sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en transcripción..."
              className="h-9 pl-8 text-xs"
            />
          </div>
        </div>
      </div>

      {reliableTimestamps && transcript.segments.length > 0 ? (
        <div
          className={`mt-4 space-y-1.5 overflow-y-auto pr-1 ${
            compact ? "max-h-64" : "max-h-[420px]"
          }`}
        >
          {filteredSegments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No se encontraron segmentos que coincidan con "{searchQuery}".
            </p>
          ) : (
            filteredSegments.map((seg) => {
              const isActive = activeSegmentId === seg.id;
              return (
                <button
                  key={seg.id}
                  ref={isActive ? activeSegmentRef : null}
                  type="button"
                  onClick={() => handleSegmentClick(seg)}
                  className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                    isActive
                      ? "bg-primary/12 text-foreground ring-1 ring-primary/30"
                      : "hover:bg-muted/70 text-foreground/90"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums ${
                      isActive
                        ? "font-semibold text-primary"
                        : "text-muted-foreground group-hover:text-primary"
                    }`}
                  >
                    {isActive && isPlaying ? (
                      <Volume2 className="size-3.5 animate-pulse text-primary" />
                    ) : (
                      <Clock className="size-3 opacity-70 group-hover:hidden" />
                    )}
                    {!isActive && (
                      <Play className="hidden size-3 text-primary group-hover:inline" />
                    )}
                    {formatDurationTimestamp(seg.startTime)}
                  </span>

                  <div className="min-w-0 flex-1 text-sm leading-relaxed">
                    {seg.speaker && (
                      <span className="mr-1.5 font-semibold text-foreground">{seg.speaker} —</span>
                    )}
                    <span
                      className={isActive ? "font-medium text-foreground" : "text-foreground/85"}
                    >
                      {seg.text}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {transcript.full_text || "No hay texto de transcripción disponible."}
        </div>
      )}
    </section>
  );
}
