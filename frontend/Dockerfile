# ============================================================
# Frontend (Next.js) — build multi-stage com output standalone
# ============================================================

# ---- Etapa 1: build ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# A URL da API é embutida no bundle em tempo de BUILD (variável NEXT_PUBLIC_*).
# No Coolify, defina esta build arg apontando para o domínio público do backend.
ARG NEXT_PUBLIC_API_URL="http://localhost:4000/api"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---- Etapa 2: runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copia apenas o necessário do build standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
