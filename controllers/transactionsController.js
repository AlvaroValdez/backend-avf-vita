// controllers/transactionsController.js
'use strict';
const vita = require('../services/vitaService');

exports.listTransactions = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const count = Number(req.query.count || 10);
    const data = await vita.getTransactions(page, count);
    console.log(`✅ /api/transactions?page=${page}&count=${count} ->`, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (e) {
    console.error('❌ /api/transactions error:', e.status, e.message, e.data);
    res.status(e.status || 500).json({ message: e.message, data: e.data || null });
  }
};

exports.createVitaSent = async (req, res) => {
  try {
    const data = await vita.createVitaSent(req.body);
    console.log('✅ /api/transactions/vita-sent ->', JSON.stringify(data, null, 2));
    res.status(201).json(data);
  } catch (e) {
    console.error('❌ /api/transactions/vita-sent error:', e.status, e.message, e.data);
    res.status(e.status || 500).json({ message: e.message, data: e.data || null });
  }
};

exports.createWithdrawal = async (req, res) => {
  try {
    const data = await vita.createWithdrawal(req.body);
    console.log('✅ /api/transactions/withdrawal ->', JSON.stringify(data, null, 2));
    res.status(201).json(data);
  } catch (e) {
    console.error('❌ /api/transactions/withdrawal error:', e.status, e.message, e.data);
    res.status(e.status || 500).json({ message: e.message, data: e.data || null });
  }
};
