import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "rp_operator_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function secret() {
  return process.env.CHECKIN_PASSWORD ?? "";
}

function sign(payload: string) {
  const key = secret();
  if (!key) return "";
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function getCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rawValue.join("="));
  }
  return null;
}

export function verifyOperatorPassword(password: unknown) {
  const expected = secret();
  if (!expected || typeof password !== "string") return false;
  return timingSafeEqual(digest(password), digest(expected));
}

export function hasOperatorSession(req: Request) {
  const key = secret();
  if (!key) return false;

  const token = getCookie(req, COOKIE_NAME);
  if (!token) return false;

  const [expRaw, nonce, signature] = token.split(".");
  const exp = Number(expRaw);
  if (!expRaw || !nonce || !signature || !Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expected = sign(`${expRaw}.${nonce}`);
  return !!expected && equal(signature, expected);
}

export function requireOperatorSession(req: Request) {
  if (hasOperatorSession(req)) return null;
  return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
}

export function issueOperatorSession(res: NextResponse) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const nonce = randomBytes(18).toString("base64url");
  const payload = `${exp}.${nonce}`;
  const signature = sign(payload);

  res.cookies.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearOperatorSession(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
