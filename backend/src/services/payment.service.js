// ============================================================
// Serviço de pagamento PIX.
// Usa um "adapter": em produção troque "fake" por "mercadopago".
// A interface é sempre a mesma: createPixCharge() e getStatus().
// ============================================================
import { env } from "../config/env.js";

// ------------------------------------------------------------
// Adapter SIMULADO — gera um "copia e cola" e um QR fake.
// Perfeito para desenvolvimento/homologação.
// ------------------------------------------------------------
const fakeProvider = {
  async createPixCharge({ amountCents, pixKey, description, externalRef }) {
    const externalId = `fake_${externalRef}_${Date.now()}`;
    // "Copia e cola" apenas ilustrativo (não é um BR Code real).
    const pixCopiaCola =
      `00020126PIX-SIMULADO-${pixKey || "sem-chave"}-` +
      `${(amountCents / 100).toFixed(2)}-${externalId}`;

    // QR "fake": um SVG simples embutido como data URL.
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <rect width='200' height='200' fill='#fff'/>
      <rect x='20' y='20' width='160' height='160' fill='#111'/>
      <rect x='40' y='40' width='120' height='120' fill='#fff'/>
      <text x='100' y='105' font-size='11' text-anchor='middle' fill='#111'>PIX SIMULADO</text>
    </svg>`;
    const qrCodeBase64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

    return { externalId, pixCopiaCola, qrCodeBase64, status: "PENDING" };
  },

  // No modo fake, a confirmação é feita manualmente pelo endpoint de simulação.
  async getStatus() {
    return "PENDING";
  },
};

// ------------------------------------------------------------
// Adapter Mercado Pago (esqueleto pronto para integrar).
// Basta instalar "mercadopago" e preencher a lógica das chamadas.
// ------------------------------------------------------------
const mercadoPagoProvider = {
  async createPixCharge({ amountCents, description, externalRef, payerEmail }) {
    if (!env.mercadopagoToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
    }
    // Exemplo com a API REST do Mercado Pago (Pix):
    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.mercadopagoToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": externalRef,
      },
      body: JSON.stringify({
        transaction_amount: Number((amountCents / 100).toFixed(2)),
        description: description || "Sinal de agendamento",
        payment_method_id: "pix",
        payer: { email: payerEmail || "cliente@example.com" },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao criar cobrança PIX.");

    const tx = data.point_of_interaction?.transaction_data || {};
    return {
      externalId: String(data.id),
      pixCopiaCola: tx.qr_code || null,
      qrCodeBase64: tx.qr_code_base64
        ? `data:image/png;base64,${tx.qr_code_base64}`
        : null,
      status: data.status === "approved" ? "PAID" : "PENDING",
    };
  },

  async getStatus(externalId) {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${externalId}`, {
      headers: { Authorization: `Bearer ${env.mercadopagoToken}` },
    });
    const data = await res.json();
    return data.status === "approved" ? "PAID" : "PENDING";
  },
};

// Seleciona o provedor conforme a variável de ambiente.
export function getPaymentProvider() {
  return env.paymentProvider === "mercadopago" ? mercadoPagoProvider : fakeProvider;
}
