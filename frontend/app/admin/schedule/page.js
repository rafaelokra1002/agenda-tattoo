"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, weekdayName } from "@/lib/format";
import { Spinner, Alert } from "../../components/ui";

export default function SchedulePage() {
  const [hours, setHours] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // Form de nova data bloqueada
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

  async function load() {
    try {
      const [h, b] = await Promise.all([
        api.get("/admin/working-hours", { auth: true }),
        api.get("/admin/blocked-dates", { auth: true }),
      ]);
      setHours(h);
      setBlocked(b);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function updateLocal(weekday, patch) {
    setHours((prev) =>
      prev.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h))
    );
  }

  async function saveDay(day) {
    setError("");
    setMsg("");
    try {
      await api.put(
        `/admin/working-hours/${day.weekday}`,
        { enabled: day.enabled, slots: day.slots },
        { auth: true }
      );
      setMsg(`Horários de ${weekdayName(day.weekday)} salvos.`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function addBlocked(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(
        "/admin/blocked-dates",
        { date: blockDate, reason: blockReason || null },
        { auth: true }
      );
      setBlockDate("");
      setBlockReason("");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeBlocked(id) {
    try {
      await api.del(`/admin/blocked-dates/${id}`, { auth: true });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!hours)
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Spinner /> Carregando...
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Horários</h1>
      {error && <Alert type="error">{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {/* Horários por dia da semana */}
      <div className="card">
        <h2 className="font-semibold mb-1">Horários por dia da semana</h2>
        <p className="text-sm text-slate-400 mb-4">
          Informe os horários separados por vírgula (ex.:{" "}
          <code className="text-slate-300">08:30,14:30</code>). Desmarque um dia
          para bloqueá-lo por completo.
        </p>

        <div className="space-y-3">
          {hours.map((day) => (
            <div
              key={day.weekday}
              className="grid gap-3 sm:grid-cols-[140px_1fr_auto] items-center border-b border-line/60 pb-3"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) =>
                    updateLocal(day.weekday, { enabled: e.target.checked })
                  }
                />
                <span className="font-medium">{weekdayName(day.weekday)}</span>
              </label>
              <input
                className="input"
                placeholder="08:30,14:30"
                value={day.slots}
                disabled={!day.enabled}
                onChange={(e) =>
                  updateLocal(day.weekday, { slots: e.target.value })
                }
              />
              <button onClick={() => saveDay(day)} className="btn-ghost text-sm">
                Salvar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Datas bloqueadas */}
      <div className="card">
        <h2 className="font-semibold mb-4">Datas bloqueadas (feriados/folgas)</h2>

        <form onSubmit={addBlocked} className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="label">Data</label>
            <input
              type="date"
              className="input"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="label">Motivo (opcional)</label>
            <input
              className="input"
              placeholder="Feriado, viagem..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Bloquear
          </button>
        </form>

        {blocked.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma data bloqueada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {blocked.map((b) => (
              <span
                key={b.id}
                className="badge border-line text-slate-200 gap-2"
              >
                {formatDate(b.date)}
                {b.reason ? ` — ${b.reason}` : ""}
                <button
                  onClick={() => removeBlocked(b.id)}
                  className="text-rose-400 ml-1"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
