"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatBRL, formatDate, STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import { Spinner, Alert } from "../../components/ui";
import { EventModal } from "../../components/booking-modals";

function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // agendamento aberto no card

  function load() {
    setError("");
    api
      .get("/admin/dashboard", { auth: true })
      .then(setData)
      .catch((e) => setError(e.message));
  }
  useEffect(() => {
    load();
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!data)
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Spinner /> Carregando...
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de agendamentos" value={data.totals.total} />
        <StatCard label="Confirmados" value={data.totals.confirmed} />
        <StatCard label="Aguardando pagamento" value={data.totals.pending} />
        <StatCard
          label="Faturamento (sinais pagos)"
          value={formatBRL(data.revenueCents)}
        />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-1">Próximos horários</h2>
        <p className="text-xs text-slate-500 mb-3">
          Clique em um cliente para confirmar o pagamento, remarcar ou cancelar.
        </p>
        {data.upcoming.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum horário futuro.</p>
        ) : (
          <div className="divide-y divide-line">
            {data.upcoming.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="flex w-full items-center justify-between py-3 text-left transition hover:bg-ink/60 rounded-lg px-2 -mx-2"
              >
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {b.client?.name}
                    {b.status === "PENDING" && b.payment?.clientClaimed && (
                      <span className="badge bg-amber-500/15 text-amber-400 border-amber-500/30">
                        informou pagamento
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    {b.service?.name} — {formatDate(b.date)} às {b.startTime}
                  </div>
                </div>
                <span className={`badge ${STATUS_STYLE[b.status]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
              </button>
            ))}
          </div>
        )}
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
    </div>
  );
}
