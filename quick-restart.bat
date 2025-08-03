@echo off
echo Quick restart Claude Code Remote...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul

cd server
start "Claude Server" /min cmd /c "npm run start && pause"
timeout /t 2 /nobreak >nul

cd ..\client  
start "Claude Client" /min cmd /c "npm run dev && pause"
timeout /t 3 /nobreak >nul

echo.
echo ===== Claude Code Remote Started =====
echo Server: http://localhost:9001
echo Client: http://localhost:3000
echo Username: admin
echo Password: password123
echo =====================================
echo.
start http://localhost:3000