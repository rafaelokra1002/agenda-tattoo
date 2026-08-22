// Centraliza a leitura das variáveis de ambiente.
import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // "pix" (estático, padrão) | "mercadopago" | "fake"
  paymentProvider: process.env.PAYMENT_PROVIDER || "pix",
  mercadopagoToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
};
