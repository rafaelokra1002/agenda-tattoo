// Controllers públicos (usados pelo site do cliente, sem login).
import { prisma } from "../config/prisma.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { getAvailableSlots, getSettings } from "../services/availability.service.js";
import { createBooking, confirmPayment } from "../services/booking.service.js";

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

// POST /api/payments/:bookingId/confirm -> SIMULAÇÃO de pagamento aprovado.
// Em produção com Mercado Pago, quem chama isso é o webhook.
export const simulatePayment = asyncHandler(async (req, res) => {
  const booking = await confirmPayment(req.params.bookingId);
  res.json({ status: booking.status, bookingId: booking.id });
});

// POST /api/payments/webhook -> endpoint do provedor real (Mercado Pago).
export const paymentWebhook = asyncHandler(async (req, res) => {
  // O Mercado Pago envia { data: { id }, type: "payment" }.
  // Aqui você buscaria o pagamento pelo externalId e confirmaria.
  // Mantido simples: aceita { bookingId } para reaproveitar a lógica.
  const bookingId = req.body?.bookingId;
  if (bookingId) await confirmPayment(bookingId);
  res.sendStatus(200);
});
