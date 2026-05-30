[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$logDir = Join-Path $PSScriptRoot 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = "$logDir\deploy.log"

function log { param($msg) $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; "$ts $msg" | Out-File $logFile -Append -Encoding utf8; Write-Host "$ts $msg" }

log '=== IMMEIT DEPLOY ==='
Set-Location $PSScriptRoot

# 1) Pull latest code
log 'Git pull...'
$pullOutput = & git -C (Join-Path $PSScriptRoot '..') pull 2>&1
$pullOutput | ForEach-Object { log "git pull: $_" }

# 2) Install dependencies
log 'npm install...'
npm install 2>&1 | ForEach-Object { log "npm: $_" }

# 3) Restart PM2
log 'Redémarrage PM2...'
pm2 restart immeit 2>&1 | ForEach-Object { log "pm2: $_" }

log '=== DEPLOY TERMINÉ ==='
