// Middleware central de tratamento de erros.
import { ZodError } from "zod";
import { HttpError } from "../utils/http.js";

export function notFound(_req, res) {
  res.status(404).json({ error: "Rota não encontrada." });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Erros de validação do Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos.",
      details: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  }

  // Erros de aplicação controlados
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details || undefined,
    });
  }

  // Violação de unicidade do Prisma (ex.: telefone/email duplicado)
  if (err?.code === "P2002") {
    return res.status(409).json({ error: "Registro já existe." });
  }

  console.error("💥 Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor." });
}
