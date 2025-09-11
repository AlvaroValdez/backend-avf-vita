// backend/utils/signatureV2.js
const crypto = require('crypto');

function canonical({ method, path, query='', body='', xDate, xLogin, xApiKey }) {
  const m = (method || 'GET').toUpperCase();
  const p = path.startsWith('/') ? path : `/${path}`;
  const q = query.trim();
  const b = body ? JSON.stringify(body) : '';
  return [
    `method:${m}`,
    `path:${p}`,
    `query:${q}`,
    `body:${b}`,
    `x-date:${xDate}`,
    `x-login:${xLogin}`,
    `x-api-key:${xApiKey}`,
  ].join('\n');
}

function signV2({ method, path, query, body, xDate, xLogin, xApiKey, secret }) {
  const base = canonical({ method, path, query, body, xDate, xLogin, xApiKey });
  return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex');
}

module.exports = { signV2 };
