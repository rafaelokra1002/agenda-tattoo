"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatBRL, formatDate } from "@/lib/format";
import { Spinner } from "../components/ui";
import { Backdrop } from "../components/backdrop";

function ConfirmacaoInner() {
  const params = useSearchParams();
  const bookingId = params.get("bookingId");
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    api.get(`/bookings/${bookingId}`).then(setBooking).catch(() => {});
  }, [bookingId]);

  if (!booking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <Backdrop />
      <div className="max-w-md w-full text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 text-3xl font-extrabold">Agendamento confirmado!</h1>
        <p className="text-slate-400 mt-2">
          Recebemos seu sinal. Seu horário está garantido. 🎉
        </p>

        <div className="card mt-6 text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Cliente</span>
            <span className="font-medium">{booking.client?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Serviço</span>
            <span className="font-medium">{booking.service?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Data e horário</span>
            <span className="font-medium">
              {formatDate(booking.date)} às {booking.startTime}
            </span>
          </div>
          <div className="flex justify-between border-t border-line mt-2 pt-2">
            <span className="text-slate-400">Sinal pago</span>
            <span className="text-emerald-400 font-semibold">
              {formatBRL(booking.depositCents)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Restante no dia</span>
            <span>{formatBRL(booking.totalCents - booking.depositCents)}</span>
          </div>
        </div>

        <Link href="/agendamento" className="btn-ghost mt-6 inline-flex">
          Fazer outro agendamento
        </Link>
      </div>
    </main>
  );
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <ConfirmacaoInner />
    </Suspense>
  );
}
