bat = r"""@echo off
chcp 65001 >nul
title TSH Ariza Tizimi

taskkill /F /FI "WINDOWTITLE eq TSH Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq TSH Frontend*" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /PID %%a /F >nul 2>&1

if not exist "%~dp0backend\node_modules" goto SETUP
if not exist "%~dp0frontend\node_modules" goto SETUP
goto DBCHECK

:SETUP
echo [1/4] Backend paketlari o'rnatilmoqda...
cd /d "%~dp0backend"
call npm install
echo [2/4] Frontend paketlari o'rnatilmoqda...
cd /d "%~dp0frontend"
call npm install
goto DBCHECK

:DBCHECK
echo [DB] Prisma client qayta yaratilmoqda...
cd /d "%~dp0backend"
if exist "node_modules\.prisma\client" (
    rmdir /s /q "node_modules\.prisma\client" >nul 2>&1
)
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo XATO: prisma generate muvaffaqiyatsiz tugadi!
    pause
    exit /b 1
)
echo [DB] Schema yangilanmoqda...
call npx prisma db push
echo [DB] Demo ma'lumotlar tekshirilmoqda...
call node src/utils/seed.js

:START
echo [OK] Backend va Frontend ishga tushirilmoqda...
start "TSH Backend" /D "%~dp0backend" cmd /k "node src/app.js"
timeout /t 3 /nobreak >nul
start "TSH Frontend" /D "%~dp0frontend" cmd /k "npx vite"
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"
echo.
echo Tizim ishga tushdi!
"""

with open(r"D:\App project\TSH ariza\Texnik shart\tsh-ariza-tizimi\TSH.bat", "w", encoding="utf-8") as f:
    f.write(bat)
print("TSH.bat yozildi")
