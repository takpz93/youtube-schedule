const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const STORAGE_KEY = 'yt_v7';
const LEGACY_STORAGE_KEYS = ['yt_v6', 'yt_v5', 'yt_v4'];
const VIEWER_KEY = 'yt_viewer';
const VIEW_MODE_KEY = 'yt_view_mode';
const MINE_ONLY_KEY = 'yt_mine_only';
const SYNC_META_KEY = 'yt_sync_meta';
const OPTIONS_STORAGE_KEY = 'yt_options_v1';
const SHOOTING_STORAGE_KEY = 'yt_shooting_v1';
const SHARED_DATA_URL = 'data/schedule.json';
const SUBSCRIBERS_DATA_URL = 'data/subscribers.json';
const APP_VERSION = '20260724a';
const CANONICAL_URL = 'https://takpz93.github.io/youtube-schedule/';
const TEAM_VIEW_URL = `${CANONICAL_URL}?view=1&tab=week`;
const GITHUB_REPO = 'takpz93/youtube-schedule';
const GITHUB_SCHEDULE_PATH = 'data/schedule.json';
const GITHUB_SYNC_TOKEN_KEY = 'yt_gh_sync';
const VIEWER_POLL_MS = 15000;
/** 最終投稿日から撮影期限までの日数（週本数 → 日数） */
const SHOOT_DEADLINE_DAYS = { 1: 14, 2: 18 };

const STATUS_OPTIONS = [
  '企画', '撮影', '施工', '台本', 'FB（施工・台本）', 'アフレコ', '初稿', 'FB', '修正',
  '完成', 'M提出', 'C提出', '投稿', 'クローズ', 'ボツ',
];

const DONE_STATUSES = new Set(['投稿', 'クローズ', 'ボツ']);

const NEXT_ACTION = {
  '企画': '企画を進める', '撮影': '撮影・収録', '施工': '施工対応', '台本': '台本制作',
  'FB（施工・台本）': 'FB（施工・台本）', 'アフレコ': 'アフレコ', '初稿': '初稿チェック',
  'FB': 'FB対応', '修正': '修正対応', '完成': '投稿準備',
  'M提出': 'M提出', 'C提出': 'C提出', '投稿': '—', 'クローズ': '—', 'ボツ': '—',
};

const LEGACY_STATUS_MAP = {
  '未着手': '企画', '企画中': '企画', '企画共有': '企画',
  '撮影待ち': '撮影', 'カット稿': '台本', '初稿待ち': '初稿',
  'アフレコ': 'アフレコ', 'アフ共有': 'アフレコ',
  'FB中': 'FB', 'FB(カ台)': 'FB（施工・台本）', 'FB（施台）': 'FB（施工・台本）',
  '修正中': '修正', 'M提出中': 'M提出', '共有': 'M提出',
  'C提出中': 'C提出', '投稿済み': '投稿',
};

const CHANNELS = ['BPP','KINS','iStory','綿久','天領盃','SUMISYOU','みうらくんと管理人','ゆぴ優','千勝会','Actvision'];

const STAFF_OPTIONS = [
  '吉田さん(MEK)', '吉田さん', '松金さん', 'MEK', '小島さん', '加畑さん(MEK)', '長尾さん',
  '三浦', '上田さん', '冨永さん(MEK)', '小川さん', '松村さん', '梅澤さん', '至さん', '三谷さん(MEK)', 'YH',
];

const DEFAULT_VIDEO_TYPES = ['通常', 'ショート'];

const TYPE_CHIP_FG = {
  '通常': '#1c3557',
  'ショート': '#b45309',
};

const CH_BG = {
  BPP:'#FADBD8', KINS:'#D5F5E3', iStory:'#D6EAF8',
  '綿久':'#FEF9E7', '天領盃':'#E8DAEF', SUMISYOU:'#D1F2EB',
  'みうらくんと管理人':'#FDE8D0', 'ゆぴ優':'#FCE4EC', '千勝会':'#E8F5E9',
  'Actvision':'#E8EAF6'
};
const CH_FG = {
  BPP:'#C0392B', KINS:'#1E8449', iStory:'#1A5276',
  '綿久':'#7D6608', '天領盃':'#6C3483', SUMISYOU:'#0E6655',
  'みうらくんと管理人':'#A04000', 'ゆぴ優':'#AD1457', '千勝会':'#2E7D32',
  'Actvision':'#283593'
};

const STAGES = [
  { id:'kikaku',     name:'企画',       abbr:'企',   rule:{ type:'shoot', offset:-7 },  bg:'#4472C4', fg:'#fff' },
  { id:'satsuei',    name:'撮影',       abbr:'撮',   rule:{ type:'manual' },            bg:'#ED7D31', fg:'#fff' },
  { id:'shikou',     name:'施工',       abbr:'施',   rule:{ type:'shoot', offset:4 },   bg:'#A0522D', fg:'#fff' },
  { id:'daihon',     name:'台本',       abbr:'台',   rule:{ type:'shoot', offset:8 },   bg:'#FEF9C3', fg:'#713F12' },
  { id:'fb_shitai',  name:'FB（施工・台本）', abbr:'施台', rule:{ type:'shoot', offset:10 },  bg:'#FECACA', fg:'#B91C1C' },
  { id:'afureko',    name:'アフレコ',   abbr:'アフ', rule:{ type:'manual' },            bg:'#FCE7F3', fg:'#9D174D' },
  { id:'shoko',      name:'初稿',       abbr:'初',   rule:{ type:'post', offset:-14 }, bg:'#FFC000', fg:'#333' },
  { id:'fb',         name:'FB',         abbr:'FB',   rule:{ type:'post', offset:-12 }, bg:'#7DD3FC', fg:'#0C4A6E' },
  { id:'shuusei',    name:'修正',       abbr:'修',   rule:{ type:'post', offset:-10 }, bg:'#7030A0', fg:'#fff' },
  { id:'kansei',     name:'完成',       abbr:'完',   rule:{ type:'post', offset:-8 },  bg:'#00B050', fg:'#fff' },
  { id:'m_teishutsu',name:'M提出',      abbr:'M',    rule:{ type:'post', offset:-7 },  bg:'#0070C0', fg:'#fff' },
  { id:'c_teishutsu',name:'C提出',      abbr:'C',    rule:{ type:'post', offset:-4 },  bg:'#00B050', fg:'#fff' },
  { id:'toukou',     name:'投稿',       abbr:'投',   rule:{ type:'post', offset:0 },   bg:'#C0392B', fg:'#fff' },
];

const DEFAULT_ENABLED_STAGE_IDS = STAGES.map(s => s.id);

/** 投稿基準オフセット（M提出あり） */
const POST_PUBLISH_OFFSETS_WITH_M = Object.fromEntries(
  STAGES.filter(s => s.rule.type === 'post').map(s => [s.id, s.rule.offset])
);

/** 投稿基準オフセット（M提出なし: 初稿〜完成を3日ずつ前倒し） */
const POST_PUBLISH_OFFSETS_NO_M = {
  ...POST_PUBLISH_OFFSETS_WITH_M,
  shoko: -11,
  fb: -9,
  shuusei: -7,
  kansei: -5,
};

function usesMPublishOffsets(p) {
  return isStageEnabled(p, 'm_teishutsu');
}

function getPostPublishOffset(p, stageId) {
  const map = usesMPublishOffsets(p) ? POST_PUBLISH_OFFSETS_WITH_M : POST_PUBLISH_OFFSETS_NO_M;
  return map[stageId];
}

function getPublishAnchor(p) {
  if (!p) return null;
  return parseDate(p.postDate);
}

function getFormPublishAnchor() {
  return parseDate(document.getElementById('f-date')?.value);
}

function syncPublishAnchorFields(p) {
  if (!p?.manualStageDates) return;
  if (!isUserSet(p, 'stage.toukou')) delete p.manualStageDates.toukou;
}

// ── 手動入力フィールドの保護（自動計算・同期で上書きしない）────────────────
function ensureUserSet(p) {
  if (!p._userSet) {
    p._userSet = {
      postDate: !!p.postDate,
      postMark: !!p.postMark,
      currentStatus: true,
      material: !!p.material,
      stages: {},
    };
    Object.keys(p.manualStageDates || {}).forEach(k => {
      p._userSet.stages[k] = true;
    });
    if (p.postDate) p._userSet.stages.toukou = true;
  }
  return p._userSet;
}

function markUserSet(p, field) {
  if (!p) return;
  const us = ensureUserSet(p);
  if (field.startsWith('stage.')) {
    const id = field.slice(6);
    if (!us.stages) us.stages = {};
    us.stages[id] = true;
  } else {
    us[field] = true;
  }
}

function isUserSet(p, field) {
  if (!p?._userSet) return false;
  if (field.startsWith('stage.')) {
    return !!p._userSet.stages?.[field.slice(6)];
  }
  return !!p._userSet[field];
}

function mergeManualStageDatesForProject(p, fromForm) {
  const merged = { ...(p.manualStageDates || {}) };
  Object.entries(fromForm || {}).forEach(([k, v]) => {
    if (v) {
      merged[k] = v;
      markUserSet(p, `stage.${k}`);
    }
  });
  // 手動設定済みの日付は、フォームに空欄でも維持
  Object.keys(p.manualStageDates || {}).forEach(k => {
    if (isUserSet(p, `stage.${k}`) && !fromForm?.[k] && p.manualStageDates[k]) {
      merged[k] = p.manualStageDates[k];
    }
  });
  return merged;
}

const LEGACY_STAGE_NAMES = {
  '企画確認':'企画', '撮影/収録':'撮影', 'C提出/完成':'C提出',
  'FB（施台）':'FB（施工・台本）', 'FB(カ台)':'FB（施工・台本）',
};

const STAGE_STATUSES = ['未着手','進行中','完了','遅延','スキップ'];

const SS_STYLE = {
  '未着手':  { bg:'#E5E7EB', fg:'#6B7280' },
  '進行中':  { bg:'#FEF9C3', fg:'#854D0E' },
  '完了':    { bg:'#DCFCE7', fg:'#166534' },
  '遅延':    { bg:'#FEE2E2', fg:'#991B1B' },
  'スキップ':{ bg:'#F3F4F6', fg:'#9CA3AF' },
};

const CS_STYLE = {
  '企画':     { bg:'#DBEAFE', fg:'#1E40AF' },
  '撮影':     { bg:'#FFEDD5', fg:'#9A3412' },
  '施工':     { bg:'#E8D5B7', fg:'#78350F' },
  '台本':     { bg:'#FEF9C3', fg:'#713F12' },
  'FB（施工・台本）': { bg:'#FECACA', fg:'#B91C1C' },
  'アフレコ': { bg:'#FCE7F3', fg:'#9D174D' },
  '初稿':     { bg:'#FEF3C7', fg:'#92400E' },
  'FB':       { bg:'#E0F2FE', fg:'#0369A1' },
  '修正':     { bg:'#F3E8FF', fg:'#6B21A8' },
  '完成':     { bg:'#BBF7D0', fg:'#14532D' },
  'M提出':    { bg:'#E0F2FE', fg:'#075985' },
  'C提出':    { bg:'#DCFCE7', fg:'#166534' },
  '投稿':     { bg:'#E0E7FF', fg:'#3730A3' },
  'クローズ': { bg:'#E5E7EB', fg:'#374151' },
  'ボツ':     { bg:'#374151', fg:'#F9FAFB' },
};

function isActiveStatus(status) {
  return status && !DONE_STATUSES.has(status);
}

function isArchived(p) {
  return !!p.archived;
}

function isArchivable(p) {
  return !isArchived(p);
}

function normalizeCurrentStatus(status) {
  const mapped = LEGACY_STATUS_MAP[status] || status;
  return STATUS_OPTIONS.includes(mapped) ? mapped : '企画';
}

function populateStatusSelects() {
  const sel = document.getElementById('f-status');
  if (sel) sel.innerHTML = STATUS_OPTIONS.map(s => `<option>${s}</option>`).join('');
}

// ── State ─────────────────────────────────────────────────────────────────────
let S = {
  projects: [],
  tab: 'week',
  filterChs: [],
  filterStaff: [],
  filterTypes: [],
  filterSts: [],
  sortBy: 'postDate',
  search: '',
  viewerName: localStorage.getItem(VIEWER_KEY) || '',
  mineOnly: localStorage.getItem(MINE_ONLY_KEY) === '1',
  viewMode: false,
  lockedViewer: false,
  syncMeta: null,
  serverPush: { status: 'idle', lastAt: null, error: null },
  serverSnapshot: null,
  hasUnpublishedChanges: false,
  syncPending: false,
  customOptions: { channels: [], staff: [], types: [] },
  shootingSchedule: {},
};

let serverPushTimer = null;
let serverPushRetryTimer = null;
let serverPushRetries = 0;
const SERVER_PUSH_DEBOUNCE_MS = 800;
const SERVER_PUSH_RETRY_DELAYS = [2000, 5000, 10000];
let viewerPollTimer = null;

/** 一括削除用の選択ID（タブ切替後も維持） */
const selectedIds = new Set();

function pruneSelectedIds() {
  const valid = new Set(S.projects.map(p => p.id));
  selectedIds.forEach(id => { if (!valid.has(id)) selectedIds.delete(id); });
}

function updateBulkBar() {
  const btn = document.getElementById('btn-bulk-delete');
  const archiveBtn = document.getElementById('btn-bulk-archive');
  const unarchiveBtn = document.getElementById('btn-bulk-unarchive');
  const label = document.getElementById('bulk-delete-count');
  const n = selectedIds.size;
  if (btn) btn.disabled = n === 0;
  const selected = S.projects.filter(p => selectedIds.has(p.id));
  if (archiveBtn) {
    archiveBtn.disabled = n === 0 || !selected.some(isArchivable);
  }
  if (unarchiveBtn) {
    unarchiveBtn.disabled = n === 0 || !selected.some(isArchived);
  }
  if (label) label.textContent = n ? `${n}件選択中` : '';
  syncSelectAllCheckbox();
}

function syncSelectAllCheckbox() {
  const projects = filtered();
  const visibleIds = projects.map(p => p.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const someSelected = visibleIds.some(id => selectedIds.has(id));
  document.querySelectorAll('.chk-select-all').forEach(cb => {
    cb.checked = allSelected;
    cb.indeterminate = someSelected && !allSelected;
  });
}

function onRowCheck(id, checked) {
  if (checked) selectedIds.add(id);
  else selectedIds.delete(id);
  updateBulkBar();
}

function toggleSelectAll(checked) {
  filtered().forEach(p => {
    if (checked) selectedIds.add(p.id);
    else selectedIds.delete(p.id);
  });
  document.querySelectorAll('.row-chk').forEach(cb => { cb.checked = checked; });
  updateBulkBar();
}

function deleteSelectedProjects() {
  if (!canEdit()) return;
  const n = selectedIds.size;
  if (!n) return;
  if (!confirm(`${n}件の案件を削除しますか？この操作は取り消せません。`)) return;
  S.projects = S.projects.filter(p => !selectedIds.has(p.id));
  selectedIds.clear();
  persist();
  render();
}

function archiveSelectedProjects() {
  if (!canEdit()) return;
  const toArchive = S.projects.filter(p => selectedIds.has(p.id) && !isArchived(p));
  if (!toArchive.length) return;
  if (!confirm(`${toArchive.length}件をクローズ済タブへ移動しますか？`)) return;
  const at = new Date().toISOString();
  toArchive.forEach(p => {
    p.archived = true;
    p.archivedAt = at;
  });
  selectedIds.clear();
  persist();
  switchTab('closed');
}

function unarchiveSelectedProjects() {
  if (!canEdit()) return;
  const selected = S.projects.filter(p => selectedIds.has(p.id) && isArchived(p));
  if (!selected.length) return;
  if (!confirm(`${selected.length}件をアクティブな一覧に戻しますか？`)) return;
  selected.forEach(p => {
    p.archived = false;
    p.archivedAt = null;
  });
  selectedIds.clear();
  persist();
  render();
}

function buildBulkBar() {
  const bar = document.createElement('div');
  bar.className = 'bulk-bar';
  bar.id = 'bulk-delete-bar';
  if (!canEdit()) {
    bar.hidden = true;
    return bar;
  }
  if (S.tab === 'closed') {
    bar.innerHTML = `
      <button type="button" class="btn btn-danger btn-sm" id="btn-bulk-delete" disabled onclick="deleteSelectedProjects()">🗑 削除</button>
      <button type="button" class="btn btn-archive btn-sm" id="btn-bulk-unarchive" disabled onclick="unarchiveSelectedProjects()" title="アクティブな一覧に戻す">↩ 戻す</button>
      <span id="bulk-delete-count" class="bulk-delete-count"></span>
    `;
  } else {
    bar.innerHTML = `
      <button type="button" class="btn btn-danger btn-sm" id="btn-bulk-delete" disabled onclick="deleteSelectedProjects()">🗑 削除</button>
      <button type="button" class="btn btn-archive btn-sm" id="btn-bulk-archive" disabled onclick="archiveSelectedProjects()" title="選択した案件をアーカイブ">📦 アーカイブ</button>
      <span id="bulk-delete-count" class="bulk-delete-count"></span>
    `;
  }
  return bar;
}

function appendRowCheckbox(tr, p, bg) {
  const td = tr.insertCell();
  td.className = 'sc c-chk';
  td.style.background = bg;
  if (canEdit()) {
    const checked = selectedIds.has(p.id) ? ' checked' : '';
    td.innerHTML = `<input type="checkbox" class="row-chk" data-id="${p.id}"${checked} onchange="onRowCheck('${p.id}', this.checked)" aria-label="選択">`;
  }
}

function appendSelectAllHeader(hr) {
  const th = document.createElement('th');
  th.className = 'c-chk sc th';
  if (canEdit()) {
    th.innerHTML = '<input type="checkbox" class="chk-select-all" onchange="toggleSelectAll(this.checked)" aria-label="すべて選択" title="表示中の案件をすべて選択">';
  }
  hr.appendChild(th);
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };
const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
const fmtDate = d => d ? `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}` : '';
const fmtMD   = d => d ? `${d.getMonth()+1}/${d.getDate()}` : '';
const parseDate = s => {
  if (!s) return null;
  if (s instanceof Date) {
    const d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
    return isNaN(d) ? null : d;
  }
  const str = String(s).trim();
  // ISO日時は日付部分のみ使用（UTC時刻によるずれ防止）
  const isoPrefix = str.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoPrefix) {
    const d = new Date(+isoPrefix[1], +isoPrefix[2] - 1, +isoPrefix[3]);
    return isNaN(d) ? null : d;
  }
  // 日付のみ（input type=date / 保存形式）— ローカル暦として解釈
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  }
  // ISO日時など — ローカル暦の年月日に正規化（UTCの日付部分だけ拾わない）
  const d = new Date(str);
  if (isNaN(d)) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const weekday = ['日','月','火','水','木','金','土'];

function dateToInput(d) {
  if (!d) return '';
  const x = d instanceof Date ? d : parseDate(d);
  if (!x) return '';
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

function getStageById(id) {
  return STAGES.find(s => s.id === id);
}

function isStageEnabled(p, stageId) {
  const ids = p.enabledStages || DEFAULT_ENABLED_STAGE_IDS;
  return ids.includes(stageId);
}

function getEnabledStages(p) {
  const ids = p.enabledStages || DEFAULT_ENABLED_STAGE_IDS;
  return STAGES.filter(s => ids.includes(s.id));
}

function getShootAnchor(p) {
  const raw = p.manualStageDates?.satsuei;
  if (!raw) return null;
  return parseDate(raw);
}

function computeStageDate(p, stage) {
  if (!isStageEnabled(p, stage.id)) return null;

  // 投稿工程は常に投稿予定日と一致（手入力は使わない）
  if (stage.id === 'toukou') {
    return getPublishAnchor(p);
  }

  const manual = p.manualStageDates?.[stage.id];
  if (manual) {
    const d = parseDate(manual);
    if (d) return d;
  }

  if (stage.rule.type === 'manual') return null;

  if (stage.rule.type === 'shoot') {
    const shoot = getShootAnchor(p);
    if (!shoot) return null;
    return addDays(shoot, stage.rule.offset);
  }

  if (stage.rule.type === 'post') {
    const anchor = getPublishAnchor(p);
    if (!anchor) return null;
    const offset = getPostPublishOffset(p, stage.id);
    if (offset === undefined) return null;
    return addDays(anchor, offset);
  }

  return null;
}

function projectStageSchedule(p) {
  return getEnabledStages(p).map(stage => {
    const date = computeStageDate(p, stage);
    if (!date) return null;
    return {
      ...stage,
      date,
      isManual: stage.id === 'toukou' ? false : !!p.manualStageDates?.[stage.id],
    };
  }).filter(Boolean);
}

function defaultStageStatuses() {
  return Object.fromEntries(STAGES.map(s => [s.name, '未着手']));
}

function normalizeProject(p) {
  p.postDate = parseDate(p.postDate);
  if (!p.enabledStages?.length) p.enabledStages = DEFAULT_ENABLED_STAGE_IDS.slice();
  if (!p.manualStageDates) p.manualStageDates = {};
  ensureUserSet(p);
  syncPublishAnchorFields(p);
  Object.keys(p.manualStageDates).forEach(k => {
    const v = p.manualStageDates[k];
    const parsed = parseDate(v);
    if (parsed) p.manualStageDates[k] = dateToInput(parsed);
    else if (v instanceof Date) p.manualStageDates[k] = dateToInput(v);
  });
  if (p.shootDate && !isUserSet(p, 'stage.satsuei')) {
    p.manualStageDates.satsuei = dateToInput(p.shootDate);
    delete p.shootDate;
  }
  const ss = p.stageStatuses || {};
  const migrated = {};
  Object.entries(ss).forEach(([k, v]) => {
    migrated[LEGACY_STAGE_NAMES[k] || k] = v;
  });
  STAGES.forEach(s => { if (!migrated[s.name]) migrated[s.name] = '未着手'; });
  p.stageStatuses = migrated;
  p.currentStatus = normalizeCurrentStatus(p.currentStatus);
  if (p.postMark !== '済' && p.postMark !== '制作' && p.postMark !== 'ボツ') delete p.postMark;
  p.archived = !!p.archived;
  if (p.archived && !p.archivedAt) p.archivedAt = null;
  return p;
}

/** localStorage / エクスポート用: Date を YYYY-MM-DD 文字列に固定（UTCずれ防止） */
function serializeProject(p) {
  const manuals = {};
  Object.entries(p.manualStageDates || {}).forEach(([k, v]) => {
    if (!v) return;
    const parsed = parseDate(v);
    manuals[k] = parsed ? dateToInput(parsed) : String(v);
  });
  return {
    ...p,
    postDate: p.postDate ? dateToInput(p.postDate) : null,
    manualStageDates: manuals,
    _userSet: p._userSet || undefined,
  };
}

function serializeProjects() {
  return S.projects.map(serializeProject);
}

/** 管理番号（全体）と投稿番号（クライアント内・投稿日順）を自動採番 */
function renumberProjects() {
  S.projects.forEach((p, i) => { p.no = i + 1; });

  const byChannel = {};
  S.projects.forEach(p => {
    if (!p.channel) return;
    if (!byChannel[p.channel]) byChannel[p.channel] = [];
    byChannel[p.channel].push(p);
  });

  Object.values(byChannel).forEach(list => {
    list.sort((a, b) => {
      if (!a.postDate && !b.postDate) return a.no - b.no;
      if (!a.postDate) return 1;
      if (!b.postDate) return -1;
      const d = a.postDate - b.postDate;
      if (d !== 0) return d;
      return a.no - b.no;
    });
    list.forEach((p, i) => { p.postOrder = i + 1; });
  });
}

function channelSortIndex(ch) {
  const i = getChannelList().indexOf(ch);
  return i >= 0 ? i : 999;
}

function compareClientOrder(a, b) {
  const ca = channelSortIndex(a.channel);
  const cb = channelSortIndex(b.channel);
  if (ca !== cb) return ca - cb;
  if (!a.postDate && !b.postDate) {
    const po = (a.postOrder || 9999) - (b.postOrder || 9999);
    return po !== 0 ? po : (a.no || 0) - (b.no || 0);
  }
  if (!a.postDate) return 1;
  if (!b.postDate) return -1;
  const d = a.postDate - b.postDate;
  if (d !== 0) return d;
  const po = (a.postOrder || 0) - (b.postOrder || 0);
  return po !== 0 ? po : (a.no || 0) - (b.no || 0);
}

function sortByClientOrder(list) {
  list.sort(compareClientOrder);
}

function sortByPostDate(list) {
  list.sort((a, b) => {
    if (!a.postDate && !b.postDate) {
      const po = (a.postOrder || 9999) - (b.postOrder || 9999);
      return po !== 0 ? po : (a.no || 0) - (b.no || 0);
    }
    if (!a.postDate) return 1;
    if (!b.postDate) return -1;
    const d = a.postDate - b.postDate;
    if (d !== 0) return d;
    const po = (a.postOrder || 0) - (b.postOrder || 0);
    return po !== 0 ? po : (a.no || 0) - (b.no || 0);
  });
}

function projectProgress(p) {
  const stages = getEnabledStages(p);
  if (!stages.length) return 0;
  const done = stages.filter(s => p.stageStatuses[s.name] === '完了').length;
  return Math.round(done / stages.length * 100);
}

function canEdit() { return !S.viewMode && !S.lockedViewer; }

function isLockedTeamViewer() {
  return S.lockedViewer || new URLSearchParams(location.search).get('view') === '1';
}

function getJsonBinId() {
  return (typeof window.__YT_JSONBIN_ID__ === 'string' && window.__YT_JSONBIN_ID__) || '';
}

function isJsonBinPublic() {
  return window.__YT_JSONBIN_PUBLIC__ !== false && !!getJsonBinId();
}

function getEmbeddedGhToken() {
  const codes = window.__YT_GH_T__;
  if (!Array.isArray(codes) || !codes.length) return '';
  return String.fromCharCode(...codes);
}

function getGistId() {
  return (typeof window.__YT_GIST_ID__ === 'string' && window.__YT_GIST_ID__) || '';
}

function getGhUser() {
  return (typeof window.__YT_GH_USER__ === 'string' && window.__YT_GH_USER__) || 'takpz93';
}

function getGithubWriteToken() {
  return getEmbeddedGhToken() || localStorage.getItem(GITHUB_SYNC_TOKEN_KEY) || '';
}

function usesCloudSync() {
  return !!(getJsonBinId() || getGistId());
}

function canCloudWrite() {
  if (isJsonBinPublic()) return true;
  return !!(getGistId() && getGithubWriteToken());
}

async function fetchJsonFromUrl(url, label) {
  const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
  return await res.json();
}

async function fetchSharedRaw() {
  const binId = getJsonBinId();
  if (binId) {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      cache: 'no-store',
      headers: { 'X-Bin-Meta': 'false' },
    });
    if (!res.ok) throw new Error(`JSONBin HTTP ${res.status}`);
    return await res.json();
  }

  const tasks = [];
  const gistId = getGistId();
  if (gistId) {
    tasks.push(fetchJsonFromUrl(
      `https://gist.githubusercontent.com/${getGhUser()}/${gistId}/raw/schedule.json`,
      'Gist'
    ));
  }
  tasks.push(fetchJsonFromUrl(SHARED_DATA_URL, 'Pages'));

  const results = await Promise.allSettled(tasks);
  const payloads = results
    .filter(r => r.status === 'fulfilled' && r.value?.projects?.length)
    .map(r => r.value);

  if (!payloads.length) {
    const err = results.find(r => r.status === 'rejected');
    throw err?.reason || new Error('サーバーからデータを取得できません');
  }

  return payloads.reduce((best, cur) => {
    const bestAt = Date.parse(best._meta?.updatedAt || '') || 0;
    const curAt = Date.parse(cur._meta?.updatedAt || '') || 0;
    return curAt >= bestAt ? cur : best;
  });
}

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function isMobileLandscape() {
  return isMobile() && window.matchMedia('(orientation: landscape)').matches;
}

function syncMobileClass() {
  applyMobileEditPolicy();
  document.body.classList.toggle('is-mobile', isMobile());
  document.body.classList.toggle('is-mobile-landscape', isMobileLandscape());
  document.body.classList.toggle('is-mobile-admin', isMobileAdmin());
  syncMobPanelUI();
  applyViewModeUI();
}

const MOB_PANEL_KEY = 'yt_mob_panel_collapsed';

function isMobPanelCollapsed() {
  return localStorage.getItem(MOB_PANEL_KEY) !== '0';
}

function toggleMobPanel() {
  localStorage.setItem(MOB_PANEL_KEY, isMobPanelCollapsed() ? '0' : '1');
  syncMobPanelUI();
}

function updateMobPanelLabel() {
  const el = document.getElementById('mob-panel-label');
  if (!el || !isMobile()) return;
  const bits = [];
  const member = S.mineOnly && S.viewerName
    ? `${S.viewerName}のみ`
    : (S.viewerName || '全員');
  bits.push(member);
  const hasFilter = S.filterChs.length || S.filterStaff.length || S.filterTypes.length || S.filterSts.length;
  if (hasFilter) {
    const f = [];
    if (S.filterChs.length) f.push(`CL${S.filterChs.length}`);
    if (S.filterStaff.length) f.push(`担${S.filterStaff.length}`);
    if (S.filterTypes.length) f.push(`型${S.filterTypes.length}`);
    if (S.filterSts.length) f.push(`状${S.filterSts.length}`);
    bits.push(f.join(' '));
  } else {
    bits.push('すべて');
  }
  if (S.viewMode) bits.push('閲覧');
  el.textContent = bits.join(' · ');
}

function syncMobPanelUI() {
  const panel = document.getElementById('mob-panel');
  const toggle = document.getElementById('mob-panel-toggle');
  if (!panel) return;
  if (!isMobile()) {
    panel.classList.remove('is-collapsed');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    return;
  }
  const collapsed = isMobPanelCollapsed();
  panel.classList.toggle('is-collapsed', collapsed);
  if (toggle) toggle.setAttribute('aria-expanded', String(!collapsed));
  updateMobPanelLabel();
}

function uniqSorted(items) {
  return [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'));
}

function loadCustomOptions() {
  try {
    const raw = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (raw) {
      const o = JSON.parse(raw);
      S.customOptions = {
        channels: Array.isArray(o.channels) ? o.channels.filter(Boolean) : [],
        staff: Array.isArray(o.staff) ? o.staff.filter(Boolean) : [],
        types: Array.isArray(o.types) ? o.types.filter(Boolean) : [],
      };
      return;
    }
  } catch (e) {}
  S.customOptions = { channels: [], staff: [], types: [] };
}

function saveCustomOptions() {
  localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(S.customOptions));
}

function applyCustomOptions(options, { persistLocal = true } = {}) {
  if (!options) return;
  S.customOptions = {
    channels: Array.isArray(options.channels) ? options.channels.filter(Boolean) : [],
    staff: Array.isArray(options.staff) ? options.staff.filter(Boolean) : [],
    types: Array.isArray(options.types) ? options.types.filter(Boolean) : [],
  };
  if (persistLocal && !isLockedTeamViewer()) saveCustomOptions();
}

function getChannelList() {
  const extras = uniqSorted([
    ...S.customOptions.channels,
    ...S.projects.map(p => p.channel),
  ].filter(ch => ch && !CHANNELS.includes(ch)));
  return [...CHANNELS, ...extras];
}

function getStaffOptions() {
  const extras = uniqSorted([
    ...S.customOptions.staff,
    ...S.projects.map(p => p.staff),
  ].filter(s => s && !STAFF_OPTIONS.includes(s)));
  return [...STAFF_OPTIONS, ...extras];
}

function getVideoTypeList() {
  const extras = uniqSorted([
    ...S.customOptions.types,
    ...S.projects.map(p => p.type),
  ].filter(t => t && !DEFAULT_VIDEO_TYPES.includes(t)));
  return [...DEFAULT_VIDEO_TYPES, ...extras];
}

function getStaffList() {
  return getStaffOptions();
}

function fillSelect(select, items, value, withEmpty = true) {
  if (!select) return;
  const cur = value !== undefined ? value : select.value;
  select.innerHTML = (withEmpty ? '<option value="">選択</option>' : '')
    + items.map(v => `<option value="${escAttr(v)}">${escAttr(v)}</option>`).join('');
  ensureSelectOption(select, cur);
  if (cur) select.value = cur;
}

function populateFormSelects(preserve = {}) {
  fillSelect(document.getElementById('f-channel'), getChannelList(), preserve.channel);
  fillSelect(document.getElementById('f-staff'), getStaffOptions(), preserve.staff);
  fillSelect(document.getElementById('f-type'), getVideoTypeList(), preserve.type, false);
}

function addCustomOption(kind) {
  if (!canEdit()) return;
  const inputId = { channel: 'f-channel-new', staff: 'f-staff-new', type: 'f-type-new' }[kind];
  const selectId = { channel: 'f-channel', staff: 'f-staff', type: 'f-type' }[kind];
  const key = { channel: 'channels', staff: 'staff', type: 'types' }[kind];
  const defaults = { channel: CHANNELS, staff: STAFF_OPTIONS, type: DEFAULT_VIDEO_TYPES }[kind];

  const input = document.getElementById(inputId);
  const val = (input?.value || '').trim();
  if (!val) {
    input?.focus();
    return;
  }

  if (!defaults.includes(val) && !S.customOptions[key].includes(val)) {
    S.customOptions[key].push(val);
    saveCustomOptions();
  }

  populateFormSelects({ [kind]: val });
  const select = document.getElementById(selectId);
  if (select) select.value = val;
  if (input) input.value = '';
  renderViewerSelect();
  render();
}

function clearAddOptionInputs() {
  ['f-channel-new', 'f-staff-new', 'f-type-new'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function matchesViewer(p) {
  if (!S.mineOnly || !S.viewerName) return true;
  return p.staff === S.viewerName;
}

/** 三浦対応待ちキュー用：担当フィルター（自分のみ）を無視し、三浦の対応が必要な案件を全員分表示 */
function matchesWaitingFilters(p) {
  if (isArchived(p) || p.currentStatus === 'ボツ') return false;
  const q = (S.search || '').trim().toLowerCase();
  const ok1 = S.filterChs.length === 0 || S.filterChs.includes(p.channel);
  const ok2 = S.filterSts.length === 0 || S.filterSts.some(st =>
    st === 'active'
      ? isActiveStatus(p.currentStatus)
      : p.currentStatus === st
  );
  const ok3 = !q || [p.title, p.channel, p.staff, p.currentStatus, p.type, String(p.postOrder || '')]
    .some(v => String(v || '').toLowerCase().includes(q));
  const ok4 = S.filterStaff.length === 0 || S.filterStaff.includes(p.staff);
  const ok6 = S.filterTypes.length === 0 || S.filterTypes.includes(p.type || '通常');
  return ok1 && ok2 && ok3 && ok4 && ok6;
}

function nextAction(status) {
  return NEXT_ACTION[status] || status || '確認';
}

function applyProjects(data, { persistLocal = true, source = 'local' } = {}) {
  S.projects = data.map(p => normalizeProject({
    ...p,
    postDate: parseDate(p.postDate),
  }));
  renumberProjects();
  if (persistLocal && !isLockedTeamViewer()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProjects()));
    if (source === 'local') {
      markLocalGuard();
      const meta = {
        updatedAt: new Date().toISOString(),
        updatedBy: 'local',
        version: 1,
      };
      localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
      S.syncMeta = meta;
      persistShootingSchedule();
      S.hasUnpublishedChanges = true;
      scheduleServerPush();
    }
  }
}

function updateSyncStatus() {
  const el = document.getElementById('sync-status');
  if (!el) return;
  const meta = S.syncMeta || JSON.parse(localStorage.getItem(SYNC_META_KEY) || 'null');
  const ver = `v${APP_VERSION}`;
  const archived = countArchivedProjects(S.projects);
  let pushHint = '';
  if (isLockedTeamViewer()) {
    pushHint = ' · 👥チーム閲覧 · 自動更新';
  } else if (S.serverPush.status === 'pushing') {
    pushHint = ' · ☁️ 同期中…';
  } else if (S.serverPush.status === 'error') {
    pushHint = ' · ☁️ 同期失敗';
  } else if (canCloudWrite() && S.serverPush.lastAt) {
    const d = new Date(S.serverPush.lastAt);
    pushHint = ` · ☁️ 自動反映済 ${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  } else if (canCloudWrite()) {
    pushHint = ' · ☁️ 自動反映ON';
  }
  const guard = !isLockedTeamViewer() && isLocalGuarded() ? ' · 🔒手動保護' : '';
  const device = isLockedTeamViewer() ? '' : (isMobile() ? ' · 📱この端末' : ' · 💻この端末');
  if (meta?.updatedAt) {
    const d = new Date(meta.updatedAt);
    const by = meta.updatedBy === 'local' ? (isLockedTeamViewer() ? 'サーバー' : 'ローカル保存') : meta.updatedBy;
    el.textContent = `${ver}${pushHint}${guard}${device} · ${by}: ${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} · ${S.projects.length}件（クローズ済${archived}）`;
  } else {
    el.textContent = location.protocol === 'file:'
      ? `${ver}${guard}${device} · ⚠️ file:// — 正規URLを使ってください`
      : `${ver}${pushHint}${guard}${device} · ${S.projects.length}件`;
  }
  updateWorkspaceNotice();
}

function updateWorkspaceNotice() {
  const el = document.getElementById('workspace-notice');
  if (!el) return;
  const onCanonical = location.hostname === 'takpz93.github.io';
  const dismissed = localStorage.getItem('yt_ws_notice_dismiss') === APP_VERSION;

  if (isLockedTeamViewer()) {
    el.hidden = false;
    const age = formatDataAge(S.syncMeta?.updatedAt);
    const stale = isDataStale(S.syncMeta?.updatedAt, 6);
    el.className = 'workspace-notice is-team' + (stale ? ' is-stale' : '');
    el.innerHTML = stale
      ? `⚠️ <strong>データが古い可能性</strong>（最終更新: ${age}）— <button type="button" class="ws-notice-dismiss" onclick="loadSharedData()">🔄 今すぐ更新</button> <button type="button" class="ws-notice-dismiss" onclick="forceViewerRefresh()">♻️ 強制更新</button>`
      : `👥 <strong>チーム閲覧</strong> — データ更新: ${age} · 15秒ごとに自動更新 · <button type="button" class="ws-notice-dismiss" onclick="loadSharedData()">🔄 更新</button> <button type="button" class="ws-notice-dismiss" onclick="forceViewerRefresh()">♻️ 強制更新</button>`;
    return;
  }

  if (!isLockedTeamViewer() && S.serverPush.status === 'pushing') {
    el.hidden = false;
    el.className = 'workspace-notice is-team';
    el.innerHTML = `☁️ <strong>チームへ自動反映中…</strong>（編集は2秒以内にスマホ・メンバーへ届きます）`;
    return;
  }

  if (!isLockedTeamViewer() && S.syncPending && canCloudWrite()) {
    el.hidden = false;
    el.className = 'workspace-notice is-team';
    el.innerHTML = `☁️ <strong>チームへ自動反映待ち…</strong>`;
    return;
  }

  if (!isLockedTeamViewer() && !canCloudWrite() && location.protocol !== 'file:') {
    el.hidden = false;
    el.className = 'workspace-notice is-warn';
    el.innerHTML = `⚠️ <strong>自動反映が未設定</strong> — ⚙️ 同期でトークンを設定すると編集が自動でチームに届きます`;
    return;
  }

  if (!isLockedTeamViewer() && S.serverPush.status === 'error') {
    el.hidden = false;
    el.className = 'workspace-notice is-warn';
    el.innerHTML = `⚠️ <strong>チームへの自動反映に失敗</strong> — ${escHtml(S.serverPush.error || '不明なエラー')} · 自動で再試行します · <button type="button" class="ws-notice-dismiss" onclick="publishToTeam()">🔄 今すぐ再試行</button>`;
    return;
  }

  if (!isLockedTeamViewer() && S.hasUnpublishedChanges) {
    el.hidden = false;
    el.className = 'workspace-notice is-warn';
    const age = formatDataAge(S.syncMeta?.updatedAt);
    el.innerHTML = `⚠️ <strong>チームに未反映の編集があります</strong>（${age}）— <button type="button" class="ws-notice-dismiss" onclick="publishToTeam()">🔄 再試行</button>`;
    return;
  }

  updatePublishButton();

  el.hidden = (onCanonical && dismissed) || location.protocol === 'file:';
  if (location.protocol === 'file:') {
    el.hidden = false;
    el.className = 'workspace-notice is-warn';
    el.innerHTML = `⚠️ ローカルファイルで開いています。データはこのPCだけに保存され、スマホと共有されません。<a href="${CANONICAL_URL}" target="_blank" rel="noopener">正規URLを開く</a>`;
  } else if (!onCanonical) {
    el.hidden = false;
    el.className = 'workspace-notice is-warn';
    el.innerHTML = `⚠️ 正規URL以外で開いています。ブックマークは <a href="${CANONICAL_URL}">${CANONICAL_URL}</a> にしてください。`;
  } else {
    el.className = 'workspace-notice';
    el.innerHTML = isMobile()
      ? `📱 <strong>スマホ編集モード</strong> — 工程タップ・✏️で編集 · 変更は自動でチームに反映`
      : `📌 管理者URL · 編集は自動でチームに反映 · <button type="button" class="ws-notice-dismiss" onclick="dismissWorkspaceNotice()">閉じる</button>`;
  }
}

function forceViewerRefresh() {
  const u = new URL(location.href);
  u.searchParams.set('_v', APP_VERSION);
  u.searchParams.set('_rt', String(Date.now()));
  location.replace(u.toString());
}

window.forceViewerRefresh = forceViewerRefresh;

function updatePublishButton() {
  const btn = document.getElementById('btn-publish');
  if (!btn) return;
  btn.hidden = true;
}

function dismissWorkspaceNotice() {
  if (isServerMismatch()) return;
  localStorage.setItem('yt_ws_notice_dismiss', APP_VERSION);
  const el = document.getElementById('workspace-notice');
  if (el) el.hidden = true;
}

function renderViewerSelect() {
  const sel = document.getElementById('viewer-select');
  if (!sel) return;
  const staff = getStaffList();
  sel.innerHTML = '<option value="">全員（チーム全体）</option>' +
    staff.map(s => `<option value="${s.replace(/"/g,'&quot;')}">${s}</option>`).join('');
  sel.value = S.viewerName;
  const chip = document.getElementById('chip-mine');
  if (chip) {
    chip.classList.toggle('active', S.mineOnly);
    chip.style.display = S.viewerName ? 'inline-block' : 'none';
  }
}

function onViewerChange(name) {
  S.viewerName = name;
  localStorage.setItem(VIEWER_KEY, name);
  if (!name) S.mineOnly = false;
  localStorage.setItem(MINE_ONLY_KEY, S.mineOnly ? '1' : '0');
  renderViewerSelect();
  render();
}

function toggleMineOnly() {
  if (!S.viewerName) return;
  S.mineOnly = !S.mineOnly;
  localStorage.setItem(MINE_ONLY_KEY, S.mineOnly ? '1' : '0');
  renderViewerSelect();
  render();
}

function toggleViewMode() {
  if (S.lockedViewer) return;
  if (isMobile()) return;
  S.viewMode = !S.viewMode;
  localStorage.setItem(VIEW_MODE_KEY, S.viewMode ? '1' : '0');
  applyViewModeUI();
  render();
}

function copyTeamViewLink() {
  const url = TEAM_VIEW_URL;
  navigator.clipboard.writeText(url).then(() => {
    alert(`チーム閲覧リンクをコピーしました。\n\n${url}\n\nメンバーはこのURLをブックマークしてください。\n（編集不可・30秒ごとに自動更新）`);
  }).catch(() => {
    prompt('チーム閲覧リンクをコピーしてください', url);
  });
}

function openSyncSettings() {
  if (getEmbeddedGhToken() || isJsonBinPublic()) {
    alert('自動同期は有効です。追加設定は不要です。');
    return;
  }
  const cur = localStorage.getItem(GITHUB_SYNC_TOKEN_KEY) || '';
  const token = prompt(
    'GitHub 書き込みトークン\n\nターミナル: gh auth token',
    cur ? '********' : ''
  );
  if (token === null || token === '********') return;
  if (token.trim()) {
    localStorage.setItem(GITHUB_SYNC_TOKEN_KEY, token.trim());
    publishToTeam();
  } else {
    localStorage.removeItem(GITHUB_SYNC_TOKEN_KEY);
  }
  updateSyncStatus();
}

function applyViewModeUI() {
  document.body.classList.toggle('view-mode', S.viewMode || S.lockedViewer);
  const banner = document.getElementById('view-banner');
  const btn = document.getElementById('btn-view-mode');
  const btnSync = document.getElementById('btn-sync');
  const locked = S.lockedViewer;
  if (banner) {
    banner.hidden = !(S.viewMode || locked);
    if (locked) {
      const adminBtn = isMobile()
        ? ' · <button type="button" class="sg-tab-link" onclick="goAdminEditUrl()">✏️ 編集用URLへ</button>'
        : '';
      banner.innerHTML = `👥 <strong>チーム閲覧</strong> — 編集・追加はできません。${adminBtn}`;
    } else {
      banner.innerHTML = '👁 <strong>閲覧モード</strong> — 進捗の変更・案件の追加はできません。更新が必要な場合は管理者に連絡してください。';
    }
  }
  if (btn) {
    btn.hidden = locked || isMobile();
    btn.textContent = S.viewMode ? '✏️ 編集' : '👁 閲覧';
    btn.title = S.viewMode ? '編集モードに切替' : '閲覧モード（誤操作防止）';
  }
  if (btnSync) {
    btnSync.textContent = locked ? '🔄 更新' : '📡 サーバー確認';
    btnSync.title = locked
      ? 'サーバーから最新データを取得'
      : 'サーバー件数の確認のみ（ローカルの手動変更は上書きしません）';
  }
  const hint = document.getElementById('legend-hint');
  if (hint) hint.textContent = (S.viewMode || locked)
    ? '閲覧のみ · 赤枠 = 工程の期限超過'
    : 'セルをクリックで進捗更新 · 赤枠 = 工程の期限超過';
}

function copyShareLink() {
  const params = new URLSearchParams();
  if (S.viewerName) params.set('staff', S.viewerName);
  if (S.mineOnly) params.set('mine', '1');
  if (S.filterChs.length) params.set('ch', S.filterChs.join(','));
  if (S.filterTypes.length) params.set('type', S.filterTypes.join(','));
  if (S.viewMode) params.set('view', '1');
  if (S.tab && S.tab !== 'week') params.set('tab', S.tab);
  const base = location.href.split('?')[0].split('#')[0];
  const url = params.toString() ? `${base}?${params}` : base;
  navigator.clipboard.writeText(url).then(() => {
    alert('リンクをコピーしました。メンバーに共有してください。');
  }).catch(() => {
    prompt('以下のURLをコピーしてください', url);
  });
}

function parseUrlParams() {
  const p = new URLSearchParams(location.search);
  if (p.get('staff')) { S.viewerName = p.get('staff'); localStorage.setItem(VIEWER_KEY, S.viewerName); }
  if (p.get('mine') === '1') { S.mineOnly = true; localStorage.setItem(MINE_ONLY_KEY, '1'); }
  if (p.get('view') === '1') {
    S.viewMode = true;
    S.lockedViewer = true;
    localStorage.setItem(VIEW_MODE_KEY, '1');
  } else {
    S.viewMode = false;
    S.lockedViewer = false;
    localStorage.setItem(VIEW_MODE_KEY, '0');
  }
  if (p.get('ch')) S.filterChs = p.get('ch').split(',').filter(Boolean);
  if (p.get('type')) S.filterTypes = p.get('type').split(',').filter(Boolean);
  if (p.get('tab')) S.tab = normalizeTab(p.get('tab'));
  applyMobileEditPolicy();
}

/** スマホの管理者URLは常に編集モード（?view=1 のときだけ閲覧固定） */
function applyMobileEditPolicy() {
  if (new URLSearchParams(location.search).get('view') === '1') return;
  if (!isMobile()) return;
  S.viewMode = false;
  S.lockedViewer = false;
  localStorage.setItem(VIEW_MODE_KEY, '0');
}

function goAdminEditUrl() {
  const u = new URL(CANONICAL_URL);
  if (S.tab && S.tab !== 'week') u.searchParams.set('tab', S.tab);
  location.href = u.toString();
}
window.goAdminEditUrl = goAdminEditUrl;

function isMobileAdmin() {
  return isMobile() && !isLockedTeamViewer() && canEdit();
}

// ── ローカル優先（手動変更は絶対に上書きしない）────────────────────────────
const LOCAL_GUARD_KEY = 'yt_local_guard';

function hasLocalProjectData() {
  return S.projects.length > 0;
}

function markLocalGuard() {
  localStorage.setItem(LOCAL_GUARD_KEY, '1');
}

function isLocalGuarded() {
  return localStorage.getItem(LOCAL_GUARD_KEY) === '1' || hasLocalProjectData();
}

// ── Persistence ───────────────────────────────────────────────────────────────
function persist() {
  renumberProjects();
  if (!isLockedTeamViewer()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProjects()));
    persistShootingSchedule();
    markLocalGuard();
    const meta = {
      updatedAt: new Date().toISOString(),
      updatedBy: 'local',
      version: 1,
    };
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
    S.syncMeta = meta;
    if (canCloudWrite() && location.protocol !== 'file:') {
      S.syncPending = true;
      S.hasUnpublishedChanges = false;
      scheduleServerPush();
    } else {
      S.syncPending = false;
      S.hasUnpublishedChanges = true;
    }
  }
}

function normalizeShootingSchedule(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const out = {};
  Object.entries(raw).forEach(([ch, v]) => {
    if (!v || typeof v !== 'object') return;
    const norm = val => {
      if (!val) return '';
      const d = parseDate(val);
      return d ? dateToInput(d) : '';
    };
    out[ch] = {
      postsPerWeek: v.postsPerWeek === 2 || v.postsPerWeek === '2' ? 2
        : (v.postsPerWeek === 1 || v.postsPerWeek === '1' ? 1 : ''),
      lastPost: norm(v.lastPost),
      nextShoot: norm(v.nextShoot),
      nextNextShoot: norm(v.nextNextShoot),
    };
  });
  return out;
}

function getShootingEntry(channel) {
  if (!S.shootingSchedule[channel]) {
    S.shootingSchedule[channel] = { postsPerWeek: '', lastPost: '', nextShoot: '', nextNextShoot: '' };
  }
  return S.shootingSchedule[channel];
}

function shootDeadlineHelpText() {
  return Object.entries(SHOOT_DEADLINE_DAYS)
    .map(([w, days]) => `週${w}→-${days}日`)
    .join('、');
}

function computeShootDeadline(lastPost, postsPerWeek) {
  const d = parseDate(lastPost);
  if (!d) return null;
  const n = Number(postsPerWeek);
  const days = SHOOT_DEADLINE_DAYS[n];
  if (!days) return null;
  return addDays(d, -days);
}

function isShootDatePast(value) {
  const d = parseDate(value);
  return !!(d && d < TODAY);
}

function formatShootDeadline(entry) {
  const deadline = computeShootDeadline(entry.lastPost, entry.postsPerWeek);
  if (!deadline) return { text: '—', overdue: false };
  const pastDue = deadline < TODAY;
  const noNextShoot = !String(entry.nextShoot || '').trim();
  const nextShootPast = isShootDatePast(entry.nextShoot);
  return { text: fmtDate(deadline), overdue: pastDue || noNextShoot || nextShootPast };
}

function ensureShootingScheduleChannels() {
  getChannelList().forEach(ch => getShootingEntry(ch));
}

function persistShootingSchedule() {
  localStorage.setItem(SHOOTING_STORAGE_KEY, JSON.stringify(S.shootingSchedule));
}

function loadShootingSchedule() {
  try {
    const raw = localStorage.getItem(SHOOTING_STORAGE_KEY);
    if (raw) S.shootingSchedule = normalizeShootingSchedule(JSON.parse(raw));
  } catch (e) {
    console.error('撮影スケジュールの読み込みに失敗:', e);
    S.shootingSchedule = {};
  }
}

function applyShootingSchedule(data, { persistLocal = true } = {}) {
  if (!data) return;
  S.shootingSchedule = normalizeShootingSchedule(data);
  if (persistLocal && !isLockedTeamViewer()) persistShootingSchedule();
}

function serializeShootingSchedule() {
  const out = {};
  ensureShootingScheduleChannels();
  getChannelList().forEach(ch => {
    const e = getShootingEntry(ch);
    const row = {};
    if (e.postsPerWeek === 1 || e.postsPerWeek === 2) row.postsPerWeek = e.postsPerWeek;
    if (e.lastPost) row.lastPost = e.lastPost;
    if (e.nextShoot) row.nextShoot = e.nextShoot;
    if (e.nextNextShoot) row.nextNextShoot = e.nextNextShoot;
    if (Object.keys(row).length) out[ch] = row;
  });
  return out;
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      S.projects = JSON.parse(raw).map(p => normalizeProject({
        ...p, postDate: parseDate(p.postDate),
      }));
      renumberProjects();
      if (S.projects.length) markLocalGuard();
      return true;
    }
  } catch (e) {
    console.error('localStorage の案件読み込みに失敗:', e);
  }
  return false;
}

function migrateLegacyStorage() {
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      S.projects = JSON.parse(raw).map(p => normalizeProject({
        ...p, postDate: parseDate(p.postDate),
      }));
      renumberProjects();
      persist();
      return true;
    } catch (e) {
      console.error(`レガシーストレージ ${key} の読み込みに失敗:`, e);
    }
  }
  return false;
}

function getSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY) || 'null');
  } catch(e) {
    return null;
  }
}

function getServerProjects(serverRaw) {
  return Array.isArray(serverRaw?.projects) ? serverRaw.projects
    : (Array.isArray(serverRaw) ? serverRaw : []);
}

function countArchivedProjects(projects) {
  return projects.filter(p => p.archived).length;
}

function shouldApplyServerData(serverRaw, localCount) {
  // ローカルにデータがある限り、サーバーで自動上書きしない（手動変更を保護）
  if (localCount > 0) return false;
  return getServerProjects(serverRaw).length > 0;
}

function describeServerData(serverRaw) {
  const projects = getServerProjects(serverRaw);
  return {
    count: projects.length,
    archived: countArchivedProjects(projects),
    updatedAt: serverRaw?._meta?.updatedAt || null,
    updatedBy: serverRaw?._meta?.updatedBy || '',
  };
}

async function refreshServerSnapshot() {
  if (location.protocol === 'file:') return null;
  try {
    const raw = await fetchSharedRaw();
    S.serverSnapshot = describeServerData(raw);
    return S.serverSnapshot;
  } catch (e) {
    console.warn('サーバー情報取得失敗:', e);
    return null;
  }
}

function serverPayloadTimestamp(raw) {
  return Date.parse(raw?._meta?.updatedAt || '') || 0;
}

function isLocalAheadOfServer(serverRaw = null) {
  if (S.hasUnpublishedChanges) return true;
  const localAt = Date.parse(S.syncMeta?.updatedAt || '') || 0;
  const serverAt = serverRaw
    ? serverPayloadTimestamp(serverRaw)
    : Date.parse(S.serverSnapshot?.updatedAt || '') || 0;
  return localAt > serverAt;
}

function isServerNewerThanLocal(serverRaw) {
  if (isLocalAheadOfServer(serverRaw)) return false;
  const serverAt = serverPayloadTimestamp(serverRaw);
  const localAt = Date.parse(S.syncMeta?.updatedAt || '') || 0;
  if (!localAt) return !!serverAt;
  if (serverAt > localAt) return true;
  if (serverAt === localAt) {
    const serverCount = getServerProjects(serverRaw).length;
    if (serverCount !== S.projects.length) return serverCount > S.projects.length;
  }
  return false;
}

function shouldPreferServerData(serverRaw) {
  if (!serverRaw || isLocalAheadOfServer(serverRaw)) return false;
  const serverAt = serverPayloadTimestamp(serverRaw);
  const localAt = Date.parse(S.syncMeta?.updatedAt || '') || 0;
  if (!localAt || !S.projects.length) return getServerProjects(serverRaw).length > 0;
  // 同時刻はローカル優先（手動編集を絶対に消さない）
  if (serverAt > localAt) return true;
  return false;
}

function isServerMismatch() {
  if (isLockedTeamViewer() || location.protocol === 'file:') return false;
  if (!S.serverSnapshot) return S.hasUnpublishedChanges;
  if (S.hasUnpublishedChanges) return true;
  if (isLocalAheadOfServer()) return true;
  const localArchived = countArchivedProjects(S.projects);
  if (S.projects.length !== S.serverSnapshot.count) return true;
  if (localArchived !== S.serverSnapshot.archived) return true;
  return false;
}

async function publishToTeam() {
  if (!canCloudWrite()) {
    openSyncSettings();
    return;
  }
  serverPushRetries = 0;
  clearTimeout(serverPushRetryTimer);
  await pushScheduleToServer();
  if (S.serverPush.status === 'ok') {
    S.hasUnpublishedChanges = false;
    await refreshServerSnapshot();
    updateSyncStatus();
  }
}

function initEmpty() {
  S.projects = [];
  persist();
}

// ── Filtering ─────────────────────────────────────────────────────────────────
function getPostMark(p) {
  if (p.postMark === '済' || p.postMark === '制作' || p.postMark === 'ボツ') return p.postMark;
  if (p.currentStatus === 'ボツ') return 'ボツ';
  if (p.currentStatus === '投稿' || p.currentStatus === 'クローズ') return '済';
  return '制作';
}

function postBadge(p, { clickable = false } = {}) {
  const mark = getPostMark(p);
  const cls = mark === 'ボツ' ? 'trash' : mark === '済' ? 'done' : 'active';
  const click = clickable && canEdit()
    ? ` class="post-badge ${cls} is-clickable" onclick="togglePostMark('${p.id}')" title="クリックで 制作 → 済 → ボツ"`
    : ` class="post-badge ${cls}"`;
  return `<span${click}>${mark}</span>`;
}

function togglePostMark(id) {
  if (!canEdit()) return;
  const p = S.projects.find(x => x.id === id);
  if (!p) return;
  const cur = getPostMark(p);
  const next = cur === '制作' ? '済' : cur === '済' ? 'ボツ' : '制作';
  p.postMark = next;
  markUserSet(p, 'postMark');
  persist();
  render();
}

function isOverdue(p) {
  const mark = getPostMark(p);
  if (mark === '済' || mark === 'ボツ') return false;
  return p.postDate && p.postDate < TODAY && isActiveStatus(p.currentStatus);
}

const STATUS_SORT_ORDER = Object.fromEntries(STATUS_OPTIONS.map((s, i) => [s, i]));

function matchesFilters(p) {
  const archived = isArchived(p);
  if (S.tab === 'closed') {
    if (!archived) return false;
  } else if (archived) {
    return false;
  }

  const q = (S.search || '').trim().toLowerCase();
  const ok1 = S.filterChs.length === 0 || S.filterChs.includes(p.channel);
  const ok2 = S.filterSts.length === 0 || S.filterSts.some(st =>
    st === 'active'
      ? isActiveStatus(p.currentStatus)
      : p.currentStatus === st
  );
  const ok3 = !q || [p.title, p.channel, p.staff, p.currentStatus, p.type, String(p.postOrder || '')]
    .some(v => String(v || '').toLowerCase().includes(q));
  const ok4 = S.filterStaff.length === 0 || S.filterStaff.includes(p.staff);
  const ok5 = matchesViewer(p);
  const ok6 = S.filterTypes.length === 0 || S.filterTypes.includes(p.type || '通常');
  return ok1 && ok2 && ok3 && ok4 && ok5 && ok6;
}

function filtered() {
  const list = S.projects.filter(matchesFilters);

  if (S.sortBy === 'status') {
    list.sort((a,b) => {
      const oa = STATUS_SORT_ORDER[a.currentStatus] ?? 99;
      const ob = STATUS_SORT_ORDER[b.currentStatus] ?? 99;
      if (oa !== ob) return oa - ob;
      if (!a.postDate && !b.postDate) return 0;
      if (!a.postDate) return 1;
      if (!b.postDate) return -1;
      return a.postDate - b.postDate;
    });
  } else if (S.sortBy === 'client') {
    sortByClientOrder(list);
  } else {
    sortByPostDate(list);
  }
  return list;
}

// ── Tab switching ─────────────────────────────────────────────────────────────
const VALID_TABS = new Set(['week', 'shoot', 'gantt', 'closed', 'subs', 'subsgraph']);
const TAB_ALIASES = { tasks: 'shoot', list: 'week' };

function normalizeTab(tab) {
  const t = TAB_ALIASES[tab] || tab;
  return VALID_TABS.has(t) ? t : 'week';
}

function switchTab(tab) {
  tab = normalizeTab(tab);
  S.tab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.classList.add('active');
  const hideFilters = tab === 'shoot' || tab === 'subs' || tab === 'subsgraph';
  const toolbar = document.getElementById('toolbar');
  const legend = document.getElementById('legend-bar');
  if (toolbar) toolbar.hidden = hideFilters;
  if (legend) legend.hidden = tab !== 'gantt';
  render();
}

function onSortChange(value) {
  S.sortBy = value;
  render();
}

function renderLegend() {
  const el = document.getElementById('legend-items');
  if (!el) return;
  el.innerHTML = STAGES.map(w =>
    `<span class="legend-item" style="background:${w.bg};color:${w.fg}">${w.abbr} ${w.name}</span>`
  ).join('');
}

// ── Main render ───────────────────────────────────────────────────────────────
function render() {
  pruneSelectedIds();
  renderFilterDropdowns();
  renderLegend();
  const main = document.getElementById('main');
  main.className = 'main';
  main.innerHTML = '';
  const mobile = isMobile();
  if (mobile && S.tab === 'gantt') main.classList.add('main-gantt');
  if (S.tab === 'gantt') main.appendChild(buildGantt());
  else if (S.tab === 'closed') main.appendChild(buildClosed());
  else if (S.tab === 'shoot') main.appendChild(buildShootingSchedule());
  else if (S.tab === 'week') main.appendChild(buildTeamWeek());
  else if (S.tab === 'subs') main.appendChild(buildSubscribers());
  else if (S.tab === 'subsgraph') main.appendChild(buildSubscribersGraph());
  else main.appendChild(buildTeamWeek());
  updateSyncStatus();
  syncMobPanelUI();
  updateClosedTabBadge();
}

function updateClosedTabBadge() {
  const tab = document.getElementById('tab-closed');
  if (!tab) return;
  const n = S.projects.filter(p => isArchived(p)).length;
  tab.textContent = n ? `✅ クローズ済 (${n})` : '✅ クローズ済';
}

function filterSummaryLabel(values, { short = false } = {}) {
  if (!values.length) return 'すべて';
  if (values.length === 1) {
    const v = values[0];
    if (short && v.length > 8) return v.slice(0, 7) + '…';
    return v;
  }
  return `${values.length}件`;
}

function typeFilterLabel(type) {
  return type === 'ショート' ? 'SHORT' : type;
}

function renderFilterDropdowns() {
  const el = document.getElementById('toolbar-filters');
  if (!el) return;

  const allStatuses = STATUS_OPTIONS.filter(s => s !== 'ボツ');
  const statusItems = [
    { value: 'active', label: '制作中' },
    ...allStatuses.map(s => ({ value: s, label: s })),
  ];

  const sections = [
    {
      key: 'ch',
      label: 'クライアント',
      items: getChannelList().map(v => ({ value: v, label: v })),
      selected: S.filterChs,
    },
    {
      key: 'staff',
      label: '担当',
      items: getStaffOptions().map(v => ({ value: v, label: v })),
      selected: S.filterStaff,
    },
    {
      key: 'type',
      label: 'タイプ',
      items: getVideoTypeList().map(v => ({ value: v, label: typeFilterLabel(v) })),
      selected: S.filterTypes,
    },
    {
      key: 'st',
      label: '状態',
      items: statusItems,
      selected: S.filterSts,
    },
  ];

  const mkPanel = (sec) => {
    const opts = sec.items.map(item => {
      const on = sec.selected.includes(item.value);
      return `<label class="mf-check"><input type="checkbox" data-mf-key="${sec.key}" value="${escAttr(item.value)}"${on ? ' checked' : ''}><span>${escAttr(item.label)}</span></label>`;
    }).join('');
    return `
      <div class="mf-dd" data-mf-key="${sec.key}">
        <button type="button" class="mf-trigger" data-mf-key="${sec.key}">
          <span class="mf-trigger-label">${sec.label}</span>
          <span class="mf-trigger-val">${escAttr(filterSummaryLabel(sec.selected, { short: true }))}</span>
        </button>
        <div class="mf-panel" data-mf-key="${sec.key}" hidden>
          <div class="mf-panel-hd">
            <span>${sec.label}</span>
            <button type="button" class="mf-clear" data-mf-clear="${sec.key}">クリア</button>
          </div>
          <div class="mf-panel-body">${opts}</div>
        </div>
      </div>`;
  };

  el.innerHTML = `
    <div class="mf-bar">
      <div class="mf-grid">${sections.map(mkPanel).join('')}</div>
      <div class="mf-sort">
        <label class="mf-sort-label" for="sort-select">並び</label>
        <select id="sort-select" class="mf-sort-select">
          <option value="postDate"${S.sortBy === 'postDate' || S.sortBy === 'default' ? ' selected' : ''}>投稿順</option>
          <option value="client"${S.sortBy === 'client' ? ' selected' : ''}>クライアント順</option>
          <option value="status"${S.sortBy === 'status' ? ' selected' : ''}>要対応優先</option>
        </select>
      </div>
    </div>`;

  const sortEl = document.getElementById('sort-select');
  if (sortEl) sortEl.onchange = () => onSortChange(sortEl.value);

  if (!el.dataset.bound) {
    el.dataset.bound = '1';
    el.addEventListener('click', e => {
      const trigger = e.target.closest('.mf-trigger');
      if (trigger) {
        const key = trigger.dataset.mfKey;
        const panel = el.querySelector(`.mf-panel[data-mf-key="${key}"]`);
        const wasOpen = panel && !panel.hidden;
        el.querySelectorAll('.mf-panel').forEach(p => { p.hidden = true; });
        el.querySelectorAll('.mf-trigger').forEach(b => b.classList.remove('is-open'));
        if (panel && !wasOpen) {
          panel.hidden = false;
          trigger.classList.add('is-open');
        }
        e.stopPropagation();
        return;
      }
      const clearBtn = e.target.closest('.mf-clear');
      if (clearBtn) {
        const key = clearBtn.dataset.mfClear;
        if (key === 'ch') S.filterChs = [];
        if (key === 'staff') S.filterStaff = [];
        if (key === 'type') S.filterTypes = [];
        if (key === 'st') S.filterSts = [];
        render();
        e.stopPropagation();
        return;
      }
    });
    el.addEventListener('change', e => {
      const cb = e.target.closest('input[type="checkbox"][data-mf-key]');
      if (!cb) return;
      const key = cb.dataset.mfKey;
      const val = cb.value;
      const toggle = (arr) => {
        const i = arr.indexOf(val);
        if (cb.checked && i < 0) arr.push(val);
        if (!cb.checked && i >= 0) arr.splice(i, 1);
      };
      if (key === 'ch') toggle(S.filterChs);
      else if (key === 'staff') toggle(S.filterStaff);
      else if (key === 'type') toggle(S.filterTypes);
      else if (key === 'st') {
        if (val === 'active') {
          if (cb.checked) {
            S.filterSts = ['active'];
          } else {
            S.filterSts = S.filterSts.filter(s => s !== 'active');
          }
        } else {
          S.filterSts = S.filterSts.filter(s => s !== 'active');
          toggle(S.filterSts);
        }
      }
      render();
    });
  }
}

function scrollGanttToToday(wrap) {
  if (!wrap) return;
  const todayTh = wrap.querySelector('th.today-col');
  if (!todayTh) return;
  const stickyWidth = isMobile()
    ? (isMobileLandscape() ? 168 : 244)
    : 788;
  wrap.scrollLeft = Math.max(0, todayTh.offsetLeft - stickyWidth - 12);
}

function ganttProgressCellHtml(p) {
  const pct = projectProgress(p);
  return `<div class="g-mob-prg" title="進捗 ${pct}%">
    <div class="pbar g-mob-pbar"><div class="pfill" style="width:${pct}%"></div></div>
    <span class="g-mob-pct">${pct}%</span>
  </div>`;
}

// ── Gantt view ────────────────────────────────────────────────────────────────
function buildGantt() {
  const compact = isMobile();
  const panel = document.createElement('div');
  panel.className = 'gantt-panel' + (compact ? ' gantt-panel-mobile' : '');
  const bulkBar = buildBulkBar();
  if (compact) bulkBar.hidden = true;
  panel.appendChild(bulkBar);

  let mobBar;
  if (compact) {
    mobBar = document.createElement('div');
    mobBar.className = 'gantt-mob-bar';
    mobBar.innerHTML = `
      <span class="gantt-mob-bar-text">上下で案件 · 左右で日付 · 工程タップで進捗更新</span>
      <button type="button" class="btn btn-neutral btn-sm" id="gantt-scroll-today">📍 今日へ</button>
    `;
    panel.appendChild(mobBar);
  }

  const wrap = document.createElement('div');
  wrap.className = 'gantt-wrap';

  const projects = filtered();
  if (!projects.length) {
    wrap.innerHTML = emptyState();
    panel.appendChild(wrap);
    return panel;
  }

  if (compact && mobBar) {
    mobBar.querySelector('.gantt-mob-bar-text').textContent =
      `${projects.length}件 · 上下で案件 · 左右で日付`;
  }

  const gStart = addDays(TODAY, -7);
  const DAYS = 55;
  const dates = Array.from({length:DAYS}, (_,i) => addDays(gStart, i));

  const tbl = document.createElement('table');
  tbl.className = 'gantt-tbl' + (compact ? ' gantt-tbl-compact gantt-tbl-compact-slim' : '');

  // ── Head
  const thead = tbl.createTHead();
  const hr = thead.insertRow();

  if (!compact) appendSelectAllHeader(hr);

  const infoCols = compact ? [
    ['クライアント', 'c-ch sc th'],
    ['企画',       'c-ttl sc th tleft'],
    ['投稿日',     'c-dt sc th'],
  ] : [
    ['投稿',           'c-post sc th'],
    ['担当',           'c-who sc th'],
    ['クライアント',   'c-ch sc th'],
    ['タイプ',         'c-typ sc th'],
    ['企画',           'c-ttl sc th tleft'],
    ['投稿日',         'c-dt sc th'],
    ['待ち状態',       'c-st sc th'],
    ['🔗',             'c-url sc th'],
    ['✏️',             'c-edt sc th'],
  ];
  infoCols.forEach(([label, cls]) => {
    const th = document.createElement('th');
    th.className = cls.trim();
    th.textContent = label;
    hr.appendChild(th);
  });

  dates.forEach(d => {
    const th = document.createElement('th');
    th.className = 'c-date';
    const isToday   = sameDay(d, TODAY);
    const isWeekend = d.getDay()===0 || d.getDay()===6;
    if (isToday)   th.classList.add('today-col');
    else if(isWeekend) th.classList.add('weekend-col');
    th.innerHTML = `${d.getMonth()+1}/${d.getDate()}<br><span style="font-size:9px;opacity:.8">${weekday[d.getDay()]}</span>`;
    hr.appendChild(th);
  });

  // ── Body
  const tbody = tbl.createTBody();

  projects.forEach(p => {
    const tr = tbody.insertRow();
    const chBg = CH_BG[p.channel] || '#fff';
    const chFg = CH_FG[p.channel] || '#333';
    const sds  = projectStageSchedule(p);

    if (compact) {
      let td = tr.insertCell();
      td.className = 'sc c-ch';
      td.style.background = chBg;
      td.innerHTML = `<span class="g-mob-ch" style="color:${chFg}">${p.channel}</span>`;

      td = tr.insertCell();
      td.className = 'sc c-ttl tleft';
      td.style.background = chBg;
      td.title = p.title;
      td.innerHTML = `<div class="g-mob-title">${p.title}</div>`;
      if (canEdit()) {
        td.style.cursor = 'pointer';
        td.onclick = () => openEdit(p.id);
      }

      td = tr.insertCell();
      td.className = 'sc c-dt';
      td.style.background = chBg;
      if (p.postDate) {
        td.innerHTML = `<span class="g-mob-date">${fmtDate(p.postDate)}</span>`;
      } else {
        td.innerHTML = '<span class="g-mob-date is-empty">未設定</span>';
      }
    } else {
      appendRowCheckbox(tr, p, chBg);

      let td = tr.insertCell();
      td.className = 'sc c-post';
      td.style.background = chBg;
      td.innerHTML = postBadge(p, { clickable: true });

      td = tr.insertCell();
      td.className = 'sc c-who';
      td.style.background = chBg;
      td.style.fontSize = '11px';
      td.textContent = p.staff;

      td = tr.insertCell();
      td.className = 'sc c-ch';
      td.style.background = chBg;
      td.innerHTML = `<span style="font-size:11px;font-weight:800;color:${chFg}">${p.channel}</span>`;

      td = tr.insertCell();
      td.className = 'sc c-typ';
      td.style.background = chBg;
      if (p.type === 'ショート') {
        td.innerHTML = '<span style="background:#F59E0B;color:#fff;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:800">SHORT</span>';
      } else {
        td.innerHTML = '<span style="font-size:10px;color:#aaa">通常</span>';
      }

      td = tr.insertCell();
      td.className = 'sc c-ttl tleft';
      td.style.background = chBg;
      td.style.overflow = 'hidden';
      td.style.textOverflow = 'ellipsis';
      td.title = `${p.channel} · ${p.title}`;
      td.textContent = p.title;
      if (canEdit()) {
        td.style.cursor = 'pointer';
        td.title = '編集';
        td.onclick = () => openEdit(p.id);
      }

      td = tr.insertCell();
      td.className = 'sc c-dt';
      td.style.background = chBg;
      td.style.fontWeight = '700';
      td.style.fontSize = '11px';
      if (p.postDate) {
        td.textContent = fmtDate(p.postDate);
      } else {
        td.innerHTML = '<span style="color:#bbb;font-size:10px">未設定</span>';
      }

      td = tr.insertCell();
      td.className = 'sc c-st';
      td.style.background = chBg;
      const cs = CS_STYLE[p.currentStatus] || CS_STYLE['企画'];
      td.innerHTML = `<span class="cs" style="background:${cs.bg};color:${cs.fg}">${p.currentStatus||'企画'}</span>`;

      td = tr.insertCell();
      td.className = 'sc c-url';
      td.style.background = chBg;
      if (p.material) {
        td.innerHTML = `<a href="${p.material}" target="_blank" rel="noopener" title="${p.material}"
          style="font-size:16px;text-decoration:none;cursor:pointer">🔗</a>`;
      }

      td = tr.insertCell();
      td.className = 'sc c-edt';
      td.style.background = chBg;
      if (canEdit()) {
        td.innerHTML = `<button onclick="openEdit('${p.id}')" title="編集"
          style="background:none;border:none;cursor:pointer;font-size:14px;padding:2px;line-height:1">✏️</button>`;
      }
    }

    dates.forEach(d => {
      const cell = tr.insertCell();
      cell.className = 'c-date';
      const isToday   = sameDay(d, TODAY);
      const isWeekend = d.getDay()===0 || d.getDay()===6;
      if (isToday) cell.classList.add('today-col');
      else if (isWeekend) cell.classList.add('weekend-col');

      const hit = sds.find(s => sameDay(s.date, d));
      // 投稿日列とガントの「投」を確実に一致させる
      const postHit = isStageEnabled(p, 'toukou') && p.postDate && sameDay(p.postDate, d)
        ? sds.find(s => s.id === 'toukou') || { name: '投稿', abbr: '投', bg: '#C0392B', fg: '#fff', isManual: false }
        : null;
      const show = postHit || hit;
      if (show) {
        const stSt  = p.stageStatuses[show.name] || '未着手';
        const done  = stSt === '完了' || stSt === 'スキップ';
        const over  = !done && d < TODAY;
        const span  = document.createElement('span');
        span.className = 'sb' + (done?' done':'') + (over?' overdue':'');
        span.style.background = show.bg;
        span.style.color = show.fg;
        span.textContent = show.abbr;
        span.title = `${show.name}（${stSt}）${show.isManual ? ' · 手入力' : ''}`;
        if (canEdit()) span.onclick = e => { e.stopPropagation(); showPopup(e, p.id, show.name); };
        cell.appendChild(span);
      }
    });
  });

  wrap.appendChild(tbl);
  panel.appendChild(wrap);

  if (compact && mobBar) {
    mobBar.querySelector('#gantt-scroll-today')?.addEventListener('click', () => scrollGanttToToday(wrap));
  }
  requestAnimationFrame(() => {
    scrollGanttToToday(wrap);
    updateBulkBar();
  });
  return panel;
}

// ── List view ─────────────────────────────────────────────────────────────────
function buildList() {
  const panel = document.createElement('div');
  panel.className = 'list-panel';
  panel.appendChild(buildBulkBar());

  const wrap = document.createElement('div');
  wrap.className = 'list-wrap';

  const projects = filtered();
  if (!projects.length) {
    wrap.innerHTML = emptyState();
    panel.appendChild(wrap);
    return panel;
  }

  const tbl = document.createElement('table');
  tbl.className = 'list-tbl';

  const thead = tbl.createTHead();
  const hr = thead.insertRow();
  appendSelectAllHeader(hr);
  ['チャンネル','担当','タイプ','タイトル','投稿予定日','待ち状態',
   ...STAGES.map(w=>w.name),'進捗','元素材','操作'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    hr.appendChild(th);
  });

  const tbody = tbl.createTBody();
  projects.forEach(p => {
    const tr = tbody.insertRow();
    const bg = CH_BG[p.channel]||'#fff';
    const fg = CH_FG[p.channel]||'#333';
    const sds = projectStageSchedule(p);
    const pct = projectProgress(p);
    const cs = CS_STYLE[p.currentStatus]||CS_STYLE['企画'];

    appendRowCheckbox(tr, p, bg);

    const basics = [
      `<span style="font-weight:800;color:${fg}">${p.channel}</span>`,
      p.staff,
      p.type==='ショート'
        ? '<span style="background:#F59E0B;color:#fff;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:800">SHORT</span>'
        : '通常',
      `<span>${p.title}</span>`,
      p.postDate ? fmtDate(p.postDate) : '<span style="color:#bbb">未設定</span>',
      `<span class="cs" style="background:${cs.bg};color:${cs.fg}">${p.currentStatus||'企画'}</span>`,
    ];

    basics.forEach((html, i) => {
      const td = tr.insertCell();
      td.innerHTML = html;
      td.style.background = bg;
      if (i === 3) td.className = 'tleft';
    });

    STAGES.forEach(w => {
      const td = tr.insertCell();
      td.style.background = bg;
      if (!isStageEnabled(p, w.id)) {
        td.innerHTML = '<span style="color:#ddd">—</span>';
        return;
      }
      const sd  = sds.find(s => s.name === w.name);
      const st  = p.stageStatuses[w.name]||'未着手';
      const sc  = SS_STYLE[st]||SS_STYLE['未着手'];
      const ov  = sd && sd.date < TODAY && st!=='完了' && st!=='スキップ';
      td.innerHTML = `
        <span class="sc-cell" style="background:${sc.bg};color:${sc.fg};${ov?'box-shadow:0 0 0 1.5px #C0392B;':''}${canEdit()?';cursor:pointer':''}"
          ${canEdit()?`onclick="showPopup(event,'${p.id}','${w.name}')"`:''}
          title="${sd?fmtDate(sd.date):'日付未設定'}">${st}</span>
        ${sd?`<div style="font-size:9px;color:#aaa;margin-top:1px">${fmtMD(sd.date)}${sd.isManual?'*':''}</div>`:''}`;
    });

    // Progress
    const tdp = tr.insertCell();
    tdp.style.background = bg;
    tdp.innerHTML = `<div style="display:flex;align-items:center;gap:5px;justify-content:center">
      <div class="pbar" style="width:55px"><div class="pfill" style="width:${pct}%"></div></div>
      <span style="font-size:10px;font-weight:700;color:#555">${pct}%</span>
    </div>`;

    // Material URL
    const tdm = tr.insertCell();
    tdm.style.background = bg;
    tdm.innerHTML = p.material
      ? `<a href="${p.material}" target="_blank" rel="noopener"
           style="font-size:18px;text-decoration:none" title="${p.material}">🔗</a>`
      : `<span style="color:#ddd;font-size:12px">—</span>`;

    // Actions
    const tda = tr.insertCell();
    tda.style.background = bg;
    tda.innerHTML = canEdit()
      ? `<button class="btn btn-sm btn-neutral" onclick="openEdit('${p.id}')">編集</button>`
      : '';
  });

  wrap.appendChild(tbl);
  panel.appendChild(wrap);
  requestAnimationFrame(() => updateBulkBar());
  return panel;
}

function buildClosed() {
  const outer = document.createElement('div');
  outer.className = 'list-panel';
  const mobile = isMobile();
  const projects = filtered();

  const hd = document.createElement('div');
  hd.className = 'closed-tab-hd';
  hd.innerHTML = `
    <div class="section-title" style="margin-bottom:4px">✅ クローズ済</div>
    <div style="font-size:12px;color:var(--muted)">${projects.length}件 · アーカイブされた案件（他タブには表示されません）</div>
  `;
  outer.appendChild(hd);
  outer.appendChild(buildBulkBar());

  if (!projects.length) {
    const empty = document.createElement('div');
    empty.className = 'dash-wrap';
    empty.innerHTML = emptyState();
    outer.appendChild(empty);
    requestAnimationFrame(() => updateBulkBar());
    return outer;
  }

  if (mobile) {
    const wrap = document.createElement('div');
    wrap.className = 'm-cards-wrap';
    wrap.style.paddingTop = '8px';
    projects.forEach(p => wrap.appendChild(buildClosedMobileCard(p)));
    outer.appendChild(wrap);
    requestAnimationFrame(() => updateBulkBar());
    return outer;
  }

  const listPanel = buildList();
  outer.appendChild(listPanel.querySelector('.list-wrap') || listPanel);
  requestAnimationFrame(() => updateBulkBar());
  return outer;
}

function buildClosedMobileCard(p) {
  const card = document.createElement('article');
  card.className = 'm-card closed-card';
  const chBg = CH_BG[p.channel] || '#fff';
  const chFg = CH_FG[p.channel] || '#333';
  const cs = CS_STYLE[p.currentStatus] || CS_STYLE['企画'];
  const archivedLabel = p.archivedAt
    ? new Date(p.archivedAt).toLocaleDateString('ja-JP')
    : '—';
  const editBtn = canEdit()
    ? `<button type="button" class="wk-edit-btn" onclick="openEdit('${p.id}')" aria-label="編集">✏️</button>`
    : '';

  card.innerHTML = `
    <div class="wk-card-top" style="background:${chBg}">
      <span class="wk-card-ch" style="color:${chFg}">${p.channel}</span>
      <span class="wk-type">${p.type === 'ショート' ? 'SHORT' : '通常'}</span>
      <span class="cs" style="background:${cs.bg};color:${cs.fg}">${p.currentStatus || '企画'}</span>
    </div>
    <div class="wk-card-title">${p.title}</div>
    <div class="wk-card-dates">
      <div class="wk-date-item is-primary">
        <span class="wk-date-label">投稿日</span>
        <span class="wk-date-val">${p.postDate ? fmtDate(p.postDate) : '—'}</span>
      </div>
      <div class="wk-date-item">
        <span class="wk-date-label">アーカイブ</span>
        <span class="wk-date-val">${archivedLabel}</span>
      </div>
    </div>
    <div class="wk-card-foot">
      <span class="wk-staff">${p.staff || '—'}</span>
      ${p.material ? `<a href="${p.material}" class="wk-link" target="_blank" rel="noopener">🔗</a>` : ''}
      ${editBtn}
    </div>
  `;
  return card;
}

// ── Subscribers tracking ──────────────────────────────────────────────────────
let SUBS = null;
const SUBSCRIBERS_WORKFLOW_ID = 'weekly-subscribers.yml';
const SUBS_REFRESH_POLL_MS = 15000;
const SUBS_REFRESH_TIMEOUT_MS = 6 * 60 * 1000;
const SUBS_REFRESH = {
  status: 'idle',
  message: '',
  baselineUpdatedAt: '',
  startedAt: 0,
};
let subsRefreshTimer = null;

async function loadSubscribersData() {
  if (location.protocol === 'file:') return;
  try {
    const res = await fetch(`${SUBSCRIBERS_DATA_URL}?v=${APP_VERSION}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    SUBS = await res.json();
  } catch (e) {
    console.warn('登録者データの読み込みに失敗', e);
    SUBS = null;
  }
}

function subscribersUpdatedAtTs(subs = SUBS) {
  return Date.parse(subs?.updatedAt || '') || 0;
}

function canTriggerSubscribersRefresh() {
  return location.protocol !== 'file:' && !!getGithubWriteToken();
}

function subscribersRefreshStatusHtml() {
  if (SUBS_REFRESH.status === 'idle') return '';
  const cls = SUBS_REFRESH.status === 'error'
    ? 'is-error'
    : SUBS_REFRESH.status === 'success'
      ? 'is-success'
      : 'is-pending';
  return `<span class="subs-refresh-status ${cls}">${escHtml(SUBS_REFRESH.message || '')}</span>`;
}

function updateSubscribersRefreshState(status, message = '') {
  SUBS_REFRESH.status = status;
  SUBS_REFRESH.message = message;
  if (S.tab === 'subs' || S.tab === 'subsgraph') render();
}

function scheduleSubscribersRefreshPoll() {
  clearTimeout(subsRefreshTimer);
  subsRefreshTimer = setTimeout(() => {
    pollSubscribersRefresh().catch(err => {
      console.error('登録者更新ポーリング失敗:', err);
    });
  }, SUBS_REFRESH_POLL_MS);
}

async function pollSubscribersRefresh() {
  if (!['queued', 'running'].includes(SUBS_REFRESH.status)) return;
  await loadSubscribersData();
  const latestTs = subscribersUpdatedAtTs();
  const baselineTs = Date.parse(SUBS_REFRESH.baselineUpdatedAt || '') || 0;
  if (latestTs > baselineTs) {
    clearTimeout(subsRefreshTimer);
    updateSubscribersRefreshState('success', `更新完了: ${new Date(SUBS.updatedAt).toLocaleString('ja-JP')}`);
    return;
  }
  if (Date.now() - SUBS_REFRESH.startedAt >= SUBS_REFRESH_TIMEOUT_MS) {
    clearTimeout(subsRefreshTimer);
    updateSubscribersRefreshState('error', '更新待ちがタイムアウトしました。1-2分後に再度お試しください。');
    return;
  }
  updateSubscribersRefreshState('running', '更新中… 1-2分ほどかかる場合があります');
  scheduleSubscribersRefreshPoll();
}

async function triggerSubscribersRefresh() {
  if (!canTriggerSubscribersRefresh()) {
    alert('登録者更新を実行する権限がありません。⚙️ 同期の設定を確認してください。');
    return;
  }
  if (SUBS_REFRESH.status === 'queued' || SUBS_REFRESH.status === 'running') return;

  const token = getGithubWriteToken();
  SUBS_REFRESH.baselineUpdatedAt = SUBS?.updatedAt || '';
  SUBS_REFRESH.startedAt = Date.now();
  updateSubscribersRefreshState('queued', '更新リクエスト送信中…');

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${SUBSCRIBERS_WORKFLOW_ID}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Workflow dispatch ${res.status}`);
    }
    updateSubscribersRefreshState('running', '更新開始。1-2分ほどお待ちください');
    scheduleSubscribersRefreshPoll();
  } catch (e) {
    clearTimeout(subsRefreshTimer);
    updateSubscribersRefreshState('error', `更新開始に失敗: ${e.message}`);
  }
}

window.triggerSubscribersRefresh = triggerSubscribersRefresh;

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtSubNum(n) {
  if (n == null || n === '') return '';
  const num = Number(n);
  if (!Number.isFinite(num)) return escHtml(String(n));
  return num.toLocaleString('ja-JP');
}

function subsCellMain(p) {
  if (!p || (p.weekIndex == null && p.count == null)) return '<td class="subs-cell"></td>';
  return `<td class="subs-cell subs-cell-main">
    ${p.weekIndex != null ? `<span class="subs-wk">${escHtml(p.weekIndex)}</span>` : ''}
    ${p.count != null ? `<span class="subs-cnt">${fmtSubNum(p.count)}</span>` : ''}
  </td>`;
}

function subsCellMetric(n, cls) {
  if (n == null || n === '') return `<td class="subs-cell ${cls}"></td>`;
  const num = Number(n);
  const neg = Number.isFinite(num) && num < 0;
  const pos = Number.isFinite(num) && num > 0;
  const tone = neg ? 'is-neg' : pos ? 'is-pos' : '';
  return `<td class="subs-cell ${cls} ${tone}">${fmtSubNum(n)}</td>`;
}

function buildSubscribers() {
  const wrap = document.createElement('div');
  wrap.className = 'subs-wrap';

  if (!SUBS || !SUBS.clients?.length) {
    wrap.innerHTML = `
      <div class="subs-empty">
        <p>登録者データを読み込めませんでした。</p>
        <p class="subs-hint"><code>node scripts/import-subscribers-sheet.js --fetch</code> で取り込み後、デプロイしてください。</p>
      </div>`;
    return wrap;
  }

  const cols = SUBS.weekColumns || [];
  const updated = SUBS.updatedAt ? new Date(SUBS.updatedAt).toLocaleString('ja-JP') : '—';
  const sheetLink = SUBS.sourceSheet
    ? `<a href="${escHtml(SUBS.sourceSheet)}" target="_blank" rel="noopener">元スプレッドシート</a>`
    : '';

  const headCells = cols.map(c =>
    `<th class="${c.kind === 'meta' ? 'subs-meta-col' : 'subs-date-col'}">${escHtml(c.label)}</th>`
  ).join('');

  const bodyRows = SUBS.clients.map(client => {
    const chKey = client.appChannel || client.displayName;
    const bg = CH_BG[chKey] || '#FFF9C4';
    const fg = CH_FG[chKey] || '#333';
    const link = client.youtubeUrl
      ? `<a href="${escHtml(client.youtubeUrl)}" target="_blank" rel="noopener" class="subs-ch-link">${escHtml(client.displayName)}</a>`
      : escHtml(client.displayName);

    const pointByKey = new Map((client.points || []).map(p => [p.key, p]));
    const dataCells = cols.map(c => {
      const p = pointByKey.get(c.key);
      if (c.key === 'day0') return `<td class="subs-cell subs-meta-val">${escHtml(client.day0 || '')}</td>`;
      if (c.key === 'firstPost') return `<td class="subs-cell subs-meta-val">${escHtml(client.firstPost || '')}</td>`;
      return subsCellMain(p);
    }).join('');

    const weekCells = cols.map(c => {
      const p = pointByKey.get(c.key);
      if (c.kind === 'meta') return subsCellMetric(p?.count, 'subs-row-week');
      return subsCellMetric(p?.count, 'subs-row-week');
    }).join('');

    const monthCells = cols.map(c => {
      const p = pointByKey.get(c.key);
      const delta = p?.weeklyDelta ?? p?.monthlyDelta;
      return subsCellMetric(delta, 'subs-row-month');
    }).join('');

    return `
      <tr class="subs-block-start">
        <td class="subs-ch-name" rowspan="3" style="background:${bg};color:${fg}">${link}</td>
        <td class="subs-ch-sched">${escHtml(client.schedule || '')}</td>
        ${dataCells}
      </tr>
      <tr class="subs-row-avg">
        <td class="subs-row-label">週平均</td>
        ${weekCells}
      </tr>
      <tr class="subs-row-avg">
        <td class="subs-row-label">月平均</td>
        ${monthCells}
      </tr>`;
  }).join('');

  const refreshBtnDisabled = canTriggerSubscribersRefresh() ? '' : ' disabled';
  wrap.innerHTML = `
    <div class="subs-hd">
      <div>
        <h2 class="subs-title">チャンネル登録者数（週次）</h2>
        <p class="subs-meta-line">${escHtml(SUBS.snapshotRule || '毎週月曜 9:00 JST')} · 更新: ${escHtml(updated)} · ${sheetLink}</p>
      </div>
      <div class="subs-actions">
        <button type="button" class="btn btn-primary" onclick="triggerSubscribersRefresh()"${refreshBtnDisabled}>🔄 登録者更新</button>
        <button type="button" class="btn btn-ghost subs-scroll-latest" onclick="scrollSubsToLatest()">最新週へ →</button>
        <button type="button" class="btn btn-ghost" onclick="switchTab('subsgraph')">📊 グラフ →</button>
      </div>
    </div>
    ${subscribersRefreshStatusHtml()}
    <div class="subs-scroll" id="subs-scroll">
      <table class="subs-table">
        <thead>
          <tr>
            <th class="subs-sticky subs-ch-hdr" rowspan="2">クライアント</th>
            <th class="subs-sticky subs-sched-hdr" rowspan="2">投稿</th>
            ${headCells}
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;

  requestAnimationFrame(() => scrollSubsToLatest(false));
  return wrap;
}

function scrollSubsToLatest(smooth = true) {
  const el = document.getElementById('subs-scroll');
  if (!el) return;
  el.scrollTo({ left: el.scrollWidth, behavior: smooth ? 'smooth' : 'auto' });
}

window.scrollSubsToLatest = scrollSubsToLatest;

// ── Subscribers graph ─────────────────────────────────────────────────────────
const SUBS_GRAPH_WEEKS_KEY = 'yt_subs_graph_weeks';
let subsGraphWeeks = 24;

function initSubsGraphPrefs() {
  const saved = Number(localStorage.getItem(SUBS_GRAPH_WEEKS_KEY));
  if ([12, 24, 52, 0].includes(saved)) subsGraphWeeks = saved;
}

function setSubsGraphWeeks(n) {
  subsGraphWeeks = n;
  localStorage.setItem(SUBS_GRAPH_WEEKS_KEY, String(n));
  render();
}
window.setSubsGraphWeeks = setSubsGraphWeeks;

function subsWeekColumns(subs) {
  return (subs.weekColumns || []).filter(c => c.kind === 'week' && c.isoDate);
}

function subsClientSeries(client, weekCols) {
  const byKey = new Map((client.points || []).map(p => [p.key, p]));
  return weekCols.map(c => {
    const p = byKey.get(c.key);
    return {
      key: c.key,
      label: c.label,
      isoDate: c.isoDate,
      count: p?.count != null ? Number(p.count) : null,
      weeklyDelta: p?.weeklyDelta != null ? Number(p.weeklyDelta) : null,
    };
  });
}

function subsSeriesWithCounts(series) {
  return series.filter(p => p.count != null);
}

function subsSliceSeries(series, maxWeeks) {
  if (!maxWeeks || maxWeeks >= series.length) return series;
  return series.slice(-maxWeeks);
}

function subsClientColor(client) {
  const chKey = client.appChannel || client.displayName;
  return {
    bg: CH_BG[chKey] || '#E2E8F0',
    fg: CH_FG[chKey] || '#334155',
    line: CH_FG[chKey] || '#2563eb',
  };
}

function subsDeltaClass(n) {
  if (n == null || !Number.isFinite(n) || n === 0) return '';
  return n > 0 ? 'is-pos' : 'is-neg';
}

function subsFmtDelta(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toLocaleString('ja-JP')}`;
}

function subsAvgDeltas(series, n) {
  const tail = series.slice(-n).map(p => p.weeklyDelta).filter(v => v != null && Number.isFinite(v));
  if (!tail.length) return null;
  return Math.round(tail.reduce((a, b) => a + b, 0) / tail.length);
}

function buildSparklineSvg(series, { width = 220, height = 52, color = '#2563eb', fillOpacity = 0.12 } = {}) {
  const vals = subsSeriesWithCounts(series).map(p => p.count);
  if (vals.length < 2) {
    return `<svg class="sg-spark" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"></svg>`;
  }
  const padX = 6;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const coords = vals.map((v, i) => {
    const x = padX + (i / (vals.length - 1)) * innerW;
    const y = padY + innerH - ((v - min) / range) * innerH;
    return [x, y];
  });
  const linePath = coords.map((c, i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1][0].toFixed(1)},${height - padY} L${coords[0][0].toFixed(1)},${height - padY} Z`;
  const last = coords[coords.length - 1];
  return `<svg class="sg-spark" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <path class="sg-spark-area" d="${areaPath}" fill="${color}" fill-opacity="${fillOpacity}"/>
    <path class="sg-spark-line" d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3" fill="${color}"/>
  </svg>`;
}

function buildMultiLineChartSvg(clientsData, { width = 900, height = 300, indexed = false } = {}) {
  const pad = { top: 16, right: 16, bottom: 36, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  if (!clientsData.length) return '';

  const pointCount = clientsData[0].series.length;
  if (pointCount < 2) return '';

  const lines = clientsData.map(({ client, series, line }) => {
    const counts = subsSeriesWithCounts(series);
    const basePoint = counts[0];
    const base = indexed ? (basePoint?.count || 1) : 0;
    const values = series.map(p => {
      if (p.count == null) return null;
      return indexed ? (p.count / base) * 100 : p.count;
    });
    return { client, series, values, line };
  });

  const allVals = lines.flatMap(l => l.values.filter(v => v != null));
  let min = Math.min(...allVals);
  let max = Math.max(...allVals);
  if (indexed) {
    min = Math.min(min, 95);
    max = Math.max(max, 105);
  } else {
    const margin = (max - min) * 0.08 || max * 0.05 || 1;
    min = Math.max(0, min - margin);
    max += margin;
  }
  const range = max - min || 1;

  const xAt = i => pad.left + (i / (pointCount - 1)) * innerW;
  const yAt = v => pad.top + innerH - ((v - min) / range) * innerH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const y = pad.top + innerH * (1 - t);
    const val = min + range * t;
    const label = indexed
      ? `${Math.round(val)}%`
      : (val >= 10000 ? `${Math.round(val / 1000)}k` : Math.round(val).toLocaleString('ja-JP'));
    return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" class="sg-grid-line"/>
      <text x="${pad.left - 6}" y="${y + 4}" class="sg-axis-label" text-anchor="end">${label}</text>`;
  }).join('');

  const xLabels = clientsData[0].series;
  const xLabelStep = pointCount > 16 ? Math.ceil(pointCount / 8) : pointCount > 8 ? 2 : 1;
  const xLabelsHtml = xLabels.map((p, i) => {
    if (i % xLabelStep !== 0 && i !== pointCount - 1) return '';
    return `<text x="${xAt(i)}" y="${height - 8}" class="sg-axis-label" text-anchor="middle">${escHtml(p.label)}</text>`;
  }).join('');

  const paths = lines.map(({ client, values, line }) => {
    let d = '';
    values.forEach((v, i) => {
      if (v == null) return;
      const seg = `${d ? 'L' : 'M'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`;
      d += seg;
    });
    if (!d) return '';
    return `<path d="${d}" fill="none" stroke="${line}" stroke-width="2" class="sg-line" data-client="${escHtml(client.id)}"/>`;
  }).join('');

  const title = indexed ? '成長率（期間開始週 = 100%）' : '登録者数の推移';
  return `<div class="sg-chart-wrap">
    <div class="sg-chart-title">${title}</div>
    <svg class="sg-chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="${title}">
      ${gridLines}
      ${paths}
      ${xLabelsHtml}
    </svg>
  </div>`;
}

function buildDeltaBarChart(clientsData) {
  const items = clientsData
    .map(({ client, counts, line }) => {
      const last = counts[counts.length - 1];
      return { client, delta: last?.weeklyDelta, line, label: client.displayName };
    })
    .filter(x => x.delta != null && Number.isFinite(x.delta))
    .sort((a, b) => b.delta - a.delta);

  if (!items.length) return '';

  const maxAbs = Math.max(...items.map(x => Math.abs(x.delta)), 1);
  const rows = items.map(item => {
    const pct = Math.round((Math.abs(item.delta) / maxAbs) * 100);
    const neg = item.delta < 0;
    return `<div class="sg-bar-row">
      <span class="sg-bar-name" style="color:${item.line}">${escHtml(item.label)}</span>
      <div class="sg-bar-track">
        <div class="sg-bar-fill ${neg ? 'is-neg' : 'is-pos'}" style="width:${pct}%;background:${item.line}"></div>
      </div>
      <span class="sg-bar-val ${subsDeltaClass(item.delta)}">${subsFmtDelta(item.delta)}</span>
    </div>`;
  }).join('');

  return `<div class="sg-delta-block">
    <div class="sg-chart-title">直近週の増減（人）</div>
    <div class="sg-bars">${rows}</div>
  </div>`;
}

function buildSubscribersGraph() {
  const wrap = document.createElement('div');
  wrap.className = 'subsgraph-wrap';

  if (!SUBS || !SUBS.clients?.length) {
    wrap.innerHTML = `
      <div class="subs-empty">
        <p>登録者データを読み込めませんでした。</p>
        <p class="subs-hint"><code>node scripts/import-subscribers-sheet.js --fetch</code> で取り込み後、デプロイしてください。</p>
      </div>`;
    return wrap;
  }

  const weekCols = subsSliceSeries(subsWeekColumns(SUBS), subsGraphWeeks || 0);
  const updated = SUBS.updatedAt ? new Date(SUBS.updatedAt).toLocaleString('ja-JP') : '—';
  const rangeOpts = [
    { n: 12, label: '12週' },
    { n: 24, label: '24週' },
    { n: 52, label: '52週' },
    { n: 0, label: '全期間' },
  ];

  const activeKeys = new Set();
  SUBS.clients.forEach(client => {
    subsClientSeries(client, weekCols).forEach(p => {
      if (p.count != null) activeKeys.add(p.key);
    });
  });
  const chartCols = weekCols.filter(c => activeKeys.has(c.key));

  const clientsData = SUBS.clients.map(client => {
    const series = subsClientSeries(client, chartCols);
    const counts = subsSeriesWithCounts(series);
    const colors = subsClientColor(client);
    return { client, series, counts, ...colors };
  }).filter(d => d.counts.length >= 2);

  const cardsHtml = clientsData.map(({ client, series, counts, line, bg, fg }) => {
    const latest = counts[counts.length - 1];
    const prevDelta = latest?.weeklyDelta;
    const avg4 = subsAvgDeltas(counts, 4);
    const avgPrev4 = subsAvgDeltas(counts.slice(0, -4), 4);
    let trend = '→';
    let trendCls = '';
    if (avg4 != null && avgPrev4 != null) {
      if (avg4 > avgPrev4 * 1.05) { trend = '↑'; trendCls = 'is-pos'; }
      else if (avg4 < avgPrev4 * 0.95) { trend = '↓'; trendCls = 'is-neg'; }
    }
    const link = client.youtubeUrl
      ? `<a href="${escHtml(client.youtubeUrl)}" target="_blank" rel="noopener" class="sg-card-link">${escHtml(client.displayName)}</a>`
      : escHtml(client.displayName);

    return `<article class="sg-card" style="--sg-accent:${line};--sg-bg:${bg}">
      <header class="sg-card-hd">
        <span class="sg-card-name" style="color:${fg}">${link}</span>
        ${client.schedule ? `<span class="sg-card-sched">${escHtml(client.schedule)}</span>` : ''}
      </header>
      <div class="sg-card-stat">
        <span class="sg-card-count">${fmtSubNum(latest.count)}</span>
        <span class="sg-card-delta ${subsDeltaClass(prevDelta)}">${prevDelta != null ? subsFmtDelta(prevDelta) : ''}<span class="sg-card-delta-lbl">/週</span></span>
      </div>
      <div class="sg-card-meta">
        <span>4週平均 <strong class="${subsDeltaClass(avg4)}">${avg4 != null ? subsFmtDelta(avg4) : '—'}</strong>/週</span>
        <span class="sg-trend ${trendCls}">${trend}</span>
      </div>
      ${buildSparklineSvg(counts, { color: line })}
      <footer class="sg-card-foot">${escHtml(latest.label)} 時点 · 週${counts.length}</footer>
    </article>`;
  }).join('');

  const legendHtml = clientsData.map(({ client, line, fg }) =>
    `<span class="sg-legend-item"><span class="sg-legend-dot" style="background:${line}"></span><span style="color:${fg}">${escHtml(client.displayName)}</span></span>`
  ).join('');

  const overviewAbs = buildMultiLineChartSvg(clientsData, { indexed: false });
  const overviewIdx = buildMultiLineChartSvg(clientsData, { indexed: true });
  const deltaBars = buildDeltaBarChart(clientsData);

  const refreshBtnDisabled = canTriggerSubscribersRefresh() ? '' : ' disabled';
  wrap.innerHTML = `
    <div class="subs-hd">
      <div>
        <h2 class="subs-title">登録者グラフ</h2>
        <p class="subs-meta-line">${escHtml(SUBS.snapshotRule || '毎週月曜 9:00 JST')} · 更新: ${escHtml(updated)}
          · <button type="button" class="sg-tab-link" onclick="switchTab('subs')">表形式で見る →</button></p>
      </div>
      <div class="subs-actions sg-range-btns">
        <button type="button" class="btn btn-primary" onclick="triggerSubscribersRefresh()"${refreshBtnDisabled}>🔄 登録者更新</button>
        ${rangeOpts.map(o => `<button type="button" class="btn btn-sm ${subsGraphWeeks === o.n ? 'btn-primary' : 'btn-ghost'}" onclick="setSubsGraphWeeks(${o.n})">${o.label}</button>`).join('')}
      </div>
    </div>
    ${subscribersRefreshStatusHtml()}
    <div class="sg-legend">${legendHtml}</div>
    <div class="sg-overview">
      ${overviewAbs}
      ${overviewIdx}
      ${deltaBars}
    </div>
    <h3 class="sg-section-title">クライアント別</h3>
    <div class="sg-cards">${cardsHtml}</div>`;

  return wrap;
}

// ── Mobile Gantt（カード + 横スワイプタイムライン）────────────────────────────
function buildGanttMobile() {
  const panel = document.createElement('div');
  panel.className = 'gantt-panel gantt-panel-mobile';

  const wrap = document.createElement('div');
  wrap.className = 'mg-cards-wrap';

  const projects = filtered();
  if (!projects.length) {
    wrap.innerHTML = emptyState();
    panel.appendChild(wrap);
    return panel;
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'mg-toolbar';
  toolbar.innerHTML = `
    <span class="mg-toolbar-text">${projects.length}件 · 工程タップで進捗更新</span>
    <button type="button" class="btn btn-neutral btn-sm" id="mg-scroll-today">📍 今日へ</button>
  `;
  wrap.appendChild(toolbar);

  projects.forEach(p => wrap.appendChild(buildMobileGanttCard(p)));

  toolbar.querySelector('#mg-scroll-today')?.addEventListener('click', () => {
    const target = wrap.querySelector('.mg-tl-item.today')
      || wrap.querySelector('.mg-tl-item.is-overdue')
      || wrap.querySelector('.mg-timeline');
    target?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  });

  panel.appendChild(wrap);
  return panel;
}

function buildMobileTimeline(p) {
  const timeline = document.createElement('div');
  timeline.className = 'mg-timeline';
  const sds = projectStageSchedule(p);

  if (!sds.length) {
    const empty = document.createElement('p');
    empty.className = 'mg-tl-empty';
    empty.textContent = '投稿日・撮影日を設定すると工程タイムラインが表示されます';
    timeline.appendChild(empty);
    return timeline;
  }

  sds.forEach(sd => {
    const st = p.stageStatuses[sd.name] || '未着手';
    const done = st === '完了' || st === 'スキップ';
    const over = !done && sd.date < TODAY;
    const isT = sameDay(sd.date, TODAY);
    const sc = SS_STYLE[st] || SS_STYLE['未着手'];

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'mg-tl-item'
      + (done ? ' is-done' : '')
      + (over ? ' is-overdue' : '')
      + (isT ? ' today' : '')
      + (sd.isManual ? ' is-manual' : '');
    if (!canEdit()) item.disabled = true;
    item.innerHTML = `
      <span class="mg-tl-date">${fmtMD(sd.date)}<span class="mg-tl-wd">${weekday[sd.date.getDay()]}</span></span>
      <span class="mg-tl-badge" style="background:${sd.bg};color:${sd.fg}">${sd.abbr}</span>
      <span class="mg-tl-name">${sd.name}</span>
      <span class="mg-tl-st" style="background:${sc.bg};color:${sc.fg}">${st}</span>
    `;
    if (canEdit()) item.addEventListener('click', e => showPopup(e, p.id, sd.name));
    timeline.appendChild(item);
  });

  requestAnimationFrame(() => {
    const focus = timeline.querySelector('.mg-tl-item.today')
      || timeline.querySelector('.mg-tl-item.is-overdue');
    focus?.scrollIntoView({ inline: 'center', block: 'nearest' });
  });

  return timeline;
}

function buildMobileGanttCard(p) {
  const card = document.createElement('article');
  card.className = 'mg-card';
  if (isOverdue(p)) card.classList.add('mg-card-overdue');

  const chBg = CH_BG[p.channel] || '#fff';
  const chFg = CH_FG[p.channel] || '#333';
  const cs = CS_STYLE[p.currentStatus] || CS_STYLE['企画'];
  const daysLeft = p.postDate ? Math.ceil((p.postDate - TODAY) / 86400000) : null;

  const head = document.createElement('div');
  head.className = 'mg-card-head';
  head.style.background = chBg;
  head.innerHTML = `
    <div class="mg-card-head-main">
      <div class="mg-card-ch" style="color:${chFg}">${p.channel}
        ${p.type === 'ショート' ? '<span class="mg-short">SHORT</span>' : ''}
      </div>
      <div class="mg-card-title">${p.title}</div>
      <div class="mg-card-meta">
        <span>${p.staff || '—'}</span>
        ${p.postDate ? `<span>投稿 ${fmtDate(p.postDate)}</span>` : '<span>投稿日未設定</span>'}
        ${daysLeft !== null ? `<span class="mg-days${daysLeft < 0 ? ' is-over' : daysLeft <= 3 ? ' is-soon' : ''}">${
          daysLeft < 0 ? `${Math.abs(daysLeft)}日超過` : daysLeft === 0 ? '今日投稿' : `あと${daysLeft}日`
        }</span>` : ''}
      </div>
    </div>
    <div class="mg-card-head-side">
      <span class="cs" style="background:${cs.bg};color:${cs.fg}">${p.currentStatus || '企画'}</span>
      ${p.material ? `<a href="${p.material}" class="mg-link" target="_blank" rel="noopener noreferrer" aria-label="素材">🔗</a>` : ''}
      ${canEdit() ? '<button type="button" class="mg-edit-btn" aria-label="編集">✏️</button>' : ''}
    </div>
  `;
  head.querySelector('.mg-edit-btn')?.addEventListener('click', () => openEdit(p.id));
  card.appendChild(head);
  card.appendChild(buildMobileTimeline(p));
  return card;
}

// ── Mobile card view ─────────────────────────────────────────────────────────
function buildMobileCards() {
  const panel = document.createElement('div');
  panel.className = 'list-panel list-panel-mobile';

  const wrap = document.createElement('div');
  wrap.className = 'm-cards-wrap';
  wrap.style.paddingTop = '8px';

  const projects = filtered();
  if (!projects.length) {
    wrap.innerHTML = emptyState();
    panel.appendChild(wrap);
    return panel;
  }

  projects.forEach(p => {
    const chBg = CH_BG[p.channel] || '#fff';
    const chFg = CH_FG[p.channel] || '#333';
    const cs   = CS_STYLE[p.currentStatus] || CS_STYLE['企画'];
    const daysLeft = p.postDate ? Math.ceil((p.postDate - TODAY) / 86400000) : null;
    const dayStr = daysLeft === null ? ''
      : daysLeft < 0  ? `<span style="color:#C0392B;font-weight:700">${Math.abs(daysLeft)}日超過</span>`
      : daysLeft === 0 ? `<span style="color:#C0392B;font-weight:700">今日</span>`
      : `<span style="color:#555">あと${daysLeft}日</span>`;

    const card = document.createElement('div');
    card.className = 'm-card';

    // Head
    const head = document.createElement('div');
    head.className = 'm-card-head';
    head.style.background = chBg;
    head.innerHTML = `
      <span style="font-size:12px;font-weight:800;color:${chFg}">${p.channel}</span>
      ${p.type==='ショート'?'<span style="background:#F59E0B;color:#fff;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:800">SHORT</span>':''}
      <span style="margin-left:auto;display:flex;align-items:center;gap:8px">
        <span class="cs" style="background:${cs.bg};color:${cs.fg}">${p.currentStatus||'企画'}</span>
      </span>`;
    card.appendChild(head);

    // Body
    const body = document.createElement('div');
    body.className = 'm-card-body';
    body.innerHTML = `
      <div class="m-card-title">${p.title}</div>
      <div class="m-card-meta">
        <span>${p.staff||'—'}</span>
        ${p.postDate ? `<span>•</span><span style="font-weight:700">${fmtDate(p.postDate)}</span><span>${dayStr}</span>` : '<span style="color:#bbb">日付未設定</span>'}
      </div>`;
    card.appendChild(body);

    // Timeline
    card.appendChild(buildMobileTimeline(p));

    // Footer
    const foot = document.createElement('div');
    foot.className = 'm-card-foot';
    foot.innerHTML = `
      ${p.material ? `<a href="${p.material}" target="_blank" rel="noopener" style="font-size:22px;text-decoration:none">🔗</a>` : '<span style="color:#ddd;font-size:12px">素材なし</span>'}
      ${canEdit() ? `<button class="btn btn-sm btn-neutral" onclick="openEdit('${p.id}')" style="margin-left:auto">✏️ 編集</button>` : ''}`;
    card.appendChild(foot);

    wrap.appendChild(card);
  });

  panel.appendChild(wrap);
  return panel;
}

function emptyState() {
  if (S.tab === 'closed') {
    return `<div class="empty-state">
      <div class="empty-state-icon">✅</div>
      <div class="empty-state-title">クローズ済みの案件はありません</div>
      <div>ガント・一覧で案件を選択し、<strong>📦 アーカイブ</strong> でここに移動できます</div>
    </div>`;
  }
  if (!S.projects.length) {
    const cta = canEdit()
      ? `<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
          <button type="button" class="btn btn-primary" onclick="openBulkAdd()">＋ 一括追加</button>
          <button type="button" class="btn btn-neutral" onclick="openAdd()">＋ 1件追加</button>
        </div>`
      : '';
    return `<div class="empty-state">
      <div class="empty-state-icon">✨</div>
      <div class="empty-state-title">案件がまだありません</div>
      <div><strong>＋ 一括</strong> で複数行入力、またはスプレッドシートから貼り付け</div>
      <div style="margin-top:10px;font-size:12px;color:var(--muted)">以前のデータがある場合は <strong>📤 インポート</strong> で JSON を復元できます</div>
      ${cta}
    </div>`;
  }
  return `<div class="empty-state">
    <div class="empty-state-icon">📋</div>
    <div class="empty-state-title">該当する案件がありません</div>
    <div>フィルターまたは検索条件を変更してください</div>
  </div>`;
}

// ── Stage popup ───────────────────────────────────────────────────────────────
let popState = { pid: null, sname: null };

function showPopup(e, pid, sname) {
  if (!canEdit()) return;
  e.stopPropagation();
  popState = { pid, sname };
  const pop = document.getElementById('spop');
  document.getElementById('spop-title').textContent = sname;

  const opts = document.getElementById('spop-opts');
  opts.innerHTML = '';

  const p = S.projects.find(x=>x.id===pid);
  const cur = p?.stageStatuses[sname]||'未着手';

  STAGE_STATUSES.forEach(opt => {
    const sc = SS_STYLE[opt]||SS_STYLE['未着手'];
    const div = document.createElement('div');
    div.className = 'spop-opt';
    if (opt === cur) div.style.background = '#F0F4FF';
    div.innerHTML = `
      <span class="sdot" style="background:${sc.bg};border:2px solid ${sc.fg}"></span>
      <span>${opt}</span>
      ${opt===cur?'<span style="margin-left:auto;font-size:11px;color:#6B7280">✓</span>':''}`;
    div.onclick = () => {
      updateStage(pid, sname, opt);
      pop.hidden = true;
    };
    opts.appendChild(div);
  });

  const rect = e.target.getBoundingClientRect();
  if (isMobile()) {
    pop.style.left = '50%';
    pop.style.transform = 'translateX(-50%)';
    pop.style.top = 'auto';
    pop.style.bottom = '72px';
  } else {
    const popW = 180;
    pop.style.transform = '';
    pop.style.bottom = '';
    pop.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - popW - 8)) + 'px';
    pop.style.top = Math.min(rect.bottom + 4, window.innerHeight - 220) + 'px';
  }
  pop.hidden = false;
}

const STAGE_TO_STATUS = Object.fromEntries(STAGES.map(s => [s.name, s.name]));

function syncStageStatusesFromCurrentStatus(p) {
  const cs = p.currentStatus;
  if (!cs || DONE_STATUSES.has(cs)) return;
  const stages = getEnabledStages(p);
  const idx = stages.findIndex(s => s.name === cs);
  if (idx < 0) return;
  stages.forEach((s, i) => {
    const cur = p.stageStatuses[s.name] || '未着手';
    if (cur === '完了' || cur === 'スキップ') return;
    if (i < idx && cur === '未着手') p.stageStatuses[s.name] = '完了';
    else if (i === idx && (cur === '未着手' || cur === '遅延')) p.stageStatuses[s.name] = '進行中';
  });
}

function deriveCurrentStatus(p) {
  if (p.currentStatus === 'ボツ' || p.currentStatus === 'クローズ') return p.currentStatus;
  if (p.stageStatuses['投稿'] === '完了') return '投稿';
  const stages = getEnabledStages(p);
  const inProgress = [...stages].reverse().find(s => p.stageStatuses[s.name] === '進行中');
  if (inProgress) return inProgress.name;
  const firstActive = stages.find(s => p.stageStatuses[s.name] !== '完了' && p.stageStatuses[s.name] !== 'スキップ');
  if (firstActive) return firstActive.name;
  return '完成';
}

function updateStage(pid, sname, status) {
  const p = S.projects.find(x=>x.id===pid);
  if (!p) return;
  p.stageStatuses[sname] = status;
  markUserSet(p, 'currentStatus');
  const stage = STAGES.find(s => s.name === sname);
  if (stage) markUserSet(p, `stage.${stage.id}`);

  if (status === '完了') {
    const stages = getEnabledStages(p);
    const idx = stages.findIndex(s => s.name === sname);
    if (idx >= 0 && idx < stages.length - 1) {
      const next = stages[idx + 1];
      if (p.stageStatuses[next.name] === '未着手') {
        p.stageStatuses[next.name] = '進行中';
      }
    }
  }

  p.currentStatus = deriveCurrentStatus(p);

  persist();
  render();
}

// ── 今週（チーム向け） ────────────────────────────────────────────────────────
const WEEK_FB_STAGES = ['FB', 'FB（施工・台本）'];
const WEEK_SUBMIT_STAGES = ['M提出', 'C提出'];

/** 三浦対応キュー：FB系＋完成（前工程がすべて完了している案件） */
const TAK_WAITING_STAGES = ['FB', 'FB（施工・台本）', '完成'];

const WEEK_WAITING_SECTIONS = [
  { title: '三浦対応待ち', stages: TAK_WAITING_STAGES, icon: '👤' },
];

function isTakWaitingStage(p, stageName) {
  const stages = getEnabledStages(p);
  const idx = stages.findIndex(s => s.name === stageName);
  if (idx > 0) {
    for (let i = 0; i < idx; i += 1) {
      const prev = stages[i].name;
      const prevSt = p.stageStatuses[prev] || '未着手';
      if (prevSt !== '完了' && prevSt !== 'スキップ') return false;
    }
  }

  const st = p.stageStatuses[stageName] || '未着手';
  if (st === '完了' || st === 'スキップ') return false;
  if (st === '進行中' || st === '遅延') return true;
  if (p.currentStatus !== stageName) return false;
  return true;
}

function isStageWaiting(p, stageName) {
  return isTakWaitingStage(p, stageName);
}

function getWaitingStageEntry(p, stageNames) {
  const inProgress = [...stageNames].reverse().find(s => {
    const st = p.stageStatuses[s] || '未着手';
    return (st === '進行中' || st === '遅延') && isTakWaitingStage(p, s);
  });
  if (inProgress) return { name: inProgress, date: getStageDate(p, inProgress) };

  if (stageNames.includes(p.currentStatus) && isTakWaitingStage(p, p.currentStatus)) {
    return { name: p.currentStatus, date: getStageDate(p, p.currentStatus) };
  }
  return null;
}

function weekRangeEnd() {
  return addDays(TODAY, 7);
}

function isInWeek(d) {
  return d && d >= TODAY && d <= weekRangeEnd();
}

function getStageDate(p, stageName) {
  const sd = projectStageSchedule(p).find(s => s.name === stageName);
  return sd?.date || null;
}

function isStageOpen(p, stageName) {
  const st = p.stageStatuses[stageName] || '未着手';
  return st !== '完了' && st !== 'スキップ';
}

function isProjectDelayed(p) {
  if (!isActiveStatus(p.currentStatus)) return false;
  if (isOverdue(p)) return true;
  return projectStageSchedule(p).some(sd => {
    const st = p.stageStatuses[sd.name] || '未着手';
    return sd.date < TODAY && st !== '完了' && st !== 'スキップ';
  });
}

function isStageInWeek(p, stageName) {
  const d = getStageDate(p, stageName);
  return !!(d && isInWeek(d));
}

function isStageScheduledThisWeek(p, stageNames) {
  return stageNames.some(name => isStageInWeek(p, name));
}

/** 今週セクション用: 対象工程のうち今週の予定（未完了優先） */
function weekStageEntry(p, stageNames) {
  const items = stageNames
    .map(name => ({
      name,
      date: getStageDate(p, name),
      open: isStageOpen(p, name),
    }))
    .filter(x => x.date && isInWeek(x.date));
  if (!items.length) return null;
  const open = items.filter(x => x.open);
  const pool = open.length ? open : items;
  pool.sort((a, b) => a.date - b.date);
  return pool[0];
}

function getPostPublishDate(p) {
  return getPublishAnchor(p);
}

function isPostScheduledThisWeek(p) {
  const d = getPostPublishDate(p);
  return !!(d && isInWeek(d));
}

function getStatusStageDate(p) {
  return getStageDate(p, p.currentStatus);
}

function fmtWeekDateCell(date, { done = false, overdue = false } = {}) {
  if (!date) return '—';
  const cls = done ? 'week-date-done' : (overdue ? 'week-date-over' : '');
  return `<span class="${cls}">${fmtDate(date)}</span>`;
}

function buildWeekMobileCard(p, opts = {}) {
  const { mode, done, delayed, weekEntry, displayDate, waitingStage } = opts;
  const waitStatus = waitingStage?.name || p.currentStatus;
  const cs = CS_STYLE[waitStatus] || CS_STYLE[p.currentStatus] || CS_STYLE['企画'];
  const fg = CH_FG[p.channel] || '#333';
  const isMine = S.viewerName && p.staff === S.viewerName;
  const classes = ['wk-card'];
  if (done) classes.push('wk-card-done');
  if (delayed && !done) classes.push('wk-card-delayed');
  if (isMine && !done) classes.push('wk-card-mine');

  const dates = [];
  if (mode === 'delayed' || mode === 'wait') {
    const stageDate = waitingStage?.date ?? getStatusStageDate(p);
    const stageName = waitingStage?.name ?? p.currentStatus;
    const stageOver = stageDate && stageDate < TODAY && isStageOpen(p, stageName);
    const postOver = getPostPublishDate(p) && getPostPublishDate(p) < TODAY;
    dates.push({ label: '工程予定日', date: stageDate, overdue: stageOver, primary: true });
    dates.push({ label: '投稿予定日', date: getPostPublishDate(p), overdue: postOver });
  } else if (mode === 'fb') {
    dates.push({ label: 'FB予定日', date: weekEntry?.date, primary: true });
  } else if (mode === 'submit') {
    dates.push({ label: '提出予定日', date: weekEntry?.date, primary: true });
  } else if (mode === 'post') {
    dates.push({ label: '投稿予定日', date: displayDate ?? getPostPublishDate(p), primary: true });
  }

  const datesHtml = dates.map(d => `
    <div class="wk-date-item${d.primary ? ' is-primary' : ''}">
      <span class="wk-date-label">${d.label}</span>
      <span class="wk-date-val${d.overdue ? ' week-date-over' : ''}${done ? ' week-date-done' : ''}">${d.date ? fmtDate(d.date) : '—'}</span>
    </div>`).join('');

  const typeBadge = `<span class="wk-type">${p.type === 'ショート' ? 'SHORT' : '通常'}</span>`;

  const statusClick = canEdit()
    ? ` role="button" tabindex="0" onclick="showPopup(event,'${p.id}','${escAttr(waitStatus)}')" onkeydown="if(event.key==='Enter')showPopup(event,'${p.id}','${escAttr(waitStatus)}')"`
    : '';

  const editBtn = canEdit()
    ? `<button type="button" class="wk-edit-btn" onclick="openEdit('${p.id}')" aria-label="編集">✏️</button>`
    : '';

  return `<div class="${classes.join(' ')}">
    <div class="wk-card-top">
      <span class="wk-card-ch" style="color:${done ? '#9ca3af' : fg}">${p.channel}</span>
      ${typeBadge}
      <span class="cs wk-status-tap" style="background:${cs.bg};color:${cs.fg}"${statusClick}>${waitStatus}</span>
    </div>
    <div class="wk-card-title${done ? ' is-done' : ''}"${canEdit() ? ` role="button" tabindex="0" onclick="openEdit('${p.id}')"` : ''}>${p.title}</div>
    <div class="wk-card-dates">${datesHtml}</div>
    <div class="wk-card-foot">
      <span class="wk-staff">${p.staff || '—'}${isMine && !done ? ' ★' : ''}</span>
      <span class="next-action">${done ? '完了' : nextAction(waitStatus)}</span>
      ${p.material ? `<a href="${p.material}" class="wk-link" target="_blank" rel="noopener">🔗</a>` : ''}
      ${editBtn}
    </div>
  </div>`;
}

// ── 次回撮影日 ────────────────────────────────────────────────────────────────
function shootDeadlineCellHtml(entry) {
  const { text, overdue } = formatShootDeadline(entry);
  if (text === '—') return '<td class="shoot-deadline"><span style="color:#bbb">—</span></td>';
  return `<td class="shoot-deadline"><span class="shoot-deadline-val${overdue ? ' is-over' : ''}">${text}</span></td>`;
}

function refreshShootDeadlineCell(row, entry) {
  const cell = row?.querySelector('.shoot-deadline');
  if (!cell) return;
  const { text, overdue } = formatShootDeadline(entry);
  if (text === '—') {
    cell.innerHTML = '<span style="color:#bbb">—</span>';
    return;
  }
  cell.innerHTML = `<span class="shoot-deadline-val${overdue ? ' is-over' : ''}">${text}</span>`;
}

function buildShootingSchedule() {
  ensureShootingScheduleChannels();
  const channels = getChannelList();
  const wrap = document.createElement('div');
  wrap.className = 'dash-wrap';
  const editable = canEdit();

  const shootDateCell = (ch, field, value) => {
    const pastCls = field === 'nextShoot' && isShootDatePast(value) ? ' is-past' : '';
    if (!editable) {
      if (!value) return '<td><span style="color:#bbb">—</span></td>';
      return `<td><span class="shoot-date-val${pastCls}">${fmtDate(parseDate(value))}</span></td>`;
    }
    return `<td><input type="date" class="shoot-date${pastCls}" data-ch="${escAttr(ch)}" data-field="${field}" value="${escAttr(value || '')}"></td>`;
  };

  const postsPerWeekCell = (ch, value) => {
    if (!editable) {
      const label = value === 1 ? '週1' : value === 2 ? '週2' : '—';
      return `<td>${label}</td>`;
    }
    return `<td><select class="shoot-weekly" data-ch="${escAttr(ch)}" data-field="postsPerWeek">
      <option value=""${value === '' ? ' selected' : ''}>—</option>
      <option value="1"${value === 1 ? ' selected' : ''}>週1</option>
      <option value="2"${value === 2 ? ' selected' : ''}>週2</option>
    </select></td>`;
  };

  let rows = '';
  channels.forEach(ch => {
    const entry = getShootingEntry(ch);
    const fg = CH_FG[ch] || '#333';
    rows += `<tr data-shoot-ch="${escAttr(ch)}">
      <td class="shoot-ch" style="text-align:left"><span style="font-weight:800;color:${fg}">${ch}</span></td>
      ${postsPerWeekCell(ch, entry.postsPerWeek)}
      ${shootDateCell(ch, 'lastPost', entry.lastPost)}
      ${shootDeadlineCellHtml(entry)}
      ${shootDateCell(ch, 'nextShoot', entry.nextShoot)}
      ${shootDateCell(ch, 'nextNextShoot', entry.nextNextShoot)}
    </tr>`;
  });

  wrap.innerHTML = `
    <div class="section-title" style="margin-bottom:4px">📷 次回撮影日</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">週本数と最終投稿日から撮影期限を自動計算（${shootDeadlineHelpText()}）</div>
    <div class="shoot-tbl-wrap">
      <table class="sum-tbl shoot-tbl">
        <thead><tr>
          <th style="text-align:left">クライアント</th>
          <th>週本数</th>
          <th>最終投稿日</th>
          <th>撮影期限</th>
          <th>次回撮影</th>
          <th>次々回撮影</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  if (editable) {
    const onFieldChange = (el) => {
      const ch = el.dataset.ch;
      const field = el.dataset.field;
      const entry = getShootingEntry(ch);
      if (field === 'postsPerWeek') {
        const v = el.value;
        entry.postsPerWeek = v === '1' ? 1 : v === '2' ? 2 : '';
      } else {
        entry[field] = el.value || '';
      }
      if (!entry._userSet) entry._userSet = {};
      entry._userSet[field] = true;
      persist();
      if (field === 'nextShoot') {
        el.classList.toggle('is-past', isShootDatePast(entry.nextShoot));
      }
      if (field === 'lastPost' || field === 'postsPerWeek' || field === 'nextShoot') {
        refreshShootDeadlineCell(el.closest('tr'), entry);
      }
    };
    wrap.querySelectorAll('.shoot-date, .shoot-weekly').forEach(el => {
      el.addEventListener('change', () => onFieldChange(el));
    });
  }

  return wrap;
}

function renderWeekTaskRow(p, opts = {}) {
  const waitStatus = opts.waitingStage?.name || p.currentStatus;
  const cs = CS_STYLE[waitStatus] || CS_STYLE[p.currentStatus] || CS_STYLE['企画'];
  const fg = CH_FG[p.channel] || '#333';
  const isMine = S.viewerName && p.staff === S.viewerName;
  const classes = [];
  if (opts.done) classes.push('week-row-done');
  const rowStyle = opts.delayed && !opts.done
    ? ' style="background:#fef2f2"'
    : (isMine && !opts.done ? ' style="background:#eff6ff"' : '');

  let dateCells = '';
  if (opts.mode === 'delayed' || opts.mode === 'wait') {
    const stageDate = opts.waitingStage?.date ?? getStatusStageDate(p);
    const stageName = opts.waitingStage?.name ?? p.currentStatus;
    const stageOver = stageDate && stageDate < TODAY && isStageOpen(p, stageName);
    const postOver = getPostPublishDate(p) && getPostPublishDate(p) < TODAY;
    dateCells = `
      <td>${fmtWeekDateCell(stageDate, { overdue: stageOver })}</td>
      <td>${fmtWeekDateCell(getPostPublishDate(p), { overdue: postOver })}</td>`;
  } else if (opts.mode === 'fb' || opts.mode === 'submit') {
    const entry = opts.weekEntry;
    dateCells = `<td>${fmtWeekDateCell(entry?.date, { done: opts.done })}</td>`;
  } else if (opts.mode === 'post') {
    const postD = opts.displayDate ?? getPostPublishDate(p);
    dateCells = `<td>${fmtWeekDateCell(postD, { done: opts.done })}</td>`;
  }

  const typeCell = `<td>${p.type === 'ショート'
    ? '<span style="background:#F59E0B;color:#fff;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:800">SHORT</span>'
    : '<span style="font-size:11px;color:#666">通常</span>'}</td>`;

  return `<tr class="${classes.join(' ')}"${rowStyle}>
    <td style="text-align:left"><span style="font-weight:800;color:${opts.done ? '#9ca3af' : fg}">${p.channel}</span> <span${opts.done ? ' style="color:#9ca3af"' : ''}>${p.title}</span></td>
    <td>${p.staff || '—'}${isMine && !opts.done ? ' ★' : ''}</td>
    ${typeCell}
    ${dateCells}
    <td><span class="cs" style="background:${cs.bg};color:${cs.fg}">${waitStatus}</span></td>
    <td><span class="next-action">${opts.done ? '完了' : nextAction(waitStatus)}</span></td>
    <td>${p.material ? `<a href="${p.material}" target="_blank" rel="noopener">🔗</a>` : '—'}</td>
  </tr>`;
}

function renderWeekSection(title, items, opts = {}) {
  const { emptyIcon = '📋', delayed = false, mode = 'default' } = opts;
  const count = items.length;
  const titleClass = delayed ? 'week-group-title is-today' : 'week-group-title';
  let html = `<div class="${titleClass}">${title} · ${count}件</div>`;
  if (!count) {
    html += `<div style="background:#fff;border-radius:10px;border:1px solid var(--border);padding:16px;text-align:center;color:#aaa;margin-bottom:16px">${emptyIcon} 該当なし</div>`;
    return html;
  }

  let headers;
  if (mode === 'delayed') {
    headers = ['クライアント / 企画', '担当', 'タイプ', '工程予定日', '投稿予定日', '待ち状態', '次のアクション', '素材'];
  } else if (mode === 'fb') {
    headers = ['クライアント / 企画', '担当', 'タイプ', 'FB予定日', '待ち状態', '次のアクション', '素材'];
  } else if (mode === 'wait') {
    headers = ['クライアント / 企画', '担当', 'タイプ', '工程予定日', '投稿予定日', '待ち状態', '次のアクション', '素材'];
  } else if (mode === 'submit') {
    headers = ['クライアント / 企画', '担当', 'タイプ', '提出予定日', '待ち状態', '次のアクション', '素材'];
  } else if (mode === 'post') {
    headers = ['クライアント / 企画', '担当', 'タイプ', '投稿予定日', '待ち状態', '次のアクション', '素材'];
  } else {
    headers = ['クライアント / 企画', '担当', 'タイプ', '待ち状態', '次のアクション', '素材'];
  }

  if (isMobile()) {
    html += '<div class="week-m-cards">';
    items.forEach(({ p, done, weekEntry, displayDate, waitingStage }) => {
      html += buildWeekMobileCard(p, { ...opts, done, delayed, weekEntry, displayDate, waitingStage });
    });
    html += '</div>';
  } else {
    html += `<table class="sum-tbl"><thead><tr>`;
    headers.forEach((h, i) => {
      html += `<th${i === 0 ? ' style="text-align:left"' : ''}>${h}</th>`;
    });
    html += `</tr></thead><tbody>`;
    items.forEach(({ p, done, weekEntry, displayDate, waitingStage }) => {
      html += renderWeekTaskRow(p, { ...opts, done, delayed, weekEntry, displayDate, waitingStage });
    });
    html += '</tbody></table>';
  }

  return html;
}

function sortWeekItems(items, dateFn) {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const da = dateFn(a);
    const db = dateFn(b);
    if (!da && !db) return (a.p.postOrder || 0) - (b.p.postOrder || 0);
    if (!da) return 1;
    if (!db) return -1;
    if (da !== db) return da - db;
    return (a.p.postOrder || 0) - (b.p.postOrder || 0);
  });
}

function buildWeekWaitingItems(projects, stageNames, excludeIds = new Set()) {
  return sortWeekItems(
    projects
      .filter(p => getWaitingStageEntry(p, stageNames) && !excludeIds.has(p.id))
      .map(p => ({
        p,
        done: false,
        waitingStage: getWaitingStageEntry(p, stageNames),
      })),
    item => item.waitingStage?.date || getPostPublishDate(item.p)
  );
}

function buildWeekFbItems(projects) {
  return sortWeekItems(
    projects
      .filter(p => isStageScheduledThisWeek(p, WEEK_FB_STAGES))
      .map(p => {
        const entry = weekStageEntry(p, WEEK_FB_STAGES);
        return { p, done: entry ? !entry.open : false, weekEntry: entry };
      }),
    item => item.weekEntry?.date
  );
}

function buildWeekSubmitItems(projects) {
  return sortWeekItems(
    projects
      .filter(p => isStageScheduledThisWeek(p, WEEK_SUBMIT_STAGES))
      .map(p => {
        const entry = weekStageEntry(p, WEEK_SUBMIT_STAGES);
        return { p, done: entry ? !entry.open : false, weekEntry: entry };
      }),
    item => item.weekEntry?.date
  );
}

function buildWeekPostItems(projects) {
  return sortWeekItems(
    projects
      .filter(p => isPostScheduledThisWeek(p))
      .map(p => {
        const postD = getPostPublishDate(p);
        const posted = p.stageStatuses['投稿'] === '完了' || p.stageStatuses['投稿'] === 'スキップ'
          || p.currentStatus === '投稿' || p.currentStatus === 'クローズ';
        return { p, done: posted, displayDate: postD };
      }),
    item => item.displayDate
  );
}

function buildDelayedItems(projects) {
  return sortWeekItems(
    projects.filter(isProjectDelayed).map(p => ({ p, done: false })),
    item => getStatusStageDate(item.p)
  );
}

function buildTeamWeek() {
  const wrap = document.createElement('div');
  wrap.className = 'dash-wrap';

  const weekBase = S.projects.filter(p =>
    matchesFilters(p) && p.currentStatus !== 'ボツ'
  );
  const waitingBase = S.projects.filter(p =>
    matchesWaitingFilters(p) && isActiveStatus(p.currentStatus)
  );
  const active = weekBase.filter(p => isActiveStatus(p.currentStatus));
  const shown = new Set();

  const waitingSections = WEEK_WAITING_SECTIONS.map(sec => {
    const items = buildWeekWaitingItems(waitingBase, sec.stages, shown);
    items.forEach(({ p }) => shown.add(p.id));
    return { ...sec, items };
  });

  const delayedItems = buildDelayedItems(active.filter(p => !shown.has(p.id)));
  delayedItems.forEach(({ p }) => shown.add(p.id));

  const weekSubmitItems = buildWeekSubmitItems(weekBase.filter(p => !shown.has(p.id)));
  weekSubmitItems.forEach(({ p }) => shown.add(p.id));

  const weekPostItems = buildWeekPostItems(weekBase.filter(p => !shown.has(p.id)));

  const viewerLabel = S.viewerName
    ? (S.mineOnly ? `${S.viewerName} の担当` : `全員（${S.viewerName} 選択中）`)
    : 'チーム全体';

  const hasAny = waitingSections.some(s => s.items.length)
    || delayedItems.length || weekSubmitItems.length || weekPostItems.length;

  let html = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;gap:12px;flex-wrap:wrap">
      <div>
        <div class="section-title" style="margin-bottom:4px">📆 今週のタスク</div>
        <div style="font-size:12px;color:var(--muted)">${viewerLabel} · グレー行は完了済み · 三浦対応待ちは担当フィルター非適用</div>
      </div>
    </div>`;

  if (!S.projects.length) {
    html += emptyState();
    wrap.innerHTML = html;
    return wrap;
  }

  if (!hasAny) {
    html += `<div class="empty-state" style="margin-bottom:16px"><div class="empty-state-icon">🎉</div><div class="empty-state-title">今週のタスクはありません</div></div>`;
  }

  for (const sec of waitingSections) {
    html += renderWeekSection(sec.title, sec.items, { mode: 'wait', emptyIcon: sec.icon });
  }
  html += renderWeekSection('⚠ 現状の遅れ', delayedItems, {
    mode: 'delayed', delayed: true, emptyIcon: '✅',
  });
  html += renderWeekSection('今週の提出', weekSubmitItems, {
    mode: 'submit', stageNames: WEEK_SUBMIT_STAGES, emptyIcon: '📤',
  });
  html += renderWeekSection('今週の投稿', weekPostItems, {
    mode: 'post', emptyIcon: '📅',
  });

  wrap.innerHTML = html;
  return wrap;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
let modalPostAnchor = null;

function preserveFormPostDate() {
  const el = document.getElementById('f-date');
  return el?.value || '';
}

function restoreFormPostDate(saved) {
  const el = document.getElementById('f-date');
  if (el && saved && el.value !== saved) el.value = saved;
}

function renderStagesEditor(project) {
  const list = document.getElementById('f-stages-list');
  if (!list) return;
  const enabled = project?.enabledStages || DEFAULT_ENABLED_STAGE_IDS;
  const manuals = project?.manualStageDates || {};
  const preview = {
    postDate: project?.postDate || getFormPublishAnchor(),
    enabledStages: enabled.slice(),
    manualStageDates: { ...manuals },
  };

  list.innerHTML = STAGES.map(stage => {
    const checked = enabled.includes(stage.id);
    const isPublish = stage.id === 'toukou';
    const manualVal = isPublish
      ? dateToInput(preview.postDate)
      : (manuals[stage.id] ? dateToInput(manuals[stage.id]) : '');
    const autoDate = checked ? computeStageDate(preview, stage) : null;
    const autoLabel = isPublish
      ? (preview.postDate ? `投稿予定日: ${fmtDate(preview.postDate)}` : '投稿予定日を設定')
      : stage.rule.type === 'manual'
        ? (manualVal ? `手入力: ${fmtDate(parseDate(manualVal))}` : '日付を入力')
        : (autoDate ? `自動: ${fmtDate(autoDate)}` : '—');
    const dateTitle = isPublish
      ? '投稿予定日と同期（上部の投稿予定日で変更）'
      : (stage.rule.type === 'manual' ? '手入力（必須）' : '手入力で上書き');
    return `
      <div class="stage-row" data-stage-id="${stage.id}">
        <label class="stage-check">
          <input type="checkbox" class="stage-enable" data-stage-id="${stage.id}"${checked ? ' checked' : ''}>
          <span class="stage-name" style="background:${stage.bg};color:${stage.fg}">${stage.abbr}</span>
          <span>${stage.name}</span>
        </label>
        <span class="stage-auto">${autoLabel}</span>
        <input type="date" class="stage-date-input" value="${manualVal}" title="${dateTitle}"${isPublish ? ' disabled' : ''}>
      </div>`;
  }).join('');

  list.querySelectorAll('.stage-enable, .stage-date-input').forEach(el => {
    el.addEventListener('change', () => {
      const savedPost = preserveFormPostDate();
      refreshStageAutoDates();
      restoreFormPostDate(savedPost);
    });
  });
}

function readStagesFromForm() {
  const enabledStages = [];
  const manualStageDates = {};
  document.querySelectorAll('#f-stages-list .stage-row').forEach(row => {
    const id = row.dataset.stageId;
    const enabled = row.querySelector('.stage-enable')?.checked;
    if (enabled) enabledStages.push(id);
    if (id === 'toukou') return;
    const dateVal = row.querySelector('.stage-date-input')?.value;
    if (enabled && dateVal) manualStageDates[id] = dateVal;
  });
  return { enabledStages, manualStageDates };
}

function refreshStageAutoDates() {
  const postDate = getFormPublishAnchor() || modalPostAnchor;
  const { enabledStages, manualStageDates } = readStagesFromForm();
  const preview = { postDate, enabledStages, manualStageDates };
  document.querySelectorAll('#f-stages-list .stage-row').forEach(row => {
    const stage = getStageById(row.dataset.stageId);
    const autoEl = row.querySelector('.stage-auto');
    if (!stage || !autoEl) return;
    if (!row.querySelector('.stage-enable')?.checked) {
      autoEl.textContent = '—';
      return;
    }
    const manualVal = row.querySelector('.stage-date-input')?.value;
    if (stage.rule.type === 'manual') {
      autoEl.textContent = manualVal ? `手入力: ${fmtDate(parseDate(manualVal))}` : '日付を入力';
      return;
    }
    if (manualVal) {
      autoEl.textContent = `手入力: ${fmtDate(parseDate(manualVal))}`;
      return;
    }
    const autoDate = computeStageDate(preview, stage);
    autoEl.textContent = autoDate ? `自動: ${fmtDate(autoDate)}` : '—';
  });
}

function openAdd() {
  if (!canEdit()) return;
  document.getElementById('modal-title').textContent = '新規案件追加';
  document.getElementById('f-id').value = '';
  clearAddOptionInputs();
  populateFormSelects();
  document.getElementById('f-channel').value = '';
  document.getElementById('f-staff').value = '';
  document.getElementById('f-title').value = '';
  document.getElementById('f-type').value = '通常';
  document.getElementById('f-date').value = '';
  document.getElementById('f-status').value = '企画';
  document.getElementById('f-material').value = '';
  document.getElementById('btn-delete').hidden = true;
  modalPostAnchor = null;
  document.getElementById('overlay').hidden = false;
  renderStagesEditor(null);
}

function openEdit(id) {
  if (!canEdit()) return;
  const p = S.projects.find(x=>x.id===id);
  if (!p) return;
  document.getElementById('modal-title').textContent = '案件を編集';
  document.getElementById('f-id').value = id;
  clearAddOptionInputs();
  populateFormSelects({ channel: p.channel, staff: p.staff, type: p.type });
  document.getElementById('f-channel').value = p.channel;
  document.getElementById('f-staff').value = p.staff;
  document.getElementById('f-title').value = p.title;
  document.getElementById('f-type').value = p.type;
  document.getElementById('f-date').value = p.postDate ? dateToInput(p.postDate) : '';
  document.getElementById('f-status').value = normalizeCurrentStatus(p.currentStatus);
  document.getElementById('f-material').value = p.material||'';
  document.getElementById('btn-delete').hidden = false;
  modalPostAnchor = p.postDate ? parseDate(p.postDate) : null;
  document.getElementById('overlay').hidden = false;
  renderStagesEditor(p);
}

function closeModal() {
  document.getElementById('overlay').hidden = true;
}

// ── Bulk add ──────────────────────────────────────────────────────────────────
const BULK_SAME_FIELDS = ['ch', 'staff', 'type', 'stages', 'kikaku', 'satsuei', 'date', 'status'];
const BULK_OFFSET_KEY = 'yt_bulk_date_offset';
const BULK_STAGE_DATE_FIELDS = [
  { field: 'kikaku', stageId: 'kikaku', inputClass: 'bulk-kikaku', label: '企画日' },
  { field: 'satsuei', stageId: 'satsuei', inputClass: 'bulk-satsuei', label: '撮影日' },
];

function buildBulkStageChipsHtml(enabledIds, { disabled = false, inputClass = 'bulk-stage-cb' } = {}) {
  const set = new Set(enabledIds);
  return STAGES.map(s => `
    <label class="bulk-stage-chip${set.has(s.id) ? '' : ' is-off'}" title="${s.name}">
      <input type="checkbox" class="${inputClass}" data-stage-id="${s.id}"${set.has(s.id) ? ' checked' : ''}${disabled ? ' disabled' : ''}>
      <span style="background:${s.bg};color:${s.fg}">${s.abbr}</span>
    </label>`).join('');
}

function updateBulkStageChipVisual(chip) {
  if (!chip) return;
  const cb = chip.querySelector('input[type="checkbox"]');
  chip.classList.toggle('is-off', !cb?.checked);
}

function getBulkDefaultStageIds() {
  const root = document.getElementById('bulk-default-stages');
  if (!root) return DEFAULT_ENABLED_STAGE_IDS.slice();
  const ids = [...root.querySelectorAll('.bulk-default-stage-cb:checked')].map(cb => cb.dataset.stageId);
  return ids.length ? ids : DEFAULT_ENABLED_STAGE_IDS.slice();
}

function renderBulkDefaultStages() {
  const root = document.getElementById('bulk-default-stages');
  if (!root) return;
  root.innerHTML = buildBulkStageChipsHtml(DEFAULT_ENABLED_STAGE_IDS, { inputClass: 'bulk-default-stage-cb' });
  root.querySelectorAll('.bulk-default-stage-cb').forEach(cb => {
    cb.addEventListener('change', () => updateBulkStageChipVisual(cb.closest('.bulk-stage-chip')));
  });
}

function readBulkRowStagesDirect(tr) {
  const ids = [...tr.querySelectorAll('.bulk-stage-cb:checked')].map(cb => cb.dataset.stageId);
  return ids.length ? ids : DEFAULT_ENABLED_STAGE_IDS.slice();
}

function readBulkRowStages(tr) {
  if (isBulkSame(tr, 'stages')) {
    const prev = tr.previousElementSibling;
    return prev ? readBulkRowStages(prev) : getBulkDefaultStageIds();
  }
  return readBulkRowStagesDirect(tr);
}

function setBulkRowStagesDirect(tr, ids, disabled) {
  tr.querySelectorAll('.bulk-stage-cb').forEach(cb => {
    cb.checked = ids.includes(cb.dataset.stageId);
    cb.disabled = !!disabled;
    updateBulkStageChipVisual(cb.closest('.bulk-stage-chip'));
  });
}

function refreshBulkStagesInheritance() {
  const tbody = document.getElementById('bulk-tbody');
  if (!tbody) return;
  [...tbody.rows].forEach((tr, i) => {
    if (i === 0) return;
    if (isBulkSame(tr, 'stages')) {
      const prev = tr.previousElementSibling;
      const ids = prev ? readBulkRowStages(prev) : getBulkDefaultStageIds();
      setBulkRowStagesDirect(tr, ids, true);
    }
  });
  refreshBulkStageDateFields();
}

function wireBulkStageChips(tr) {
  tr.querySelectorAll('.bulk-stage-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      updateBulkStageChipVisual(cb.closest('.bulk-stage-chip'));
      refreshBulkStagesInheritance();
      refreshBulkStageDateFields();
    });
  });
}

function rowHasBulkStage(tr, stageId) {
  return readBulkRowStages(tr).includes(stageId);
}

function refreshBulkStageDateFields() {
  const tbody = document.getElementById('bulk-tbody');
  if (!tbody) return;
  [...tbody.rows].forEach(tr => {
    BULK_STAGE_DATE_FIELDS.forEach(({ field, stageId, inputClass }) => {
      const wrap = tr.querySelector(`.bulk-${field}-wrap`);
      const input = tr.querySelector(`.${inputClass}`);
      if (!wrap || !input) return;
      const enabled = rowHasBulkStage(tr, stageId);
      wrap.classList.toggle('is-disabled', !enabled);
      const sameOn = isBulkSame(tr, field);
      input.disabled = !enabled || sameOn;
      if (!enabled) input.value = '';
    });
  });
  refreshBulkStageDateInheritance();
}

function refreshBulkStageDateInheritance() {
  const tbody = document.getElementById('bulk-tbody');
  if (!tbody) return;
  [...tbody.rows].forEach((tr, i) => {
    if (i === 0) return;
    BULK_STAGE_DATE_FIELDS.forEach(({ field, stageId, inputClass }) => {
      const input = tr.querySelector(`.${inputClass}`);
      if (!input) return;
      if (!rowHasBulkStage(tr, stageId)) {
        input.value = '';
        return;
      }
      if (!isBulkSame(tr, field)) return;
      const prev = tr.previousElementSibling;
      const prevVal = prev ? resolveBulkStageDate(prev, field, stageId, inputClass) : '';
      input.value = prevVal || '';
    });
  });
}

function resolveBulkStageDate(tr, field, stageId, inputClass) {
  if (!rowHasBulkStage(tr, stageId)) return '';
  if (isBulkSame(tr, field)) {
    const prev = tr.previousElementSibling;
    return prev ? resolveBulkStageDate(prev, field, stageId, inputClass) : '';
  }
  return tr.querySelector(`.${inputClass}`)?.value || '';
}

function getBulkDefaultDateOffset() {
  const el = document.getElementById('bulk-default-offset');
  if (el && el.value !== '') {
    const v = parseInt(el.value, 10);
    if (Number.isFinite(v)) return v;
  }
  const saved = parseInt(localStorage.getItem(BULK_OFFSET_KEY), 10);
  return Number.isFinite(saved) ? saved : 7;
}

function saveBulkDefaultOffset() {
  localStorage.setItem(BULK_OFFSET_KEY, String(getBulkDefaultDateOffset()));
}

function initBulkDefaultOffset() {
  const el = document.getElementById('bulk-default-offset');
  if (!el) return;
  const saved = localStorage.getItem(BULK_OFFSET_KEY);
  if (saved !== null && saved !== '') el.value = saved;
  el.addEventListener('change', () => {
    saveBulkDefaultOffset();
    applyDefaultOffsetToSameRows();
    refreshBulkDerivedDates();
  });
  el.addEventListener('input', refreshBulkDerivedDates);
}

/** 同上ONの投稿日行に、現在の初期日数を一括反映（手入力で個別変更した行は除く） */
function applyDefaultOffsetToSameRows() {
  const def = getBulkDefaultDateOffset();
  document.querySelectorAll('#bulk-tbody tr').forEach(tr => {
    if (!isBulkSame(tr, 'date')) return;
    const offset = tr.querySelector('.bulk-date-offset');
    if (offset) offset.value = def;
  });
}

function mkSelectHtml(items, value, withEmpty) {
  const opts = (withEmpty ? ['<option value=""></option>'] : [])
    .concat(items.map(v => `<option${v === value ? ' selected' : ''}>${v}</option>`));
  return opts.join('');
}

function bulkSameBtn(field, active, isFirst) {
  const cls = `bulk-same${active ? ' active' : ''}${isFirst ? ' hidden' : ''}`;
  return `<button type="button" class="${cls}" data-field="${field}" onclick="toggleBulkSame(this)" title="上と同じ（同上）">〃</button>`;
}

function isBulkSame(tr, field) {
  const btn = tr.querySelector(`.bulk-same[data-field="${field}"]`);
  return btn && !btn.classList.contains('hidden') && btn.classList.contains('active');
}

function addBulkRow(prefill = {}, opts = {}) {
  const tbody = document.getElementById('bulk-tbody');
  if (!tbody) return;
  const isFirst = tbody.rows.length === 0;
  const sameOn = opts.sameOn ?? (!isFirst);
  const dateOffset = prefill.dateOffset ?? getBulkDefaultDateOffset();
  const enabledStages = prefill.enabledStages || getBulkDefaultStageIds();
  const stagesDisabled = sameOn && !isFirst;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><div class="bulk-field-wrap">
      ${bulkSameBtn('ch', sameOn, isFirst)}
      <select class="bulk-ch">${mkSelectHtml(getChannelList(), prefill.channel || '', true)}</select>
    </div></td>
    <td><div class="bulk-field-wrap">
      ${bulkSameBtn('staff', sameOn, isFirst)}
      <select class="bulk-staff">${mkSelectHtml(getStaffOptions(), prefill.staff || '', true)}</select>
    </div></td>
    <td><div class="bulk-field-wrap">
      ${bulkSameBtn('type', sameOn, isFirst)}
      <select class="bulk-type">${mkSelectHtml(getVideoTypeList(), prefill.type || '通常', false)}</select>
    </div></td>
    <td><input type="text" class="bulk-title" value="${escAttr(prefill.title || '')}" placeholder="企画名"></td>
    <td><div class="bulk-field-wrap bulk-stages-field">
      ${bulkSameBtn('stages', sameOn, isFirst)}
      <div class="bulk-stages-wrap">${buildBulkStageChipsHtml(enabledStages, { disabled: stagesDisabled })}</div>
    </div></td>
    <td><div class="bulk-field-wrap bulk-kikaku-wrap">
      ${bulkSameBtn('kikaku', sameOn, isFirst)}
      <input type="date" class="bulk-kikaku" value="${escAttr(prefill.kikakuDate || '')}" title="企画日" ${sameOn ? 'disabled' : ''}>
    </div></td>
    <td><div class="bulk-field-wrap bulk-satsuei-wrap">
      ${bulkSameBtn('satsuei', sameOn, isFirst)}
      <input type="date" class="bulk-satsuei" value="${escAttr(prefill.satsueiDate || '')}" title="撮影日" ${sameOn ? 'disabled' : ''}>
    </div></td>
    <td><div class="bulk-field-wrap bulk-date-wrap">
      ${bulkSameBtn('date', sameOn, isFirst)}
      <input type="number" class="bulk-date-offset" value="${sameOn ? dateOffset : 0}" title="上の投稿日からの日数（+で後、-で前）" ${sameOn ? '' : 'disabled'}>
      <span class="bulk-offset-suffix">日</span>
      <input type="date" class="bulk-date" value="${escAttr(prefill.date || '')}" ${sameOn ? 'disabled' : ''}>
    </div></td>
    <td><div class="bulk-field-wrap">
      ${bulkSameBtn('status', sameOn, isFirst)}
      <select class="bulk-status">${mkSelectHtml(STATUS_OPTIONS, prefill.status || '企画', false)}</select>
    </div></td>
    <td><input type="url" class="bulk-url" value="${escAttr(prefill.material || '')}" placeholder="https://…"></td>
    <td><button type="button" class="bulk-rm" onclick="removeBulkRow(this)" title="行を削除">×</button></td>
  `;
  tbody.appendChild(tr);
  ensureSelectOption(tr.querySelector('.bulk-ch'), prefill.channel);
  ensureSelectOption(tr.querySelector('.bulk-staff'), prefill.staff);
  wireBulkStageChips(tr);
  applyBulkSameState(tr);
  wireBulkRowEvents(tr);
  refreshBulkDerivedDates();
  refreshBulkStagesInheritance();
  refreshBulkStageDateFields();
}

function applyBulkSameState(tr) {
  BULK_SAME_FIELDS.forEach(field => {
    const btn = tr.querySelector(`.bulk-same[data-field="${field}"]`);
    if (!btn || btn.classList.contains('hidden')) return;
    const on = btn.classList.contains('active');
    if (field === 'date') {
      tr.querySelector('.bulk-date-offset').disabled = !on;
      tr.querySelector('.bulk-date').disabled = on;
    } else if (field === 'kikaku' || field === 'satsuei') {
      const meta = BULK_STAGE_DATE_FIELDS.find(f => f.field === field);
      const input = tr.querySelector(`.${meta.inputClass}`);
      const enabled = rowHasBulkStage(tr, meta.stageId);
      if (input) input.disabled = !enabled || on;
    } else if (field === 'stages') {
      if (on) {
        const prev = tr.previousElementSibling;
        const ids = prev ? readBulkRowStages(prev) : getBulkDefaultStageIds();
        setBulkRowStagesDirect(tr, ids, true);
      } else {
        tr.querySelectorAll('.bulk-stage-cb').forEach(cb => { cb.disabled = false; });
      }
    } else {
      const cls = { ch: 'bulk-ch', staff: 'bulk-staff', type: 'bulk-type', status: 'bulk-status' }[field];
      const el = tr.querySelector(`.${cls}`);
      if (el) el.disabled = on;
    }
  });
}

function wireBulkRowEvents(tr) {
  tr.querySelectorAll('.bulk-ch, .bulk-staff, .bulk-type, .bulk-status, .bulk-date, .bulk-date-offset, .bulk-kikaku, .bulk-satsuei').forEach(el => {
    el.addEventListener('change', () => {
      refreshBulkDerivedDates();
      refreshBulkStageDateInheritance();
    });
    el.addEventListener('input', () => {
      refreshBulkDerivedDates();
      refreshBulkStageDateInheritance();
    });
  });
}

function toggleBulkSame(btn) {
  const field = btn.dataset.field;
  const tr = btn.closest('tr');
  if (!tr || btn.classList.contains('hidden')) return;

  const on = !btn.classList.contains('active');
  btn.classList.toggle('active', on);

  if (field === 'date') {
    const offset = tr.querySelector('.bulk-date-offset');
    const dateIn = tr.querySelector('.bulk-date');
    offset.disabled = !on;
    dateIn.disabled = on;
    if (on && offset.value === '') offset.value = getBulkDefaultDateOffset();
    if (!on) {
      const idx = [...tr.parentNode.rows].indexOf(tr);
      const rows = resolveBulkRows();
      if (rows[idx]?.postDate) dateIn.value = dateToInput(rows[idx].postDate);
    }
  } else if (field === 'kikaku' || field === 'satsuei') {
    const meta = BULK_STAGE_DATE_FIELDS.find(f => f.field === field);
    const input = tr.querySelector(`.${meta.inputClass}`);
    const enabled = rowHasBulkStage(tr, meta.stageId);
    if (input) {
      input.disabled = !enabled || on;
      if (on && enabled) {
        const prev = tr.previousElementSibling;
        input.value = prev ? resolveBulkStageDate(prev, field, meta.stageId, meta.inputClass) : '';
      }
    }
  } else if (field === 'stages') {
    if (on) {
      const prev = tr.previousElementSibling;
      const ids = prev ? readBulkRowStages(prev) : getBulkDefaultStageIds();
      setBulkRowStagesDirect(tr, ids, true);
    } else {
      const prev = tr.previousElementSibling;
      const ids = prev ? readBulkRowStagesDirect(prev) : getBulkDefaultStageIds();
      setBulkRowStagesDirect(tr, ids, false);
    }
  } else {
    const cls = { ch: 'bulk-ch', staff: 'bulk-staff', type: 'bulk-type', status: 'bulk-status' }[field];
    const sel = tr.querySelector(`.${cls}`);
    if (sel) {
      sel.disabled = on;
      if (!on) {
        const prev = tr.previousElementSibling;
        const prevSel = prev?.querySelector(`.${cls}`);
        if (prevSel?.value) sel.value = prevSel.value;
      }
    }
  }
  refreshBulkDerivedDates();
  refreshBulkStagesInheritance();
  refreshBulkStageDateFields();
}

function refreshBulkDerivedDates() {
  const tbody = document.getElementById('bulk-tbody');
  if (!tbody) return;
  let prevDate = null;
  [...tbody.rows].forEach((tr, i) => {
    const dateIn = tr.querySelector('.bulk-date');
    if (!dateIn) return;
    if (i === 0) {
      prevDate = parseDate(dateIn.value);
      return;
    }
    if (isBulkSame(tr, 'date')) {
      const offset = parseInt(tr.querySelector('.bulk-date-offset')?.value, 10) || 0;
      const computed = prevDate ? addDays(prevDate, offset) : null;
      dateIn.value = computed ? dateToInput(computed) : '';
      prevDate = computed;
    } else {
      prevDate = parseDate(dateIn.value);
    }
  });
}

function setBulkRowSameAll(tr, on) {
  tr.querySelectorAll('.bulk-same:not(.hidden)').forEach(btn => {
    const active = !!on;
    btn.classList.toggle('active', active);
  });
  applyBulkSameState(tr);
}

function ensureSelectOption(select, value) {
  if (!value || !select) return;
  if (![...select.options].some(o => o.value === value)) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  }
  select.value = value;
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function removeBulkRow(btn) {
  const tbody = document.getElementById('bulk-tbody');
  if (!tbody || tbody.rows.length <= 1) return;
  btn.closest('tr')?.remove();
  refreshBulkDerivedDates();
  refreshBulkStagesInheritance();
  refreshBulkStageDateFields();
}

function openBulkAdd() {
  if (!canEdit()) return;
  const tbody = document.getElementById('bulk-tbody');
  if (!tbody) return;
  renderBulkDefaultStages();
  tbody.innerHTML = '';
  for (let i = 0; i < 5; i++) addBulkRow();
  document.getElementById('bulk-overlay').hidden = false;
}

function closeBulkModal() {
  const el = document.getElementById('bulk-overlay');
  if (el) el.hidden = true;
}

function bulkDateToInput(s) {
  if (!s) return '';
  const d = parseDate(s.replace(/\./g, '-'));
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalizeBulkStatus(s) {
  return normalizeCurrentStatus((s || '').trim());
}

function parseBulkPaste(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const delim = lines[0].includes('\t') ? '\t' : ',';
  let start = 0;
  const first = lines[0].split(delim)[0]?.trim() || '';
  if (/^(クライアント|チャンネル|client)$/i.test(first)) start = 1;
  return lines.slice(start).map(line => {
    const cols = line.split(delim).map(c => c.trim());
    return {
      channel: cols[0] || '',
      staff: cols[1] || '',
      type: cols[2] || '通常',
      title: cols[3] || '',
      date: bulkDateToInput(cols[4] || ''),
      status: normalizeBulkStatus(cols[5]),
      material: cols[6] || '',
    };
  }).filter(r => r.title || r.channel || r.staff);
}

function readBulkRows() {
  return resolveBulkRows().filter(r => r.title || r.channel || r.staff);
}

function resolveBulkRows() {
  const tbody = document.getElementById('bulk-tbody');
  if (!tbody) return [];
  const out = [];
  [...tbody.rows].forEach((tr, i) => {
    const prev = out[i - 1];
    const title = tr.querySelector('.bulk-title')?.value?.trim() || '';
    const material = tr.querySelector('.bulk-url')?.value?.trim() || '';

    const channel = (i > 0 && isBulkSame(tr, 'ch'))
      ? (prev?.channel || '')
      : (tr.querySelector('.bulk-ch')?.value?.trim() || '');
    const staff = (i > 0 && isBulkSame(tr, 'staff'))
      ? (prev?.staff || '')
      : (tr.querySelector('.bulk-staff')?.value?.trim() || '');
    const type = (i > 0 && isBulkSame(tr, 'type'))
      ? (prev?.type || '通常')
      : (tr.querySelector('.bulk-type')?.value || '通常');
    const status = (i > 0 && isBulkSame(tr, 'status'))
      ? (prev?.currentStatus || '企画')
      : (tr.querySelector('.bulk-status')?.value || '企画');
    const enabledStages = (i > 0 && isBulkSame(tr, 'stages'))
      ? (prev?.enabledStages || getBulkDefaultStageIds())
      : readBulkRowStagesDirect(tr);

    let postDate;
    if (i > 0 && isBulkSame(tr, 'date')) {
      const offset = parseInt(tr.querySelector('.bulk-date-offset')?.value, 10) || 0;
      postDate = prev?.postDate ? addDays(prev.postDate, offset) : null;
    } else {
      postDate = parseDate(tr.querySelector('.bulk-date')?.value);
    }

    const kikakuDate = enabledStages.includes('kikaku')
      ? ((i > 0 && isBulkSame(tr, 'kikaku'))
        ? (prev?.kikakuDate || null)
        : parseDate(tr.querySelector('.bulk-kikaku')?.value))
      : null;
    const satsueiDate = enabledStages.includes('satsuei')
      ? ((i > 0 && isBulkSame(tr, 'satsuei'))
        ? (prev?.satsueiDate || null)
        : parseDate(tr.querySelector('.bulk-satsuei')?.value))
      : null;

    out.push({
      tr, channel, staff, title, type, postDate, currentStatus: status, material, enabledStages,
      kikakuDate, satsueiDate,
    });
  });
  return out;
}

function saveBulkProjects() {
  const rows = readBulkRows();
  if (!rows.length) {
    alert('入力された行がありません');
    return;
  }

  const incomplete = rows.filter(r => !r.channel || !r.staff || !r.title);
  rows.forEach(r => r.tr.classList.remove('bulk-row-invalid'));
  if (incomplete.length) {
    incomplete.forEach(r => r.tr.classList.add('bulk-row-invalid'));
    alert(`${incomplete.length}行に未入力があります（クライアント・担当・企画名は必須）`);
    return;
  }

  rows.forEach(({ channel, staff, title, type, postDate, currentStatus, material, enabledStages, kikakuDate, satsueiDate }) => {
    const manuals = {};
    if (enabledStages?.includes('kikaku') && kikakuDate) manuals.kikaku = dateToInput(kikakuDate);
    if (enabledStages?.includes('satsuei') && satsueiDate) manuals.satsuei = dateToInput(satsueiDate);

    const np = {
      id: uid(),
      channel, staff, title, type, postDate, currentStatus, material,
      enabledStages: enabledStages?.length ? enabledStages.slice() : DEFAULT_ENABLED_STAGE_IDS.slice(),
      manualStageDates: manuals,
      stageStatuses: defaultStageStatuses(),
    };
    Object.keys(manuals).forEach(k => markUserSet(np, `stage.${k}`));
    if (postDate) markUserSet(np, 'postDate');
    markUserSet(np, 'currentStatus');
    S.projects.push(normalizeProject(np));
  });

  persist();
  closeBulkModal();
  renderViewerSelect();
  render();
  alert(`${rows.length}件を追加しました`);
}

function handleBulkPaste(e) {
  const text = e.clipboardData?.getData('text') || '';
  if (!text.includes('\t') && !text.includes(',')) return;
  const parsed = parseBulkPaste(text);
  if (!parsed.length) return;
  e.preventDefault();
  const tbody = document.getElementById('bulk-tbody');
  const hasData = [...tbody.rows].some(tr => tr.querySelector('.bulk-title')?.value?.trim());
  if (!hasData) tbody.innerHTML = '';
  parsed.forEach((row, i) => {
    addBulkRow(row, { sameOn: false });
    const tr = tbody.rows[tbody.rows.length - 1];
    if (i > 0) setBulkRowSameAll(tr, false);
  });
  refreshBulkDerivedDates();
}

function saveProject() {
  const id      = document.getElementById('f-id').value;
  const channel = document.getElementById('f-channel').value;
  const staff   = document.getElementById('f-staff').value;
  const title   = document.getElementById('f-title').value.trim();

  if (!channel || !staff || !title) { alert('チャンネル・担当・タイトルは必須です'); return; }

  const stageData = readStagesFromForm();
  if (!stageData.enabledStages?.length) {
    stageData.enabledStages = DEFAULT_ENABLED_STAGE_IDS.slice();
  }
  const postDate = getFormPublishAnchor();
  const data = {
    channel, staff, title,
    type:          document.getElementById('f-type').value,
    postDate,
    currentStatus: normalizeCurrentStatus(document.getElementById('f-status').value),
    material:      document.getElementById('f-material').value,
    ...stageData,
  };
  syncPublishAnchorFields(data);

  if (id) {
    const p = S.projects.find(x => x.id === id);
    if (p) {
      markUserSet(p, 'postDate');
      markUserSet(p, 'currentStatus');
      if (data.material) markUserSet(p, 'material');
      data.manualStageDates = mergeManualStageDatesForProject(p, stageData.manualStageDates);
      Object.assign(p, data);
      syncStageStatusesFromCurrentStatus(p);
    }
  } else {
    const np = {
      id: uid(),
      stageStatuses: defaultStageStatuses(),
      enabledStages: DEFAULT_ENABLED_STAGE_IDS.slice(),
      manualStageDates: {},
      ...data,
    };
    syncStageStatusesFromCurrentStatus(np);
    markUserSet(np, 'postDate');
    markUserSet(np, 'currentStatus');
    Object.keys(stageData.manualStageDates || {}).forEach(k => markUserSet(np, `stage.${k}`));
    S.projects.push(np);
  }

  persist();
  closeModal();
  render();
}

function deleteProject() {
  const id = document.getElementById('f-id').value;
  if (!id || !confirm('この案件を削除しますか？')) return;
  S.projects = S.projects.filter(p=>p.id!==id);
  selectedIds.delete(id);
  persist();
  closeModal();
  render();
}

// ── Export / Server sync ──────────────────────────────────────────────────────
function buildServerPayload() {
  return {
    _meta: {
      updatedAt: new Date().toISOString(),
      updatedBy: S.viewerName || '管理者',
      version: 1,
    },
    options: S.customOptions,
    shootingSchedule: serializeShootingSchedule(),
    projects: serializeProjects(),
  };
}

function formatDataAge(iso) {
  if (!iso) return '不明';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '不明';
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isDataStale(iso, hours = 24) {
  const t = Date.parse(iso || '');
  if (!t) return true;
  return Date.now() - t > hours * 3600 * 1000;
}

async function pushToGithubRepo(payload) {
  const token = getGithubWriteToken();
  if (!token) throw new Error('GitHubトークン未設定');
  const path = GITHUB_SCHEDULE_PATH;
  const content = utf8ToBase64(JSON.stringify(payload, null, 2));
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, { headers });
  let sha;
  if (getRes.ok) {
    sha = (await getRes.json()).sha;
  } else if (getRes.status !== 404) {
    const err = await getRes.json().catch(() => ({}));
    throw new Error(err.message || `GitHub GET ${getRes.status}`);
  }
  const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `sync: ${payload._meta.updatedAt}`,
      content,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || `GitHub PUT ${putRes.status}`);
  }
}

async function pushToGist(payload) {
  const token = getGithubWriteToken();
  const gistId = getGistId();
  if (!token || !gistId) throw new Error('Gist同期未設定');
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: { 'schedule.json': { content: JSON.stringify(payload, null, 2) } },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gist PATCH ${res.status}`);
  }
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function scheduleServerPush(immediate = false) {
  if (isLockedTeamViewer()) return;
  if (!canCloudWrite()) return;
  if (location.protocol === 'file:') return;
  if (!S.projects.length) return;
  clearTimeout(serverPushTimer);
  clearTimeout(serverPushRetryTimer);
  if (immediate) {
    pushScheduleToServer();
    return;
  }
  serverPushTimer = setTimeout(() => pushScheduleToServer(), SERVER_PUSH_DEBOUNCE_MS);
}

function scheduleServerPushRetry() {
  if (isLockedTeamViewer() || !canCloudWrite()) return;
  const delay = SERVER_PUSH_RETRY_DELAYS[Math.min(serverPushRetries, SERVER_PUSH_RETRY_DELAYS.length - 1)];
  clearTimeout(serverPushRetryTimer);
  serverPushRetryTimer = setTimeout(() => {
    serverPushRetries += 1;
    pushScheduleToServer();
  }, delay);
}

async function pushScheduleToServer() {
  if (isLockedTeamViewer() || location.protocol === 'file:') return;
  if (!canCloudWrite()) {
    S.hasUnpublishedChanges = true;
    S.syncPending = false;
    S.serverPush = { status: 'error', lastAt: S.serverPush.lastAt, error: '同期トークン未設定' };
    updateSyncStatus();
    return;
  }

  S.serverPush.status = 'pushing';
  S.syncPending = true;
  updateSyncStatus();

  try {
    const payload = buildServerPayload();
    const binId = getJsonBinId();

    if (binId && isJsonBinPublic()) {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `JSONBin PUT ${res.status}`);
      }
    } else {
      const token = getGithubWriteToken();
      const gistId = getGistId();
      if (!token || !gistId) throw new Error('GitHub同期トークンまたはGist ID未設定');
      await Promise.all([
        pushToGist(payload),
        pushToGithubRepo(payload),
      ]);
    }

    localStorage.setItem(SYNC_META_KEY, JSON.stringify(payload._meta));
    S.syncMeta = payload._meta;
    S.serverPush = { status: 'ok', lastAt: Date.now(), error: null };
    S.hasUnpublishedChanges = false;
    S.syncPending = false;
    serverPushRetries = 0;
    await refreshServerSnapshot();
  } catch (e) {
    console.error('クラウド同期失敗:', e);
    S.serverPush = { status: 'error', lastAt: S.serverPush.lastAt, error: e.message };
    S.hasUnpublishedChanges = true;
    S.syncPending = false;
    if (serverPushRetries < SERVER_PUSH_RETRY_DELAYS.length) {
      scheduleServerPushRetry();
    }
  }
  updateSyncStatus();
}

function exportJSON() {
  const payload = buildServerPayload();
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(payload._meta));
  S.syncMeta = payload._meta;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `youtube_schedule_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  updateSyncStatus();
  alert('エクスポートしました。\nGitHub同期設定済みなら、編集内容は自動公開されます。');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = JSON.parse(reader.result);
      const data = Array.isArray(raw) ? raw : raw.projects;
      if (!Array.isArray(data)) throw new Error('projects 配列が必要です');
      const prev = S.projects.length;
      if (prev > 0 && !confirm(
        `現在の ${prev} 件（手動の変更を含む）を、ファイルの ${data.length} 件で置き換えます。\n\n本当によろしいですか？`
      )) {
        return;
      }
      applyProjects(data);
      markLocalGuard();
      if (raw.options) applyCustomOptions(raw.options);
      if (raw.shootingSchedule) applyShootingSchedule(raw.shootingSchedule);
      if (raw._meta) {
        localStorage.setItem(SYNC_META_KEY, JSON.stringify(raw._meta));
        S.syncMeta = raw._meta;
      }
      renderViewerSelect();
      render();
      scheduleServerPush(true);
      alert(`${S.projects.length}件の案件を読み込みました`);
    } catch (e) {
      alert('インポートに失敗しました: ' + e.message);
    }
  };
  reader.readAsText(file);
}

async function applyServerPayload(raw, { persistLocal = true, silent = false } = {}) {
  const data = Array.isArray(raw) ? raw : raw.projects;
  if (!Array.isArray(data)) throw new Error('形式が不正です');

  applyProjects(data, { persistLocal, source: 'server' });
  if (raw.options) applyCustomOptions(raw.options, { persistLocal });
  if (raw.shootingSchedule) applyShootingSchedule(raw.shootingSchedule, { persistLocal });
  if (raw._meta) {
    if (persistLocal) localStorage.setItem(SYNC_META_KEY, JSON.stringify(raw._meta));
    S.syncMeta = raw._meta;
    if (!isLockedTeamViewer()) {
      markLocalGuard();
      S.hasUnpublishedChanges = false;
    }
  }
  renderViewerSelect();
  render();
  return describeServerData(raw);
}

async function syncAdminFromServerIfNewer(silent = true) {
  if (isLockedTeamViewer() || location.protocol === 'file:') return false;
  if (S.hasUnpublishedChanges) return false;
  try {
    const raw = await fetchSharedRaw();
    S.serverSnapshot = describeServerData(raw);
    if (!shouldPreferServerData(raw)) return false;
    await applyServerPayload(raw, { persistLocal: true, silent });
    updateSyncStatus();
    if (!silent) {
      alert(`サーバーから最新データ ${S.projects.length}件を取得しました。`);
    }
    return true;
  } catch (e) {
    if (!silent) alert('サーバーからデータを取得できませんでした。');
    return false;
  }
}

async function forceServerOverwrite(silent = false) {
  if (isLockedTeamViewer() || location.protocol === 'file:') return false;
  const ok = silent || confirm('この端末のローカル編集を破棄して、サーバーの最新データで上書きします。よろしいですか？');
  if (!ok) return false;
  try {
    const raw = await fetchSharedRaw();
    await applyServerPayload(raw, { persistLocal: true, silent: true });
    S.hasUnpublishedChanges = false;
    S.syncPending = false;
    updateSyncStatus();
    if (!silent) alert(`サーバーの最新データ ${S.projects.length}件で上書きしました。`);
    return true;
  } catch (e) {
    if (!silent) alert('サーバーデータの上書きに失敗しました。');
    return false;
  }
}

async function loadSharedDataForViewer(silent = false) {
  const btn = document.getElementById('btn-sync');
  if (btn) btn.disabled = true;
  try {
    const raw = await fetchSharedRaw();
    const info = await applyServerPayload(raw, { persistLocal: false, silent });
    if (!silent) {
      alert(`最新データ ${info.count}件を取得しました（クローズ済${info.archived}件）`);
    }
    return true;
  } catch (e) {
    if (!silent) alert('最新データを取得できませんでした。');
    return false;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loadSharedData(silent = false) {
  if (location.protocol === 'file:') {
    if (!silent) alert('ファイル直接開きの場合は、管理者からJSONを受け取り「インポート」してください。');
    return false;
  }
  if (isLockedTeamViewer()) {
    return loadSharedDataForViewer(silent);
  }
  const btn = document.getElementById('btn-sync');
  if (btn) btn.disabled = true;
  try {
    const raw = await fetchSharedRaw();
    const serverInfo = describeServerData(raw);

    if (isLocalGuarded()) {
      if (isServerNewerThanLocal(raw) && !S.hasUnpublishedChanges) {
        await applyServerPayload(raw, { persistLocal: true, silent });
        if (!silent) {
          alert(`サーバーから最新データ ${S.projects.length}件を取得しました。`);
        }
        updateSyncStatus();
        return true;
      }
      await refreshServerSnapshot();
      if (!silent) {
        const srv = S.serverSnapshot;
        const srvLine = srv
          ? `\n（サーバー: ${srv.count}件 · クローズ${srv.archived}件）`
          : '';
        const mismatch = isServerMismatch()
          ? '\n\n⚠️ チーム閲覧URLと不一致です。「📤 チーム公開」で反映してください。'
          : '';
        const confirmed = confirm(
          `ローカル ${S.projects.length}件を使用中です。${srvLine}\n\n` +
          `手動の変更は保護されています。サーバーから上書きする場合は「OK」を押してください。${mismatch}`
        );
        if (confirmed) {
          await forceServerOverwrite(true);
          alert(`サーバーの最新データ ${S.projects.length}件で上書きしました。`);
        }
      }
      updateSyncStatus();
      return false;
    }

    const data = Array.isArray(raw) ? raw : raw.projects;
    if (!data.length) {
      if (!silent) alert('サーバーに案件データがありません。');
      return false;
    }

    await applyServerPayload(raw, { persistLocal: true, silent });
    if (!silent) {
      alert(`初回読み込み: サーバーから ${S.projects.length}件を取得しました。`);
    }
    return true;
  } catch (e) {
    if (!silent) alert('サーバー情報を取得できませんでした。');
    return false;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ── Close popup on outside click ──────────────────────────────────────────────
document.addEventListener('click', e => {
  const pop = document.getElementById('spop');
  if (pop && !pop.hidden && !pop.contains(e.target)) pop.hidden = true;
  const mf = document.getElementById('toolbar-filters');
  if (mf && !mf.hidden && !mf.contains(e.target)) {
    mf.querySelectorAll('.mf-panel').forEach(p => { p.hidden = true; });
    mf.querySelectorAll('.mf-trigger').forEach(b => b.classList.remove('is-open'));
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
async function bootstrap() {
  parseUrlParams();

  initSubsGraphPrefs();

  populateStatusSelects();

  const todayStr = `${TODAY.getFullYear()}年${TODAY.getMonth()+1}月${TODAY.getDate()}日（${weekday[TODAY.getDay()]}）`;
  document.getElementById('today-label').textContent = todayStr;

  document.getElementById('search-input').addEventListener('input', e => {
    S.search = e.target.value;
    render();
  });

  document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) importJSON(file);
    e.target.value = '';
  });

  document.getElementById('f-date')?.addEventListener('change', () => {
    modalPostAnchor = getFormPublishAnchor();
    refreshStageAutoDates();
  });
  ['f-channel-new', 'f-staff-new', 'f-type-new'].forEach((id, i) => {
    const kinds = ['channel', 'staff', 'type'];
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomOption(kinds[i]);
      }
    });
  });
  document.getElementById('bulk-paste-zone')?.addEventListener('paste', handleBulkPaste);
  initBulkDefaultOffset();
  syncMobileClass();

  let resizeTimer;
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);

  function onViewportChange() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      syncMobileClass();
      render();
    }, 150);
  }

  if (isMobile() && !location.search.includes('tab=')) S.tab = 'week';

  if (isLockedTeamViewer()) {
    S.projects = [];
    populateFormSelects();
    if (location.protocol !== 'file:') {
      await Promise.all([loadSharedData(true), loadSubscribersData()]);
      viewerPollTimer = setInterval(() => loadSharedData(true), VIEWER_POLL_MS);
    }
  } else {
    loadCustomOptions();
    const hadLocal = hydrate() || migrateLegacyStorage();
    S.syncMeta = getSyncMeta();
    loadShootingSchedule();
    populateFormSelects();

    if (location.protocol !== 'file:') {
      try {
        const raw = await fetchSharedRaw();
        S.serverSnapshot = describeServerData(raw);
        if (!hadLocal) {
          await applyServerPayload(raw, { persistLocal: true, silent: true });
        } else if (isLocalAheadOfServer(raw) && canCloudWrite()) {
          S.hasUnpublishedChanges = true;
          await pushScheduleToServer();
        }
        // hadLocal がある限りサーバーで自動上書きしない（手動「サーバーから更新」のみ）
      } catch (e) {
        console.warn('起動時サーバー同期失敗:', e);
      }
    }
    await loadSubscribersData();
    await refreshServerSnapshot();
    if (isLockedTeamViewer() && location.protocol !== 'file:') {
      viewerPollTimer = setInterval(() => loadSharedData(true), VIEWER_POLL_MS);
    }
    if (!S.projects.length && !hadLocal) {
      initEmpty();
    } else if (!S.projects.length && hadLocal) {
      console.warn('ローカルデータの読み込み後に案件が0件です');
    }
  }

  applyViewModeUI();
  renderViewerSelect();

  const origSwitchTab = switchTab;
  window.switchTab = tab => {
    origSwitchTab(tab);
    const hint = document.getElementById('gantt-hint');
    if (hint) hint.style.display = (tab === 'gantt' && isMobile()) ? 'block' : 'none';
  };

  renderLegend();
  switchTab(normalizeTab(S.tab));
  window.__YT_BOOT_OK__ = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && S.syncPending && canCloudWrite()) {
      scheduleServerPush(true);
    }
  });
}

function showFatalError(detail) {
  const el = document.getElementById('fatal-error');
  const detailEl = document.getElementById('fatal-error-detail');
  if (!el) return;
  el.hidden = false;
  if (detailEl) detailEl.textContent = detail || '不明なエラー';
  const main = document.getElementById('main');
  if (main) main.hidden = true;
}

bootstrap().catch(err => {
  console.error('bootstrap failed:', err);
  showFatalError(err?.message || String(err));
});
