import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Globe,
  ImageOff,
  MapPin,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/photos";

export const Route = createFileRoute("/_authenticated/eventos/$id")({
  head: () => ({
    meta: [
      { title: "Evento — LUMEN" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Evento — LUMEN" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventPage,
});

interface PhotoRow {
  id: string;
  storage_path: string;
  created_at: string;
}

function EventPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const eventQuery = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, slug, event_date, location, description, is_public, user_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const event = eventQuery.data;

  const photosQuery = useQuery({
    queryKey: ["photos", id],
    enabled: !!event,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, storage_path, created_at")
        .eq("event_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = data as PhotoRow[];
      const urls = await Promise.all(rows.map((p) => signedUrl(p.storage_path)));
      return rows.map((p, i) => ({ ...p, url: urls[i] })).filter((p) => p.url !== null);
    },
  });

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !userId || !event) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setError(null);
    setUploading({ done: 0, total: files.length });
    let failed = 0;
    for (const file of files) {
      try {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase
          .from("photos")
          .insert({ event_id: event.id, user_id: userId, storage_path: path, url: path });
        if (insErr) throw insErr;
      } catch {
        failed++;
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    if (failed) setError(`${failed} foto(s) não puderam ser enviadas.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
    queryClient.invalidateQueries({ queryKey: ["photos", id] });
  }

  async function togglePublic(checked: boolean) {
    if (!event) return;
    await supabase.from("events").update({ is_public: checked }).eq("id", event.id);
    queryClient.invalidateQueries({ queryKey: ["event", id] });
  }

  async function copyLink() {
    if (!event) return;
    const link = `${window.location.origin}/g/${event.slug}`;
    try {
      await navigator.clipboard.writeText(link);
ed    } catch {
      window.prompt("Copie o link da galeria:", link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function deletePhoto(photoId: string, path: string) {
    await supabase.from("photos").delete().eq("id", photoId);
    await supabase.storage.from("photos").remove([path]);
    queryClient.invalidateQueries({ queryKey: ["photos", id] });
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none backdrop-blur-md transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

  if (eventQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <p className="text-sm text-foreground/50">Carregando evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="font-display text-4xl tracking-tight">EVENTO NÃO ENCONTRADO</h1>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  const photos = photosQuery.data ?? [];
  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/g/${event.slug}` : "";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 -top-40 size-[520px] rounded-full bg-secondary/20 blur-[120px]"
          style={{ animation: "drift 18s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-40 bottom-0 size-[560px] rounded-full bg-primary/15 blur-[130px]"
          style={{ animation: "drift2 22s ease-in-out infinite" }}
        />
      </div>

      {/* header */}
      <header className="relative z-10 border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center gap-2 text-sm text-foreground/70 transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Painel
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-lg text-primary-foreground">
              L
            </span>
            <span className="hidden font-display text-2xl tracking-wide sm:block">LUMEN</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
              <Calendar className="size-3" />
              {event.event_date
                ? new Date(event.event_date + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Sem data"}
              {event.location && (
                <>
                  <span className="text-foreground/30">·</span>
                  <MapPin className="size-3" /> {event.location}
                </>
              )}
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-6xl">
              {event.title.toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
              {copied ? "Link copiado!" : "Copiar link"}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!uploading}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white disabled:opacity-60"
            >
              <Upload className="size-4" />
              {uploading ? `Enviando ${uploading.done}/${uploading.total}...` : "Enviar fotos"}
            </button>
          </div>
        </div>

        {/* visibility + share */}
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <button
              type="button"
              role="switch"
              aria-checked={event.is_public}
              onClick={() => togglePublic(!event.is_public)}
              className={`relative h-6 w-11 rounded-full transition ${
                event.is_public ? "bg-primary" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                  event.is_public ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="size-4 text-primary" />
              {event.is_public
                ? "Galeria pública — quem tem o link vê as fotos"
                : "Galeria privada — só você vê"}
            </span>
          </label>
          {event.is_public && (
            <span className="text-xs text-foreground/40">{shareLink}</span>
          )}
        </div>

        {event.description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/60">
            {event.description}
          </p>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* dropzone */}
        {photos.length === 0 && !photosQuery.isLoading ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="mt-10 grid cursor-pointer place-items-center rounded-3xl border border-dashed border-white/25 bg-white/5 px-6 py-20 text-center backdrop-blur-xl transition hover:border-primary/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
              <Upload className="size-6" />
            </div>
            <p className="mt-4 font-semibold">Arraste as fotos aqui</p>
            <p className="mt-1 text-sm text-foreground/50">ou clique para selecionar</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-foreground/30">
              JPG · PNG · WEBP · até 50MB
            </p>
          </div>
        ) : (
          <div className="mt-10 columns-2 gap-4 md:columns-3 lg:columns-4">
            {photosQuery.isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-4 break-inside-avoid animate-pulse rounded-2xl bg-white/5"
                  style={{ height: 180 + ((i * 67) % 120) }}
                />
              ))}
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-white/10"
              >
                <img
                  src={photo.url!}
                  alt=""
                  loading="lazy"
                  className="w-full transition group-hover:scale-[1.02]"
                />
                <button
                  onClick={() => deletePhoto(photo.id, photo.storage_path)}
                  aria-label="Excluir foto"
                  className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-background/80 text-foreground/80 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            {photos.length > 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 grid break-inside-avoid cursor-pointer place-items-center rounded-2xl border border-dashed border-white/25 bg-white/5 py-10 text-foreground/50 transition hover:border-primary/50 hover:text-primary"
              >
                <div className="text-center">
                  <Upload className="mx-auto size-6" />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em]">
                    Mais fotos
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {photos.length === 0 && photosQuery.isError && (
          <div className="mt-10 grid place-items-center rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-foreground/60">
            <ImageOff className="size-8" />
            <p className="mt-3 text-sm">Não foi possível carregar as fotos. Tente novamente.</p>
          </div>
        )}
      </main>

      {uploading && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-white/15 bg-popover px-5 py-3 text-sm shadow-xl backdrop-blur-xl">
          <Upload className="size-4 animate-pulse text-primary" />
          Enviando {uploading.done} de {uploading.total}...
        </div>
      )}
    </div>
  );
}
