@echo off
title Brain - Cognitive OS
cd /d "%~dp0"

echo.
echo  ==========================================
echo    Brain - Cognitive Operating System
echo  ==========================================
echo.
echo  Starting server...
echo  Press Ctrl+C to stop.
echo.

:: Launch browser after a delay (gives server time to start)
start /b cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3000"

:: Run the dev server (blocks until Ctrl+C)
npm run dev
