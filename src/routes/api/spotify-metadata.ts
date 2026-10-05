import { createFileRoute } from "@tanstack/react-router";
import { parseSpotifyUrl } from "@/lib/spotify";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function cleanSpotifyDescription(rawDesc: string, title?: string): string {
  let cleaned = decodeHtmlEntities(rawDesc);
  // Strip "Listen to this episode from [Show] on Spotify. "
  cleaned = cleaned.replace(/^Listen to this episode from .+? on Spotify\.\s*/i, "");
  // Strip "Listen to [Show] on Spotify. "
  cleaned = cleaned.replace(/^Listen to .+? on Spotify\.\s*/i, "");
  // Strip "Podcast · [Host] · "
  cleaned = cleaned.replace(/^Podcast\s*·\s*.+?\s*·\s*/i, "");
  // Strip trailing "Listen on Spotify..."
  cleaned = cleaned.replace(/\s*Listen on Spotify.*$/i, "");

  // If title was provided and description is just repeating the title, clean it
  if (title && cleaned.toLowerCase() === title.toLowerCase()) {
    return "";
  }

  return cleaned.trim();
}

async function extractPodcastDetails(url: string) {
  const trimmed = url.trim();
  const parsedSpotify = parseSpotifyUrl(trimmed);

  if (parsedSpotify) {
    let title = "";
    let description = "";
    let coverUrl = "";
    let authorName = "";

    // 1. Fetch public oEmbed data
    try {
      const oembedEndpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(parsedSpotify.canonicalUrl)}`;
      const oembedRes = await fetch(oembedEndpoint, {
        headers: { Accept: "application/json" },
      });
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (typeof data.title === "string") title = data.title;
        if (typeof data.thumbnail_url === "string") coverUrl = data.thumbnail_url;
        if (typeof data.author_name === "string") authorName = data.author_name;
      }
    } catch (err) {
      console.warn("[Spotify Metadata] oEmbed fetch warning:", err);
    }

    // 2. Fetch canonical HTML for rich meta description & full resolution art
    try {
      const htmlRes = await fetch(parsedSpotify.canonicalUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (htmlRes.ok) {
        const html = await htmlRes.text();

        // Extract description
        const descMatch =
          html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
          html.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);

        if (descMatch && descMatch[1]) {
          const candidate = cleanSpotifyDescription(descMatch[1], title);
          if (candidate) {
            description = candidate;
          }
        }

        // If title is missing or generic, try og:title
        if (!title) {
          const titleMatch =
            html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            title = decodeHtmlEntities(titleMatch[1].replace(/\s*\|\s*Spotify.*$/i, "").trim());
          }
        }

        // If coverUrl is missing, try og:image
        if (!coverUrl) {
          const imgMatch =
            html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
            html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            coverUrl = imgMatch[1].trim();
          }
        }
      }
    } catch (err) {
      console.warn("[Spotify Metadata] HTML meta scrape warning:", err);
    }

    return {
      success: true,
      type: parsedSpotify.type,
      id: parsedSpotify.id,
      canonicalUrl: parsedSpotify.canonicalUrl,
      embedUrl: parsedSpotify.embedUrl,
      name: title,
      title,
      description,
      coverUrl,
      thumbnailUrl: coverUrl,
      authorName,
    };
  }

  // 3. Direct audio URL (e.g. .mp3, .wav, .m4a, .ogg)
  const isAudioFile = /\.(mp3|wav|m4a|ogg|aac|webm)(\?.*)?$/i.test(trimmed);
  if (isAudioFile) {
    const rawFilename = trimmed.split("/").pop()?.split("?")[0] || "Episodio de Podcast";
    const cleanTitle = decodeURIComponent(rawFilename)
      .replace(/\.(mp3|wav|m4a|ogg|aac|webm)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    return {
      success: true,
      type: "audio",
      id: cleanTitle.toLowerCase().replace(/\s+/g, "-"),
      canonicalUrl: trimmed,
      name: formattedTitle,
      title: formattedTitle,
      description: "Audio del podcast informativo y escolar para las familias de DMPS.",
      coverUrl: "",
      thumbnailUrl: "",
      authorName: "DMPS",
    };
  }

  // 4. Fetch generic web page or RSS feed to extract title and description
  try {
    const res = await fetch(trimmed, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml,application/rss+xml,*/*;q=0.8",
      },
    });

    if (res.ok) {
      const text = await res.text();
      let extractedTitle = "";
      let extractedDesc = "";
      let extractedImage = "";

      // Check if RSS feed
      if (text.includes("<rss") || text.includes("<channel") || text.includes("<feed")) {
        const titleMatch = text.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        if (titleMatch && titleMatch[1]) extractedTitle = titleMatch[1].trim();

        const descMatch =
          text.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i) ||
          text.match(/<itunes:summary>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/itunes:summary>/i);
        if (descMatch && descMatch[1]) extractedDesc = descMatch[1].replace(/<[^>]+>/g, "").trim();

        const imgMatch =
          text.match(/<itunes:image\s+href=["']([^"']+)["']/i) ||
          text.match(/<image>\s*<url>(.*?)<\/url>/i);
        if (imgMatch && imgMatch[1]) extractedImage = imgMatch[1].trim();

        return {
          success: true,
          type: "rss",
          id: "podcast_rss",
          canonicalUrl: trimmed,
          name: decodeHtmlEntities(extractedTitle),
          title: decodeHtmlEntities(extractedTitle),
          description: decodeHtmlEntities(extractedDesc),
          coverUrl: extractedImage,
          thumbnailUrl: extractedImage,
          authorName: "Podcast RSS",
        };
      }

      // Standard HTML OpenGraph & Meta tags
      const ogTitleMatch =
        text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
        text.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i) ||
        text.match(/<title>([^<]+)<\/title>/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        extractedTitle = decodeHtmlEntities(ogTitleMatch[1].trim());
      }

      const ogDescMatch =
        text.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
        text.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
        text.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
      if (ogDescMatch && ogDescMatch[1]) {
        extractedDesc = decodeHtmlEntities(ogDescMatch[1].trim());
      }

      const ogImgMatch =
        text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        text.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
      if (ogImgMatch && ogImgMatch[1]) {
        extractedImage = ogImgMatch[1].trim();
      }

      if (extractedTitle) {
        return {
          success: true,
          type: "web",
          id: "podcast_web",
          canonicalUrl: trimmed,
          name: extractedTitle,
          title: extractedTitle,
          description: extractedDesc,
          coverUrl: extractedImage,
          thumbnailUrl: extractedImage,
          authorName: "",
        };
      }
    }
  } catch (webErr) {
    console.warn("[Podcast Metadata] Web fetch error:", webErr);
  }

  // Fallback: derive title from URL hostname/pathname
  try {
    const parsedUrl = new URL(trimmed);
    const lastSeg = parsedUrl.pathname.split("/").filter(Boolean).pop() || parsedUrl.hostname;
    const fallbackTitle = lastSeg.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      success: true,
      type: "generic",
      id: "podcast_url",
      canonicalUrl: trimmed,
      name: fallbackTitle,
      title: fallbackTitle,
      description: "Podcast oficial para las familias y comunidad escolar de DMPS.",
      coverUrl: "",
      thumbnailUrl: "",
      authorName: "",
    };
  } catch {
    return { success: false, error: "Formato de URL no válido." };
  }
}

async function extractSpotifyDetails(url: string) {
  return extractPodcastDetails(url);
}

export const Route = createFileRoute("/api/spotify-metadata")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const urlObj = new URL(request.url);
          const targetUrl = urlObj.searchParams.get("url");
          if (!targetUrl) {
            return new Response(JSON.stringify({ error: "Missing 'url' query parameter" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const result = await extractSpotifyDetails(targetUrl);
          return new Response(JSON.stringify(result), {
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const targetUrl = typeof body?.url === "string" ? body.url : null;
          if (!targetUrl) {
            return new Response(JSON.stringify({ error: "Missing 'url' field in body" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const result = await extractSpotifyDetails(targetUrl);
          return new Response(JSON.stringify(result), {
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
