// backend/routes/auth.js
'use strict';

const express = require('express');
const router = express.Router();

// 🔧 Reemplaza si tienes esto:
// const bcrypt = require('bcrypt');
// por esto:
const bcrypt = require('bcryptjs');

// Mantén tu middleware / controllers existentes tal cual
const auth = require('../middleware/auth');
const authController = require('../controllers/authControllerFinal');

// Ejemplos de uso (si los tienes en este archivo):
// const ok = await bcrypt.compare(password, user.password);
// const passHash = await bcrypt.hash(password, 10);

// ...resto del archivo sin cambios
module.exports = router;
