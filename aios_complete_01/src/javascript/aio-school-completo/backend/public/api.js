/**
 * api.js — All in One School
 * Camada de comunicação entre o frontend e o backend próprio.
 * Inclui em todas as páginas HTML com:
 *   <script src="../api.js"></script>   (de dentro de auth/ ou perfis/ ou serviços/)
 *   <script src="./api.js"></script>    (da raiz)
 */

const API = (() => {

  // URL base da API — em produção será o teu domínio real
  const BASE_URL = window.location.origin + '/api';

  // ── Token JWT (guardado em memória + sessionStorage) ──
  let _token = sessionStorage.getItem('aio_token') || null;
  let _user  = JSON.parse(sessionStorage.getItem('aio_user') || 'null');

  function saveSession(token, user) {
    _token = token;
    _user  = user;
    sessionStorage.setItem('aio_token', token);
    sessionStorage.setItem('aio_user', JSON.stringify(user));
  }

  function clearSession() {
    _token = null;
    _user  = null;
    sessionStorage.removeItem('aio_token');
    sessionStorage.removeItem('aio_user');
  }

  function getToken()    { return _token; }
  function getUser()     { return _user; }
  function isLoggedIn()  { return !!_token; }
  function getRole()     { return _user?.role || null; }

  // ── Pedido base com autorização automática ──
  async function request(method, path, body = null, isFormData = false) {
    const headers = {};
    if (_token) headers['Authorization'] = `Bearer ${_token}`;
    if (!isFormData && body) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    const res = await fetch(BASE_URL + path, opts);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw { status: res.status, message: data.error || 'Erro desconhecido.' };
    }
    return data;
  }

  // ════════════════════════════════════════════════
  // AUTENTICAÇÃO
  // ════════════════════════════════════════════════

  async function loginAluno(email, password) {
    const data = await request('POST', '/auth/login', { email, password });
    saveSession(data.token, data.user);
    return data;
  }

  async function registarAluno(dados) {
    const data = await request('POST', '/auth/register/student', dados);
    saveSession(data.token, data.user);
    return data;
  }

  async function registarProfessor(dados) {
    const data = await request('POST', '/auth/register/teacher', dados);
    saveSession(data.token, data.user);
    return data;
  }

  async function registarInstituicao(dados) {
    const data = await request('POST', '/auth/register/institution', dados);
    saveSession(data.token, data.user);
    return data;
  }

  async function recuperarSenha(email, role) {
    return request('POST', '/auth/forgot-password', { email, role });
  }

  async function redefinirSenha(token, role, newPassword) {
    return request('POST', '/auth/reset-password', { token, role, newPassword });
  }

  function logout() {
    clearSession();
    window.location.href = '/login';
  }

  // ════════════════════════════════════════════════
  // ALUNO
  // ════════════════════════════════════════════════

  async function getMeuPerfilAluno() {
    return request('GET', '/students/me');
  }

  async function actualizarPerfilAluno(dados) {
    return request('PUT', '/students/me', dados);
  }

  async function uploadAvatarAluno(file) {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/students/me/avatar', fd, true);
  }

  // ════════════════════════════════════════════════
  // PROFESSOR
  // ════════════════════════════════════════════════

  async function getMeuPerfilProfessor() {
    return request('GET', '/teachers/me/profile');
  }

  async function actualizarPerfilProfessor(dados) {
    return request('PUT', '/teachers/me/profile', dados);
  }

  async function uploadAvatarProfessor(file) {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/teachers/me/avatar', fd, true);
  }

  async function listarProfessores(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    return request('GET', `/teachers${params ? '?' + params : ''}`);
  }

  async function getPerfilPublicoProfessor(id) {
    return request('GET', `/teachers/${id}`);
  }

  // ════════════════════════════════════════════════
  // INSTITUIÇÃO
  // ════════════════════════════════════════════════

  async function getMeuPerfilInstituicao() {
    return request('GET', '/institutions/me/profile');
  }

  async function actualizarPerfilInstituicao(dados) {
    return request('PUT', '/institutions/me/profile', dados);
  }

  async function uploadLogoInstituicao(file) {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/institutions/me/logo', fd, true);
  }

  async function uploadCapaInstituicao(file) {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/institutions/me/cover', fd, true);
  }

  async function listarInstituicoes(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    return request('GET', `/institutions${params ? '?' + params : ''}`);
  }

  async function getPerfilPublicoInstituicao(id) {
    return request('GET', `/institutions/${id}`);
  }

  // ── Publicações ──
  async function criarPublicacao(text, isHighlighted = false, isAlert = false) {
    return request('POST', '/institutions/me/posts', { text, isHighlighted, isAlert });
  }

  async function eliminarPublicacao(postId) {
    return request('DELETE', `/institutions/me/posts/${postId}`);
  }

  // ── Unidades Orgânicas ──
  async function criarUnidade(nome, endereco = '', telefone = '') {
    return request('POST', '/institutions/me/branches', { nome, endereco, telefone });
  }

  async function eliminarUnidade(branchId) {
    return request('DELETE', `/institutions/me/branches/${branchId}`);
  }

  // ════════════════════════════════════════════════
  // UTILITÁRIOS
  // ════════════════════════════════════════════════

  // Protege uma página: redireciona para login se não autenticado
  function requireAuth(allowedRoles = []) {
    if (!isLoggedIn()) {
      window.location.href = '/login';
      return false;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(getRole())) {
      window.location.href = '/';
      return false;
    }
    return true;
  }

  // Redireciona após login consoante o papel
  function redirectByRole() {
    const role = getRole();
    if (role === 'institution') window.location.href = '/perfil-org';
    else if (role === 'teacher')  window.location.href = '/perfil-prof';
    else                          window.location.href = '/dashboard';
  }

  // Expõe a API publicamente
  return {
    // Auth
    loginAluno, registarAluno, registarProfessor, registarInstituicao,
    recuperarSenha, redefinirSenha, logout,
    // Sessão
    getToken, getUser, isLoggedIn, getRole,
    requireAuth, redirectByRole,
    // Aluno
    getMeuPerfilAluno, actualizarPerfilAluno, uploadAvatarAluno,
    // Professor
    getMeuPerfilProfessor, actualizarPerfilProfessor, uploadAvatarProfessor,
    listarProfessores, getPerfilPublicoProfessor,
    // Instituição
    getMeuPerfilInstituicao, actualizarPerfilInstituicao,
    uploadLogoInstituicao, uploadCapaInstituicao,
    listarInstituicoes, getPerfilPublicoInstituicao,
    criarPublicacao, eliminarPublicacao,
    criarUnidade, eliminarUnidade,
  };
})();
