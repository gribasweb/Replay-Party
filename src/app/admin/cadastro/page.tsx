"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import { formatCPF, isValidCPF } from "@/lib/cpf";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface Done {
  name: string;
  tier: string;
  email: string;
}

export default function AdminCadastroPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<"pista" | "vip">("pista");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done[]>([]);

  useEffect(() => {
    fetch("/api/operator/session")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.ok))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");
    const r = await fetch("/api/operator/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!r.ok) {
      setLoginErr("Senha incorreta.");
      return;
    }
    setPassword("");
    setAuthed(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 3) return setError("Informe o nome completo.");
    if (!isValidCPF(cpf)) return setError("CPF inválido. Confira os números.");
    if (!emailOk(email)) return setError("E-mail inválido.");

    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/cortesia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, people: [{ name: name.trim(), cpf, email: email.trim() }] }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setAuthed(false);
        return;
      }
      if (!r.ok || !d.ok) {
        setError(d.error ?? "Não foi possível gerar o ingresso.");
        return;
      }
      setDone((prev) => [{ name: name.trim(), tier: tier === "vip" ? "VIP" : "Pista", email: email.trim() }, ...prev]);
      setName("");
      setCpf("");
      setEmail("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5">
        <p className="text-sm text-ash">Carregando...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5">
        <form onSubmit={login} className="w-full max-w-sm space-y-3">
          <h1 className="font-display text-3xl text-chalk uppercase">Emitir ingresso</h1>
          <p className="text-sm text-ash">Entre com a senha de admin.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de admin"
            className="w-full border border-grape bg-coal px-4 py-3 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
            style={{ borderRadius: "var(--radius-stamp)" }}
          />
          {loginErr && <p className="text-xs text-magenta">{loginErr}</p>}
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

  return (
    <main className="min-h-[100dvh] bg-ink px-5 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-4xl text-chalk uppercase">Emitir ingresso</h1>
        <p className="mt-1 text-sm text-ash">
          Preencha os dados e clique em gerar. O ingresso é criado e enviado por e-mail na hora, sem cobrança.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {/* Setor */}
          <div>
            <span className="mb-2 block font-mono text-[11px] tracking-widest text-ash uppercase">Setor</span>
            <div className="grid grid-cols-2 gap-3">
              {(["pista", "vip"] as const).map((t) => {
                const active = tier === t;
                const activeCls =
                  t === "vip"
                    ? "border-magenta bg-magenta/15 text-magenta"
                    : "border-violet bg-violet/15 text-violet";
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`border px-4 py-3 font-display text-xl uppercase transition-colors ${
                      active ? activeCls : "border-grape bg-coal text-ash hover:border-ash"
                    }`}
                    style={{ borderRadius: "var(--radius-stamp)" }}
                  >
                    {t === "vip" ? "VIP" : "Pista"}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Nome completo" value={name} onChange={setName} placeholder="Nome do participante" />
          <Field
            label="CPF"
            value={cpf}
            onChange={(v) => setCpf(formatCPF(v))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
          />
          <Field
            label="E-mail"
            value={email}
            onChange={setEmail}
            placeholder="email@exemplo.com"
            type="email"
            inputMode="email"
          />

          {error && (
            <p className="border border-magenta/50 bg-magenta/10 px-4 py-3 text-sm text-chalk" style={{ borderRadius: "var(--radius-stamp)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="glow-magenta flex w-full items-center justify-center gap-2 bg-magenta px-6 py-4 text-sm font-bold tracking-wide text-ink uppercase transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            {submitting ? "Gerando..." : "Gerar e enviar ingresso"}
            {!submitting && <PaperPlaneTilt weight="bold" className="h-5 w-5" />}
          </button>
        </form>

        {done.length > 0 && (
          <div className="mt-8">
            <h2 className="font-mono text-xs tracking-widest text-violet uppercase">Emitidos agora</h2>
            <ul className="mt-3 space-y-2">
              {done.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 border border-grape/60 bg-plum px-4 py-3"
                  style={{ borderRadius: "var(--radius-stamp)" }}
                >
                  <CheckCircle weight="fill" className="h-5 w-5 shrink-0 text-violet" />
                  <span className="min-w-0 flex-1 truncate text-sm text-chalk">
                    {d.name} <span className="text-ash">· {d.tier}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-ash">enviado</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm">
          <Link href="/admin/vendas" className="text-ash hover:text-chalk">Vendas</Link>
          <Link href="/admin/cupons" className="text-ash hover:text-chalk">Cupons</Link>
          <Link href="/admin/stats" className="text-ash hover:text-chalk">Acessos</Link>
          <Link href="/checkin" className="text-ash hover:text-chalk">Check-in</Link>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "email" | "text";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] tracking-widest text-ash uppercase">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-grape bg-coal px-4 py-3 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
        style={{ borderRadius: "var(--radius-stamp)" }}
      />
    </label>
  );
}
