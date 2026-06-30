"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MagnifyingGlass, Ticket } from "@phosphor-icons/react";
import { formatCPF, isValidCPF } from "@/lib/cpf";

interface TicketRow {
  token: string;
  holderName: string;
  tierName: string;
  status: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  valid: { label: "Valido", cls: "border-violet/40 bg-violet/10 text-violet" },
  used: { label: "Utilizado", cls: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
  cancelled: { label: "Cancelado", cls: "border-ash/40 bg-ash/10 text-ash" },
};

export default function MeusIngressosPage() {
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);

  const resetLookup = () => {
    setCodeRequested(false);
    setCode("");
    setTickets(null);
    setMessage("");
  };

  const requestCode = async () => {
    setError("");
    setMessage("");
    if (!email.trim() || !isValidCPF(cpf)) {
      setError("Informe um e-mail e um CPF validos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/meus-ingressos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cpf }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nao foi possivel enviar o codigo.");
        return;
      }
      setCodeRequested(true);
      setTickets(null);
      setMessage("Se os dados estiverem corretos, enviamos um codigo para o e-mail do comprador.");
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setMessage("");
    if (code.replace(/\D/g, "").length !== 6) {
      setError("Informe o codigo de 6 digitos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/meus-ingressos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cpf, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nao foi possivel buscar.");
        setTickets(null);
        return;
      }
      setTickets(data.tickets ?? []);
      setCodeRequested(false);
    } catch {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (codeRequested) {
      verifyCode();
    } else {
      requestCode();
    }
  };

  return (
    <main className="min-h-[100dvh] bg-ink">
      <header className="border-b border-grape/50">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-sm text-ash hover:text-chalk">
            <ArrowLeft weight="bold" className="h-4 w-4" />
            Inicio
          </Link>
          <span className="font-display text-lg tracking-wide text-chalk">
            REPLAY<span className="text-magenta">PARTY</span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-5 py-10">
        <h1 className="font-display text-4xl text-chalk uppercase sm:text-5xl">Meus ingressos</h1>
        <p className="mt-3 text-ash">
          Consulte com o <strong className="text-chalk">e-mail</strong> e o{" "}
          <strong className="text-chalk">CPF do comprador</strong> usados na compra.
        </p>

        <div className="mt-8 grid gap-4">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] tracking-widest text-ash uppercase">E-mail</span>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                resetLookup();
              }}
              placeholder="voce@email.com"
              className="w-full border border-grape bg-coal px-4 py-3 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
              style={{ borderRadius: "var(--radius-stamp)" }}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] tracking-widest text-ash uppercase">CPF</span>
            <input
              inputMode="numeric"
              maxLength={14}
              value={cpf}
              onChange={(e) => {
                setCpf(formatCPF(e.target.value));
                resetLookup();
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="000.000.000-00"
              className="w-full border border-grape bg-coal px-4 py-3 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
              style={{ borderRadius: "var(--radius-stamp)" }}
            />
          </label>

          {codeRequested && (
            <label className="block">
              <span className="mb-1.5 block font-mono text-[11px] tracking-widest text-ash uppercase">Codigo</span>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                placeholder="000000"
                className="w-full border border-grape bg-coal px-4 py-3 text-center font-mono text-xl tracking-[0.35em] text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
                style={{ borderRadius: "var(--radius-stamp)" }}
              />
            </label>
          )}

          {message && <p className="text-sm text-ash">{message}</p>}
          {error && <p className="text-sm text-magenta">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-magenta px-7 py-4 text-sm font-bold tracking-wide text-ink uppercase transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            <MagnifyingGlass weight="bold" className="h-5 w-5" />
            {loading ? "Aguarde..." : codeRequested ? "Ver ingressos" : "Enviar codigo"}
          </button>
        </div>

        {tickets !== null && (
          <div className="mt-10">
            {tickets.length === 0 ? (
              <p className="text-center text-ash">
                Nenhum ingresso encontrado para esses dados. Confira o e-mail e o CPF usados na compra.
              </p>
            ) : (
              <>
                <h2 className="font-mono text-xs tracking-widest text-violet uppercase">
                  {tickets.length} ingresso{tickets.length > 1 ? "s" : ""}
                </h2>
                <div className="mt-4 space-y-3">
                  {tickets.map((t) => {
                    const s = STATUS[t.status] ?? STATUS.valid;
                    return (
                      <Link
                        key={t.token}
                        href={`/ingresso/${t.token}`}
                        className="flex items-center justify-between gap-3 border border-grape bg-plum p-4 transition-colors hover:border-magenta"
                        style={{ borderRadius: "var(--radius-stamp)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center bg-magenta/15 text-magenta" style={{ borderRadius: "var(--radius-stamp)" }}>
                            <Ticket weight="fill" className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-chalk">{t.holderName}</div>
                            <div className="font-mono text-[11px] tracking-wider text-ash uppercase">{t.tierName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`hidden border px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase sm:inline ${s.cls}`} style={{ borderRadius: "var(--radius-stamp)" }}>
                            {s.label}
                          </span>
                          <ArrowRight weight="bold" className="h-5 w-5 text-ash" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-14 border-t border-grape/40 pt-6 text-center">
          <Link
            href="/checkin"
            className="font-mono text-[11px] tracking-widest text-ash/70 uppercase transition-colors hover:text-magenta"
          >
            Acesso da equipe - Portaria
          </Link>
        </div>
      </div>
    </main>
  );
}
