# Claude Code Remote Setup Script

Write-Host "Claude Code Remote Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Install server dependencies
Write-Host "`nInstalling server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install

# Generate password hash
Write-Host "`nGenerating password hash..." -ForegroundColor Yellow
$password = Read-Host "Enter password for admin user" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

$hash = node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$plainPassword', 10).then(h => console.log('Hash: ' + h))"
Write-Host $hash -ForegroundColor Green
Write-Host "Please update the passwordHash in server/index.js with this hash" -ForegroundColor Yellow

# Install client dependencies
Write-Host "`nInstalling client dependencies..." -ForegroundColor Yellow
Set-Location ../client
npm install

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
Write-Host "`nYour local IP address: $localIP" -ForegroundColor Green

# Firewall rules
Write-Host "`nSetting up firewall rules..." -ForegroundColor Yellow
$serverRule = Get-NetFirewallRule -DisplayName "Claude Code Remote Server" -ErrorAction SilentlyContinue
if (-not $serverRule) {
    New-NetFirewallRule -DisplayName "Claude Code Remote Server" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
    Write-Host "Server firewall rule created" -ForegroundColor Green
} else {
    Write-Host "Server firewall rule already exists" -ForegroundColor Gray
}

$clientRule = Get-NetFirewallRule -DisplayName "Claude Code Remote Client Dev" -ErrorAction SilentlyContinue
if (-not $clientRule) {
    New-NetFirewallRule -DisplayName "Claude Code Remote Client Dev" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
    Write-Host "Client firewall rule created" -ForegroundColor Green
} else {
    Write-Host "Client firewall rule already exists" -ForegroundColor Gray
}

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "`nTo start the server: cd server && npm start" -ForegroundColor Cyan
Write-Host "To start the client: cd client && npm run dev" -ForegroundColor Cyan
Write-Host "`nAccess from iPhone: http://${localIP}:3000" -ForegroundColor Cyan
Write-Host "Server URL in app: http://${localIP}:8080" -ForegroundColor Cyan

Set-Location ..