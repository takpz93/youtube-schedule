#!/usr/bin/env bash
# 公開 JSONBin を作成（初回1回 · Mac のみ · ブラウザ設定不要）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$ROOT/.jsonbin-config.json"
SCHEDULE="$ROOT/data/schedule.json"

if [ -f "$CFG" ]; then
  echo "JSONBin 設定済み: $(node -e "console.log(JSON.parse(require('fs').readFileSync('$CFG')).binId)")"
  exit 0
fi

KEY="${JSONBIN_MASTER_KEY:-}"
if [ -z "$KEY" ]; then
  exit 0
fi

echo "→ 公開 JSONBin 作成..."
RESP=$(curl -sS -X POST "https://api.jsonbin.io/v3/b" \
  -H "X-Master-Key: $KEY" \
  -H "X-Bin-Private: false" \
  -H "Content-Type: application/json" \
  -d @"$SCHEDULE")

BIN_ID=$(node -e "const r=JSON.parse(process.argv[1]); console.log(r.metadata?.id||'');" "$RESP")
if [ -z "$BIN_ID" ]; then
  echo "JSONBin 作成失敗: $RESP" >&2
  exit 1
fi

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({ binId: process.argv[2], public: true }, null, 2) + '\n');
" "$CFG" "$BIN_ID"

echo "✓ 公開 JSONBin: $BIN_ID"
