[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$logDir = Join-Path $PSScriptRoot 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

function log { param($msg) $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; "$ts $msg" | Out-File "$logDir\startup.log" -Append -Encoding utf8; Write-Host "$ts $msg" }

log '=== IMMEIT STARTUP ==='

# 1) Attendre que le réseau soit disponible
log 'Attente du réseau...'
$networkReady = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $req = [System.Net.WebRequest]::Create('https://cloudflare.com')
        $req.Timeout = 3000
        $req.GetResponse().Close()
        $networkReady = $true
        log 'Réseau disponible'
        break
    } catch {
        if ($i -lt 3 -or $i % 10 -eq 9) { log "Réseau indisponible, tentative $($i+1)/60..." }
        Start-Sleep -Seconds 3
    }
}

if (-not $networkReady) {
    log 'ERREUR: Réseau toujours indisponible après 3 minutes'
}

# 2) Sauvegarder l'état PM2 AVANT toute manipulation
Set-Location $PSScriptRoot
log 'Sauvegarde PM2...'
pm2 save --force 2>&1 | Out-Null

# 3) Restaurer le serveur PM2
log 'Restauration PM2...'
$pm2Result = pm2 resurrect 2>&1 | Out-String
log "PM2 resurrect: $($pm2Result.Trim())"

# Vérifier que le process est bien lancé, sinon le démarrer
$pm2List = pm2 list 2>&1 | Out-String
if ($pm2List -notmatch 'online') {
    log 'PM2 resurrect failed — démarrage direct...'
    pm2 start ecosystem.config.cjs --env production 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    pm2 save --force 2>&1 | Out-Null
    log 'PM2 démarré et sauvegardé'
}

# 4) Ajouter une tâche planifiée PM2 post-boot si absente
$taskName = 'IMMEIT-Server'
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existing) {
    log 'Création de la tâche planifiée IMMEIT-Server...'
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File ""$PSCommandPath"""
    $trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay '00:00:30'
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval '00:01:00'
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
    log 'Tâche planifiée créée'
}

# 5) Démarrer le tunnel Cloudflare avec relance automatique
$psPath = Join-Path $PSScriptRoot 'tunnel.ps1'
$tunnelLog = "$logDir\tunnel-auto.log"
$tunnelErrLog = "$logDir\tunnel-auto-err.log"

log 'Démarrage du tunnel Cloudflare...'
$existingTunnel = Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue
if (-not $existingTunnel) {
    Start-Process -NoNewWindow -FilePath 'powershell.exe' -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File ""$psPath""" -RedirectStandardOutput $tunnelLog -RedirectStandardError $tunnelErrLog
    log 'Tunnel lancé'
} else {
    log 'Tunnel déjà en cours d\'exécution'
}

log "IMMEIT: Serveur et tunnel démarrés avec succès"
