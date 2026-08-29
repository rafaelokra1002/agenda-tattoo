"use client";
import { useState } from "react";
import { Spinner } from "./ui";

// Regras exibidas ANTES de gerar o PIX. O cliente precisa aceitar para continuar.
const RULES = [
  {
    icon: "💰",
    title: "Pagamento",
    text: "O sinal confirma e reserva exclusivamente o seu horário. O restante é pago no dia da tatuagem.",
  },
  {
    icon: "📅",
    title: "Remarcação",
    text: "Caso precise remarcar, avise com antecedência. Será permitida 1 remarcação, conforme disponibilidade da agenda.",
  },
  {
    icon: "❌",
    title: "Não comparecimento",
    text: "Em caso de falta sem aviso prévio, o sinal será perdido, pois o horário foi reservado exclusivamente para você.",
  },
  {
    icon: "🚫",
    title: "Cancelamento ou desistência",
    text: "Após a confirmação do agendamento, o sinal não é reembolsável, pois corresponde à reserva do horário e criação ou preparação da arte.",
  },
];

export function RulesModal({ onAgree, onClose, loading }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-extrabold">📌 Regras de agendamento</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {RULES.map((r) => (
            <div key={r.title} className="rounded-lg border border-line bg-ink/40 p-3">
              <div className="font-semibold text-slate-100">
                {r.icon} {r.title}
              </div>
              <p className="text-sm text-slate-400 mt-1">{r.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-300">
          🤝 Ao realizar o pagamento do sinal, você confirma que{" "}
          <span className="font-semibold">leu e está de acordo com as regras</span>.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          🖤 Obrigado por valorizar meu trabalho e respeitar o horário reservado
          para você.
        </p>

        <label className="mt-4 flex items-start gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="mt-1"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="text-sm text-slate-200">
            Li e estou de acordo com as regras de agendamento.
          </span>
        </label>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Voltar
          </button>
          <button
            onClick={onAgree}
            disabled={!agreed || loading}
            className="btn-primary flex-1"
          >
            {loading ? (
              <>
                <Spinner /> Gerando...
              </>
            ) : (
              "Concordar e pagar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
