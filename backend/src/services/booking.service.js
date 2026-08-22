// ============================================================
// Serviço de agendamento.
// Cria (ou reaproveita) o cliente, valida o horário, calcula o
// sinal de 50% e gera a cobrança PIX — tudo de forma consistente.
// ============================================================
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http.js";
import { getSettings, assertSlotBookable } from "./availability.service.js";
import { getPaymentProvider } from "./payment.service.js";

// Cria um agendamento PENDING + cobrança PIX do sinal.
export async function createBooking({ name, phone, serviceId, date, startTime }) {
  const settings = await getSettings();

  // 1) Serviço precisa existir e estar ativo
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) {
    throw new HttpError(404, "Serviço não encontrado ou inativo.");
  }

  // 2) Valida disponibilidade (dia útil, dentro do horário, não ocupado)
  const dateObj = await assertSlotBookable(date, startTime);

  // 3) Calcula valores (sinal = depositPercent% do total)
  const totalCents = service.priceCents;
  const depositCents = Math.round((totalCents * settings.depositPercent) / 100);

  // 4) Transação: cliente + booking + payment
  //    Reforça a checagem de duplicidade dentro da transação para evitar corrida.
  const booking = await prisma.$transaction(async (tx) => {
    const clash = await tx.booking.findFirst({
      where: { date: dateObj, startTime, status: { in: ["PENDING", "CONFIRMED"] } },
    });
    if (clash) throw new HttpError(409, "Este horário acabou de ser reservado.");

    // upsert do cliente pelo celular
    const client = await tx.client.upsert({
      where: { phone },
      update: { name },
      create: { name, phone },
    });

    return tx.booking.create({
      data: {
        clientId: client.id,
        serviceId: service.id,
        date: dateObj,
        startTime,
        status: "PENDING",
        totalCents,
        depositCents,
      },
      include: { client: true, service: true },
    });
  });

  // 5) Gera cobrança PIX do sinal
  const provider = getPaymentProvider();
  const charge = await provider.createPixCharge({
    amountCents: depositCents,
    pixKey: settings.pixKey,
    merchantName: settings.merchantName,
    merchantCity: settings.merchantCity,
    description: `Sinal ${service.name} - ${date} ${startTime}`,
    externalRef: booking.id,
    payerEmail: undefined,
  });

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: process.env.PAYMENT_PROVIDER || "pix",
      amountCents: depositCents,
      status: charge.status === "PAID" ? "PAID" : "PENDING",
      pixCopiaCola: charge.pixCopiaCola,
      qrCodeBase64: charge.qrCodeBase64,
      externalId: charge.externalId,
    },
  });

  // Se o provedor já aprovou (raro no PIX), confirma o agendamento.
  if (payment.status === "PAID") {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
    });
  }

  return { booking, payment };
}

// Consulta o status REAL do pagamento no provedor (Mercado Pago) e,
// se estiver pago, confirma o agendamento. Usado pelo polling do frontend
// (funciona mesmo sem webhook — útil enquanto não há HTTPS).
export async function refreshPaymentStatus(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new HttpError(404, "Agendamento não encontrado.");
  if (booking.status === "CONFIRMED") return booking;

  const payment = booking.payment;
  if (payment?.provider === "mercadopago" && payment.externalId) {
    const provider = getPaymentProvider();
    const status = await provider.getStatus(payment.externalId);
    if (status === "PAID") {
      return confirmPayment(bookingId);
    }
  }
  return booking;
}

// Cliente informa que já pagou o PIX estático (não confirma sozinho:
// o admin verifica o recebimento e confirma no painel).
export async function claimPayment(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new HttpError(404, "Agendamento não encontrado.");
  if (booking.payment) {
    await prisma.payment.update({
      where: { bookingId },
      data: { clientClaimed: true },
    });
  }
  return booking;
}

// Marca o pagamento como pago e confirma o agendamento.
// (Usado pelo webhook, pela simulação e pela confirmação manual do admin.)
export async function confirmPayment(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (!booking) throw new HttpError(404, "Agendamento não encontrado.");
  if (!booking.payment) throw new HttpError(400, "Agendamento sem cobrança.");

  if (booking.status === "CONFIRMED") return booking; // idempotente

  const [, updated] = await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { status: "PAID" },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
      include: { client: true, service: true, payment: true },
    }),
  ]);

  return updated;
}
