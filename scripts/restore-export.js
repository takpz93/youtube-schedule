#!/usr/bin/env node
/**
 * エクスポート JSON を data/schedule.json に復元する。
 * 用法: node scripts/restore-export.js /path/to/youtube_schedule_YYYY-MM-DD.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'schedule.json');

function main() {
  const src = process.argv[2];
  if (!src) {
    console.error('用法: node scripts/restore-export.js <export.json>');
    process.exit(1);
  }
  const abs = path.resolve(src);
  if (!fs.existsSync(abs)) {
    console.error('ファイルが見つかりません:', abs);
    process.exit(1);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    console.error('JSON の読み込みに失敗:', e.message);
    process.exit(1);
  }

  const projects = Array.isArray(raw) ? raw : raw.projects;
  if (!Array.isArray(projects)) {
    console.error('projects 配列がありません');
    process.exit(1);
  }

  const payload = {
    _meta: raw._meta || {
      updatedAt: new Date().toISOString(),
      updatedBy: 'restore-export',
      version: 1,
    },
    options: raw.options || { channels: [], staff: [], types: [] },
    projects,
  };

  if (!payload._meta.updatedAt) {
    payload._meta.updatedAt = new Date().toISOString();
  }
  payload._meta.updatedBy = payload._meta.updatedBy || 'restore-export';

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`✓ ${projects.length} 件を ${OUT} に書き込みました`);
  console.log('  次: bash scripts/deploy.sh "schedule.json を復元"');
}

main();
