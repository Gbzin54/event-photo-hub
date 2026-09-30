import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — LUMEN" },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Configurações — LUMEN" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [studioName, setStudioName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("studio_name, bio")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        setStudioName(profile.studio_name ?? "");
        setBio(profile.bio ?? "");
      } else {
        const name = (user.user_metadata?.studio_name as string | undefined) ?? "Meu estúdio";
        await supabase.from("profiles").insert({ id: user.id, studio_name: name });
        setStudioName(name);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({ studio_name: studioName.trim() || "Meu estúdio", bio: bio.trim() || null })
      .eq("id", userId);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none backdrop-blur-md transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 top-0 size-[480px] rounded-full bg-secondary/20 blur-[120px]"
          style={{ animation: "drift 18s ease-in-out infinite" }}
        />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center gap-2 text-sm text-foreground/70 transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Painel
          </button>
          <span className="font-display text-2xl tracking-wide">LUMEN</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-4xl tracking-tight">CONFIGURAÇÕES</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Essas informações aparecem nas galerias que você compartilha.
        </p>

        {loading ? (
          <p className="mt-10 text-sm text-foreground/50">Carregando...</p>
        ) : (
          <form onSubmit={handleSave} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                Nome do estúdio
              </label>
              <input
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                placeholder="Ex.: Estúdio Vale & Mar"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/60">
                Sobre o estúdio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Uma frase sobre o seu trabalho (opcional)"
                className={inputClass}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white disabled:opacity-60"
            >
              {saved ? (
                <>
                  <Check className="size-4" /> Salvo!
                </>
              ) : busy ? (
                "Salvando..."
              ) : (
                "Salvar"
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
