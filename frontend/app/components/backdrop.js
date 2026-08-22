// Fundo temático de estúdio de tatuagem para as páginas públicas.
// - Camada 1: gradientes escuros + brilho vermelho da marca
// - Camada 2 (opcional): SUA foto em /public/hero.jpg (aparece se existir)
// - Camada 3: padrão de line-art (rosa, máquina, estrelas) bem sutil
// - Camada 4: escurecimento por cima para o texto ficar legível
//
// Para usar sua própria foto: coloque o arquivo em frontend/public/hero.jpg
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base escura + brilhos */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 15% -10%, rgba(225,29,72,0.20), transparent 60%)," +
            "radial-gradient(900px 500px at 100% 110%, rgba(225,29,72,0.12), transparent 55%)," +
            "linear-gradient(180deg, #0b0b0f 0%, #0b0b0f 100%)",
        }}
      />

      {/* Foto do tatuador (opcional): coloque frontend/public/hero.jpg */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 grayscale"
        style={{ backgroundImage: "url('/hero.jpg')" }}
      />

      {/* Padrão de line-art estilo tattoo */}
      <svg className="absolute inset-0 h-full w-full text-white opacity-[0.05]" aria-hidden="true">
        <defs>
          <pattern id="ink" width="220" height="220" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              {/* Rosa (espiral + pétalas) */}
              <g transform="translate(48,52)">
                <path d="M0 0 a4 4 0 1 1 -0.1 0 M0 0 a9 9 0 1 0 9 3 a13 13 0 1 0 -18 -5" />
                <path d="M-13 -2 q-6 -8 2 -14 M13 -2 q6 -8 -2 -14 M-9 10 q-9 4 -6 14 M9 10 q9 4 6 14" />
                <path d="M0 15 l0 24 M0 30 q-7 -5 -10 -12 M0 34 q7 -5 10 -12" />
              </g>

              {/* Máquina de tatuagem (simplificada) */}
              <g transform="translate(150,140)">
                <rect x="-14" y="-10" width="20" height="16" rx="2" />
                <circle cx="-4" cy="-2" r="4" />
                <path d="M6 -6 l16 -10 M6 2 l16 10 M14 -11 l0 22 M14 11 l0 16 M14 27 l-3 6 M14 27 l3 6" />
              </g>

              {/* Estrelas / brilhos */}
              <path d="M120 40 q1.5 -6 3 0 q6 1.5 0 3 q-1.5 6 -3 0 q-6 -1.5 0 -3Z" />
              <path d="M30 150 q1.2 -5 2.4 0 q5 1.2 0 2.4 q-1.2 5 -2.4 0 q-5 -1.2 0 -2.4Z" />
              <path d="M190 70 q1 -4 2 0 q4 1 0 2 q-1 4 -2 0 q-4 -1 0 -2Z" />
              <circle cx="95" cy="115" r="1.4" />
              <circle cx="175" cy="30" r="1.2" />
              <circle cx="60" cy="185" r="1.2" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ink)" />
      </svg>

      {/* Escurecimento para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/70 to-ink" />
    </div>
  );
}
