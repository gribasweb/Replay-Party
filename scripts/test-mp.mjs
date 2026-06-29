import { MercadoPagoConfig, Payment } from "mercadopago";
import { randomUUID } from "node:crypto";

const token = process.env.MP_ACCESS_TOKEN;
if (!token) {
  console.error("Sem MP_ACCESS_TOKEN");
  process.exit(1);
}

const client = new MercadoPagoConfig({ accessToken: token });
const payment = new Payment(client);

try {
  const r = await payment.create({
    body: {
      transaction_amount: 1,
      description: "Teste credenciais Replay Party",
      payment_method_id: "pix",
      payer: {
        email: "comprador.teste@gmail.com",
        identification: { type: "CPF", number: "12345678909" },
      },
    },
    requestOptions: { idempotencyKey: randomUUID() },
  });
  console.log("CREDENCIAIS OK");
  console.log("payment id:", r.id);
  console.log("status    :", r.status);
  console.log("Pix QR gerado?", Boolean(r.point_of_interaction?.transaction_data?.qr_code));
} catch (e) {
  console.error("ERRO:", e?.message);
  if (e?.cause) console.error("cause:", JSON.stringify(e.cause).slice(0, 300));
}
