// Helpers de formatação para a interface.

export function formatBRL(cents) {
  return ((cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// "2026-08-21" ou ISO -> "21/08/2026"
export function formatDate(value) {
  const s = String(value).slice(0, 10);
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
export const weekdayName = (n) => WEEKDAYS[n];

export const STATUS_LABEL = {
  PENDING: "Aguardando pagamento",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
};

export const STATUS_STYLE = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  CONFIRMED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  COMPLETED: "bg-sky-500/15 text-sky-400 border-sky-500/30",
};
