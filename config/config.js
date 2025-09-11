// backend/config/config.js
const path = require('path');
const fs = require('fs');
const dotenvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
}

function pickEnv(keys, fallback) {
  for (const k of keys) {
    if (process.env[k] && String(process.env[k]).trim() !== '') return process.env[k];
  }
  return fallback;
}

function mask(val, start = 4, end = 4) {
  if (!val) return '(unset)';
  const s = String(val);
  if (s.length <= start + end) return s[0] + '***' + s.slice(-1);
  return s.slice(0, start) + '***' + s.slice(-end);
}

const config = {
  app: {
    port: Number(pickEnv(['PORT'], 5000)),
    env: pickEnv(['NODE_ENV'], 'development'),
    baseUrl: pickEnv(['BASE_URL'], 'http://localhost:5000'),
    jwtSecret: pickEnv(['JWT_SECRET'], null),
  },
  vita: {
    baseUrl: pickEnv(['VITA_BASE_URL', 'VITA_API_BASE_URL'], 'https://api.stage.vitawallet.io/api/businesses'),
    login: pickEnv(['VITA_LOGIN', 'VITA_X_LOGIN'], ''),
    apiKey: pickEnv(['VITA_API_KEY', 'VITA_X_API_KEY', 'VITA_X_TRANS_KEY'], ''),
    secret: pickEnv(['VITA_SECRET', 'VITA_SECRET_KEY'], ''),
    timeoutMs: Number(pickEnv(['VITA_TIMEOUT_MS'], 15000)),
    // modo de canonización del body para firma (puedes cambiarlo si Vita lo exige)
    signMode: pickEnv(['VITA_SIGN_MODE'], 'concat'), // concat | kv | json | flat
  }
};

// Validaciones duras (fail-fast solo en prod; en dev avisamos)
function validate() {
  const missing = [];
  if (!config.vita.login) missing.push('VITA_LOGIN (o VITA_X_LOGIN)');
  if (!config.vita.apiKey) missing.push('VITA_API_KEY (o VITA_X_API_KEY / VITA_X_TRANS_KEY)');
  if (!config.vita.secret) missing.push('VITA_SECRET (o VITA_SECRET_KEY)');
  if (config.app.env === 'production' && missing.length) {
    throw new Error('Faltan variables requeridas: ' + missing.join(', '));
  }
  if (missing.length) {
    console.warn('⚠️  Variables Vita faltantes (modo dev):', missing.join(', '));
  }
}

function printStartupConfig() {
  /* Solo logs no sensibles en claro */
  console.log('🔧 Configuración backend');
  console.log('   APP  -> port:', config.app.port, 'env:', config.app.env, 'baseUrl:', config.app.baseUrl);
  console.log('   VITA -> baseUrl:', config.vita.baseUrl);
  console.log('           login  :', mask(config.vita.login));
  console.log('           apiKey :', mask(config.vita.apiKey));
  console.log('           secret :', config.vita.secret ? `${config.vita.secret.length} chars` : '(unset)');
  console.log('           timeout:', config.vita.timeoutMs, 'ms   signMode:', config.vita.signMode);
}

validate();

module.exports = Object.freeze({
  ...config,
  printStartupConfig,
});
