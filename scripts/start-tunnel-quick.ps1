# Phong Van — 1 tunnel + 3 link (mentee / mentor / super admin)
param(
    [string]$Origin = "http://127.0.0.1:8080"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root "deploy\tunnel-logs"
$logFile = Join-Path $logDir "quick.log"
$pathsFile = Join-Path $root "deploy\public_paths.json"
$linksGui = Join-Path $root "LINK-GUI.txt"
$linkMentee = Join-Path $root "LINK-MENTEE.txt"
$linkMentor = Join-Path $root "LINK-MENTOR.txt"
$linkSuper = Join-Path $root "LINK-SUPERADMIN.txt"

function Find-Cloudflared {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $wingetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"
    if (Test-Path $wingetPath) { return $wingetPath }
    throw "Chua cai cloudflared. Chay: winget install Cloudflare.cloudflared"
}

function Wait-TunnelUrl {
    param([string]$File, [int]$TimeoutSec = 90)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-Path $File) {
            $match = Select-String -Path $File -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -AllMatches | Select-Object -Last 1
            if ($match -and $match.Matches.Count -gt 0) { return $match.Matches[0].Value }
        }
        Start-Sleep -Seconds 1
    }
    return $null
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

try {
    $response = Invoke-WebRequest -Uri $Origin -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ge 500) { throw "Backend loi $($response.StatusCode)" }
} catch {
    throw "Backend chua chay tai $Origin. Chay start-public.bat truoc."
}

$paths = Get-Content $pathsFile -Raw | ConvertFrom-Json
$cloudflared = Find-Cloudflared

if (Test-Path $logFile) { Remove-Item $logFile -Force }

Write-Host "Dang tao tunnel..." -ForegroundColor Cyan
Start-Process -FilePath $cloudflared -ArgumentList @(
    "tunnel", "--url", $Origin, "--logfile", $logFile, "--loglevel", "info"
) -WindowStyle Minimized | Out-Null

$base = (Wait-TunnelUrl -File $logFile).TrimEnd('/')
if (-not $base) { throw "Khong lay duoc link tunnel. Xem $logFile" }

$envFile = Join-Path $root "backend\.env.public-tunnel"
@(
    "BACKEND_PUBLIC_URL=$base"
    "MENTOR_MENTEES_URL=$base/$($paths.mentor)/mentees"
    "MENTEE_PROFILE_URL=$base/$($paths.mentee)/profile"
    "MENTOR_ADMIN_URL=$base/$($paths.mentor)/"
) | Set-Content -Path $envFile -Encoding UTF8

$menteeUrl = "$base/$($paths.mentee)/"
$mentorUrl = "$base/$($paths.mentor)/login"
$superUrl = "$base/$($paths.superadmin)/login"
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm"

$gui = @"
PHONG VAN — LINK GUI CHO MENTEE & MENTOR
(Cap nhat: $stamp — may phai BAT start-public.bat + tunnel)

================================================================
COPY GUI CHO MENTEE (chi gui dong nay)
================================================================

$menteeUrl

================================================================
COPY GUI CHO MENTOR (chi gui dong nay)
================================================================

$mentorUrl

================================================================
SUPER ADMIN (chi gui admin, khong gui mentee/mentor)
================================================================

$superUrl

================================================================
LUU Y
================================================================
- Link trycloudflare DOI moi lan chay lai tunnel.
- Chay start-tunnel-quick.bat de tao link moi + ghi de file nay.
- May tinh ban phai mo (backend port 8080 + cloudflared).
"@

Set-Content -Path $linksGui -Value $gui -Encoding UTF8
Set-Content -Path $linkMentee -Value "$menteeUrl`n" -Encoding UTF8
Set-Content -Path $linkMentor -Value "$mentorUrl`n" -Encoding UTF8
Set-Content -Path $linkSuper -Value "$superUrl`n" -Encoding UTF8

Write-Host ""
Write-Host "LINK MENTEE:" -ForegroundColor Yellow
Write-Host "  $menteeUrl"
Write-Host ""
Write-Host "LINK MENTOR:" -ForegroundColor Yellow
Write-Host "  $mentorUrl"
Write-Host ""
Write-Host "Da luu: LINK-GUI.txt, LINK-MENTEE.txt, LINK-MENTOR.txt" -ForegroundColor Green
Write-Host "Giu cua so cloudflared dang chay — KHONG tat may." -ForegroundColor DarkYellow
Write-Host ""
