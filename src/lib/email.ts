import { Resend } from "resend";
import { EVENT } from "@/lib/event";

const apiKey = process.env.RESEND_API_KEY ?? "";
// Without a verified domain, Resend only sends from onboarding@resend.dev
// (and only to the account owner's email — fine for testing).
const from = process.env.EMAIL_FROM ?? "Replay Party <onboarding@resend.dev>";

export const isEmailConfigured = () => apiKey.length > 0;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface TicketLine {
  holderName: string;
  tierName: string;
}

function buildHtml(opts: { buyerName: string; orderId: string; tickets: TicketLine[]; baseUrl: string }) {
  const rows = opts.tickets
    .map(
      (t) => `
      <div style="background:#0a0710;border:1px solid #310037;border-radius:4px;padding:12px 16px;margin-bottom:10px;">
        <div style="font-size:11px;color:#aa9fb8;text-transform:uppercase;letter-spacing:1px;">${esc(t.tierName)}</div>
        <div style="font-size:16px;font-weight:bold;color:#efebef;">${esc(t.holderName)}</div>
      </div>`,
    )
    .join("");

  return `
  <div style="background:#040406;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#160a1d;border:1px solid #310037;border-radius:6px;overflow:hidden;">
      <div style="background:linear-gradient(120deg,#7e03d8,#f90a79);padding:22px 24px;">
        <div style="font-size:22px;font-weight:bold;letter-spacing:1px;color:#ffffff;">REPLAY PARTY</div>
      </div>
      <div style="padding:24px;">
        <h1 style="font-size:22px;margin:0 0 8px;color:#efebef;">Ingresso confirmado!</h1>
        <p style="color:#aa9fb8;margin:0 0 20px;font-size:14px;line-height:1.5;">
          Olá, ${esc(opts.buyerName)}! Seu pedido foi confirmado. Apresente o QR Code na entrada do evento.
        </p>
        <div style="border-top:1px solid #310037;border-bottom:1px solid #310037;padding:14px 0;margin-bottom:20px;color:#aa9fb8;font-size:14px;">
          <strong style="color:#efebef;">${EVENT.name}</strong> &middot; ${EVENT.dateLabel} &middot; ${EVENT.venue.city}
        </div>
        ${rows}
        <a href="${opts.baseUrl}/pedido/${opts.orderId}" style="display:inline-block;background:#f90a79;color:#040406;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:4px;margin-top:10px;">
          Ver meus ingressos com QR
        </a>
        <p style="color:#aa9fb8;font-size:12px;margin-top:22px;line-height:1.5;">
          Você também pode consultar a qualquer momento em
          <a href="${opts.baseUrl}/meus-ingressos" style="color:#f90a79;">${opts.baseUrl}/meus-ingressos</a>
          com seu e-mail e CPF.
        </p>
      </div>
    </div>
  </div>`;
}

export async function sendTicketEmail(opts: {
  to: string;
  buyerName: string;
  orderId: string;
  tickets: TicketLine[];
  baseUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY ausente" };
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      subject: `Seu ingresso para a ${EVENT.name}`,
      html: buildHtml(opts),
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "erro" };
  }
}
