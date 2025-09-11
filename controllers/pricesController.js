// controllers/pricesController.js
'use strict';
const vita = require('../services/vitaService');

exports.getPrices = async (_req, res) => {
  try {
    const data = await vita.getPrices();
    console.log('✅ /api/prices ->', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (e) {
    console.error('❌ /api/prices error:', e.status, e.message, e.data);
    res.status(e.status || 500).json({ message: e.message, data: e.data || null });
  }
};

