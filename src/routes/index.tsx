import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  return signedIn;
}

function Index() {
  const signedIn = useSignedIn();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* ambient gradient light */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-32 -top-40 size-[520px] rounded-full bg-secondary/25 blur-[120px]"
          style={{ animation: "drift 18s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-40 top-1/3 size-[560px] rounded-full bg-primary/20 blur-[130px]"
          style={{ animation: "drift2 22s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-40 left-1/3 size-[480px] rounded-full bg-[#3b82f6]/20 blur-[120px]"
          style={{ animation: "drift3 26s ease-in-out infinite" }}
        />
      </div>

      {/* diagonal frosted glass panels */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 right-1/4 h-[120%] w-40 -skew-x-12 border-l border-white/10 bg-white/5 backdrop-blur-xl"
          style={{ animation: "drift 20s ease-in-out infinite" }}
        />
        <div
          className="absolute left-1/3 top-0 h-[130%] w-24 -skew-x-12 border-l border-white/10 bg-white/[0.03] backdrop-blur-xl"
          style={{ animation: "drift2 24s ease-in-out infinite" }}
        />
        <div
          className="absolute right-1/4 top-0 h-[130%] w-16 -skew-x-12 border-l border-primary/20 bg-primary/10 backdrop-blur-xl"
          style={{ animation: "drift3 19s ease-in-out infinite" }}
        />
      </div>

      {/* nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-lg text-primary-foreground">
            L
          </span>
          <span className="font-display text-2xl tracking-wide">LUMEN</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-foreground/70 md:flex">
          <a href="#recursos" className="transition hover:text-primary">
            Recursos
          </a>
          <a href="#galeria" className="transition hover:text-primary">
            Galeria
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white"
            >
              Meu painel
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden text-sm text-foreground/70 transition hover:text-foreground sm:block"
              >
                Entrar
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-white"
              >
                Criar galeria
              </Link>
            </>
          )}
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-8">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-primary" /> Plataforma para fotógrafos
            </span>
            <h1 className="mt-6 font-display text-6xl leading-[0.92] tracking-tight sm:text-7xl lg:text-8xl">
              SEUS EVENTOS,
              <br />
              <span className="text-primary">SEU PALCO.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-foreground/70">
              Publique fotos de casamentos, shows e festas em galerias elegantes. Clientes baixam,
              compartilham e lembram de você.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/auth"
                className="rounded-full bg-primary px-7 py-3.5 font-semibold text-primary-foreground transition hover:bg-white"
              >
                Começar grátis
              </Link>
              <a
                href="#galeria"
                className="rounded-full border border-white/20 px-7 py-3.5 font-semibold text-foreground backdrop-blur-md transition hover:border-primary hover:text-primary"
              >
                Ver demo
              </a>
            </div>
            <div className="mt-10 flex gap-8 border-t border-white/10 pt-6">
              <div>
                <div className="font-display text-3xl text-primary">Instantâneo</div>
                <div className="text-xs uppercase tracking-widest text-foreground/50">Upload</div>
              </div>
              <div>
                <div className="font-display text-3xl text-primary">Link único</div>
                <div className="text-xs uppercase tracking-widest text-foreground/50">
                  Compartilhamento
                </div>
              </div>
              <div>
                <div className="font-display text-3xl text-primary">Alta resolução</div>
                <div className="text-xs uppercase tracking-widest text-foreground/50">Entrega</div>
              </div>
            </div>
          </div>

          {/* hero glass card */}
          <div className="lg:col-span-6">
            <div className="relative">
              <div className="absolute -inset-3 -rotate-3 rounded-3xl bg-gradient-to-br from-primary/30 to-secondary/30 blur-md" />
              <div className="relative rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur-2xl">
                <div className="flex items-center justify-between px-2 pb-3">
                  <span className="text-sm font-semibold">Casamento de Ana &amp; Pedro</span>
                  <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                    Ao vivo
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <img
                    src={hero1}
                    alt="Noiva rindo em luz quente"
                    className="aspect-[3/4] w-full rounded-xl object-cover"
                  />
                  <img
                    src={hero2}
                    alt="Primeira dança dos noivos com luzes ao fundo"
                    className="aspect-[3/4] w-full rounded-xl object-cover"
                  />
                  <img
                    src={hero3}
                    alt="Mesa de casamento com velas e flores"
                    className="aspect-[3/4] w-full rounded-xl object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between px-2">
                  <span className="text-xs text-foreground/50">248 fotos · 12 vídeos</span>
                  <span className="text-xs font-semibold text-primary">Abrir galeria →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section id="recursos" className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            TUDO QUE VOCÊ PRECISA
          </h2>
          <span className="hidden text-sm text-foreground/50 sm:block">
            Sem código, sem complicação
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <span className="font-display text-xl">01</span>
            </div>
            <h3 className="text-lg font-semibold">Galerias instantâneas</h3>
            <p className="mt-2 text-sm text-foreground/60">
              Envie suas fotos e receba um link pronto para compartilhar em segundos.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 grid size-12 place-items-center rounded-xl bg-secondary/15 text-secondary">
              <span className="font-display text-xl">02</span>
            </div>
            <h3 className="text-lg font-semibold">Entrega em alta</h3>
            <p className="mt-2 text-sm text-foreground/60">
              Clientes baixam em resolução original, direto da galeria do evento.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <span className="font-display text-xl">03</span>
            </div>
            <h3 className="text-lg font-semibold">Sua marca</h3>
            <p className="mt-2 text-sm text-foreground/60">
              O nome do seu estúdio aparece em cada galeria que você compartilha.
            </p>
          </div>
        </div>
      </section>

      {/* demo gallery preview */}
      <section id="galeria" className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
                Exemplo de galeria
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
                CASAMENTO DE ANA &amp; PEDRO
              </h2>
            </div>
            <Link
              to="/auth"
              className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
            >
              Criar a minha
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <img
              src={hero2}
              alt="Primeira dança dos noivos"
              className="col-span-2 aspect-[4/3] w-full rounded-2xl object-cover sm:col-span-2"
              loading="lazy"
            />
            <img
              src={hero1}
              alt="Noiva rindo"
              className="aspect-square w-full rounded-2xl object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <span className="font-display text-xl tracking-wide">LUMEN</span>
          <span className="text-sm text-foreground/50">
            © 2026 LUMEN · Feito para fotógrafos de eventos
          </span>
        </div>
      </footer>
    </div>
  );
}
