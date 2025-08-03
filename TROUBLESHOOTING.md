# トラブルシューティングガイド

## 🚨 よくある問題と解決方法

### 接続関連

#### Q: iPhoneから接続できない
**A: 以下を確認してください**

1. **同一ネットワーク確認**
   ```bash
   # WindowsのIPアドレス確認
   ipconfig
   # Wi-Fiセクションの IPv4 アドレスを確認
   ```

2. **ファイアウォール設定**
   ```powershell
   # 管理者権限のPowerShellで実行
   New-NetFirewallRule -DisplayName "Claude Remote Server" -Direction Inbound -Protocol TCP -LocalPort 8090 -Action Allow
   New-NetFirewallRule -DisplayName "Claude Remote Client" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

3. **ポート確認**
   ```bash
   netstat -an | findstr :8090
   netstat -an | findstr :3000
   ```

#### Q: WebSocket接続がすぐ切れる
**A: タイムアウト設定を確認**

```javascript
// server/index.js に追加
wss.on('connection', (ws) => {
  // Keep-alive設定
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);
  
  ws.on('close', () => {
    clearInterval(interval);
  });
});
```

### 認証関連

#### Q: ログインできない（Invalid credentials）
**A: パスワードハッシュを再生成**

```bash
cd server
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your-password', 10).then(console.log)"
# 出力されたハッシュをindex.jsのusers配列に設定
```

#### Q: セッションがすぐ切れる
**A: JWT有効期限を確認**

```javascript
// server/index.js
const token = jwt.sign(
  { userId: user.id }, 
  process.env.JWT_SECRET, 
  { expiresIn: '7d' } // 7日間に延長
);
```

### 文字化け関連

#### Q: 日本語が文字化けする
**A: エンコーディング設定**

1. **Windowsのコードページ確認**
   ```bash
   chcp
   # 932（Shift-JIS）の場合は65001（UTF-8）に変更
   chcp 65001
   ```

2. **サーバー側の修正**
   ```javascript
   // server/index.js
   claudeProcess = spawn(process.env.CLAUDE_CODE_PATH || 'claude-code', [], {
     shell: true,
     env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
   });
   
   // stdout/stderrのエンコーディング設定
   claudeProcess.stdout.setEncoding('utf8');
   claudeProcess.stderr.setEncoding('utf8');
   ```

### パフォーマンス関連

#### Q: 大量の出力で画面がフリーズする
**A: 出力制限を実装**

```javascript
// client/src/store.ts
addTerminalLine: (line) => {
  const newLine: TerminalLine = {
    ...line,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
  set((state) => ({ 
    // 最新1000行のみ保持
    terminalLines: [...state.terminalLines, newLine].slice(-1000) 
  }));
}
```

#### Q: メモリ使用量が増え続ける
**A: メモリリーク対策**

```javascript
// 定期的なクリーンアップ
setInterval(() => {
  if (get().terminalLines.length > 2000) {
    set((state) => ({
      terminalLines: state.terminalLines.slice(-1000)
    }));
  }
}, 60000); // 1分ごと
```

### Claude Code関連

#### Q: Claude Codeが起動しない
**A: パスとアクセス権限を確認**

```bash
# Claude Codeの場所確認
where claude-code

# 環境変数確認
echo %PATH%

# .envファイルでフルパス指定
CLAUDE_CODE_PATH=C:\Users\spark\AppData\Local\Programs\claude-code\claude-code.exe
```

#### Q: コマンドが実行されない
**A: プロセス状態を確認**

```javascript
// デバッグログ追加
claudeProcess.on('spawn', () => {
  console.log('Claude Code process started');
});

claudeProcess.on('error', (err) => {
  console.error('Process error:', err);
  ws.send(JSON.stringify({ 
    type: 'error', 
    message: `Failed to start Claude Code: ${err.message}` 
  }));
});
```

### 開発環境関連

#### Q: npm installでエラー
**A: Node.jsバージョンとキャッシュ**

```bash
# Node.jsバージョン確認（v18以上推奨）
node --version

# npmキャッシュクリア
npm cache clean --force

# node_modules削除して再インストール
rmdir /s /q node_modules
del package-lock.json
npm install
```

#### Q: Viteが起動しない
**A: ポート競合を確認**

```bash
# ポート3000の使用状況確認
netstat -ano | findstr :3000

# 別のポートで起動
npm run dev -- --port 3001
```

### デプロイ関連

#### Q: PM2でサーバーが起動しない
**A: 環境変数の読み込み**

```bash
# ecosystem.config.jsを作成
module.exports = {
  apps: [{
    name: 'claude-remote-server',
    script: './index.js',
    cwd: './server',
    env: {
      NODE_ENV: 'production',
      PORT: 8090
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log'
  }]
};

# PM2で起動
pm2 start ecosystem.config.js
```

## 🔍 デバッグ方法

### サーバー側ログ確認
```bash
# PM2ログ確認
pm2 logs claude-remote-server

# リアルタイムログ
pm2 logs claude-remote-server --lines 100 -f
```

### クライアント側デバッグ
1. Chrome DevToolsを開く（F12）
2. NetworkタブでWebSocket接続確認
3. ConsoleタブでJavaScriptエラー確認

### ネットワークトレース
```bash
# Wiresharkでパケットキャプチャ
# フィルタ: tcp.port == 8090
```

## 📞 それでも解決しない場合

1. エラーメッセージを完全にコピー
2. 以下の情報を収集：
   - Windows バージョン
   - Node.js バージョン
   - ブラウザとバージョン
   - ネットワーク構成
3. プロジェクトのIssueに報告

---
最終更新: 2025年8月3日