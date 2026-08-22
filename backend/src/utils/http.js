// Erro de aplicação com status HTTP, usado pelos serviços/controllers.
export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Envolve controllers async para encaminhar erros ao middleware de erro.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Formata dinheiro (centavos -> "R$ 80,00")
export function formatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
