# Démarrage automatique IMMEIT au boot Windows
$logDir = Join-Path $PSScriptRoot 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force }

# 1) Démarrer le serveur Node.js via PM2
Set-Location $PSScriptRoot
pm2 start ecosystem.config.cjs --update-env 2>&1 | Out-File "$logDir\pm2-startup.log" -Append -Encoding utf8
pm2 save 2>&1 | Out-File "$logDir\pm2-startup.log" -Append -Encoding utf8

# 2) Démarrer le tunnel Cloudflare avec extraction d'URL + push GitHub
$psPath = Join-Path $PSScriptRoot 'tunnel.ps1'
$psLog = "$logDir\tunnel-auto.log"
Start-Process -NoNewWindow -FilePath 'powershell.exe' -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File ""$psPath""" -RedirectStandardOutput $psLog -RedirectStandardError ($psLog -replace '\.log$', '-err.log')

Write-Host "IMMEIT: Serveur PM2 demarre, tunnel Cloudflare en cours..."
