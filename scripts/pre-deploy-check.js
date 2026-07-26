#!/usr/bin/env node
/**
 * デプロイ前の必須チェック。1件でも失敗したら exit 1（本番白画面を防ぐ）。
 *
 * 用法: node scripts/pre-deploy-check.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

// ── 1. JavaScript 構文チェック ─────────────────────────────────────────────
function checkJsSyntax() {
  const targets = ['app.js'];
  if (exists('sync-config.js')) targets.push('sync-config.js');
  fs.readdirSync(path.join(ROOT, 'scripts'))
    .filter(f => f.endsWith('.js'))
    .forEach(f => targets.push(`scripts/${f}`));

  for (const rel of targets) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    try {
      execSync(`node --check "${full}"`, { stdio: 'pipe' });
    } catch (e) {
      const stderr = e.stderr?.toString() || e.message;
      fail(`構文エラー: ${rel}\n${stderr.trim()}`);
    }
  }
}

// ── 2. app.js 構造チェック ───────────────────────────────────────────────────
function checkAppStructure() {
  const src = read('app.js');

  if (!/function\s+bootstrap\s*\(/.test(src)) {
    fail('app.js: bootstrap() 関数が見つかりません');
  }
  if (!/\nbootstrap\s*\(\s*\)/.test(src)) {
    fail('app.js: bootstrap() の呼び出しが見つかりません');
  }

  const fnNames = [];
  const fnRe = /^function\s+(\w+)\s*\(/gm;
  let m;
  while ((m = fnRe.exec(src))) {
    if (fnNames.includes(m[1])) {
      fail(`app.js: 関数 "${m[1]}" が重複定義されています（過去の白画面原因）`);
    }
    fnNames.push(m[1]);
  }

  const appVersion = src.match(/const APP_VERSION = '([^']+)'/);
  if (!appVersion) {
    fail('app.js: APP_VERSION が定義されていません');
  } else {
    const ver = appVersion[1];
    const html = read('index.html');
    if (!html.includes(`app.js?v=${ver}`)) {
      fail(`index.html の app.js バージョンが APP_VERSION (${ver}) と一致しません`);
    }
    if (!html.includes(`styles.css?v=${ver}`)) {
      warn(`index.html の styles.css バージョンが APP_VERSION (${ver}) と一致しません`);
    }
  }
}

// ── 3. schedule.json 整合性 ────────────────────────────────────────────────
function checkScheduleData() {
  const schedulePath = path.join(ROOT, 'data', 'schedule.json');
  if (!fs.existsSync(schedulePath)) {
    fail('data/schedule.json が存在しません');
    return;
  }
  let json;
  try {
    json = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
  } catch (e) {
    fail(`data/schedule.json が JSON として不正: ${e.message}`);
    return;
  }
  const projects = Array.isArray(json.projects) ? json.projects : (Array.isArray(json) ? json : null);
  if (!projects) {
    fail('data/schedule.json: projects 配列がありません');
    return;
  }
  const min = Number(process.env.MIN_SCHEDULE_PROJECTS || '1');
  if (projects.length < min) {
    fail(`data/schedule.json: 案件数 ${projects.length} 件（最低 ${min} 件必要）`);
  }
  const sample = projects[0];
  if (sample && !sample.id && !sample.title) {
    warn('data/schedule.json: 先頭案件の形式が想定と異なる可能性があります');
  }
}

// ── 4. index.html 必須要素 ───────────────────────────────────────────────────
function checkIndexHtml() {
  const html = read('index.html');
  for (const id of ['main', 'today-label', 'sync-status']) {
    if (!html.includes(`id="${id}"`)) {
      fail(`index.html: #${id} がありません`);
    }
  }
  if (!html.includes('sync-config.js')) {
    warn('index.html: sync-config.js が読み込まれていません（同期機能が無効になる可能性）');
  }
  if (!html.includes('fatal-error')) {
    fail('index.html: #fatal-error（起動失敗表示）がありません');
  }
  if (!read('app.js').includes('__YT_BOOT_OK__')) {
    fail('app.js: 起動完了マーカー __YT_BOOT_OK__ がありません');
  }
}

function checkStyles() {
  const css = read('styles.css');
  if (!css.includes('.fatal-error[hidden]')) {
    fail('styles.css: .fatal-error[hidden] が未定義（エラー画面が常時表示になる）');
  }
  if (/\.fatal-error\s*\{[^}]*display:\s*flex/.test(css) && !css.includes('.fatal-error:not([hidden])')) {
    fail('styles.css: .fatal-error の display:flex が [hidden] を上書きする可能性');
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
console.log('→ Pre-deploy checks...');
checkJsSyntax();
checkAppStructure();
checkScheduleData();
checkIndexHtml();
checkStyles();

if (warnings.length) {
  console.warn('\n⚠ Warnings:');
  warnings.forEach(w => console.warn(`  - ${w}`));
}

if (errors.length) {
  console.error('\n✗ Pre-deploy check FAILED:');
  errors.forEach(e => console.error(`  - ${e.replace(/\n/g, '\n    ')}`));
  console.error('\nデプロイを中止しました。上記を修正してから再実行してください。');
  process.exit(1);
}

console.log('✓ All pre-deploy checks passed');
