#!/usr/bin/env bash
# tests.sh — smoke tests con logs amigables (sin dependencia obligatoria de jq)

BASE_URL="${BASE_URL:-http://localhost:5000}"
# Puedes exportar WALLET_UUID para sobreescribir. Por defecto, uso el de KEYS.txt:
WALLET_UUID="${WALLET_UUID:-97f3c111-e1b6-46a0-a3e1-c56f94ffbca1}"

divider() { echo "=================================================="; }
section() { divider; echo "▶️  $1"; divider; }

detect_pretty() {
  if command -v jq >/dev/null 2>&1; then echo "jq"; return
  elif command -v python >/dev/null 2>&1; then echo "python"
  elif command -v python3 >/dev/null 2>&1; then echo "python3"
  elif command -v node >/dev/null 2>&1; then echo "node"
  else echo "cat"
  fi
}

PRETTY_TOOL="$(detect_pretty)"
echo "🧰 Pretty printer: ${PRETTY_TOOL}"

pp_json() {
  local file="$1"
  case "$PRETTY_TOOL" in
    jq) jq . "$file" 2>/dev/null || cat "$file" ;;
    python) python -m json.tool "$file" 2>/dev/null || cat "$file" ;;
    python3) python3 -m json.tool "$file" 2>/dev/null || cat "$file" ;;
    node) node -e "const fs=require('fs');try{const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));console.log(JSON.stringify(j,null,2))}catch(e){process.stdout.write(fs.readFileSync(process.argv[1],'utf8'))}" "$file" ;;
    *) cat "$file" ;;
  esac
}

call() {
  local method="$1"; shift
  local path="$1"; shift
  local data="${1:-}"

  local url="${BASE_URL}${path}"
  local tmp="$(mktemp)"
  local metrics

  if [ "$method" = "GET" ]; then
    metrics="$(curl -sS -o "$tmp" -w '%{http_code} %{time_total} %{size_download}' "$url")"
  else
    metrics="$(curl -sS -o "$tmp" -H 'Content-Type: application/json' -X "$method" -d "$data" \
      -w '%{http_code} %{time_total} %{size_download}' "$url")"
  fi

  read -r code total size <<< "$metrics"

  echo "➡️  $method $path"
  echo "   🌐 $url"
  echo "   📦 HTTP $code | ⏱ ${total}s | 📥 ${size}B"
  if [[ -s "$tmp" ]]; then pp_json "$tmp"; else echo "(sin cuerpo)"; fi
  if [[ "$code" =~ ^2 ]]; then echo "   ✅ OK"; else echo "   ❌ Error"; fi
  rm -f "$tmp"
  echo
}

# ========== TESTS ==========

section "1) Health Checks"
call GET "/health"
call GET "/api/health"

section "2) Prices (Stage Vita)"
call GET "/api/prices"

section "3) Countries (derivado de prices)"
call GET "/api/countries"

section "4) Withdrawal Rules (CO)"
call GET "/api/withdrawal-rules?country=CO"

section "5) Wallets"
call GET "/api/wallets?page=1&count=5"

section "6) Transactions"
call GET "/api/transactions?page=1&count=5"

section "7) Crear Vita Sent"
call POST "/api/transactions/vita-sent" '{
  "email": "usuario+test@vitawallet.io",
  "currency": "clp",
  "order": "ORD-0001",
  "amount": 1000,
  "wallet": "'"$WALLET_UUID"'"
}'

section "8) Crear Withdrawal (BO - ejemplo)"
call POST "/api/transactions/withdrawal" '{
  "url_notify": "https://mi-negocio.test/ipn",
  "beneficiary_first_name": "Gabriela",
  "beneficiary_last_name": "Pazmiño",
  "beneficiary_email": "gabriela@example.com",
  "beneficiary_address": "Mi dirección 123",
  "beneficiary_document_type": "CI",
  "beneficiary_document_number": "132425273",
  "account_type_bank": "Cuenta de ahorros",
  "account_bank": "14125621670",
  "bank_code": 755,
  "purpose": "ISSAVG",
  "purpose_comentary": "COMPLETED",
  "country": "BO",
  "currency": "clp",
  "amount": 1000,
  "order": "ORD-0002",
  "wallet": "'"$WALLET_UUID"'"
}'

divider
echo "✅ Pruebas finalizadas"
divider
