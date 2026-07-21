import { z } from "zod";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { isValidCouponCode, normalizeCouponCode } from "@/lib/coupons";

const cpf = z
  .string()
  .transform(onlyDigits)
  .refine(isValidCPF, "CPF inválido");

/** Each attendee gets a nominal ticket (name + CPF). */
export const participantSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo"),
  cpf,
});

/** The buyer (who pays) — also receives the order confirmation. */
export const buyerSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo"),
  cpf,
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  whatsapp: z
    .string()
    .transform(onlyDigits)
    .refine((v) => v.length >= 10 && v.length <= 11, "WhatsApp inválido"),
});

export const cartItemSchema = z.object({
  lotId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Selecione ao menos um ingresso"),
  buyer: buyerSchema,
  participants: z.array(participantSchema).min(1).max(20),
  couponCode: z
    .string()
    .trim()
    .transform(normalizeCouponCode)
    .refine((value) => value.length === 0 || isValidCouponCode(value), "Cupom invÃ¡lido")
    .optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type BuyerInput = z.infer<typeof buyerSchema>;
export type ParticipantInput = z.infer<typeof participantSchema>;
