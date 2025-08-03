const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 9002;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Test user with password: password123
const passwordHash = '$2b$10$RD.54eT3qd8EAbTQLnRh.OwUut0CPClFb493raH/ZrQLeSeTeVepO';

// Routes
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.post('/api/login', async (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  
  if (username === 'admin' && await bcrypt.compare(password, passwordHash)) {
    const token = jwt.sign(
      { userId: 1, username }, 
      process.env.JWT_SECRET || 'test-secret', 
      { expiresIn: '24h' }
    );
    console.log('Login successful');
    res.json({ token });
  } else {
    console.log('Login failed');
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Start server with WebSocket support
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  POST http://localhost:${PORT}/api/login`);
  console.log('Credentials: admin / password123');
});

// WebSocket server
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message:', data);
      
      if (data.type === 'auth') {
        // Simple token verification
        if (data.token) {
          ws.send(JSON.stringify({ type: 'auth', success: true }));
          console.log('WebSocket authenticated');
        } else {
          ws.send(JSON.stringify({ type: 'auth', success: false }));
        }
      } else if (data.type === 'command') {
        // Echo the command for testing
        ws.send(JSON.stringify({ 
          type: 'output', 
          text: `Received command: ${data.text}\n` 
        }));
        
        // Simulate command completion
        setTimeout(() => {
          ws.send(JSON.stringify({ 
            type: 'complete', 
            code: 0 
          }));
        }, 1000);
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ type: 'error', text: error.message }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`WebSocket server ready on ws://localhost:${PORT}`);