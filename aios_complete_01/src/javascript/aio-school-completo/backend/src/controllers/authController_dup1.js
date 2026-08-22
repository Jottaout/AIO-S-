const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateToken, generateRandomToken } = require('../utils/generateToken');

const SALT_ROUNDS = 10;

// Mapeia o papel para o modelo Prisma correspondente
const modelByRole = {
  student: prisma.student,
  teacher: prisma.teacher,
  institution: prisma.institution
};

// ════════════════════════════════════════════════
// REGISTO
// ════════════════════════════════════════════════

/**
 * POST /api/auth/register/student
 */
async function registerStudent(req, res) {
  try {
    const { email, password, fullName, ...rest } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Este e-mail já está registado.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verifyToken = generateRandomToken();

    const student = await prisma.student.create({
      data: { email, passwordHash, fullName, verifyToken, ...sanitizeStudentFields(rest) }
    });

    const token = generateToken(student.id, 'student');
    // TODO: enviar e-mail de verificação com verifyToken (ver src/utils/email.js)

    return res.status(201).json({
      token,
      user: publicStudent(student)
    });
  } catch (err) {
    console.error('Erro no registo de aluno:', err);
    return res.status(500).json({ error: 'Erro interno ao registar.' });
  }
}

/**
 * POST /api/auth/register/teacher
 */
async function registerTeacher(req, res) {
  try {
    const { email, password, fullName, ...rest } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const existing = await prisma.teacher.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Este e-mail já está registado.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verifyToken = generateRandomToken();

    const teacher = await prisma.teacher.create({
      data: { email, passwordHash, fullName, verifyToken, ...sanitizeTeacherFields(rest) }
    });

    const token = generateToken(teacher.id, 'teacher');

    return res.status(201).json({
      token,
      user: publicTeacher(teacher)
    });
  } catch (err) {
    console.error('Erro no registo de professor:', err);
    return res.status(500).json({ error: 'Erro interno ao registar.' });
  }
}

/**
 * POST /api/auth/register/institution
 */
async function registerInstitution(req, res) {
  try {
    const { email, password, nome, ...rest } = req.body;

    if (!email || !password || !nome) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const existing = await prisma.institution.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Este e-mail já está registado.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verifyToken = generateRandomToken();

    const institution = await prisma.institution.create({
      data: { email, passwordHash, nome, verifyToken, ...sanitizeInstitutionFields(rest) }
    });

    const token = generateToken(institution.id, 'institution');

    return res.status(201).json({
      token,
      user: publicInstitution(institution)
    });
  } catch (err) {
    console.error('Erro no registo de instituição:', err);
    return res.status(500).json({ error: 'Erro interno ao registar.' });
  }
}

// ════════════════════════════════════════════════
// LOGIN — detecta automaticamente o papel do utilizador
// ════════════════════════════════════════════════

/**
 * POST /api/auth/login
 * Tenta autenticar nas 3 tabelas, por ordem: instituição → professor → aluno
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    // 1. Instituição
    let user = await prisma.institution.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const token = generateToken(user.id, 'institution');
      return res.json({ token, role: 'institution', user: publicInstitution(user) });
    }

    // 2. Professor
    user = await prisma.teacher.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const token = generateToken(user.id, 'teacher');
      return res.json({ token, role: 'teacher', user: publicTeacher(user) });
    }

    // 3. Aluno
    user = await prisma.student.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const token = generateToken(user.id, 'student');
      return res.json({ token, role: 'student', user: publicStudent(user) });
    }

    return res.status(401).json({ error: 'E-mail ou senha incorrectos.' });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno ao entrar.' });
  }
}

// ════════════════════════════════════════════════
// RECUPERAÇÃO DE SENHA
// ════════════════════════════════════════════════

/**
 * POST /api/auth/forgot-password
 * Body: { email, role }
 */
async function forgotPassword(req, res) {
  try {
    const { email, role } = req.body;
    if (!email || !role || !modelByRole[role]) {
      return res.status(400).json({ error: 'E-mail e papel (role) válidos são obrigatórios.' });
    }

    const model = modelByRole[role];
    const user = await model.findUnique({ where: { email } });

    // Por segurança, não revelar se o e-mail existe ou não
    if (!user) {
      return res.json({ message: 'Se o e-mail existir, receberás um link de recuperação.' });
    }

    const resetToken = generateRandomToken();
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await model.update({
      where: { email },
      data: { resetToken, resetTokenExp }
    });

    // TODO: enviar e-mail real com o link: `${FRONTEND_URL}/auth/reset-password.html?token=${resetToken}&role=${role}`
    console.log(`[DEV] Link de recuperação para ${email}: token=${resetToken}`);

    return res.json({ message: 'Se o e-mail existir, receberás um link de recuperação.' });
  } catch (err) {
    console.error('Erro em forgotPassword:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { token, role, newPassword }
 */
async function resetPassword(req, res) {
  try {
    const { token, role, newPassword } = req.body;
    if (!token || !role || !newPassword || !modelByRole[role]) {
      return res.status(400).json({ error: 'Dados em falta.' });
    }

    const model = modelByRole[role];
    const user = await model.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await model.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExp: null }
    });

    return res.json({ message: 'Senha actualizada com sucesso.' });
  } catch (err) {
    console.error('Erro em resetPassword:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * GET /api/auth/verify-email?token=...&role=...
 */
async function verifyEmail(req, res) {
  try {
    const { token, role } = req.query;
    if (!token || !role || !modelByRole[role]) {
      return res.status(400).json({ error: 'Dados em falta.' });
    }
    const model = modelByRole[role];
    const user = await model.findFirst({ where: { verifyToken: token } });
    if (!user) {
      return res.status(400).json({ error: 'Token de verificação inválido.' });
    }
    await model.update({ where: { id: user.id }, data: { emailVerified: true, verifyToken: null } });
    return res.json({ message: 'E-mail verificado com sucesso.' });
  } catch (err) {
    console.error('Erro em verifyEmail:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

// ════════════════════════════════════════════════
// Helpers — sanitização e formatação pública
// ════════════════════════════════════════════════

function sanitizeStudentFields(body) {
  const allowed = ['phone','province','municipality','institution','academicLevel','academicArea','mainObjective','budget','bio','avatarUrl','interests'];
  const out = {};
  allowed.forEach(k => { if (body[k] !== undefined) out[k] = body[k]; });
  return out;
}

function sanitizeTeacherFields(body) {
  const allowed = ['phone','province','municipality','academicLevel','specialization','graduationInstitution','yearsExperience','pedagogicCert','languages','subjects','targetLevels','modalities','availability','rateMin','rateMax','ratePer','bio','portfolioUrl','avatarUrl'];
  const out = {};
  allowed.forEach(k => { if (body[k] !== undefined) out[k] = body[k]; });
  return out;
}

function sanitizeInstitutionFields(body) {
  const allowed = ['tipo','ministry','telefone','province','municipality','address','nif','slogan','foundationYear','teachingType','ageGroup','language','mapsLink','website','whatsapp','appEmail','facebook','instagram','linkedin','descricao','postal','servicos','logo','capa','ceo'];
  const out = {};
  allowed.forEach(k => { if (body[k] !== undefined) out[k] = body[k]; });
  return out;
}

function publicStudent(s) {
  const { passwordHash, verifyToken, resetToken, resetTokenExp, ...rest } = s;
  return rest;
}
function publicTeacher(t) {
  const { passwordHash, verifyToken, resetToken, resetTokenExp, ...rest } = t;
  return rest;
}
function publicInstitution(i) {
  const { passwordHash, verifyToken, resetToken, resetTokenExp, ...rest } = i;
  return rest;
}

module.exports = {
  registerStudent,
  registerTeacher,
  registerInstitution,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  publicStudent,
  publicTeacher,
  publicInstitution
};
