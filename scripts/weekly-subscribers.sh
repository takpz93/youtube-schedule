#!/usr/bin/env bash
# 毎週月曜 6:00 JST — 登録者数取得 → デプロイ
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node scripts/fetch-subscribers.js
bash scripts/deploy.sh "subs: weekly snapshot $(TZ=Asia/Tokyo date +%Y-%m-%d)"
