@echo off
title TSH Backend - Tuzatish
color 0E
echo.
echo  =============================================
echo   TSH Backend - node_modules qayta o'rnatish
echo  =============================================
echo.
echo  DIQQAT: Bu jarayon 2-5 daqiqa davom etadi
echo  Iltimos kuting...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0fix_backend.ps1"
if errorlevel 1 (
    echo.
    echo XATO yuz berdi!
    pause
    exit /b 1
)
