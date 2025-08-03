const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { config, validateConfig, logConfig } = require('./config');

// Validate configuration on startup
if (!validateConfig()) {
  console.warn('Configuration validation failed. Check the errors above.');
}

// Log configuration
logConfig();

const app = express();

// CORS configuration
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));
app.use(express.json());

// User database (in production, this should be a real database)
const users = [
  {
    id: 1,
    username: config.defaultUsername,
    passwordHash: config.defaultPasswordHash
  }
];

// Logging utility
const log = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
  
  // Append to log file if configured
  if (config.logFile && config.logLevel !== 'none') {
    fs.appendFileSync(config.logFile, JSON.stringify(logEntry) + '\n');
  }
};

// Authentication endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  log('info', 'Login attempt', { username });
  
  const user = users.find(u => u.username === username);
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    log('warn', 'Failed login attempt', { username });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username }, 
    config.jwtSecret, 
    { expiresIn: config.jwtExpiry }
  );
  
  log('info', 'Successful login', { username });
  res.json({ token });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    environment: config.nodeEnv,
    ssl: config.enableSsl
  });
});

// Server startup
const server = app.listen(config.port, config.host, () => {
  log('info', `Server running on ${config.host}:${config.port}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Token verification
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

// Command validation
const isCommandAllowed = (command) => {
  // Extract the base command (first word)
  const baseCommand = command.trim().split(' ')[0].toLowerCase();
  
  // Check whitelist if enabled
  if (config.enableCommandWhitelist) {
    const allowed = config.commandWhitelist.some(cmd => 
      baseCommand === cmd.toLowerCase()
    );
    if (!allowed) {
      log('warn', 'Command blocked by whitelist', { command });
      return false;
    }
  }
  
  // Check blacklist if enabled
  if (config.enableCommandBlacklist) {
    const blocked = config.commandBlacklist.some(cmd => 
      baseCommand === cmd.toLowerCase()
    );
    if (blocked) {
      log('warn', 'Command blocked by blacklist', { command });
      return false;
    }
  }
  
  return true;
};

// Active connections tracking
const connections = new Map();

wss.on('connection', (ws, req) => {
  let authenticated = false;
  let claudeProcess = null;
  let userId = null;
  let connectionId = Date.now().toString();
  let outputBuffer = '';
  
  log('info', 'New WebSocket connection', { connectionId });
  
  // Connection timeout
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.send(JSON.stringify({ type: 'error', text: 'Authentication timeout' }));
      ws.close();
    }
  }, 10000); // 10 seconds to authenticate
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle authentication
      if (data.type === 'auth') {
        const payload = verifyToken(data.token);
        if (payload) {
          authenticated = true;
          userId = payload.userId;
          clearTimeout(authTimeout);
          
          connections.set(connectionId, {
            ws,
            userId,
            connectedAt: new Date()
          });
          
          ws.send(JSON.stringify({ type: 'auth', success: true }));
          log('info', 'WebSocket authenticated', { connectionId, userId });
        } else {
          ws.send(JSON.stringify({ type: 'auth', success: false }));
          ws.close();
        }
      }
      
      // Handle commands (only if authenticated)
      else if (data.type === 'command' && authenticated) {
        const commandText = data.text;
        
        log('info', 'Command received', { connectionId, command: commandText });
        
        // Validate command
        if (!isCommandAllowed(commandText)) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            text: 'Command not allowed. Please check with your administrator.' 
          }));
          return;
        }
        
        // Kill existing process if any
        if (claudeProcess) {
          claudeProcess.kill();
          claudeProcess = null;
        }
        
        // Clear output buffer
        outputBuffer = '';
        
        // Start new Claude Code process
        claudeProcess = spawn(config.claudeCodePath, [...config.claudeCodeArgs], {
          shell: true,
          env: { ...process.env }
        });
        
        // Send command to Claude Code
        claudeProcess.stdin.write(commandText + '\n');
        
        // Handle process output
        claudeProcess.stdout.on('data', (data) => {
          const output = data.toString();
          outputBuffer += output;
          
          // Check buffer size limit
          if (outputBuffer.length > config.maxOutputBufferSize) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              text: 'Output buffer size exceeded. Command terminated.' 
            }));
            claudeProcess.kill();
            outputBuffer = '';
            return;
          }
          
          ws.send(JSON.stringify({ type: 'output', text: output }));
        });
        
        claudeProcess.stderr.on('data', (data) => {
          ws.send(JSON.stringify({ type: 'error', text: data.toString() }));
        });
        
        claudeProcess.on('close', (code) => {
          ws.send(JSON.stringify({ type: 'complete', code }));
          claudeProcess = null;
          outputBuffer = '';
          log('info', 'Command completed', { connectionId, code });
        });
        
        // Set process timeout
        setTimeout(() => {
          if (claudeProcess) {
            claudeProcess.kill();
            ws.send(JSON.stringify({ 
              type: 'error', 
              text: 'Command timeout exceeded' 
            }));
            log('warn', 'Command timeout', { connectionId, command: commandText });
          }
        }, config.processTimeout);
      }
      
      // Handle ping/pong for connection keep-alive
      else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
      
    } catch (error) {
      log('error', 'WebSocket message error', { connectionId, error: error.message });
      ws.send(JSON.stringify({ type: 'error', text: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    if (claudeProcess) {
      claudeProcess.kill();
    }
    connections.delete(connectionId);
    log('info', 'WebSocket connection closed', { connectionId });
  });
  
  ws.on('error', (error) => {
    log('error', 'WebSocket error', { connectionId, error: error.message });
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down gracefully');
  
  // Close all WebSocket connections
  connections.forEach(({ ws }) => {
    ws.send(JSON.stringify({ type: 'error', text: 'Server shutting down' }));
    ws.close();
  });
  
  wss.close(() => {
    server.close(() => {
      log('info', 'Server shut down');
      process.exit(0);
    });
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled rejection', { reason, promise });
});

module.exports = { app, server, wss };