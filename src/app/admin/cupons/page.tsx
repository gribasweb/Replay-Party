"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Power, Prohibit } from "@phosphor-icons/react";
import { brl } from "@/lib/event";

interface Coupon {
  id: string;
  code: string;
  pistaPriceCents: number;
  vipPriceCents: number;
  active: boolean;
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/coupons", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    setAuthed(true);
  }, []);

  useEffect(() => {
    load().catch(() => setError("Não foi possível carregar os cupons.")).finally(() => setChecking(false));
  }, [load]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/operator/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Senha incorreta.");
      return;
    }
    setPassword("");
    await load();
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const normalized = code.trim().toUpperCase();
    if (!normalized) return setError("Informe o código do cupom.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar o cupom.");
        return;
      }
      setCode("");
      setCoupons((previous) => [data.coupon, ...previous]);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (coupon: Coupon) => {
    setError("");
    const res = await fetch("/api/admin/coupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Não foi possível atualizar o cupom.");
      return;
    }
    setCoupons((previous) => previous.map((item) => (item.id === coupon.id ? data.coupon : item)));
  };

  if (checking) {
    return <main className="grid min-h-[100dvh] place-items-center bg-ink"><p className="text-sm text-ash">Carregando...</p></main>;
  }

  if (!authed) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5">
        <form onSubmit={login} className="w-full max-w-sm space-y-3">
          <h1 className="font-display text-3xl text-chalk uppercase">Cupons</h1>
          <p className="text-sm text-ash">Entre com a senha de admin para gerir os códigos.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha de admin"
            className="w-full border border-grape bg-coal px-4 py-3 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
            style={{ borderRadius: "var(--radius-stamp)" }}
          />
          {error && <p className="text-xs text-magenta">{error}</p>}
          <button type="submit" className="w-full bg-magenta px-6 py-3 text-sm font-bold tracking-wide text-ink uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-ink px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl text-chalk uppercase">Cupons</h1>
        <p className="mt-1 text-sm text-ash">Sem limite de usos ou de CPF. Todo cupom ativo aplica Pista por {brl(30)} e VIP por {brl(75)}.</p>

        <form onSubmit={create} className="mt-7 flex flex-wrap gap-3 border border-grape bg-plum p-4" style={{ borderRadius: "var(--radius-stamp)" }}>
          <label className="min-w-[13rem] flex-1">
            <span className="mb-1.5 block font-mono text-[11px] tracking-widest text-ash uppercase">Novo código</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="EX.: REPLAYDJOFF"
              maxLength={40}
              className="w-full border border-grape bg-ink px-4 py-3 font-mono text-sm uppercase text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
              style={{ borderRadius: "var(--radius-stamp)" }}
            />
          </label>
          <button type="submit" disabled={saving} className="mt-auto flex h-11 items-center gap-2 bg-magenta px-5 text-xs font-bold tracking-wide text-ink uppercase disabled:opacity-60" style={{ borderRadius: "var(--radius-stamp)" }}>
            <Plus weight="bold" className="h-4 w-4" /> {saving ? "Criando..." : "Criar"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-magenta">{error}</p>}

        <div className="mt-5 space-y-3">
          {coupons.length === 0 ? (
            <p className="py-8 text-center text-sm text-ash">Nenhum cupom criado.</p>
          ) : coupons.map((coupon) => (
            <article key={coupon.id} className="flex flex-wrap items-center justify-between gap-4 border border-grape bg-plum p-4" style={{ borderRadius: "var(--radius-stamp)" }}>
              <div>
                <div className="font-mono text-lg font-bold tracking-wider text-chalk">{coupon.code}</div>
                <div className="mt-1 font-mono text-xs text-ash">Pista {brl(coupon.pistaPriceCents / 100)} · VIP {brl(coupon.vipPriceCents / 100)}</div>
              </div>
              <button
                type="button"
                onClick={() => toggle(coupon)}
                aria-label={coupon.active ? "Desativar cupom" : "Ativar cupom"}
                title={coupon.active ? "Desativar cupom" : "Ativar cupom"}
                className={`flex h-10 items-center gap-2 px-4 text-xs font-bold tracking-wide uppercase ${coupon.active ? "bg-violet text-ink" : "border border-grape text-ash"}`}
                style={{ borderRadius: "var(--radius-stamp)" }}
              >
                {coupon.active ? <Power weight="bold" className="h-4 w-4" /> : <Prohibit weight="bold" className="h-4 w-4" />}
                {coupon.active ? "Ativo" : "Inativo"}
              </button>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center gap-5 text-sm">
          <Link href="/admin/cadastro" className="text-ash hover:text-chalk">Cortesias</Link>
          <Link href="/admin/vendas" className="text-ash hover:text-chalk">Vendas</Link>
          <Link href="/admin/stats" className="text-ash hover:text-chalk">Acessos</Link>
        </div>
      </div>
    </main>
  );
}
