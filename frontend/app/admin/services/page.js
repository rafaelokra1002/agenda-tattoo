"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { Spinner, Alert } from "../../components/ui";

const emptyForm = { id: null, name: "", sizeLabel: "", price: "", active: true };

export default function ServicesPage() {
  const [services, setServices] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setServices(await api.get("/admin/services", { auth: true }));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function edit(s) {
    setForm({
      id: s.id,
      name: s.name,
      sizeLabel: s.sizeLabel || "",
      price: (s.priceCents / 100).toString(),
      active: s.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      sizeLabel: form.sizeLabel.trim() || null,
      priceCents: Math.round(parseFloat(form.price) * 100),
      active: form.active,
    };
    try {
      if (form.id) {
        await api.put(`/admin/services/${form.id}`, payload, { auth: true });
      } else {
        await api.post("/admin/services", payload, { auth: true });
      }
      setForm(emptyForm);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("Excluir este serviço?")) return;
    try {
      await api.del(`/admin/services/${id}`, { auth: true });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Serviços</h1>
      {error && <Alert type="error">{error}</Alert>}

      {/* Formulário criar/editar */}
      <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 font-semibold">
          {form.id ? "Editar serviço" : "Novo serviço"}
        </div>
        <div>
          <label className="label">Nome</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Tamanho (opcional)</label>
          <input
            className="input"
            placeholder="7cm a 10cm"
            value={form.sizeLabel}
            onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Preço (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Ativo
          </label>
        </div>
        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Spinner /> : form.id ? "Salvar alterações" : "Adicionar serviço"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="btn-ghost"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista */}
      {!services ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Spinner /> Carregando...
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-line">
                <th className="py-2 pr-4">Serviço</th>
                <th className="py-2 pr-4">Preço</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-line/60">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{s.name}</div>
                    {s.sizeLabel && (
                      <div className="text-xs text-slate-500">{s.sizeLabel}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4">{formatBRL(s.priceCents)}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`badge ${
                        s.active
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      }`}
                    >
                      {s.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => edit(s)}
                        className="text-sky-400 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        className="text-rose-400 hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
