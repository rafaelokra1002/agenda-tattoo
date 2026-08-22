"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { Spinner, Alert } from "../components/ui";

// Data mínima = hoje (não deixa escolher datas passadas)
const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AgendamentoPage() {
  const router = useRouter();

  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadingServices, setLoadingServices] = useState(true);

  // Seleções do usuário
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Estado dos horários do dia escolhido
  const [slots, setSlots] = useState([]);
  const [slotsReason, setSlotsReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  // Carrega serviços + configurações públicas
  useEffect(() => {
    (async () => {
      try {
        const [srv, cfg] = await Promise.all([
          api.get("/services"),
          api.get("/settings/public"),
        ]);
        setServices(srv);
        setSettings(cfg);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingServices(false);
      }
    })();
  }, []);

  // Busca horários sempre que a data muda
  useEffect(() => {
    if (!date) return;
    setTime("");
    setLoadingSlots(true);
    setSlotsReason("");
    api
      .get(`/availability?date=${date}`)
      .then((r) => {
        setSlots(r.available || []);
        setSlotsReason(r.reason || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSlots(false));
  }, [date]);

  const depositCents = selectedService
    ? Math.round((selectedService.priceCents * (settings?.depositPercent ?? 50)) / 100)
    : 0;

  const canSubmit =
    serviceId && date && time && name.trim().length >= 2 && phone.trim().length >= 8;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await api.post("/bookings", {
        name: name.trim(),
        phone: phone.trim(),
        serviceId,
        date,
        startTime: time,
      });
      // Segue para o pagamento do sinal
      router.push(`/pagamento?bookingId=${res.bookingId}`);
    } catch (e) {
      setError(e.message);
      // Se o horário foi tomado, recarrega os slots
      if (e.status === 409 && date) {
        const r = await api.get(`/availability?date=${date}`);
        setSlots(r.available || []);
        setTime("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-brand font-semibold uppercase tracking-widest text-xs">
            Studio Ink
          </p>
          <h1 className="text-3xl font-extrabold mt-1">Agende sua tatuagem</h1>
          <p className="text-slate-400 mt-1">
            Preencha os dados abaixo. O horário é reservado após o pagamento do
            sinal de {settings?.depositPercent ?? 50}%.
          </p>
        </header>

        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1 — Serviço */}
          <section className="card">
            <h2 className="font-semibold mb-3">1. Escolha o serviço</h2>
            {loadingServices ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Spinner /> Carregando serviços...
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setServiceId(s.id)}
                    className={`text-left rounded-xl border p-4 transition ${
                      serviceId === s.id
                        ? "border-brand bg-brand/10"
                        : "border-line hover:border-slate-600"
                    }`}
                  >
                    <div className="font-medium">{s.name}</div>
                    {s.sizeLabel && (
                      <div className="text-xs text-slate-400">{s.sizeLabel}</div>
                    )}
                    <div className="mt-2 text-brand font-semibold">
                      {formatBRL(s.priceCents)}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                      Valor aproximado, pode variar conforme a tatuagem.
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 2 — Data */}
          <section className="card">
            <h2 className="font-semibold mb-3">2. Escolha a data</h2>
            <input
              type="date"
              className="input"
              min={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </section>

          {/* 3 — Horário */}
          <section className="card">
            <h2 className="font-semibold mb-3">3. Escolha o horário</h2>
            {!date ? (
              <p className="text-slate-500 text-sm">Selecione uma data primeiro.</p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Spinner /> Buscando horários...
              </div>
            ) : slots.length === 0 ? (
              <Alert type="info">
                {slotsReason || "Nenhum horário disponível nesta data."}
              </Alert>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`rounded-lg border px-4 py-2 font-medium transition ${
                      time === slot
                        ? "border-brand bg-brand text-white"
                        : "border-line hover:border-slate-600"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 4 — Dados do cliente */}
          <section className="card">
            <h2 className="font-semibold mb-3">4. Seus dados</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input
                  className="input"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Celular (WhatsApp)</label>
                <input
                  className="input"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Resumo + envio */}
          {selectedService && (
            <div className="card flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Sinal a pagar agora (PIX)</div>
                <div className="text-2xl font-extrabold text-brand">
                  {formatBRL(depositCents)}
                </div>
                <div className="text-xs text-slate-500">
                  Total do serviço: {formatBRL(selectedService.priceCents)}
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={!canSubmit || submitting} className="btn-primary w-full">
            {submitting ? (
              <>
                <Spinner /> Gerando pagamento...
              </>
            ) : (
              "Continuar para o pagamento"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
