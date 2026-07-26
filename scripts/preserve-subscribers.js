#!/usr/bin/env node
/**
 * デプロイ前: GitHub Pages / ローカルのうち updatedAt が新しい subscribers.json を採用する。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const LOCAL_PATH = path.join(ROOT, 'data', 'subscribers.json');
const PAGES_URL = process.env.SUBS_REMOTE_URL
  || 'https://takpz93.github.io/youtube-schedule/data/subscribers.json';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(`${url}?t=${Date.now()}`, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  });
}

function updatedAt(json) {
  const t = json?.updatedAt;
  return t ? new Date(t).getTime() : 0;
}

async function main() {
  let local = null;
  if (fs.existsSync(LOCAL_PATH)) {
    try { local = JSON.parse(fs.readFileSync(LOCAL_PATH, 'utf8')); }
    catch (e) { console.warn('Local subscribers.json parse error:', e.message); }
  }

  let remote = null;
  try { remote = await fetchJson(PAGES_URL); }
  catch (e) { console.warn('Remote subscribers fetch skipped:', e.message); }

  const localTs = updatedAt(local);
  const remoteTs = updatedAt(remote);

  if (remote && remoteTs > localTs) {
    fs.writeFileSync(LOCAL_PATH, JSON.stringify(remote, null, 2) + '\n');
    console.log(`Preserved pages subscribers.json (${remote.clients?.length || 0} clients, updated ${remote.updatedAt})`);
    if (localTs) console.log(`  (skipped older local: ${local?.updatedAt})`);
    return;
  }

  if (local) {
    console.log(`Keeping local subscribers.json (${local.clients?.length || 0} clients, updated ${local.updatedAt || '—'})`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
