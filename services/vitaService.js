// services/vitaService.js
'use strict';

const http = require('./vitaHttpClient');

// Utilidad: extraer ISO de países desde prices.withdrawal.prices.attributes.clp_sell
function extractCountriesFromPrices(prices) {
  const attrs = prices?.withdrawal?.prices?.attributes || {};
  const clpSell = attrs?.clp_sell || {}; // p.ej. { co: 4.2, bo: ... }
  return Object.keys(clpSell).map(k => String(k).toUpperCase());
}

// ====== READS ======
async function getPrices() {
  const { data } = await http.get('/prices'); // GET /api/businesses/prices
  return data;
}

async function getAvailableCountries() {
  const prices = await getPrices();
  return extractCountriesFromPrices(prices);
}

async function getWithdrawalRules(countryIso) {
  if (!countryIso) throw new Error('country ISO requerido');
  const { data } = await http.get('/withdrawal_rules', { params: { country: String(countryIso).toUpperCase() } });
  return data; // array de campos dinámicos
}

async function getWallets(page = 1, count = 20) {
  const { data } = await http.get('/wallets', { params: { page, count } }); // (deprecated pero operativo)
  return data;
}

async function getTransactions(page = 1, count = 10, filters = {}) {
  const { data } = await http.get('/transactions', { params: { page, count, ...filters } });
  return data;
}

// ====== WRITES (CREATES) ======
async function createVitaSent(payload) {
  // Doc: crear transacción "vita_sent" via /transactions con transactions_type='vita_sent'
  const body = { ...payload, transactions_type: 'vita_sent' };
  const { data } = await http.post('/transactions', body);
  return data;
}

async function createWithdrawal(payload) {
  // Doc: crear transacción "withdrawal" via /transactions con transactions_type='withdrawal'
  const body = { ...payload, transactions_type: 'withdrawal' };
  const { data } = await http.post('/transactions', body);
  return data;
}

async function getVitaUserByEmail(email) {
  if (!email) throw new Error('email requerido');
  const { data } = await http.get('/vita_users', { params: { email } });
  return data; // { exists: true, can_receive: true, ... } (estructura de Vita)
}

module.exports = {
  getPrices,
  getAvailableCountries,
  getWithdrawalRules,
  getWallets,
  getTransactions,
  createVitaSent,
  createWithdrawal,
  getVitaUserByEmail,
};
