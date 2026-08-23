// ============================================================
// Controllers do painel administrativo (protegidos por JWT).
// ============================================================
import { prisma } from "../config/prisma.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { assertSlotBookable, getSettings } from "../services/availability.service.js";
import { parseDateOnly } from "../utils/date.js";

// ------------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------------
// GET /api/admin/dashboard
export const dashboard = asyncHandler(async (_req, res) => {
  const today = parseDateOnly(new Date().toISOString().slice(0, 10));

  const [total, confirmed, pending, revenueAgg, upcoming] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    // Faturamento = soma dos sinais pagos + total dos concluídos
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: "PAID" },
    }),
    // Próximos horários confirmados a partir de hoje
    prisma.booking.findMany({
      where: { date: { gte: today }, status: { in: ["CONFIRMED", "PENDING"] } },
      include: { client: true, service: true, payment: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 8,
    }),
  ]);

  res.json({
    totals: { total, confirmed, pending },
    revenueCents: revenueAgg._sum.amountCents || 0,
    upcoming,
  });
});

// ------------------------------------------------------------
// AGENDAMENTOS
// ------------------------------------------------------------
// GET /api/admin/bookings?status=&date=
export const listBookings = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  const where = {};
  if (status) where.status = String(status);
  if (date) where.date = parseDateOnly(String(date));

  const bookings = await prisma.booking.findMany({
    where,
    include: { client: true, service: true, payment: true },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  });
  res.json(bookings);
});

// POST /api/admin/bookings -> cria agendamento manualmente (walk-in / telefone).
// Não passa pelo fluxo de PIX; o admin já marca como CONFIRMED por padrão.
export const createAdminBooking = asyncHandler(async (req, res) => {
  const { name, phone, serviceId, date, startTime, status = "CONFIRMED" } = req.body;
  const settings = await getSettings();

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new HttpError(404, "Serviço não encontrado.");

  const dateObj = await assertSlotBookable(date, startTime);

  const totalCents = service.priceCents;
  const depositCents = Math.round((totalCents * settings.depositPercent) / 100);

  const booking = await prisma.$transaction(async (tx) => {
    const client = await tx.client.upsert({
      where: { phone },
      update: { name },
      create: { name, phone },
    });
    const created = await tx.booking.create({
      data: {
        clientId: client.id,
        serviceId: service.id,
        date: dateObj,
        startTime,
        status,
        totalCents,
        depositCents,
      },
      include: { client: true, service: true },
    });
    // Se já nasce confirmado, registra o sinal como pago (entra no faturamento).
    if (status === "CONFIRMED") {
      await tx.payment.create({
        data: {
          bookingId: created.id,
          provider: "manual",
          status: "PAID",
          amountCents: depositCents,
        },
      });
    }
    return created;
  });

  res.status(201).json(booking);
});

// PATCH /api/admin/bookings/:id/confirm -> confirma o pagamento manualmente.
// Usado no fluxo de PIX estático: o admin verifica o recebimento e confirma.
export const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { payment: true },
  });
  if (!booking) throw new HttpError(404, "Agendamento não encontrado.");

  const updated = await prisma.$transaction(async (tx) => {
    if (booking.payment) {
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: { status: "PAID" },
      });
    }
    return tx.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
      include: { client: true, service: true, payment: true },
    });
  });

  res.json(updated);
});

// PATCH /api/admin/bookings/:id/cancel
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw new HttpError(404, "Agendamento não encontrado.");

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: "CANCELLED" },
    include: { client: true, service: true },
  });
  res.json(updated);
});

// PATCH /api/admin/bookings/:id/reschedule  { date, startTime }
export const rescheduleBooking = asyncHandler(async (req, res) => {
  const { date, startTime } = req.body;

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) throw new HttpError(404, "Agendamento não encontrado.");

  // Valida o novo horário com as mesmas regras públicas.
  const newDate = await assertSlotBookable(date, startTime);

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { date: newDate, startTime },
    include: { client: true, service: true },
  });
  res.json(updated);
});

// ------------------------------------------------------------
// CLIENTES
// ------------------------------------------------------------
// GET /api/admin/clients
export const listClients = asyncHandler(async (_req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });
  res.json(clients);
});

// ------------------------------------------------------------
// SERVIÇOS (CRUD)
// ------------------------------------------------------------
// GET /api/admin/services
export const listAllServices = asyncHandler(async (_req, res) => {
  const services = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });
  res.json(services);
});

// POST /api/admin/services
export const createService = asyncHandler(async (req, res) => {
  const service = await prisma.service.create({ data: req.body });
  res.status(201).json(service);
});

// PUT /api/admin/services/:id
export const updateService = asyncHandler(async (req, res) => {
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(service);
});

// DELETE /api/admin/services/:id
// Se já houver agendamentos, apenas inativa (soft delete) para preservar histórico.
export const deleteService = asyncHandler(async (req, res) => {
  const count = await prisma.booking.count({ where: { serviceId: req.params.id } });
  if (count > 0) {
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    return res.json({ softDeleted: true, service });
  }
  await prisma.service.delete({ where: { id: req.params.id } });
  res.json({ deleted: true });
});

// ------------------------------------------------------------
// HORÁRIOS (working hours + datas bloqueadas)
// ------------------------------------------------------------
// GET /api/admin/working-hours
export const listWorkingHours = asyncHandler(async (_req, res) => {
  const hours = await prisma.workingHours.findMany({ orderBy: { weekday: "asc" } });
  res.json(hours);
});

// PUT /api/admin/working-hours/:weekday  { enabled, slots }
export const upsertWorkingHours = asyncHandler(async (req, res) => {
  const weekday = Number(req.params.weekday);
  if (Number.isNaN(weekday) || weekday < 0 || weekday > 6) {
    throw new HttpError(400, "weekday inválido (0-6).");
  }
  const { enabled, slots } = req.body;
  const wh = await prisma.workingHours.upsert({
    where: { weekday },
    update: { enabled, slots },
    create: { weekday, enabled, slots },
  });
  res.json(wh);
});

// GET /api/admin/blocked-dates
export const listBlockedDates = asyncHandler(async (_req, res) => {
  const dates = await prisma.blockedDate.findMany({ orderBy: { date: "asc" } });
  res.json(dates);
});

// POST /api/admin/blocked-dates  { date, reason }
export const createBlockedDate = asyncHandler(async (req, res) => {
  const created = await prisma.blockedDate.create({
    data: { date: parseDateOnly(req.body.date), reason: req.body.reason || null },
  });
  res.status(201).json(created);
});

// DELETE /api/admin/blocked-dates/:id
export const deleteBlockedDate = asyncHandler(async (req, res) => {
  await prisma.blockedDate.delete({ where: { id: req.params.id } });
  res.json({ deleted: true });
});

// ------------------------------------------------------------
// CONFIGURAÇÕES
// ------------------------------------------------------------
// GET /api/admin/settings
export const getAdminSettings = asyncHandler(async (_req, res) => {
  res.json(await getSettings());
});

// PUT /api/admin/settings
export const updateSettings = asyncHandler(async (req, res) => {
  await getSettings(); // garante que exista
  const settings = await prisma.settings.update({
    where: { id: "singleton" },
    data: req.body,
  });
  res.json(settings);
});
