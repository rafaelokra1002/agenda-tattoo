// Configuração do app Express (middlewares + rotas).
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { notFound, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());

  // Healthcheck
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // Rotas
  app.use("/api", publicRoutes);
  app.use("/api/admin", adminRoutes);

  // 404 + tratamento de erros (sempre por último)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
