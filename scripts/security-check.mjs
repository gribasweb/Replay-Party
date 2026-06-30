import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`security-check failed: ${message}`);
    process.exitCode = 1;
  }
}

const checkinPage = read("src/app/checkin/page.tsx");
const adminMpPage = read("src/app/admin/mp/page.tsx");
const checkinRoute = read("src/app/api/checkin/route.ts");
const mpConnectRoute = read("src/app/api/mp/connect/route.ts");
const mpStatusRoute = read("src/app/api/mp/status/route.ts");
const courtesyRoute = read("src/app/api/admin/cortesia/route.ts");
const lookupRoute = read("src/app/api/meus-ingressos/route.ts");
const fulfill = read("src/lib/fulfill.ts");
const mpVendor = read("src/lib/mp-vendor.ts");
const baseUrl = read("src/lib/base-url.ts");
const qrRoute = read("src/app/api/qr/route.ts");

for (const [label, source] of [
  ["checkin page", checkinPage],
  ["admin MP page", adminMpPage],
  ["checkin route", checkinRoute],
  ["MP connect route", mpConnectRoute],
  ["MP status route", mpStatusRoute],
  ["courtesy route", courtesyRoute],
]) {
  assert(!source.includes("?key="), `${label} must not pass admin password in query strings`);
  assert(!source.includes('searchParams.get("key")'), `${label} must not read admin password from query strings`);
}

assert(!checkinPage.includes("sessionStorage"), "check-in password must not be stored in browser-accessible storage");
assert(checkinPage.includes("/api/operator/session"), "check-in page must authenticate through operator session route");
assert(checkinRoute.includes("requireOperatorSession"), "check-in API must require an operator session");
assert(mpConnectRoute.includes("requireOperatorSession"), "MP connect must require an operator session");
assert(mpStatusRoute.includes("requireOperatorSession"), "MP status must require an operator session");
assert(courtesyRoute.includes("requireOperatorSession"), "courtesy issuance must require an operator session");

assert(lookupRoute.includes("sendLookupCodeEmail"), "ticket lookup must send an email verification code");
assert(lookupRoute.includes("verifyLookupChallenge"), "ticket lookup must verify the signed code challenge before returning tokens");
assert(lookupRoute.indexOf("verifyLookupChallenge") < lookupRoute.indexOf("token: tickets.qrToken"), "ticket tokens must only be selected after code verification");

assert(fulfill.includes('eq(orders.status, "pending")'), "fulfillment must only update pending orders");
assert(fulfill.includes("gt(orders.expiresAt"), "fulfillment must reject expired reservations");

assert(mpVendor.includes("encryptSecret"), "Mercado Pago tokens must be encrypted before storage");
assert(mpVendor.includes("decryptSecret"), "Mercado Pago tokens must be decrypted only for runtime use");

assert(baseUrl.includes("NEXT_PUBLIC_BASE_URL is required in production"), "production base URL must fail closed when canonical URL is missing");
assert(qrRoute.includes('eq(orders.status, "paid")'), "QR image endpoint must only render paid tickets");

if (!process.exitCode) {
  console.log("security-check passed");
}
