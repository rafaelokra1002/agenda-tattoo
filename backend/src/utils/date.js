// Helpers de data. Trabalhamos sempre com o dia "puro" (sem fuso),
// usando meia-noite UTC para evitar deslocamento de dia.

// "2026-08-21" -> Date (00:00 UTC)
export function parseDateOnly(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    throw new Error("Data inválida. Use o formato YYYY-MM-DD.");
  }
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Date -> "2026-08-21"
export function toDateOnlyString(date) {
  return new Date(date).toISOString().slice(0, 10);
}

// Dia da semana 0=Dom ... 6=Sáb (baseado em UTC)
export function weekdayOf(date) {
  return new Date(date).getUTCDay();
}

// "14:30" -> 14 (hora inteira, para checar limite de agendamento)
export function hourOf(timeStr) {
  return Number(timeStr.split(":")[0]);
}
