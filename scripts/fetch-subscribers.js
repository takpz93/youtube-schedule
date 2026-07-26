#!/usr/bin/env node
/**
 * 各クライアントの YouTube 登録者数を取得し subscribers.json を更新する。
 * 毎週月曜 9:00 JST のスナップショット用（cron / COOエージェントから実行）。
 *
 * 用法:
 *   node scripts/fetch-subscribers.js           # 月曜以外はスキップ（--force で強制）
 *   node scripts/fetch-subscribers.js --force   # 曜日に関係なく取得
 *   node scripts/fetch-subscribers.js --dry-run # 書き込まず表示のみ
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SUBS_PATH = path.join(ROOT, 'data', 'subscribers.json');
const CHANNELS_PATH = path.join(ROOT, 'data', 'subscriber-channels.json');

function jstNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
}

function mondayLabel(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function mondayIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseNum(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!s || s.startsWith('#')) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function fetchCountViaYtDlp(url) {
  try {
    const out = execSync(
      `yt-dlp --no-warnings --print "%(channel_follower_count)s" "${url}"`,
      { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    const n = parseNum(out);
    if (n != null) return n;
  } catch (_) {
    /* fall through */
  }
  return null;
}

function fetchCountViaCurl(url) {
  const aboutUrl = url.replace(/\/$/, '').replace(/\/(videos|streams|shorts|playlists|community|featured|about)$/, '') + '/about';
  try {
    const html = execSync(
      `curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "${aboutUrl}"`,
      { encoding: 'utf8', timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    );
    const parsed = extractYtInitialData(html);
    if (parsed) {
      const count = findSubscriberCount(parsed);
      if (count != null) return count;
    }
    const patterns = [
      /"subscriberCountText":\{"simpleText":"([^"]+)"/,
      /"subscriberCountText":\{"runs":\[\{"text":"([^"]+)"/,
      /"channelFollowerCount":"(\d+)"/,
    ];
    for (const re of patterns) {
      const hit = html.match(re);
      if (hit) {
        const n = parseNum(hit[1].replace(/[^0-9]/g, ''));
        if (n != null) return n;
      }
    }
  } catch (_) {
    /* fall through */
  }
  return null;
}

function parseSubscriberText(raw) {
  const s = String(raw || '');
  const man = s.match(/([\d,.]+)\s*万人/);
  if (man) {
    const n = parseFloat(man[1].replace(/,/g, ''));
    if (Number.isFinite(n)) return Math.round(n * 10000);
  }
  const hit = s.match(/([\d,]+)\s*人/);
  if (hit) return parseNum(hit[1]);
  return parseNum(s.replace(/[^0-9]/g, ''));
}

function subscriberTextRaw(t) {
  if (typeof t === 'string') return t;
  if (t?.simpleText) return t.simpleText;
  if (Array.isArray(t?.runs)) return t.runs.map(r => r.text || '').join('');
  if (t?.accessibility?.accessibilityData?.label) return t.accessibility.accessibilityData.label;
  return '';
}

function findAboutChannelCount(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.aboutChannelViewModel?.subscriberCountText) {
    const n = parseSubscriberText(subscriberTextRaw(obj.aboutChannelViewModel.subscriberCountText));
    if (n != null) return n;
  }
  if (obj.aboutChannelRenderer?.metadata?.aboutChannelViewModel?.subscriberCountText) {
    const n = parseSubscriberText(
      subscriberTextRaw(obj.aboutChannelRenderer.metadata.aboutChannelViewModel.subscriberCountText)
    );
    if (n != null) return n;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const n = findAboutChannelCount(item);
      if (n != null) return n;
    }
  } else {
    for (const v of Object.values(obj)) {
      const n = findAboutChannelCount(v);
      if (n != null) return n;
    }
  }
  return null;
}

function findSubscriberCount(obj) {
  const preferred = findAboutChannelCount(obj);
  if (preferred != null) return preferred;
  return collectSubscriberCounts(obj)[0] ?? null;
}

function collectSubscriberCounts(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (obj.subscriberCountText) {
    const n = parseSubscriberText(subscriberTextRaw(obj.subscriberCountText));
    if (n != null) out.push(n);
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectSubscriberCounts(item, out);
  } else {
    for (const v of Object.values(obj)) collectSubscriberCounts(v, out);
  }
  return out.sort((a, b) => b - a);
}

function extractYtInitialData(html) {
  const marker = 'var ytInitialData = ';
  const idx = html.indexOf(marker);
  if (idx < 0) return null;
  const start = idx + marker.length;
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function fetchSubscriberCount(channel) {
  const url = channel.youtubeUrl || (channel.youtubeHandle
    ? `https://www.youtube.com/@${channel.youtubeHandle.replace(/^@/, '')}`
    : '');
  if (!url) return { count: null, error: 'URL未設定' };

  let count = fetchCountViaYtDlp(url);
  if (count == null) count = fetchCountViaCurl(url);
  if (count == null) return { count: null, error: '取得失敗' };
  return { count, error: null };
}

function nextWeekIndex(client) {
  const indices = client.points
    .filter(p => p.kind === 'week' && p.weekIndex != null && p.weekIndex < 500)
    .map(p => p.weekIndex);
  if (!indices.length) return 1;
  return Math.max(...indices) + 1;
}

function prevWeekCount(client, currentKey) {
  const weekPoints = client.points
    .filter(p => p.kind === 'week' && p.isoDate && p.count != null && p.key !== currentKey)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  return weekPoints.length ? weekPoints[weekPoints.length - 1].count : null;
}

/** 週次ポイントの前週差分を isoDate 順に再計算（スプレッドシート3行目相当） */
function recalculateClientDeltas(client) {
  const weekPoints = client.points
    .filter(p => p.kind === 'week' && p.isoDate)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  let prevCount = null;
  for (const p of weekPoints) {
    if (p.count != null) {
      p.weeklyDelta = prevCount != null ? p.count - prevCount : null;
      p.monthlyDelta = p.weeklyDelta;
      prevCount = p.count;
    }
  }
}

function recalculateAllDeltas(data) {
  for (const client of data.clients) recalculateClientDeltas(client);
  return data;
}

function snapshotColumnDate(runDate) {
  const d = new Date(runDate);
  // スプレッドシートの列は日曜日付。
  // 月曜朝の取得 → 直前の日曜列。--force で他曜日に実行しても直近の日曜列に記録する。
  const day = d.getDay(); // 0=日 … 1=月
  if (day !== 0) d.setDate(d.getDate() - day);
  return d;
}

function upsertMondaySnapshot(data, results, snapshotDate) {
  const colDate = snapshotColumnDate(snapshotDate);
  const label = mondayLabel(colDate);
  const iso = mondayIso(colDate);
  let weekCol = data.weekColumns.find(c => c.isoDate === iso);
  if (!weekCol) {
    weekCol = { key: iso, label, isoDate: iso, kind: 'week' };
    data.weekColumns.push(weekCol);
  } else {
    weekCol.label = label;
  }

  for (const client of data.clients) {
    const res = results.find(r => r.id === client.id);
    if (!res || res.count == null) continue;

    let point = client.points.find(p => p.key === weekCol.key);
    const prevCount = prevWeekCount(client, weekCol.key);
    const weekIndex = nextWeekIndex(client);

    if (!point) {
      point = {
        key: weekCol.key,
        label: weekCol.label,
        isoDate: weekCol.isoDate,
        kind: 'week',
        weekIndex: null,
        count: null,
        weeklyDelta: null,
        monthlyDelta: null,
      };
      client.points.push(point);
    }

    point.weekIndex = weekIndex;
    point.count = res.count;
    point.weeklyDelta = prevCount != null ? res.count - prevCount : null;
    point.monthlyDelta = point.weeklyDelta; // 週次更新時は直近週差分を月平均行にも反映（手動シートと同様）
  }

  data.updatedAt = new Date().toISOString();
  data.lastFetchAt = data.updatedAt;
  data.lastSnapshot = { iso, label, rule: '毎週月曜 6:00 JST（日曜列に記録）' };
  return data;
}

async function main() {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const recalcOnly = process.argv.includes('--recalc');
  const now = jstNow();

  if (recalcOnly) {
    if (!fs.existsSync(SUBS_PATH)) {
      console.error('subscribers.json not found');
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(SUBS_PATH, 'utf8'));
    recalculateAllDeltas(data);
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(SUBS_PATH, JSON.stringify(data, null, 2) + '\n');
    console.log('✓ Recalculated weekly deltas in subscribers.json');
    return;
  }

  if (!force && now.getDay() !== 1) {
    console.log(`今日は月曜ではないためスキップ（JST: ${now.toLocaleString()}）。--force で強制実行`);
    return;
  }

  if (!fs.existsSync(SUBS_PATH)) {
    console.error('subscribers.json がありません。先に import-subscribers-sheet.js --fetch を実行してください');
    process.exit(1);
  }

  const channelConfig = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf8'));
  const data = JSON.parse(fs.readFileSync(SUBS_PATH, 'utf8'));
  const configById = new Map((channelConfig.channels || []).map(c => [c.id, c]));

  console.log(`→ Fetching subscriber counts (JST ${now.toLocaleString()})...`);
  const results = [];

  for (const client of data.clients) {
    const cfg = configById.get(client.id) || {};
    const merged = { ...cfg, ...client, youtubeUrl: client.youtubeUrl || cfg.youtubeUrl, youtubeHandle: client.youtubeHandle || cfg.youtubeHandle };
    const { count, error } = fetchSubscriberCount(merged);
    results.push({ id: client.id, name: client.displayName, count, error });
    const status = count != null ? count.toLocaleString() : `— (${error})`;
    console.log(`  ${client.displayName}: ${status}`);
  }

  if (dryRun) {
    console.log('(dry-run: ファイルは更新しません)');
    return;
  }

  upsertMondaySnapshot(data, results, now);
  fs.writeFileSync(SUBS_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ Updated ${SUBS_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
