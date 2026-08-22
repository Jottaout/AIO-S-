const express = require('express');
const router = express.Router();
const {
  registerStudent, registerTeacher, registerInstitution,
  login, forgotPassword, resetPassword, verifyEmail
} = require('../controllers/authController');

// Registo — um endpoint por tipo de utilizador
router.post('/register/student', registerStudent);
router.post('/register/teacher', registerTeacher);
router.post('/register/institution', registerInstitution);

// Login único — detecta automaticamente o papel
router.post('/login', login);

// Recuperação de senha
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Verificação de e-mail
router.get('/verify-email', verifyEmail);

module.exports = router;
