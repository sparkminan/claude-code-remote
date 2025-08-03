const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('SSL Certificate Generator for Claude Code Remote');
console.log('================================================\n');

const certDir = path.join(__dirname, 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
  console.log('✓ Created certs directory');
}

// Default configuration
const defaultConfig = {
  country: 'JP',
  state: 'Tokyo',
  city: 'Tokyo',
  organization: 'Claude Code Remote',
  organizationalUnit: 'IT Department',
  commonName: 'localhost',
  email: 'admin@localhost',
  days: 365
};

// Collect certificate information
function collectCertInfo() {
  return new Promise((resolve) => {
    console.log('Certificate Information:');
    console.log('(Press Enter to use default values)\n');
    
    const config = { ...defaultConfig };
    const questions = [
      ['Country (2 letter code)', 'country'],
      ['State or Province', 'state'],
      ['City', 'city'],
      ['Organization', 'organization'],
      ['Organizational Unit', 'organizationalUnit'],
      ['Common Name (server hostname)', 'commonName'],
      ['Email Address', 'email'],
      ['Certificate validity (days)', 'days']
    ];
    
    let currentQuestion = 0;
    
    function askNext() {
      if (currentQuestion >= questions.length) {
        resolve(config);
        return;
      }
      
      const [prompt, key] = questions[currentQuestion];
      rl.question(`${prompt} [${config[key]}]: `, (answer) => {
        if (answer.trim()) {
          config[key] = answer.trim();
        }
        currentQuestion++;
        askNext();
      });
    }
    
    askNext();
  });
}

// Generate self-signed certificate
function generateCertificate(config) {
  const keyPath = path.join(certDir, 'server.key');
  const certPath = path.join(certDir, 'server.crt');
  
  console.log('\n🔐 Generating SSL certificate...\n');
  
  try {
    // Generate private key
    console.log('1. Generating private key...');
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Create certificate request
    const subject = `/C=${config.country}/ST=${config.state}/L=${config.city}/O=${config.organization}/OU=${config.organizationalUnit}/CN=${config.commonName}/emailAddress=${config.email}`;
    
    console.log('2. Creating certificate signing request...');
    const csrPath = path.join(certDir, 'server.csr');
    execSync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "${subject}"`, { stdio: 'inherit' });
    
    // Generate self-signed certificate
    console.log('3. Generating self-signed certificate...');
    execSync(`openssl x509 -req -days ${config.days} -in "${csrPath}" -signkey "${keyPath}" -out "${certPath}"`, { stdio: 'inherit' });
    
    // Clean up CSR file
    fs.unlinkSync(csrPath);
    
    console.log('\n✅ SSL certificate generated successfully!\n');
    console.log('Files created:');
    console.log(`  Private Key: ${keyPath}`);
    console.log(`  Certificate: ${certPath}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file:');
    console.log('   ENABLE_SSL=true');
    console.log(`   SSL_KEY_PATH=${keyPath}`);
    console.log(`   SSL_CERT_PATH=${certPath}`);
    console.log('\n2. Start the secure server:');
    console.log('   npm run start:secure');
    console.log('\n3. Access your application at:');
    console.log(`   https://${config.commonName}:8080`);
    
    console.log('\n⚠️  Security Note:');
    console.log('This is a self-signed certificate. Browsers will show a security warning.');
    console.log('For production use, obtain a certificate from a trusted CA.');
    
    // Display certificate information
    console.log('\n📋 Certificate Information:');
    try {
      const certInfo = execSync(`openssl x509 -in "${certPath}" -text -noout`, { encoding: 'utf8' });
      const lines = certInfo.split('\n');
      const importantLines = lines.filter(line => 
        line.includes('Subject:') || 
        line.includes('Not Before:') || 
        line.includes('Not After:') ||
        line.includes('DNS:') ||
        line.includes('IP:')
      );
      importantLines.forEach(line => console.log(`   ${line.trim()}`));
    } catch (error) {
      console.log('   Unable to display certificate details');
    }
    
  } catch (error) {
    console.error('\n❌ Error generating certificate:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure OpenSSL is installed and in your PATH');
    console.log('2. On Windows, you might need to install OpenSSL from:');
    console.log('   https://slproweb.com/products/Win32OpenSSL.html');
    console.log('3. Or use Git Bash which includes OpenSSL');
    process.exit(1);
  }
}

// Check if OpenSSL is available
function checkOpenSSL() {
  try {
    execSync('openssl version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  if (!checkOpenSSL()) {
    console.error('❌ OpenSSL not found in PATH');
    console.log('\n🔧 Installation instructions:');
    console.log('Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
    console.log('macOS: brew install openssl');
    console.log('Linux: sudo apt-get install openssl (Ubuntu/Debian)');
    console.log('       sudo yum install openssl (CentOS/RHEL)');
    process.exit(1);
  }
  
  // Check if certificate already exists
  const keyPath = path.join(certDir, 'server.key');
  const certPath = path.join(certDir, 'server.crt');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('⚠️  SSL certificate already exists.');
    const answer = await new Promise(resolve => {
      rl.question('Do you want to regenerate it? (y/N): ', resolve);
    });
    
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Certificate generation cancelled.');
      rl.close();
      return;
    }
  }
  
  const config = await collectCertInfo();
  rl.close();
  
  generateCertificate(config);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});