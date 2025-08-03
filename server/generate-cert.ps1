# HTTPS用の自己署名証明書生成スクリプト

Write-Host "Generating self-signed certificate for HTTPS..." -ForegroundColor Cyan

# 証明書の有効期限（日数）
$days = 365

# 証明書を生成
try {
    $cert = New-SelfSignedCertificate `
        -DnsName @("localhost", "192.168.0.1", "192.168.1.1", "*.local") `
        -Subject "CN=localhost" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddDays($days) `
        -KeyUsage DigitalSignature, KeyEncipherment `
        -FriendlyName "Claude Remote HTTPS Certificate"
} catch {
    Write-Host "Error creating certificate: $_" -ForegroundColor Red
    exit 1
}

# 証明書をエクスポート
$pwd = ConvertTo-SecureString -String "claude-remote" -Force -AsPlainText

# PFX形式でエクスポート
Export-PfxCertificate `
    -Cert $cert `
    -FilePath ".\server.pfx" `
    -Password $pwd

Write-Host "Certificate generated successfully!" -ForegroundColor Green
Write-Host "Converting to PEM format..." -ForegroundColor Yellow

# OpenSSLがインストールされている場合はPEM形式に変換
try {
    # PFXからPEMに変換
    openssl pkcs12 -in server.pfx -out server.pem -nodes -password pass:claude-remote
    
    # 秘密鍵と証明書を分離
    openssl rsa -in server.pem -out server.key
    openssl x509 -in server.pem -out server.cert
    
    Write-Host "PEM files generated successfully!" -ForegroundColor Green
    Write-Host "- server.key (private key)" -ForegroundColor Gray
    Write-Host "- server.cert (certificate)" -ForegroundColor Gray
    
    # PFXファイルを削除
    Remove-Item server.pfx -Force
    Remove-Item server.pem -Force
} catch {
    Write-Host "OpenSSL not found. Using Node.js fallback..." -ForegroundColor Yellow
    
    # Node.jsスクリプトで変換
    $nodeScript = @'
const forge = require('node-forge');
const fs = require('fs');

// PFXファイルを読み込み
const pfxData = fs.readFileSync('server.pfx');
const p12Asn1 = forge.asn1.fromDer(pfxData.toString('binary'));
const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, 'claude-remote');

// 証明書と秘密鍵を取得
const bags = p12.getBags({bagType: forge.pki.oids.certBag});
const cert = bags[forge.pki.oids.certBag][0].cert;

const keyBags = p12.getBags({bagType: forge.pki.oids.pkcs8ShroudedKeyBag});
const key = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;

// PEM形式で保存
fs.writeFileSync('server.cert', forge.pki.certificateToPem(cert));
fs.writeFileSync('server.key', forge.pki.privateKeyToPem(key));

console.log('Conversion completed!');
'@
    
    $nodeScript | Out-File -FilePath convert-cert.js -Encoding UTF8
    
    # node-forgeをインストール
    npm install node-forge
    
    # 変換実行
    node convert-cert.js
    
    # 一時ファイルを削除
    Remove-Item convert-cert.js -Force
    Remove-Item server.pfx -Force
}

# 証明書の情報を表示
Write-Host "`nCertificate Information:" -ForegroundColor Cyan
Write-Host "Subject: CN=localhost" -ForegroundColor Gray
Write-Host "Valid for: $days days" -ForegroundColor Gray
Write-Host "DNS Names: localhost, 192.168.0.1, 192.168.1.1, *.local" -ForegroundColor Gray
Write-Host "`nFiles created in: $(Get-Location)" -ForegroundColor Yellow

# 証明書の存在確認
if (Test-Path "server.cert" -and Test-Path "server.key") {
    Write-Host "`nCertificate files created successfully!" -ForegroundColor Green
} else {
    Write-Host "`nWarning: Certificate files may not have been created properly." -ForegroundColor Yellow
}