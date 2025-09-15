// src/services/api.js
import axios from 'axios';

/** Base URL del backend (sin / al final) */
const RAW_BASE = import.meta.env.VITE_API_BASE || '';
const BASE_URL = RAW_BASE.replace(/\/$/, '');

/** Logging opcional en dev: VITE_LOG_HTTP=1 */
const SHOULD_LOG = !!(import.meta.env.DEV && import.meta.env.VITE_LOG_HTTP === '1');

/** Axios instance para TODO el FE */
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  // withCredentials: false  // Dev: JWT por header, no cookies
});

/** Interceptor: Authorization Bearer (si hay JWT en sessionStorage) */
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (SHOULD_LOG) {
    // Log mínimo (no imprime bodies sensibles)
    // eslint-disable-next-line no-console
    console.debug('➡️ [HTTP]', config.method?.toUpperCase(), config.url, { params: config.params });
  }
  return config;
});

/** Interceptor de respuesta: normaliza errores y loggea en dev */
api.interceptors.response.use(
  (res) => {
    if (SHOULD_LOG) {
      // eslint-disable-next-line no-console
      console.debug('⬅️ [HTTP]', res.config.method?.toUpperCase(), res.config.url, res.status);
    }
    return res;
  },
  (err) => {
    const norm = normalizeError(err);
    if (SHOULD_LOG) {
      // eslint-disable-next-line no-console
      console.warn('💥 [HTTP ERR]', norm);
    }
    return Promise.reject(norm);
  }
);

/** Normaliza errores de Axios en un shape estable */
function normalizeError(err) {
  const status = err?.response?.status ?? 0;
  const data = err?.response?.data;
  const code = data?.code || data?.error || err?.code || 'ERR_HTTP';
  const message =
    data?.message || data?.error_description || err?.message || 'Error de red';
  return { status, code, message, details: data ?? null };
}

/* ===========================
   Endpoints alineados al BE
   =========================== */

/** Health: GET /health */
export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}

/** Countries: GET /countries -> string[]; normalizamos a {code,name}[] */
export async function getCountries() {
  const { data } = await api.get('/countries');
  if (Array.isArray(data)) return data.map(code => ({ code, name: code }));
  if (Array.isArray(data?.items)) return data.items.map(code => ({ code, name: code }));
  if (Array.isArray(data?.countries)) return data.countries.map(code => ({ code, name: code }));
  return [];
}

/** Withdrawal rules (raw): GET /withdrawal-rules?country=XX -> { rules: { ... } } */
export async function getWithdrawalRulesRaw(country) {
  const { data } = await api.get('/withdrawal-rules', { params: { country } });
  return data; // el componente se encarga de filtrar por país (cl, clusd, etc.)
}

/** Wallets: GET /wallets?page&count -> { wallets,total,count } */
export async function getWallets({ page = 1, count = 10 } = {}) {
  const { data } = await api.get('/wallets', { params: { page, count } });
  return data;
}

/** Transactions: GET /transactions?… -> { transactions,total,count } */
export async function getTransactions(params = {}) {
  const {
    page = 1, count = 10,
    status, transactions_type, currency, sender_wallet, recipient_wallet
  } = params;

  const { data } = await api.get('/transactions', {
    params: {
      page, count, status, transactions_type, currency, sender_wallet, recipient_wallet
    }
  });
  return data; // { transactions, total, count }
}

/** Create Withdrawal: POST /transactions/withdrawal (body ya validado en FE) */
export async function postWithdrawalTransaction(body) {
  // Garantiza url_notify correcta apuntando a tu BE (…/api/ipn/vita)
  const notifyBase = BASE_URL.replace(/\/api\/?$/, '');
  const finalBody = { url_notify: `${notifyBase}/api/ipn/vita`, ...body };
  const { data } = await api.post('/transactions/withdrawal', finalBody);
  return data;
}

/** Create Vita Sent: POST /transactions/vita-sent */
export async function postVitaSent(body) {
  const notifyBase = BASE_URL.replace(/\/api\/?$/, '');
  const finalBody = { url_notify: `${notifyBase}/api/ipn/vita`, ...body };
  const { data } = await api.post('/transactions/vita-sent', finalBody);
  return data;
}

/** Prices: GET /prices (para awareness/quote) */
export async function getPrices() {
  const { data } = await api.get('/prices');
  return data;
}

/* ===========================
   Utilidades opcionales
   =========================== */

/**
 * Ejecuta una petición con cancelación manual.
 * @param {(signal:AbortSignal)=>Promise<any>} fn
 * @returns {{promise: Promise<any>, cancel: ()=>void}}
 */
export function withCancel(fn) {
  const controller = new AbortController();
  const promise = fn(controller.signal);
  return { promise, cancel: () => controller.abort() };
}
