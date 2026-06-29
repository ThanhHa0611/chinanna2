@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo ========================================
echo   Phong Van - Chia se link (cung WiFi)
echo ========================================
echo.

set "LAN_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  set "candidate=%%a"
  set "candidate=!candidate: =!"
  if not "!candidate!"=="" if not "!candidate!"=="127.0.0.1" (
    if not defined LAN_IP set "LAN_IP=!candidate!"
  )
)

if not defined LAN_IP (
  echo [Canh bao] Khong tim thay IP mang noi bo. Van chay server, nhung link chia se co the sai.
  set "LAN_IP=YOUR_LAN_IP"
)

echo IP may tinh nay tren WiFi/LAN: %LAN_IP%
echo.
echo Gui 3 link sau cho nguoi khac (cung mang WiFi):
echo   Mentee:      http://%LAN_IP%:5173
echo   Mentor:      http://%LAN_IP%:5174/login
echo   Super Admin: http://%LAN_IP%:5175/login
echo.
echo Luu y:
echo  - May tinh nay phai BAT start-share.bat va GIU cua so server mo
echo  - Khong can mo Cursor
echo  - Neu nguoi khac khong vao duoc: mo Windows Firewall cho cong 5173, 5174, 5175
echo  - Nguoi o xa (khac WiFi) can dung ngrok hoac deploy len VPS — xem huong dan ben duoi
echo.

set "BACKEND=%~dp0backend"
set "FRONTEND=%~dp0frontend"
set "FRONTEND_ADMIN=%~dp0frontend-admin"
set "FRONTEND_SUPERADMIN=%~dp0frontend-superadmin"
set "PYTHON=%BACKEND%\venv\Scripts\python.exe"
set "PIP=%BACKEND%\venv\Scripts\pip.exe"

if not exist "%PYTHON%" (
    echo [Backend] Tao virtual environment...
    python -m venv "%BACKEND%\venv"
)

echo [Backend] Cai dependencies...
"%PIP%" install -r "%BACKEND%\requirements.txt" -q

where npm >nul 2>&1
if errorlevel 1 (
    echo [Loi] Chua cai Node.js/npm.
    pause
    exit /b 1
)

cd /d "%~dp0"
call npm install
if errorlevel 1 (
    echo [Loi] npm install that bai.
    pause
    exit /b 1
)

echo Dang dong server cu...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr "127.0.0.1:8000" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5174" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5175" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul

cd /d "%BACKEND%"
"%PYTHON%" seed_admin.py >nul 2>&1

echo.
echo Dang mo server (cho phep truy cap tu mang noi bo)...
start "Phong Van - Backend" cmd /k "cd /d "%BACKEND%" && "%PYTHON%" app.py"
timeout /t 2 /nobreak >nul
start "Phong Van - Mentor" cmd /k "cd /d "%FRONTEND_ADMIN%" && npm run dev"
timeout /t 2 /nobreak >nul
start "Phong Van - Super Admin" cmd /k "cd /d "%FRONTEND_SUPERADMIN%" && npm run dev"
timeout /t 2 /nobreak >nul
start "Phong Van - Mentee" cmd /k "cd /d "%FRONTEND%" && npm run dev"

echo.
echo ========================================
echo   LINK GUI CHO NGUOI KHAC
echo ========================================
echo Mentee:      http://%LAN_IP%:5173
echo Mentor:      http://%LAN_IP%:5174/login
echo Super Admin: http://%LAN_IP%:5175/login
echo ========================================
echo.
pause


