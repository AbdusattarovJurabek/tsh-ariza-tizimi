@echo off
title TSH - Baza yangilash
color 0E
echo.
echo  =============================================
echo   TSH - Baza va schema yangilash
echo  =============================================
echo.
echo  [1/2] Schema yangilanmoqda (approved_at maydoni)...
echo.
cd /d "%~dp0backend"
echo Papka: %CD%
echo.
call npx prisma db push
echo.
echo  [2/2] Seed ma'lumotlari...
echo.
call node src/utils/seed.js
echo.
echo  =============================================
echo   TUGADI!
echo   Endi start.bat ni bosing.
echo  =============================================
echo.
pause
