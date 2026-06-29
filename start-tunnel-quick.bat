@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ========================================
echo   Phong Van - Link gui mentee / mentor
echo ========================================
echo.

if not exist "deploy\public\mentee\index.html" (
    echo Chua build public. Dang build...
    call "%~dp0build-public.bat"
    if errorlevel 1 exit /b 1
)

cmd /c "netstat -ano | findstr :8080 | findstr LISTENING" >nul 2>&1
if errorlevel 1 (
    echo Backend chua chay. Dang mo start-public.bat...
    start "Phong Van - Public Backend" cmd /k "%~dp0start-public.bat"
    echo Doi 6 giay...
    timeout /t 6 /nobreak >nul
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-tunnel-quick.ps1"
if errorlevel 1 (
    echo.
    echo [Loi] Khong tao duoc tunnel.
    pause
    exit /b 1
)

echo Mo file LINK-MENTEE.txt hoac LINK-MENTOR.txt de copy gui.
echo.
pause


