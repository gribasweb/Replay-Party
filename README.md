# Replay Party

Site de venda de ingressos para a festa **Replay Party** (27/07/2026, Campinas-SP).
Inclui checkout, geração de ingresso com QR Code, check-in na portaria, consulta de
ingressos e e-mail automático.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + Motion
- Drizzle ORM + PostgreSQL (Supabase)
- Mercado Pago (pagamento — em integração)
- Resend (e-mail), qrcode (geração), html5-qrcode (leitura)

## Rodando localmente
1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha as variáveis.
3. Crie as tabelas e popule os lotes: `node --env-file=.env.local scripts/db-setup.mjs`
4. `npm run dev` e abra http://localhost:3000

## Variáveis de ambiente
Veja `.env.example`:
- `DATABASE_URL` — Postgres (Supabase)
- `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY` — Mercado Pago
- `RESEND_API_KEY`, `EMAIL_FROM` — e-mail
- `CHECKIN_PASSWORD` — senha da tela de check-in
- `NEXT_PUBLIC_BASE_URL` — URL pública do site

## Páginas
- `/` — landing
- `/checkout?lot=<id>` — compra
- `/pedido/[id]` — ingressos com QR
- `/ingresso/[token]` — ingresso individual
- `/meus-ingressos` — consulta por e-mail + CPF
- `/checkin` — validação na portaria (protegida por senha)

## Deploy
Recomendado: **Vercel** (suporta Next.js com backend completo). Conecte o
repositório, configure as variáveis de ambiente e faça o deploy.

> GitHub Pages **não** é compatível: ele serve apenas conteúdo estático, e este
> projeto usa rotas de API e banco de dados (server-side).
