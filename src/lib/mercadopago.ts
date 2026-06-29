import { MercadoPagoConfig, Payment } from "mercadopago";

// Access Token lives ONLY on the server. Never expose it to the client.
const accessToken = process.env.MP_ACCESS_TOKEN ?? "";

export const mpClient = new MercadoPagoConfig({
  accessToken,
  options: { timeout: 8000 },
});

export const mpPayment = new Payment(mpClient);

export const isMpConfigured = () => accessToken.length > 0;
