// ============================================================
// Serviço de pagamento PIX.
// Adapters disponíveis (env PAYMENT_PROVIDER):
//   - "pix"         -> PIX ESTÁTICO real, gerado a partir da chave do admin
//                      (email/telefone/CPF). Confirmação MANUAL pelo admin.
//   - "mercadopago" -> PIX dinâmico com confirmação automática (precisa token)
//   - "fake"        -> simulado (desenvolvimento)
// ============================================================
import QRCode from "qrcode";
import { env } from "../config/env.js";

// ------------------------------------------------------------
// Helpers do BR Code (padrão EMV do PIX / Banco Central)
// ------------------------------------------------------------

// Campo no formato EMV: ID(2) + tamanho(2) + valor
function tlv(id, value) {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

// Remove acentos, deixa em maiúsculas ASCII e corta no tamanho máximo.
function sanitize(str, max) {
  // NFD decompõe acentos; o filtro ASCII abaixo remove as marcas resultantes.
  return (str || "")
    .normalize("NFD")
    .replace(/[^\x20-\x7E]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max);
}

// CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF) — exigido pelo PIX.
function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Monta o "copia e cola" (BR Code) de um PIX estático com valor fixo.
export function buildBRCode({ pixKey, merchantName, merchantCity, amountCents, txid }) {
  const merchantAccount = tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", pixKey));
  const amount = (amountCents / 100).toFixed(2);
  // TxID: alfanumérico, até 25 chars (usa o id do agendamento como referência)
  const reference = (txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const additionalData = tlv("62", tlv("05", reference));

  const payload =
    tlv("00", "01") + // Payload Format Indicator
    tlv("01", "11") + // Point of Initiation (estático/reutilizável)
    merchantAccount +
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Moeda: BRL
    tlv("54", amount) + // Valor
    tlv("58", "BR") + // País
    tlv("59", sanitize(merchantName, 25) || "TATUADOR") + // Nome do recebedor
    tlv("60", sanitize(merchantCity, 15) || "BRASIL") + // Cidade
    additionalData +
    "6304"; // marcador do CRC (calculado sobre tudo até aqui)

  return payload + crc16(payload);
}

// ------------------------------------------------------------
// PIX ESTÁTICO (chave do admin) — sem callback, confirmação manual.
// ------------------------------------------------------------
const pixEstaticoProvider = {
  async createPixCharge({ amountCents, pixKey, merchantName, merchantCity, externalRef }) {
    if (!pixKey) {
      throw new Error(
        "Chave PIX não configurada. Cadastre a chave em Configurações (admin)."
      );
    }
    const brcode = buildBRCode({
      pixKey,
      merchantName,
      merchantCity,
      amountCents,
      txid: externalRef,
    });
    const qrCodeBase64 = await QRCode.toDataURL(brcode, { margin: 1, width: 300 });
    return { externalId: null, pixCopiaCola: brcode, qrCodeBase64, status: "PENDING" };
  },
  // PIX estático não notifica pagamento: a confirmação é feita pelo admin.
  async getStatus() {
    return "PENDING";
  },
};

// ------------------------------------------------------------
// Adapter SIMULADO (desenvolvimento)
// ------------------------------------------------------------
const fakeProvider = {
  async createPixCharge({ amountCents, pixKey, externalRef }) {
    const externalId = `fake_${externalRef}_${Date.now()}`;
    const pixCopiaCola =
      `00020126PIX-SIMULADO-${pixKey || "sem-chave"}-` +
      `${(amountCents / 100).toFixed(2)}-${externalId}`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <rect width='200' height='200' fill='#fff'/>
      <rect x='20' y='20' width='160' height='160' fill='#111'/>
      <rect x='40' y='40' width='120' height='120' fill='#fff'/>
      <text x='100' y='105' font-size='11' text-anchor='middle' fill='#111'>PIX SIMULADO</text>
    </svg>`;
    const qrCodeBase64 = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    return { externalId, pixCopiaCola, qrCodeBase64, status: "PENDING" };
  },
  async getStatus() {
    return "PENDING";
  },
};

// ------------------------------------------------------------
// Adapter Mercado Pago (PIX dinâmico com confirmação automática)
// ------------------------------------------------------------
const mercadoPagoProvider = {
  async createPixCharge({ amountCents, description, externalRef, payerEmail }) {
    if (!env.mercadopagoToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
    }
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

// Seleciona o provedor. Padrão: PIX estático ("pix").
export function getPaymentProvider() {
  if (env.paymentProvider === "mercadopago") return mercadoPagoProvider;
  if (env.paymentProvider === "fake") return fakeProvider;
  return pixEstaticoProvider;
}
