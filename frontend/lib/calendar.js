// Helpers de calendário (trabalham em horário local do navegador).

// Retorna uma nova data somando dias.
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Segunda-feira da semana da data informada.
export function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day; // volta até segunda
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Array com os 7 dias (seg..dom) da semana.
export function weekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Grade do mês: matriz de semanas (cada uma com 7 dias), sempre iniciando na segunda.
export function monthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first);
  const weeks = [];
  let cursor = start;
  // 6 semanas cobrem qualquer mês
  for (let w = 0; w < 6; w++) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

// "2026-08-24" (chave local, sem UTC shift)
export function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Normaliza a data de um booking (vem ISO UTC "…T00:00:00Z") para chave YMD.
export function bookingYmd(isoDate) {
  return String(isoDate).slice(0, 10);
}

// "14:30" -> minutos desde 00:00
export function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const isSameDay = (a, b) => ymd(a) === ymd(b);
export const isToday = (d) => isSameDay(d, new Date());

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const monthName = (n) => MONTHS[n];

export const WEEKDAY_SHORT = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

// Rótulo curto de dia p/ input (dd/mm)
export const ddmm = (d) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
