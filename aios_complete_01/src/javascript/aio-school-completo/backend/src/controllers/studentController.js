const prisma = require('../config/db');
const { publicStudent } = require('./authController');

/**
 * GET /api/students/me
 */
async function getMyProfile(req, res) {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.user.id } });
    if (!student) return res.status(404).json({ error: 'Perfil não encontrado.' });
    return res.json(publicStudent(student));
  } catch (err) {
    console.error('Erro ao obter perfil:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * PUT /api/students/me
 */
async function updateMyProfile(req, res) {
  try {
    const allowed = ['fullName','phone','province','municipality','institution','academicLevel','academicArea','mainObjective','budget','bio','avatarUrl','interests'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    const updated = await prisma.student.update({
      where: { id: req.user.id },
      data
    });
    return res.json(publicStudent(updated));
  } catch (err) {
    console.error('Erro ao actualizar perfil:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * POST /api/students/me/avatar  (multipart/form-data, campo "file")
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updated = await prisma.student.update({
      where: { id: req.user.id },
      data: { avatarUrl }
    });
    return res.json({ avatarUrl: updated.avatarUrl });
  } catch (err) {
    console.error('Erro no upload de avatar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

module.exports = { getMyProfile, updateMyProfile, uploadAvatar };
