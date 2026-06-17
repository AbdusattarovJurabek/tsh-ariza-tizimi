@echo off
title TSH - GitHub ga yuklash
color 0B
cd /d "%~dp0"

echo.
echo  ============================================
echo   TSH Ariza Tizimi - GitHub Setup
echo  ============================================
echo.

:: Git tekshirish
git --version >nul 2>&1
if errorlevel 1 (
    echo  XATO: Git o'rnatilmagan!
    echo  https://git-scm.com/download/win dan yuklab o'rnating
    pause & exit /b 1
)

echo  [1/5] Git repository...
if exist ".git" (
    echo  Git repo allaqachon mavjud.
) else (
    git init
    git checkout -b main 2>nul || git branch -M main 2>nul
    echo  OK: Git repo yaratildi
)

echo.
echo  [2/5] Git config...
set /p GH_USER="  GitHub username: "
if "%GH_USER%"=="" (
    echo  XATO: Username kiritilmadi!
    pause & exit /b 1
)

git config user.name "%GH_USER%"

for /f "tokens=*" %%i in ('git config user.email 2^>nul') do set EXISTING_EMAIL=%%i
if "%EXISTING_EMAIL%"=="" (
    set /p GH_EMAIL="  GitHub email: "
    git config user.email "%GH_EMAIL%"
) else (
    echo  email = %EXISTING_EMAIL% (mavjud)
)

echo.
echo  [3/5] Fayllar qo'shilmoqda...
git add .
git status --short | find /c "" > tmp_count.txt
set /p FILE_COUNT=<tmp_count.txt
del tmp_count.txt
echo  OK: fayllar qo'shildi

echo.
echo  [4/5] Commit...
git commit -m "Initial commit: TSH Ariza Tizimi v1.0"
if errorlevel 1 (
    echo  Hech qanday o'zgarish yo'q yoki allaqachon commit qilingan.
)

echo.
echo  [5/5] Remote va push...
set REPO_URL=https://github.com/%GH_USER%/tsh-ariza-tizimi.git

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin %REPO_URL%
    echo  Remote qo'shildi: %REPO_URL%
) else (
    git remote set-url origin %REPO_URL%
    echo  Remote yangilandi: %REPO_URL%
)

echo.
echo  ----------------------------------------
echo  DIQQAT: GitHub da repo yaratgan bolsangiz
echo  ----------------------------------------
echo  1. https://github.com/new ga o'ting
echo  2. Repository name: tsh-ariza-tizimi
echo  3. Public tanlang
echo  4. README QO'SHMANG
echo  5. Create repository bosing
echo  ----------------------------------------
echo.
set /p READY="  Repo yaratdingizmi? (ha): "
if /i not "%READY%"=="ha" (
    echo.
    echo  Tayyor bo'lganda buyruq:  git push -u origin main
    pause & exit /b 0
)

echo.
echo  Push qilinmoqda...
git push -u origin main

if errorlevel 1 (
    echo.
    echo  ============================================
    echo  PUSH XATOSI - Token kerak bo'lishi mumkin
    echo  ============================================
    echo.
    echo  1. https://github.com/settings/tokens/new
    echo  2. Note: tsh-ariza
    echo  3. Expiration: No expiration
    echo  4. Scope: repo (barchasini belgilang)
    echo  5. Generate token - ni nusxalang
    echo.
    echo  Push qilishda:
    echo    Username: %GH_USER%
    echo    Password: (yuqoridagi tokenni yopishtiing)
    echo.
    git push -u origin main
) else (
    echo.
    echo  ============================================
    echo  MUVAFFAQIYATLI YUKLANDI!
    echo  https://github.com/%GH_USER%/tsh-ariza-tizimi
    echo  ============================================
)

echo.
pause
