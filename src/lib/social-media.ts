import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { notifySaveSuccess } from "./storage-engine";
import { notifyContentUpdated } from "./sync";

export type SocialPlatform =
  "instagram" | "youtube" | "tiktok" | "facebook" | "twitter" | "whatsapp" | "other";

export interface SocialMediaChannel {
  id: string;
  platform: SocialPlatform;
  name: string;
  handle: string;
  url: string;
  is_active: boolean;
  brand_color?: string;
  display_order?: number;
  updated_at?: string;
}

export interface SocialMediaPost {
  id: string;
  platform: SocialPlatform;
  title: string;
  description: string;
  url: string;
  embed_url?: string;
  media_type?: "video" | "post" | "reel" | "shorts" | "image";
  thumbnail_url?: string;
  author_name?: string;
  author_handle?: string;
  school_id?: string;
  is_pinned?: boolean;
  is_visible?: boolean;
  likes_count?: number;
  comments_count?: number;
  published_at?: string;
  updated_at?: string;
}

export function getPlatformBadgeStyle(platform: SocialPlatform): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (platform) {
    case "instagram":
      return {
        bg: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]",
        text: "text-white",
        border: "border-pink-400/30",
        label: "Instagram",
      };
    case "youtube":
      return {
        bg: "bg-[#FF0000]",
        text: "text-white",
        border: "border-red-600/30",
        label: "YouTube",
      };
    case "tiktok":
      return {
        bg: "bg-black",
        text: "text-[#25F4EE]",
        border: "border-pink-500/40",
        label: "TikTok",
      };
    case "facebook":
      return {
        bg: "bg-[#1877F2]",
        text: "text-white",
        border: "border-blue-600/30",
        label: "Facebook",
      };
    case "twitter":
      return {
        bg: "bg-neutral-900",
        text: "text-white",
        border: "border-neutral-700",
        label: "X (Twitter)",
      };
    case "whatsapp":
      return {
        bg: "bg-[#25D366]",
        text: "text-white",
        border: "border-green-600/30",
        label: "WhatsApp",
      };
    default:
      return {
        bg: "bg-primary",
        text: "text-primary-foreground",
        border: "border-primary/20",
        label: "Red Social",
      };
  }
}

/**
 * Parses YouTube video IDs from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

/**
 * Returns a standardized embed URL for media embedding.
 */
export function buildEmbedUrl(platform: SocialPlatform, rawUrl: string): string | null {
  if (!rawUrl) return null;

  if (platform === "youtube") {
    const ytId = extractYouTubeId(rawUrl);
    if (ytId) {
      return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`;
    }
  }

  if (platform === "instagram") {
    const clean = rawUrl.split("?")[0].replace(/\/$/, "");
    if (clean.includes("/p/") || clean.includes("/reel/")) {
      return `${clean}/embed/`;
    }
  }

  return rawUrl;
}

/**
 * Fetches all configured social media channels directly from Supabase.
 */
export async function fetchSocialMediaChannels(): Promise<SocialMediaChannel[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("social_media_channels")
        .select("*")
        .order("display_order", { ascending: true });
      if (!error && Array.isArray(data)) {
        return (data as unknown as SocialMediaChannel[]).sort(
          (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
        );
      }
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Fetches all published social media posts directly from Supabase.
 */
export async function fetchSocialMediaPosts(schoolId?: string): Promise<SocialMediaPost[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("social_media_posts")
        .select("*")
        .eq("is_visible", true)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });
      if (!error && data) {
        const posts = data as unknown as SocialMediaPost[];
        return posts.filter((p) => {
          if (!schoolId || schoolId === "all") return true;
          return !p.school_id || p.school_id === "all" || p.school_id === schoolId;
        });
      }
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Saves social media channels directly to Supabase.
 */
export async function saveSocialMediaChannels(channels: SocialMediaChannel[]): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("social_media_channels").upsert(
      channels.map((c) => ({
        ...c,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "id" },
    );
    if (error) {
      console.error("[Supabase saveSocialMediaChannels error]:", error);
      throw new Error(`Error en Supabase: ${error.message}${error.code ? ` (${error.code})` : ""}`);
    }
  }

  notifyContentUpdated("social_media_channels");
  notifySaveSuccess("✓ Redes sociales guardadas y confirmadas en Supabase.");
  return true;
}

/**
 * Upserts a social media post directly in Supabase.
 */
export async function saveSocialMediaPost(
  post: Partial<SocialMediaPost>,
): Promise<SocialMediaPost> {
  const id = post.id || `post_${post.platform || "social"}_${Date.now()}`;
  const now = new Date().toISOString();

  const embed_url =
    post.embed_url || (post.url ? buildEmbedUrl(post.platform || "other", post.url) || "" : "");

  const fullPost: SocialMediaPost = {
    id,
    platform: post.platform || "instagram",
    title: post.title || "",
    description: post.description || "",
    url: post.url || "",
    embed_url,
    media_type: post.media_type || "post",
    thumbnail_url: post.thumbnail_url || "",
    author_name: post.author_name || "Des Moines Public Schools",
    author_handle: post.author_handle || "@dmpschools",
    school_id: post.school_id || "all",
    is_pinned: post.is_pinned ?? false,
    is_visible: post.is_visible ?? true,
    likes_count: post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    published_at: post.published_at || now,
    updated_at: now,
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("social_media_posts")
      .upsert(fullPost, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Supabase saveSocialMediaPost error]:", error);
      throw new Error(
        `Error al guardar en Supabase: ${error.message}${error.code ? ` (${error.code})` : ""}`,
      );
    }

    if (data) {
      notifyContentUpdated("social_media_posts");
      notifySaveSuccess("✓ Publicación guardada correctamente en Supabase.");
      return data as unknown as SocialMediaPost;
    }
  }

  notifyContentUpdated("social_media_posts");
  notifySaveSuccess("✓ Publicación guardada correctamente.");
  return fullPost;
}

/**
 * Deletes a social media post directly from Supabase.
 */
export async function deleteSocialMediaPost(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("social_media_posts").delete().eq("id", id);
    if (error) {
      console.error("[Supabase deleteSocialMediaPost error]:", error);
      throw new Error(`Error al eliminar en Supabase: ${error.message}`);
    }
  }

  notifyContentUpdated("social_media_posts");
  notifySaveSuccess("✓ Publicación eliminada de Supabase.");
  return true;
}
