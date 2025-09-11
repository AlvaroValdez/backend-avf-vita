// config/env.js
'use strict';
require('dotenv').config();

const app = {
  port: Number(process.env.PORT || 5000),
  // Permite dejar vacío y cae al localhost:5173
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
};

const vita = {
  // Stage según documentación
  baseURL: process.env.VITA_BASE_URL || 'https://api.stage.vitawallet.io/api/businesses',
  // Claves desde tu KEYS.txt (no hardcodear)
  login: process.env.VITA_X_LOGIN,        // X-Login
  apiKey: process.env.VITA_X_TRANS_KEY,   // X-Trans-Key
  secret: process.env.VITA_SECRET_KEY,    // Secret
  timeoutMs: Number(process.env.VITA_TIMEOUT_MS || 15000),
};

module.exports = { app, vita };
