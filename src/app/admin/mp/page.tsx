"use client";

import { useEffect, useState } from "react";

interface Status {
  connected: boolean;
  mpUserId: string | null;
  hasPublicKey: boolean;
  updatedAt: string | null;
}

export default function AdminMpPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected") === "1") {
      setFlash("✅ Conta do organizador conectada com sucesso! O split de 15% já está ativo.");
    } else if (p.get("error")) {
      setFlash(`⚠️ Não foi possível concluir a conexão (${p.get("error")}). Tente de novo.`);
    }
  }, []);

  const check = async (k: string) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/mp/status?key=${encodeURIComponent(k)}`);
      if (r.status === 401) {
        setError("Senha incorreta.");
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
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink px-5 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl text-chalk uppercase">Mercado Pago</h1>
        <p className="mt-2 text-sm text-ash">
          Conexão da conta do organizador para o split de pagamentos (comissão de 15%).
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
              check(key);
            }}
            className="mt-6 space-y-3"
          >
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
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
                  <p className="font-display text-2xl text-chalk uppercase">✅ Conectado</p>
                  <p className="mt-2 text-sm text-ash">
                    Conta do organizador (ID {status.mpUserId}) vinculada. A cada venda, 85% vai
                    para a conta dele e 15% para a sua, automaticamente.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl text-chalk uppercase">Não conectado</p>
                  <p className="mt-2 text-sm text-ash">
                    Clique abaixo e faça login na conta Mercado Pago <strong>do organizador</strong>{" "}
                    para ativar o split. (É o organizador quem precisa autorizar.)
                  </p>
                </>
              )}
            </div>

            <a
              href={`/api/mp/connect?key=${encodeURIComponent(key)}`}
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
