@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

echo ========================================
echo   Phong Van - Build public (1 lenh)
echo ========================================
echo.

where npm >nul 2>&1
if errorlevel 1 (
    echo [Loi] Chua cai Node.js/npm.
    pause
    exit /b 1
)

echo [1/2] npm install (ca 3 frontend)...
call npm install
if errorlevel 1 goto :fail

echo.
echo [2/2] Build mentee + mentor + superadmin...
call npm run build:public
if errorlevel 1 goto :fail

echo.
echo Build xong. Thu muc: deploy\public
echo Tiep theo chay start-public.bat
echo.
pause
exit /b 0

:fail
echo.
echo [Loi] Build that bai.
pause
exit /b 1

