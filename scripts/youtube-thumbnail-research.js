#!/usr/bin/env node
/**
 * サムネ・タイトル用の参考材料を YouTube から収集し、1つの md に出力する。
 *
 *   【A】キーワード横断で参考動画を収集（倍率 = 再生数 ÷ 登録者数 で規模帯別に足切り）
 *   【B】自チャンネル本編の再生数上位N本
 *   【C】指名動画の実測値
 *
 * 取得手段は2系統。どちらか使える方で動く（環境の準備手順は research/README.md）。
 *   1) YouTube Data API v3 … YOUTUBE_API_KEY（推奨・速い。8検索で約 900 units）。
 *                            Claude Code cloud 環境の API credentials にキーを登録済みならキー指定不要。
 *   2) yt-dlp            … PATH にあれば自動フォールバック（キー不要・遅い・youtube.com への通信が必要）
 *
 * 用法:
 *   YOUTUBE_API_KEY=xxxx node scripts/youtube-thumbnail-research.js [--out path.md]
 *   node scripts/youtube-thumbnail-research.js --key xxxx
 *   echo 'YOUTUBE_API_KEY=xxxx' > .env.local && node scripts/youtube-thumbnail-research.js   # .env.local は git 管理外
 *   node scripts/youtube-thumbnail-research.js --mode ytdlp
 *   node scripts/youtube-thumbnail-research.js --config research/xxx.json   # 条件を差し替える
 *
 * 設定は下の DEFAULT_CONFIG。--config で JSON を渡すと上書きできる。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_CONFIG = {
  title: '千勝会「歯の詰め物（レジン・金属・セラミック）」回 サムネ・タイトル参考材料',
  out: 'research/chikatsukai-filling-research.md',
  keywords: [
    '銀歯 デメリット', '銀歯 白くする', '詰め物 セラミック', 'CAD/CAM冠',
    '二次虫歯 詰め物', '詰め物 寿命', '保険 自費 歯 違い', 'インレー 種類',
  ],
  perKeyword: 50,
  maxAgeDaysPrimary: 365,
  maxAgeDaysExtended: 730,
  minDurationSec: 181, // 180秒超のみ
  tiers: [
    { name: '大規模', minSubs: 100000, minRatio: 1.0 },
    { name: '中規模', minSubs: 10000, minRatio: 2.0 },
    { name: '小規模', minSubs: 0, minRatio: 3.0 },
  ],
  ownChannelId: 'UCqGpNSBrcuKv_qTLeiD7hvg',
  ownChannelUrl: 'https://www.youtube.com/@chikatsukai',
  ownTopN: 5,
  named: [
    {
      label: '前岡遼馬「【暴露】「銀歯を白くしませんか？」保険のCAD/CAM冠の闇」',
      videoId: '53pLVb9EA7E',
    },
  ],
};

// ---------- 引数 ----------
const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const ROOT = path.resolve(__dirname, '..');
const config = { ...DEFAULT_CONFIG };
if (arg('--config')) Object.assign(config, JSON.parse(fs.readFileSync(arg('--config'), 'utf8')));
if (arg('--out')) config.out = arg('--out');
// API キーの探索順: --key → 環境変数 YOUTUBE_API_KEY → .env / .env.local（リポジトリ直下・git 管理外）
function loadApiKey() {
  if (arg('--key')) return arg('--key');
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY;
  for (const f of ['.env.local', '.env']) {
    const fp = path.join(ROOT, f);
    if (!fs.existsSync(fp)) continue;
    const m = /^\s*YOUTUBE_API_KEY\s*=\s*["']?([^"'\s#]+)/m.exec(fs.readFileSync(fp, 'utf8'));
    if (m) return m[1];
  }
  return '';
}
const API_KEY = loadApiKey();
// mode は resolveMode() で確定する: 'api' | 'ytdlp'
let mode = arg('--mode') || null;

// キーが手元に無くても、Claude Code の cloud 環境「API credentials」で www.googleapis.com に
// X-Goog-Api-Key が自動付与される設定なら API モードで動く。その判定を1リクエストで行う。
async function resolveMode() {
  if (mode) return mode;
  if (API_KEY) return (mode = 'api');
  try {
    await apiGet('channels', { part: 'id', id: config.ownChannelId });
    log('APIキー未指定ですが googleapis に認証済みで到達できたため API モードで実行します（環境の API credentials 経由）');
    return (mode = 'api');
  } catch (e) {
    log(`googleapis へキー無しで到達できず（${String(e.message).slice(0, 80)}…）`);
  }
  if (hasYtDlp()) return (mode = 'ytdlp');
  console.error('取得手段がありません。次のいずれかを用意してください:');
  console.error('  1) 環境変数 YOUTUBE_API_KEY=xxxx   2) --key xxxx   3) リポジトリ直下の .env.local に YOUTUBE_API_KEY=xxxx');
  console.error('  4) Claude Code cloud 環境の API credentials に www.googleapis.com / X-Goog-Api-Key でキー登録（research/README.md 参照）');
  console.error('  5) yt-dlp を PATH に入れて --mode ytdlp（youtube.com への通信許可が必要）');
  process.exit(1);
}

function hasYtDlp() {
  try { execFileSync('yt-dlp', ['--version'], { stdio: 'ignore' }); return true; } catch (_) { return false; }
}

// ---------- 共通ユーティリティ ----------
const log = (...m) => console.error(...m);
const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const num = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('ja-JP'));
const thumbUrl = (id, maxres) => `https://i.ytimg.com/vi/${id}/${maxres ? 'maxresdefault' : 'hqdefault'}.jpg`;
const videoUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

function tierOf(subs) {
  return config.tiers.find((t) => subs >= t.minSubs) || config.tiers[config.tiers.length - 1];
}

function isoDurationToSec(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return 0;
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
}

// 正規化した動画レコード:
// { id, title, channelId, channelTitle, subs, views, publishedAt, durationSec, landscape, maxres }

// ---------- 取得系: YouTube Data API v3 ----------
async function apiGet(endpoint, params) {
  const u = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
  // キーは URL ではなくヘッダーで渡す（プロキシ側でキーが付与される構成と同じ経路）
  const res = await fetch(u, API_KEY ? { headers: { 'X-Goog-Api-Key': API_KEY } } : undefined);
  const json = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${res.status} ${JSON.stringify(json.error || json).slice(0, 300)}`);
  return json;
}

async function apiSearchIds(q, publishedAfter, max) {
  const ids = [];
  let pageToken;
  while (ids.length < max) {
    const j = await apiGet('search', {
      part: 'id', q, type: 'video', maxResults: Math.min(50, max - ids.length),
      publishedAfter, regionCode: 'JP', relevanceLanguage: 'ja', pageToken,
    });
    ids.push(...j.items.map((it) => it.id.videoId).filter(Boolean));
    pageToken = j.nextPageToken;
    if (!pageToken) break;
  }
  return ids;
}

async function apiVideos(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const j = await apiGet('videos', {
      part: 'snippet,contentDetails,statistics,player', id: ids.slice(i, i + 50).join(','), maxHeight: 360,
    });
    for (const v of j.items) {
      const ew = v.player?.embedWidth, eh = v.player?.embedHeight;
      out.push({
        id: v.id,
        title: v.snippet.title,
        channelId: v.snippet.channelId,
        channelTitle: v.snippet.channelTitle,
        views: Number(v.statistics?.viewCount || 0),
        publishedAt: v.snippet.publishedAt,
        durationSec: isoDurationToSec(v.contentDetails?.duration),
        landscape: ew && eh ? Number(ew) > Number(eh) : !/#shorts/i.test(v.snippet.title),
        maxres: Boolean(v.snippet.thumbnails?.maxres),
      });
    }
  }
  return out;
}

async function apiChannelSubs(channelIds) {
  const subs = {};
  const uniq = [...new Set(channelIds)];
  for (let i = 0; i < uniq.length; i += 50) {
    const j = await apiGet('channels', { part: 'statistics', id: uniq.slice(i, i + 50).join(',') });
    for (const c of j.items) subs[c.id] = Number(c.statistics?.subscriberCount || 0);
  }
  return subs;
}

async function apiUploadsIds(channelId) {
  const c = await apiGet('channels', { part: 'contentDetails', id: channelId });
  const uploads = c.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error(`uploads playlist not found for ${channelId}`);
  const ids = [];
  let pageToken;
  do {
    const j = await apiGet('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: 50, pageToken });
    ids.push(...j.items.map((it) => it.contentDetails.videoId));
    pageToken = j.nextPageToken;
  } while (pageToken);
  return ids;
}

// ---------- 取得系: yt-dlp ----------
function ytdlp(argv, opts = {}) {
  return execFileSync('yt-dlp', ['--no-warnings', '--ignore-errors', ...argv], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: opts.timeout || 600000, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function ytdlpSearchIds(q, max) {
  const out = ytdlp(['--flat-playlist', '--print', '%(id)s\t%(duration)s', `ytsearch${max}:${q}`]);
  return out.trim().split('\n').filter(Boolean).map((l) => {
    const [id, dur] = l.split('\t');
    return { id, durationSec: Number(dur) || 0 };
  });
}

function ytdlpChannelVideos(channelUrl) {
  // /videos タブは本編（ショート除外）のみ。flat で再生数と尺が取れる。
  const out = ytdlp(['--flat-playlist', '--print', '%(id)s\t%(view_count)s\t%(duration)s', `${channelUrl.replace(/\/$/, '')}/videos`]);
  return out.trim().split('\n').filter(Boolean).map((l) => {
    const [id, views, dur] = l.split('\t');
    return { id, views: Number(views) || 0, durationSec: Number(dur) || 0 };
  });
}

const YTDLP_FIELDS = ['id', 'title', 'channel_id', 'channel', 'channel_follower_count', 'view_count',
  'upload_date', 'duration', 'width', 'height', 'thumbnail'];

function ytdlpVideo(id) {
  try {
    const out = ytdlp(['--print', YTDLP_FIELDS.map((f) => `%(${f})s`).join('\t'), videoUrl(id)], { timeout: 60000 });
    const v = Object.fromEntries(YTDLP_FIELDS.map((f, i) => [f, out.trim().split('\t')[i]]));
    const ud = v.upload_date && v.upload_date !== 'NA' ? `${v.upload_date.slice(0, 4)}-${v.upload_date.slice(4, 6)}-${v.upload_date.slice(6, 8)}` : null;
    return {
      id,
      title: v.title,
      channelId: v.channel_id,
      channelTitle: v.channel,
      subs: Number(v.channel_follower_count) || 0,
      views: Number(v.view_count) || 0,
      publishedAt: ud,
      durationSec: Number(v.duration) || 0,
      landscape: Number(v.width) && Number(v.height) ? Number(v.width) > Number(v.height) : !/#shorts/i.test(v.title),
      maxres: /maxresdefault/.test(v.thumbnail || ''),
    };
  } catch (e) {
    log(`  skip ${id}: ${String(e.message).split('\n')[0]}`);
    return null;
  }
}

// ---------- 本体 ----------
function passesBase(v) {
  return v.durationSec >= config.minDurationSec && v.landscape;
}

function withRatio(v) {
  const tier = tierOf(v.subs);
  const ratio = v.subs > 0 ? v.views / v.subs : null;
  return { ...v, tier: tier.name, ratio, pass: ratio != null && ratio >= tier.minRatio };
}

async function collectA() {
  const now = Date.now();
  const cutoff = (days) => new Date(now - days * 86400000);
  const seen = new Map(); // id -> { keywords:Set }
  log(`[A] ${mode} で ${config.keywords.length} キーワードを検索`);

  for (const kw of config.keywords) {
    let ids;
    if (mode === 'api') {
      ids = await apiSearchIds(kw, cutoff(config.maxAgeDaysExtended).toISOString(), config.perKeyword);
    } else {
      ids = ytdlpSearchIds(kw, config.perKeyword).filter((x) => x.durationSec === 0 || x.durationSec >= config.minDurationSec).map((x) => x.id);
    }
    log(`  ${kw}: ${ids.length} 件`);
    for (const id of ids) {
      if (!seen.has(id)) seen.set(id, { keywords: new Set() });
      seen.get(id).keywords.add(kw);
    }
  }

  let videos;
  if (mode === 'api') {
    videos = await apiVideos([...seen.keys()]);
    const subs = await apiChannelSubs(videos.map((v) => v.channelId));
    videos.forEach((v) => { v.subs = subs[v.channelId] || 0; });
  } else {
    log(`  ${seen.size} 件の詳細を取得中（時間がかかります）`);
    videos = [...seen.keys()].map(ytdlpVideo).filter(Boolean);
  }

  const inWindow = (v, days) => v.publishedAt && new Date(v.publishedAt) >= cutoff(days);
  const base = videos.filter(passesBase).map(withRatio).filter((v) => v.pass);
  base.forEach((v) => { v.keywords = [...seen.get(v.id).keywords]; });

  let windowDays = config.maxAgeDaysPrimary;
  let hits = base.filter((v) => inWindow(v, windowDays));
  const primaryCount = hits.length;
  if (hits.length < 10) {
    windowDays = config.maxAgeDaysExtended;
    hits = base.filter((v) => inWindow(v, windowDays));
  }
  hits.sort((a, b) => b.ratio - a.ratio);
  log(`[A] 候補 ${videos.length} → 条件クリア ${hits.length} 件（1年以内 ${primaryCount} 件、採用ウィンドウ ${windowDays} 日）`);
  return { hits, windowDays, candidates: videos.length, primaryCount };
}

async function collectB() {
  log('[B] 自チャンネル本編の上位を取得');
  let videos;
  if (mode === 'api') {
    const ids = await apiUploadsIds(config.ownChannelId);
    videos = (await apiVideos(ids)).filter(passesBase);
    const subs = await apiChannelSubs([config.ownChannelId]);
    videos.forEach((v) => { v.subs = subs[config.ownChannelId] || 0; });
  } else {
    const flat = ytdlpChannelVideos(config.ownChannelUrl)
      .filter((x) => x.durationSec === 0 || x.durationSec >= config.minDurationSec)
      .sort((a, b) => b.views - a.views)
      .slice(0, config.ownTopN + 3);
    videos = flat.map((x) => ytdlpVideo(x.id)).filter(Boolean).filter(passesBase);
  }
  videos.sort((a, b) => b.views - a.views);
  return videos.slice(0, config.ownTopN);
}

async function collectC() {
  log('[C] 指名動画を取得');
  const out = [];
  for (const n of config.named) {
    let v;
    if (mode === 'api') {
      v = (await apiVideos([n.videoId]))[0];
      if (v) v.subs = (await apiChannelSubs([v.channelId]))[v.channelId] || 0;
    } else {
      v = ytdlpVideo(n.videoId);
    }
    out.push({ label: n.label, videoId: n.videoId, video: v ? withRatio(v) : null });
  }
  return out;
}

function renderMd(A, B, C) {
  const today = fmtDate(Date.now());
  const L = [];
  L.push(`# ${config.title}`, '', `取得日: ${today}　取得手段: ${mode === 'api' ? 'YouTube Data API v3' : 'yt-dlp'}`, '');

  L.push('## 【A】YouTube横断 参考動画（倍率順）', '');
  L.push(`- 検索キーワード: ${config.keywords.join(' / ')}（各${config.perKeyword}件）`);
  L.push(`- 条件: 公開${A.windowDays <= 365 ? '1年' : '2年'}以内 / ${config.minDurationSec - 1}秒超 / 横型のみ / 規模帯別倍率（大規模10万人以上 1.0倍・中規模1万〜10万人 2.0倍・小規模1万人未満 3.0倍）`);
  L.push(`- 候補 ${A.candidates} 本 → 条件クリア ${A.hits.length} 本（うち1年以内 ${A.primaryCount} 本${A.windowDays > 365 ? '。1年以内が少ないため2年まで拡張' : ''}）`, '');
  L.push('| # | チャンネル名 | 登録者数 | 規模帯 | タイトル | 再生数 | 倍率 | 公開日 | 動画URL | サムネ画像URL |');
  L.push('|---|---|---:|---|---|---:|---:|---|---|---|');
  A.hits.forEach((v, i) => {
    L.push(`| ${i + 1} | ${esc(v.channelTitle)} | ${num(v.subs)} | ${v.tier} | ${esc(v.title)} | ${num(v.views)} | ${v.ratio.toFixed(2)} | ${fmtDate(v.publishedAt)} | ${videoUrl(v.id)} | ${thumbUrl(v.id, v.maxres)} |`);
  });
  L.push('');

  L.push(`## 【B】自チャンネル 本編 再生数上位${config.ownTopN}本`, '');
  L.push(`チャンネル: ${config.ownChannelUrl}（${config.ownChannelId}）${B[0]?.subs ? `　登録者数: ${num(B[0].subs)}` : ''}`, '');
  L.push('| # | タイトル | 再生数 | 公開日 | 動画URL | サムネ画像URL |');
  L.push('|---|---|---:|---|---|---|');
  B.forEach((v, i) => {
    L.push(`| ${i + 1} | ${esc(v.title)} | ${num(v.views)} | ${fmtDate(v.publishedAt)} | ${videoUrl(v.id)} | ${thumbUrl(v.id, v.maxres)}${v.maxres ? '' : '（maxres無し・hqdefault）'} |`);
  });
  L.push('');

  L.push('## 【C】指名動画', '');
  for (const c of C) {
    L.push(`### ${c.label}`, '');
    if (!c.video) { L.push('- 取得失敗（動画が非公開・削除の可能性）', ''); continue; }
    const v = c.video;
    L.push(`- 動画URL: ${videoUrl(v.id)}`);
    L.push(`- サムネ画像URL: ${thumbUrl(v.id, v.maxres)}`);
    L.push(`- 再生数: ${num(v.views)}`);
    L.push(`- 公開日: ${fmtDate(v.publishedAt)}`);
    L.push(`- チャンネル: ${esc(v.channelTitle)}（登録者 ${num(v.subs)}・${v.tier}・倍率 ${v.ratio != null ? v.ratio.toFixed(2) : '—'}）`, '');
  }
  return L.join('\n');
}

function esc(s) {
  return String(s || '').replace(/\|/g, '｜').replace(/\r?\n/g, ' ');
}

(async () => {
  try {
    await resolveMode();
    const A = await collectA();
    const B = await collectB();
    const C = await collectC();
    const md = renderMd(A, B, C);
    const outPath = path.resolve(ROOT, config.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, md);
    log(`書き出し: ${outPath}`);
  } catch (e) {
    log('失敗:', e.message);
    process.exit(1);
  }
})();
