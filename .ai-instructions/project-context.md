# Claude Code Remote - AIプロジェクトコンテキスト

## 🤖 あなたの役割
あなたはClaude Code AIとして、以下のいずれかの役割でこのプロジェクトに参加しています：
- **開発者**: 機能の実装とコードの作成
- **テスター**: テストの作成と実行、品質保証
- **ドキュメント管理者**: ドキュメントの作成と整理

## 📋 プロジェクト概要
- **プロジェクト名**: Claude Code Remote
- **目的**: iPhoneからWindows PC上のClaude Codeをリモート制御するWebアプリケーション
- **技術スタック**: Node.js, Express, WebSocket, React, TypeScript, JWT

## 🔄 作業フロー

### 1. タスクの受け取り
```bash
# 新しいタスクを確認
ls tasks/backlog/
```

### 2. タスク開始時の手順
1. タスクファイルを`backlog`から`in-progress`へ移動
2. タスクファイルの`status`を"in-progress"に更新
3. `assignee`に自分のIDを設定
4. `PROJECT_STATUS.json`の集計を更新

### 3. 作業中の更新
- コード実装の進捗に応じて`progress_percentage`を更新
- 重要な決定や問題は`notes`配列に追加
- 関連ファイルを`code_references`に追加

### 4. タスク完了時の手順
1. すべての`subtasks`が完了していることを確認
2. `test_status`を更新
3. タスクファイルを`in-progress`から`review`へ移動
4. `PROJECT_STATUS.json`を更新

## 📝 ファイル更新ルール

### PROJECT_STATUS.json の更新タイミング
- タスクのステータス変更時
- 新しいリスクの発見時
- マイルストーンの進捗更新時
- スプリント開始/終了時

### 自動更新が必要な項目
```json
{
  "last_updated": "現在時刻をISO8601形式で",
  "overall_progress": "完了タスク数 / 総タスク数 * 100",
  "summary": {
    "total_tasks": "全タスクファイル数",
    "completed_tasks": "completedフォルダ内のファイル数",
    "in_progress_tasks": "in-progressフォルダ内のファイル数",
    "blocked_tasks": "statusがblockedのタスク数"
  }
}
```

## 🏗️ コード実装時の規則

### ファイル作成時
1. 適切なディレクトリに配置
2. 命名規則に従う（camelCase/kebab-case）
3. 必ずテストファイルも作成

### コミットメッセージ
```
type(scope): subject

- タスクID: TASK-XXX
- 進捗: XX%
```

### ドキュメント更新
- コード変更時は関連ドキュメントも必ず更新
- APIエンドポイント追加時は`docs/technical/api-spec.yaml`を更新
- DB変更時は`docs/technical/database.sql`を更新

## 📊 レポート生成

### デイリーログ（毎日作成）
`sprints/sprint-[number]/daily-logs/YYYY-MM-DD.json`
```json
{
  "date": "2025-08-03",
  "completed_tasks": ["TASK-001", "TASK-002"],
  "started_tasks": ["TASK-003"],
  "blockers": ["TASK-004がAPI仕様待ち"],
  "notes": "WebSocket実装で予期しない遅延"
}
```

### 週次でのHUMAN_DASHBOARD.md再生成
```python
# 毎週金曜日に実行
1. すべてのタスクファイルを集計
2. PROJECT_STATUS.jsonを最新化
3. HUMAN_DASHBOARD.mdをテンプレートから生成
4. グラフとメトリクスを更新
```

## ⚠️ 重要な注意事項

1. **並行作業の防止**: 他のAIが作業中のタスクには触らない
2. **ファイルロック**: `in-progress`のタスクは`assignee`のみが編集可能
3. **自動テスト**: コード変更後は必ずテストを実行
4. **進捗の正確性**: `progress_percentage`は実際の完了度を反映

## 🔍 トラブルシューティング

### タスクがブロックされた場合
1. タスクファイルの`status`を"blocked"に変更
2. `notes`にブロック理由を詳細に記載
3. `PROJECT_STATUS.json`のrisksセクションに追加
4. 依存関係を`dependencies`に明記

### コンフリクト発生時
1. 最新の状態を取得
2. 変更内容をマージ
3. テストを再実行
4. レビュー依頼

---
*このコンテキストファイルは、プロジェクトの進行に応じて更新されます。*
*最終更新: 2025-08-03*