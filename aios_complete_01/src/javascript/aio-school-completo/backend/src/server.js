require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');
const path     = require('path');

const authRoutes        = require('./routes/authRoutes');
const studentRoutes     = require('./routes/studentRoutes');
const teacherRoutes     = require('./routes/teacherRoutes');
const institutionRoutes = require('./routes/institutionRoutes');

const app  = express();
const PORT = process.env.PORT || 4000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ── Segurança ──
app.use(helmet({
  // Permite carregar scripts/estilos da CDN do Tailwind, Google Fonts e Firebase
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com",
                    "www.gstatic.com", "*.firebaseapp.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "fonts.googleapis.com",
                    "cdn.tailwindcss.com", "unpkg.com"],
      fontSrc:     ["'self'", "fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "blob:", "*"],
      connectSrc:  ["'self'", "*.googleapis.com", "*.firebaseio.com",
                    "identitytoolkit.googleapis.com", "*.cloudfunctions.net"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS ──
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : '*',
  credentials: true
}));

// ── Logs ──
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Body parsing ──
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { error: 'Demasiadas tentativas. Aguarda uns minutos.' }
}));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  message: { error: 'Demasiados pedidos. Aguarda um momento.' }
}));

// ── Ficheiros estáticos: uploads (avatares, logos, capas) ──
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── API ──
app.use('/api/auth',         authRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/teachers',     teacherRoutes);
app.use('/api/institutions', institutionRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Frontend: serve os ficheiros HTML ──
// Serve a pasta public/ com os ficheiros estáticos do site
app.use(express.static(PUBLIC_DIR));

// Rotas nomeadas para páginas específicas
const pages = {
  '/':              'serviços/página de Iniciação.html',
  '/login':         'auth/login.html',
  '/registar':      'auth/Register.html',
  '/professor':     'auth/register-teacher.html',
  '/instituicao':   'auth/register-institution.html',
  '/dashboard':     'serviços/dashboard-aluno.html',
  '/explorar':      'serviços/training-centers.html',
  '/institutos':    'serviços/institutos-superiores.html',
  '/sobre':         'serviços/sobre.html',
  '/privacidade':   'serviços/privacidade.html',
  '/perfil':        'perfis/perfil-aluno.html',
  '/perfil-org':    'perfis/perfil-organizacao.html',
  '/perfil-prof':   'perfis/perfil-professor.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, file));
  });
});

// ── 404 para rotas de API não encontradas ──
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ── Fallback: qualquer outro URL serve a página inicial ──
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'serviços/página de Iniciação.html'));
});

// ── Tratamento global de erros ──
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Ficheiro demasiado grande.' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor.'
  });
});

app.listen(PORT, () => {
  console.log(`✓ AIO School a correr em http://localhost:${PORT}`);
  console.log(`✓ Frontend: http://localhost:${PORT}/`);
  console.log(`✓ API:      http://localhost:${PORT}/api/health`);
  console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
