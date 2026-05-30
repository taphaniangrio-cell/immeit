$logDir = Join-Path $PSScriptRoot 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force }

# 1) Attendre que le réseau soit disponible
Write-Host 'Attente du réseau...'
$networkReady = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $req = [System.Net.WebRequest]::Create('https://cloudflare.com')
        $req.Timeout = 3000
        $req.GetResponse().Close()
        $networkReady = $true
        Write-Host 'Réseau disponible'
        break
    } catch {
        Write-Host "Réseau indisponible, tentative $($i+1)/60..."
        Start-Sleep -Seconds 3
    }
}

if (-not $networkReady) {
    Write-Host 'ERREUR: Réseau toujours indisponible après 3 minutes'
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ERREUR: Réseau indisponible après démarrage" | Out-File "$logDir\startup.log" -Append
}

# 2) Restaurer le serveur PM2 (sans risque de doublon)
Write-Host 'Restauration PM2...'
Set-Location $PSScriptRoot
pm2 resurrect 2>&1 | Out-File "$logDir\pm2-startup.log" -Append -Encoding utf8
"$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') PM2 resurrect effectué" | Out-File "$logDir\startup.log" -Append

# 3) Démarrer le tunnel Cloudflare avec relance automatique
$psPath = Join-Path $PSScriptRoot 'tunnel.ps1'
$tunnelLog = "$logDir\tunnel-auto.log"

Write-Host 'Démarrage du tunnel Cloudflare...'
Start-Process -NoNewWindow -FilePath 'powershell.exe' -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File ""$psPath""" -RedirectStandardOutput $tunnelLog -RedirectStandardError ($tunnelLog -replace '\.log$', '-err.log')

Write-Host "IMMEIT: Serveur PM2 restauré, tunnel Cloudflare en cours..."
