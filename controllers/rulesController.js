// backend/controllers/rulesController.js
const vita = require('../services/vitaService');

exports.getWithdrawalRules = async (req, res) => {
  try {
    const country = req.query.country;
    const data = await vita.getWithdrawalRules(country);
    console.log(`✅ /api/withdrawal-rules?country=${country} ->`, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (e) {
    console.error('❌ /api/withdrawal-rules error:', e.status, e.message, e.data);
    res.status(e.status || 500).json({ message: e.message, data: e.data || null });
  }
};
