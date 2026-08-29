// Controller de autenticação do admin.
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { asyncHandler, HttpError } from "../utils/http.js";
import { signToken } from "../utils/jwt.js";

// POST /api/admin/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) throw new HttpError(401, "Credenciais inválidas.");

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) throw new HttpError(401, "Credenciais inválidas.");

  const token = signToken({ sub: admin.id, email: admin.email, role: "admin" });

  res.json({
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email },
  });
});

// PATCH /api/admin/password -> admin troca a própria senha.
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await prisma.admin.findUnique({ where: { id: req.admin.sub } });
  if (!admin) throw new HttpError(401, "Sessão inválida.");

  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) throw new HttpError(400, "Senha atual incorreta.");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } });

  res.json({ ok: true });
});

// GET /api/admin/me -> valida token e devolve o admin logado
export const me = asyncHandler(async (req, res) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.sub },
    select: { id: true, name: true, email: true },
  });
  if (!admin) throw new HttpError(401, "Sessão inválida.");
  res.json(admin);
});
