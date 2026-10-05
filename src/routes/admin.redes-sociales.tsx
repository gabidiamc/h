/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Share2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Video,
  Layers,
  Globe,
  Pin,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchSocialMediaChannels,
  fetchSocialMediaPosts,
  saveSocialMediaChannels,
  saveSocialMediaPost,
  deleteSocialMediaPost,
  extractYouTubeId,
  buildEmbedUrl,
  type SocialMediaChannel,
  type SocialMediaPost,
  type SocialPlatform,
} from "@/lib/social-media";
import { SocialPlatformIcon } from "@/components/social-media-icons";
import { useSchool } from "@/lib/school";

export const Route = createFileRoute("/admin/redes-sociales")({
  head: () => ({
    meta: [
      { title: "Gestión de Redes Sociales y Contenido — Administración DMPS" },
      {
        name: "description",
        content:
          "Panel administrativo para gestionar canales y publicaciones de Instagram, YouTube, TikTok y más con autoguardado permanente.",
      },
    ],
  }),
  component: AdminRedesSocialesPage,
});

export default function AdminRedesSocialesPage() {
  const queryClient = useQueryClient();
  const { selectedSchool } = useSchool();
  const [activeTab, setActiveTab] = useState<"channels" | "posts">("channels");

  // Dialog state for Channels
  const [editingChannel, setEditingChannel] = useState<SocialMediaChannel | null>(null);

  // Dialog state for Posts
  const [editingPost, setEditingPost] = useState<Partial<SocialMediaPost> | null>(null);

  // Query Channels
  const {
    data: channels = [],
    isLoading: loadingChannels,
    refetch: refetchChannels,
  } = useQuery({
    queryKey: ["social_media_channels_admin"],
    queryFn: fetchSocialMediaChannels,
  });

  // Query Posts
  const {
    data: posts = [],
    isLoading: loadingPosts,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["social_media_posts_admin"],
    queryFn: () => fetchSocialMediaPosts("all"),
  });

  // Channels Mutation
  const saveChannelsMutation = useMutation({
    mutationFn: async (updated: SocialMediaChannel[]) => {
      await saveSocialMediaChannels(updated);
      return updated;
    },
    onSuccess: () => {
      toast.success(
        "✓ Se guardó sin ningún problema la información. Los logos y enlaces quedaron permanentes.",
      );
      setEditingChannel(null);
      void queryClient.invalidateQueries({ queryKey: ["social_media_channels_admin"] });
      void queryClient.invalidateQueries({ queryKey: ["social_media_channels_public"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al guardar el canal");
    },
  });

  // Post Mutation
  const savePostMutation = useMutation({
    mutationFn: async (postData: Partial<SocialMediaPost>) => {
      return await saveSocialMediaPost(postData);
    },
    onSuccess: () => {
      toast.success(
        "✓ Se guardó sin ningún problema la información. El contenido se guardó permanentemente.",
      );
      setEditingPost(null);
      void queryClient.invalidateQueries({ queryKey: ["social_media_posts_admin"] });
      void queryClient.invalidateQueries({ queryKey: ["social_media_posts_public"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al guardar la publicación");
    },
  });

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteSocialMediaPost(id);
    },
    onSuccess: () => {
      toast.success("✓ Publicación eliminada permanentemente sin ningún problema.");
      void queryClient.invalidateQueries({ queryKey: ["social_media_posts_admin"] });
      void queryClient.invalidateQueries({ queryKey: ["social_media_posts_public"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al eliminar");
    },
  });

  // Toggle active status of a channel immediately (Auto-save)
  const handleToggleChannel = (channelId: string, active: boolean) => {
    const updated = channels.map((ch) =>
      ch.id === channelId ? { ...ch, is_active: active, updated_at: new Date().toISOString() } : ch,
    );
    saveChannelsMutation.mutate(updated);
  };

  // Save single edited channel
  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;

    const exists = channels.some((c) => c.id === editingChannel.id);
    let updated: SocialMediaChannel[];
    if (exists) {
      updated = channels.map((c) =>
        c.id === editingChannel.id
          ? { ...editingChannel, updated_at: new Date().toISOString() }
          : c,
      );
    } else {
      updated = [
        ...channels,
        {
          ...editingChannel,
          id: editingChannel.id || `channel_${editingChannel.platform}_${Date.now()}`,
          updated_at: new Date().toISOString(),
        },
      ];
    }
    saveChannelsMutation.mutate(updated);
  };

  // Save post
  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    savePostMutation.mutate(editingPost);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
              Redes Sociales y Multimedia
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Autoguardado permanente activo
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Configura los canales oficiales con sus logos a color para el pie de página y sube
            contenido multimedia de Instagram, YouTube, TikTok y más.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link to="/redes-sociales" target="_blank">
              <ExternalLink className="mr-1.5 size-4" />
              Ver Página Pública
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md rounded-xl bg-secondary/70 p-1">
          <TabsTrigger value="channels" className="rounded-lg font-semibold gap-2">
            <Share2 className="size-4" />
            Canales & Logos ({channels.filter((c) => c.is_active).length} activos)
          </TabsTrigger>
          <TabsTrigger value="posts" className="rounded-lg font-semibold gap-2">
            <Video className="size-4" />
            Publicaciones ({posts.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CANALES Y LOGOS */}
        <TabsContent value="channels" className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Logos y Canales Oficiales</h2>
              <p className="text-xs text-muted-foreground">
                Los canales activos mostrarán su logo con color oficial directamente en el pie de
                página de la web.
              </p>
            </div>
            <Button
              onClick={() =>
                setEditingChannel({
                  id: `ch_${Date.now()}`,
                  platform: "instagram",
                  name: "Instagram",
                  handle: "@dmpschools",
                  url: "https://instagram.com/",
                  is_active: true,
                  display_order: channels.length + 1,
                  brand_color: "#E4405F",
                })
              }
              className="gap-1.5 rounded-xl"
            >
              <Plus className="size-4" />
              Agregar Red Social
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((ch) => {
              const platformColor =
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
                <Card
                  key={ch.id}
                  className={`overflow-hidden border transition-all ${
                    ch.is_active
                      ? "border-border shadow-sm hover:shadow-md"
                      : "border-dashed border-muted-foreground/30 opacity-70"
                  }`}
                >
                  <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: platformColor }}
                      >
                        <SocialPlatformIcon platform={ch.platform} className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">{ch.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{ch.handle}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ch.is_active}
                        onCheckedChange={(val) => handleToggleChannel(ch.id, val)}
                        aria-label={`Activar o desactivar ${ch.name}`}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="truncate text-xs text-muted-foreground" title={ch.url}>
                      {ch.url}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
                      <span className="text-muted-foreground">
                        Orden: <strong className="text-foreground">{ch.display_order ?? 0}</strong>
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => setEditingChannel({ ...ch })}
                        >
                          <Edit2 className="size-3.5 mr-1" />
                          Editar
                        </Button>
                        <a
                          href={ch.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center rounded-lg px-2 text-primary hover:bg-primary/10"
                          title="Abrir enlace"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: PUBLICACIONES Y CONTENIDO */}
        <TabsContent value="posts" className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Publicaciones y Contenido Multimedia</h2>
              <p className="text-xs text-muted-foreground">
                Sube videos de YouTube, TikTok, posts de Instagram y noticias de redes con
                reproductor embebido.
              </p>
            </div>
            <Button
              onClick={() =>
                setEditingPost({
                  id: `post_${Date.now()}`,
                  platform: "youtube",
                  title: "",
                  description: "",
                  url: "",
                  media_type: "video",
                  author_name: "Des Moines Public Schools",
                  author_handle: "@dmpschools",
                  school_id: "all",
                  is_pinned: false,
                  is_visible: true,
                  likes_count: 0,
                  comments_count: 0,
                })
              }
              className="gap-1.5 rounded-xl"
            >
              <Plus className="size-4" />
              Nueva Publicación
            </Button>
          </div>

          {loadingPosts ? (
            <div className="p-8 text-center text-muted-foreground">Cargando publicaciones...</div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Video className="mx-auto size-12 text-muted-foreground/50" />
              <h3 className="mt-3 text-base font-bold">Aún no hay publicaciones</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Haz clic en "Nueva Publicación" para agregar contenido multimedia de Instagram,
                YouTube o TikTok.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const isYt = post.platform === "youtube";
                const ytId = isYt ? extractYouTubeId(post.url || post.embed_url || "") : null;

                return (
                  <Card
                    key={post.id}
                    className={`overflow-hidden flex flex-col border ${
                      post.is_visible ? "border-border" : "border-dashed opacity-60"
                    }`}
                  >
                    {/* Header with author & platform */}
                    <div className="p-3.5 pb-2 flex items-center justify-between border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-secondary">
                          <SocialPlatformIcon platform={post.platform} className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-none">{post.author_name}</p>
                          <p className="text-[11px] text-muted-foreground">{post.author_handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {post.is_pinned && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] gap-1 py-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-none"
                          >
                            <Pin className="size-2.5" /> Fijado
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {post.platform}
                        </Badge>
                      </div>
                    </div>

                    {/* Media Preview */}
                    <div className="aspect-video w-full bg-neutral-950/80 relative flex items-center justify-center overflow-hidden">
                      {isYt && ytId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                          title={post.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : post.thumbnail_url ? (
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="p-4 text-center">
                          <SocialPlatformIcon
                            platform={post.platform}
                            className="size-10 mx-auto text-white/40 mb-2"
                          />
                          <p className="text-xs text-white/80 font-medium px-4 line-clamp-2">
                            {post.title || post.url}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-sm line-clamp-2">{post.title}</h4>
                        {post.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {post.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {post.likes_count ? (
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="size-3" /> {post.likes_count}
                            </span>
                          ) : null}
                          {post.comments_count ? (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="size-3" /> {post.comments_count}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setEditingPost({ ...post })}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`¿Eliminar la publicación "${post.title}"?`)) {
                                deletePostMutation.mutate(post.id);
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                          {post.url && (
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center rounded-lg px-2 text-primary hover:bg-primary/10"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DIALOG: EDIT CHANNEL */}
      <Dialog open={editingChannel !== null} onOpenChange={(o) => !o && setEditingChannel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingChannel?.id ? "Editar Red Social" : "Nueva Red Social"}
            </DialogTitle>
            <DialogDescription>
              Configura el enlace y nombre de la red social. Quedará guardado permanentemente.
            </DialogDescription>
          </DialogHeader>

          {editingChannel && (
            <form onSubmit={handleSaveChannel} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ch_platform">Plataforma</Label>
                <Select
                  value={editingChannel.platform}
                  onValueChange={(val: SocialPlatform) => {
                    const brandColors: Record<string, string> = {
                      instagram: "#E4405F",
                      youtube: "#FF0000",
                      tiktok: "#010101",
                      facebook: "#1877F2",
                      twitter: "#000000",
                      whatsapp: "#25D366",
                    };
                    setEditingChannel({
                      ...editingChannel,
                      platform: val,
                      name: val.charAt(0).toUpperCase() + val.slice(1),
                      brand_color: brandColors[val] || "#3B82F6",
                    });
                  }}
                >
                  <SelectTrigger id="ch_platform" className="rounded-xl">
                    <SelectValue placeholder="Selecciona una plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">X (Twitter)</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="other">Otra Red / Enlace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ch_name">Nombre para Mostrar</Label>
                <Input
                  id="ch_name"
                  value={editingChannel.name}
                  onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                  placeholder="Ej. Instagram Oficial"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ch_handle">Usuario o Handle (@)</Label>
                <Input
                  id="ch_handle"
                  value={editingChannel.handle}
                  onChange={(e) => setEditingChannel({ ...editingChannel, handle: e.target.value })}
                  placeholder="Ej. @dmpschools"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ch_url">URL del Perfil o Canal</Label>
                <Input
                  id="ch_url"
                  type="url"
                  value={editingChannel.url}
                  onChange={(e) => setEditingChannel({ ...editingChannel, url: e.target.value })}
                  placeholder="https://instagram.com/dmpschools"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ch_order">Orden de Visualización</Label>
                <Input
                  id="ch_order"
                  type="number"
                  value={editingChannel.display_order ?? 0}
                  onChange={(e) =>
                    setEditingChannel({
                      ...editingChannel,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="ch_active" className="text-sm font-semibold">
                    Visible en el pie de página
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mostrar el logo con color de esta app en el footer público
                  </p>
                </div>
                <Switch
                  id="ch_active"
                  checked={editingChannel.is_active}
                  onCheckedChange={(checked) =>
                    setEditingChannel({ ...editingChannel, is_active: checked })
                  }
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingChannel(null)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saveChannelsMutation.isPending}
                  className="rounded-xl"
                >
                  {saveChannelsMutation.isPending ? "Guardando..." : "Guardar Permanentemente"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: EDIT POST */}
      <Dialog open={editingPost !== null} onOpenChange={(o) => !o && setEditingPost(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost?.id ? "Editar Publicación" : "Nueva Publicación Multimedia"}
            </DialogTitle>
            <DialogDescription>
              Agrega contenido de Instagram, YouTube, TikTok u otras redes.
            </DialogDescription>
          </DialogHeader>

          {editingPost && (
            <form onSubmit={handleSavePost} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="post_platform">Plataforma</Label>
                  <Select
                    value={editingPost.platform || "youtube"}
                    onValueChange={(val: SocialPlatform) =>
                      setEditingPost({ ...editingPost, platform: val })
                    }
                  >
                    <SelectTrigger id="post_platform" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">X (Twitter)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="post_media_type">Tipo de Medio</Label>
                  <Select
                    value={editingPost.media_type || "video"}
                    onValueChange={(val: any) =>
                      setEditingPost({ ...editingPost, media_type: val })
                    }
                  >
                    <SelectTrigger id="post_media_type" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="shorts">Shorts / Reel</SelectItem>
                      <SelectItem value="post">Post / Foto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="post_title">Título</Label>
                <Input
                  id="post_title"
                  value={editingPost.title || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  placeholder="Ej. Bienvenidos al nuevo año escolar 2026-2027"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="post_url">Enlace del Video o Publicación (URL)</Label>
                <Input
                  id="post_url"
                  type="url"
                  value={editingPost.url || ""}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    const embed = buildEmbedUrl(editingPost.platform || "youtube", newUrl);
                    setEditingPost({
                      ...editingPost,
                      url: newUrl,
                      embed_url: embed || newUrl,
                    });
                  }}
                  placeholder="https://www.youtube.com/watch?v=... o https://tiktok.com/@..."
                  className="rounded-xl"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Pega el enlace directo de YouTube, TikTok o Instagram. El reproductor lo
                  reconocerá automáticamente.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="post_desc">Descripción o Pie de Foto</Label>
                <Textarea
                  id="post_desc"
                  rows={3}
                  value={editingPost.description || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, description: e.target.value })}
                  placeholder="Texto o descripción de la publicación..."
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="post_author">Nombre del Autor / Canal</Label>
                  <Input
                    id="post_author"
                    value={editingPost.author_name || ""}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, author_name: e.target.value })
                    }
                    placeholder="Des Moines Public Schools"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="post_handle">Handle (@)</Label>
                  <Input
                    id="post_handle"
                    value={editingPost.author_handle || ""}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, author_handle: e.target.value })
                    }
                    placeholder="@dmpschools"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <Label htmlFor="post_visible" className="text-xs font-semibold cursor-pointer">
                    Visible al público
                  </Label>
                  <Switch
                    id="post_visible"
                    checked={editingPost.is_visible ?? true}
                    onCheckedChange={(checked) =>
                      setEditingPost({ ...editingPost, is_visible: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                  <Label htmlFor="post_pinned" className="text-xs font-semibold cursor-pointer">
                    Fijar al inicio
                  </Label>
                  <Switch
                    id="post_pinned"
                    checked={editingPost.is_pinned ?? false}
                    onCheckedChange={(checked) =>
                      setEditingPost({ ...editingPost, is_pinned: checked })
                    }
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPost(null)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={savePostMutation.isPending} className="rounded-xl">
                  {savePostMutation.isPending ? "Guardando..." : "Guardar Permanentemente"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
