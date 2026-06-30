import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "v1";

function keySource() {
  const configured = process.env.SECRET_ENCRYPTION_KEY?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SECRET_ENCRYPTION_KEY is required in production.");
  }

  return process.env.CHECKIN_PASSWORD || process.env.MP_CLIENT_SECRET || process.env.DATABASE_URL || "dev-secret-box-key";
}

function encryptionKey() {
  const source = keySource();
  if (source.startsWith("base64:")) {
    const key = Buffer.from(source.slice("base64:".length), "base64");
    if (key.length === 32) return key;
  }
  if (/^[a-f0-9]{64}$/i.test(source)) {
    return Buffer.from(source, "hex");
  }
  return createHash("sha256").update(source).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptSecret(value: string) {
  if (!value.startsWith(`${PREFIX}:`)) return value;

  const [, ivRaw, tagRaw, encryptedRaw] = value.split(":");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Invalid encrypted secret.");

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
