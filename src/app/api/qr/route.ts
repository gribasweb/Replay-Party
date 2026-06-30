import QRCode from "qrcode";
import { baseUrlFromRequest } from "@/lib/base-url";

export const runtime = "nodejs";

/** Serve o QR Code de um ingresso como PNG (usado nos e-mails). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return new Response("token ausente", { status: 400 });

  const baseUrl = baseUrlFromRequest(req);
  const png = await QRCode.toBuffer(`${baseUrl}/ingresso/${token}`, {
    margin: 1,
    width: 300,
    color: { dark: "#040406", light: "#ffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
