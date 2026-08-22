# 🚀 Deploy no Coolify

Este projeto tem **backend** (Express + Prisma) e **frontend** (Next.js).
No Coolify o mais robusto é criar **3 recursos**: um banco PostgreSQL e duas
aplicações (backend e frontend), todas apontando para o mesmo repositório do
GitHub, mudando apenas o **Base Directory**.

> Repositório: `https://github.com/rafaelokra1002/agenda-tattoo`

---

## Visão geral

```
┌────────────┐      ┌────────────┐      ┌────────────┐
│  Frontend  │ ───► │  Backend   │ ───► │ PostgreSQL │
│  Next.js   │      │  Express   │      │ (Coolify)  │
│  :3000     │      │  :4000     │      │  :5432     │
└────────────┘      └────────────┘      └────────────┘
```

---

## 1) Criar o banco PostgreSQL

1. No projeto do Coolify → **+ New** → **Database** → **PostgreSQL**.
2. Aguarde subir e copie a **Internal Connection URL** (algo como
   `postgres://postgres:senha@<host-interno>:5432/postgres`).
   - Use a URL **interna** (rede do Coolify), não a pública.

---

## 2) Criar a aplicação BACKEND

1. **+ New** → **Application** → **Public/Private Repository** → cole a URL do repo.
2. Configurações:
   - **Base Directory:** `/backend`
   - **Build Pack:** `Dockerfile`
   - **Port (Ports Exposes):** `4000`
   - **Health Check Path:** `/api/health`
3. Em **Environment Variables**, adicione:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | *(a Internal URL do passo 1; acrescente `?schema=public` se não houver)* |
   | `JWT_SECRET` | *(uma chave longa e aleatória)* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `ADMIN_EMAIL` | `seu-email@dominio.com` |
   | `ADMIN_PASSWORD` | *(sua senha de admin)* |
   | `ADMIN_NAME` | `Seu Nome` |
   | `PAYMENT_PROVIDER` | `fake` *(ou `mercadopago`)* |
   | `MERCADOPAGO_ACCESS_TOKEN` | *(se usar Mercado Pago)* |
   | `CORS_ORIGIN` | *(preencher depois com o domínio do frontend)* |
   | `NODE_ENV` | `production` |

4. **Deploy**. No boot ele roda `prisma db push` + `seed` automaticamente
   (cria tabelas, admin, serviços e horários).
5. Anote o **domínio público** gerado, ex.: `https://api-agenda.seu-coolify.app`.

---

## 3) Criar a aplicação FRONTEND

1. **+ New** → **Application** → mesmo repositório.
2. Configurações:
   - **Base Directory:** `/frontend`
   - **Build Pack:** `Dockerfile`
   - **Port (Ports Exposes):** `3000`
3. **Build Variable / Build Argument** (importante — é embutida no build):

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://api-agenda.seu-coolify.app/api` |

   > Use o domínio do **backend** do passo 2, terminando em `/api`.
   > No Coolify marque a opção **"Build Variable / Available at buildtime"**.

4. **Deploy**. Anote o domínio, ex.: `https://agenda.seu-coolify.app`.

---

## 4) Fechar o CORS

1. Volte na aplicação **backend** → Environment Variables.
2. Ajuste `CORS_ORIGIN` para o domínio **do frontend**
   (ex.: `https://agenda.seu-coolify.app`).
3. **Redeploy** do backend.

Pronto! Acesse o frontend e o painel em `/admin/login`.

---

## Sempre que der `git push`

O Coolify pode fazer **deploy automático** (habilite o webhook nas
configurações de cada app) ou você clica em **Redeploy** manualmente.

> ⚠️ Se você mudar o `NEXT_PUBLIC_API_URL`, é preciso **rebuildar** o frontend
> (essa variável entra no bundle em tempo de build, não em runtime).

---

## Alternativa: recurso único via Docker Compose

Se preferir subir tudo junto, o Coolify aceita um recurso **Docker Compose**
apontando para o `docker-compose.yml` da raiz. Nesse caso ajuste as variáveis
(principalmente `NEXT_PUBLIC_API_URL`, `CORS_ORIGIN` e `JWT_SECRET`) para os
domínios reais. O modo com apps separadas costuma ser mais simples de manter.

---

## Pagamento em produção (Mercado Pago)

1. `PAYMENT_PROVIDER=mercadopago` e `MERCADOPAGO_ACCESS_TOKEN=<token>` no backend.
2. Configure o **webhook** do Mercado Pago para
   `POST https://api-agenda.seu-coolify.app/api/payments/webhook`.

---

## Teste local do stack de produção (opcional)

Com Docker instalado:

```bash
docker compose up --build
# Site: http://localhost:3000  |  API: http://localhost:4000/api
```
