# 📖 用語集（Glossary）

Claude Code Remoteプロジェクトで使用される技術用語と概念の定義集です。

## 🔤 アルファベット順

### A

**API (Application Programming Interface)**
- アプリケーション間の通信インターフェース
- 本プロジェクトでは主にREST APIを使用

**Authentication（認証）**
- ユーザーの身元確認プロセス
- JWT（JSON Web Token）を使用して実装

### B

**bcrypt**
- パスワードハッシュ化ライブラリ
- salt rounds: 10で使用

### C

**Child Process**
- Node.jsの子プロセスモジュール
- Claude Codeプロセスの管理に使用

**Claude Code**
- Anthropic社が開発したAIコーディングアシスタント
- 本プロジェクトの制御対象

**CORS (Cross-Origin Resource Sharing)**
- 異なるオリジン間でのリソース共有を制御
- セキュリティ機能の一つ

### E

**Express**
- Node.js用の軽量Webフレームワーク
- HTTPサーバーの実装に使用

### H

**HTTPS (Hypertext Transfer Protocol Secure)**
- HTTPの暗号化版
- SSL/TLS証明書が必要

### J

**JWT (JSON Web Token)**
- 認証トークンの標準フォーマット
- ヘッダー、ペイロード、署名で構成

### N

**Node.js**
- JavaScriptランタイム環境
- サーバーサイドの実装基盤

### P

**PM2**
- Node.jsアプリケーションのプロセスマネージャー
- 本番環境での運用に推奨

**PWA (Progressive Web App)**
- ネイティブアプリのような機能を持つWebアプリ
- オフライン対応、プッシュ通知などが可能

### R

**React**
- Facebookが開発したUIライブラリ
- コンポーネントベースの設計

**Reconnection（再接続）**
- WebSocket接続が切断された際の自動再接続機能
- exponential backoffアルゴリズムを使用

### S

**Salt**
- パスワードハッシュ化時に追加されるランダムデータ
- レインボーテーブル攻撃を防ぐ

**Session（セッション）**
- クライアントとサーバー間の一連の通信
- WebSocketコネクションの単位

### T

**Terminal Emulation（ターミナルエミュレーション）**
- コマンドライン環境をWebブラウザで再現
- ANSIエスケープシーケンスの処理を含む

**TypeScript**
- JavaScriptの静的型付け版
- 型安全性を提供

### V

**Vite**
- 高速なフロントエンドビルドツール
- HMR（Hot Module Replacement）をサポート

### W

**WebSocket**
- 双方向リアルタイム通信プロトコル
- HTTPアップグレードで確立

**WSS (WebSocket Secure)**
- WebSocketの暗号化版
- TLS/SSLを使用

### Z

**Zustand**
- 軽量な状態管理ライブラリ
- Reactアプリケーションで使用

## 🏗️ プロジェクト固有の用語

### コンポーネント名

**Login**
- 認証画面コンポーネント
- ユーザー名とパスワードの入力を処理

**Terminal**
- コマンド出力を表示するコンポーネント
- ターミナルエミュレーション機能を提供

**CommandInput**
- コマンド入力コンポーネント
- クイックコマンドボタンを含む

**StatusBar**
- 接続状態を表示するコンポーネント
- WebSocketの状態を監視

### 設定・環境

**JWT_SECRET**
- JWTトークン署名用の秘密鍵
- 環境変数で管理

**CLAUDE_CODE_PATH**
- Claude Codeコマンドのパス
- デフォルト: `claude-code`

### プロセス状態

**authenticated**
- 認証済み状態
- WebSocket通信の前提条件

**wsStatus**
- WebSocket接続状態
- disconnected | connecting | connected | error

## 📝 略語一覧

| 略語 | 正式名称 | 説明 |
|------|----------|------|
| API | Application Programming Interface | アプリケーション間通信 |
| CORS | Cross-Origin Resource Sharing | オリジン間リソース共有 |
| HMR | Hot Module Replacement | ホットリロード機能 |
| HTTP | Hypertext Transfer Protocol | Web通信プロトコル |
| HTTPS | HTTP Secure | 暗号化されたHTTP |
| JWT | JSON Web Token | 認証トークン |
| PWA | Progressive Web App | 進歩的Webアプリ |
| SSL | Secure Sockets Layer | 暗号化プロトコル |
| TLS | Transport Layer Security | SSLの後継 |
| UI | User Interface | ユーザーインターフェース |
| URL | Uniform Resource Locator | リソースの場所 |
| WS | WebSocket | 双方向通信プロトコル |
| WSS | WebSocket Secure | 暗号化WebSocket |

## 🔗 関連用語の相関

```
Claude Code Remote
    ├── Backend (Node.js)
    │   ├── Express (HTTPサーバー)
    │   ├── WebSocket (リアルタイム通信)
    │   ├── JWT (認証)
    │   └── Child Process (Claude Code制御)
    └── Frontend (React)
        ├── TypeScript (型安全性)
        ├── Vite (ビルド)
        ├── Zustand (状態管理)
        └── PWA (モバイル対応)
```

---
最終更新: 2025年8月3日