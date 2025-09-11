// backend/server.js
'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Cargamos config/env pero hacemos fallback si no define app.*
const configRaw = (() => {
  try { return require('./config/env'); } catch { return {}; }
})();

const env = process.env.NODE_ENV || configRaw?.app?.env || 'development';
const isProd = env === 'production';
//const port = Number(configRaw?.app?.port || process.env.PORT || 5000);
const port = Number(process.env.PORT || (config?.app?.port ?? 5000));
const frontendOrigin =
  configRaw?.app?.frontendOrigin ||
  process.env.FRONTEND_ORIGIN ||
  'http://localhost:5173';
const baseUrl =
  configRaw?.app?.baseUrl ||
  process.env.BASE_URL ||
  `http://localhost:${port}`;

// Exponemos un objeto config compatible con tu código previo (logs incluidos)
const config = {
  app: {
    env,
    isProd,
    port,
    baseUrl,
    frontendOrigin,
  },
  vita: {
    // Solo para imprimir estado en logs sin romper si no existe
    isConfigured: Boolean(configRaw?.vita?.login && configRaw?.vita?.apiKey && configRaw?.vita?.secret),
    login: configRaw?.vita?.login,
    apiKey: configRaw?.vita?.apiKey,
    secret: configRaw?.vita?.secret,
  },
};

const app = express();

// ===== Middlewares =====
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// CORS: lista blanca + función (admite curl/postman sin Origin)
const allowedOrigins = [frontendOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

if (!config.app.isProd) app.use(morgan('dev'));

app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.query).length) {
    console.log('   🔍 Query:', req.query);
  }
  if (Object.keys(req.body || {}).length) {
    console.log('   📝 Body:', req.body);
  }
  next();
});


// ===== Rutas =====
app.use('/api', require('./routes/api'));
app.use('/api/auth', require('./routes/auth')); // tu authControllerFinal ya implementado

// === Health checks (antes del 404) ===
app.get('/health', (_req, res) => {
  console.log('✅ /health check');
  res.status(200).json({ ok: true, ts: Date.now() });
});

app.get('/api/health', (_req, res) => {
  console.log('✅ /api/health check');
  res.status(200).json({ ok: true, ts: Date.now() });
});

// 404
app.use((req, res) => res.status(404).json({ message: 'Endpoint no encontrado' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Uncaught error:', err);
  res.status(500).json({ message: 'Error interno' });
});

// ===== Start =====
(async () => {
  try {
    await connectDB();
    //app.listen(config.app.port, () => {
    app.listen(port, () => {
      console.log(`Backend running on 0.0.0.0:${port}`);
      console.log('==================================================');
      console.log(`🚀 Servidor escuchando en ${config.app.baseUrl}`);
      console.log(`🌍 Entorno: ${config.app.env}`);
      console.log(`🔗 Frontend: ${config.app.frontendOrigin}`);
      console.log(`🔌 API: ${config.app.baseUrl}/api`);
      console.log('==================================================');
      console.log(
        '🔐 Vita configured?:',
        config.vita.isConfigured,
        '| login:', !!config.vita.login,
        '| apiKey:', !!config.vita.apiKey,
        '| secret:', !!config.vita.secret
      );
    });
  } catch (e) {
    console.error('❌ Error de arranque:', e);
    process.exit(1);
  }
})();
