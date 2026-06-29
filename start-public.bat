@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

if not exist "deploy\public\mentee\index.html" (
    echo Chua co ban build public. Dang build lan dau...
    call "%~dp0build-public.bat"
)

echo ========================================
echo   Phong Van - Public mode (3 cong rieng)
echo ========================================
echo.
echo May tinh nay phai BAT va GIU cua so Backend mo.
echo.
echo Local:
echo   Mentee:      http://127.0.0.1:8080/hskjchaihldkajj/
echo   Mentor:      http://127.0.0.1:8080/hjgafjkshdgfahjkkjcsdhkk/login
echo   Super Admin: http://127.0.0.1:8080/yaghkcjhaiuhahjks/login
echo.
echo Cho nguoi o xa (3 link tunnel rieng):
echo   Chay start-tunnel-3link.bat
echo.
echo Link co dinh lau dai (can domain):
echo   Doc HUONG-DAN-LINK-CO-DINH.txt
echo.

set "BACKEND=%~dp0backend"
set "PYTHON=%BACKEND%\venv\Scripts\python.exe"
set "PIP=%BACKEND%\venv\Scripts\pip.exe"

if not exist "%PYTHON%" (
    python -m venv "%BACKEND%\venv"
)

"%PIP%" install -r "%BACKEND%\requirements.txt" -q

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do taskkill /F /PID %%p >nul 2>&1
timeout /t 1 /nobreak >nul

cd /d "%BACKEND%"
"%PYTHON%" seed_admin.py >nul 2>&1

set SERVE_PUBLIC=1
set FLASK_HOST=127.0.0.1
set FLASK_PORT=8080

start "Phong Van - Public Backend" cmd /k "cd /d "%BACKEND%" && set SERVE_PUBLIC=1&& set FLASK_HOST=127.0.0.1&& set FLASK_PORT=8080&& "%PYTHON%" app.py"

echo.
echo Server local: http://127.0.0.1:8080
echo   Mentee:      http://127.0.0.1:8080/hskjchaihldkajj/
echo   Mentor:      http://127.0.0.1:8080/hjgafjkshdgfahjkkjcsdhkk/login
echo   Super Admin: http://127.0.0.1:8080/yaghkcjhaiuhahjks/login
echo.
echo Cho nguoi o xa: chay start-tunnel-3link.bat (3 link rieng)
echo.
pause


