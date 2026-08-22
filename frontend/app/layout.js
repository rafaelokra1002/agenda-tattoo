import "./globals.css";

export const metadata = {
  title: "The Freedom Tattoo — Agendamento de Tatuagem",
  description: "Agende sua tatuagem online com pagamento do sinal via PIX.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
