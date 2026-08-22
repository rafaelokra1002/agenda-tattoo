// Ponto de entrada do servidor.
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`🚀 API rodando em http://localhost:${env.port}`);
  console.log(`   Ambiente: ${env.nodeEnv} | Pagamento: ${env.paymentProvider}`);
});

// Encerramento gracioso
async function shutdown() {
  console.log("\n⏳ Encerrando servidor...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
