# YouTube 制作スケジュール管理

クライアント別 YouTube 動画の制作進捗を、Google スプレッドシート（[YT管理](https://docs.google.com/spreadsheets/d/1jwJZt8fqMjErtnFrTjKk9kBnBNe0n0m76HqbpvS5LTU/edit)）と同等の構成で Web 管理するローカルアプリ。

## 公開URL

| 用途 | URL |
|------|-----|
| **管理者（編集）** | https://takpz93.github.io/youtube-schedule/ |
| **チーム（閲覧のみ）** | https://takpz93.github.io/youtube-schedule/?view=1&tab=week |
| **登録者トラッキング** | https://takpz93.github.io/youtube-schedule/?tab=subs |

管理者が編集すると、GitHub同期設定済みの場合 **2秒以内に自動公開** されます。チームは閲覧URLを開くだけで、**15秒ごとに自動更新**されます。

**運用ルール（必読）:** [OPERATIONS.md](./OPERATIONS.md) — ブックマーク2つ・編集後の確認だけ守ればズレない。

### 初回セットアップ（管理者・1回だけ）

1. https://takpz93.github.io/youtube-schedule/ を開く
2. **⚙️ 同期** をクリック
3. ターミナルで `gh auth token` を実行し、表示されたトークンを貼り付け
4. **👥 チームリンク** で閲覧URLをコピーし、メンバーに共有

### メンバー別リンク例

```
https://takpz93.github.io/youtube-schedule/?view=1&staff=吉田さん(MEK)&mine=1&tab=week
```

| 開き方 | 使う？ | 理由 |
|--------|--------|------|
| **上記URL（ブックマーク推奨）** | ✅ 管理者 | 編集・自動公開 |
| **?view=1 の閲覧URL** | ✅ メンバー | 編集不可・サーバーから自動更新 |
| `COO/youtube-schedule/index.html` を直接開く | ❌ | 別データ |

### 画面が古い・モバイルに反映されないとき

1. **管理者** → 正規URLか確認 · **⚙️ 同期** が設定済みか · ステータスに「☁️ 公開済」が出ているか
2. **メンバー** → `?view=1` の閲覧URLか確認 · **🔄 更新** または30秒待つ
3. **強制再読み込み**（iPhone Safari: タブ長押し→再読み込み / Mac: Cmd+Shift+R）
4. 右上のバージョンが最新か確認（例: `v20260622a`）

リポジトリ: [github.com/takpz93/youtube-schedule](https://github.com/takpz93/youtube-schedule)

データ更新: 管理者が編集 → GitHub同期で自動公開 → メンバーは閲覧URLで自動取得

デプロイ: `bash scripts/deploy.sh`（**pre-deploy-check 通過後のみ** push · 案件データを保護）

```bash
# デプロイ前の手動チェック（deploy.sh 内でも自動実行）
node scripts/pre-deploy-check.js
```

## データ保護（開発者向け）

**修正・デプロイ時に登録案件を消さない。** 詳細は [DEV.md](./DEV.md)

## 起動方法（ローカル）

ブラウザで以下を開く（ダブルクリックまたは `open` コマンド）:

```
COO/youtube-schedule/index.html
```

旧パス `COO/YouTube管理.html` からも自動リダイレクトされます。

## チームで使う

### メンバー向け（閲覧）

1. 上部 **メンバー** で自分の名前を選択 → **自分の案件のみ** で絞り込み
2. 初期タブ **今週** … 今週のFB・提出・投稿と現状の遅れ
3. **チーム状況** … 期限超過・要対応・14日以内の投稿
4. **👁 閲覧** モード … 誤操作防止（編集ボタン非表示）
5. **🔗 共有** … フィルター付きURLをコピー（Webホスト時）

### 管理者向け（更新）

1. 案件を編集 → **📥 エクスポート**
2. `data/schedule.json` に配置（詳細は [data/README.md](./data/README.md)）
3. ローカルサーバーでホストすると **🔄 更新** が全員使える

```bash
cd COO/youtube-schedule && python3 -m http.server 8080
```

### 閲覧モードのURL例

```
index.html?view=1&staff=吉田さん(MEK)&mine=1&tab=week
```

## 主な機能

| タブ | 内容 |
|------|------|
| **今週** | チーム向け · 今週のFB / 提出 / 投稿 / 現状の遅れ |
| **チーム状況** | 期限超過・要対応・近い投稿（メンバー絞り込み可） |
| **ガント** | 左固定列＋日付タイムライン（管理者向け詳細） |
| **一覧** | 全工程ステータス横並び |
| **登録者** | 週次チャンネル登録者数（スプレッドシート同等の3行ブロック表） |

## 登録者数トラッキング

[元スプレッドシート](https://docs.google.com/spreadsheets/d/1pTQeFY1MXQCPBgYr3StCILSSD789EV5jJ8qBHy866IE/edit) の過去データを取り込み、**毎週月曜 9:00 JST** 時点の登録者数を追記する。

### 初回取り込み

```bash
cd COO/youtube-schedule
node scripts/import-subscribers-sheet.js --fetch
```

### 毎週の自動取得（月曜 6:00 JST）

```bash
# 手動（今週分）
node scripts/fetch-subscribers.js
bash scripts/deploy.sh "subs: weekly snapshot"

# Mac 自動化（初回のみ）
cp scripts/com.tak.youtube-weekly-subs.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.tak.youtube-weekly-subs.plist
```

月曜 6:00 に `weekly-subscribers.sh`（取得→デプロイ）が自動実行されます。  
列の日付はスプレッドシート同様 **日曜日付**（月曜朝の取得 → 6/28 列など）。

チャンネルURLは `data/subscriber-channels.json` に定義（全11チャンネル登録済み）。

### スプレッドシートとの対応

| 列 | アプリ |
|----|--------|
| 投稿（済/ボツ） | 投稿列バッジ |
| 担当 | 担当 |
| クライアント | クライアント |
| No. / 投稿番号 / 投稿日 / タイプ / 企画 | 同名列（No.・投稿番号は自動採番） |
| 待ち状態 | 待ち状態 |
| 元素材 | 🔗 リンク |
| 日付ガント（撮影→初稿→FB→…→投稿） | 投稿日から自動計算した工程マイルストーン |

初期表示はフィルターなし（全件）。運用が固まったら **「制作中」** チップで絞り込む。

## データ保存

- ブラウザ `localStorage` キー: `yt_v7`
- **エクスポート / インポート**: JSON バックアップ・復元・チーム共有
- **初回起動は空** — `＋ 一括` で複数行入力、またはスプレッドシートから貼り付け

### 一括追加

1. **＋ 一括** を開く
2. 1行目を入力 · 2行目以降は **〃（同上）** がデフォルトON
3. 企画名・URL以外は上の行を引き継ぎ · 投稿日は **±日数**（上部で初期日数を変更可、デフォルト +7日）
4. **一括保存**

貼り付け列の順（タブ区切り）: `クライアント` · `担当` · `タイプ` · `企画名` · `投稿予定日` · `待ち状態` · `URL`  
（スプレッドシートから貼り付けた場合は各行が独立入力になります）

### 番号のルール

| 項目 | ルール |
|------|--------|
| **No.** | 登録順の管理番号（1, 2, 3…） |
| **投稿番号** | クライアントごとに、投稿予定日が早い順で 1, 2, 3…（同日・未設定は登録順でタイブレーク） |

投稿予定日を変更すると、該当クライアント内の投稿番号が自動で振り直されます。

## ファイル構成

```
youtube-schedule/
├── index.html    # エントリ
├── styles.css    # UI
├── app.js        # ロジック
├── data/         # 共有JSON配置（任意）
└── README.md
```

## 工程（動画ごとに選択）

編集モーダルで**使用する工程にチェック**。日付は基本ルールで自動計算し、**手入力があればそちらを優先**してガントに表示。

| 工程 | 基準 | 日数 |
|------|------|------|
| 企画 | 撮影日 | 1週間前 |
| 撮影 | **手入力** | — |
| 施工 | 撮影日 | +4日 |
| 台本 | 撮影日 | +8日 |
| FB（施台） | 撮影日 | +10日 |
| アフレコ | **手入力** | — |
| 初稿 | 投稿日 | 14日前 |
| FB | 投稿日 | 12日前 |
| 修正 | 投稿日 | 10日前 |
| 完成 | 投稿日 | 8日前 |
| M提出 | 投稿日 | 7日前 |
| C提出 | 投稿日 | 4日前 |
| 投稿 | 投稿日 | 当日 |

撮影日を入れると、撮影基準の工程が自動計算されます。投稿日を入れると、投稿基準の工程が自動計算されます。

## 関連

- COO 横断進捗: `COO/agents/pinned-sessions.md` → YouTube進捗管理
- Excel 版生成: `COO/scripts/build_youtube_mgmt.py`
