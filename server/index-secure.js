const express = require('express');
const https = require('https');
const WebSocket = require('ws');
const cors = require('cors');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { config, validateConfig, logConfig } = require('./config');
const { bufferToUtf8, cleanTerminalOutput, getSpawnOptions } = require('./utils/encoding-helper');

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
    try {
      fs.appendFileSync(config.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
};

// SSL Certificate loading
let sslOptions = null;
if (config.enableSsl) {
  try {
    sslOptions = {
      key: fs.readFileSync(config.sslKeyPath),
      cert: fs.readFileSync(config.sslCertPath),
      // Additional SSL options for security
      secureProtocol: 'TLSv1_2_method',
      ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384'
      ].join(':'),
      honorCipherOrder: true
    };
    log('info', 'SSL certificates loaded successfully');
  } catch (error) {
    log('error', 'Failed to load SSL certificates', { error: error.message });
    console.error('SSL Error: Please ensure certificates exist and are readable.');
    if (config.isProduction) {
      process.exit(1);
    }
  }
}

// Security headers middleware
app.use((req, res, next) => {
  // HTTPS redirect in production
  if (config.enableSsl && config.isProduction && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (config.enableSsl) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// Authentication endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  log('info', 'Login attempt', { username, ip: req.ip });
  
  const user = users.find(u => u.username === username);
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    log('warn', 'Failed login attempt', { username, ip: req.ip });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username }, 
    config.jwtSecret, 
    { expiresIn: config.jwtExpiry }
  );
  
  log('info', 'Successful login', { username, ip: req.ip });
  res.json({ token });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    environment: config.nodeEnv,
    ssl: config.enableSsl,
    timestamp: new Date().toISOString()
  });
});

// Server startup
let server;
if (config.enableSsl && sslOptions) {
  server = https.createServer(sslOptions, app);
  log('info', `HTTPS server starting on ${config.host}:${config.port}`);
} else {
  server = app.listen(config.port, config.host);
  log('info', `HTTP server starting on ${config.host}:${config.port}`);
  
  if (config.isProduction) {
    log('warn', 'Running HTTP server in production. Consider enabling SSL.');
  }
}

server.listen(config.port, config.host, () => {
  const protocol = config.enableSsl ? 'https' : 'http';
  log('info', `Server running on ${protocol}://${config.host}:${config.port}`);
});

// WebSocket server with SSL support
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info) => {
    // Additional WebSocket connection verification can be added here
    log('debug', 'WebSocket connection attempt', { origin: info.origin });
    return true;
  }
});

// Token verification
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    log('debug', 'Token verification failed', { error: error.message });
    return null;
  }
};

// Command validation
const isCommandAllowed = (command) => {
  const baseCommand = command.trim().split(' ')[0].toLowerCase();
  
  if (config.enableCommandWhitelist) {
    const allowed = config.commandWhitelist.some(cmd => 
      baseCommand === cmd.toLowerCase()
    );
    if (!allowed) {
      log('warn', 'Command blocked by whitelist', { command: baseCommand });
      return false;
    }
  }
  
  if (config.enableCommandBlacklist) {
    const blocked = config.commandBlacklist.some(cmd => 
      baseCommand === cmd.toLowerCase()
    );
    if (blocked) {
      log('warn', 'Command blocked by blacklist', { command: baseCommand });
      return false;
    }
  }
  
  return true;
};

// Active connections tracking
const connections = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  let authenticated = false;
  let claudeProcess = null;
  let userId = null;
  let connectionId = Date.now().toString();
  let outputBuffer = '';
  const clientIp = req.connection.remoteAddress;
  
  log('info', 'New WebSocket connection', { connectionId, ip: clientIp });
  
  // Connection timeout for authentication
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.send(JSON.stringify({ type: 'error', text: 'Authentication timeout' }));
      ws.close(1008, 'Authentication timeout');
    }
  }, 10000);
  
  // Rate limiting for commands (simple implementation)
  let commandCount = 0;
  let commandResetTime = Date.now();
  const maxCommandsPerMinute = 30;
  
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
            connectedAt: new Date(),
            ip: clientIp
          });
          
          ws.send(JSON.stringify({ type: 'auth', success: true }));
          log('info', 'WebSocket authenticated', { connectionId, userId, ip: clientIp });
        } else {
          ws.send(JSON.stringify({ type: 'auth', success: false }));
          ws.close(1008, 'Authentication failed');
        }
      }
      
      // Handle commands (only if authenticated)
      else if (data.type === 'command' && authenticated) {
        // Rate limiting check
        const now = Date.now();
        if (now - commandResetTime > 60000) { // Reset every minute
          commandCount = 0;
          commandResetTime = now;
        }
        
        if (commandCount >= maxCommandsPerMinute) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            text: 'Rate limit exceeded. Please wait before sending more commands.' 
          }));
          return;
        }
        
        commandCount++;
        
        const commandText = data.text;
        log('info', 'Command received', { connectionId, command: commandText, ip: clientIp });
        
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
        claudeProcess = spawn(config.claudeCodePath, [...config.claudeCodeArgs], 
          getSpawnOptions({
            stdio: ['pipe', 'pipe', 'pipe']
          })
        );
        
        // Send command to Claude Code
        claudeProcess.stdin.write(commandText + '\n');
        
        // Handle process output with proper encoding
        claudeProcess.stdout.on('data', (data) => {
          const output = cleanTerminalOutput(bufferToUtf8(data));
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
          const errorOutput = cleanTerminalOutput(bufferToUtf8(data));
          ws.send(JSON.stringify({ type: 'error', text: errorOutput }));
        });
        
        claudeProcess.on('close', (code) => {
          ws.send(JSON.stringify({ type: 'complete', code }));
          claudeProcess = null;
          outputBuffer = '';
          log('info', 'Command completed', { connectionId, code, ip: clientIp });
        });
        
        // Set process timeout
        setTimeout(() => {
          if (claudeProcess) {
            claudeProcess.kill();
            ws.send(JSON.stringify({ 
              type: 'error', 
              text: 'Command timeout exceeded' 
            }));
            log('warn', 'Command timeout', { connectionId, command: commandText, ip: clientIp });
          }
        }, config.processTimeout);
      }
      
      // Handle ping/pong for connection keep-alive
      else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
      
    } catch (error) {
      log('error', 'WebSocket message error', { connectionId, error: error.message, ip: clientIp });
      ws.send(JSON.stringify({ type: 'error', text: 'Invalid message format' }));
    }
  });
  
  ws.on('close', (code, reason) => {
    if (claudeProcess) {
      claudeProcess.kill();
    }
    connections.delete(connectionId);
    log('info', 'WebSocket connection closed', { connectionId, code, reason: reason?.toString(), ip: clientIp });
  });
  
  ws.on('error', (error) => {
    log('error', 'WebSocket error', { connectionId, error: error.message, ip: clientIp });
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  log('info', `${signal} received, shutting down gracefully`);
  
  // Close all WebSocket connections
  connections.forEach(({ ws }) => {
    ws.send(JSON.stringify({ type: 'error', text: 'Server shutting down' }));
    ws.close(1001, 'Server shutdown');
  });
  
  wss.close(() => {
    server.close(() => {
      log('info', 'Server shut down');
      process.exit(0);
    });
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    log('error', 'Force exit due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled rejection', { reason: reason?.toString() });
});

module.exports = { app, server, wss };