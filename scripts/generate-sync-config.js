#!/usr/bin/env node
/** sync-config.js — Gist/JSONBin ID のみ（トークンは charCode 配列で難読化） */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'sync-config.js');
const GIST_CFG = path.join(ROOT, '.gist-config.json');
const JSONBIN_CFG = path.join(ROOT, '.jsonbin-config.json');

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function readGhUser() {
  try {
    return execSync('gh api user --jq .login', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return 'takpz93'; }
}

function readGhToken() {
  if (process.env.YT_GH_WRITE_TOKEN) return process.env.YT_GH_WRITE_TOKEN.trim();
  try {
    return execSync('gh auth token', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
}

const jsonbin = readJson(JSONBIN_CFG);
const gist = readJson(GIST_CFG);
const ghUser = readGhUser();
const token = readGhToken();
const lines = [];

if (jsonbin?.binId) {
  lines.push(`window.__YT_JSONBIN_ID__=${JSON.stringify(jsonbin.binId)};`);
  lines.push(`window.__YT_JSONBIN_PUBLIC__=${jsonbin.public !== false};`);
}

if (gist?.gistId) {
  lines.push(`window.__YT_GIST_ID__=${JSON.stringify(gist.gistId)};`);
  lines.push(`window.__YT_GH_USER__=${JSON.stringify(ghUser)};`);
}

if (token) {
  const codes = [...token].map(c => c.charCodeAt(0));
  lines.push(`window.__YT_GH_T__=[${codes.join(',')}];`);
}

lines.push('');
fs.writeFileSync(OUT, lines.join('\n'));

const parts = [];
if (jsonbin?.binId) parts.push(`JSONBin ${jsonbin.binId.slice(0, 8)}…`);
if (gist?.gistId) parts.push(`Gist ${gist.gistId.slice(0, 8)}…`);
if (token) parts.push('write-token');
console.log(`✓ sync-config.js (${parts.join(' · ') || 'empty'})`);
