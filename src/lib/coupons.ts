export const DEFAULT_COUPON_CODE = "RPDJ7K9M24";
export const COUPON_PISTA_PRICE_CENTS = 3000;
export const COUPON_VIP_PRICE_CENTS = 7500;

const codePattern = /^[A-Z0-9_-]{4,40}$/;

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidCouponCode(value: string) {
  return codePattern.test(normalizeCouponCode(value));
}

export function couponPriceCents(coupon: { pistaPriceCents: number; vipPriceCents: number }, tier: string) {
  return tier === "vip" ? coupon.vipPriceCents : coupon.pistaPriceCents;
}
