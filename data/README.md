# 共有データ（チーム向け）

メンバー全員が同じ進捗を見るための `schedule.json` です。

公開サイト: **https://takpz93.github.io/youtube-schedule/**

## チーム閲覧URL（メンバーに共有）

**https://takpz93.github.io/youtube-schedule/?view=1&tab=week**

- 編集不可 · 30秒ごとに自動更新
- 担当者で絞る: `?view=1&staff=吉田さん(MEK)&mine=1&tab=week`

## 更新（管理者）

通常は **アプリ内の ⚙️ 同期** を設定すれば、編集のたびに自動でこのファイルが更新されます。

手動で更新する場合:

1. アプリで **📥 エクスポート**
2. このフォルダの `schedule.json` に上書き
3. `bash scripts/deploy.sh "Update schedule data"`

```bash
cp schedule.json /path/to/youtube-schedule/data/
bash scripts/deploy.sh "Update schedule data"
```

数分後に GitHub Pages に反映されます。
