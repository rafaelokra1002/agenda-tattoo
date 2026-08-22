"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatBRL, formatDate } from "@/lib/format";
import { Spinner, Alert } from "../components/ui";

function PagamentoInner() {
  const router = useRouter();
  const params = useSearchParams();
  const bookingId = params.get("bookingId");

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Carrega o agendamento + dados do PIX
  useEffect(() => {
    if (!bookingId) {
      setError("Agendamento não informado.");
      return;
    }
    api
      .get(`/bookings/${bookingId}`)
      .then((b) => {
        setBooking(b);
        if (b.status === "CONFIRMED") {
          router.replace(`/confirmacao?bookingId=${b.id}`);
        }
      })
      .catch((e) => setError(e.message));
  }, [bookingId, router]);

  // Faz polling a cada 4s. O endpoint /status consulta o Mercado Pago em tempo
  // real e confirma o agendamento assim que o PIX é pago (sem depender de webhook).
  useEffect(() => {
    if (!bookingId) return;
    const timer = setInterval(async () => {
      try {
        const r = await api.get(`/payments/${bookingId}/status`);
        if (r.status === "CONFIRMED") {
          clearInterval(timer);
          router.replace(`/confirmacao?bookingId=${bookingId}`);
        }
      } catch {
        /* silencioso */
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [bookingId, router]);

  // Botão de simulação (no modo fake). Com Mercado Pago, o pagamento
  // real cai pelo webhook e o polling acima detecta.
  async function simularPagamento() {
    setConfirming(true);
    setError("");
    try {
      await api.post(`/payments/${bookingId}/confirm`);
      router.replace(`/confirmacao?bookingId=${bookingId}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirming(false);
    }
  }

  // PIX estático: cliente informa que pagou (o studio confirma depois).
  async function informarPagamento() {
    setConfirming(true);
    setError("");
    try {
      await api.post(`/payments/${bookingId}/claim`);
      setClaimed(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirming(false);
    }
  }

  function copyPix() {
    if (!booking?.payment?.pixCopiaCola) return;
    navigator.clipboard.writeText(booking.payment.pixCopiaCola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error && !booking) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Alert type="error">{error}</Alert>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen flex items-center justify-center gap-2 text-slate-400">
        <Spinner /> Carregando pagamento...
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-extrabold">Pagamento do sinal</h1>
        <p className="text-slate-400 mt-1">
          Pague via PIX para confirmar seu horário.
        </p>

        {error && (
          <div className="mt-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {/* Resumo do agendamento */}
        <div className="card mt-6 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Serviço</span>
            <span className="font-medium">{booking.service?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Data</span>
            <span className="font-medium">
              {formatDate(booking.date)} às {booking.startTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total do serviço</span>
            <span>{formatBRL(booking.totalCents)}</span>
          </div>
          <div className="flex justify-between border-t border-line mt-2 pt-2">
            <span className="text-slate-300 font-semibold">Sinal (PIX)</span>
            <span className="text-brand font-extrabold text-lg">
              {formatBRL(booking.depositCents)}
            </span>
          </div>
        </div>

        {/* QR Code + copia e cola */}
        <div className="card mt-4 text-center">
          {booking.payment?.qrCodeBase64 && (
            <img
              src={booking.payment.qrCodeBase64}
              alt="QR Code PIX"
              className="mx-auto h-52 w-52 rounded-lg bg-white p-2"
            />
          )}
          <button onClick={copyPix} className="btn-ghost mt-4 w-full">
            {copied ? "Copiado!" : "Copiar código PIX (copia e cola)"}
          </button>
          <p className="mt-2 break-all text-xs text-slate-500">
            {booking.payment?.pixCopiaCola}
          </p>
        </div>

        {/* Status / ação — varia conforme o meio de pagamento */}
        <div className="mt-4 space-y-3">
          {booking.payment?.provider === "fake" ? (
            // Desenvolvimento: botão de simulação
            <>
              <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
                <Spinner className="h-4 w-4" /> Aguardando confirmação...
              </div>
              <button onClick={simularPagamento} disabled={confirming} className="btn-primary w-full">
                {confirming ? <><Spinner /> Confirmando...</> : "Já paguei (simular confirmação)"}
              </button>
              <p className="text-center text-xs text-slate-500">
                Modo de teste: este botão simula o pagamento.
              </p>
            </>
          ) : booking.payment?.provider === "mercadopago" ? (
            // Mercado Pago: confirmação automática
            <p className="text-center text-sm text-amber-400 flex items-center justify-center gap-2">
              <Spinner className="h-4 w-4" /> Assim que o PIX for pago, confirmamos
              automaticamente.
            </p>
          ) : claimed ? (
            // PIX estático: já informou pagamento -> aguardando o studio
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="text-emerald-300 font-medium">
                ✅ Pagamento informado!
              </p>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-2">
                <Spinner className="h-3.5 w-3.5" /> O studio vai confirmar seu
                horário em breve. Pode manter esta tela aberta.
              </p>
            </div>
          ) : (
            // PIX estático: aguardando o cliente pagar
            <>
              <p className="text-center text-sm text-slate-400">
                Pague o valor do sinal com o QR ou o código acima. Depois clique
                no botão abaixo.
              </p>
              <button onClick={informarPagamento} disabled={confirming} className="btn-primary w-full">
                {confirming ? <><Spinner /> Enviando...</> : "Já fiz o pagamento"}
              </button>
              <p className="text-center text-xs text-slate-500">
                O studio confere o recebimento e confirma seu horário.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PagamentoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-slate-400">
          <Spinner />
        </main>
      }
    >
      <PagamentoInner />
    </Suspense>
  );
}
