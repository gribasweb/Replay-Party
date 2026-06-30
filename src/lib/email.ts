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
  qrToken: string;
}

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.venue.mapsQuery)}`;

function ticketCard(t: TicketLine, index: number, total: number, baseUrl: string) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0710;border:1px solid #310037;border-radius:6px;overflow:hidden;margin-bottom:12px;">
    <tr>
      <td style="background:#2a0b33;padding:10px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td style="font-size:18px;font-weight:bold;color:#efebef;text-transform:uppercase;letter-spacing:1px;">${esc(t.tierName)}</td>
          <td align="right" style="font-size:10px;color:#aa9fb8;letter-spacing:2px;">INGRESSO ${index + 1} DE ${total}</td>
        </tr></table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px;">
        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td style="vertical-align:middle;">
            <img src="${baseUrl}/api/qr?token=${encodeURIComponent(t.qrToken)}" width="116" height="116" alt="QR Code do ingresso" style="display:block;background:#ffffff;padding:6px;border-radius:4px;" />
          </td>
          <td style="padding-left:16px;vertical-align:middle;">
            <div style="font-size:10px;color:#aa9fb8;letter-spacing:2px;text-transform:uppercase;">Participante</div>
            <div style="font-size:18px;font-weight:bold;color:#efebef;line-height:1.2;">${esc(t.holderName)}</div>
            <div style="display:inline-block;margin-top:8px;border:1px solid #7e03d8;background:rgba(126,3,216,0.12);color:#a974e8;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:4px 8px;border-radius:4px;">Válido · ${EVENT.dateLabel}</div>
          </td>
        </tr></table>
      </td>
    </tr>
  </table>`;
}

function buildHtml(opts: { buyerName: string; orderId: string; tickets: TicketLine[]; baseUrl: string }) {
  const cards = opts.tickets.map((t, i) => ticketCard(t, i, opts.tickets.length, opts.baseUrl)).join("");
  const plural = opts.tickets.length > 1;

  return `
  <div style="background:#040406;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;background:#160a1d;border:1px solid #310037;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="background:linear-gradient(120deg,#7e03d8,#f90a79);padding:20px 24px;">
          <span style="font-size:22px;font-weight:bold;letter-spacing:1px;color:#ffffff;">REPLAY PARTY</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <h1 style="font-size:24px;margin:0 0 8px;color:#efebef;">Ingresso${plural ? "s" : ""} confirmado${plural ? "s" : ""}!</h1>
          <p style="color:#aa9fb8;margin:0 0 20px;font-size:14px;line-height:1.5;">
            Olá, ${esc(opts.buyerName)}! Apresente o QR Code na entrada do evento.
          </p>

          <div style="border-top:1px solid #310037;border-bottom:1px solid #310037;padding:14px 0;margin-bottom:20px;color:#aa9fb8;font-size:13px;line-height:1.7;">
            <strong style="color:#efebef;font-size:15px;">${EVENT.name}</strong><br />
            📅 ${EVENT.dateLabel} · ${EVENT.timeLabel}<br />
            📍 ${esc(EVENT.venue.street)}, ${esc(EVENT.venue.district)} · ${esc(EVENT.venue.city)}
            &nbsp;<a href="${mapsUrl}" style="color:#f90a79;text-decoration:none;">Ver no mapa</a>
          </div>

          ${cards}

          <a href="${opts.baseUrl}/pedido/${opts.orderId}" style="display:inline-block;background:#f90a79;color:#040406;text-decoration:none;font-weight:bold;padding:14px 28px;border-radius:4px;margin-top:8px;">
            Ver meus ingressos online
          </a>
          <p style="color:#aa9fb8;font-size:12px;margin-top:22px;line-height:1.5;">
            Você também pode consultar a qualquer momento em
            <a href="${opts.baseUrl}/meus-ingressos" style="color:#f90a79;">${opts.baseUrl}/meus-ingressos</a>
            com seu e-mail e CPF.
          </p>
        </td>
      </tr>
    </table>
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
