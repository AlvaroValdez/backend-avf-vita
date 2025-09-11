const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// SOLO las rutas absolutamente esenciales
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;