#!/usr/bin/env node
/**
 * scripts/testHmacV2.js
 *
 * Test de firma HMAC V2 para VitaWallet Business API con logs detallados.
 *
 * Uso:
 *   node scripts/testHmacV2.js --method GET --path /prices --dry
 *   node scripts/testHmacV2.js --method POST --path /withdrawals --body '{"amount":1000,"currency":"CLP"}'
 *
 * Env requeridas:
 *   VITA_BASE_URL   (ej: https://api.stage.vitawallet.io/api/businesses)
 *   VITA_X_LOGIN    (login/hash de la cuenta)
 *   VITA_X_API_KEY  (x-trans-key / api key del business)
 *   VITA_SECRET_KEY (clave secreta HMAC)
 *
 * Flags (opcionales):
 *   --method   GET|POST|PUT|PATCH|DELETE      (default GET)
 *   --path     ruta relativa (ej: /prices)    (default /prices)
 *   --body     JSON como string               (solo para métodos con cuerpo)
 *   --mode     concat|kv|json|flat            (default concat)
 *             concat:   key1val1key2val2...
 *             kv:       key1=val1&key2=val2
 *             json:     JSON.stringify ordenado
 *             flat:     aplanado profundo con dot.notation + concat
 *   --dry      (no llama a la API; solo loggea headers y firma)
 *   --timeout  ms (default 15000)
 */

const axios = require('axios');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

// ============== CLI parsing mínimo ==============
const args = process.argv.slice(2);
function getFlag(name, def = undefined) {
  const idx = args.findIndex(a => a === `--${name}`);
  if (idx >= 0) {
    const val = args[idx + 1];
    if (!val || val.startsWith('--')) return true; // flag booleano
    return val;
  }
  return def;
}

const METHOD  = String(getFlag('method', 'GET')).toUpperCase();
const PATH    = getFlag('path', '/prices');
const BODYSTR = getFlag('body', null);
const MODE    = String(getFlag('mode', 'concat')).toLowerCase();
const DRY     = !!getFlag('dry', false);
const TIMEOUT = Number(getFlag('timeout', 15000));

// ============== ENV requeridas ==============
const BASE_URL = process.env.VITA_BASE_URL || 'https://api.stage.vitawallet.io/api/businesses';
const X_LOGIN  = process.env.VITA_X_LOGIN || '';
const X_APIKEY = process.env.VITA_X_API_KEY || '';
const SECRET   = process.env.VITA_SECRET_KEY || '';

if (!X_LOGIN || !X_APIKEY || !SECRET) {
  console.warn('⚠️  Faltan variables de entorno: VITA_X_LOGIN / VITA_X_API_KEY / VITA_SECRET_KEY');
  console.warn('    El script generará la firma igual, pero la llamada real fallará en Vita.');
}

// ============== Utils de canonización ==============

/** Ordena keys de un objeto de forma estable */
function sortKeys(o) {
  return Object.keys(o).sort().reduce((acc, k) => {
    acc[k] = o[k];
    return acc;
  }, {});
}

/** Aplana un objeto (anidado) a "a.b.c": valor (para modo flat) */
function flattenDeep(obj, prefix = '', out = {}) {
  Object.keys(obj || {}).forEach(key => {
    const val = obj[key];
    const pfx = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      flattenDeep(val, pfx, out);
    } else {
      out[pfx] = val;
    }
  });
  return out;
}

/** Crea el "sorted_request_body" según el modo elegido */
function canonicalize(body, mode = 'concat') {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '';

  const sorted = sortKeys(body);

  if (mode === 'kv') {
    // key1=val1&key2=val2...
    return Object.keys(sorted).map(k => `${k}=${sorted[k]}`).join('&');
  }

  if (mode === 'json') {
    // JSON.stringify con keys ordenadas
    return JSON.stringify(sorted);
  }

  if (mode === 'flat') {
    // aplanado profundo con dot.notation, luego concat key+val
    const flat = sortKeys(flattenDeep(body));
    return Object.keys(flat).map(k => `${k}${flat[k]}`).join('');
  }

  // default: concat key+val (shallow)
  return Object.keys(sorted).map(k => `${k}${sorted[k]}`).join('');
}

/** Crea la firma V2-HMAC-SHA256 en hex */
function buildSignature(xLogin, xDate, bodyObj, mode) {
  const base = `${xLogin}${xDate}`;
  const tail = (bodyObj && Object.keys(bodyObj).length && METHOD !== 'GET')
    ? canonicalize(bodyObj, mode)
    : '';

  const toSign = base + tail;
  const h = crypto.createHmac('sha256', SECRET).update(toSign).digest('hex');

  return { toSign, hmac: h, tail };
}

// ============== Preparación de request ==============
let bodyObj = null;
if (BODYSTR && METHOD !== 'GET') {
  try {
    bodyObj = JSON.parse(BODYSTR);
  } catch (e) {
    console.error('❌ BODY inválido. Debe ser JSON string. Ej: \'{"amount":1000,"currency":"CLP"}\'');
    process.exit(1);
  }
}

const xDate = new Date().toISOString();
const { toSign, hmac, tail } = buildSignature(X_LOGIN, xDate, bodyObj, MODE);

const headers = {
  'Content-Type': 'application/json',
  'x-date': xDate,
  'x-login': X_LOGIN,
  'x-api-key': X_APIKEY,
  'Authorization': `V2-HMAC-SHA256, Signature:${hmac}`
};

// ============== LOGS CLAROS ==============
console.log('======================================');
console.log('🔐 Test Firma HMAC V2 — VitaWallet');
console.log('======================================\n');
console.log('🌍 Base URL      :', BASE_URL);
console.log('➡️  Método        :', METHOD);
console.log('🛣️  Path          :', PATH);
console.log('🧰 Modo canon.   :', MODE);
console.log('⏱️  Timeout (ms)  :', TIMEOUT);
console.log('');
console.log('🧩 x-login       :', X_LOGIN || '(no set)');
console.log('🔑 x-api-key     :', X_APIKEY ? '(set)' : '(no set)');
console.log('🗓️  x-date        :', xDate);
console.log('');
console.log('📝 Body (obj)    :', bodyObj || '(none)');
if (tail) {
  console.log('🧱 Cuerpo canonicalizado:');
  console.log(tail);
} else {
  console.log('🧱 Cuerpo canonicalizado: (vacío; GET o sin body)');
}
console.log('');
console.log('🧮 Cadena a firmar (x_login + x_date + tail):');
console.log(toSign);
console.log('');
console.log('🔑 Firma (hex)   :', hmac);
console.log('');
console.log('📦 Headers a enviar:');
console.log(JSON.stringify(headers, null, 2));
console.log('');

// cURL equivalente para inspección
const curlBody = bodyObj ? ` --data '${JSON.stringify(bodyObj)}'` : '';
const curlCmd = [
  'curl',
  '-X', METHOD,
  `'${BASE_URL}${PATH}'`,
  '-H', `'Content-Type: application/json'`,
  '-H', `'x-date: ${xDate}'`,
  '-H', `'x-login: ${X_LOGIN}'`,
  '-H', `'x-api-key: ${X_APIKEY}'`,
  '-H', `'Authorization: V2-HMAC-SHA256, Signature:${hmac}'`,
  curlBody
].join(' ');
console.log('🐚 cURL equivalente:\n', curlCmd, '\n');

// ============== DRY RUN ==============
if (DRY) {
  console.log('✅ DRY-RUN: No se llamó a la API. Revisa cadena y firma arriba.');
  process.exit(0);
}

// ============== Llamada real ==============
const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
});

(async () => {
  try {
    const config = {
      method: METHOD.toLowerCase(),
      url: PATH,
      headers
    };
    if (METHOD !== 'GET' && bodyObj) {
      config.data = bodyObj;
    }

    console.log('🌐 Enviando request real...');
    const { status, data } = await client.request(config);
    console.log('✅ Respuesta OK');
    console.log('HTTP', status);
    console.log('Body:\n', JSON.stringify(data, null, 2));
  } catch (err) {
    const status = err?.response?.status;
    const data   = err?.response?.data;
    console.error('❌ Error HTTP', status || err.code || err.message);
    if (data) {
      console.error('Respuesta del servidor:\n', JSON.stringify(data, null, 2));
    } else {
      console.error('Detalle:\n', err.stack || err.message);
    }
    process.exit(1);
  }
})();
