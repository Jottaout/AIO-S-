const prisma = require('../config/db');
const { publicInstitution } = require('./authController');

/**
 * GET /api/institutions/me
 */
async function getMyProfile(req, res) {
  try {
    const inst = await prisma.institution.findUnique({
      where: { id: req.user.id },
      include: { posts: { orderBy: { createdAt: 'desc' } }, branches: true }
    });
    if (!inst) return res.status(404).json({ error: 'Perfil não encontrado.' });
    return res.json(publicInstitution(inst));
  } catch (err) {
    console.error('Erro ao obter perfil:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * PUT /api/institutions/me
 */
async function updateMyProfile(req, res) {
  try {
    const allowed = ['nome','tipo','ministry','telefone','province','municipality','address','nif','slogan','foundationYear','teachingType','ageGroup','language','mapsLink','website','whatsapp','appEmail','facebook','instagram','linkedin','descricao','postal','servicos','ceo'];
    const data = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });

    const updated = await prisma.institution.update({
      where: { id: req.user.id },
      data
    });
    return res.json(publicInstitution(updated));
  } catch (err) {
    console.error('Erro ao actualizar perfil:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * POST /api/institutions/me/logo
 */
async function uploadLogo(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
    const logo = `/uploads/logos/${req.file.filename}`;
    const updated = await prisma.institution.update({ where: { id: req.user.id }, data: { logo } });
    return res.json({ logo: updated.logo });
  } catch (err) {
    console.error('Erro no upload de logo:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * POST /api/institutions/me/cover
 */
async function uploadCover(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
    const capa = `/uploads/covers/${req.file.filename}`;
    const updated = await prisma.institution.update({ where: { id: req.user.id }, data: { capa } });
    return res.json({ capa: updated.capa });
  } catch (err) {
    console.error('Erro no upload de capa:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * GET /api/institutions
 * Lista pública com filtros: ?tipo=U.+pública&province=Luanda&search=...
 */
async function listInstitutions(req, res) {
  try {
    const { tipo, province, search, limit = 50 } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (province) where.province = province;
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    const institutions = await prisma.institution.findMany({
      where,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' }
    });

    return res.json(institutions.map(publicInstitution));
  } catch (err) {
    console.error('Erro ao listar instituições:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * GET /api/institutions/:id — perfil público (inclui posts e branches)
 */
async function getPublicProfile(req, res) {
  try {
    const inst = await prisma.institution.findUnique({
      where: { id: req.params.id },
      include: { posts: { orderBy: { createdAt: 'desc' } }, branches: true }
    });
    if (!inst) return res.status(404).json({ error: 'Instituição não encontrada.' });
    return res.json(publicInstitution(inst));
  } catch (err) {
    console.error('Erro ao obter perfil público:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

// ── Publicações ──

/**
 * POST /api/institutions/me/posts
 */
async function createPost(req, res) {
  try {
    const { text, isHighlighted = false, isAlert = false } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Texto da publicação é obrigatório.' });

    const post = await prisma.post.create({
      data: { text, isHighlighted, isAlert, institutionId: req.user.id }
    });
    return res.status(201).json(post);
  } catch (err) {
    console.error('Erro ao criar publicação:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * DELETE /api/institutions/me/posts/:postId
 */
async function deletePost(req, res) {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
    if (!post || post.institutionId !== req.user.id) {
      return res.status(404).json({ error: 'Publicação não encontrada.' });
    }
    await prisma.post.delete({ where: { id: req.params.postId } });
    return res.json({ message: 'Publicação eliminada.' });
  } catch (err) {
    console.error('Erro ao eliminar publicação:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

// ── Unidades Orgânicas ──

/**
 * POST /api/institutions/me/branches
 */
async function createBranch(req, res) {
  try {
    const { nome, endereco, telefone } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome da unidade é obrigatório.' });

    const branch = await prisma.branch.create({
      data: { nome, endereco, telefone, institutionId: req.user.id }
    });
    return res.status(201).json(branch);
  } catch (err) {
    console.error('Erro ao criar unidade:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

/**
 * DELETE /api/institutions/me/branches/:branchId
 */
async function deleteBranch(req, res) {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } });
    if (!branch || branch.institutionId !== req.user.id) {
      return res.status(404).json({ error: 'Unidade não encontrada.' });
    }
    await prisma.branch.delete({ where: { id: req.params.branchId } });
    return res.json({ message: 'Unidade eliminada.' });
  } catch (err) {
    console.error('Erro ao eliminar unidade:', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

module.exports = {
  getMyProfile, updateMyProfile, uploadLogo, uploadCover,
  listInstitutions, getPublicProfile,
  createPost, deletePost,
  createBranch, deleteBranch
};
