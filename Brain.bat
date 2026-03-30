@echo off
title Brain — Cognitive OS
echo.
echo  ==========================================
echo    Brain — Cognitive Operating System
echo  ==========================================
echo.
echo  Starting Brain...
echo.
cd /d "%~dp0"
npx electron . 2>nul
if errorlevel 1 (
    echo.
    echo  Electron not found. Falling back to browser mode...
    echo  Opening http://localhost:3000
    echo.
    start http://localhost:3000
    npm run dev
)
pause
