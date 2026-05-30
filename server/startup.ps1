# Démarrage automatique IMMEIT au boot Windows
$logDir = Join-Path $PSScriptRoot 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force }

# 1) Démarrer le serveur Node.js via PM2
Set-Location $PSScriptRoot
pm2 start ecosystem.config.cjs --update-env 2>&1 | Out-File "$logDir\pm2-startup.log" -Append -Encoding utf8
pm2 save 2>&1 | Out-File "$logDir\pm2-startup.log" -Append -Encoding utf8

# 2) Démarrer le tunnel Cloudflare
$tunnelUrlFile = Join-Path $PSScriptRoot '.tunnel-url'
$tunnelLog = "$logDir\tunnel-auto.log"

# Tuer les anciens tunnels cloudflared
Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue | Stop-Process -Force

# Démarrer cloudflared en arrière-plan
$tunnelJob = Start-Job -ScriptBlock {
  param($exe, $url, $log)
  $p = Start-Process -NoNewWindow -FilePath $exe -ArgumentList "tunnel --url $url" -PassThru -RedirectStandardOutput $log -RedirectStandardError ($log -replace '\.log$', '-err.log')
  Wait-Process -Id $p.Id
} -ArgumentList 'cloudflared', 'http://localhost:3001', $tunnelLog

Write-Host "IMMEIT: Serveur PM2 démarré, tunnel Cloudflare en cours..."
