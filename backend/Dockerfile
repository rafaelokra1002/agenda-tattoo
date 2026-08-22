# ============================================================
# Backend (Express + Prisma) — imagem de produção
# Usa Debian slim + OpenSSL (Prisma não funciona bem no Alpine/musl).
# Schema de produção: prisma/schema.prod.prisma (PostgreSQL).
# ============================================================
FROM node:20-slim

WORKDIR /app

# OpenSSL é exigido pelo motor do Prisma para conectar/aplicar o schema.
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Instala dependências (inclui devDependencies: o CLI do Prisma está nelas).
COPY package*.json ./
RUN npm ci --include=dev

# Copia o restante do código
COPY . .

# Gera o Prisma Client a partir do schema de PRODUÇÃO (PostgreSQL)
RUN npx prisma generate --schema=prisma/schema.prod.prisma

ENV NODE_ENV=production
EXPOSE 4000

# No start: sincroniza o schema, roda o seed (idempotente) e sobe a API.
CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema.prod.prisma --accept-data-loss && node prisma/seed.js && node src/server.js"]
