# iPhone実機テストガイド

## 📱 概要
このガイドでは、iPhoneやiPadの実機でClaude Code Remoteをテストする手順を説明します。

## 🔧 前提条件

### Windows PC側
- Claude Code (v1.0.67以上) インストール済み
- Node.js 18以上
- ファイアウォールで以下のポートを開放
  - 9001 (HTTPサーバー)
  - 9002 (テストサーバー)
  - 9003 (Claude統合サーバー)

### iPhone/iPad側
- iOS/iPadOS 15.0以上
- Safari最新版
- 同じネットワーク（Wi-Fi）に接続

## 📝 セットアップ手順

### 1. Windows PCのIPアドレス確認

```bash
ipconfig
```

IPv4アドレスをメモ（例: 192.168.1.100）

### 2. サーバー起動

#### オプション1: テストサーバー（推奨）
```bash
cd C:\Users\spark\claude-code-remote\server
npm run test
```

#### オプション2: Claude統合サーバー
```bash
cd C:\Users\spark\claude-code-remote\server
npm run claude
```

### 3. iPhone/iPadでアクセス

1. Safariを開く
2. URLバーに入力:
   ```
   http://[PCのIPアドレス]:3000
   ```
   例: `http://192.168.1.100:3000`

3. ログイン画面が表示されたら:
   - **ユーザー名**: admin
   - **パスワード**: password123
   - **サーバーURL**: http://[PCのIPアドレス]:9002

## 🧪 テストシナリオ

### 基本動作確認

#### 1. 接続テスト
- ログイン後、"Connected"ステータスを確認
- 緑色のインジケーターが表示されること

#### 2. 簡単なコマンド実行
```
Show me the current directory
```

期待される結果:
- コマンドが送信される
- 現在のディレクトリパスが表示される

#### 3. ファイル作成テスト
```
Create a new file called test.txt with "Hello from iPhone"
```

期待される結果:
- ファイル作成の確認メッセージ
- PCでtest.txtが作成されている

### 高度なテストケース

#### 1. 日本語入力テスト
```
新しいPythonファイルを作成して、フィボナッチ数列を計算する関数を書いて
```

#### 2. 長時間実行テスト
```
Create a detailed analysis of all JavaScript files in the current project
```

#### 3. エラーハンドリングテスト
```
Delete the system32 folder
```
→ セキュリティエラーが表示されること

### パフォーマンステスト

#### 1. レスポンス時間測定
- コマンド送信から最初の出力まで: 1秒以内
- 完全な応答まで: 用途により異なる

#### 2. 大量出力テスト
```
Show me the contents of all files in the src directory
```

#### 3. 同時接続テスト
- 複数のデバイスから同時接続
- 各デバイスで独立して動作すること

## 🐛 トラブルシューティング

### 接続できない場合

1. **ファイアウォール確認**
   ```bash
   # Windows Defenderファイアウォールで許可
   netsh advfirewall firewall add rule name="Claude Remote" dir=in action=allow protocol=TCP localport=9001,9002,9003
   ```

2. **ネットワーク確認**
   - PCとiPhoneが同じWi-Fiネットワークに接続
   - プライベートネットワークとして設定

3. **サーバー状態確認**
   ```bash
   # ポート使用状況確認
   netstat -an | findstr :9001
   netstat -an | findstr :9002
   netstat -an | findstr :9003
   ```

### 文字化けする場合

1. サーバーログでUTF-8エンコーディングを確認
2. iPhoneのSafari設定で文字エンコーディングを確認

### 接続が切れる場合

1. **省電力設定確認**
   - iPhoneの自動ロック: なし
   - PCのスリープ設定: なし

2. **WebSocketタイムアウト確認**
   - 30秒ごとにping/pongが送信されているか

## 📊 テスト結果記録テンプレート

```markdown
## テスト実施日: 2025/08/XX

### デバイス情報
- iPhone/iPad モデル: 
- iOS/iPadOS バージョン: 
- ネットワーク: Wi-Fi / 4G / 5G

### テスト結果

| テスト項目 | 結果 | 備考 |
|-----------|------|------|
| ログイン | ✅/❌ | |
| 接続維持 | ✅/❌ | |
| コマンド実行 | ✅/❌ | |
| 日本語入力 | ✅/❌ | |
| エラー表示 | ✅/❌ | |

### 発見した問題
1. 
2. 

### 改善提案
1. 
2. 
```

## 🚀 PWAとしてインストール

### ホーム画面に追加

1. Safariでアプリを開く
2. 共有ボタンをタップ
3. 「ホーム画面に追加」を選択
4. 名前を設定（例: Claude Remote）
5. 「追加」をタップ

### PWAの利点
- フルスクリーンモード
- オフライン時のフォールバック
- プッシュ通知（将来実装）

## 🔒 セキュリティ注意事項

### 開発環境
- ローカルネットワーク内のみでテスト
- テスト用の認証情報を使用

### 本番環境への移行時
1. HTTPS/WSSの有効化
2. 強力なパスワードへ変更
3. IPアドレス制限の設定
4. VPN経由でのアクセス推奨

## 📝 フィードバック収集

### ユーザビリティ
- タッチ操作の反応性
- 文字入力のしやすさ
- 画面レイアウトの見やすさ

### 機能面
- 必要な機能の不足
- 不要な機能
- 改善提案

### パフォーマンス
- 体感速度
- バッテリー消費
- データ通信量

---

**更新日**: 2025年8月3日  
**バージョン**: 1.0.0