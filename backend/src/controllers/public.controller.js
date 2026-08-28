// Controllers públicos (usados pelo site do cliente, sem login).
import { prisma } from "../config/prisma.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { getAvailableSlots, getSettings } from "../services/availability.service.js";
import {
  createBooking,
  confirmPayment,
  refreshPaymentStatus,
  claimPayment,
} from "../services/booking.service.js";
import { getPaymentProvider } from "../services/payment.service.js";

// GET /api/services -> lista serviços ativos
export const listServices = asyncHandler(async (_req, res) => {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { priceCents: "asc" },
  });
  res.json(services);
});

// GET /api/availability?date=YYYY-MM-DD -> horários livres do dia
export const getAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new HttpError(400, "Parâmetro 'date' é obrigatório.");
  const result = await getAvailableSlots(String(date));
  res.json(result);
});

// GET /api/settings/public -> dados públicos (%, chave PIX, limite de hora)
export const getPublicSettings = asyncHandler(async (_req, res) => {
  const s = await getSettings();
  res.json({
    depositPercent: s.depositPercent,
    pixKey: s.pixKey,
    maxBookingHour: s.maxBookingHour,
    holdMinutes: s.holdMinutes,
  });
});

// POST /api/bookings -> cria agendamento + cobrança PIX
export const postBooking = asyncHandler(async (req, res) => {
  const { booking, payment } = await createBooking(req.body);
  res.status(201).json({
    bookingId: booking.id,
    status: booking.status,
    total: booking.totalCents,
    deposit: booking.depositCents,
    service: booking.service,
    date: booking.date,
    startTime: booking.startTime,
    payment: {
      status: payment.status,
      pixCopiaCola: payment.pixCopiaCola,
      qrCodeBase64: payment.qrCodeBase64,
    },
  });
});

// GET /api/bookings/:id -> consulta status do agendamento (polling do frontend)
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { service: true, client: true, payment: true },
  });
  if (!booking) throw new HttpError(404, "Agendamento não encontrado.");
  res.json(booking);
});

// GET /api/payments/:bookingId/status -> consulta o status real (Mercado Pago)
// e confirma o agendamento se já estiver pago. Usado pelo polling do frontend.
export const checkPaymentStatus = asyncHandler(async (req, res) => {
  const booking = await refreshPaymentStatus(req.params.bookingId);
  res.json({ status: booking.status, bookingId: booking.id });
});

// POST /api/payments/:bookingId/claim -> cliente informa que pagou (PIX estático).
// Não confirma o agendamento; apenas sinaliza para o admin verificar.
export const claimPaymentController = asyncHandler(async (req, res) => {
  await claimPayment(req.params.bookingId);
  res.json({ ok: true });
});

// POST /api/payments/:bookingId/confirm -> SIMULAÇÃO (apenas modo "fake").
export const simulatePayment = asyncHandler(async (req, res) => {
  const booking = await confirmPayment(req.params.bookingId);
  res.json({ status: booking.status, bookingId: booking.id });
});

// POST /api/payments/webhook -> notificações do provedor real (Mercado Pago).
// O MP envia { type: "payment", data: { id } } (ou via query string).
// Buscamos o pagamento no MP; se aprovado, confirmamos o agendamento.
export const paymentWebhook = asyncHandler(async (req, res) => {
  // Compatibilidade: aceita { bookingId } direto (útil para testes).
  if (req.body?.bookingId) {
    await confirmPayment(req.body.bookingId);
    return res.sendStatus(200);
  }

  const type = req.body?.type || req.query?.type;
  const paymentId =
    req.body?.data?.id || req.query?.["data.id"] || req.query?.id;

  if (type === "payment" && paymentId) {
    const provider = getPaymentProvider();
    const status = await provider.getStatus(String(paymentId));
    if (status === "PAID") {
      const payment = await prisma.payment.findFirst({
        where: { externalId: String(paymentId) },
      });
      if (payment) await confirmPayment(payment.bookingId);
    }
  }
  // Sempre 200 para o MP não reenviar indefinidamente.
  res.sendStatus(200);
});
