// ============================================================
// Seed inicial do banco.
// Cria: admin, configurações, serviços e horários da semana.
// Rode com: npm run seed
// ============================================================
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// Tabela de serviços solicitada (preços em centavos)
const services = [
  { name: "Nome", sizeLabel: "7cm a 10cm", priceCents: 80_00 },
  { name: "Frases", sizeLabel: "12cm a 15cm", priceCents: 120_00 },
  { name: "Parte superior do braço", sizeLabel: null, priceCents: 600_00 },
  { name: "Antebraço", sizeLabel: null, priceCents: 550_00 },
  { name: "Mão", sizeLabel: null, priceCents: 250_00 },
  { name: "Canela/Panturrilha", sizeLabel: null, priceCents: 700_00 },
  { name: "Fechamento braço", sizeLabel: null, priceCents: 1000_00 },
  { name: "Fechamento costas", sizeLabel: null, priceCents: 3000_00 },
];

// Horários por dia da semana (0=Dom ... 6=Sáb)
// Seg-Qui: 08:30 e 14:30 | Sex-Sáb: 09:00 às 16:00 | Dom: bloqueado
const workingHours = [
  { weekday: 0, enabled: false, slots: "" }, // Domingo
  { weekday: 1, enabled: true, slots: "08:30,14:30" }, // Segunda
  { weekday: 2, enabled: true, slots: "08:30,14:30" }, // Terça
  { weekday: 3, enabled: true, slots: "08:30,14:30" }, // Quarta
  { weekday: 4, enabled: true, slots: "08:30,14:30" }, // Quinta
  { weekday: 5, enabled: true, slots: "09:00,10:00,11:00,12:00,13:00,14:00,15:00,16:00" }, // Sexta
  { weekday: 6, enabled: true, slots: "09:00,10:00,11:00,12:00,13:00,14:00,15:00,16:00" }, // Sábado
];

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1) Configurações globais (singleton)
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      depositPercent: 50,
      maxBookingHour: 16,
      holdMinutes: 30,
      pixKey: "",
      merchantName: "The Freedom Tattoo",
      merchantCity: "Sao Paulo",
    },
  });
  console.log("✅ Configurações criadas");

  // 2) Admin
  const email = process.env.ADMIN_EMAIL || "admin@tattoo.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Administrador";
  const passwordHash = await bcrypt.hash(password, 10);

  // A senha só é definida na CRIAÇÃO do admin. Em atualizações NÃO mexemos na
  // senha, para preservar a que o admin definir pelo painel (Redefinir senha).
  // Exceção: ADMIN_RESET_PASSWORD="true" força resetar a senha para ADMIN_PASSWORD
  // (útil se esquecer a senha — depois volte a variável para false).
  const forceReset = process.env.ADMIN_RESET_PASSWORD === "true";
  const updateData = forceReset ? { name, passwordHash } : { name };

  // Se existe exatamente 1 admin com email diferente, RENOMEIA (evita duplicar).
  const admins = await prisma.admin.findMany();
  if (admins.length === 1 && admins[0].email !== email) {
    await prisma.admin.update({
      where: { id: admins[0].id },
      data: { email, ...updateData },
    });
  } else {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      await prisma.admin.update({ where: { email }, data: updateData });
    } else {
      await prisma.admin.create({ data: { email, passwordHash, name } });
    }
  }
  // Nunca logar a senha (os logs de deploy podem ser visíveis).
  console.log(`✅ Admin garantido: ${email}${forceReset ? " (senha resetada)" : ""}`);

  // 3) Serviços — só cria os exemplos iniciais se NÃO houver nenhum serviço.
  // Assim, depois que o tatuador cadastra os próprios serviços, um redeploy
  // NÃO recria os genéricos (a lista dele é preservada).
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    for (const s of services) {
      await prisma.service.create({ data: s });
    }
    console.log(`✅ ${services.length} serviços iniciais criados`);
  } else {
    console.log(`✅ ${serviceCount} serviços mantidos (não sobrescreve os seus)`);
  }

  // 4) Horários da semana
  for (const wh of workingHours) {
    await prisma.workingHours.upsert({
      where: { weekday: wh.weekday },
      update: { enabled: wh.enabled, slots: wh.slots },
      create: wh,
    });
  }
  console.log("✅ Horários da semana configurados");

  console.log("🎉 Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
