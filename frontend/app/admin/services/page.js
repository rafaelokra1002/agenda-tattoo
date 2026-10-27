"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import { Spinner, Alert } from "../../components/ui";
import { SERVICE_IMAGES, imageLabel, imageSrc, serviceImage } from "@/lib/service-images";

const emptyForm = { id: null, name: "", sizeLabel: "", price: "", imageUrl: "", photoAt: null, active: true };

// Reduz a foto no navegador (lado maior até 1200px, JPEG) antes de enviar,
// para não guardar arquivos enormes no banco.
function resizeImage(file, maxSide = 1200) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler essa imagem."));
    };
    img.src = url;
  });
}

export default function ServicesPage() {
  const [services, setServices] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // Foto enviada pelo painel: nova (data URL) ou pedido de remoção
  const [newPhoto, setNewPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

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
      imageUrl: s.imageUrl || "",
      photoAt: s.photoAt,
      active: s.active,
    });
    setNewPhoto(null);
    setRemovePhoto(false);
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
      imageUrl: form.imageUrl || null,
      active: form.active,
    };
    try {
      const saved = form.id
        ? await api.put(`/admin/services/${form.id}`, payload, { auth: true })
        : await api.post("/admin/services", payload, { auth: true });
      if (newPhoto) {
        await api.put(`/admin/services/${saved.id}/photo`, { dataUrl: newPhoto }, { auth: true });
      } else if (removePhoto && form.photoAt) {
        await api.del(`/admin/services/${saved.id}/photo`, { auth: true });
      }
      resetForm();
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setNewPhoto(null);
    setRemovePhoto(false);
  }

  async function pickPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setNewPhoto(await resizeImage(file));
      setRemovePhoto(false);
    } catch (err) {
      setError(err.message);
    }
  }

  // Prévia do que o cliente vai ver depois de salvar
  const preview =
    newPhoto ||
    serviceImage({ ...form, photoAt: removePhoto ? null : form.photoAt });
  const hasUploadedPhoto = !!newPhoto || (!!form.photoAt && !removePhoto);

  async function remove(id) {
    if (!confirm("Excluir esta categoria?")) return;
    try {
      await api.del(`/admin/services/${id}`, { auth: true });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Categorias</h1>
      {error && <Alert type="error">{error}</Alert>}

      {/* Formulário criar/editar */}
      <form onSubmit={save} className="card grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 font-semibold">
          {form.id ? "Editar categoria" : "Nova categoria"}
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
        <div className="sm:col-span-2">
          <label className="label">Foto</label>
          <div className="flex gap-4 items-start">
            <div className="h-32 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-black">
              {preview && (
                <img src={imageSrc(preview)} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                <label className="btn-ghost cursor-pointer">
                  {hasUploadedPhoto ? "Trocar foto" : "Enviar foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
                </label>
                {hasUploadedPhoto && (
                  <button
                    type="button"
                    className="btn-ghost text-rose-400"
                    onClick={() => {
                      setNewPhoto(null);
                      setRemovePhoto(true);
                    }}
                  >
                    Remover foto
                  </button>
                )}
              </div>
              {hasUploadedPhoto ? (
                <p className="text-xs text-slate-500">
                  {newPhoto ? "Nova foto — clique em salvar para aplicar." : "Usando a foto enviada."}
                </p>
              ) : (
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Sem foto enviada. Ou escolha uma das fotos do site:
                  </p>
                  <select
                    className="input"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  >
                    <option value="">Automática (pelo nome do serviço)</option>
                    {SERVICE_IMAGES.map((img) => (
                      <option key={img} value={img}>
                        {imageLabel(img)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
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
            {saving ? <Spinner /> : form.id ? "Salvar alterações" : "Adicionar categoria"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={resetForm}
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
                <th className="py-2 pr-4">Categoria</th>
                <th className="py-2 pr-4">Preço</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-line/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                    {serviceImage(s) && (
                      <img
                        src={imageSrc(serviceImage(s))}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div>
                    <div className="font-medium">{s.name}</div>
                    {s.sizeLabel && (
                      <div className="text-xs text-slate-500">{s.sizeLabel}</div>
                    )}
                    </div>
                    </div>
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
