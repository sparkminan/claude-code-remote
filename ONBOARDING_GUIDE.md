# 🚀 新規参入者向けオンボーディングガイド

Claude Code Remoteプロジェクトへようこそ！このガイドは、プロジェクトに新しく参加される方が最短でプロジェクトを理解し、貢献できるようになることを目的としています。

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [事前準備](#事前準備)
3. [Day 1: 環境構築](#day-1-環境構築)
4. [Day 2: プロジェクト理解](#day-2-プロジェクト理解)
5. [Day 3: 実際に動かしてみる](#day-3-実際に動かしてみる)
6. [Day 4: コードを読む](#day-4-コードを読む)
7. [Day 5: 最初の貢献](#day-5-最初の貢献)
8. [よくある質問](#よくある質問)
9. [次のステップ](#次のステップ)

## 🎯 プロジェクト概要

### 一言で説明すると
**「Windows PC上のClaude CodeをiPhoneから操作できるリモートコントロールアプリ」**

### なぜ必要？
- 開発者がPCから離れていても開発作業を継続したい
- モバイルデバイスから緊急対応が必要な場合がある
- リモートワークやモビリティの向上

### 主な機能
- ✅ iPhoneからコマンド送信
- ✅ リアルタイムで結果表示
- ✅ セキュアな認証
- 🚧 PWA対応（開発中）
- 📅 ファイル転送（計画中）

## 🛠 事前準備

### 必要なスキル
- **必須**: JavaScript基礎知識
- **推奨**: React経験、Node.js経験
- **あると良い**: TypeScript、WebSocket

### 必要なツール
- [ ] **Node.js** (v18以上) - [ダウンロード](https://nodejs.org/)
- [ ] **Git** - [ダウンロード](https://git-scm.com/)
- [ ] **VS Code** - [ダウンロード](https://code.visualstudio.com/)
- [ ] **Windows PC** (サーバー実行用)
- [ ] **iPhone** (クライアントテスト用)

### アカウント準備
- [ ] GitHubアカウント
- [ ] プロジェクトリポジトリへのアクセス権

## 📅 Day 1: 環境構築

### 1. リポジトリのクローン
```bash
git clone [repository-url]
cd claude-code-remote
```

### 2. VS Code拡張機能のインストール
```bash
code .
# 推奨拡張機能が自動で提案されます
```

### 3. 依存関係のインストール
```bash
# サーバー側
cd server
npm install

# クライアント側
cd ../client
npm install
```

### 4. 環境設定ファイルの作成
```bash
cd ../server
cp .env.example .env
# .envファイルを編集してください
```

### 5. 動作確認
```bash
# サーバー起動
npm start

# 別ターミナルでクライアント起動
cd ../client
npm run dev
```

✅ **Day 1 完了**: http://localhost:3000 でアプリが表示されれば成功！

## 📖 Day 2: プロジェクト理解

### 必読ドキュメント（この順番で）
1. **PROJECT_OVERVIEW.md** - プロジェクトの全体像を理解
2. **ARCHITECTURE.md** - システム構成を把握
3. **GLOSSARY.md** - 用語の確認

### プロジェクト構造の理解
```
claude-code-remote/
├── server/          # バックエンド（Node.js）
│   ├── index.js     # メインサーバーファイル
│   └── .env         # 環境設定
├── client/          # フロントエンド（React）
│   ├── src/
│   │   ├── components/  # UIコンポーネント
│   │   └── store.ts     # 状態管理
│   └── package.json
└── docs/            # ドキュメント
```

### キーコンセプト
- **WebSocket**: リアルタイム双方向通信
- **JWT**: 認証トークン
- **Child Process**: Claude Code制御
- **PWA**: モバイル対応

✅ **Day 2 完了**: プロジェクトの概要を理解できた！

## 🔧 Day 3: 実際に動かしてみる

### 基本的な使い方

1. **サーバー起動**
```bash
cd server
npm start
# ログ: "Server running on port 8090"
```

2. **クライアント起動**
```bash
cd client
npm run dev
# ログ: "VITE ready in XXXms"
```

3. **ログイン**
- ユーザー名: `admin`
- パスワード: `password123`（開発環境のみ）

4. **コマンド実行**
- 「ls」と入力して送信
- ファイル一覧が表示される

### iPhoneからのアクセス
1. WindowsのIPアドレスを確認
```bash
ipconfig
# IPv4 アドレスをメモ
```

2. iPhoneで同じWi-Fiに接続
3. Safariで `http://[WindowsのIP]:3000` にアクセス

### トラブルシューティング
- 接続できない → ファイアウォール設定を確認
- 文字化け → 文字エンコーディングの問題（既知のバグ）

✅ **Day 3 完了**: 実際にコマンドを実行できた！

## 💻 Day 4: コードを読む

### 重要なファイルから読む

#### 1. サーバー側のエントリーポイント
`server/index.js`を読んで理解すること：
- Express設定
- WebSocket接続処理
- 認証フロー
- Claude Codeプロセス管理

#### 2. クライアント側のメインコンポーネント
`client/src/App.tsx`から始めて：
- コンポーネント構造
- 状態管理（Zustand）
- WebSocket接続

#### 3. 通信プロトコル
WebSocketメッセージの形式を理解：
```typescript
// クライアント → サーバー
{ type: 'command', text: 'ls -la' }

// サーバー → クライアント
{ type: 'output', text: '結果...' }
```

### デバッグ方法
1. **サーバー側**: `console.log`を活用
2. **クライアント側**: Chrome DevTools
3. **WebSocket**: WS DevTools拡張機能

✅ **Day 4 完了**: コードの流れを理解できた！

## 🎉 Day 5: 最初の貢献

### Good First Issues を探す
1. GitHubの[Issues](リンク)を確認
2. `good first issue`ラベルを探す
3. または`DEVELOPMENT_BACKLOG.md`の優先度「低」タスク

### 簡単な改善例
1. **UIの微調整**
   - ボタンの色を変更
   - アイコンの追加
   - レスポンシブ対応の改善

2. **ドキュメントの改善**
   - 誤字脱字の修正
   - 説明の追加
   - 図の作成

3. **エラーメッセージの改善**
   - より分かりやすいメッセージに
   - 日本語対応

### PR作成の流れ
```bash
# 1. ブランチ作成
git checkout -b feature/your-improvement

# 2. 変更を加える
# コードを編集

# 3. コミット
git add .
git commit -m "feat: 改善内容の説明"

# 4. プッシュ
git push origin feature/your-improvement

# 5. GitHub でPR作成
```

✅ **Day 5 完了**: 最初のPRを作成できた！

## ❓ よくある質問

### Q: Claude Codeって何？
**A:** Anthropic社のAIコーディングアシスタントです。このプロジェクトはそれをリモート制御します。

### Q: なぜiPhone専用？
**A:** 現在の開発フォーカスです。将来的にはAndroidやタブレット対応も予定しています。

### Q: セキュリティは大丈夫？
**A:** 現在は開発環境向けです。本番環境ではHTTPS/WSSの実装が必要です（`DEVELOPMENT_BACKLOG.md`参照）。

### Q: どこから手を付ければいい？
**A:** まずは`TROUBLESHOOTING.md`にある既知の問題を理解し、小さな改善から始めましょう。

### Q: 質問がある場合は？
**A:** 
1. まず関連ドキュメントを確認
2. GitHubのIssuesを検索
3. それでも解決しない場合は新規Issueを作成

## 🚀 次のステップ

### 1週間後の目標
- [ ] 開発環境を完全に理解
- [ ] 1つ以上のPRをマージ
- [ ] 新機能のアイデアを提案

### 推奨する学習リソース
- **WebSocket**: [MDN WebSocket API](https://developer.mozilla.org/ja/docs/Web/API/WebSocket)
- **React**: [React公式チュートリアル](https://ja.react.dev/learn)
- **TypeScript**: [TypeScript入門](https://www.typescriptlang.org/ja/docs/handbook/intro.html)

### より深く理解するために
1. **DEVELOPMENT_BACKLOG.md**を読んで今後の計画を把握
2. **ARCHITECTURE.md**を読み返してシステム設計を深く理解
3. 実際のバグ修正や機能追加に挑戦

## 🎯 チェックリスト

### 環境構築完了
- [ ] リポジトリをクローンした
- [ ] 依存関係をインストールした
- [ ] サーバーとクライアントを起動できた
- [ ] iPhoneからアクセスできた

### 理解度チェック
- [ ] プロジェクトの目的を説明できる
- [ ] 主要なコンポーネントを理解している
- [ ] WebSocket通信の流れを理解している
- [ ] 認証の仕組みを理解している

### 貢献準備
- [ ] コーディング規約を理解した
- [ ] Git操作に慣れている
- [ ] PR作成プロセスを理解した
- [ ] 最初のタスクを選んだ

---

## 🤝 Welcome to the Team!

質問や困ったことがあれば、遠慮なく聞いてください。
あなたの新しい視点とアイデアを楽しみにしています！

**Happy Coding! 🎉**

---
最終更新: 2025年8月3日