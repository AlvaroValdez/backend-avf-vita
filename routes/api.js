const express = require('express');
const router = express.Router();
const prices = require('../controllers/pricesController');
const countries = require('../controllers/countriesController');
const rules = require('../controllers/rulesController');
const wallets = require('../controllers/walletsController');
const tx = require('../controllers/transactionsController');
const vitaUsers = require('../controllers/vitaUsersController');
const metaController = require('../controllers/metaController');


router.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
router.get('/prices', prices.getPrices);
router.get('/countries', countries.getCountries);
router.get('/withdrawal-rules', rules.getWithdrawalRules);
router.get('/wallets', wallets.listWallets);
router.get('/transactions', tx.listTransactions);
router.get('/ipn/events', ipnController.listEvents);

// NUEVAS (creación real en Vita):
router.post('/transactions/vita-sent', tx.createVitaSent);
router.post('/transactions/withdrawal', tx.createWithdrawal);
router.get('/vita-users', vitaUsers.getByEmail);
router.get('/meta/capabilities', metaController.getCapabilities);

module.exports = router