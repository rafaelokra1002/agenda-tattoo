// Schemas de validação (Zod) usados pelas rotas.
import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createBookingSchema = z.object({
  name: z.string().min(2, "Informe o nome completo."),
  phone: z
    .string()
    .min(8, "Celular inválido.")
    .max(20)
    .regex(/^[\d\s()+-]+$/, "Celular inválido."),
  serviceId: z.string().min(1, "Selecione um serviço."),
  date: z.string().regex(dateRegex, "Data inválida (YYYY-MM-DD)."),
  startTime: z.string().regex(timeRegex, "Horário inválido (HH:MM)."),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Nome muito curto."),
  sizeLabel: z.string().optional().nullable(),
  priceCents: z.number().int().positive("Preço deve ser positivo."),
  active: z.boolean().optional(),
});

export const settingsSchema = z.object({
  depositPercent: z.number().int().min(0).max(100).optional(),
  pixKey: z.string().optional(),
  maxBookingHour: z.number().int().min(0).max(23).optional(),
});

export const workingHoursSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  slots: z.string(), // "08:30,14:30"
});

export const blockedDateSchema = z.object({
  date: z.string().regex(dateRegex, "Data inválida (YYYY-MM-DD)."),
  reason: z.string().optional().nullable(),
});

export const rescheduleSchema = z.object({
  date: z.string().regex(dateRegex, "Data inválida (YYYY-MM-DD)."),
  startTime: z.string().regex(timeRegex, "Horário inválido (HH:MM)."),
});

// Criação manual de agendamento pelo admin (sem fluxo de pagamento público).
export const adminBookingSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  phone: z.string().min(8, "Celular inválido.").max(20),
  serviceId: z.string().min(1, "Selecione um serviço."),
  date: z.string().regex(dateRegex, "Data inválida (YYYY-MM-DD)."),
  startTime: z.string().regex(timeRegex, "Horário inválido (HH:MM)."),
  status: z.enum(["PENDING", "CONFIRMED"]).optional(),
});
