#!/usr/bin/env bash
# GitHub Pages へデプロイ（data/schedule.json の案件データは消さない）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="${GITHUB_REPO:-takpz93/youtube-schedule}"
TMP="$(mktemp -d)"

echo "→ Pre-deploy validation..."
node "$ROOT/scripts/pre-deploy-check.js"

echo "→ Preserving schedule.json (newest of Gist/GitHub/Pages — never overwrite with stale)..."
node "$ROOT/scripts/preserve-schedule.js"

# 案件データはブラウザの persist() だけが Gist/GitHub を更新する。
# デプロイで setup-gist.sh を走らせると古いローカル JSON で巻き戻るため禁止。

echo "→ JSONBin (optional)..."
bash "$ROOT/scripts/setup-jsonbin.sh" || true

echo "→ Generating sync-config.js..."
node "$ROOT/scripts/generate-sync-config.js"

echo "→ Packaging..."
rsync -a --exclude '.git' --exclude '.github' "$ROOT/" "$TMP/"

cd "$TMP"
git init -b main
git add -A
git commit -m "${1:-Update youtube-schedule app}"

gh auth setup-git 2>/dev/null || true
git remote add origin "https://github.com/${REPO}.git" 2>/dev/null || \
  git remote set-url origin "https://github.com/${REPO}.git"

git push origin main --force

echo "→ Deployed: https://takpz93.github.io/youtube-schedule/"
