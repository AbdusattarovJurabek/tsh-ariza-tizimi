@echo off
chcp 65001 >nul
title TSH Ariza Tizimi - O'rnatish

echo.
echo ============================================
echo   TSH ARIZA TIZIMI - BIRINCHI O'RNATISH
echo ============================================
echo.

:: Node.js tekshirish
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [XATO] Node.js o'rnatilmagan!
    echo https://nodejs.org dan yuklab o'rnating (LTS versiya)
    pause
    exit /b 1
)
echo [OK] Node.js:
node --version

echo.
echo [1/5] Backend kutubxonalar o'rnatilmoqda...
cd /d "%~dp0backend"
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [XATO] Backend npm install muvaffaqiyatsiz
    pause
    exit /b 1
)
echo [OK] Backend kutubxonalar o'rnatildi

echo.
echo [2/5] Database yaratilmoqda...
call npx prisma generate
call npx prisma db push --force-reset
if %errorlevel% neq 0 (
    echo [XATO] Database yaratishda xato
    pause
    exit /b 1
)
echo [OK] Database yaratildi

echo.
echo [3/5] Test ma'lumotlar kiritilmoqda...
call node src/utils/seed.js
if %errorlevel% neq 0 (
    echo [XATO] Seed muvaffaqiyatsiz
    pause
    exit /b 1
)
echo [OK] Test ma'lumotlar kiritildi

echo.
echo [4/5] Frontend kutubxonalar o'rnatilmoqda...
cd /d "%~dp0frontend"
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [XATO] Frontend npm install muvaffaqiyatsiz
    pause
    exit /b 1
)
echo [OK] Frontend kutubxonalar o'rnatildi

echo.
echo [5/5] Frontend build tekshirilmoqda...
node node_modules\vite\bin\vite.js --version
if %errorlevel% neq 0 (
    echo [XATO] Frontend build muvaffaqiyatsiz
    pause
    exit /b 1
)
echo [OK] Frontend build tayyor

echo.
echo ============================================
echo   O'RNATISH MUVAFFAQIYATLI YAKUNLANDI!
echo ============================================
echo.
echo Endi start.bat faylini ishga tushiring
echo.
pause
