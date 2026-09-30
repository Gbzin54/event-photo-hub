import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Camera,
  Globe,
  Images,
  LogOut,
  MapPin,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/photos";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Meu painel — LUMEN" },
      { name: "description", content: "Gerencie os eventos e galerias de fotos do seu estúdio." },
      { property: "og:title", content: "Meu painel — LUMEN" },
      {
        property: "og:description",
        content: "Gerencie os eventos e galerias de fotos do seu estúdio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

interface EventRow {
  id: string;
  title: string;
  slug: string;
  event_date: string | null;
  location: string | null;
  is_public: boolean;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [studioName, setStudioName] = useState("Meu estúdio");
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      setUserId(user.id);
      // Garante que o perfil existe (criado no primeiro acesso)
      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) {
        const name = (user.user_metadata?.studio_name as string | undefined) ?? "Meu estúdio";
        await supabase.from("profiles").insert({ id: user.id, studio_name: name });
        setStudioName(name);
      } else {
        setStudioName(profile['studio_name'] ?? "Meu estúdio");
      }
    });
  }, []);

  const eventsQuery = useQuery({
    queryKey: ["events", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, slug, event_date, location, is_public")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EventRow[];
    },
  });

  const events = eventsQuery.data ?? [];

  const coversQuery = useQuery({
    queryKey: ["covers", events.map((e) => e.id).join(",")],
    enabled: events.length > 0 && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("event_id, storage_path")
        .eq("user_id", userId!);
      if (error) throw error;
      const first: Record<string, string> = {};
      for (const p of data as { event_id: string; storage_path: string }[]) {
        if (!first[p.event_id]) first[p.event_id] = p.storage_path;
      }
      const map: Record<string, string | null> = {};
      await Promise.all(
        Object.entries(first).map(async ([eventId, path]) => {
          map[eventId] = await signedUrl(path);
        }),
      );
      return map;
    },
  });

  const photoCountQuery = useQuery({
    queryKey: ["photo-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId!);
      if (error) throw error;
      return count ?? 0;
    },
  });

  async function handleCreateEvent(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !userId) return;
    setBusy(true);
    setError(null);
    const slug = `${slugify(title) || "evento"}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: userId,
        title: title.trim(),
        slug,
        event_date: date || null,
        location: location.trim() || null,
        description: description.trim() || null,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setShowNew(false);
    setTitle("");
    setDate("");
    setLocation("");
    setDescription("");
    queryClient.invalidateQueries({ queryKey: ["events"] });
    navigate({ to: "/eventos/$id", params: { id: data.id } });
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none backdrop-blur-md transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 -top-40 size-[520px] rounded-full bg-secondary/20 blur-[120px]"
          style={{ animation: "drift 18s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-40 top-1/3 size-[560px] rounded-full bg-primary/15 blur-[130px]"
          style={{ animation: "drift2 22s ease-in-out infinite" }}
        />
      </div>

      {/* header */}
      <header className="relative z-10 border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-lg text-primary-foreground">
              L
            </span>
            <span className="hidden font-display text-2xl tracking-wide sm:block">LUMEN</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/settings"
              aria-label="Configurações"
              className="grid size-10 place-items-center rounded-full border border-white/15 text-foreground/70 transition hover:border-primary hover:text-primary"
            >
              <Settings className="size-4" />
            </Link>
            <button
              onClick={handleSignOut}
              aria-label="Sair"
              className="grid size-10 place-items-center rounded-full border border-white/15 text-foreground/70 transition hover:border-destructive hover:text-destructive"
            >
              <LogOut className="size-4" />
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white"
            >
              + Novo evento
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
              Painel do fotógrafo
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
              {studioName.toUpperCase()}
            </h1>
          </div>
          <div className="flex gap-8 border-t border-white/10 pt-4">
            <div>
              <div className="font-display text-3xl text-primary">{events.length}</div>
              <div className="text-xs uppercase tracking-widest text-foreground/50">Eventos</div>
            </div>
            <div>
              <div className="font-display text-3xl text-primary">
                {photoCountQuery.data ?? "—"}
              </div>
              <div className="text-xs uppercase tracking-widest text-foreground/50">Fotos</div>
            </div>
          </div>
        </div>

        {eventsQuery.isLoading ? (
          <p className="mt-16 text-center text-sm text-foreground/50">Carregando eventos...</p>
        ) : events.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-white/15 bg-white/5 px-6 py-16 text-center backdrop-blur-xl">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
              <Camera className="size-6" />
            </div>
            <h2 className="mt-5 font-display text-2xl tracking-tight">NENHUM EVENTO AINDA</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/60">
              Crie seu primeiro evento, envie as fotos e compartilhe o link com o cliente.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="mt-6 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white"
            >
              Criar primeiro evento
            </button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const cover = coversQuery.data?.[event.id];
              return (
                <Link
                  key={event.id}
                  to="/eventos/$id"
                  params={{ id: event.id }}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="relative aspect-[16/10] w-full bg-steel">
                    {cover ? (
                      <img
                        src={cover}
                        alt={event.title}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-foreground/30">
                        <Images className="size-8" />
                      </div>
                    )}
                    {event.is_public && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary backdrop-blur">
                        <Globe className="size-3" /> Público
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/50">
                      <Calendar className="size-3" />
                      {event.event_date
                        ? new Date(event.event_date + "T00:00:00").toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Sem data"}
                    </p>
                    <h3 className="mt-2 font-display text-xl tracking-tight">{event.title}</h3>
                    {event.location && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/60">
                        <MapPin className="size-3.5" /> {event.location}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* novo evento modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-popover p-8 backdrop-blur-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-3xl tracking-tight">NOVO EVENTO</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  Depois você envia as fotos e compartilha o link.
                </p>
              </div>
              <button
                onClick={() => setShowNew(false)}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-full border border-white/15 text-foreground/60 transition hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="mt-6 space-y-4">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do evento (ex.: Casamento Ana & Pedro)"
                className={inputClass}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Local"
                  className={inputClass}
                />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={3}
                className={inputClass}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white disabled:opacity-60"
              >
                {busy ? "Criando..." : "Criar evento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
