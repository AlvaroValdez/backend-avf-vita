// backend/routes/auth.js
'use strict';

const express = require('express');
const router = express.Router();

// ✅ Importa la función directamente (sin destructuring)
const auth = require('../middleware/auth');

// Controller real
const authController = require('../controllers/authControllerFinal');

// Helper: si falta un handler, responde 501 en vez de crashear
const safe = (name) => {
  const fn = authController?.[name];
  if (typeof fn === 'function') return fn;
  console.warn(`⚠️  authController.${name} no implementado`);
  return (req, res) => res.status(501).json({ message: `${name} no implementado` });
};

// Debug minimal
try {
  const keys = Object.keys(authController || {});
  console.log('🔍 authController keys:', keys);
} catch {}

router.post('/register', safe('register'));
router.post('/login', safe('login'));

// Rutas protegidas (solo si el middleware existe)
if (typeof auth === 'function') {
  router.get('/profile', auth, safe('getProfile'));
  router.post('/logout', auth, safe('logout'));
} else {
  console.warn('⚠️  middleware auth no es una función; omitiendo rutas protegidas');
}

module.exports = router;
