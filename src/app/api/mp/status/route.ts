import { NextResponse } from "next/server";
import { getVendorCredentials } from "@/lib/mp-vendor";

export const runtime = "nodejs";

/** Status da conexão da conta do organizador. Protegido pela senha de admin. */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!process.env.CHECKIN_PASSWORD || key !== process.env.CHECKIN_PASSWORD) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cred = await getVendorCredentials();
  return NextResponse.json({
    connected: !!cred,
    mpUserId: cred?.mpUserId ?? null,
    hasPublicKey: !!cred?.publicKey,
    updatedAt: cred?.updatedAt ?? null,
  });
}
