"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Spinner, Alert } from "../../components/ui";

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/admin/settings", { auth: true })
      .then(setForm)
      .catch((e) => setError(e.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    setSaving(true);
    try {
      const updated = await api.put(
        "/admin/settings",
        {
          depositPercent: Number(form.depositPercent),
          pixKey: form.pixKey,
          merchantName: form.merchantName,
          merchantCity: form.merchantCity,
          maxBookingHour: Number(form.maxBookingHour),
        },
        { auth: true }
      );
      setForm(updated);
      setMsg("Configurações salvas com sucesso.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form)
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Spinner /> Carregando...
      </div>
    );

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-extrabold">Configurações</h1>
      {error && <Alert type="error">{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      <form onSubmit={save} className="card space-y-4">
        <div>
          <label className="label">Percentual do sinal (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input"
            value={form.depositPercent}
            onChange={(e) => setForm({ ...form, depositPercent: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">
            Valor cobrado no ato do agendamento (ex.: 50%).
          </p>
        </div>

        <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 space-y-4">
          <div className="text-sm font-semibold text-brand">Pagamento PIX</div>

          <div>
            <label className="label">Chave PIX (email, telefone ou CPF)</label>
            <input
              className="input"
              value={form.pixKey}
              onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
              placeholder="ex: seu@email.com  •  +5511999998888  •  12345678900"
            />
            <p className="text-xs text-slate-500 mt-1">
              É a chave onde você recebe. O QR e o &quot;copia e cola&quot; do
              cliente são gerados a partir dela. Telefone com{" "}
              <code className="text-slate-300">+55</code> e DDD; CPF só números.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome do recebedor</label>
              <input
                className="input"
                maxLength={25}
                value={form.merchantName}
                onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
                placeholder="The Freedom Tattoo"
              />
              <p className="text-xs text-slate-500 mt-1">Aparece no PIX (máx. 25).</p>
            </div>
            <div>
              <label className="label">Cidade</label>
              <input
                className="input"
                maxLength={15}
                value={form.merchantCity}
                onChange={(e) => setForm({ ...form, merchantCity: e.target.value })}
                placeholder="Sao Paulo"
              />
              <p className="text-xs text-slate-500 mt-1">Máx. 15 caracteres.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Hora limite para agendamento</label>
          <input
            type="number"
            min="0"
            max="23"
            className="input"
            value={form.maxBookingHour}
            onChange={(e) => setForm({ ...form, maxBookingHour: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">
            Só serão oferecidos horários até esta hora (ex.: 16 = até 16h).
          </p>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner /> : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
