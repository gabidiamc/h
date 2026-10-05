import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Share2,
  ExternalLink,
  School,
  Play,
  ThumbsUp,
  MessageSquare,
  Pin,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { useSchool } from "@/lib/school";
import { useI18n } from "@/lib/i18n";
import {
  fetchSocialMediaChannels,
  fetchSocialMediaPosts,
  extractYouTubeId,
  type SocialMediaChannel,
  type SocialMediaPost,
  type SocialPlatform,
} from "@/lib/social-media";
import { SocialPlatformIcon } from "@/components/social-media-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/redes-sociales")({
  head: () => ({
    meta: [
      { title: "Redes Sociales y Multimedia — Des Moines Public Schools" },
      {
        name: "description",
        content:
          "Sigue nuestras cuentas oficiales y disfruta de contenido en video y publicaciones de Instagram, YouTube, TikTok y más.",
      },
      { property: "og:title", content: "Redes Sociales — DMPS Family Info" },
      {
        property: "og:description",
        content:
          "Canales oficiales y contenido en video de Des Moines Public Schools y Abraham Lincoln High School.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://familiasdmps.app/redes-sociales" }],
  }),
  component: RedesSocialesPage,
});

export default function RedesSocialesPage() {
  const { selectedSchool } = useSchool();
  const { lang } = useI18n();

  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Channels
  const { data: channels = [] } = useQuery({
    queryKey: ["social_media_channels_public"],
    queryFn: async () => {
      const all = await fetchSocialMediaChannels();
      return all.filter((c) => c.is_active);
    },
  });

  // Fetch Posts
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["social_media_posts_public", selectedSchool.id],
    queryFn: () => fetchSocialMediaPosts(selectedSchool.id),
  });

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (selectedPlatform !== "all" && post.platform !== selectedPlatform) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = post.title?.toLowerCase().includes(query);
        const matchesDesc = post.description?.toLowerCase().includes(query);
        const matchesAuthor =
          post.author_name?.toLowerCase().includes(query) ||
          post.author_handle?.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesAuthor;
      }
      return true;
    });
  }, [posts, selectedPlatform, searchQuery]);

  const platformFilters = [
    { id: "all", label: lang === "en" ? "All platforms" : "Todas las redes" },
    { id: "youtube", label: "YouTube" },
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "facebook", label: "Facebook" },
    { id: "twitter", label: "X (Twitter)" },
  ];

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 space-y-10">
        {/* Header Title & Badge */}
        <div className="border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-3">
            <School className="size-3.5" />
            <span>{selectedSchool.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {lang === "en" ? "Social Media & Community" : "Redes Sociales y Comunidad"}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-3xl">
            {lang === "en"
              ? "Follow official Des Moines Public Schools and Lincoln High School channels on YouTube, Instagram, TikTok, and Facebook to stay up to date on events, celebrations, and student announcements."
              : "Sigue los canales oficiales de Des Moines Public Schools y Lincoln High School en YouTube, Instagram, TikTok y Facebook para mantenerte al día con eventos, celebraciones y anuncios estudiantiles."}
          </p>

          {/* Quick Channels Bar */}
          {channels.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
                {lang === "en" ? "Official channels:" : "Canales oficiales:"}
              </span>
              {channels.map((ch) => {
                const color =
                  ch.platform === "instagram"
                    ? "#E4405F"
                    : ch.platform === "youtube"
                      ? "#FF0000"
                      : ch.platform === "tiktok"
                        ? "#010101"
                        : ch.platform === "facebook"
                          ? "#1877F2"
                          : ch.platform === "twitter"
                            ? "#000000"
                            : ch.platform === "whatsapp"
                              ? "#25D366"
                              : ch.brand_color || "#3B82F6";

                return (
                  <a
                    key={ch.id}
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ backgroundColor: color }}
                  >
                    <SocialPlatformIcon platform={ch.platform} className="size-4" />
                    <span>{ch.name}</span>
                    <ExternalLink className="size-3 opacity-70" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {platformFilters.map((f) => (
              <Button
                key={f.id}
                variant={selectedPlatform === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPlatform(f.id)}
                className="rounded-xl text-xs font-semibold min-h-9"
              >
                {f.id !== "all" && (
                  <SocialPlatformIcon
                    platform={f.id as SocialPlatform}
                    className="size-3.5 mr-1.5"
                  />
                )}
                {f.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "en" ? "Search posts..." : "Buscar publicaciones..."}
              className="pl-9 rounded-xl text-xs h-9"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {loadingPosts ? (
          <div className="py-20 text-center text-muted-foreground">
            {lang === "en" ? "Loading multimedia content..." : "Cargando contenido multimedia..."}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Share2 className="mx-auto size-12 text-muted-foreground/40" />
            <h3 className="mt-3 text-lg font-bold">
              {lang === "en" ? "No posts found" : "No se encontraron publicaciones"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? lang === "en"
                  ? "No results found for your search. Try different keywords."
                  : "No hay resultados para tu búsqueda. Intenta con otras palabras clave."
                : lang === "en"
                  ? "There are currently no posts on this social network."
                  : "No hay publicaciones en esta red social actualmente."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const isYt = post.platform === "youtube";
              const ytId = isYt ? extractYouTubeId(post.url || post.embed_url || "") : null;

              const platformColor =
                post.platform === "instagram"
                  ? "#E4405F"
                  : post.platform === "youtube"
                    ? "#FF0000"
                    : post.platform === "tiktok"
                      ? "#010101"
                      : post.platform === "facebook"
                        ? "#1877F2"
                        : post.platform === "twitter"
                          ? "#000000"
                          : "#3B82F6";

              return (
                <article
                  key={post.id}
                  className="group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden"
                >
                  {/* Author Header */}
                  <div className="p-3.5 flex items-center justify-between border-b border-border/50 bg-secondary/30">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex size-8 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: platformColor }}
                      >
                        <SocialPlatformIcon platform={post.platform} className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight text-foreground">
                          {post.author_name}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {post.author_handle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {post.is_pinned && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none"
                        >
                          <Pin className="size-2.5" /> Fijado
                        </Badge>
                      )}
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {post.platform}
                      </span>
                    </div>
                  </div>

                  {/* Player or Media Container */}
                  <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
                    {isYt && ytId ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
                        title={post.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : post.thumbnail_url ? (
                      <div className="relative w-full h-full">
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                        {post.url && (
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 grid place-items-center bg-black/40 hover:bg-black/25 transition-colors"
                          >
                            <div className="size-12 rounded-full bg-white/90 text-neutral-900 grid place-items-center shadow-lg transition-transform group-hover:scale-110">
                              <Play className="size-5 fill-current ml-0.5" />
                            </div>
                          </a>
                        )}
                      </div>
                    ) : (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-6 text-center w-full h-full bg-gradient-to-b from-neutral-900 to-neutral-950 text-white hover:opacity-95 transition-opacity"
                      >
                        <div
                          className="size-12 rounded-2xl flex items-center justify-center shadow-md mb-2"
                          style={{ backgroundColor: platformColor }}
                        >
                          <SocialPlatformIcon
                            platform={post.platform}
                            className="size-6 text-white"
                          />
                        </div>
                        <p className="text-xs font-semibold text-white/90 max-w-[200px] line-clamp-2">
                          Ver contenido en {post.platform}
                        </p>
                        <span className="mt-2 text-[11px] text-white/60 inline-flex items-center gap-1">
                          Abrir enlace <ExternalLink className="size-3" />
                        </span>
                      </a>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h2 className="font-bold text-base leading-snug text-foreground line-clamp-2">
                        {post.title}
                      </h2>
                      {post.description && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">
                          {post.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {Boolean(post.likes_count) && (
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="size-3" /> {post.likes_count}
                          </span>
                        )}
                        {Boolean(post.comments_count) && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3" /> {post.comments_count}
                          </span>
                        )}
                      </div>

                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          <span>
                            {lang === "en" ? `View on ${post.platform}` : `Ver en ${post.platform}`}
                          </span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
