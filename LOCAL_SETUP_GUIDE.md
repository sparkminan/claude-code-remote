# 🚀 Claude Code Remote ローカルセットアップガイド

## 📊 現在の状態
- **サーバー**: HTTPS対応で起動中 (ポート9001)
- **クライアント**: 開発サーバー起動中 (ポート3000)
- **ローカルIP**: 192.168.128.142

## 🖥️ PC（Windows）でのアクセス

### 1. Webブラウザでアクセス
```
http://localhost:3000
```

### 2. ログイン情報
- **ユーザー名**: `admin`
- **パスワード**: `password123` (デフォルト)

### 3. サーバー接続URL
- **開発用**: `ws://localhost:9001`
- **HTTPS用**: `wss://localhost:9001`

## 📱 iPhone/iPadでのアクセス

### 1. 同じWi-Fiネットワークに接続
PCと同じWi-Fiネットワークに接続してください。

### 2. Safariでアクセス
```
http://192.168.128.142:3000
```

### 3. HTTPS警告の対処
初回アクセス時に証明書の警告が表示されます：
1. 「詳細を表示」をタップ
2. 「このWebサイトを閲覧」をタップ
3. 「Webサイトを閲覧」をタップ

### 4. サーバー接続URL
```
wss://192.168.128.142:9001
```

### 5. ホーム画面に追加（PWA）
1. Safari下部の共有ボタンをタップ
2. 「ホーム画面に追加」を選択
3. 名前を入力して「追加」

## 🧪 動作テスト

### 1. 基本的なコマンド
```bash
# ディレクトリ一覧
dir

# 現在のパス
cd

# エコーテスト
echo Hello from Claude Code Remote!

# 日本語テスト
echo こんにちは、世界！
```

### 2. Claude Codeコマンド
```bash
# ヘルプ表示
claude-code --help

# バージョン確認
claude-code --version
```

## 🛠️ トラブルシューティング

### サーバーが起動しない場合
```bash
# ポート確認
netstat -an | findstr 9001

# プロセス終了
taskkill /F /IM node.exe
```

### 証明書エラーが続く場合
1. 新しい証明書を生成：
```bash
cd server
node generate-ssl-cert.js
```

### 接続できない場合
1. Windowsファイアウォールの確認
2. ポート9001と5173が開放されているか確認
3. IPアドレスが正しいか再確認：`ipconfig`

## 🔧 開発者向け情報

### サーバーログ確認
```bash
cd server
type claude-code-remote.log
```

### デバッグモード
```bash
# サーバー
cd server
npm run dev:secure

# クライアント
cd client
npm run dev
```

### 環境変数
- `server/.env` ファイルで設定変更可能
- ENABLE_SSL=true でHTTPS有効
- JWT_SECRET は本番環境で変更必須

---

**現在の状態**: セットアップ完了！ブラウザでアクセスしてテストしてください。