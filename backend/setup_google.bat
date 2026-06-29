@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

echo ========================================
echo   Cau hinh Google Docs cho form ke khai
echo ========================================
echo.

set "JSON=service-account.json"
set "EXAMPLE=service-account.example.json"

if exist "%JSON%" (
    echo [OK] Da co file %JSON%
    for /f "delims=" %%i in ('"%~dp0venv\Scripts\python.exe" -c "import json;print(json.load(open('service-account.json'))['client_email'])" 2^>nul') do set "SA_EMAIL=%%i"
    if defined SA_EMAIL (
        echo [INFO] Email service account: %SA_EMAIL%
        echo        ^> Share Google Doc mau cho email nay ^(quyen Viewer^)
    )
    echo.
    echo Buoc tiep theo:
    echo 1. Mo file mau: https://docs.google.com/document/d/1kqkknLDEgl55k6e_orngAfmkMbHCn2ND7_4BCfIG7ro/edit
    echo 2. Bam Chia se ^> them email service account tren ^> quyen Nguoi xem
    echo 3. Khoi dong lai backend ^(start.bat^)
    goto :done
)

echo [LOI] Chua co file %JSON%
echo.
echo Lam theo cac buoc:
echo.
echo 1. Vao https://console.cloud.google.com/
echo 2. Tao project moi ^(hoac chon project co san^)
echo 3. APIs ^& Services ^> Library ^> tim "Google Drive API" ^> Enable
echo 4. IAM ^& Admin ^> Service Accounts ^> Create Service Account
echo 5. Vao service account ^> Keys ^> Add Key ^> Create new key ^> JSON
echo 6. File JSON tai ve ^> doi ten thanh %JSON%
echo 7. Copy file vao thu muc: %~dp0
echo 8. Mo file mau Google Docs ^> Share ^> them email trong JSON ^(client_email^) ^> Viewer
echo 9. Trong backend\.env da co:
echo       GOOGLE_SERVICE_ACCOUNT_FILE=service-account.json
echo 10. Chay lai start.bat
echo.
echo Xem mau cau truc JSON: %EXAMPLE%
echo.

:done
pause


