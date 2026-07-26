#!/usr/bin/env node
/**
 * Google スプレッドシート（登録者トラッキング）→ data/subscribers.json
 *
 * 用法:
 *   node scripts/import-subscribers-sheet.js [csv-path]
 *   node scripts/import-subscribers-sheet.js --fetch   # CSVを自動ダウンロード
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'data', 'subscribers.json');
const CHANNELS_PATH = path.join(ROOT, 'data', 'subscriber-channels.json');
const DEFAULT_CSV = path.join(ROOT, 'data', '.subscribers-import.csv');

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

function parseNum(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!s || s === '#DIV/0!' || s === '#N/A' || s === '#REF!') return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function padRow(row, len) {
  while (row.length < len) row.push('');
  return row.slice(0, len);
}

function inferIsoDates(labels) {
  let year = 2025;
  let prevMonth = null;
  return labels.map(label => {
    if (!label || label === 'day0' || label === '初投稿') return null;
    const m = label.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!m) return null;
    const month = Number(m[1]);
    const day = Number(m[2]);
    if (prevMonth != null && month < prevMonth) year += 1;
    prevMonth = month;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      })
      .on('error', reject);
  });
}

function buildWeekColumns(header) {
  const meta = [
    { key: 'day0', label: 'day0', isoDate: null, kind: 'meta' },
    { key: 'firstPost', label: '初投稿', isoDate: null, kind: 'meta' },
  ];
  const dateLabels = header.slice(4).filter(Boolean);
  const isoDates = inferIsoDates(dateLabels);
  const dateCols = dateLabels.map((label, i) => ({
    key: isoDates[i] || `col-${i}`,
    label,
    isoDate: isoDates[i],
    kind: 'week',
  }));
  return [...meta, ...dateCols];
}

function parseSheet(rows, channelConfig) {
  if (!rows.length) throw new Error('CSV is empty');
  const header = rows[0];
  const weekColumns = buildWeekColumns(header);
  const colCount = weekColumns.length + 2; // name + schedule cols before day0

  const configBySheetName = new Map(
    (channelConfig.channels || []).map(c => [c.sheetName, c])
  );

  const clients = [];
  for (let i = 1; i < rows.length; i += 3) {
    const nameRow = padRow(rows[i] || [], header.length);
    const weekRow = padRow(rows[i + 1] || [], header.length);
    const monthRow = padRow(rows[i + 2] || [], header.length);
    const sheetName = (nameRow[0] || '').trim();
    if (!sheetName || sheetName === '週平均' || sheetName === '月平均') continue;

    const cfg = configBySheetName.get(sheetName) || {};
    const schedule = (nameRow[1] || cfg.schedule || '').trim();
    const day0 = (nameRow[2] || '').trim();
    const firstPost = (nameRow[3] || '').trim();

    const points = weekColumns.map((col, ci) => {
      const dataIdx = ci + 2; // col0=name, col1=schedule, col2=day0...
      const weekIndexRaw = nameRow[dataIdx];
      const weekIndex = parseNum(weekIndexRaw);
      const count = parseNum(weekRow[dataIdx]);
      const monthlyDelta = parseNum(monthRow[dataIdx]);
      const prevCount = ci > 0 ? parseNum(weekRow[ci + 1]) : null;
      let weeklyDelta = null;
      if (count != null && prevCount != null) weeklyDelta = count - prevCount;

      return {
        key: col.key,
        label: col.label,
        isoDate: col.isoDate,
        kind: col.kind,
        weekIndex,
        count,
        weeklyDelta,
        monthlyDelta,
      };
    });

    clients.push({
      id: cfg.id || sheetName.replace(/\s+/g, '-').toLowerCase(),
      sheetName,
      displayName: cfg.displayName || sheetName,
      appChannel: cfg.appChannel || sheetName,
      schedule,
      day0,
      firstPost,
      youtubeHandle: cfg.youtubeHandle || '',
      youtubeUrl: cfg.youtubeUrl || '',
      clientPath: cfg.clientPath || null,
      points,
    });
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    sourceSheet: channelConfig.sheetUrl,
    snapshotRule: channelConfig.snapshotRule || '毎週月曜 9:00 JST',
    weekColumns,
    clients,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const doFetch = args.includes('--fetch');
  const csvPath = args.find(a => !a.startsWith('-')) || DEFAULT_CSV;

  const channelConfig = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf8'));

  let csvText;
  if (doFetch) {
    console.log('→ Downloading CSV...');
    csvText = await fetchUrl(channelConfig.sheetExportCsv);
    fs.mkdirSync(path.dirname(DEFAULT_CSV), { recursive: true });
    fs.writeFileSync(DEFAULT_CSV, csvText);
    console.log(`   saved ${DEFAULT_CSV}`);
  } else if (!fs.existsSync(csvPath)) {
    console.log('→ CSV not found locally, fetching...');
    csvText = await fetchUrl(channelConfig.sheetExportCsv);
  } else {
    csvText = fs.readFileSync(csvPath, 'utf8');
  }

  const rows = parseCSV(csvText);
  const data = parseSheet(rows, channelConfig);
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ Wrote ${OUT_PATH}`);
  console.log(`  clients: ${data.clients.length}, week columns: ${data.weekColumns.filter(c => c.kind === 'week').length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
