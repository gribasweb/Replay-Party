"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowClockwise, CheckCircle, Lock, MagnifyingGlass, QrCode, Warning, XCircle } from "@phosphor-icons/react";
import { formatCPF } from "@/lib/cpf";

type Result =
  | { result: "ok"; name: string; tierName: string }
  | { result: "used"; name: string; tierName: string; checkedInAt: string | null }
  | { result: "invalid"; message: string }
  | null;

interface SearchRow {
  id: string;
  name: string;
  cpf: string;
  tierName: string;
  status: string;
  checkedInAt: string | null;
}

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

export default function CheckinPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const [stats, setStats] = useState({ total: 0, used: 0 });
  const [result, setResult] = useState<Result>(null);
  const [cameraError, setCameraError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [recent, setRecent] = useState<{ id: string; name: string; tierName: string; checkedInAt: string | null }[]>([]);

  const processingRef = useRef(false);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void; pause: (b?: boolean) => void; resume: () => void } | null>(null);

  const post = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  }, []);

  const refreshStats = useCallback(async () => {
    const r = await post({ action: "stats" });
    if (r.ok) setStats({ total: r.data.total ?? 0, used: r.data.used ?? 0 });
  }, [post]);

  const refreshRecent = useCallback(async () => {
    const r = await post({ action: "recent" });
    if (r.ok) setRecent(r.data.recent ?? []);
  }, [post]);

  useEffect(() => {
    post({ action: "stats" }).then((r) => {
      if (r.ok) {
        setAuthed(true);
        setStats({ total: r.data.total ?? 0, used: r.data.used ?? 0 });
      }
    });
  }, [post]);

  // Lista de entradas ao vivo: atualiza sozinha (inclusive de outros aparelhos).
  useEffect(() => {
    if (!authed) return;
    const first = window.setTimeout(refreshRecent, 0);
    const iv = setInterval(refreshRecent, 15000);
    return () => {
      window.clearTimeout(first);
      clearInterval(iv);
    };
  }, [authed, refreshRecent]);

  const login = async () => {
    setLoginError("");
    const r = await fetch("/api/operator/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (r.ok) {
      setAuthed(true);
      setPassword("");
      refreshStats();
    } else {
      const data = await r.json().catch(() => ({}));
      setLoginError(data.error ?? "Senha incorreta.");
    }
  };

  const showResultThenClear = useCallback(() => {
    setTimeout(() => {
      processingRef.current = false;
      setResult(null);
      try {
        scannerRef.current?.resume();
      } catch {
        /* ignore */
      }
    }, 3500);
  }, []);

  const handleScanText = useCallback(
    async (text: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        scannerRef.current?.pause(true);
      } catch {
        /* ignore */
      }
      const r = await post({ action: "scan", token: text });
      setResult(r.data as Result);
      refreshStats();
      refreshRecent();
      showResultThenClear();
    },
    [post, refreshStats, refreshRecent, showResultThenClear],
  );

  useEffect(() => {
    if (!authed || mode !== "scan") return;
    let cancelled = false;
    const resetError = window.setTimeout(() => setCameraError(""), 0);
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const scanner = new Html5Qrcode("reader", { verbose: false });
      scannerRef.current = scanner as unknown as typeof scannerRef.current;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          handleScanText,
          undefined,
        );
      } catch {
        setCameraError("Não consegui abrir a câmera. Use a busca por nome/CPF (a câmera exige HTTPS no celular).");
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(resetError);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        try {
          s.stop().then(() => s.clear()).catch(() => {});
        } catch {
          /* ignore */
        }
      }
    };
  }, [authed, mode, handleScanText]);

  const doSearch = useCallback(async () => {
    const r = await post({ action: "search", query });
    setResults((r.data.results as SearchRow[]) ?? []);
  }, [post, query]);

  const redeem = async (id: string) => {
    const r = await post({ action: "redeem", ticketId: id });
    setResult(r.data as Result);
    refreshStats();
    refreshRecent();
    doSearch();
    setTimeout(() => setResult(null), 3500);
  };

  if (!authed) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-ink px-5">
        <div className="w-full max-w-xs text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center bg-magenta/15 text-magenta" style={{ borderRadius: "var(--radius-stamp)" }}>
            <Lock weight="bold" className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-chalk uppercase">Check-in</h1>
          <p className="mt-1 text-sm text-ash">Acesso da equipe da portaria.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Senha"
            className="mt-6 w-full border border-grape bg-coal px-4 py-3 text-center text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
            style={{ borderRadius: "var(--radius-stamp)" }}
          />
          {loginError && <p className="mt-2 text-sm text-magenta">{loginError}</p>}
          <button
            type="button"
            onClick={login}
            className="mt-4 w-full bg-magenta py-3 text-sm font-bold tracking-wide text-ink uppercase"
            style={{ borderRadius: "var(--radius-stamp)" }}
          >
            Entrar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-ink">
      {/* Top bar + counter */}
      <header className="sticky top-0 z-20 border-b border-grape/50 bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <span className="font-display text-xl tracking-wide text-chalk">
            CHECK<span className="text-magenta">IN</span>
          </span>
          <button type="button" onClick={refreshStats} className="flex items-center gap-2 font-mono text-sm text-chalk">
            <span className="text-violet">{stats.used}</span>
            <span className="text-ash">/ {stats.total} entraram</span>
            <ArrowClockwise weight="bold" className="h-4 w-4 text-ash" />
          </button>
        </div>
        <div className="mx-auto grid max-w-lg grid-cols-2">
          {(["scan", "search"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-2 py-3 text-sm font-bold tracking-wide uppercase ${
                mode === m ? "border-b-2 border-magenta text-chalk" : "text-ash"
              }`}
            >
              {m === "scan" ? <QrCode weight="bold" className="h-4 w-4" /> : <MagnifyingGlass weight="bold" className="h-4 w-4" />}
              {m === "scan" ? "Escanear" : "Buscar"}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 py-6">
        {mode === "scan" ? (
          <div>
            <div id="reader" className="overflow-hidden border border-grape bg-coal" style={{ borderRadius: "var(--radius-stamp)" }} />
            {cameraError ? (
              <p className="mt-3 text-center text-sm text-ash">{cameraError}</p>
            ) : (
              <p className="mt-3 text-center text-sm text-ash">Aponte a câmera para o QR Code do ingresso.</p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Nome ou CPF"
                className="w-full border border-grape bg-coal px-4 py-3 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
                style={{ borderRadius: "var(--radius-stamp)" }}
              />
              <button type="button" onClick={doSearch} className="shrink-0 bg-magenta px-5 text-sm font-bold tracking-wide text-ink uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
                Buscar
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {results.map((row) => {
                const used = row.status === "used";
                return (
                  <div key={row.id} className="flex items-center justify-between gap-3 border border-grape/60 bg-coal p-3" style={{ borderRadius: "var(--radius-stamp)" }}>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-chalk">{row.name}</div>
                      <div className="font-mono text-[11px] text-ash">
                        {row.tierName} · {formatCPF(row.cpf)}
                      </div>
                    </div>
                    {used ? (
                      <span className="shrink-0 font-mono text-[11px] tracking-wider text-amber-400 uppercase">
                        Entrou {fmtTime(row.checkedInAt)}
                      </span>
                    ) : (
                      <button type="button" onClick={() => redeem(row.id)} className="shrink-0 bg-violet px-4 py-2 text-xs font-bold tracking-wide text-chalk uppercase" style={{ borderRadius: "var(--radius-stamp)" }}>
                        Dar baixa
                      </button>
                    )}
                  </div>
                );
              })}
              {query && results.length === 0 && <p className="text-center text-sm text-ash">Nenhum ingresso encontrado.</p>}
            </div>

            {/* Últimas entradas — atualiza ao vivo a cada validação */}
            <div className="mt-8">
              <h2 className="font-mono text-xs tracking-widest text-violet uppercase">Últimas entradas</h2>
              <div className="mt-3 space-y-2">
                {recent.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 border border-grape/40 bg-coal/60 px-3 py-2.5" style={{ borderRadius: "var(--radius-stamp)" }}>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-chalk">{row.name}</div>
                      <div className="font-mono text-[11px] text-ash">{row.tierName}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] tracking-wider text-violet uppercase">
                      {fmtTime(row.checkedInAt)}
                    </span>
                  </div>
                ))}
                {recent.length === 0 && <p className="text-center text-sm text-ash">Ninguém entrou ainda.</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result overlay */}
      {result && (
        <div
          className={`fixed inset-0 z-50 grid place-items-center px-6 text-center ${
            result.result === "ok" ? "bg-green-600" : result.result === "used" ? "bg-amber-500" : "bg-red-600"
          }`}
        >
          <div className="text-white">
            {result.result === "ok" ? (
              <CheckCircle weight="fill" className="mx-auto h-24 w-24" />
            ) : result.result === "used" ? (
              <Warning weight="fill" className="mx-auto h-24 w-24" />
            ) : (
              <XCircle weight="fill" className="mx-auto h-24 w-24" />
            )}
            <h2 className="mt-4 font-display text-4xl uppercase">
              {result.result === "ok" ? "Entrada liberada" : result.result === "used" ? "Já utilizado" : "Inválido"}
            </h2>
            {result.result === "ok" || result.result === "used" ? (
              <>
                <p className="mt-2 text-2xl font-bold">{result.name}</p>
                <p className="text-lg opacity-90">{result.tierName}</p>
                {result.result === "used" && "checkedInAt" in result && (
                  <p className="mt-1 opacity-90">Entrou às {fmtTime(result.checkedInAt)}</p>
                )}
              </>
            ) : (
              <p className="mt-2 text-lg opacity-90">{result.message}</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
