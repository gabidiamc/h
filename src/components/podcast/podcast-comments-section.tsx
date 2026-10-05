import React, { useState, useEffect } from "react";
import { MessageSquare, Send, User, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  addPodcastComment,
  fetchPodcastComments,
  type PodcastComment,
  type PodcastRow,
} from "@/lib/podcasts";

interface PodcastCommentsSectionProps {
  podcast: PodcastRow;
  episodeId?: string | null;
  className?: string;
}

export function PodcastCommentsSection({
  podcast,
  episodeId,
  className = "",
}: PodcastCommentsSectionProps) {
  const [comments, setComments] = useState<PodcastComment[]>(podcast.comments || []);
  const [isOpen, setIsOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPodcastComments(podcast.id)
      .then((loaded) => {
        if (mounted && Array.isArray(loaded)) {
          setComments(loaded);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [podcast.id]);

  // Filter if episodeId specified, or show all podcast comments
  const relevantComments = episodeId
    ? comments.filter((c) => !c.episode_id || c.episode_id === episodeId)
    : comments;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Por favor escribe tu comentario.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newComment = await addPodcastComment({
        podcastId: podcast.id,
        episodeId: episodeId || null,
        authorName: authorName.trim() || undefined,
        content: content.trim(),
      });

      setComments((prev) => [newComment, ...prev]);
      setContent("");
      setIsOpen(false);
      toast.success("¡Comentario publicado exitosamente! Es visible para toda la comunidad.");
    } catch (err: unknown) {
      const errorObj = err as { message?: string } | null;
      toast.error(errorObj?.message || "No se pudo publicar el comentario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name[0] || "O").toUpperCase();
  };

  const formatCommentDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Reciente";
      return d.toLocaleDateString("es-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Reciente";
    }
  };

  return (
    <section
      aria-label="Comentarios del podcast"
      className={`rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-6 ${className}`}
    >
      {/* Header with Title and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="size-4" />
            </span>
            <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
              Comentarios de la Comunidad
            </h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold font-mono text-muted-foreground">
              {relevantComments.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Espacio público abierto para que estudiantes, familias y docentes compartan sus
            opiniones. Sin necesidad de registrarse.
          </p>
        </div>

        {!isOpen && (
          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            className="gap-2 shrink-0 self-start sm:self-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
          >
            <MessageSquare className="size-4" />
            <span>Comentar en el podcast</span>
          </Button>
        )}
      </div>

      {/* Comment Form (Openable without account) */}
      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>Deja tu comentario público</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <User className="size-3 text-muted-foreground" />
                <span>Tu nombre o apodo (opcional)</span>
              </label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ej. Familia López, Carlos R. o déjalo en blanco para anónimo"
                maxLength={60}
                className="bg-background text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Comentario o mensaje</label>
              <Textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="¿Qué te pareció este podcast? Comparte tus ideas, comentarios o preguntas sobre este tema..."
                maxLength={1000}
                className="bg-background text-xs leading-relaxed"
                required
              />
              <span className="text-[10px] text-muted-foreground block text-right">
                {content.length}/1000 caracteres
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-primary/20">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span>Comentario 100% público · No necesitas registrarte ni iniciar sesión.</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs h-8"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                size="sm"
                className="gap-1.5 text-xs h-8"
              >
                <Send className="size-3" />
                <span>{isSubmitting ? "Publicando..." : "Publicar comentario"}</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {relevantComments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center space-y-2">
            <MessageSquare className="mx-auto size-8 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">
              Aún no hay comentarios en este podcast
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              ¡Sé la primera persona en compartir lo que te pareció! No necesitas cuenta ni
              contraseña.
            </p>
            {!isOpen && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <MessageSquare className="size-3.5" />
                  <span>Escribir primer comentario</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {relevantComments.map((cmt) => (
              <article key={cmt.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                      {getInitials(cmt.author_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {cmt.author_name}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                          Oyente
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <Clock className="size-3" />
                    <span>{formatCommentDate(cmt.created_at)}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed pl-10 whitespace-pre-wrap">
                  {cmt.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
