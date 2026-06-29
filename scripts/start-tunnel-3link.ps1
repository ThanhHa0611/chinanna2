# Phong Van — 3 tunnel rieng (mentee / mentor / super admin)
param(
    [string]$Origin = "http://127.0.0.1:8080"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root "deploy\tunnel-logs"
$hostsFile = Join-Path $root "backend\tunnel_hosts.json"
$linksFile = Join-Path $root "LINK-3-CUA.txt"
$pathsFile = Join-Path $root "deploy\public_paths.json"

$publicPaths = Get-Content $pathsFile -Raw | ConvertFrom-Json

function Find-Cloudflared {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    $wingetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"
    if (Test-Path $wingetPath) { return $wingetPath }

    throw "Chua cai cloudflared. Chay: winget install Cloudflare.cloudflared"
}

function Wait-TunnelUrl {
    param(
        [string]$LogFile,
        [int]$TimeoutSec = 90
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-Path $LogFile) {
            $match = Select-String -Path $LogFile -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -AllMatches |
                Select-Object -Last 1
            if ($match -and $match.Matches.Count -gt 0) {
                return $match.Matches[0].Value
            }
        }
        Start-Sleep -Seconds 1
    }
    return $null
}

function Start-RoleTunnel {
    param(
        [string]$Cloudflared,
        [string]$Role,
        [string]$OriginUrl
    )

    $logFile = Join-Path $logDir "$Role.log"
    if (Test-Path $logFile) { Remove-Item $logFile -Force }

    Start-Process -FilePath $Cloudflared -ArgumentList @(
        "tunnel",
        "--url",
        $OriginUrl,
        "--logfile",
        $logFile,
        "--loglevel",
        "info"
    ) -WindowStyle Minimized | Out-Null

    $url = Wait-TunnelUrl -LogFile $logFile
    if (-not $url) {
        throw "Khong lay duoc link tunnel cho $Role. Xem $logFile"
    }

    $hostName = ([Uri]$url).Host
    return @{
        role = $Role
        url = $url.TrimEnd('/')
        host = $hostName
        log = $logFile
    }
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

try {
    $response = Invoke-WebRequest -Uri $Origin -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ge 500) {
        throw "Backend tra loi $($response.StatusCode)"
    }
} catch {
    throw "Backend chua chay tai $Origin. Hay chay start-public.bat truoc."
}

$cloudflared = Find-Cloudflared
$roles = @("mentee", "mentor", "superadmin")
$tunnels = @()

Write-Host ""
Write-Host "Dang tao 3 tunnel rieng (co the mat 1-2 phut)..." -ForegroundColor Cyan

foreach ($role in $roles) {
    Write-Host "  - $role..." -ForegroundColor DarkGray
    $tunnels += Start-RoleTunnel -Cloudflared $cloudflared -Role $role -OriginUrl $Origin
}

$hostMap = @{
    mentee = $tunnels[0].host
    mentor = $tunnels[1].host
    superadmin = $tunnels[2].host
}

$hostMap | ConvertTo-Json | Set-Content -Path $hostsFile -Encoding UTF8

$menteeLink = "$($tunnels[0].url)/$($publicPaths.mentee)/"
$mentorLink = "$($tunnels[1].url)/$($publicPaths.mentor)/login"
$superadminLink = "$($tunnels[2].url)/$($publicPaths.superadmin)/login"

$content = @"
PHONG VAN — 3 LINK RIENG (cap nhat $(Get-Date -Format 'yyyy-MM-dd HH:mm'))
================================================================

Gui tung link cho dung doi tuong. KHONG gui chung 1 trang landing.

Mentee:
$menteeLink

Mentor:
$mentorLink

Super Admin:
$superadminLink

LUU Y:
- May tinh ban phai BAT (start-public.bat + cac tunnel dang chay).
- Moi lan chay lai script, 3 link co the DOI (trycloudflare mien phi).
- Link co dinh lau dai: xem HUONG-DAN-LINK-CO-DINH.txt (can domain).
"@

Set-Content -Path $linksFile -Value $content -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  3 LINK RIENG — copy gui tung nhom" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Mentee:" -ForegroundColor Yellow
Write-Host "  $menteeLink"
Write-Host ""
Write-Host "Mentor:" -ForegroundColor Yellow
Write-Host "  $mentorLink"
Write-Host ""
Write-Host "Super Admin:" -ForegroundColor Yellow
Write-Host "  $superadminLink"
Write-Host ""
Write-Host "Da luu vao: LINK-3-CUA.txt" -ForegroundColor Cyan
Write-Host "Tunnel dang chay nen (3 cua so cloudflared). KHONG tat may." -ForegroundColor DarkYellow
Write-Host ""
