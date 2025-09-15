const express = require('express');
const router = express.Router();

const prices = require('../controllers/pricesController');
const countries = require('../controllers/countriesController');
const rules = require('../controllers/rulesController');
const wallets = require('../controllers/walletsController');
const tx = require('../controllers/transactionsController');
const vitaUsers = require('../controllers/vitaUsersController');
const metaController = require('../controllers/metaController');
const verifyVitaSignature = require('../middleware/verifyVitaSignature');
const VitaEvent = require('../models/VitaEvent');
const ipnController = require('../controllers/ipnController');

router.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
router.get('/prices', prices.getPrices);
router.get('/countries', countries.getCountries);
router.get('/withdrawal-rules', rules.getWithdrawalRules);
router.get('/wallets', wallets.listWallets);
router.get('/transactions', tx.listTransactions);
router.post('/ipn/vita', verifyVitaSignature, ipnController.handleVitaIPN);
router.get('/meta/capabilities', metaController.getCapabilities);

router.get('/ipn/events', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const count = Math.max(1, Math.min(100, parseInt(req.query.count || '20', 10)));
        const skip = (page - 1) * count;
        const [items, total] = await Promise.all([
            VitaEvent.find().sort({ createdAt: -1 }).skip(skip).limit(count).lean(),
            VitaEvent.countDocuments()
        ]);
        res.json({ items, total, count, page });
    } catch (e) {
        next(e);
    }
});

let ipnController;
try {
  ipnController = require('../controllers/ipnController'); // ojo con mayúsculas/minúsculas en Render (Linux)
} catch (_) {}

const verifyVitaSignature = require('../middleware/verifyVitaSignature');

if (ipnController && typeof ipnController.handleVitaIPN === 'function') {
  router.post('/ipn/vita', verifyVitaSignature, ipnController.handleVitaIPN);
}

// NUEVAS (creación real en Vita):
router.post('/transactions/vita-sent', tx.createVitaSent);
router.post('/transactions/withdrawal', tx.createWithdrawal);
router.get('/vita-users', vitaUsers.getByEmail);
router.get('/meta/capabilities', metaController.getCapabilities);
router.post('/ipn/vita', verifyVitaSignature, ipnController.handleVitaIPN);

module.exports = router