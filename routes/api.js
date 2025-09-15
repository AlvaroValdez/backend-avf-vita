// routes/api.js
const express = require('express');
const router = express.Router();

console.log('[api-router] loaded v2025-09-15-CL3', __filename);

const vitaService = require('../services/vitaService');

/* ─────────────────────────────────────────────────────────────
   verifyVitaSignature: carga segura (Render es case-sensitive).
   Intenta varias rutas; si no existe, usa NO-OP temporal.
   ───────────────────────────────────────────────────────────── */
function safeLoadVerify() {
  const candidates = [
    '../middleware/verifyVitaSignature',      // esperado (tu resumen)
    '../middleware/verify-vita-signature',    // variante kebab
    '../middlewares/verifyVitaSignature',     // carpeta plural
    '../../middleware/verifyVitaSignature',   // por si cambia nivel
    './verifyVitaSignature'                   // misma carpeta (descartable)
  ];
  for (const p of candidates) {
    try {
      const resolved = require.resolve(p);
      console.log('[api-router] verifyVitaSignature resolved:', resolved);
      return require(p);
    } catch (_) { /* sigue probando */ }
  }
  console.warn('[api-router] WARN: verifyVitaSignature NO encontrado → usando NO-OP temporal.');
  return (req, _res, next) => next();
}
const verifyVitaSignature = safeLoadVerify();

/* ─────────────────────────────────────────────────────────────
   Modelo VitaEvent opcional (para listar IPN guardados)
   ───────────────────────────────────────────────────────────── */
let VitaEvent = null;
try { VitaEvent = require('../models/VitaEvent'); } catch (_) {}

/* Helper async */
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ========= Health ========= */
router.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* ======= Vita: Lecturas ======= */
router.get('/prices', ah(async (_req, res) => {
  const data = await vitaService.getPrices();
  res.json(data);
}));

router.get('/countries', ah(async (_req, res) => {
  const data = await vitaService.getAvailableCountries();
  res.json(data);
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
// Webhook entrante (verifica firma si el middleware existe; NO-OP si no)
router.post('/ipn/vita', verifyVitaSignature, ah(async (req, res) => {
  if (VitaEvent) {
    await VitaEvent.create({
      headers: req.headers,
      payload: req.body,
      txId: req.body?.transaction_id || req.body?.id || null,
      order: req.body?.order || null,
      status: req.body?.status || null,
      receivedAt: new Date()
    });
  }
  res.json({ ok: true });
}));

// Observabilidad: lista de IPN guardados
router.get('/ipn/events', ah(async (req, res) => {
  if (!VitaEvent) {
    return res.status(501).json({ message: 'Modelo VitaEvent no disponible.' });
  }
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