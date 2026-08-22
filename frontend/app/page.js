import Link from "next/link";
import { Backdrop } from "./components/backdrop";
import { Brand } from "./components/brand";

// Landing simples que direciona para o agendamento.
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Backdrop />
      <div className="max-w-xl text-center">
        <Brand size="lg" className="block text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]" />
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-brand to-transparent" />
        <h1 className="mt-5 text-2xl md:text-3xl font-extrabold text-slate-100">
          Sua próxima tatuagem começa aqui
        </h1>
        <p className="mt-4 text-slate-400">
          Escolha o serviço, a data e o horário. Garanta seu horário pagando
          apenas <span className="text-brand font-semibold">50% de sinal</span>{" "}
          via PIX.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/agendamento" className="btn-primary">
            Agendar agora
          </Link>
          <Link href="/admin/login" className="btn-ghost">
            Área do tatuador
          </Link>
        </div>
      </div>
    </main>
  );
}
