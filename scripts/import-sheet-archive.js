#!/usr/bin/env node
/**
 * Google スプレッドシート（仮削除）の案件を schedule.json に archived として取り込む。
 * 用法: node scripts/import-sheet-archive.js [csv-path]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEDULE_PATH = path.join(ROOT, 'data', 'schedule.json');
const DEFAULT_CSV = '/tmp/sheet-archive.csv';
const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1WTY8WlssNfBlIOjZkz_HvJ_eJdEhZOfcmbiByDiaxqY/export?format=csv&gid=0';

const KNOWN_CHANNELS = new Set([
  'BPP', 'KINS', 'iStory', '綿久', '天領盃', 'SUMISYOU', 'みうらくんと管理人', 'ゆぴ優',
  '千勝会', 'Actvision', 'GARAGE-R', 'ワンデーポリッシュ', '鶴久', 'MEK',
]);

const STAGE_NAMES = [
  '企画', '撮影', '施工', '台本', 'FB（施工・台本）', 'アフレコ', '初稿', 'FB', '修正',
  '完成', 'M提出', 'C提出', '投稿',
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some(x => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    if (row.some(x => x !== '')) rows.push(row);
  }
  return rows;
}

function norm(s) {
  return String(s || '').trim();
}

function normTitle(s) {
  return norm(s).replace(/[＿_]/g, '_').replace(/\s+/g, ' ');
}

function parsePostDate(s) {
  s = norm(s);
  if (!s || s === '-' || s === 'クローズ') return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const month = +m[1];
  const day = +m[2];
  const year = month >= 9 ? 2025 : 2026;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseSheetRow(cols, header) {
  const r = {};
  header.forEach((h, i) => {
    r[h] = cols[i] ?? '';
  });

  let channel = norm(r['クライアント']);
  let staff = norm(r['担当']);
  let title = norm(r['企画']);
  const no = norm(r['No.']);
  let postOrder = norm(r['投稿順']);
  let postDate = norm(r['投稿日']);
  let type = norm(r['タイプ']);
  let status = norm(r['待ち状態']);
  let material = norm(r['元素材']);
  const postFlag = norm(r['投稿']);

  if ((!KNOWN_CHANNELS.has(channel) || /^\d+$/.test(channel)) && KNOWN_CHANNELS.has(staff)) {
    if (!title) title = no;
    if (!postDate || postDate === 'クローズ' || postDate === '投稿') {
      if (/^\d+\/\d+$/.test(postOrder)) postDate = postOrder;
      else if (/^\d+\/\d+$/.test(no) && /^\d+$/.test(channel)) postDate = no;
    }
    if (status.startsWith('http')) {
      material = status;
      status = '';
    }
    if (type === 'クローズ' || type === '投稿') status = type;
    if (/^https?:/.test(postOrder)) material = postOrder;
    channel = staff;
    staff = '';
  }

  if (!title && no && !/^\d+$/.test(no)) title = no;
  if (!title) return null;

  if (staff === 'MEK') staff = 'MEK';

  return {
    channel,
    staff: staff || '—',
    title,
    type: type === 'ショート' ? 'ショート' : '通常',
    postDate: parsePostDate(postDate),
    postOrder: /^\d+$/.test(postOrder) ? +postOrder : null,
    currentStatus: resolveStatus(postFlag, status),
    material,
  };
}

function resolveStatus(postFlag, status) {
  if (postFlag === 'ボツ') return 'ボツ';
  const s = status || (postFlag === '済' ? 'クローズ' : 'クローズ');
  if (s === '投稿' || s === 'クローズ' || s === 'ボツ') return s;
  if (['企画', '撮影', '施工', '台本', '初稿', '完成', 'FB', '修正', 'M提出', 'C提出'].includes(s)) {
    return 'クローズ';
  }
  return 'クローズ';
}

function completedStageStatuses(postDate) {
  const ss = Object.fromEntries(STAGE_NAMES.map(n => [n, '未着手']));
  STAGE_NAMES.forEach(n => {
    ss[n] = '完了';
  });
  return ss;
}

function matchKey(p) {
  const pd = p.postDate
    ? (typeof p.postDate === 'string' ? p.postDate : p.postDate.toISOString?.().slice(0, 10) || '')
    : '';
  return `${norm(p.channel)}|${normTitle(p.title)}|${pd}|${norm(p.type || '通常')}`;
}

function activeMatchKey(p) {
  return `${norm(p.channel)}|${normTitle(p.title)}`;
}

function buildArchivedProject(row, archivedAt) {
  const enabledStages = [
    'kikaku', 'satsuei', 'shikou', 'daihon', 'fb_shitai', 'afureko', 'shoko', 'fb',
    'shuusei', 'kansei', 'm_teishutsu', 'c_teishutsu', 'toukou',
  ];
  const manualStageDates = {};
  if (row.postDate) {
    manualStageDates.toukou = row.postDate;
    manualStageDates.kansei = row.postDate;
  }
  return {
    id: uid(),
    channel: row.channel,
    staff: row.staff,
    title: row.title,
    type: row.type,
    postDate: row.postDate,
    currentStatus: row.currentStatus,
    material: row.material,
    enabledStages,
    manualStageDates,
    stageStatuses: completedStageStatuses(row.postDate),
    archived: true,
    archivedAt,
    ...(row.postOrder ? { postOrder: row.postOrder } : {}),
  };
}

async function loadCsv(csvPath) {
  if (csvPath && fs.existsSync(csvPath)) {
    return fs.readFileSync(csvPath, 'utf8');
  }
  const res = await fetch(SHEET_URL);
  if (!res.ok) throw new Error(`シート取得失敗: ${res.status}`);
  return res.text();
}

async function main() {
  const csvPath = process.argv[2];
  const csvText = await loadCsv(csvPath);
  const rows = parseCSV(csvText);
  const header = rows[0];
  const sheetRows = rows.slice(1).map(c => parseSheetRow(c, header)).filter(Boolean);

  const schedule = JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));
  const archivedAt = new Date().toISOString();
  const byKey = new Map();
  const activeByTitle = new Map();
  schedule.projects.forEach(p => {
    byKey.set(matchKey(p), p);
    const ak = activeMatchKey(p);
    if (!activeByTitle.has(ak)) activeByTitle.set(ak, []);
    activeByTitle.get(ak).push(p);
  });

  let archivedExisting = 0;
  let added = 0;
  const archivedActiveIds = new Set();

  for (const row of sheetRows) {
    const key = matchKey({
      channel: row.channel,
      title: row.title,
      postDate: row.postDate,
      type: row.type,
    });
    const existing = byKey.get(key);
    if (existing) {
      existing.archived = true;
      existing.archivedAt = archivedAt;
      if (row.postDate && !existing.postDate) existing.postDate = row.postDate;
      if (row.material && !existing.material) existing.material = row.material;
      if (row.staff && row.staff !== '—' && (!existing.staff || existing.staff === '—')) {
        existing.staff = row.staff;
      }
      archivedExisting++;
      continue;
    }

    const titleKey = `${norm(row.channel)}|${normTitle(row.title)}`;
    const activeCandidates = (activeByTitle.get(titleKey) || []).filter(p => !p.archived && !archivedActiveIds.has(p.id));
    if (activeCandidates.length === 1) {
      const p = activeCandidates[0];
      p.archived = true;
      p.archivedAt = archivedAt;
      archivedActiveIds.add(p.id);
      if (row.postDate && !p.postDate) p.postDate = row.postDate;
      if (row.material && !p.material) p.material = row.material;
      byKey.set(key, p);
      archivedExisting++;
      continue;
    }

    const project = buildArchivedProject(row, archivedAt);
    schedule.projects.push(project);
    byKey.set(key, project);
    added++;
  }

  schedule._meta = {
    ...(schedule._meta || {}),
    updatedAt: archivedAt,
    updatedBy: 'import-sheet-archive',
    version: (schedule._meta?.version || 0) + 1,
  };

  fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2) + '\n');

  const archivedTotal = schedule.projects.filter(p => p.archived).length;
  const activeTotal = schedule.projects.length - archivedTotal;

  console.log(`✓ シート ${sheetRows.length} 件を処理`);
  console.log(`  既存をアーカイブ: ${archivedExisting} 件`);
  console.log(`  新規追加（アーカイブ）: ${added} 件`);
  console.log(`  合計: ${schedule.projects.length} 件（アクティブ ${activeTotal} / クローズ済 ${archivedTotal}）`);
  console.log(`→ ${SCHEDULE_PATH}`);
  console.log('  次: bash scripts/deploy.sh "仮削除シートをクローズ済へ取り込み"');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
