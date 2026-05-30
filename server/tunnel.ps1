$logFile = Join-Path $PSScriptRoot 'logs\tunnel.log'
$tunnelUrlFile = Join-Path $PSScriptRoot '.tunnel-url'
$publicUrlFile = Join-Path $PSScriptRoot '..\tunnel-url.json'
$repoDir = Join-Path $PSScriptRoot '..'

Write-Host 'Démarrage du tunnel cloudflared...'

$url = $null

# Lancer cloudflared et capturer la sortie en temps réel
& cloudflared tunnel --url http://localhost:3001 2>&1 | ForEach-Object {
  $line = "$_"
  Write-Host $line
  # Extraire l'URL du tunnel
  if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
    $url = $matches[0]
    $url | Set-Content -Path $tunnelUrlFile -NoNewline
    $json = @{ api_url = $url; updated = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC') } | ConvertTo-Json
    $json | Set-Content -Path $publicUrlFile -NoNewline
    Write-Host "Tunnel prêt : $url"
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') Tunnel: $url" | Out-File -FilePath $logFile -Append

    # Pousser l'URL sur GitHub
    & git -C $repoDir add tunnel-url.json 2>&1 | Out-Null
    & git -C $repoDir commit -m 'chore: update tunnel URL' --allow-empty 2>&1 | Out-Null
    & git -C $repoDir push origin main 2>&1 | Out-Null
  }
  # Logguer la sortie
  $_ | Out-File -FilePath $logFile -Append
}

if (-not $url) {
  Write-Host 'ERREUR: Impossible de trouver l URL du tunnel dans la sortie'
}
