const express = require('express');
const router = express.Router();

const prices = require('../controllers/pricesController');
const countries = require('../controllers/countriesController');
const rules = require('../controllers/rulesController');
const wallets = require('../controllers/walletsController');
const tx = require('../controllers/transactionsController');
const vitaUsers = require('../controllers/vitaUsersController');
const ipnController = require('../controllers/ipnController');
const metaController = require('../controllers/metaController');
const verifyVitaSignature = require('../middleware/verifyVitaSignature'); 

router.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
router.get('/prices', prices.getPrices);
router.get('/countries', countries.getCountries);
router.get('/withdrawal-rules', rules.getWithdrawalRules);
router.get('/wallets', wallets.listWallets);
router.get('/transactions', tx.listTransactions);
router.get('/ipn/events', ipnController.listEvents);
router.post('/ipn/vita', verifyVitaSignature, ipnController.handleVitaIPN);
router.get('/meta/capabilities', metaController.getCapabilities);

// NUEVAS (creación real en Vita):
router.post('/transactions/vita-sent', tx.createVitaSent);
router.post('/transactions/withdrawal', tx.createWithdrawal);
router.get('/vita-users', vitaUsers.getByEmail);
router.post('/ipn/vita', verifyVitaSignature, ipnController.handleVitaIPN);
router.get('/meta/capabilities', metaController.getCapabilities);

module.exports = router