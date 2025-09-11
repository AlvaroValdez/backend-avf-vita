// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

module.exports = async function auth(req, res, next) {
  try {
    const hdr = req.header('Authorization') || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.', code: 'NO_TOKEN' });

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ message: 'Token inválido', code: 'INVALID_TOKEN' });

    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expirado', code: 'TOKEN_EXPIRED' });
    if (e.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Token inválido', code: 'INVALID_TOKEN' });
    console.error('Auth error:', e.message);
    res.status(500).json({ message: 'Error en autenticación', code: 'AUTH_ERROR' });
  }
};
