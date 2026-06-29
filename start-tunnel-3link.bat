@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

echo ========================================
echo   Phong Van - 3 link rieng (tunnel free)
echo ========================================
echo.
echo Buoc 1: Backend public (cong 8080)
echo Buoc 2: Tao 3 tunnel Cloudflare rieng
echo.

if not exist "deploy\public\mentee\index.html" (
    echo Chua co ban build public. Dang build...
    call "%~dp0build-public.bat"
    if errorlevel 1 exit /b 1
)

set "BACKEND=%~dp0backend"
set "PYTHON=%BACKEND%\venv\Scripts\python.exe"
set "PIP=%BACKEND%\venv\Scripts\pip.exe"

if not exist "%PYTHON%" (
    python -m venv "%BACKEND%\venv"
)

"%PIP%" install -r "%BACKEND%\requirements.txt" -q

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo Backend da chay tren cong 8080.
    goto :backend_ready
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul

cd /d "%BACKEND%"
"%PYTHON%" seed_admin.py >nul 2>&1

set SERVE_PUBLIC=1
set FLASK_HOST=127.0.0.1
set FLASK_PORT=8080

start "Phong Van - Public Backend" cmd /k "cd /d "%BACKEND%" && set SERVE_PUBLIC=1&& set FLASK_HOST=127.0.0.1&& set FLASK_PORT=8080&& "%PYTHON%" app.py"

echo Doi backend khoi dong...
timeout /t 4 /nobreak >nul

:backend_ready
echo.
echo Buoc 2: Tao 3 tunnel (mentee / mentor / super admin)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-tunnel-3link.ps1"
if errorlevel 1 (
    echo.
    echo [Loi] Khong tao duoc tunnel. Kiem tra da cai cloudflared chua:
    echo   winget install Cloudflare.cloudflared
    pause
    exit /b 1
)

echo.
echo Xong. Mo file LINK-3-CUA.txt de copy 3 link.
echo.
pause


