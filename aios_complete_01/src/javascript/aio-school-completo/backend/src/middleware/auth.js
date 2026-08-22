const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * Middleware que verifica o token JWT no cabeçalho Authorization.
 * Em caso de sucesso, anexa { id, role } a req.user.
 */
async function protect(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Token em falta.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

/**
 * Middleware que restringe o acesso a um ou mais papéis específicos.
 * Uso: router.get('/admin', protect, restrictTo('institution'), handler)
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para aceder a este recurso.' });
    }
    next();
  };
}

/**
 * Garante que o utilizador autenticado só acede/edita o seu próprio recurso,
 * a menos que o :id do pedido coincida com o seu próprio id.
 */
function ownerOnly(req, res, next) {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Só podes editar o teu próprio perfil.' });
  }
  next();
}

module.exports = { protect, restrictTo, ownerOnly };
