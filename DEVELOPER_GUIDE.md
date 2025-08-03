# Claude Code Remote 開発者ガイド

## 🚀 クイックスタート

### 最速でプロジェクトを動かす

```bash
# 1. リポジトリをクローン（または展開）
cd C:\Users\spark\claude-code-remote

# 2. サーバー側の準備
cd server
npm install
# .envファイルのJWT_SECRETを任意の値に変更

# 3. クライアント側の準備
cd ../client
npm install

# 4. 両方を起動（別々のターミナルで）
# ターミナル1
cd server && npm start

# ターミナル2
cd client && npm run dev
```

アクセス: `http://localhost:3000`
デフォルトログイン: admin / password123

## 📁 プロジェクト構造

```
claude-code-remote/
├── server/                 # Node.js バックエンド
│   ├── index.js           # メインサーバーファイル
│   ├── package.json       # サーバー依存関係
│   └── .env              # 環境設定（要編集）
├── client/                # React フロントエンド
│   ├── src/
│   │   ├── components/   # UIコンポーネント
│   │   ├── store.ts      # Zustand状態管理
│   │   ├── App.tsx       # メインアプリケーション
│   │   └── main.tsx      # エントリーポイント
│   ├── package.json      # クライアント依存関係
│   └── vite.config.ts    # Viteビルド設定
├── README.md             # 基本的な使用方法
├── PROJECT_OVERVIEW.md   # プロジェクト概要
└── setup.ps1            # Windows用セットアップスクリプト
```

## 🛠️ 開発環境

### 必須環境
- **Node.js**: v18以上推奨
- **npm**: v8以上
- **Windows**: 10/11（サーバー側）
- **Claude Code**: インストール済み

### 推奨開発ツール
- **VS Code**: 推奨エディタ
  - 拡張機能: ESLint, Prettier, TypeScript
- **Git Bash**: Windows上でのコマンド実行
- **PowerShell**: セットアップスクリプト実行用

### 開発用ポート
- **8090**: WebSocketサーバー（変更可能）
- **3000**: Vite開発サーバー

## 💻 開発Tips

### 1. ホットリロード活用
クライアント側は自動的にホットリロードが有効。サーバー側でも開発効率を上げるには：

```bash
# サーバー側でnodemonを使用
cd server
npm install -D nodemon
npm run dev  # package.jsonにスクリプト追加済み
```

### 2. デバッグ方法

#### サーバー側デバッグ
```javascript
// console.logの代わりにデバッグライブラリを使用
const debug = require('debug')('claude-remote:server');
debug('WebSocket connection established');
```

#### クライアント側デバッグ
- React Developer Tools使用
- `console.log`の代わりに`console.group`でグループ化

### 3. 型安全性の向上
```typescript
// 共通の型定義ファイルを作成
// client/src/types/common.ts
export interface WSMessage {
  type: 'auth' | 'command' | 'output' | 'error';
  data?: any;
}
```

### 4. エラーハンドリングパターン
```typescript
// クライアント側
try {
  await sendCommand(command);
} catch (error) {
  if (error instanceof WebSocketError) {
    // WebSocket固有のエラー処理
  } else {
    // 一般的なエラー処理
  }
}
```

## 📋 開発バックログ

### 優先度: 🔴 高

#### 1. HTTPS/WSS対応
- **理由**: セキュリティの基本要件
- **作業内容**: 
  - 自己署名証明書の生成スクリプト作成
  - Express HTTPSサーバー設定
  - クライアント側のWSS接続対応
- **見積もり**: 4-6時間

#### 2. 日本語文字化け対策
- **理由**: 日本語環境での必須機能
- **作業内容**:
  - サーバー側のエンコーディング設定
  - child_processのencoding指定
  - クライアント側の表示確認
- **見積もり**: 2-3時間

#### 3. エラーリカバリー強化
- **理由**: 安定性向上
- **作業内容**:
  - 自動再接続ロジックの改善
  - エクスポネンシャルバックオフ実装
  - 接続状態の詳細管理
- **見積もり**: 3-4時間

### 優先度: 🟡 中

#### 4. コマンド履歴機能
- **理由**: UX向上
- **作業内容**:
  - LocalStorageへの履歴保存
  - 上下キーでの履歴参照
  - 履歴のクリア機能
- **見積もり**: 2-3時間

#### 5. マルチセッション対応
- **理由**: 複数デバイスからの利用
- **作業内容**:
  - セッションID管理
  - プロセス分離
  - リソース管理
- **見積もり**: 6-8時間

#### 6. ログ機能実装
- **理由**: 運用・デバッグ効率化
- **作業内容**:
  - Winstonログライブラリ導入
  - ログローテーション設定
  - エラーログの分離
- **見積もり**: 3-4時間

### 優先度: 🟢 低

#### 7. テーマ切り替え
- **理由**: ユーザビリティ向上
- **作業内容**:
  - ライト/ダークテーマ実装
  - テーマ設定の永続化
  - システム設定連動
- **見積もり**: 4-5時間

#### 8. 音声入力対応
- **理由**: アクセシビリティ向上
- **作業内容**:
  - Web Speech API実装
  - 音声認識の精度調整
  - コマンド補完機能
- **見積もり**: 8-10時間

## 🔧 よくある問題と解決方法

### 1. ポート競合
```bash
# 使用中のポートを確認（Windows）
netstat -ano | findstr :8090

# プロセスを特定して終了
taskkill /PID [プロセスID] /F
```

### 2. npm installエラー
```bash
# キャッシュクリア
npm cache clean --force
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### 3. Claude Codeが見つからない
```bash
# パスを確認
where claude-code

# .envファイルでフルパス指定
CLAUDE_CODE_PATH=C:\path\to\claude-code.exe
```

## 🧪 テスト環境構築

### ユニットテスト（追加予定）
```bash
# サーバー側
cd server
npm install -D jest
npm test

# クライアント側
cd client
npm install -D vitest @testing-library/react
npm test
```

### E2Eテスト（追加予定）
```bash
# Playwrightを使用
npm install -D @playwright/test
npx playwright test
```

## 📝 コーディング規約

### JavaScript/TypeScript
- ESLint設定に従う
- 関数名: camelCase
- コンポーネント名: PascalCase
- 定数: UPPER_SNAKE_CASE

### コミットメッセージ
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: フォーマット修正
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・補助ツール変更
```

### プルリクエスト
- 機能単位で作成
- テスト結果を含める
- スクリーンショット添付（UI変更時）

## 🚢 デプロイ手順

### 開発環境
現在の手順通り（npm run dev）

### 本番環境（追加予定）
```bash
# クライアントビルド
cd client
npm run build

# サーバー側でstaticファイル配信
# PM2での永続化
pm2 start server/index.js --name claude-remote
pm2 save
pm2 startup
```

## 📞 連絡先・サポート

### 質問がある場合
1. プロジェクトのIssueを確認
2. READMEとこのガイドを再確認
3. コード内のコメントを参照

### 貢献方法
1. Issueから作業を選択
2. ブランチ作成: `feature/issue-番号`
3. 開発・テスト
4. プルリクエスト作成

## 🔍 追加リソース

### 参考ドキュメント
- [WebSocket API](https://developer.mozilla.org/ja/docs/Web/API/WebSocket)
- [React公式ドキュメント](https://ja.react.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vite](https://ja.vitejs.dev/)

### 関連プロジェクト
- Claude Code公式ドキュメント
- Express.js ガイド
- React PWA ベストプラクティス

---

最終更新: 2025年8月3日