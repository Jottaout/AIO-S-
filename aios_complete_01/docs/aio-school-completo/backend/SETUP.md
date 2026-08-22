# 🚀 AIO School — Guia de Configuração (Servidor Único)
## All in One School · OCO UP

---

## Arquitectura

```
Um único servidor Node.js serve TUDO:

http://teu-dominio.com/         → Página inicial (HTML)
http://teu-dominio.com/login    → Login (HTML)
http://teu-dominio.com/api/...  → API REST (JSON)
http://teu-dominio.com/uploads/ → Imagens (fotos, logos)
```

Não precisas de Firebase, Vercel, nem serviços separados.

---

## PASSO 1 — Instalar dependências

```bash
cd aio-school
npm install
```

---

## PASSO 2 — Configurar a base de dados PostgreSQL

Escolhe UMA das opções gratuitas:

### Opção A — Neon (recomendado para começar)
1. [neon.tech](https://neon.tech) → criar conta → novo projecto
2. Copia o "Connection String" (começa com `postgresql://`)

### Opção B — Railway
1. [railway.app](https://railway.app) → "New Project" → "PostgreSQL"
2. Copia a "Connection URL" nas variáveis

### Opção C — Local (para desenvolvimento)
```bash
# Se tiveres PostgreSQL instalado localmente:
createdb aio_school
# DATABASE_URL = postgresql://postgres:senha@localhost:5432/aio_school
```

---

## PASSO 3 — Configurar o .env

```bash
cp .env.example .env
```

Abre `.env` e preenche:

```env
DATABASE_URL="postgresql://..."   # do passo 2
JWT_SECRET="gera-com-o-comando-abaixo"
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:4000"
```

Para gerar o JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## PASSO 4 — Criar as tabelas

```bash
npx prisma migrate deploy
```

Isto cria automaticamente as tabelas `students`, `teachers`, `institutions`, `posts` e `branches`.

---

## PASSO 5 — Iniciar o servidor

```bash
# Desenvolvimento (reinicia automaticamente ao guardar ficheiros)
npm run dev

# Produção
npm start
```

Deves ver:
```
✓ AIO School a correr em http://localhost:4000
✓ Frontend: http://localhost:4000/
✓ API:      http://localhost:4000/api/health
```

Abre http://localhost:4000 no browser — o site está a funcionar!

---

## Como publicar online (Render — gratuito)

1. Cria conta em [render.com](https://render.com)
2. "New" → "Web Service" → liga ao teu repositório Git
3. Preenche:
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm start`
4. Em "Environment Variables", adiciona todas as variáveis do `.env`
5. Clica "Deploy" — o site fica online em `https://aio-school.onrender.com`

---

## Estrutura de pastas

```
aio-school/
├── public/                ← Frontend (servido pelo Express)
│   ├── auth/              ← login, registos
│   ├── serviços/          ← dashboard, explorar, etc.
│   ├── perfis/            ← perfis de utilizador
│   ├── assets/            ← ícones PWA
│   ├── api.js             ← comunicação com a API (incluir em todas as páginas)
│   ├── style.css
│   ├── manifest.json
│   └── sw.js
├── src/                   ← Backend (API)
│   ├── server.js          ← entrada principal
│   ├── controllers/       ← lógica de negócio
│   ├── routes/            ← endpoints
│   ├── middleware/        ← JWT, uploads
│   └── utils/
├── prisma/
│   └── schema.prisma      ← estrutura da base de dados
├── uploads/               ← ficheiros enviados pelos utilizadores
├── package.json
├── .env                   ← variáveis de ambiente (nunca commitar)
└── .env.example           ← modelo para o .env
```

---

## Rotas disponíveis

### Páginas (HTML)
| URL | Página |
|---|---|
| `/` | Página inicial |
| `/login` | Login |
| `/registar` | Registo de aluno |
| `/professor` | Registo de professor |
| `/instituicao` | Registo de instituição |
| `/dashboard` | Painel do aluno |
| `/explorar` | Explorar formações |
| `/perfil` | Perfil do aluno |
| `/perfil-org` | Perfil da instituição |
| `/perfil-prof` | Perfil do professor |

### API (JSON)
| Método | URL | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Login (3 tipos) |
| POST | `/api/auth/register/student` | Registo aluno |
| POST | `/api/auth/register/teacher` | Registo professor |
| POST | `/api/auth/register/institution` | Registo instituição |
| GET | `/api/institutions` | Listar instituições |
| GET | `/api/teachers` | Listar professores |
| GET | `/api/health` | Estado do servidor |

---

*OCO UP, Lda. · All in One School · Luanda, Angola*
