const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('Generating self-signed certificate...');

// OpenSSLコマンドを試す
try {
  // 秘密鍵の生成
  execSync('openssl genrsa -out server.key 2048');
  
  // 証明書署名要求(CSR)の生成
  execSync('openssl req -new -key server.key -out server.csr -subj "/CN=localhost"');
  
  // 自己署名証明書の生成
  execSync('openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.cert');
  
  // CSRファイルを削除
  fs.unlinkSync('server.csr');
  
  console.log('Certificate generated successfully!');
  console.log('- server.key (private key)');
  console.log('- server.cert (certificate)');
} catch (error) {
  console.log('OpenSSL not found. Creating a simple development certificate...');
  
  // 開発用の簡易証明書を作成
  const developmentCert = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUJeoLgswzUgUYhqNFB8fk8XQW0VIwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCSlAxDjAMBgNVBAgMBVRva3lvMQ4wDAYDVQQKDAVDbGF1
ZDEVMBMGA1UEAwwMQ2xhdWRlIFJlbW90ZTAeFw0yNDA4MDMwMDAwMDBaFw0yNTA4
MDMwMDAwMDBaMEUxCzAJBgNVBAYTAkpQMQ4wDAYDVQQIDAVUb2t5bzEOMAwGA1UE
CgwFQ2xhdWRlMRYwFAYDVQQDDA1jbGF1ZGUtcmVtb3RlMIIBIjANBgkqhkiG9w0B
AQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCD
EFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGH
IJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL
MNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP
QRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST
UVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX
YZ1234567890abcdefghijklmnopqrstuvwQIDAQABo1MwUTAdBgNVHQ4EFgQUqwer
tyuityuitywuirtyBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQYMBaAFKsHq7criuty
MA0GCSqGSIb3DQEBCwUAA4IBAQDertyuiotyuioertyuioptyuioertyuiop12345
67890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcde
fghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ==
-----END CERTIFICATE-----`;

  const developmentKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN
OPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQR
STUVWXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV
WXYZ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234
567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12345678
90abcdefghijklmnopqrstuvwQIDAQABAoIBACertyuioptyuiowertyuiop12345
67890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcd
efghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefgh
ijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijkl
mnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ==
-----END RSA PRIVATE KEY-----`;

  console.error('Error: Could not generate proper certificates.');
  console.error('Please install OpenSSL or use the HTTP version instead.');
  process.exit(1);
}