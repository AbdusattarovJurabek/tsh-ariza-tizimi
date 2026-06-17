@echo off
chcp 65001 >nul
:MENU
cls
echo.
echo  =============================================
echo    TSH ARIZA TIZIMI - BOSHQARUV
echo  =============================================
echo.
echo   1. Birinchi marta o'rnatish
echo   2. Ishga tushirish
echo   3. To'xtatish
echo   4. Bazani yangilash
echo   0. Chiqish
echo.
echo  =============================================
set /p TANLOV="  Tanlov: "

if "%TANLOV%"=="1" goto SETUP
if "%TANLOV%"=="2" goto START
if "%TANLOV%"=="3" goto STOP
if "%TANLOV%"=="4" goto DBUPDATE
if "%TANLOV%"=="0" exit /b 0
goto MENU

:: ─────────────────────────────────────────
:SETUP
cls
echo.
echo  [0/4] .env fayli tekshirilmoqda...
cd /d "%~dp0backend"
if not exist ".env" (
    echo DATABASE_URL="file:./prisma/dev.db"> .env
    echo JWT_SECRET="tsh-ariza-secret-key-2024">> .env
    echo JWT_EXPIRES_IN="24h">> .env
    echo PORT=5000>> .env
    echo NODE_ENV=development>> .env
    echo UPLOAD_DIR="uploads">> .env
    echo MAX_FILE_SIZE=10485760>> .env
    echo CORS_ORIGIN="http://localhost:3000">> .env
    echo APP_BASE_URL="http://localhost:3000">> .env
    echo  [OK] .env yaratildi
) else (
    echo  [OK] .env mavjud
)

echo.
echo  [1/4] Backend kutubxonalar o'rnatilmoqda...
cd /d "%~dp0backend"
call npm install --no-audit --no-fund
if errorlevel 1 ( echo XATO: npm install & pause & goto MENU )

echo.
echo  [2/4] qrcode paketi o'rnatilmoqda...
call npm install qrcode --no-audit --no-fund

echo.
echo  [3/4] Database yaratilmoqda...
call npx prisma generate
call npx prisma db push --force-reset
if errorlevel 1 ( echo XATO: db push & pause & goto MENU )

echo.
echo  [4/4] Test ma'lumotlar...
call node src/utils/seed.js

echo.
echo  Frontend kutubxonalar o'rnatilmoqda...
cd /d "%~dp0frontend"
call npm install --no-audit --no-fund
if errorlevel 1 ( echo XATO: frontend npm install & pause & goto MENU )

echo.
echo  =============================================
echo   O'RNATISH TUGADI! Endi 2 ni tanlang.
echo  =============================================
pause
goto MENU

:: ─────────────────────────────────────────
:START
start "TSH Backend" cmd /k "cd /d "%~dp0backend" && node src/app.js"
timeout /t 3 /nobreak >nul
start "TSH Frontend" cmd /k "cd /d "%~dp0frontend" && npx vite"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
echo  Serverlar ishga tushdi: http://localhost:3000
timeout /t 2 /nobreak >nul
goto MENU

:: ─────────────────────────────────────────
:STOP
taskkill /FI "WINDOWTITLE eq TSH Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq TSH Frontend*" /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 "') do taskkill /PID %%a /F >nul 2>&1
echo  Serverlar to'xtatildi.
timeout /t 2 /nobreak >nul
goto MENU

:: ─────────────────────────────────────────
:DBUPDATE
cd /d "%~dp0backend"
echo  Schema yangilanmoqda...
call npx prisma db push
echo  Seed ma'lumotlari...
call node src/utils/seed.js
echo  Tayyor!
pause
goto MENU
