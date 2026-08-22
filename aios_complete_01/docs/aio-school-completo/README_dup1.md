# AIO School — All in One School
## OCO UP · Luanda, Angola

---

## Estrutura do Projecto

```
aio-school-completo/
├── frontend/          ← Site (HTML + CSS + JS)
│   ├── auth/          ← Login, Registo (aluno, professor, instituição)
│   ├── serviços/      ← Dashboard, explorar, página inicial
│   ├── perfis/        ← Perfis de aluno, professor e instituição
│   ├── assets/        ← Ícones PWA
│   ├── style.css      ← Estilos globais
│   ├── manifest.json  ← Configuração PWA
│   ├── sw.js          ← Service Worker (offline)
│   └── firebase-config.js  ← Credenciais Firebase (preencher)
└── backend/           ← API REST (Node.js + Express + PostgreSQL)
    ├── src/           ← Código da API
    ├── prisma/        ← Schema da base de dados
    ├── SETUP.md       ← Guia completo de configuração
    └── .env.example   ← Variáveis de ambiente (copiar para .env)
```

---

## Início Rápido

### Frontend
1. Preenche `frontend/firebase-config.js` com as tuas credenciais Firebase
2. Abre `frontend/serviços/página de Iniciação.html` com Live Server

### Backend (API própria, sem Firebase)
1. `cd backend`
2. `npm install`
3. `cp .env.example .env` e preenche o `.env`
4. `npx prisma migrate dev --name init`
5. `npm run dev`

Ver `backend/SETUP.md` para guia detalhado.

---

© OCO UP, Lda. · 2026
