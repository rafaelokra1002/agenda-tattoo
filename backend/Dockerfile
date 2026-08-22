# ============================================================
# Backend (Express + Prisma) — imagem de produção
# Usa o schema Postgres (prisma/schema.prod.prisma).
# ============================================================
FROM node:20-alpine

WORKDIR /app

# Instala dependências (inclui prisma para gerar o client e aplicar o schema)
COPY package*.json ./
RUN npm ci

# Copia o restante do código
COPY . .

# Gera o Prisma Client a partir do schema de PRODUÇÃO (PostgreSQL)
RUN npx prisma generate --schema=prisma/schema.prod.prisma

ENV NODE_ENV=production
EXPOSE 4000

# No start: sincroniza o schema com o banco, roda o seed (idempotente) e sobe a API.
CMD ["sh", "-c", "npx prisma db push --schema=prisma/schema.prod.prisma --accept-data-loss && node prisma/seed.js && node src/server.js"]
