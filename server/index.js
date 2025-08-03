const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

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

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ server });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

wss.on('connection', (ws, req) => {
  let authenticated = false;
  let claudeProcess = null;

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
            claudeProcess = spawn(process.env.CLAUDE_CODE_PATH || 'claude-code', [], {
              shell: true,
              env: { ...process.env }
            });

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

            claudeProcess.on('close', (code) => {
              ws.send(JSON.stringify({ 
                type: 'processEnd', 
                code 
              }));
              claudeProcess = null;
            });

            setTimeout(() => {
              claudeProcess.stdin.write(data.text + '\n');
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
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message 
      }));
    }
  });

  ws.on('close', () => {
    if (claudeProcess) {
      claudeProcess.kill();
      claudeProcess = null;
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});