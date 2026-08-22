const prisma = require('../config/db');
const { publicTeacher } = require('./authController');

/**
 * GET /api/teachers/me
 */
async function getMyProfile(req, res) {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: req.user.id } });
    if (!teacher) return res.status(404).json({ error: 'Perfil não encontrado.' });
    return res.json(publicTeacher(teacher));
  } catch (err) {
    console.error('Erro ao obter perfil:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * PUT /api/teachers/me
 */
async function updateMyProfile(req, res) {
  try {
    const allowed = ['fullName','phone','province','municipality','academicLevel','specialization','graduationInstitution','yearsExperience','pedagogicCert','languages','subjects','targetLevels','modalities','availability','rateMin','rateMax','ratePer','bio','portfolioUrl','avatarUrl'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    const updated = await prisma.teacher.update({
      where: { id: req.user.id },
      data
    });
    return res.json(publicTeacher(updated));
  } catch (err) {
    console.error('Erro ao actualizar perfil:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * POST /api/teachers/me/avatar
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updated = await prisma.teacher.update({
      where: { id: req.user.id },
      data: { avatarUrl }
    });
    return res.json({ avatarUrl: updated.avatarUrl });
  } catch (err) {
    console.error('Erro no upload de avatar:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * GET /api/teachers
 * Lista pública de professores, com filtros opcionais via query string:
 * ?province=Luanda&modality=Online&search=matemática
 */
async function listTeachers(req, res) {
  try {
    const { province, modality, search, limit = 50 } = req.query;

    const where = {};
    if (province) where.province = province;
    if (modality) where.modalities = { has: modality };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' }
    });

    return res.json(teachers.map(publicTeacher));
  } catch (err) {
    console.error('Erro ao listar professores:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * GET /api/teachers/:id  — perfil público de um professor específico
 */
async function getPublicProfile(req, res) {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    if (!teacher) return res.status(404).json({ error: 'Professor não encontrado.' });
    return res.json(publicTeacher(teacher));
  } catch (err) {
    console.error('Erro ao obter perfil público:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

module.exports = { getMyProfile, updateMyProfile, uploadAvatar, listTeachers, getPublicProfile };
