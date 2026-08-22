const jwt = require('jsonwebtoken');

/**
 * Gera um token JWT para um utilizador autenticado.
 * @param {string} id - ID do utilizador (UUID)
 * @param {string} role - 'student' | 'teacher' | 'institution'
 */
function generateToken(id, role) {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function generateRandomToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

module.exports = { generateToken, generateRandomToken };
