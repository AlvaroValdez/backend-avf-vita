// services/vitaHttpClient.js
'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { vita } = require('../config/env');

// === Firma V2 oficial Vita ===
// HMAC_SHA256(secret, x_login + x_date + sorted_body)
// - sorted_body: concatenación de pares key+value ordenados alfabéticamente, sin separadores.
// - Si no hay body (GET/DELETE), sorted_body = ''.
// - X-Trans-Key va en header; NO entra en el hash.
function buildSignature({ xLogin, xDate, secret, body }) {
  const sortedBody =
    body && typeof body === 'object' && Object.keys(body).length
      ? Object.keys(body).sort().map(k => `${k}${String(body[k])}`).join('')
      : '';
  const payload = `${xLogin}${xDate}${sortedBody}`;
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

// 1) Crear el cliente ANTES de usar interceptores
const client = axios.create({
  baseURL: vita.baseURL, // https://api.stage.vitawallet.io/api/businesses
  timeout: vita.timeoutMs || 15000,
});

// 2) Interceptor de request (firma y headers)
// services/vitaHttpClient.js (solo el interceptor; el resto igual)
client.interceptors.request.use((req) => {
  const xDate = new Date().toISOString();
  const xLogin = vita.login;
  const xTransKey = vita.apiKey;
  const secret = vita.secret;

  const method = (req.method || 'get').toUpperCase();
  const body = (method === 'GET' || method === 'DELETE') ? null : (req.data || null);

  const signature = buildSignature({ xLogin, xDate, secret, body });

  // 👇 Formato EXACTO: "V2-HMAC-SHA256, Signature: <hash>"
  const authHeader = `V2-HMAC-SHA256, Signature: ${signature}`;

  req.headers = {
    ...(req.headers || {}),
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Date': xDate,
    'X-Login': xLogin,
    'X-Trans-Key': xTransKey,             // dejamos este header como acordamos
    'Authorization': authHeader,
  };

  // Log mínimo en dev (no exponemos el hash completo)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔑 Vita headers:',
      { 'X-Date': xDate, 'X-Login': xLogin, 'X-Trans-Key': !!xTransKey, Authorization: authHeader.slice(0, 40) + '...' }
    );
  }

  return req;
});


// 3) Interceptor de response (normaliza errores)
client.interceptors.response.use(
  r => r,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const e = new Error(data?.message || err.message);
    e.status = status;
    e.data = data;
    throw e;
  }
);

module.exports = client;
