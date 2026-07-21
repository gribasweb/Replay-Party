"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowClockwise, CheckCircle, MagnifyingGlass, WhatsappLogo } from "@phosphor-icons/react";
import { brl } from "@/lib/event";

interface Participant {
  name: string;
  cpf: string;
  tier: string;
  used: boolean;
}
interface Order {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cpfMasked: string;
  totalCents: number;
  method: string;
  couponCode: string;
  createdAt: string;
  participants: Participant[];
}
interface Data {
  summary: { orders: number; tickets: number; revenueCents: number; checkedIn: number };
  byTier: { tier: string; qty: number; revenueCents: number }[];
  orders: Order[];
}

const METHOD: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão",
  debit_card: "Cartão",
  cortesia: "Cortesia",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export default function AdminVendasPage() {
  const [data, setData] = useState<Data | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/vendas", { cache: "no-store" });
      if (r.status === 401) {
        setNeedLogin(true);
        setData(null);
        return;
      }
      setData((await r.json()) as Data);
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

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.orders;
    const qd = onlyDigits(q);
    return data.orders.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        (qd.length >= 2 && onlyDigits(o.whatsapp).includes(qd)) ||
        o.participants.some((p) => p.name.toLowerCase().includes(q)),
    );
  }, [data, query]);

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
          <h1 className="font-display text-3xl text-chalk uppercase">Vendas</h1>
          <p className="text-sm text-ash">Entre com a senha de admin para ver os compradores.</p>
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

  const s = data?.summary;

  return (
    <main className="min-h-[100dvh] bg-ink px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl text-chalk uppercase">Vendas</h1>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 border border-grape px-4 py-2 text-xs font-bold tracking-wide text-chalk uppercase hover:border-magenta"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            <ArrowClockwise weight="bold" className="h-4 w-4" /> Atualizar
          </button>
        </div>
        <p className="mt-1 text-sm text-ash">Quem já comprou. CPF parcial por privacidade (LGPD).</p>

        {/* Resumo */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric value={String(s?.orders ?? 0)} label="Compradores" accent="text-chalk" />
          <Metric value={String(s?.tickets ?? 0)} label="Ingressos" accent="text-magenta" />
          <Metric value={brl((s?.revenueCents ?? 0) / 100)} label="Arrecadado" accent="text-violet" mono />
        </div>

        {/* Por setor */}
        {data && data.byTier.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.byTier.map((t) => (
              <span
                key={t.tier}
                className="border border-grape/70 bg-plum px-3 py-1.5 font-mono text-xs text-ash"
                style={{ borderRadius: "var(--radius-stamp)" }}
              >
                <span className="text-chalk">{t.tier}</span> · {t.qty} ing. · {brl(t.revenueCents / 100)}
              </span>
            ))}
            {s && s.tickets > 0 && (
              <span
                className="border border-violet/40 bg-violet/10 px-3 py-1.5 font-mono text-xs text-violet"
                style={{ borderRadius: "var(--radius-stamp)" }}
              >
                {s.checkedIn}/{s.tickets} entraram
              </span>
            )}
          </div>
        )}

        {/* Busca */}
        <div className="relative mt-6">
          <MagnifyingGlass weight="bold" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp"
            className="w-full border border-grape bg-coal py-3 pl-11 pr-4 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
            style={{ borderRadius: "var(--radius-stamp)" }}
          />
        </div>

        {/* Lista */}
        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-ash">
              {data && data.orders.length === 0 ? "Nenhuma compra ainda." : "Nada encontrado."}
            </p>
          ) : (
            filtered.map((o) => {
              const tiers = [...new Set(o.participants.map((p) => p.tier))];
              return (
              <article
                key={o.id}
                className="border border-grape bg-plum p-4"
                style={{ borderRadius: "var(--radius-stamp)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 truncate font-display text-xl leading-tight text-chalk">{o.name}</span>
                      {tiers.map((t) => (
                        <span
                          key={t}
                          className={`shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest uppercase ${
                            t === "VIP" ? "bg-magenta/20 text-magenta" : "bg-violet/20 text-violet"
                          }`}
                          style={{ borderRadius: "var(--radius-stamp)" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-xs text-ash">
                      <span className="truncate">{o.email}</span>
                      {o.whatsapp && (
                        <span className="flex items-center gap-1">
                          <WhatsappLogo weight="bold" className="h-3.5 w-3.5" /> {o.whatsapp}
                        </span>
                      )}
                      <span>CPF {o.cpfMasked}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-lg text-chalk">{brl(o.totalCents / 100)}</div>
                    <span
                      className={`mt-1 inline-block px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase ${
                        o.method === "cortesia" ? "bg-violet/15 text-violet" : "bg-magenta/15 text-magenta"
                      }`}
                      style={{ borderRadius: "var(--radius-stamp)" }}
                    >
                      {METHOD[o.method] ?? o.method}
                    </span>
                    {o.couponCode && (
                      <span className="mt-1 block font-mono text-[10px] tracking-widest text-violet uppercase">
                        Cupom {o.couponCode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 border-t border-grape/50 pt-3">
                  <div className="mb-2 font-mono text-[10px] tracking-widest text-ash uppercase">
                    {o.participants.length} {o.participants.length === 1 ? "ingresso" : "ingressos"} · {fmtDate(o.createdAt)}
                  </div>
                  <ul className="space-y-1.5">
                    {o.participants.map((p, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="min-w-0 truncate text-chalk">
                          {p.name} <span className="text-ash">· {p.tier} · {p.cpf}</span>
                        </span>
                        {p.used ? (
                          <span className="flex shrink-0 items-center gap-1 text-violet">
                            <CheckCircle weight="fill" className="h-3.5 w-3.5" /> Entrou
                          </span>
                        ) : (
                          <span className="shrink-0 text-ash/60">Não entrou</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
              );
            })
          )}
        </div>

        <div className="mt-10 flex justify-center gap-5 text-sm">
          <Link href="/admin/cupons" className="text-ash hover:text-chalk">Cupons</Link>
          <Link href="/admin/stats" className="text-ash hover:text-chalk">Acessos</Link>
          <Link href="/checkin" className="text-ash hover:text-chalk">Check-in</Link>
          <Link href="/admin/mp" className="text-ash hover:text-chalk">Mercado Pago</Link>
        </div>
      </div>
    </main>
  );
}

function Metric({ value, label, accent, mono }: { value: string; label: string; accent: string; mono?: boolean }) {
  return (
    <div className="border border-grape bg-plum p-4" style={{ borderRadius: "var(--radius-stamp)" }}>
      <div className={`${mono ? "font-mono text-2xl" : "font-display text-4xl"} leading-none ${accent}`}>{value}</div>
      <div className="mt-1 font-mono text-[10px] tracking-widest text-ash uppercase">{label}</div>
    </div>
  );
}
