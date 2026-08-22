"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatBRL, formatDate, STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import { Spinner, Alert } from "./ui";

// Base de um modal centralizado.
function Modal({ children, onClose, title, subtitle }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Seletor de data + horários disponíveis reutilizável.
function SlotPicker({ date, setDate, time, setTime }) {
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setTime("");
    setLoading(true);
    api
      .get(`/availability?date=${date}`)
      .then((r) => {
        setSlots(r.available || []);
        setReason(r.reason || "");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <>
      <label className="label">Data</label>
      <input
        type="date"
        className="input"
        min={new Date().toISOString().slice(0, 10)}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {date && (
        <div className="mt-4">
          <label className="label">Horário</label>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Spinner className="h-4 w-4" /> Buscando...
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500">{reason || "Sem horários."}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    time === s ? "border-brand bg-brand text-white" : "border-line"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// -------- Novo agendamento (admin) --------
export function NewBookingModal({ initialDate = "", onClose, onDone }) {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/services", { auth: true }).then((all) =>
      setServices(all.filter((s) => s.active))
    );
  }, []);

  async function save() {
    setError("");
    setSaving(true);
    try {
      await api.post(
        "/admin/bookings",
        { name: name.trim(), phone: phone.trim(), serviceId, date, startTime: time, status: "CONFIRMED" },
        { auth: true }
      );
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const valid = serviceId && name.trim().length >= 2 && phone.trim().length >= 8 && date && time;

  return (
    <Modal title="Novo agendamento" subtitle="Cadastro manual (confirmado)" onClose={onClose}>
      {error && <div className="mb-3"><Alert type="error">{error}</Alert></div>}

      <label className="label">Serviço</label>
      <select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
        <option value="">Selecione...</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {formatBRL(s.priceCents)}
          </option>
        ))}
      </select>

      <div className="mt-4">
        <label className="label">Nome do cliente</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mt-4">
        <label className="label">Celular</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
      </div>

      <div className="mt-4">
        <SlotPicker date={date} setDate={setDate} time={time} setTime={setTime} />
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
        <button onClick={save} disabled={!valid || saving} className="btn-primary flex-1">
          {saving ? <Spinner /> : "Criar agendamento"}
        </button>
      </div>
    </Modal>
  );
}

// -------- Detalhes do evento (cancelar / remarcar) --------
export function EventModal({ booking, onClose, onChanged }) {
  const [mode, setMode] = useState("view"); // view | reschedule
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function cancel() {
    if (!confirm("Cancelar este agendamento?")) return;
    setBusy(true);
    try {
      await api.patch(`/admin/bookings/${booking.id}/cancel`, {}, { auth: true });
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmPay() {
    setBusy(true);
    try {
      await api.patch(`/admin/bookings/${booking.id}/confirm`, {}, { auth: true });
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveReschedule() {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/admin/bookings/${booking.id}/reschedule`, { date, startTime: time }, { auth: true });
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={booking.client?.name}
      subtitle={booking.service?.name}
      onClose={onClose}
    >
      {error && <div className="mb-3"><Alert type="error">{error}</Alert></div>}

      {mode === "view" ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Data</span>
            <span className="font-medium">{formatDate(booking.date)} às {booking.startTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Celular</span>
            <span>{booking.client?.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Valor / sinal</span>
            <span>{formatBRL(booking.totalCents)} / {formatBRL(booking.depositCents)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status</span>
            <span className={`badge ${STATUS_STYLE[booking.status]}`}>{STATUS_LABEL[booking.status]}</span>
          </div>

          {booking.status === "PENDING" && booking.payment?.clientClaimed && (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              💸 O cliente informou que já fez o PIX. Confira o recebimento e
              confirme abaixo.
            </div>
          )}

          {booking.status === "PENDING" && (
            <button onClick={confirmPay} disabled={busy} className="btn w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white">
              {busy ? <Spinner /> : "✓ Confirmar pagamento"}
            </button>
          )}

          {booking.status !== "CANCELLED" && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => setMode("reschedule")} className="btn-ghost flex-1">Remarcar</button>
              <button onClick={cancel} disabled={busy} className="btn flex-1 bg-rose-600 hover:bg-rose-500 text-white">
                {busy ? <Spinner /> : "Cancelar"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <SlotPicker date={date} setDate={setDate} time={time} setTime={setTime} />
          <div className="mt-6 flex gap-2">
            <button onClick={() => setMode("view")} className="btn-ghost flex-1">Voltar</button>
            <button onClick={saveReschedule} disabled={!date || !time || busy} className="btn-primary flex-1">
              {busy ? <Spinner /> : "Salvar novo horário"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
