# HTTPS/WSS セットアップガイド

## 概要
セキュリティ向上のため、HTTPS/WSSプロトコルでの通信をサポートしました。

## セットアップ手順

### 1. 自己署名証明書の生成

```powershell
cd C:\Users\spark\claude-code-remote\server
npm run generate-cert
```

このコマンドで以下のファイルが生成されます：
- `server.cert` - SSL証明書
- `server.key` - 秘密鍵

### 2. HTTPSサーバーの起動

```bash
# HTTPS対応サーバーの起動
npm run start:https

# または開発モードで
npm run dev:https
```

### 3. クライアントからのアクセス

#### 初回アクセス時の証明書受け入れ

1. **ブラウザで証明書を受け入れる**
   - `https://[WindowsのIP]:8443/health` にアクセス
   - 「詳細設定」→「[IP]にアクセスする（安全ではありません）」をクリック
   - `{"status":"ok","https":"enabled","version":"1.0.0"}` が表示されれば成功

2. **iPhoneでの設定**
   - 同様に Safari で上記URLにアクセスして証明書を受け入れる
   - その後、`https://[WindowsのIP]:3000` でアプリにアクセス

### 4. ログイン時の設定

サーバーURL入力欄に：
```
https://[WindowsのIP]:8443
```

## ポート構成

| プロトコル | ポート | 用途 |
|-----------|--------|------|
| HTTP | 8090 | HTTPSへのリダイレクト |
| HTTPS | 8443 | メインサーバー |
| HTTP | 3000 | 開発用クライアント |

## トラブルシューティング

### Q: 「NET::ERR_CERT_AUTHORITY_INVALID」エラーが出る
**A:** 自己署名証明書のため、ブラウザで明示的に受け入れる必要があります。

### Q: WebSocket接続が失敗する
**A:** 先にHTTPSエンドポイント（/health）にアクセスして証明書を受け入れてください。

### Q: 証明書の有効期限は？
**A:** デフォルトで365日です。`generate-cert.ps1`で変更可能です。

## セキュリティ注意事項

1. **本番環境では正式な証明書を使用**
   - Let's Encrypt
   - 商用証明書

2. **ファイアウォール設定**
   ```powershell
   # HTTPS用ポートを開放
   New-NetFirewallRule -DisplayName "Claude Remote HTTPS" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow
   ```

3. **証明書ファイルの管理**
   - `server.key`は秘密鍵なので適切に保護
   - `.gitignore`に追加済み

## 従来のHTTP接続

HTTPSが不要な場合は、従来通り：
```bash
npm start  # HTTPサーバー（ポート8090）
```

---
最終更新: 2025年8月3日