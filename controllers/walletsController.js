const vita = require('../services/vitaService');

exports.listWallets = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const count = req.query.count || 10;
    const data = await vita.getWallets(page, count);
    console.log(`✅ /api/wallets?page=${page}&count=${count} ->`, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (e) {
    console.error('❌ /api/wallets error:', e.status, e.message, e.data);
    res.status(e.status || 500).json({ message: e.message, data: e.data || null });
  }
};
