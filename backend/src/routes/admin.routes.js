// Rotas do painel administrativo. Tudo (exceto login) exige JWT.
import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  passwordSchema,
  serviceSchema,
  settingsSchema,
  workingHoursSchema,
  blockedDateSchema,
  rescheduleSchema,
  adminBookingSchema,
} from "../validators/schemas.js";
import { login, me, changePassword } from "../controllers/auth.controller.js";
import {
  dashboard,
  listBookings,
  createAdminBooking,
  confirmBooking,
  cancelBooking,
  resetData,
  rescheduleBooking,
  listClients,
  listAllServices,
  createService,
  updateService,
  deleteService,
  listWorkingHours,
  upsertWorkingHours,
  listBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
  getAdminSettings,
  updateSettings,
} from "../controllers/admin.controller.js";

const router = Router();

// --- Autenticação ---
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAdmin, me);

// A partir daqui, todas exigem admin autenticado.
router.use(requireAdmin);

// Segurança
router.patch("/password", validate(passwordSchema), changePassword);

// Dashboard
router.get("/dashboard", dashboard);

// Reset dos dados transacionais (mantém configuração)
router.post("/reset", resetData);

// Agendamentos
router.get("/bookings", listBookings);
router.post("/bookings", validate(adminBookingSchema), createAdminBooking);
router.patch("/bookings/:id/confirm", confirmBooking);
router.patch("/bookings/:id/cancel", cancelBooking);
router.patch("/bookings/:id/reschedule", validate(rescheduleSchema), rescheduleBooking);

// Clientes
router.get("/clients", listClients);

// Serviços
router.get("/services", listAllServices);
router.post("/services", validate(serviceSchema), createService);
router.put("/services/:id", validate(serviceSchema.partial()), updateService);
router.delete("/services/:id", deleteService);

// Horários
router.get("/working-hours", listWorkingHours);
router.put("/working-hours/:weekday", validate(workingHoursSchema.partial()), upsertWorkingHours);
router.get("/blocked-dates", listBlockedDates);
router.post("/blocked-dates", validate(blockedDateSchema), createBlockedDate);
router.delete("/blocked-dates/:id", deleteBlockedDate);

// Configurações
router.get("/settings", getAdminSettings);
router.put("/settings", validate(settingsSchema), updateSettings);

export default router;
