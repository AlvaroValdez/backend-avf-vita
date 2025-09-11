// backend/controllers/countriesController.js
const vita = require('../services/vitaService');

exports.getCountries = async (_req, res) => {
  try {
    const data = await vita.getAvailableCountries();
    console.log('✅ /api/countries ->', data);
    res.json(data);
  } catch (e) {
    console.error('❌ /api/countries error:', e.status, e.message, e.data);
    res.status(e.status || 500).json({ message: e.message, data: e.data || null });
  }
};
