$ProjectRoot = Split-Path -Parent $PSCommandPath
$serverDir = "$ProjectRoot\server"

# Installer les dépendances si besoin
if (-not (Test-Path "$serverDir\node_modules")) {
    Set-Location $serverDir
    npm install 2>$null
}

# Démarrer le serveur Node.js avec PM2 (silencieux)
Set-Location $serverDir
pm2 start ecosystem.config.cjs --update-env 2>&1 | Out-Null
pm2 save --force 2>&1 | Out-Null

# Service cloudflared déjà démarré (auto si installé)
try {
    $svc = Get-Service cloudflared -ErrorAction Stop
    if ($svc.Status -ne "Running") {
        Start-Service cloudflared
    }
} catch {}
