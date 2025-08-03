@echo off
echo Restarting Claude Code Remote...
echo.

REM Kill all node processes
echo Stopping all node processes...
taskkill /F /IM node.exe 2>nul
echo.

echo Waiting for processes to stop...
timeout /t 2 /nobreak >nul

echo Starting server...
cd server
start "Claude Server" /min cmd /c "npm run start:secure"

echo Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo Starting client...
cd ..\client
start "Claude Client" /min cmd /c "npm run dev"

echo.
echo ========================================
echo Claude Code Remote is restarting...
echo ========================================
echo.
echo Server URL: https://localhost:9001
echo Client URL: http://localhost:3000
echo.
echo Login credentials:
echo   Username: admin
echo   Password: password123
echo.
echo ========================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3000
echo.
echo Press any key to exit...
pause >nul