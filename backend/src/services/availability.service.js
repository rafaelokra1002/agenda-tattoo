// ============================================================
// Serviço de disponibilidade de horários.
// Concentra TODAS as regras de negócio de agenda:
//  - Domingo bloqueado
//  - Datas bloqueadas (feriados/folgas)
//  - Horários configurados por dia da semana
//  - Só agendar até maxBookingHour (ex.: 16h)
//  - Não permitir horário duplicado (ignora cancelados)
// ============================================================
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http.js";
import { parseDateOnly, weekdayOf, hourOf } from "../utils/date.js";

// Status que "ocupam" um horário
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

// Carrega as configurações globais (singleton), criando se necessário.
export async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: "singleton" } });
  }
  return settings;
}

// Cancela agendamentos PENDING (aguardando pagamento) que passaram do tempo
// de reserva (holdMinutes). Isso LIBERA a vaga automaticamente.
// Chamado de forma "preguiçosa" nas checagens de disponibilidade/criação.
export async function expireStalePending(holdMinutes) {
  const minutes = Number(holdMinutes) > 0 ? Number(holdMinutes) : 30;
  const cutoff = new Date(Date.now() - minutes * 60_000);
  await prisma.booking.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    data: { status: "CANCELLED" },
  });
}

// Retorna os horários disponíveis de uma data ("YYYY-MM-DD").
export async function getAvailableSlots(dateStr) {
  const date = parseDateOnly(dateStr);
  const weekday = weekdayOf(date);

  const settings = await getSettings();

  // Libera vagas de PENDING que expiraram antes de calcular a disponibilidade.
  await expireStalePending(settings.holdMinutes);

  // 1) A data está bloqueada? (feriado/folga)
  const blocked = await prisma.blockedDate.findUnique({ where: { date } });
  if (blocked) {
    return { date: dateStr, available: [], reason: blocked.reason || "Data bloqueada" };
  }

  // 2) O dia da semana está habilitado? (domingo vem desabilitado no seed)
  const wh = await prisma.workingHours.findUnique({ where: { weekday } });
  if (!wh || !wh.enabled || !wh.slots) {
    return { date: dateStr, available: [], reason: "Sem atendimento neste dia" };
  }

  // 3) Slots configurados, filtrando pelo limite de hora (só até maxBookingHour)
  const configured = wh.slots
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((slot) => hourOf(slot) <= settings.maxBookingHour);

  // 4) Remove horários já ocupados (bookings ativos naquele dia)
  const taken = await prisma.booking.findMany({
    where: { date, status: { in: ACTIVE_STATUSES } },
    select: { startTime: true },
  });
  const takenSet = new Set(taken.map((b) => b.startTime));

  const available = configured.filter((slot) => !takenSet.has(slot));

  return { date: dateStr, available };
}

// Valida se um (data, horário) específico pode ser agendado.
// Lança HttpError caso não possa. Retorna o Date normalizado.
export async function assertSlotBookable(dateStr, startTime) {
  const { available } = await getAvailableSlots(dateStr);
  if (!available.includes(startTime)) {
    throw new HttpError(
      409,
      "Horário indisponível. Ele pode estar ocupado, fora do expediente ou bloqueado."
    );
  }
  return parseDateOnly(dateStr);
}
