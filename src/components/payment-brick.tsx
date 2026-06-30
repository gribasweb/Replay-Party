"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { CheckCircle, Copy, SpinnerGap } from "@phosphor-icons/react";

interface PixData {
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
}

export function PaymentBrick({
  orderId,
  amount,
  email,
  publicKey,
}: {
  orderId: string;
  amount: number;
  email: string;
  publicKey: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"form" | "pix">("form");
  const [pix, setPix] = useState<PixData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (publicKey) {
      initMercadoPago(publicKey, { locale: "pt-BR" });
      const id = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(id);
    }
  }, [publicKey]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = () => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`/api/payment-status?orderId=${orderId}`);
        const d = await r.json();
        if (d.status === "paid" || d.status === "approved") {
          if (pollRef.current) clearInterval(pollRef.current);
          router.push(`/pedido/${orderId}`);
        }
      } catch {
        /* keep polling */
      }
    }, 4000);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async ({ formData }: { selectedPaymentMethod: string; formData: any }) => {
    setError("");
    const res = await fetch("/api/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, formData }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Não foi possível processar o pagamento.");
      throw new Error(data.error ?? "payment error");
    }
    if (data.status === "approved") {
      router.push(`/pedido/${orderId}`);
      return;
    }
    if (data.status === "pending" && data.method === "pix") {
      setPix(data);
      setMode("pix");
      startPolling();
      return;
    }
    setError("Pagamento recusado. Tente outro cartão ou pague com Pix.");
    throw new Error("rejected");
  };

  const copyPix = () => {
    if (!pix?.qr_code) return;
    navigator.clipboard?.writeText(pix.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (mode === "pix" && pix) {
    return (
      <div className="text-center">
        <h2 className="font-display text-3xl text-chalk uppercase">Pague com Pix</h2>
        <p className="mt-2 text-sm text-ash">Escaneie o QR Code ou copie o código. O ingresso é liberado assim que o pagamento cair.</p>

        {pix.qr_code_base64 && (
          <div className="mx-auto mt-6 w-fit bg-white p-3" style={{ borderRadius: "var(--radius-stamp)" }}>
            <Image
              src={`data:image/png;base64,${pix.qr_code_base64}`}
              alt="QR Code Pix"
              width={200}
              height={200}
              unoptimized
            />
          </div>
        )}

        <button
          type="button"
          onClick={copyPix}
          className="mx-auto mt-5 flex items-center gap-2 border border-grape bg-coal px-5 py-3 text-sm text-chalk hover:border-magenta"
          style={{ borderRadius: "var(--radius-stamp)" }}
        >
          {copied ? <CheckCircle weight="fill" className="h-5 w-5 text-violet" /> : <Copy weight="bold" className="h-5 w-5 text-magenta" />}
          {copied ? "Código copiado!" : "Copiar código Pix"}
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-ash">
          <SpinnerGap weight="bold" className="h-5 w-5 animate-spin text-violet" />
          Aguardando o pagamento...
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="mb-4 border border-magenta/50 bg-magenta/10 px-4 py-3 text-sm text-chalk" style={{ borderRadius: "var(--radius-stamp)" }}>
          {error}
        </p>
      )}
      {ready ? (
        <Payment
          initialization={{ amount, payer: { email } }}
          customization={{
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              bankTransfer: "all",
              maxInstallments: 12,
            },
            visual: {
              // Os campos seguros (iframes PCI) sempre têm fundo branco e não
              // respeitam inputBackgroundColor. Por isso usamos o tema claro
              // padrão (tudo legível: fundo claro + texto escuro), com a cor da
              // marca no botão. Fica num "cartão" claro dentro da página escura.
              style: {
                theme: "default",
                customVariables: {
                  baseColor: "#f90a79",
                  borderRadiusSmall: "4px",
                  borderRadiusMedium: "6px",
                },
              },
            },
          }}
          onSubmit={onSubmit}
          onError={(e) => console.error("brick error", e)}
        />
      ) : (
        <p className="py-8 text-center text-sm text-ash">Carregando opções de pagamento...</p>
      )}
    </div>
  );
}
