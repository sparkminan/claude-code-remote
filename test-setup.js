const http = require('http');
const https = require('https');
const WebSocket = require('ws');

console.log('🧪 Claude Code Remote Test Suite\n');

// テスト設定
const HTTP_PORT = 8090;
const HTTPS_PORT = 8443;
const HOST = 'localhost';

// 1. HTTPサーバーのテスト
async function testHttpServer() {
  console.log('1️⃣  Testing HTTP Server...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: HTTP_PORT,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'ok') {
            console.log('✅ HTTP Server is running');
            console.log(`   Response: ${JSON.stringify(json)}`);
          } else {
            console.log('❌ HTTP Server returned unexpected response');
          }
        } catch (e) {
          console.log('❌ HTTP Server error:', e.message);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('❌ HTTP Server is not running');
      console.log(`   Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

// 2. 認証テスト
async function testAuthentication() {
  console.log('\n2️⃣  Testing Authentication...');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      username: 'admin',
      password: 'password123'
    });

    const options = {
      hostname: HOST,
      port: HTTP_PORT,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.token) {
            console.log('✅ Authentication successful');
            console.log(`   Token received: ${json.token.substring(0, 20)}...`);
            global.authToken = json.token;
          } else {
            console.log('❌ Authentication failed');
            console.log(`   Response: ${data}`);
          }
        } catch (e) {
          console.log('❌ Authentication error:', e.message);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('❌ Authentication request failed:', err.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// 3. WebSocket接続テスト
async function testWebSocket() {
  console.log('\n3️⃣  Testing WebSocket Connection...');
  
  if (!global.authToken) {
    console.log('⚠️  Skipping WebSocket test (no auth token)');
    return;
  }

  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://${HOST}:${HTTP_PORT}/ws`);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // 認証
      ws.send(JSON.stringify({
        type: 'auth',
        token: global.authToken
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        console.log(`📨 Received: ${JSON.stringify(msg)}`);
        
        if (msg.type === 'auth' && msg.status === 'success') {
          console.log('✅ WebSocket authentication successful');
          
          // テストコマンドを送信
          ws.send(JSON.stringify({
            type: 'command',
            text: 'echo "Hello from Claude Code Remote!"'
          }));
          
          setTimeout(() => {
            ws.close();
            resolve();
          }, 2000);
        }
      } catch (e) {
        console.log('❌ WebSocket message error:', e.message);
      }
    });

    ws.on('error', (err) => {
      console.log('❌ WebSocket error:', err.message);
      resolve();
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket disconnected');
    });

    setTimeout(() => {
      ws.close();
      resolve();
    }, 5000);
  });
}

// 4. HTTPSサーバーのテスト
async function testHttpsServer() {
  console.log('\n4️⃣  Testing HTTPS Server...');
  
  // 自己署名証明書を無視
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: HTTPS_PORT,
      path: '/health',
      method: 'GET',
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'ok' && json.https === 'enabled') {
            console.log('✅ HTTPS Server is running');
            console.log(`   Response: ${JSON.stringify(json)}`);
          } else {
            console.log('❌ HTTPS Server returned unexpected response');
          }
        } catch (e) {
          console.log('❌ HTTPS Server response error:', e.message);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('⚠️  HTTPS Server is not running (this is okay if using HTTP only)');
      console.log(`   Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

// テスト実行
async function runTests() {
  console.log(`Testing servers at ${HOST}...\n`);
  
  await testHttpServer();
  await testAuthentication();
  await testWebSocket();
  await testHttpsServer();
  
  console.log('\n✅ Test suite completed!');
  console.log('\n📋 Summary:');
  console.log('- Run the server with: npm start (HTTP) or npm run start:https (HTTPS)');
  console.log('- Run the client with: npm run dev');
  console.log(`- Access from iPhone: http://${HOST}:3000`);
  
  process.exit(0);
}

// エラーハンドリング
process.on('unhandledRejection', (err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

// テスト開始
runTests();