import { BASE } from "./api";

// Imagens das categorias (arquivos em /public).
export const SERVICE_IMAGES = [
  "/tatuagem de nome e data.jpeg",
  "/Tatuagem no antebraço interna ou externa.jpeg",
  "/Tatuagem de frases na região Antebraço,pescoço,ombro.jpeg",
  "/Tatuagem de escrita na coluna.jpeg",
  "/Tatuagem n parte superior do braço.jpeg",
  "/Tatuagem na parte superior da mão.jpeg",
  "/Tatuagem na região do bíceps.jpeg",
  "/Tatuagem na canela, lateral da perna ou panturrilha.jpeg",
  "/Tatuagem na coxa ou joelho.jpeg",
  "/Tatuagem fechamento de braço parte externa.jpeg",
  "/Tatuagem fechamento de costas.jpeg",
  "/Tatuagem fechamento de peito ou tórax.jpeg",
  "/Tatuagem nas costas desenho.jpeg",
  "/Tatuagem na região do peito.jpeg",
  "/Tatuagem na região do tórax.jpeg",
  "/Tatuagem na costela desenhos ou escritas.jpeg",
  "/atuagem na costela ou abdômen.jpeg",
  "/Tatuagem na região lombar.jpeg",
  "/tatuagem na virilha,cintura,nadegas.jpeg",
];

// Nome legível da imagem (para o seletor do painel)
export function imageLabel(path) {
  return path.replace(/^\//, "").replace(/\.\w+$/, "");
}

// URL segura (os nomes têm espaços e acentos). A vírgula fica como está:
// o servidor do Next não encontra o arquivo se ela vier como "%2C".
export function imageSrc(path) {
  if (/^https?:/.test(path)) return path;
  return encodeURI(path);
}

const STOPWORDS = new Set([
  "tatuagem", "atuagem", "regiao", "de", "do", "da", "na", "no", "nas", "nos", "ou", "e", "em",
]);

function words(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

// Imagem do serviço, nesta ordem: a foto enviada pelo painel, a escolhida
// entre as da pasta /public ou, se não houver,
// a que tiver mais palavras em comum com o nome do serviço
// (no empate, a de nome mais curto, ou seja, a mais específica).
export function serviceImage(service) {
  if (service.photoAt)
    return `${BASE}/services/${service.id}/photo?v=${Date.parse(service.photoAt)}`;
  if (service.imageUrl) return service.imageUrl;
  const target = new Set(words(service.name));
  let best = null;
  let bestScore = 0;
  for (const img of SERVICE_IMAGES) {
    const imgWords = words(img);
    const hits = imgWords.filter((w) => target.has(w)).length;
    const score = hits ? hits - imgWords.length / 100 : 0;
    if (score > bestScore) {
      best = img;
      bestScore = score;
    }
  }
  return best;
}
