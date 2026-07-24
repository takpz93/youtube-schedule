#!/usr/bin/env node
/**
 * デプロイ前: Gist / GitHub / Pages のうち最新の schedule.json を採用する。
 * ローカルファイルより古いデータでデプロイしない（データ巻き戻し防止）。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const LOCAL_PATH = path.join(ROOT, 'data', 'schedule.json');
const GIST_CFG = path.join(ROOT, '.gist-config.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} ${url}`));
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

function countProjects(json) {
  if (!json) return 0;
  if (Array.isArray(json)) return json.length;
  return Array.isArray(json.projects) ? json.projects.length : 0;
}

function metaTime(json) {
  const t = json?._meta?.updatedAt;
  return t ? new Date(t).getTime() : 0;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function getGistUrl() {
  try {
    const cfg = JSON.parse(fs.readFileSync(GIST_CFG, 'utf8'));
    if (!cfg.gistId) return null;
    return `https://gist.githubusercontent.com/takpz93/${cfg.gistId}/raw/schedule.json`;
  } catch {
    return null;
  }
}

async function loadAllSources() {
  const urls = [
    { name: 'github', url: process.env.SCHEDULE_REMOTE_URL
      || 'https://raw.githubusercontent.com/takpz93/youtube-schedule/main/data/schedule.json' },
    { name: 'pages', url: 'https://takpz93.github.io/youtube-schedule/data/schedule.json' },
  ];
  const gistUrl = getGistUrl();
  if (gistUrl) urls.push({ name: 'gist', url: gistUrl });

  const results = await Promise.allSettled(urls.map(async ({ name, url }) => {
    const json = await fetchJson(url);
    return { name, url, json, count: countProjects(json), time: metaTime(json) };
  }));

  return results
    .filter(r => r.status === 'fulfilled' && r.value.count > 0)
    .map(r => r.value);
}

function pickBest(candidates) {
  return candidates.reduce((best, cur) => {
    if (!best) return cur;
    if (cur.time > best.time) return cur;
    if (cur.time === best.time && cur.count > best.count) return cur;
    return best;
  }, null);
}

async function main() {
  let local = null;
  if (fs.existsSync(LOCAL_PATH)) {
    try { local = JSON.parse(fs.readFileSync(LOCAL_PATH, 'utf8')); }
    catch (e) { console.warn('Local schedule.json parse error:', e.message); }
  }

  const remoteCandidates = await loadAllSources();
  const bestRemote = pickBest(remoteCandidates);

  const localEntry = local && countProjects(local) > 0
    ? { name: 'local', json: local, count: countProjects(local), time: metaTime(local) }
    : null;

  const all = [...remoteCandidates];
  if (localEntry) all.push(localEntry);

  const winner = pickBest(all);

  if (!winner) {
    console.log('No project data found anywhere');
    return;
  }

  if (winner.name === 'local') {
    console.log(`Keeping local schedule.json (${winner.count} projects, ${winner.json._meta?.updatedAt || 'no meta'})`);
    return;
  }

  writeJson(LOCAL_PATH, winner.json);
  console.log(
    `Preserved ${winner.name} schedule.json (${winner.count} projects, updated ${winner.json._meta?.updatedAt || '?'})`
  );

  const others = remoteCandidates.filter(c => c.name !== winner.name);
  if (others.length) {
    const stale = others.filter(c => c.time < winner.time);
    if (stale.length) {
      console.log(`  (skipped older: ${stale.map(s => `${s.name}@${s.json._meta?.updatedAt}`).join(', ')})`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
