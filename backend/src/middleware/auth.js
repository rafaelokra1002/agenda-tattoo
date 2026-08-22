// Middleware que protege rotas do admin exigindo um JWT válido.
import { verifyToken } from "../utils/jwt.js";
import { HttpError } from "../utils/http.js";

export function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Token de autenticação ausente."));
  }

  try {
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      return next(new HttpError(403, "Acesso negado."));
    }
    req.admin = payload; // { sub, email, role }
    next();
  } catch {
    next(new HttpError(401, "Token inválido ou expirado."));
  }
}
