// middleware/verifyVitaSignature.js
const crypto = require('crypto');

/**
 * Verifica la firma V2-HMAC-SHA256 de IPN Vita.
 * Algoritmo: HMAC_SHA256(secret, x_login + x_date + canonicalBody)
 *  - Header 'Authorization' debe incluir: "V2-HMAC-SHA256, Signature: <hex>"
 *  - Canonical body: JSON ordenado por claves (recursivo), sin espacios.
 *
 * Requiere en entorno:
 *  - VITA_SECRET_KEY (string)
 *  - VITA_X_LOGIN   (string)  // usado para construir el mensaje
 */
module.exports = function verifyVitaSignature(req, res, next) {
  try {
    const secret = process.env.VITA_SECRET_KEY;
    const expectedLogin = process.env.VITA_X_LOGIN;

    const xLogin = req.header('x-login') || req.header('X-Login') || '';
    const xDate  = req.header('x-date')  || req.header('X-Date')  || '';
    const auth   = req.header('authorization') || req.header('Authorization') || '';

    if (!secret || !expectedLogin) {
      console.warn('[verifyVitaSignature] Falta VITA_SECRET_KEY o VITA_X_LOGIN en entorno');
      return res.status(500).json({ message: 'Config de firma no disponible' });
    }

    // Formato esperado: "V2-HMAC-SHA256, Signature: <hex>"
    const sigHex = extractSignature(auth);
    if (!sigHex) {
      return res.status(401).json({ message: 'Authorization inválido o sin Signature' });
    }

    // El body puede venir vacío; canonicalizamos SIEMPRE un objeto
    const canonicalBody = canonicalJson(req.body || {});

    // Mensaje a firmar: x_login + x_date + canonicalBody
    const msg = `${xLogin}${xDate}${canonicalBody}`;

    // Recalcular firma
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(msg, 'utf8');
    const calc = hmac.digest('hex');

    // Comparación constante
    const ok = timingSafeEq(calc, sigHex.toLowerCase());
    if (!ok) {
      return res.status(401).json({ message: 'Firma inválida' });
    }

    // (Opcional) verifica que x-login coincida con el nuestro
    if (xLogin !== expectedLogin) {
      return res.status(401).json({ message: 'X-Login no coincide' });
    }

    next();
  } catch (err) {
    console.error('[verifyVitaSignature] error:', err);
    res.status(401).json({ message: 'Firma inválida' });
  }
};

// Extrae "<hex>" desde "V2-HMAC-SHA256, Signature: <hex>"
function extractSignature(authHeader) {
  if (!authHeader) return null;
  const i = authHeader.indexOf('Signature:');
  if (i === -1) return null;
  return authHeader.slice(i + 'Signature:'.length).trim().replace(/^,/, '').trim();
}

// Canonicaliza JSON (ordena claves, recursivo), sin espacios
function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonicalJson(v)).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  const entries = keys.map(k => `"${escapeJsonKey(k)}":${canonicalJson(value[k])}`);
  return `{${entries.join(',')}}`;
}

function escapeJsonKey(k) {
  return k.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Comparación segura de strings hex
function timingSafeEq(a, b) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}