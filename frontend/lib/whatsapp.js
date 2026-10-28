// Mensagem de confirmação enviada ao cliente pelo WhatsApp do tatuador.
import { formatBRL, formatDate } from "./format";

export function confirmationMessage(booking) {
  const firstName = (booking.client?.name || "").trim().split(/\s+/)[0];
  return [
    "🎉 *AGENDAMENTO CONFIRMADO!*",
    "",
    `Olá, ${firstName}! 👋`,
    "",
    "Seu agendamento foi confirmado com sucesso:",
    "",
    `📅 *Data:* ${formatDate(booking.date)}`,
    `⏰ *Horário:* ${booking.startTime}`,
    `✍️ *Serviço(s):* ${booking.service?.name || ""}`,
    `💰 *Valor:* ${formatBRL(booking.totalCents)}`,
    "",
    "📍 *Local:* The Freedom Tattoo",
    "📞 *Contato:* Em caso de dúvidas, entre em contato",
    "",
    "Aguardamos você! 🔥",
    "",
    "_Mensagem automática do sistema TheFreedomTattoo.shop_",
  ].join("\n");
}

// Link que abre o WhatsApp com a mensagem pronta para o número do cliente.
// Números sem código do país (10 ou 11 dígitos) recebem o 55 do Brasil.
export function whatsappLink(phone, text) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  // api.whatsapp.com preserva os emojis melhor que o wa.me no WhatsApp Web
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`;
}
