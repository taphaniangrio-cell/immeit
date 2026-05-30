[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$logFile = Join-Path $PSScriptRoot 'logs\tunnel.log'
$tunnelUrlFile = Join-Path $PSScriptRoot '.tunnel-url'
$publicUrlFile = Join-Path $PSScriptRoot '..\tunnel-url.json'
$repoDir = Join-Path $PSScriptRoot '..'

function log { param($msg) $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; "$ts $msg" | Out-File $logFile -Append -Encoding utf8 }

function pushUrlToGitHub {
  param($url)
  $json = @{ api_url = $url; updated = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC') } | ConvertTo-Json
  $json | Set-Content -Path $publicUrlFile -NoNewline -Encoding utf8
  log "Tunnel prêt : $url"
  & git -C $repoDir add tunnel-url.json 2>&1 | Out-Null
  & git -C $repoDir -c user.name='immeit-bot' -c user.email='bot@immeit.com' commit -m 'chore: update tunnel URL' --allow-empty 2>&1 | Out-Null
  & git -C $repoDir push origin main 2>&1 | Out-Null
}

$maxRetries = 999
for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
  log "[Tentative $attempt] Démarrage du tunnel cloudflared..."

  $url = $null
  $success = $false

  & cloudflared tunnel --url http://localhost:3001 2>&1 | ForEach-Object {
    $line = "$_"
    if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
      $url = $matches[0]
      $url | Set-Content -Path $tunnelUrlFile -NoNewline -Encoding utf8
      if (-not $success) {
        pushUrlToGitHub $url
        $success = $true
      }
    }
  }

  $exitCode = $LASTEXITCODE
  log "Tunnel arrêté (code: $exitCode), relance dans 10s..."
  Start-Sleep -Seconds 10
}
