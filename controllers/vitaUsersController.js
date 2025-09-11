// controllers/vitaUsersController.js
'use strict';
const vita = require('../services/vitaService');

exports.getByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    const data = await vita.getVitaUserByEmail(email);
    console.log(`✅ /api/vita-users?email=${email} ->`, JSON.stringify(data, null, 2));
    res.json(data);
  } catch (e) {
    console.error('❌ /api/vita-users error:', e.status, e.message, e.data);
    res.status(e.status || 500).json({ message: e.message, data: e.data || null });
  }
};
