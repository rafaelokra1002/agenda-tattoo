"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatBRL, formatDate, STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import { Spinner, Alert } from "../../components/ui";

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

  useEffect(() => {
    api
      .get("/admin/dashboard", { auth: true })
      .then(setData)
      .catch((e) => setError(e.message));
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
        <h2 className="font-semibold mb-4">Próximos horários</h2>
        {data.upcoming.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum horário futuro.</p>
        ) : (
          <div className="divide-y divide-line">
            {data.upcoming.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{b.client?.name}</div>
                  <div className="text-sm text-slate-400">
                    {b.service?.name} — {formatDate(b.date)} às {b.startTime}
                  </div>
                </div>
                <span className={`badge ${STATUS_STYLE[b.status]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
