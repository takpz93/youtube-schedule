# research/ — YouTube 参考材料の取得

`scripts/youtube-thumbnail-research.js` が、サムネ・タイトル用の参考動画（横断検索・自チャンネル上位・指名動画）を集めて md に書き出します。
出力先は既定で `research/chikatsukai-filling-research.md`。キーワードや対象チャンネルは `--config xxx.json` で差し替え可能。

```bash
node scripts/youtube-thumbnail-research.js                # 取得手段を自動判定
node scripts/youtube-thumbnail-research.js --config research/my-config.json --out research/my.md
```

## 取得手段（どれか1つ用意すれば動く）

| 手段 | 速さ | 準備 |
|---|---|---|
| YouTube Data API v3（推奨） | 数十秒 | Google Cloud で APIキーを1つ作る（無料枠 10,000 units/日。1回の実行で約 900 units） |
| yt-dlp | 10〜20分 | `yt-dlp` を PATH に入れる。youtube.com へ通信できる環境が必要 |

APIキーの作り方: [Google Cloud Console](https://console.cloud.google.com/) → プロジェクト作成 → 「APIとサービス」→「ライブラリ」で **YouTube Data API v3** を有効化 → 「認証情報」→「APIキーを作成」。キー制限は「YouTube Data API v3 のみ」にしておく。

## Claude Code（cloud セッション）で動かす設定

cloud セッションの環境は既定（Trusted）で youtube.com に通信できませんが、`*.googleapis.com` は通ります。
つまり **APIキーさえ渡せば、この環境で完成版まで生成できます**。渡し方は2通り。

### 方法1（推奨・キーがセッションに見えない）: 環境の API credentials に登録

Pro / Max プランで使えます。プロキシが `www.googleapis.com` 宛リクエストにキーを自動付与するので、スクリプトはキー指定なしで API モードになります。

1. [claude.ai/code](https://claude.ai/code) のメッセージ欄の上にある雲アイコン（環境名）→ 使っている環境にホバー → 歯車アイコン
2. **Update cloud environment** ダイアログの **API credentials** → **Add credential**
   - **Name**: `YouTube Data API`
   - **Allowed websites**: `www.googleapis.com`
   - **Credential type**: `Bearer` のまま
   - **Custom headers**: 1行。**Name** を `X-Goog-Api-Key` に変更、**Prefix** を空にする、**Value** に APIキーを貼る
3. **Connect**（この時点で保存されます）
4. 新しいセッションを開始し、`node scripts/youtube-thumbnail-research.js` を実行

### 方法2（簡単・環境を使う人にはキーが見える）: 環境変数

同じダイアログの **Environment variables** に1行追加して **Save changes**。

```text
YOUTUBE_API_KEY=AIza...
```

新しいセッションから有効（実行中のセッションには反映されない）。

### 方法3: セッション内で直接渡す（その場限り）

```bash
node scripts/youtube-thumbnail-research.js --key AIza...
# または
echo 'YOUTUBE_API_KEY=AIza...' > .env.local   # .gitignore 済み
```

### 補足: yt-dlp で動かしたい場合（キー不要・遅い）

環境の **Network access** を **Custom** にし、**Allowed domains** に次を追加（「Also include default list」はチェック）。

```text
www.youtube.com
*.youtube.com
*.ytimg.com
```

**Setup script** に `pip install yt-dlp` を追加。その後 `node scripts/youtube-thumbnail-research.js --mode ytdlp`。

## ローカル（Mac）で動かす

`fetch-subscribers.js` と同じ環境なら yt-dlp が入っているので、キー無しでそのまま動きます。

```bash
node scripts/youtube-thumbnail-research.js --mode ytdlp
```
