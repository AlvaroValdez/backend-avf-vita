// controllers/metaController.js
/**
 * Meta: expone capacidades y rutas que el frontend debe usar.
 * NO modifica lógica de negocio. Solo lectura.
 *
 * Si tu backend ya tiene rutas de Auth, puedes declararlas vía env:
 *  - AUTH_LOGIN_PATH=/api/auth/login
 *  - AUTH_REGISTER_PATH=/api/auth/register
 *  - AUTH_ME_PATH=/api/auth/me
 *
 * Si no defines estas vars, las propiedades quedarán en null (el FE sabrá pedirte que las completes).
 */
exports.getCapabilities = (req, res) => {
  const caps = {
    auth: {
      scheme: 'Bearer',
      login: process.env.AUTH_LOGIN_PATH || null,
      register: process.env.AUTH_REGISTER_PATH || null,
      me: process.env.AUTH_ME_PATH || null
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
