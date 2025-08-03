# Claude Code Remote Control

iPhoneからWindows上のClaude Codeをリモート制御するためのWebアプリケーション

## 機能

- iPhone最適化されたタッチフレンドリーなUI
- WebSocketによるリアルタイム通信
- セキュアな認証システム
- クイックコマンドボタン
- PWA対応（ホーム画面に追加可能）

## セットアップ

### 1. サーバー側（Windows）

```bash
cd claude-code-remote/server
npm install
```

`.env`ファイルを編集:
- `JWT_SECRET`: 安全なランダム文字列に変更
- `CLAUDE_CODE_PATH`: claude-codeコマンドのパス（通常は`claude-code`）

パスワードハッシュの生成:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(console.log)"
```

生成されたハッシュを`index.js`の`users`配列に設定

サーバー起動:
```bash
npm start
```

### 2. クライアント側

```bash
cd claude-code-remote/client
npm install
npm run dev
```

### 3. iPhone からアクセス

1. WindowsのIPアドレスを確認
2. iPhoneで `http://[WindowsのIP]:3000` にアクセス
3. サーバーURL: `http://[WindowsのIP]:8080`
4. ユーザー名とパスワードでログイン

## セキュリティ設定

### Windows ファイアウォール

ポート8080（サーバー）と3000（開発時のクライアント）を開放:

```powershell
New-NetFirewallRule -DisplayName "Claude Code Remote Server" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
New-NetFirewallRule -DisplayName "Claude Code Remote Client Dev" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### 本番環境での推奨事項

1. HTTPS/WSSの使用
2. より強力な認証メカニズム
3. レート制限
4. IPホワイトリスト

## ビルド

クライアントのビルド:
```bash
cd claude-code-remote/client
npm run build
```

ビルドされたファイルは`dist`フォルダに出力されます。