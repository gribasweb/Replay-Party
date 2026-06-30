"use client";

import { useCallback, useEffect, useState } from "react";

interface Stats {
  totalViews: number;
  totalVisitors: number;
  todayViews: number;
  todayVisitors: number;
  byDay: { day: string; views: number; visitors: number }[];
  sources: { source: string; visitors: number; views: number }[];
}

const SOURCE_LABEL: Record<string, string> = {
  direto: "Direto (link/digitado)",
  interno: "Navegação interna",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  tiktok: "TikTok",
  google: "Google",
  bing: "Bing",
  linktree: "Linktree",
  twitter: "Twitter / X",
  youtube: "YouTube",
  outro: "Outros",
};

function label(s: string) {
  return SOURCE_LABEL[s] ?? s;
}

function Bar({ value, max, accent }: { value: number; max: number; accent: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-coal">
      <div className={`h-full rounded-full ${accent}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/track/stats", { cache: "no-store" });
      if (r.status === 401) {
        setNeedLogin(true);
        setStats(null);
        return;
      }
      const d = (await r.json()) as Stats;
      setStats(d);
      setNeedLogin(false);
    } catch {
      setError("Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const r = await fetch("/api/operator/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!r.ok) {
      setError("Senha incorreta.");
      return;
    }
    setPassword("");
    load();
  };

  if (loading) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5">
        <p className="text-sm text-ash">Carregando...</p>
      </main>
    );
  }

  if (needLogin) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5">
        <form onSubmit={login} className="w-full max-w-sm space-y-3">
          <h1 className="font-display text-3xl text-chalk uppercase">Acessos</h1>
          <p className="text-sm text-ash">Entre com a senha de admin para ver as estatísticas.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de admin"
            className="w-full border border-grape bg-coal px-4 py-3 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
            style={{ borderRadius: "var(--radius-stamp)" }}
          />
          {error && <p className="text-xs text-magenta">{error}</p>}
          <button
            type="submit"
            className="w-full bg-magenta px-6 py-3 text-sm font-bold tracking-wide text-ink uppercase"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  const maxSource = Math.max(1, ...(stats?.sources.map((s) => s.visitors) ?? [1]));
  const maxDay = Math.max(1, ...(stats?.byDay.map((d) => d.visitors) ?? [1]));

  return (
    <main className="min-h-[100dvh] bg-ink px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl text-chalk uppercase">Acessos</h1>
          <button
            type="button"
            onClick={load}
            className="border border-grape px-4 py-2 text-xs font-bold tracking-wide text-chalk uppercase hover:border-magenta"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            Atualizar
          </button>
        </div>
        <p className="mt-1 text-sm text-ash">Contagem anônima de visitas ao site.</p>

        {/* Números */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="Visitantes únicos" value={stats?.totalVisitors ?? 0} accent="text-magenta" />
          <Card label="Acessos totais" value={stats?.totalViews ?? 0} accent="text-chalk" />
          <Card label="Únicos hoje" value={stats?.todayVisitors ?? 0} accent="text-violet" />
          <Card label="Acessos hoje" value={stats?.todayViews ?? 0} accent="text-chalk" />
        </div>

        {/* De onde vieram */}
        <section className="mt-8">
          <h2 className="font-mono text-xs tracking-widest text-violet uppercase">De onde vieram</h2>
          <div className="mt-3 space-y-3">
            {stats?.sources.length ? (
              stats.sources.map((s) => (
                <div key={s.source}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-chalk">{label(s.source)}</span>
                    <span className="font-mono text-xs text-ash">
                      {s.visitors} {s.visitors === 1 ? "pessoa" : "pessoas"}
                    </span>
                  </div>
                  <Bar value={s.visitors} max={maxSource} accent="bg-magenta" />
                </div>
              ))
            ) : (
              <p className="text-sm text-ash">Ainda sem dados.</p>
            )}
          </div>
        </section>

        {/* Por dia */}
        <section className="mt-8">
          <h2 className="font-mono text-xs tracking-widest text-violet uppercase">Últimos dias</h2>
          <div className="mt-3 space-y-3">
            {stats?.byDay.length ? (
              stats.byDay.map((d) => (
                <div key={d.day}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-mono text-chalk">{d.day}</span>
                    <span className="font-mono text-xs text-ash">
                      {d.visitors} únicos · {d.views} acessos
                    </span>
                  </div>
                  <Bar value={d.visitors} max={maxDay} accent="bg-violet" />
                </div>
              ))
            ) : (
              <p className="text-sm text-ash">Ainda sem dados.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="border border-grape bg-plum p-4" style={{ borderRadius: "var(--radius-stamp)" }}>
      <div className={`font-display text-4xl leading-none ${accent}`}>{value}</div>
      <div className="mt-1 font-mono text-[10px] tracking-widest text-ash uppercase">{label}</div>
    </div>
  );
}
