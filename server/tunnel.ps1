$tunnelUrlFile = Join-Path $PSScriptRoot '.tunnel-url'
$logFile = Join-Path $PSScriptRoot 'logs\tunnel.log'

Write-Host "Démarrage du tunnel cloudflared..."

$tunnelOutput = & cloudflared tunnel --url http://localhost:3001 2>&1

$url = $null
foreach ($line in $tunnelOutput) {
  if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
    $url = $matches[0]
    break
  }
}

if ($url) {
  $url | Set-Content -Path $tunnelUrlFile -NoNewline
  Write-Host "Tunnel prêt : $url"
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') Tunnel: $url" | Out-File -FilePath $logFile -Append
} else {
  Write-Host "ERREUR: Impossible d'obtenir l'URL du tunnel"
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ERREUR de tunnel" | Out-File -FilePath $logFile -Append
  exit 1
}

# Laisser le tunnel tourner (ne pas exit)
# Rediriger la sortie vers le log
$tunnelOutput | Out-File -FilePath $logFile -Append -Encoding utf8
