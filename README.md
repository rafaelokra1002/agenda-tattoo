# 🖊️ The Freedom Tattoo — Sistema de Agendamento para Tatuador

Sistema completo (SaaS) de agendamento online com **painel administrativo**,
pagamento de sinal via **PIX** e regras de agenda configuráveis.

- **Backend:** Node.js + Express + Prisma + PostgreSQL
- **Frontend:** Next.js (App Router) + TailwindCSS
- **Auth:** JWT
- **Pagamento:** PIX simulado (adapter pronto para Mercado Pago)

---

## 📁 Estrutura do projeto

```
Tatuagem/
├── backend/                  # API REST (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma     # Models: Client, Service, Booking, Payment, Admin, Settings, WorkingHours, BlockedDate
│   │   └── seed.js           # Dados iniciais (admin, serviços, horários)
│   └── src/
│       ├── config/           # env + prisma client
│       ├── middleware/       # auth (JWT), validação (Zod), erros
│       ├── utils/            # jwt, datas, http helpers
│       ├── services/         # regras de negócio (agenda, pagamento, agendamento)
│       ├── controllers/      # públicos + admin + auth
│       ├── routes/           # /api (público) e /api/admin (protegido)
│       ├── validators/       # schemas Zod
│       ├── app.js            # configuração do Express
│       └── server.js         # entrypoint
│
└── frontend/                 # Next.js + Tailwind
    ├── lib/                  # api client, auth, formatação
    └── app/
        ├── agendamento/      # fluxo do cliente
        ├── pagamento/        # PIX + confirmação
        ├── confirmacao/
        └── admin/            # login + dashboard + bookings + clients + services + schedule + settings
```

---

## ✅ Pré-requisitos

- **Node.js 18+**
- **PostgreSQL** rodando localmente (ou uma URL de conexão, ex.: Neon/Supabase/Railway)

---

## 🚀 Passo a passo para rodar

### 1) Backend

```bash
cd backend
npm install

# Configure o ambiente
cp .env.example .env
# Edite o .env e ajuste DATABASE_URL, JWT_SECRET e a chave PIX

# Crie as tabelas no banco
npm run prisma:migrate     # cria a migration inicial
# (ou, sem histórico de migration: npx prisma db push)

# Popular dados iniciais (admin, serviços, horários)
npm run seed

# Iniciar a API
npm run dev
```

A API sobe em **http://localhost:4000**.
Admin padrão (definido no `.env`): **admin@tattoo.com / admin123**

### 2) Frontend

```bash
cd frontend
npm install

# Configure a URL da API
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000/api

npm run dev
```

O site sobe em **http://localhost:3000**.

---

## 🔗 Rotas principais

### Cliente (site)
| Página | Descrição |
|---|---|
| `/agendamento` | Escolha de serviço, data, horário e dados |
| `/pagamento` | QR Code / copia-e-cola PIX do sinal |
| `/confirmacao` | Comprovante do agendamento confirmado |

### Admin (painel)
| Página | Descrição |
|---|---|
| `/admin/login` | Login (e-mail + senha, JWT) |
| `/admin/dashboard` | Total de agendamentos, faturamento, próximos horários |
| `/admin/bookings` | Listar, cancelar e remarcar |
| `/admin/clients` | Listar clientes |
| `/admin/services` | Criar, editar e excluir serviços |
| `/admin/schedule` | Horários por dia da semana + bloquear datas |
| `/admin/settings` | % do sinal, chave PIX, hora limite |

---

## 📡 API (resumo)

**Público**
- `GET  /api/services` — serviços ativos
- `GET  /api/availability?date=YYYY-MM-DD` — horários livres
- `GET  /api/settings/public` — % sinal, chave PIX, hora limite
- `POST /api/bookings` — cria agendamento + cobrança PIX
- `GET  /api/bookings/:id` — status do agendamento
- `POST /api/payments/:bookingId/confirm` — **simula** pagamento aprovado
- `POST /api/payments/webhook` — webhook do provedor real

**Admin (Bearer token)**
- `POST /api/admin/login`, `GET /api/admin/me`
- `GET  /api/admin/dashboard`
- `GET  /api/admin/bookings`, `PATCH .../:id/cancel`, `PATCH .../:id/reschedule`
- `GET  /api/admin/clients`
- `GET/POST/PUT/DELETE /api/admin/services`
- `GET /api/admin/working-hours`, `PUT .../:weekday`
- `GET/POST/DELETE /api/admin/blocked-dates`
- `GET/PUT /api/admin/settings`

---

## 💰 Pagamento PIX

Por padrão o sistema usa o provedor **`fake`** (simulado), que gera um
"copia e cola" e um QR ilustrativo — ideal para desenvolvimento. No fluxo do
cliente há o botão **"Já paguei (simular confirmação)"** que confirma o agendamento.

### Ativar Mercado Pago (produção)
1. No `backend/.env`:
   ```
   PAYMENT_PROVIDER="mercadopago"
   MERCADOPAGO_ACCESS_TOKEN="seu_access_token"
   ```
2. A criação da cobrança já está implementada em
   `src/services/payment.service.js` (adapter `mercadoPagoProvider`).
3. Configure o **webhook** do Mercado Pago apontando para
   `POST /api/payments/webhook` para confirmação automática.

---

## 📋 Regras de negócio implementadas

- ✅ Sinal obrigatório de **50%** (configurável) antes de confirmar
- ✅ Agendamento confirmado **somente após o pagamento**
- ✅ **Não permite horário duplicado** (checagem transacional, ignora cancelados)
- ✅ Só oferece **horários disponíveis** do dia
- ✅ **Domingo bloqueado** (e qualquer dia desabilitado no painel)
- ✅ **Só agenda até 16h** (`maxBookingHour`, configurável)
- ✅ **Feriados/folgas** bloqueáveis por data
- ✅ Horários padrão: Seg–Qui `08:30 / 14:30` · Sex–Sáb `09:00–16:00`

---

## 🧱 Modelos (Prisma)

`Client`, `Service`, `Booking`, `Payment`, `Admin`, `Settings`,
`WorkingHours`, `BlockedDate` — ver `backend/prisma/schema.prisma`.

Preços são armazenados em **centavos** (`Int`) para evitar erros de arredondamento.

---

## 🔒 Segurança / produção (próximos passos sugeridos)

- Trocar `JWT_SECRET` por um valor forte e único
- Servir o frontend/back atrás de HTTPS
- Rate limiting no login (ex.: `express-rate-limit`)
- Validar a assinatura do webhook do Mercado Pago
- Backups do PostgreSQL
```
