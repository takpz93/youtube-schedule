# 開発・修正時のルール

## 案件データを消さない（最重要）

ユーザーが登録した案件は **絶対に意図せず削除しない**。

### データの所在

| 場所 | 内容 |
|------|------|
| ブラウザ `localStorage` (`yt_v7`) | 各端末の作業コピー |
| `data/schedule.json` | チーム共有の正本（GitHub Pages） |

### 修正時にやってはいけないこと

- `data/schedule.json` を空の `projects: []` で上書きしてデプロイ
- `STORAGE_KEY` を変更するだけ（旧キーからの移行なし）
- 起動時に空のサーバーデータでローカルを上書き
- `git push --force` でリモートの schedule.json を消す

### 修正時にやること

1. デプロイ前に `node scripts/preserve-schedule.js` を実行
2. または `bash scripts/deploy.sh "コミットメッセージ"`
3. `STORAGE_KEY` を変える場合は `LEGACY_STORAGE_KEYS` に旧キーを追加し `migrateLegacyStorage()` で引き継ぐ
4. 共有データの更新は **エクスポート → schedule.json コミット** のみ

### アプリの保護ロジック（app.js）

- サーバーが空・ローカルに案件あり → **ローカルを保持**
- `_meta.updatedAt` が新しい方を優先
- 旧 `yt_v4`〜`yt_v6` から自動移行

---

## インシデント記録: 白画面（2026-06-28）

### 現象

本番 URL を開くとタブだけ表示され、案件データが一切表示されない（白画面）。

### 直接原因

`app.js` に **JavaScript 構文エラー**（`utf8ToBase64` 関数の重複コード片）があり、ブラウザが `app.js` 全体のパースに失敗。`bootstrap()` が一度も実行されなかった。

**データは消えていない。** Gist / GitHub Pages ともに 398 件の `schedule.json` は intact。

### なぜ本番に載ったか

| 欠陥 | 内容 |
|------|------|
| デプロイ前チェックなし | `deploy.sh` が `node --check` を実行していなかった |
| ローカル確認なし | 修正後にブラウザで起動確認せず push |
| 起動失敗 UI なし | 構文エラー時は真っ白な画面のみ（ユーザーに原因が伝わらない） |

### 再発防止（実装済み）

1. **`scripts/pre-deploy-check.js`** — デプロイ前に必須実行
   - 全 JS の `node --check` 構文検証
   - 関数の重複定義検出
   - `APP_VERSION` と `index.html` のキャッシュバスター一致
   - `schedule.json` の JSON 整合性・最低件数
   - `bootstrap()` の存在確認
   - **`.fatal-error[hidden]` CSS ルールの存在確認**（常時表示バグ防止）
2. **`deploy.sh`** — 最初のステップで pre-deploy-check。失敗時は **push しない**
3. **`#fatal-error` パネル** — 起動失敗時のみ表示（`[hidden]` + CSS で制御）
4. **`window.__YT_BOOT_OK__`** — bootstrap 成功マーカー。12秒以内に立たなければエラー表示
5. **`.github/workflows/validate.yml`** — push 時にも CI で同チェック

### インシデント記録: エラー画面が常時表示（2026-06-28）

**現象:** 「アプリを読み込めませんでした」が常に表示され、中身が見えない。

**直接原因:** `.fatal-error { display: flex }` が HTML の `[hidden]` 属性より優先され、**起動成功後もエラー画面が消えなかった**（Safari 等）。

**対策:** `.fatal-error[hidden] { display: none !important; }` に修正。pre-deploy-check で CSS ルールの存在を検証。

### 開発者が守ること

```bash
# デプロイ前（deploy.sh が自動実行するが、手動でも可）
node scripts/pre-deploy-check.js

# デプロイ
bash scripts/deploy.sh "メッセージ"
```

**構文エラーがある状態ではデプロイできない。** チェックをスキップしないこと。
