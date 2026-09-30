import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/photos";

export const Route = createFileRoute("/g/$slug")({
  head: () => ({
    meta: [
      { title: "Galeria de fotos — LUMEN" },
      {
        name: "description",
        content: "Galeria de fotos do evento, feita por fotógrafos de eventos.",
      },
      { property: "og:title", content: "Galeria de fotos — LUMEN" },
      {
        property: "og:description",
        content: "Galeria de fotos do evento, feita por fotógrafos de eventos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicGallery,
});

interface GalleryPhoto {
  id: string;
  url: string;
}

function PublicGallery() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  const [lightbox, setLightbox] = useState<number | null>(null);

  const galleryQuery = useQuery({
    queryKey: ["gallery", slug],
    retry: false,
    queryFn: async () => {
      const { data: event, error } = await supabase
        .from("events")
        .select("id, title, event_date, location, description, user_id")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      if (error) throw error;
      if (!event) throw notFound();

      const { data: photos, error: photosError } = await supabase
        .from("photos")
        .select("id, storage_path")
        .eq("event_id", event.id)
        .order("created_at", { ascending: true });
      if (photosError) throw photosError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_name")
        .eq("id", event.user_id)
        .maybeSingle();

      const urls = await Promise.all(
        (photos ?? []).map((p) => signedUrl((p as { storage_path: string }).storage_path)),
      );
      const list: GalleryPhoto[] = (photos ?? [])
        .map((p, i) => ({ id: (p as { id: string }).id, url: urls[i]! }))
        .filter((p) => p.url);

      return {
        title: event.title,
        eventDate: event.event_date as string | null,
        location: event.location as string | null,
        description: event.description as string | null,
        studio: profile?.studio_name ?? "Fotógrafo",
        photos: list,
      };
    },
  });

  // pré-carrega a imagem vizinha quando o lightbox está aberto
  useEffect(() => {
    if (lightbox === null || !galleryQuery.data) return;
    const photos = galleryQuery.data.photos;
    const next = photos[(lightbox + 1) % photos.length];
    if (next) {
      const img = new Image();
      img.src = next.url;
    }
  }, [lightbox, galleryQuery.data]);

  if (galleryQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <p className="text-sm text-foreground/50">Carregando galeria...</p>
      </div>
    );
  }

  if (galleryQuery.isError) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background text-foreground">
        <div
          className="pointer-events-none absolute -left-32 top-0 size-[480px] rounded-full bg-secondary/20 blur-[120px]"
          style={{ animation: "drift 18s ease-in-out infinite" }}
        />
        <div className="relative z-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
            <Camera className="size-6" />
          </div>
          <h1 className="mt-5 font-display text-4xl tracking-tight">GALERIA INDISPONÍVEL</h1>
          <p className="mt-3 max-w-sm text-sm text-foreground/60">
            Esta galeria não existe, foi removida ou está privada. Confirme o link com o
            fotógrafo.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white"
          >
            Conhecer o LUMEN
          </button>
        </div>
      </div>
    );
  }

  const gallery = galleryQuery.data!;
  const photos = gallery.photos;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
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

      <header className="relative z-10 border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-lg text-primary-foreground">
              L
            </span>
            <span className="font-display text-2xl tracking-wide">LUMEN</span>
          </a>
          <span className="text-sm text-foreground/60">
            Fotos por <strong className="text-foreground">{gallery.studio}</strong>
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
            Galeria de evento
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-6xl">
            {gallery.title.toUpperCase()}
          </h1>
          <p className="mt-3 text-sm text-foreground/60">
            {gallery.eventDate &&
              new Date(gallery.eventDate + "T00:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            {gallery.eventDate && gallery.location && " · "}
            {gallery.location}
            {" · "}
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </p>
          {gallery.description && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-foreground/60">
              {gallery.description}
            </p>
          )}
        </div>

        <div className="mt-12 columns-2 gap-4 md:columns-3 lg:columns-4">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(i)}
              className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/10"
            >
              <img
                src={photo.url}
                alt=""
                loading="lazy"
                className="w-full transition group-hover:scale-[1.02]"
              />
            </button>
          ))}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-foreground/50 sm:flex-row">
          <span className="font-display text-base tracking-wide text-foreground">
            {gallery.studio}
          </span>
          <span>
            {photos.length} {photos.length === 1 ? "foto" : "fotos"} · Galeria feita com LUMEN
          </span>
        </div>
      </footer>

      {/* lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/95 p-4 backdrop-blur-xl"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Fechar"
            className="absolute right-5 top-5 grid size-11 place-items-center rounded-full border border-white/15 text-foreground/70 transition hover:text-foreground"
          >
            <X className="size-5" />
          </button>
          <img
            src={photos[lightbox].url}
            alt=""
            className="max-h-[85vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="absolute bottom-6 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox((lightbox - 1 + photos.length) % photos.length)}
              aria-label="Foto anterior"
              className="grid size-11 place-items-center rounded-full border border-white/15 transition hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="size-4" />
            </button>
            <span className="text-sm text-foreground/50">
              {lightbox + 1} / {photos.length}
            </span>
            <button
              onClick={() => setLightbox((lightbox + 1) % photos.length)}
              aria-label="Próxima foto"
              className="grid size-11 place-items-center rounded-full border border-white/15 transition hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="size-4 rotate-180" />
            </button>
          </div>
        </div>
      )}
      {/* garante que o queryClient existe mesmo sem uso direto */}
      <span className="hidden" data-qc={!!queryClient} />
    </div>
  );
}
