@echo off
title TSH Ariza Tizimi
color 0A

start "TSH Backend" cmd /k "cd /d "%~dp0backend" && node src/app.js"
timeout /t 3 /nobreak >nul
start "TSH Frontend" cmd /k "cd /d "%~dp0frontend" && npx vite"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"

echo Serverlar ishga tushdi! http://localhost:3000
pause
