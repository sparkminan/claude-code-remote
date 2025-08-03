const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const cors = require('cors');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8090;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;

app.use(cors());
app.use(express.json());

const users = [
  {
    id: 1,
    username: 'admin',
    passwordHash: '$2b$10$g5X4osqbn8I14WLd2J.QseAJYzmRFqRW.d/3b28hc7SLpxbIVO1fq'
  }
];

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// HTTPSサーバーの設定
let server;
let httpsServer;

try {
  // HTTPS証明書の確認
  if (fs.existsSync('server.cert') && fs.existsSync('server.key')) {
    const httpsOptions = {
      cert: fs.readFileSync('server.cert'),
      key: fs.readFileSync('server.key')
    };
    
    httpsServer = https.createServer(httpsOptions, app);
    console.log('HTTPS certificate found, starting HTTPS server...');
  } else {
    console.log('HTTPS certificate not found. Run generate-cert.ps1 to create one.');
  }
} catch (err) {
  console.error('Error loading HTTPS certificates:', err.message);
}

// HTTPサーバー（HTTPSへのリダイレクト用）
server = http.createServer((req, res) => {
  if (httpsServer) {
    // HTTPSが有効な場合はリダイレクト
    const httpsUrl = `https://${req.headers.host.split(':')[0]}:${HTTPS_PORT}${req.url}`;
    res.writeHead(301, { Location: httpsUrl });
    res.end();
  } else {
    // HTTPSが無効な場合は通常のHTTPサーバーとして動作
    app(req, res);
  }
});

// WebSocketサーバーの設定
const wss = new WebSocket.Server({ 
  server: httpsServer || server,
  path: '/ws'
});

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Keep-alive設定
const PING_INTERVAL = 30000; // 30秒

wss.on('connection', (ws, req) => {
  let authenticated = false;
  let claudeProcess = null;
  
  // Keep-aliveピング
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, PING_INTERVAL);

  ws.on('pong', () => {
    // クライアントからのpong応答を受信
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'auth') {
        const decoded = verifyToken(data.token);
        if (decoded) {
          authenticated = true;
          ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
        } else {
          ws.send(JSON.stringify({ type: 'auth', status: 'failed' }));
          ws.close();
        }
        return;
      }

      if (!authenticated) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
        ws.close();
        return;
      }

      switch (data.type) {
        case 'command':
          if (claudeProcess) {
            claudeProcess.stdin.write(data.text + '\n');
          } else {
            // Windows環境での文字エンコーディング対応
            claudeProcess = spawn(process.env.CLAUDE_CODE_PATH || 'claude-code', [], {
              shell: true,
              env: { 
                ...process.env,
                PYTHONIOENCODING: 'utf-8',
                LANG: 'ja_JP.UTF-8'
              },
              windowsHide: true
            });

            // エンコーディングを設定
            claudeProcess.stdout.setEncoding('utf8');
            claudeProcess.stderr.setEncoding('utf8');

            claudeProcess.stdout.on('data', (output) => {
              ws.send(JSON.stringify({ 
                type: 'output', 
                text: output.toString() 
              }));
            });

            claudeProcess.stderr.on('data', (error) => {
              ws.send(JSON.stringify({ 
                type: 'error', 
                text: error.toString() 
              }));
            });

            claudeProcess.on('error', (err) => {
              console.error('Process error:', err);
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: `Failed to start Claude Code: ${err.message}` 
              }));
            });

            claudeProcess.on('close', (code) => {
              ws.send(JSON.stringify({ 
                type: 'processEnd', 
                code 
              }));
              claudeProcess = null;
            });

            setTimeout(() => {
              if (claudeProcess && claudeProcess.stdin.writable) {
                claudeProcess.stdin.write(data.text + '\n');
              }
            }, 1000);
          }
          break;

        case 'interrupt':
          if (claudeProcess) {
            claudeProcess.kill('SIGINT');
          }
          break;

        case 'close':
          if (claudeProcess) {
            claudeProcess.kill();
            claudeProcess = null;
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  });

  ws.on('close', () => {
    clearInterval(pingInterval);
    if (claudeProcess) {
      claudeProcess.kill();
      claudeProcess = null;
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket connection error:', error);
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    https: httpsServer ? 'enabled' : 'disabled',
    version: '1.0.0'
  });
});

// グレースフルシャットダウン
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('\nShutting down gracefully...');
  
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ 
      type: 'error', 
      message: 'Server shutting down' 
    }));
    client.close();
  });
  
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  if (httpsServer) {
    httpsServer.close(() => {
      console.log('HTTPS server closed');
    });
  }
  
  process.exit(0);
}

// サーバー起動
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server running on port ${PORT}`);
  if (httpsServer) {
    console.log(`(Redirecting to HTTPS on port ${HTTPS_PORT})`);
  }
});

if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`HTTPS server running on port ${HTTPS_PORT}`);
  });
}