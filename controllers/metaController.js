// controllers/metaController.js
exports.getCapabilities = (req, res) => {
  const caps = {
    auth: {
      scheme: 'Bearer',
      login:    process.env.AUTH_LOGIN_PATH    || null,
      register: process.env.AUTH_REGISTER_PATH || null,
      me:       process.env.AUTH_ME_PATH       || null
    },
    vita: {
      prices: '/api/prices',
      countries: '/api/countries',
      withdrawal_rules: '/api/withdrawal-rules',
      wallets: '/api/wallets',
      transactions: '/api/transactions',
      ipn_notify: '/api/ipn/vita'
    },
    server: {
      env: process.env.NODE_ENV || 'development',
      ts: Date.now()
    }
  };
  res.json(caps);
};