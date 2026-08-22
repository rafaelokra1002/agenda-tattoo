"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { STATUS_STYLE } from "@/lib/format";
import {
  addDays,
  weekDays,
  monthGrid,
  ymd,
  bookingYmd,
  timeToMin,
  isToday,
  monthName,
  WEEKDAY_SHORT,
  ddmm,
} from "@/lib/calendar";
import { Spinner, Alert } from "../../components/ui";
import { NewBookingModal, EventModal } from "../../components/booking-modals";

// Janela de horas exibida na grade (8h às 20h).
const DAY_START = 8;
const DAY_END = 20;
const HOUR_PX = 56;
// Respiro no topo para o primeiro rótulo (8h) não ser cortado pela área rolável.
const PAD_TOP = 12;
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);
const GRID_HEIGHT = (DAY_END - DAY_START) * HOUR_PX + PAD_TOP;

// Cor da barra lateral do evento por status.
const EVENT_ACCENT = {
  CONFIRMED: "bg-emerald-500/20 border-l-emerald-400",
  PENDING: "bg-amber-500/20 border-l-amber-400",
  CANCELLED: "bg-rose-500/10 border-l-rose-400 opacity-60 line-through",
  COMPLETED: "bg-sky-500/20 border-l-sky-400",
};

export default function BookingsCalendarPage() {
  const [view, setView] = useState("week"); // week | day | month
  const [anchor, setAnchor] = useState(new Date());
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null); // evento aberto
  const [newModal, setNewModal] = useState(null); // { date } | null

  async function load() {
    setError("");
    try {
      setBookings(await api.get("/admin/bookings", { auth: true }));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  // Agrupa agendamentos por dia (chave YMD) para lookup rápido.
  const byDay = useMemo(() => {
    const map = {};
    (bookings || []).forEach((b) => {
      const key = bookingYmd(b.date);
      (map[key] = map[key] || []).push(b);
    });
    return map;
  }, [bookings]);

  // Navegação conforme a visão.
  function move(dir) {
    if (view === "month") {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
    } else if (view === "week") {
      setAnchor(addDays(anchor, dir * 7));
    } else {
      setAnchor(addDays(anchor, dir));
    }
  }

  // Rótulo do período no cabeçalho.
  const rangeLabel = useMemo(() => {
    if (view === "month") return `${monthName(anchor.getMonth())} ${anchor.getFullYear()}`;
    if (view === "day")
      return anchor.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    const days = weekDays(anchor);
    return `${ddmm(days[0])} – ${ddmm(days[6])}`;
  }, [view, anchor]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold">Agenda</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => move(-1)} className="btn-ghost px-2 py-1.5" aria-label="Anterior">‹</button>
            <button onClick={() => setAnchor(new Date())} className="btn-ghost px-3 py-1.5 text-sm">Hoje</button>
            <button onClick={() => move(1)} className="btn-ghost px-2 py-1.5" aria-label="Próximo">›</button>
          </div>
          <span className="text-slate-300 capitalize">{rangeLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line overflow-hidden">
            {[
              ["month", "Mês"],
              ["week", "Semana"],
              ["day", "Dia"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm ${
                  view === v ? "bg-panel text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setNewModal({ date: ymd(anchor) })} className="btn-primary">
            + Novo agendamento
          </button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {!bookings ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Spinner /> Carregando agenda...
        </div>
      ) : view === "month" ? (
        <MonthView anchor={anchor} byDay={byDay} onEvent={setSelected} onDayNew={(d) => setNewModal({ date: d })} />
      ) : (
        <TimeGridView
          days={view === "day" ? [anchor] : weekDays(anchor)}
          byDay={byDay}
          onEvent={setSelected}
        />
      )}

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <Legend color="bg-emerald-400" label="Confirmado" />
        <Legend color="bg-amber-400" label="Aguardando pagamento" />
        <Legend color="bg-sky-400" label="Concluído" />
        <Legend color="bg-rose-400" label="Cancelado" />
      </div>

      {selected && (
        <EventModal
          booking={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            load();
          }}
        />
      )}
      {newModal && (
        <NewBookingModal
          initialDate={newModal.date}
          onClose={() => setNewModal(null)}
          onDone={() => {
            setNewModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
    </span>
  );
}

// ---------------- Visão Semana / Dia (grade de horas) ----------------
function TimeGridView({ days, byDay, onEvent }) {
  return (
    <div className="card p-0 overflow-hidden">
      {/* Cabeçalho dos dias */}
      <div
        className="grid border-b border-line"
        style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}
      >
        <div />
        {days.map((d) => (
          <div
            key={ymd(d)}
            className={`py-2 text-center text-sm border-l border-line ${
              isToday(d) ? "text-brand font-semibold" : "text-slate-300"
            }`}
          >
            {WEEKDAY_SHORT[(d.getDay() + 6) % 7]}{" "}
            <span className={isToday(d) ? "rounded bg-brand text-white px-1.5 py-0.5" : ""}>
              {d.getDate()}
            </span>
          </div>
        ))}
      </div>

      {/* Grade rolável */}
      <div className="overflow-y-auto" style={{ maxHeight: "65vh" }}>
        <div
          className="grid relative"
          style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}
        >
          {/* Coluna de horas */}
          <div className="relative" style={{ height: GRID_HEIGHT }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-xs text-slate-500"
                style={{ top: (h - DAY_START) * HOUR_PX + PAD_TOP }}
              >
                {h}h
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {days.map((d) => {
            const events = (byDay[ymd(d)] || []).slice().sort(
              (a, b) => timeToMin(a.startTime) - timeToMin(b.startTime)
            );
            return (
              <div
                key={ymd(d)}
                className="relative border-l border-line"
                style={{ height: GRID_HEIGHT }}
              >
                {/* Linhas de hora */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-line/50"
                    style={{ top: (h - DAY_START) * HOUR_PX + PAD_TOP }}
                  />
                ))}
                {/* Faixa do dia atual */}
                {isToday(d) && <div className="absolute inset-0 bg-brand/[0.03]" />}

                {/* Eventos */}
                {events.map((b) => {
                  const top =
                    ((timeToMin(b.startTime) - DAY_START * 60) / 60) * HOUR_PX + PAD_TOP;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onEvent(b)}
                      className={`absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 text-left text-xs
                        overflow-hidden hover:brightness-125 transition ${EVENT_ACCENT[b.status]}`}
                      style={{ top: Math.max(top, 0), height: HOUR_PX - 6 }}
                    >
                      <div className="font-semibold">{b.startTime}</div>
                      <div className="truncate">{b.client?.name}</div>
                      <div className="truncate text-slate-300">{b.service?.name}</div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------- Visão Mês ----------------
function MonthView({ anchor, byDay, onEvent, onDayNew }) {
  const weeks = monthGrid(anchor);
  const month = anchor.getMonth();

  return (
    <div className="card p-0 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line text-center text-xs text-slate-400">
        {WEEKDAY_SHORT.map((w) => (
          <div key={w} className="py-2">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((d) => {
          const events = (byDay[ymd(d)] || []).slice().sort(
            (a, b) => timeToMin(a.startTime) - timeToMin(b.startTime)
          );
          const inMonth = d.getMonth() === month;
          return (
            <div
              key={ymd(d)}
              className={`min-h-[110px] border-b border-l border-line p-1.5 ${
                inMonth ? "" : "bg-black/20 text-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs ${
                    isToday(d) ? "rounded bg-brand text-white px-1.5 py-0.5 font-semibold" : "text-slate-400"
                  }`}
                >
                  {d.getDate()}
                </span>
                <button
                  onClick={() => onDayNew(ymd(d))}
                  className="text-slate-500 hover:text-brand text-xs"
                  title="Novo agendamento"
                >
                  +
                </button>
              </div>
              <div className="mt-1 space-y-1">
                {events.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onEvent(b)}
                    className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] border ${STATUS_STYLE[b.status]}`}
                  >
                    {b.startTime} {b.client?.name}
                  </button>
                ))}
                {events.length > 3 && (
                  <div className="text-[11px] text-slate-500">+{events.length - 3} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
