# 🛠️ Claude Code Remote トラブルシューティングガイド

## 🚨 「このサイトにアクセスできません」エラーの対処法

### 1. サービスの状態確認

#### ✅ 現在の状態
- クライアント: **ポート3000で起動中** ✅
- サーバー: **別ウィンドウで起動が必要**

### 2. 手動でサービスを起動

#### クライアント起動（すでに起動済み）
```bash
cd claude-code-remote\client
npm run dev
```

#### サーバー起動（新しいコマンドプロンプトで）
```bash
cd claude-code-remote\server
npm run start:secure
```

### 3. アクセス方法

#### ブラウザで以下を試してください：
1. **Chrome シークレットモード**: `Ctrl+Shift+N` で開く
2. **Edge InPrivateモード**: `Ctrl+Shift+N` で開く
3. **Firefox プライベートモード**: `Ctrl+Shift+P` で開く

#### URL:
```
http://localhost:3000
```

### 4. ファイアウォール設定

Windows Defender ファイアウォールで以下のポートを許可：
- **3000** (クライアント)
- **9001** (サーバー)

```powershell
# 管理者権限のPowerShellで実行
New-NetFirewallRule -DisplayName "Claude Code Client" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "Claude Code Server" -Direction Inbound -Protocol TCP -LocalPort 9001 -Action Allow
```

### 5. プロセス確認コマンド

```bash
# ポート確認
netstat -an | findstr :3000
netstat -an | findstr :9001

# Node.jsプロセス確認
tasklist | findstr node
```

### 6. 完全リセット手順

1. すべてのプロセスを停止：
```bash
taskkill /F /IM node.exe
```

2. キャッシュクリア：
```bash
cd client
npm cache clean --force
```

3. 再起動：
```bash
cd ..
start-all.bat
```

### 7. 代替アクセス方法

もしlocalhostでアクセスできない場合：
- `http://127.0.0.1:3000`
- `http://192.168.128.142:3000` (ローカルIP)

### 8. ログ確認

サーバーログ：
```bash
cd server
type claude-code-remote.log
```

### 9. よくある原因

1. **ウイルス対策ソフト**: 一時的に無効化してテスト
2. **VPN**: 切断してテスト
3. **プロキシ設定**: ブラウザのプロキシ設定を確認
4. **別のアプリがポート使用**: ポート3000/9001を使用している他のアプリを停止

## 📱 iPhone/iPadでアクセスできない場合

1. **同じWi-Fi**に接続しているか確認
2. **Windows IP**が正しいか確認: `ipconfig`
3. **プライベートネットワーク**設定を確認

---

**問題が解決しない場合**: 
エラーメッセージやログを確認して、具体的な問題を特定してください。