const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = 9003;

app.use(cors());
app.use(express.json());

// Authentication
app.post('/api/login', (req, res) => {
  console.log('Login:', req.body.username);
  if (req.body.username === 'admin' && req.body.password === 'password123') {
    res.json({ token: 'claude-token' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Claude Code Remote Server started on port ${PORT}`);
  console.log('🔐 Login: admin / password123');
  console.log('🤖 Claude Code version: 1.0.67');
  console.log('\n📱 Ready for natural language commands from iPhone!\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('📱 iPhone/iPad connected!');
  let claudeProcess = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'auth') {
      ws.send(JSON.stringify({ type: 'auth', success: true }));
      console.log('✅ Authenticated');
    }
    else if (data.type === 'command') {
      const command = data.text;
      console.log(`\n🗣️ Natural language command: "${command}"`);
      
      // Kill existing Claude process
      if (claudeProcess) {
        claudeProcess.kill();
        claudeProcess = null;
      }

      // Show command being processed
      ws.send(JSON.stringify({ 
        type: 'output', 
        text: `🤖 Claude Code processing: "${command}"\n\n` 
      }));

      // Start Claude Code process
      claudeProcess = spawn('claude', [], {
        shell: true,
        env: { ...process.env }
      });

      // Send command to Claude
      claudeProcess.stdin.write(command + '\n');

      // Handle Claude output
      claudeProcess.stdout.on('data', (output) => {
        const text = output.toString();
        console.log('Claude:', text.substring(0, 50) + '...');
        ws.send(JSON.stringify({ 
          type: 'output', 
          text: text
        }));
      });

      claudeProcess.stderr.on('data', (error) => {
        ws.send(JSON.stringify({ 
          type: 'error', 
          text: error.toString() 
        }));
      });

      claudeProcess.on('close', (code) => {
        console.log('✅ Command completed');
        ws.send(JSON.stringify({ 
          type: 'complete', 
          code: code || 0
        }));
        claudeProcess = null;
      });

      claudeProcess.on('error', (err) => {
        console.error('❌ Error starting Claude:', err.message);
        ws.send(JSON.stringify({ 
          type: 'error', 
          text: 'Failed to start Claude Code: ' + err.message
        }));
      });
    }
    else if (data.type === 'interrupt') {
      if (claudeProcess) {
        console.log('⚠️ Interrupting Claude');
        claudeProcess.kill('SIGINT');
      }
    }
    else if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    }
  });

  ws.on('close', () => {
    console.log('📱 Client disconnected');
    if (claudeProcess) {
      claudeProcess.kill();
    }
  });
});

console.log('Examples of natural language commands:');
console.log('- "Create a Python script that downloads YouTube videos"');
console.log('- "Show me all the JavaScript files in this directory"');
console.log('- "Fix the syntax error in server.js"');
console.log('- "Add a new endpoint to handle file uploads"');