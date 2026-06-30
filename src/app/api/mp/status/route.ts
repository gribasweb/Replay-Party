import { NextResponse } from "next/server";
import { getVendorCredentials } from "@/lib/mp-vendor";
import { requireOperatorSession } from "@/lib/operator-session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireOperatorSession(req);
  if (unauthorized) return unauthorized;

  const cred = await getVendorCredentials();
  return NextResponse.json({
    connected: !!cred,
    mpUserId: cred?.mpUserId ?? null,
    hasPublicKey: !!cred?.publicKey,
    updatedAt: cred?.updatedAt ?? null,
  });
}
