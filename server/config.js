const path = require('path');
require('dotenv').config();

// Default configuration values
const defaults = {
  // Server
  port: 8080,
  host: '0.0.0.0',
  wsPort: 8090,
  
  // Security
  jwtSecret: 'change-this-secret-in-production',
  jwtExpiry: '24h',
  
  // Authentication
  defaultUsername: 'admin',
  defaultPasswordHash: '$2b$10$g5X4osqbn8I14WLd2J.QseAJYzmRFqRW.d/3b28hc7SLpxbIVO1fq',
  
  // Claude Code
  claudeCodePath: 'claude-code',
  claudeCodeArgs: '',
  
  // Process Management
  processTimeout: 300000, // 5 minutes
  maxOutputBufferSize: 1048576, // 1MB
  
  // Logging
  logLevel: 'info',
  logFile: 'claude-code-remote.log',
  
  // CORS
  allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
  
  // Command Restrictions
  enableCommandWhitelist: false,
  commandWhitelist: ['ls', 'dir', 'pwd', 'echo', 'help'],
  enableCommandBlacklist: true,
  commandBlacklist: ['rm', 'del', 'format', 'shutdown', 'reboot'],
  
  // SSL/TLS
  enableSsl: false,
  sslCertPath: './certs/server.crt',
  sslKeyPath: './certs/server.key',
  
  // Environment
  nodeEnv: 'development'
};

// Parse environment variables with validation
const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || defaults.port,
  host: process.env.HOST || defaults.host,
  wsPort: parseInt(process.env.WS_PORT, 10) || defaults.wsPort,
  
  // Security
  jwtSecret: process.env.JWT_SECRET || defaults.jwtSecret,
  jwtExpiry: process.env.JWT_EXPIRY || defaults.jwtExpiry,
  
  // Authentication
  defaultUsername: process.env.DEFAULT_USERNAME || defaults.defaultUsername,
  defaultPasswordHash: process.env.DEFAULT_PASSWORD_HASH || defaults.defaultPasswordHash,
  
  // Claude Code
  claudeCodePath: process.env.CLAUDE_CODE_PATH || defaults.claudeCodePath,
  claudeCodeArgs: process.env.CLAUDE_CODE_ARGS ? process.env.CLAUDE_CODE_ARGS.split(' ') : [],
  
  // Process Management
  processTimeout: parseInt(process.env.PROCESS_TIMEOUT, 10) || defaults.processTimeout,
  maxOutputBufferSize: parseInt(process.env.MAX_OUTPUT_BUFFER_SIZE, 10) || defaults.maxOutputBufferSize,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || defaults.logLevel,
  logFile: process.env.LOG_FILE || defaults.logFile,
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : defaults.allowedOrigins,
  
  // Command Restrictions
  enableCommandWhitelist: process.env.ENABLE_COMMAND_WHITELIST === 'true',
  commandWhitelist: process.env.COMMAND_WHITELIST
    ? process.env.COMMAND_WHITELIST.split(',').map(cmd => cmd.trim())
    : defaults.commandWhitelist,
  enableCommandBlacklist: process.env.ENABLE_COMMAND_BLACKLIST !== 'false',
  commandBlacklist: process.env.COMMAND_BLACKLIST
    ? process.env.COMMAND_BLACKLIST.split(',').map(cmd => cmd.trim())
    : defaults.commandBlacklist,
  
  // SSL/TLS
  enableSsl: process.env.ENABLE_SSL === 'true',
  sslCertPath: process.env.SSL_CERT_PATH || defaults.sslCertPath,
  sslKeyPath: process.env.SSL_KEY_PATH || defaults.sslKeyPath,
  
  // Environment
  nodeEnv: process.env.NODE_ENV || defaults.nodeEnv,
  
  // Computed values
  isDevelopment: (process.env.NODE_ENV || defaults.nodeEnv) === 'development',
  isProduction: (process.env.NODE_ENV || defaults.nodeEnv) === 'production'
};

// Validate configuration
function validateConfig() {
  const errors = [];
  
  if (config.port < 1 || config.port > 65535) {
    errors.push(`Invalid PORT: ${config.port}. Must be between 1 and 65535.`);
  }
  
  if (config.wsPort < 1 || config.wsPort > 65535) {
    errors.push(`Invalid WS_PORT: ${config.wsPort}. Must be between 1 and 65535.`);
  }
  
  if (config.jwtSecret === defaults.jwtSecret && config.isProduction) {
    errors.push('JWT_SECRET must be changed in production environment!');
  }
  
  if (config.enableSsl) {
    const fs = require('fs');
    if (!fs.existsSync(config.sslCertPath)) {
      errors.push(`SSL certificate not found at: ${config.sslCertPath}`);
    }
    if (!fs.existsSync(config.sslKeyPath)) {
      errors.push(`SSL key not found at: ${config.sslKeyPath}`);
    }
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    if (config.isProduction) {
      process.exit(1);
    }
  }
  
  return errors.length === 0;
}

// Log configuration (hide sensitive values)
function logConfig() {
  console.log('Configuration loaded:');
  console.log('  Server:');
  console.log(`    - Port: ${config.port}`);
  console.log(`    - Host: ${config.host}`);
  console.log(`    - WebSocket Port: ${config.wsPort}`);
  console.log('  Security:');
  console.log(`    - JWT Secret: ${config.jwtSecret === defaults.jwtSecret ? '[DEFAULT - CHANGE IN PRODUCTION]' : '[CUSTOM]'}`);
  console.log(`    - JWT Expiry: ${config.jwtExpiry}`);
  console.log(`    - SSL Enabled: ${config.enableSsl}`);
  console.log('  Command Restrictions:');
  console.log(`    - Whitelist Enabled: ${config.enableCommandWhitelist}`);
  console.log(`    - Blacklist Enabled: ${config.enableCommandBlacklist}`);
  console.log('  Environment:');
  console.log(`    - NODE_ENV: ${config.nodeEnv}`);
}

// Export configuration
module.exports = {
  config,
  validateConfig,
  logConfig
};