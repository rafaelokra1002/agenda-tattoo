"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Spinner, Alert } from "../../components/ui";

export default function ClientsPage() {
  const [clients, setClients] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/clients", { auth: true })
      .then(setClients)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert type="error">{error}</Alert>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Clientes</h1>

      {!clients ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Spinner /> Carregando...
        </div>
      ) : clients.length === 0 ? (
        <div className="card text-slate-500">Nenhum cliente cadastrado.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-line">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">Celular</th>
                <th className="py-2 pr-4">Agendamentos</th>
                <th className="py-2 pr-4">Desde</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line/60">
                  <td className="py-3 pr-4 font-medium">{c.name}</td>
                  <td className="py-3 pr-4">{c.phone}</td>
                  <td className="py-3 pr-4">{c._count?.bookings ?? 0}</td>
                  <td className="py-3 pr-4">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
