@echo off
title TSH - Bazani yangilash va qayta ishga tushirish
color 0A
echo.
echo  Fermer jadvalini bazaga qo'shilmoqda...
echo.
cd /d "%~dp0backend"
npx prisma db push
if errorlevel 1 (
    echo XATO: Prisma db push muvaffaqiyatsiz!
    pause
    exit /b 1
)
echo.
echo  Baza yangilandi! Server ishga tushirilmoqda...
echo.
node src/app.js
