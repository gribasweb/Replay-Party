import { MercadoPagoConfig, Payment } from "mercadopago";

// Access Token lives ONLY on the server. Never expose it to the client.
const accessToken = process.env.MP_ACCESS_TOKEN ?? "";

export const mpClient = new MercadoPagoConfig({
  accessToken,
  options: { timeout: 8000 },
});

export const mpPayment = new Payment(mpClient);

export const isMpConfigured = () => accessToken.length > 0;

/**
 * Cria um cliente de pagamento com o Access Token do VENDEDOR (organizador),
 * obtido via OAuth. No Split de Pagamentos, o pagamento cai na conta do
 * vendedor e o nosso application_fee (15%) vai para a conta da Gustavo-Party.
 */
export function mpPaymentWith(token: string) {
  return new Payment(new MercadoPagoConfig({ accessToken: token, options: { timeout: 8000 } }));
}
