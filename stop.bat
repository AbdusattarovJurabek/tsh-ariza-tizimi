@echo off
chcp 65001 >nul
title TSH Ariza Tizimi - To'xtatish

echo TSH Ariza Tizimi serverlari to'xtatilmoqda...
taskkill /FI "WINDOWTITLE eq TSH Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq TSH Frontend*" /F >nul 2>&1

:: 5000 va 3000 portlarni tozalash
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 "') do taskkill /PID %%a /F >nul 2>&1

echo [OK] Serverlar to'xtatildi.
timeout /t 2 /nobreak >nul
