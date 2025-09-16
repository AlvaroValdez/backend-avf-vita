// routes/api.js
const express = require('express');
const router = express.Router();

console.log('[api-router] loaded v2025-09-15-STABLE', __filename);

const vitaService = require('../services/vitaService');
const verifyVitaSignature = require('../middleware/verifyVitaSignature');
const VitaEvent = require('../models/VitaEvent');

// Helper async
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ⬇️ NUEVO helper: limita tiempo de espera de una promesa (no cancela la remota, pero evita colgar el endpoint)
function withTimeout(promise, ms, label = 'op') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT:${label}:${ms}ms`)), ms))
  ]);
}

/* ========= Health ========= */
router.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* ======= Vita: Lecturas ======= */
router.get('/prices', ah(async (_req, res) => {
  const data = await vitaService.getPrices();
  res.json(data);
}));

router.get('/countries', ah(async (req, res) => {
  // Permite pedir una versión "rápida" con timeouts más agresivos: /countries?fast=1
  const fast = req.query.fast === '1';
  const t1 = fast ? 1500 : 3000; // timeout getAvailableCountries
  const t2 = fast ? 2000 : 4000; // timeout fallback withdrawal-rules

  // 1) Intento original (si tu vitaService ya lo calcula desde /prices)
  try {
    const list = await withTimeout(vitaService.getAvailableCountries(), t1, 'getAvailableCountries');
    if (Array.isArray(list) && list.length > 0) {
      return res.json(list);
    }
  } catch (e) {
    console.warn('[GET /countries] getAvailableCountries falló/timeout:', e.message || e);
  }

  // 2) Fallback: derivar ISO-2 desde las keys de rules
  try {
    // Observación: tu backend devuelve todas las rules aunque pases country=CL
    const raw = await withTimeout(vitaService.getWithdrawalRules('CL'), t2, 'getWithdrawalRulesFallback');
    const keys = Object.keys(raw?.rules || {});
    const iso2 = [...new Set(
      keys
        .map(k => String(k).slice(0, 2).toUpperCase())
        .filter(cc => /^[A-Z]{2}$/.test(cc))
    )].sort();

    if (iso2.length > 0) return res.json(iso2);
  } catch (e) {
    console.warn('[GET /countries] fallback withdrawal-rules falló/timeout:', e.message || e);
  }

  // 3) Último recurso
  return res.status(502).json({ message: 'No se pudo obtener países (timeout o error aguas arriba)' });
}));


router.get('/withdrawal-rules', ah(async (req, res) => {
  const { country } = req.query;
  const data = await vitaService.getWithdrawalRules(country);
  res.json(data);
}));

router.get('/wallets', ah(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const count = Math.max(1, parseInt(req.query.count || '10', 10));
  const data = await vitaService.getWallets(page, count);
  res.json(data);
}));

router.get('/transactions', ah(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const count = Math.max(1, parseInt(req.query.count || '10', 10));
  const data = await vitaService.getTransactions(page, count);
  res.json(data);
}));

/* ===== Vita: Creación ===== */
router.post('/transactions/vita-sent', ah(async (req, res) => {
  const data = await vitaService.createVitaSent({ ...req.body });
  res.json(data);
}));

router.post('/transactions/withdrawal', ah(async (req, res) => {
  const data = await vitaService.createWithdrawal({ ...req.body });
  res.json(data);
}));

/* ========= IPN ========= */
// Webhook entrante: verifica firma y persiste evento
router.post('/ipn/vita', verifyVitaSignature, ah(async (req, res) => {
  await VitaEvent.create({
    headers: req.headers,
    payload: req.body,
    txId: req.body?.transaction_id || req.body?.id || null,
    order: req.body?.order || null,
    status: req.body?.status || null,
    receivedAt: new Date()
  });
  res.json({ ok: true });
}));

// Observabilidad: lista IPN guardados
router.get('/ipn/events', ah(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const count = Math.max(1, Math.min(100, parseInt(req.query.count || '20', 10)));
  const skip = (page - 1) * count;

  const [items, total] = await Promise.all([
    VitaEvent.find().sort({ createdAt: -1 }).skip(skip).limit(count).lean(),
    VitaEvent.countDocuments()
  ]);
  res.json({ items, total, count, page });
}));

/* ======= Meta: capacidades ======= */
router.get('/meta/capabilities', (_req, res) => {
  res.json({
    auth: {
      scheme: 'Bearer',
      login:    process.env.AUTH_LOGIN_PATH    || null,
      register: process.env.AUTH_REGISTER_PATH || null,
      me:       process.env.AUTH_ME_PATH       || null
    },
    vita: {
      prices: '/api/prices',
      countries: '/api/countries',
      withdrawal_rules: '/api/withdrawal-rules',
      wallets: '/api/wallets',
      transactions: '/api/transactions',
      ipn_notify: '/api/ipn/vita'
    },
    server: { env: process.env.NODE_ENV || 'development', ts: Date.now() }
  });
});

module.exports = router;
