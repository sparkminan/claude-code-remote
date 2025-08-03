# 🔐 Claude Code Remote ログイン情報

## デフォルトのログイン認証情報

### プリセット済みアカウント
- **ユーザー名**: `admin`
- **パスワード**: `password123`

### サーバーURL
- **ローカル開発**: `http://localhost:9001`
- **HTTPS使用時**: `https://localhost:9001`

## 📱 クイックスタート

1. **サーバー起動**
   ```bash
   cd server
   npm run start:secure
   ```

2. **クライアント起動**
   ```bash
   cd client
   npm run dev
   ```

3. **ブラウザでアクセス**
   - http://localhost:3000
   - ログイン画面にID/PWが既に入力されています
   - 「Connect」または「Quick Connect」ボタンをクリック

## 🎯 特徴

### プリセットログイン画面
- ユーザー名とパスワードが事前入力済み
- パスワード表示/非表示切り替えボタン
- Quick Connectボタンで即座に接続
- デフォルト認証情報を画面下部に表示

### セキュリティ設定
- JWT認証（24時間有効）
- bcryptによるパスワードハッシュ化
- HTTPS/WSS対応

## 🔧 カスタマイズ

### パスワード変更方法
1. 新しいパスワードハッシュを生成：
   ```bash
   cd server
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('新しいパスワード', 10).then(console.log)"
   ```

2. `.env`ファイルの`DEFAULT_PASSWORD_HASH`を更新

3. サーバーを再起動

### ユーザー名変更
`.env`ファイルの`DEFAULT_USERNAME`を変更してサーバー再起動

## 📝 注意事項

- このプリセット設定は開発環境用です
- 本番環境では必ず強力なパスワードに変更してください
- JWT_SECRETも本番環境では変更が必要です