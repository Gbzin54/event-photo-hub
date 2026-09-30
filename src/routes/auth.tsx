import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — LUMEN" },
      {
        name: "description",
        content: "Entre na sua conta e publique as fotos dos seus eventos.",
      },
      { property: "og:title", content: "Entrar — LUMEN" },
      {
        property: "og:description",
        content: "Entre na sua conta e publique as fotos dos seus eventos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function translateError(message: string) {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("already registered")) return "Este e-mail já está cadastrado. Faça login.";
  if (message.includes("Password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (message.includes("rate limit")) return "Muitas tentativas. Aguarde um momento.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studioName, setStudioName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(translateError(error.message));
        setBusy(false);
        return;
      }
      navigate({ to: "/dashboard" });
      return;
    }
    const options: { emailRedirectTo: string; data?: Record<string, string> } = {
      emailRedirectTo: window.location.origin,
    };
    if (studioName.trim()) options.data = { studio_name: studioName.trim() };
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    if (error) {
      setError(translateError(error.message));
      setBusy(false);
      return;
    }
    if (!data.session) {
      // Email confirmation is on: the account exists but is not signed in yet.
      setSent(true);
      setBusy(false);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("Não foi possível entrar com o Google. Tente novamente.");
  }

  const inputClass =
    "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none backdrop-blur-md transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* ambient light */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 top-0 size-[480px] rounded-full bg-secondary/20 blur-[120px]"
          style={{ animation: "drift 18s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-32 bottom-0 size-[480px] rounded-full bg-primary/15 blur-[120px]"
          style={{ animation: "drift2 22s ease-in-out infinite" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <a
          href="/"
          className="mb-8 flex items-center justify-center gap-2 transition hover:opacity-80"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-lg text-primary-foreground">
            L
          </span>
          <span className="font-display text-2xl tracking-wide">LUMEN</span>
        </a>

        <div className="rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-2xl">
          {sent ? (
            <div className="text-center">
              <h1 className="font-display text-3xl tracking-tight">CONFIRME SEU E-MAIL</h1>
              <p className="mt-4 text-sm text-foreground/70">
                Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para
                ativar sua conta e entrar.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setMode("signin");
                }}
                className="mt-6 text-sm font-medium text-primary hover:underline"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl tracking-tight">
                {mode === "signin" ? "ENTRAR" : "CRIAR CONTA"}
              </h1>
              <p className="mt-2 text-sm text-foreground/60">
                {mode === "signin"
                  ? "Bem-vindo de volta ao seu estúdio."
                  : "Comece a publicar suas galerias em minutos."}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <input
                    type="text"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    placeholder="Nome do seu estúdio"
                    className={inputClass}
                  />
                )}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className={inputClass}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className={inputClass}
                />

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white disabled:opacity-60"
                >
                  {busy ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta grátis"}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs text-foreground/40">
                <span className="h-px flex-1 bg-white/10" />
                ou
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <button
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.25-4.53 6.16-4.53z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09L2.18 7.07C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.86-3c-1.08.72-2.45 1.16-3.42 1.16-2.86 0-5.29-1.93-6.16-4.53l-3.66 2.84C3.99 20.53 7.7 23 12 23z"
                  />
                </svg>
                Continuar com Google
              </button>

              <p className="mt-6 text-center text-sm text-foreground/60">
                {mode === "signin" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setError(null);
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  {mode === "signin" ? "Criar conta" : "Entrar"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
