// Rotas públicas (site do cliente).
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createBookingSchema } from "../validators/schemas.js";
import {
  listServices,
  getAvailability,
  getPublicSettings,
  postBooking,
  getBooking,
  simulatePayment,
  paymentWebhook,
} from "../controllers/public.controller.js";

const router = Router();

router.get("/services", listServices);
router.get("/availability", getAvailability);
router.get("/settings/public", getPublicSettings);

router.post("/bookings", validate(createBookingSchema), postBooking);
router.get("/bookings/:id", getBooking);

router.post("/payments/:bookingId/confirm", simulatePayment); // simulação PIX
router.post("/payments/webhook", paymentWebhook); // provedor real

export default router;
