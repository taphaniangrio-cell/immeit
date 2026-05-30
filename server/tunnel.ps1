$tunnelUrlFile = Join-Path $PSScriptRoot '.tunnel-url'
$publicUrlFile = Join-Path $PSScriptRoot '..\tunnel-url.json'
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
  @"
{ "api_url": "$url", "updated": "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC')" }
"@ | Set-Content -Path $publicUrlFile -NoNewline
  Write-Host "Tunnel prêt : $url"
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') Tunnel: $url" | Out-File -FilePath $logFile -Append

  # Pousser l'URL sur GitHub pour que le navigateur la découvre
  & git -C (Join-Path $PSScriptRoot '..') add tunnel-url.json 2>&1 | Out-Null
  & git -C (Join-Path $PSScriptRoot '..') commit -m "chore: update tunnel URL" --allow-empty 2>&1 | Out-Null
  & git -C (Join-Path $PSScriptRoot '..') push origin main 2>&1 | Out-Null
} else {
  Write-Host "ERREUR: Impossible d'obtenir l'URL du tunnel"
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ERREUR de tunnel" | Out-File -FilePath $logFile -Append
  exit 1
}

$tunnelOutput | Out-File -FilePath $logFile -Append -Encoding utf8
