#!/usr/bin/env bash
# 公開 Gist をチーム共有の正本にする（初回作成 or 更新）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$ROOT/.gist-config.json"
SCHEDULE="$ROOT/data/schedule.json"

GIST_ID=""
if [ -f "$CFG" ]; then
  GIST_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1])).gistId||'')" "$CFG")
fi

if [ -n "$GIST_ID" ]; then
  echo "→ Gist 更新: $GIST_ID"
  gh gist edit "$GIST_ID" --filename schedule.json "$SCHEDULE"
else
  echo "→ Gist 新規作成..."
  URL=$(gh gist create "$SCHEDULE" --public -d "YouTube schedule team sync" -f "schedule.json=$SCHEDULE")
  GIST_ID=$(basename "$URL")
  node -e "require('fs').writeFileSync(process.argv[1], JSON.stringify({gistId:process.argv[2]},null,2)+'\n')" "$CFG" "$GIST_ID"
  echo "✓ 作成: $URL"
fi

echo "  gistId: $GIST_ID"
