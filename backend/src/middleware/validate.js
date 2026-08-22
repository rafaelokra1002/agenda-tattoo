// Valida req.body contra um schema Zod e substitui req.body pelo dado tipado.
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(result.error);
  req.body = result.data;
  next();
};
