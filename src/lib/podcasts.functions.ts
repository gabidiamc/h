import { createServerFn } from "@tanstack/react-start";
import type { PodcastComment } from "./podcasts";

export const postPublicPodcastCommentServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      podcastId: string;
      episodeId?: string | null;
      authorName?: string;
      content: string;
    }) => ({
      podcastId: String(data.podcastId ?? "").trim(),
      episodeId: data.episodeId ? String(data.episodeId).trim() : null,
      authorName: data.authorName ? String(data.authorName).trim().slice(0, 80) : "Oyente anónimo",
      content: String(data.content ?? "")
        .trim()
        .slice(0, 1500),
    }),
  )
  .handler(async ({ data }): Promise<PodcastComment> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { podcastId, episodeId, authorName, content } = data;
    if (content.length < 2) {
      throw new Error("El comentario debe tener al menos 2 caracteres.");
    }

    // 1. Fetch current podcast metadata using service role to bypass RLS
    const { data: podcastRow, error: fetchErr } = await supabaseAdmin
      .from("podcasts")
      .select("id, metadata")
      .eq("id", podcastId)
      .maybeSingle();

    if (fetchErr || !podcastRow) {
      throw new Error("Podcast no encontrado en el sistema.");
    }

    const currentMeta = (podcastRow.metadata as Record<string, unknown>) || {};
    const existingComments = Array.isArray(currentMeta.comments)
      ? (currentMeta.comments as PodcastComment[])
      : [];

    const newComment: PodcastComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      podcast_id: podcastId,
      episode_id: episodeId || null,
      author_name: authorName || "Oyente anónimo",
      content,
      created_at: new Date().toISOString(),
    };

    const updatedComments = [newComment, ...existingComments];
    const updatedMeta = {
      ...currentMeta,
      comments: updatedComments,
    };

    const { error: updateErr } = await supabaseAdmin
      .from("podcasts")
      .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
      .eq("id", podcastId);

    if (updateErr) {
      throw new Error(`Error al persistir comentario: ${updateErr.message}`);
    }

    return newComment;
  });
