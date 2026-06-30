import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "rp_ticket_lookup";
const LOOKUP_MAX_AGE_SECONDS = 10 * 60;

function secret() {
  const configured =
    process.env.TICKET_LOOKUP_SECRET ||
    process.env.SECRET_ENCRYPTION_KEY ||
    process.env.CHECKIN_PASSWORD ||
    "";

  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("TICKET_LOOKUP_SECRET or CHECKIN_PASSWORD is required in production.");
  }

  return configured || "dev-ticket-lookup-secret";
}

function hmac(parts: string[]) {
  return createHmac("sha256", secret()).update(parts.join("|")).digest("base64url");
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function getCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rawValue.join("="));
  }
  return null;
}

function signature(exp: string, nonce: string, emailHash: string, cpfHash: string, codeHash: string) {
  return hmac(["lookup-sig", exp, nonce, emailHash, cpfHash, codeHash]);
}

export function setLookupChallengeCookie(res: NextResponse, email: string, cpf: string, code: string) {
  const exp = String(Math.floor(Date.now() / 1000) + LOOKUP_MAX_AGE_SECONDS);
  const nonce = randomBytes(18).toString("base64url");
  const emailHash = hmac(["email", email]);
  const cpfHash = hmac(["cpf", cpf]);
  const codeHash = hmac(["code", email, cpf, code, nonce, exp]);
  const sig = signature(exp, nonce, emailHash, cpfHash, codeHash);

  res.cookies.set(COOKIE_NAME, [exp, nonce, emailHash, cpfHash, codeHash, sig].join("."), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: LOOKUP_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearLookupChallengeCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export function verifyLookupChallenge(req: Request, email: string, cpf: string, code: string) {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) return false;

  const [exp, nonce, emailHash, cpfHash, codeHash, sig] = token.split(".");
  const expNumber = Number(exp);
  if (!exp || !nonce || !emailHash || !cpfHash || !codeHash || !sig || !Number.isFinite(expNumber)) {
    return false;
  }
  if (expNumber <= Math.floor(Date.now() / 1000)) return false;

  const expectedEmail = hmac(["email", email]);
  const expectedCpf = hmac(["cpf", cpf]);
  const expectedCode = hmac(["code", email, cpf, code, nonce, exp]);
  const expectedSig = signature(exp, nonce, emailHash, cpfHash, codeHash);

  return (
    equal(emailHash, expectedEmail) &&
    equal(cpfHash, expectedCpf) &&
    equal(codeHash, expectedCode) &&
    equal(sig, expectedSig)
  );
}
