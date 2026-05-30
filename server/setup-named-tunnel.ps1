&lt;#
.SYNOPSIS
  Configure un tunnel Cloudflare nommé pour IMMEIT (URL fixe, beaucoup plus stable que TryCloudflare)
.DESCRIPTION
  Ce script crée un tunnel Cloudflare nommé "immeit" avec une URL fixe :
    https://immeit.<votre-domaine>.com  (ou une sous-domaine de votre choix)

  Prérequis :
    - Compte Cloudflare (gratuit)
    - Domaine sur Cloudflare (ex: immeit.com)
    - cloudflared installé et authentifié : https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

  Exécution :
    1. Lancer ce script en ADMINISTRATEUR
    2. Suivre les instructions
    3. Le script mettra à jour tunnel.ps1 pour utiliser le tunnel nommé
#>

[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$logDir = Join-Path $PSScriptRoot 'logs'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = "$logDir\setup-named-tunnel.log"

function log { param($msg) $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; "$ts $msg" | Out-File $logFile -Append -Encoding utf8; Write-Host "$ts $msg" }

function Write-Step {
  param($Title, $Color = 'Cyan')
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Color
  Write-Host "  $Title" -ForegroundColor $Color
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $Color
}

# Vérifier que cloudflared est installé
$cfd = Get-Command 'cloudflared' -ErrorAction SilentlyContinue
if (-not $cfd) {
  Write-Host "❌ cloudflared n'est pas installé." -ForegroundColor Red
  Write-Host "   Téléchargez-le depuis : https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" -ForegroundColor Yellow
  exit 1
}

Write-Step "Configuration du tunnel Cloudflare nommé"

# 1) Authentification
Write-Host "`nÉtape 1 : Authentification Cloudflare" -ForegroundColor Green
Write-Host "   Une fenêtre de navigateur va s'ouvrir pour connecter cloudflared à votre compte Cloudflare." -ForegroundColor Yellow
Write-Host "   Connectez-vous et autorisez le tunnel." -ForegroundColor Yellow
Write-Host "   Appuyez sur Entrée pour continuer..." -ForegroundColor Yellow
Read-Host

log 'Authentification cloudflared...'
& cloudflared tunnel login 2>&1 | ForEach-Object { log $_; Write-Host $_ }
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Échec de l'authentification" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Authentification réussie" -ForegroundColor Green

# 2) Créer le tunnel
$tunnelName = 'immeit'
Write-Host "`nÉtape 2 : Création du tunnel '$tunnelName'" -ForegroundColor Green
& cloudflared tunnel delete $tunnelName 2>&1 | Out-Null
$createOutput = & cloudflared tunnel create $tunnelName 2>&1
$createOutput | ForEach-Object { log $_; Write-Host $_ }

$tunnelId = ($createOutput | Select-String -Pattern '[a-f0-9-]{36}').Matches.Value
if (-not $tunnelId) {
  Write-Host "❌ Impossible de récupérer l'ID du tunnel" -ForegroundColor Red
  exit 1
}
log "Tunnel créé avec ID: $tunnelId"
Write-Host "✅ Tunnel '$tunnelName' créé (ID: $tunnelId)" -ForegroundColor Green

# 3) Configurer le sous-domaine
Write-Host "`nÉtape 3 : Sous-domaine du tunnel" -ForegroundColor Green
Write-Host "   Entrez le sous-domaine souhaité (ex: app ou tunnel) :" -ForegroundColor Yellow
$subdomain = Read-Host "   Sous-domaine"
if (-not $subdomain) { $subdomain = 'app' }

Write-Host "   Entrez votre domaine Cloudflare (ex: immeit.com) :" -ForegroundColor Yellow
$domain = Read-Host "   Domaine"
if (-not $domain) { 
  Write-Host "   Domaine requis." -ForegroundColor Red
  exit 1
}

$dnsRecord = "$subdomain.$domain"
Write-Host "`n   Le tunnel sera accessible à : https://$dnsRecord" -ForegroundColor Cyan

# 4) Créer la route DNS
Write-Host "`nÉtape 4 : Création de la route DNS" -ForegroundColor Green
& cloudflared tunnel route dns $tunnelName $dnsRecord 2>&1 | ForEach-Object { log $_; Write-Host $_ }
Write-Host "✅ Route DNS créée : $dnsRecord → tunnel $tunnelName" -ForegroundColor Green

# 5) Créer le fichier de configuration
$configDir = "$env:USERPROFILE\.cloudflared"
$configFile = "$configDir\$tunnelName.yml"
if (!(Test-Path $configDir)) { New-Item -ItemType Directory -Path $configDir -Force | Out-Null }

$config = @"
tunnel: $tunnelName
credentials-file: $configDir\$tunnelId.json

ingress:
  - hostname: $dnsRecord
    service: http://localhost:3001
  - service: http_status:404
"@

$config | Set-Content -Path $configFile -Encoding utf8 -Force
Write-Host "✅ Configuration créée : $configFile" -ForegroundColor Green

# 6) Créer le script tunnel-named.ps1 (ne modifie PAS tunnel.ps1)
$namedScript = @"
`$logFile = Join-Path `$PSScriptRoot 'logs\tunnel.log'
`$tunnelUrlFile = Join-Path `$PSScriptRoot '.tunnel-url'
`$publicUrlFile = Join-Path `$PSScriptRoot '..\tunnel-url.json'
`$repoDir = Join-Path `$PSScriptRoot '..'
`$tunnelName = '$tunnelName'
`$dnsRecord = '$dnsRecord'

function log { param(`$msg) `$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; "`$ts `$msg" | Out-File `$logFile -Append -Encoding utf8 }

function pushUrlToGitHub {
  param(`$url)
  `$json = @{ api_url = `$url; updated = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC') } | ConvertTo-Json
  `$json | Set-Content -Path `$publicUrlFile -NoNewline -Encoding utf8
  log "Tunnel prêt : `$url"
  & git -C `$repoDir add tunnel-url.json 2>&1 | ForEach-Object { log "git add: `$_" }
  `$commitOutput = & git -C `$repoDir -c user.name='immeit-bot' -c user.email='bot@immeit.com' commit -m 'chore: update tunnel URL' --allow-empty 2>&1
  `$commitOutput | ForEach-Object { log "git commit: `$_" }
  `$retries = 3; `$pushOk = `$false
  for (`$i = 1; `$i -le `$retries -and -not `$pushOk; `$i++) {
    `$pushOutput = & git -C `$repoDir push origin main 2>&1
    if (`$LASTEXITCODE -eq 0) { `$pushOk = `$true; log "git push réussi" }
    else {
      log "git push échoué (tentative `$i/`$retries)"
      `$pushOutput | ForEach-Object { log "git push: `$_" }
      if (`$i -lt `$retries) { Start-Sleep -Seconds 5 }
    }
  }
  if (-not `$pushOk) { log "AVERTISSEMENT: tunnel URL non publiée sur GitHub" }
}

log "=== Démarrage tunnel Cloudflare nommé: `$tunnelName ==="
log "URL fixe : https://`$dnsRecord"

`$fixedUrl = "https://`$dnsRecord"
`$fixedUrl | Set-Content -Path `$tunnelUrlFile -NoNewline -Encoding utf8
pushUrlToGitHub `$fixedUrl

while (`$true) {
  & cloudflared tunnel run `$tunnelName 2>&1 | ForEach-Object { log "cloudflared: `$_" }
  `$exitCode = `$LASTEXITCODE
  log "Tunnel arrêté (code: `$exitCode), relance dans 10s..."
  Start-Sleep -Seconds 10
}
"@

$namedTunnelPath = Join-Path $PSScriptRoot 'tunnel-named.ps1'
$namedScript | Set-Content -Path $namedTunnelPath -Encoding utf8 -Force
Write-Host "✅ Script tunnel-named.ps1 créé (tunnel.ps1 non modifié)" -ForegroundColor Green

# 7) Instructions finales
Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "  ✅ CONFIGURATION TERMINÉE !" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Votre tunnel sera accessible à l'adresse fixe :" -ForegroundColor White
Write-Host "  https://$dnsRecord" -ForegroundColor Cyan
Write-Host ""
Write-Host "  L'URL ne changera PLUS jamais (même après reboot)." -ForegroundColor Green
Write-Host "  Plus besoin de git push après chaque démarrage !" -ForegroundColor Green
Write-Host ""
Write-Host "  Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Arrêtez l'ancien tunnel (fermez la fenêtre PowerShell)" -ForegroundColor Yellow
Write-Host "  2. Lancez le NOUVEAU tunnel nommé :" -ForegroundColor Yellow
Write-Host "     powershell -File server\tunnel-named.ps1" -ForegroundColor Cyan
Write-Host "  3. Vérifiez que le tunnel répond :" -ForegroundColor Yellow
Write-Host "     curl https://$dnsRecord/api/health" -ForegroundColor Cyan
Write-Host "  4. Mettez à jour tunnel-url.json avec l'URL fixe :" -ForegroundColor Yellow
Write-Host "     $dnsRecord (exécutez le script, il le fait automatiquement)" -ForegroundColor Cyan
Write-Host "  5. Redémarrez le serveur : pm2 restart immeit" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Une fois le tunnel nommé actif, plus besoin de git push :" -ForegroundColor Green
Write-Host "  l'URL est FIXE et définitive." -ForegroundColor Green
Write-Host ""
Write-Host "  Pour basculer définitivement :" -ForegroundColor Yellow
Write-Host "  - Renommez tunnel.ps1 en tunnel-quick.ps1 (sauvegarde)" -ForegroundColor Yellow
Write-Host "  - Renommez tunnel-named.ps1 en tunnel.ps1 (activation)" -ForegroundColor Yellow
Write-Host "  - startup.ps1 utilisera automatiquement le tunnel nommé" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Note : Si votre domaine est sur Cloudflare avec proxy (orange cloud)," -ForegroundColor Yellow
Write-Host "  le trafic est protégé (cache, DDoS, SSL). Sinon, mettez DNS only (grey cloud)." -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

log "=== SETUP NAMED TUNNEL TERMINÉ ==="
