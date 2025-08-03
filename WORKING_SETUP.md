# ✅ 動作確認済みセットアップ

## 🚀 確実に動作する手順

### 1. すべてのNode.jsプロセスを停止
```bash
cd claude-code-remote
kill-all-node.bat
```

### 2. テストサーバーを起動（ポート9002）
```bash
cd server
node test-server.js
```

### 3. クライアントを起動
新しいコマンドプロンプトで：
```bash
cd client
npm run dev
```

### 4. ブラウザでアクセス
```
http://localhost:3000
```

### 5. ログイン画面でサーバーURLを変更
```
http://localhost:9002
```

### 6. ログイン
- Username: admin
- Password: password123

## ✅ 動作確認済み

### サーバー
- GET http://localhost:9002/api/health → {"status":"ok"}
- POST http://localhost:9002/api/login → JWT token返却

### 認証情報
- ユーザー名: admin
- パスワード: password123
- パスワードハッシュ: $2b$10$RD.54eT3qd8EAbTQLnRh.OwUut0CPClFb493raH/ZrQLeSeTeVepO

## 📝 注意事項
- ポート9001は何かが使用中のため、9002を使用
- test-server.jsは最小限の実装で確実に動作
- CORSは全許可（開発環境用）