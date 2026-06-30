"use client";

import { useCallback, useEffect, useState } from "react";

interface Status {
  connected: boolean;
  mpUserId: string | null;
  hasPublicKey: boolean;
  updatedAt: string | null;
}

export default function AdminMpPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/mp/status");
      if (r.status === 401) {
        setAuthed(false);
        setStatus(null);
        return;
      }
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error ?? "Erro ao consultar o status.");
        return;
      }
      const d = (await r.json()) as Status;
      setStatus(d);
      setAuthed(true);
    } catch {
      setError("Erro ao consultar o status. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const p = new URLSearchParams(window.location.search);
      if (p.get("connected") === "1") {
        setFlash("Conta do organizador conectada com sucesso. O split de 15% ja esta ativo.");
      } else if (p.get("error")) {
        setFlash(`Nao foi possivel concluir a conexao (${p.get("error")}). Tente de novo.`);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    fetch("/api/operator/session")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) loadStatus();
      })
      .catch(() => {});
  }, [loadStatus]);

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/operator/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data.error ?? "Senha incorreta.");
        return;
      }
      setPassword("");
      await loadStatus();
    } catch {
      setError("Erro ao verificar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl text-chalk uppercase">Mercado Pago</h1>
        <p className="mt-2 text-sm text-ash">
          Conexao da conta do organizador para o split de pagamentos (comissao de 15%).
        </p>

        {flash && (
          <p
            className="mt-5 border border-violet/50 bg-violet/10 px-4 py-3 text-sm text-chalk"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            {flash}
          </p>
        )}

        {!authed ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
            className="mt-6 space-y-3"
          >
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
              disabled={loading}
              className="w-full bg-magenta px-6 py-3 text-sm font-bold tracking-wide text-ink uppercase disabled:opacity-60"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <div className="mt-6">
            <div
              className="border border-grape bg-plum p-5"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              {status?.connected ? (
                <>
                  <p className="font-display text-2xl text-chalk uppercase">Conectado</p>
                  <p className="mt-2 text-sm text-ash">
                    Conta do organizador (ID {status.mpUserId}) vinculada. A cada venda, 85% vai
                    para a conta dele e 15% para a sua, automaticamente.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl text-chalk uppercase">Nao conectado</p>
                  <p className="mt-2 text-sm text-ash">
                    Clique abaixo e faca login na conta Mercado Pago do organizador para ativar o split.
                  </p>
                </>
              )}
            </div>

            {error && <p className="mt-3 text-xs text-magenta">{error}</p>}
            <a
              href="/api/mp/connect"
              className="glow-magenta mt-5 block bg-magenta px-6 py-4 text-center text-sm font-bold tracking-wide text-ink uppercase"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              {status?.connected ? "Reconectar conta do organizador" : "Conectar conta do organizador"}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
