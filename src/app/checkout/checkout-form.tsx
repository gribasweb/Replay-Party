"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, Ticket, UserCheck, X } from "@phosphor-icons/react";
import { brl } from "@/lib/event";
import { formatCPF, formatPhone, isValidCPF, onlyDigits } from "@/lib/cpf";
import { PaymentBrick } from "@/components/payment-brick";

interface LotInfo {
  id: string;
  tier: string;
  tierName: string;
  label: string;
  priceCents: number;
}

interface Person {
  name: string;
  cpf: string;
}

interface AppliedCoupon {
  code: string;
  pistaPriceCents: number;
  vipPriceCents: number;
}

const MAX_QTY = 20;
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function CheckoutForm({ lot, publicKey }: { lot: LotInfo; publicKey: string }) {
  const [step, setStep] = useState<"form" | "payment">("form");
  const [orderId, setOrderId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [buyer, setBuyer] = useState({ name: "", cpf: "", email: "", whatsapp: "" });
  const [extras, setExtras] = useState<Person[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentTotalCents, setPaymentTotalCents] = useState<number | null>(null);

  const unitPriceCents = appliedCoupon
    ? lot.tier === "vip"
      ? appliedCoupon.vipPriceCents
      : appliedCoupon.pistaPriceCents
    : lot.priceCents;
  const totalCents = unitPriceCents * quantity;
  const shownTotalCents = step === "payment" && paymentTotalCents !== null ? paymentTotalCents : totalCents;

  const applyCoupon = async () => {
    setCouponMessage("");
    const code = couponInput.trim();
    if (!code) {
      setCouponMessage("Digite o código do cupom.");
      return;
    }
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAppliedCoupon(null);
        setCouponMessage(data.error ?? "Não foi possível validar o cupom.");
        return;
      }
      setAppliedCoupon(data);
      setCouponInput(data.code);
      setCouponMessage("");
    } catch {
      setCouponMessage("Erro de conexão. Tente novamente.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage("");
  };

  const changeQuantity = (next: number) => {
    const q = Math.max(1, Math.min(MAX_QTY, next));
    setQuantity(q);
    setExtras((prev) => {
      const copy = [...prev];
      while (copy.length < q - 1) copy.push({ name: "", cpf: "" });
      copy.length = q - 1;
      return copy;
    });
  };

  const setExtra = (i: number, field: keyof Person, value: string) => {
    setExtras((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: field === "cpf" ? formatCPF(value) : value } : p)),
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (buyer.name.trim().length < 3) e["buyer.name"] = "Informe seu nome completo";
    if (!isValidCPF(buyer.cpf)) e["buyer.cpf"] = "CPF inválido";
    if (!emailOk(buyer.email)) e["buyer.email"] = "E-mail inválido";
    if (onlyDigits(buyer.whatsapp).length < 10) e["buyer.whatsapp"] = "WhatsApp inválido";
    extras.forEach((p, i) => {
      if (p.name.trim().length < 3) e[`x.${i}.name`] = "Informe o nome completo";
      if (!isValidCPF(p.cpf)) e[`x.${i}.cpf`] = "CPF inválido";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToPayment = async () => {
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const participants = [{ name: buyer.name, cpf: buyer.cpf }, ...extras];
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ lotId: lot.id, quantity }],
          buyer,
          participants,
          couponCode: appliedCoupon?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Não foi possível continuar.");
        return;
      }
      setOrderId(data.orderId);
      setPaymentTotalCents(data.totalCents);
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-ink">
      <header className="border-b border-grape/50">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/#ingressos" className="flex items-center gap-2 text-sm text-ash hover:text-chalk">
            <ArrowLeft weight="bold" className="h-4 w-4" />
            Voltar
          </Link>
          <span className="font-display text-lg tracking-wide text-chalk">
            REPLAY<span className="text-magenta">PARTY</span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-4xl text-chalk uppercase sm:text-5xl">
          {step === "form" ? "Finalizar compra" : "Pagamento"}
        </h1>

        {/* Resumo */}
        <section className="mt-8 border border-grape bg-plum p-5" style={{ borderRadius: "var(--radius-stamp)" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center bg-magenta/15 text-magenta" style={{ borderRadius: "var(--radius-stamp)" }}>
                <Ticket weight="fill" className="h-6 w-6" />
              </span>
              <div>
                <div className="font-display text-2xl leading-none text-chalk uppercase">
                  {quantity}x {lot.tierName}
                </div>
                <div className="font-mono text-[11px] tracking-wider text-ash uppercase">
                  {lot.label} · {brl(unitPriceCents / 100)} cada{appliedCoupon && " com cupom"}
                </div>
              </div>
            </div>
            {step === "form" && (
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => changeQuantity(quantity - 1)} aria-label="Menos" className="grid h-9 w-9 place-items-center border border-grape text-chalk hover:border-magenta" style={{ borderRadius: "var(--radius-stamp)" }}>
                  <Minus weight="bold" className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-display text-2xl text-chalk">{quantity}</span>
                <button type="button" onClick={() => changeQuantity(quantity + 1)} aria-label="Mais" className="grid h-9 w-9 place-items-center border border-grape text-chalk hover:border-magenta" style={{ borderRadius: "var(--radius-stamp)" }}>
                  <Plus weight="bold" className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-grape/50 pt-4">
            <span className="text-ash">Total</span>
            <span className="font-display text-3xl text-chalk">{brl(shownTotalCents / 100)}</span>
          </div>
        </section>

        {step === "form" ? (
          <>
            <section className="mt-8 border border-grape/60 bg-coal p-4" style={{ borderRadius: "var(--radius-stamp)" }}>
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[12rem] flex-1">
                  <span className="mb-1.5 block font-mono text-[11px] tracking-widest text-ash uppercase">Cupom</span>
                  <input
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (appliedCoupon) setAppliedCoupon(null);
                      setCouponMessage("");
                    }}
                    placeholder="Código do cupom"
                    maxLength={40}
                    className="w-full border border-grape bg-ink px-4 py-3 font-mono text-sm uppercase text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
                    style={{ borderRadius: "var(--radius-stamp)" }}
                  />
                </label>
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remover cupom"
                    title="Remover cupom"
                    className="grid h-11 w-11 place-items-center border border-grape text-ash hover:border-magenta hover:text-chalk"
                    style={{ borderRadius: "var(--radius-stamp)" }}
                  >
                    <X weight="bold" className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="h-11 bg-violet px-5 text-xs font-bold tracking-wide text-ink uppercase disabled:opacity-60"
                    style={{ borderRadius: "var(--radius-stamp)" }}
                  >
                    {couponLoading ? "Validando..." : "Aplicar"}
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <p className="mt-3 text-xs text-violet">
                  Cupom {appliedCoupon.code} aplicado. {lot.tierName} por {brl(unitPriceCents / 100)}.
                </p>
              )}
              {couponMessage && <p className="mt-3 text-xs text-magenta">{couponMessage}</p>}
            </section>

            {/* Comprador = Ingresso 1 */}
            <section className="mt-8">
              <h2 className="font-mono text-xs tracking-widest text-violet uppercase">Seus dados</h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-ash">
                <UserCheck weight="bold" className="h-4 w-4 text-violet" />
                Estes dados também valem como o <strong className="text-chalk">seu ingresso</strong> (nominal).
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Nome completo" value={buyer.name} onChange={(v) => setBuyer({ ...buyer, name: v })} error={errors["buyer.name"]} placeholder="Seu nome" />
                </div>
                <Field label="CPF" value={buyer.cpf} onChange={(v) => setBuyer({ ...buyer, cpf: formatCPF(v) })} error={errors["buyer.cpf"]} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} />
                <Field label="WhatsApp" value={buyer.whatsapp} onChange={(v) => setBuyer({ ...buyer, whatsapp: formatPhone(v) })} error={errors["buyer.whatsapp"]} placeholder="(19) 99999-9999" inputMode="tel" maxLength={15} />
                <div className="sm:col-span-2">
                  <Field label="E-mail" value={buyer.email} onChange={(v) => setBuyer({ ...buyer, email: v })} error={errors["buyer.email"]} placeholder="voce@email.com" type="email" inputMode="email" />
                </div>
              </div>
            </section>

            {quantity > 1 && (
              <section className="mt-8">
                <h2 className="font-mono text-xs tracking-widest text-violet uppercase">
                  Outras pessoas ({quantity - 1} {quantity - 1 === 1 ? "ingresso" : "ingressos"})
                </h2>
                <p className="mt-1 text-xs text-ash">Preencha os dados de quem vai usar os outros ingressos.</p>
                <div className="mt-4 space-y-4">
                  {extras.map((p, i) => (
                    <div key={i} className="border border-grape/60 bg-coal p-4" style={{ borderRadius: "var(--radius-stamp)" }}>
                      <div className="mb-3 font-display text-lg text-chalk uppercase">Ingresso {i + 2}</div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nome do participante" value={p.name} onChange={(v) => setExtra(i, "name", v)} error={errors[`x.${i}.name`]} placeholder="Nome completo" />
                        <Field label="CPF" value={p.cpf} onChange={(v) => setExtra(i, "cpf", v)} error={errors[`x.${i}.cpf`]} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {serverError && (
              <p className="mt-6 border border-magenta/50 bg-magenta/10 px-4 py-3 text-sm text-chalk" style={{ borderRadius: "var(--radius-stamp)" }}>
                {serverError}
              </p>
            )}

            <button
              type="button"
              onClick={goToPayment}
              disabled={submitting}
              className="glow-magenta mt-8 flex w-full items-center justify-center gap-2 bg-magenta px-7 py-4 text-sm font-bold tracking-wide text-ink uppercase transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              style={{ borderRadius: "var(--radius-stamp)" }}
            >
              {submitting ? "Aguarde..." : "Ir para o pagamento"}
              {!submitting && <ArrowRight weight="bold" className="h-5 w-5" />}
            </button>
            <p className="mt-3 text-center text-xs text-ash">
              Na próxima etapa você paga com Pix ou cartão. Os ingressos são liberados após a confirmação.
            </p>
          </>
        ) : (
          <section className="mt-8">
            <PaymentBrick orderId={orderId} amount={shownTotalCents / 100} email={buyer.email} publicKey={publicKey} />
            <button
              type="button"
              onClick={() => setStep("form")}
              className="mx-auto mt-6 block text-center text-sm text-ash hover:text-chalk"
            >
              Voltar e editar os dados
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
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
        className="w-full border border-grape bg-ink px-4 py-3 text-chalk placeholder:text-ash/40 focus:border-magenta focus:outline-none"
        style={{ borderRadius: "var(--radius-stamp)" }}
      />
      {error && <span className="mt-1 block text-xs text-magenta">{error}</span>}
    </label>
  );
}
