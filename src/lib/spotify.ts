/**
 * Spotify Integration Helper
 * Allows podcasts and episodes to be hosted or embedded directly via Spotify.
 * Users can listen to audio and watch video podcasts inside the DMPS Info website
 * without needing an audio file upload or opening external apps.
 */

export interface ParsedSpotifyMedia {
  type: "episode" | "show" | "track" | "playlist";
  id: string;
  embedUrl: string;
  canonicalUrl: string;
}

export interface SpotifyOEmbedData {
  title?: string;
  thumbnail_url?: string;
  author_name?: string;
  html?: string;
}

/**
 * Checks whether an episode object represents a Spotify episode.
 */
export function isSpotifyEpisode(
  episode:
    | {
        spotify_url?: string | null;
        audio_url?: string | null;
        metadata?: Record<string, unknown> | null;
      }
    | null
    | undefined,
): boolean {
  if (!episode) return false;
  const metaSpotify =
    typeof episode.metadata?.spotify_url === "string"
      ? (episode.metadata.spotify_url as string)
      : null;
  return Boolean(
    isSpotifyUrl(episode.spotify_url) ||
    isSpotifyUrl(episode.audio_url) ||
    (metaSpotify && isSpotifyUrl(metaSpotify)),
  );
}

/**
 * Extracts the canonical or raw Spotify URL from an episode.
 */
export function getEpisodeSpotifyUrl(
  episode:
    | {
        spotify_url?: string | null;
        audio_url?: string | null;
        metadata?: Record<string, unknown> | null;
      }
    | null
    | undefined,
): string | null {
  if (!episode) return null;
  if (isSpotifyUrl(episode.spotify_url)) return episode.spotify_url!.trim();
  const metaSpotify =
    typeof episode.metadata?.spotify_url === "string"
      ? (episode.metadata.spotify_url as string)
      : null;
  if (metaSpotify && isSpotifyUrl(metaSpotify)) {
    return metaSpotify.trim();
  }
  if (isSpotifyUrl(episode.audio_url)) return episode.audio_url!.trim();
  return null;
}

export function isSpotifyUrl(input: string | null | undefined): boolean {
  if (!input || typeof input !== "string") return false;
  const str = input.trim();
  return (
    str.includes("spotify.com/") ||
    str.startsWith("spotify:") ||
    str.includes("open.spotify.com/embed/")
  );
}

/**
 * Parses any Spotify URL, intl-localized link, URI or iframe code into a canonical embed format.
 */
export function parseSpotifyUrl(input: string | null | undefined): ParsedSpotifyMedia | null {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();

  // 1. Extract from iframe snippet if user pasted full embed code
  let target = str;
  const iframeMatch = str.match(/src=["'](https:\/\/open\.spotify\.com\/embed\/[^"']+)["']/i);
  if (iframeMatch) {
    target = iframeMatch[1];
  }

  // 2. Handle spotify: URI (e.g. spotify:episode:7makk4oTQel546B0PZlDM5)
  const uriMatch = target.match(/^spotify:(episode|show|track|playlist):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    const type = uriMatch[1].toLowerCase() as "episode" | "show" | "track" | "playlist";
    const id = uriMatch[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
    };
  }

  // 3. Handle open.spotify.com with optional intl-XX, embed, query params
  const webMatch = target.match(
    /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:intl-[a-z0-9_-]+\/)?(?:embed\/)?(episode|show|track|playlist)\/([a-zA-Z0-9]+)/i,
  );
  if (webMatch) {
    const type = webMatch[1].toLowerCase() as "episode" | "show" | "track" | "playlist";
    const id = webMatch[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
    };
  }

  return null;
}

/**
 * Fetches free public oEmbed metadata for a Spotify link (title, thumbnail, author).
 * Does not require Spotify developer credentials or secret tokens.
 */
export async function fetchSpotifyOEmbed(url: string): Promise<SpotifyOEmbedData | null> {
  const parsed = parseSpotifyUrl(url);
  if (!parsed) return null;

  try {
    const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}`;
    const res = await fetch(endpoint, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: typeof data.title === "string" ? data.title : undefined,
      thumbnail_url: typeof data.thumbnail_url === "string" ? data.thumbnail_url : undefined,
      author_name: typeof data.author_name === "string" ? data.author_name : undefined,
      html: typeof data.html === "string" ? data.html : undefined,
    };
  } catch {
    return null;
  }
}

export interface SpotifyMetadataResult {
  title?: string;
  name?: string;
  description?: string;
  coverUrl?: string;
  thumbnail_url?: string;
  author_name?: string;
  type?: "show" | "episode" | "track" | "playlist";
}

/**
 * Fetches rich podcast or Spotify metadata (title, name, description, coverUrl, author)
 * using the internal server scraper with client oEmbed fallback.
 */
export async function fetchPodcastMetadata(url: string): Promise<SpotifyMetadataResult | null> {
  if (!url || typeof url !== "string" || !url.trim()) return null;
  const trimmed = url.trim();

  // 1. Direct audio file fast-path (e.g. .mp3, .wav, .m4a)
  const isAudioFile = /\.(mp3|wav|m4a|ogg|aac|webm)(\?.*)?$/i.test(trimmed);
  if (isAudioFile) {
    const rawFilename = trimmed.split("/").pop()?.split("?")[0] || "Episodio de Podcast";
    const cleanTitle = decodeURIComponent(rawFilename)
      .replace(/\.(mp3|wav|m4a|ogg|aac|webm)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const formattedTitle = cleanTitle.replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: formattedTitle,
      name: formattedTitle,
      description: "Audio del podcast informativo y escolar para las familias de DMPS.",
      coverUrl: "",
      thumbnailUrl: "",
      author_name: "DMPS",
      type: "episode",
    };
  }

  // 2. Try our internal server API (extracts rich meta from Spotify, RSS, and web)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/spotify-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return {
            title: data.title || data.name,
            name: data.name || data.title,
            description: data.description || "",
            coverUrl: data.coverUrl || data.thumbnailUrl,
            thumbnail_url: data.thumbnailUrl || data.coverUrl,
            author_name: data.authorName,
            type: data.type,
          };
        }
      }
    } catch (err) {
      console.warn("Internal podcast metadata API failed, falling back to client oEmbed:", err);
    }
  }

  // 3. Direct client fallback for Spotify
  if (isSpotifyUrl(trimmed)) {
    const oembed = await fetchSpotifyOEmbed(trimmed);
    const parsed = parseSpotifyUrl(trimmed);
    if (oembed) {
      return {
        title: oembed.title,
        name: oembed.title,
        description: "Episodio oficial en Spotify para las familias de DMPS.",
        coverUrl: oembed.thumbnail_url,
        thumbnail_url: oembed.thumbnail_url,
        author_name: oembed.author_name,
        type: parsed?.type || "episode",
      };
    }
    if (parsed) {
      return {
        title: "Episodio de Spotify",
        name: "Episodio de Spotify",
        description: "Episodio de podcast disponible para reproducirse dentro del sitio.",
        coverUrl: "",
        thumbnailUrl: "",
        type: parsed.type,
      };
    }
  }

  return null;
}

/**
 * Backwards compatible alias for fetchPodcastMetadata
 */
export const fetchSpotifyMetadata = fetchPodcastMetadata;
