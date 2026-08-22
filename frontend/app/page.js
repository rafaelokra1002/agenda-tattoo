import Link from "next/link";

// Landing simples que direciona para o agendamento.
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <p className="text-brand font-semibold tracking-widest uppercase text-sm">
          Studio Ink
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl font-extrabold">
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
