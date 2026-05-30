$logFile = Join-Path $PSScriptRoot 'logs\tunnel.log'
$tunnelUrlFile = Join-Path $PSScriptRoot '.tunnel-url'
$publicUrlFile = Join-Path $PSScriptRoot '..\tunnel-url.json'
$repoDir = Join-Path $PSScriptRoot '..'

# Boucle de relance automatique
$maxRetries = 999
for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
    Write-Host "[Tentative $attempt] Démarrage du tunnel cloudflared..."

    $url = $null
    $success = $false

    & cloudflared tunnel --url http://localhost:3001 2>&1 | ForEach-Object {
        $line = "$_"
        Write-Host $line
        if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
            $url = $matches[0]
            $url | Set-Content -Path $tunnelUrlFile -NoNewline
            $json = @{ api_url = $url; updated = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC') } | ConvertTo-Json
            $json | Set-Content -Path $publicUrlFile -NoNewline
            Write-Host "Tunnel prêt : $url"
            "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') Tunnel: $url" | Out-File -FilePath $logFile -Append

            # Pousser l'URL sur GitHub (en tâche de fond pour ne pas bloquer)
            $job = Start-Job -ScriptBlock {
                param($dir)
                & git -C $dir add tunnel-url.json 2>&1 | Out-Null
                & git -C $dir commit -m 'chore: update tunnel URL' --allow-empty 2>&1 | Out-Null
                & git -C $dir push origin main 2>&1 | Out-Null
            } -ArgumentList $repoDir
            $job | Out-Null

            $success = $true
        }
        $_ | Out-File -FilePath $logFile -Append
    }

    # Si cloudflared s'est arrêté et qu'on a déjà eu une URL, on attend puis on relance
    $exitCode = $LASTEXITCODE
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') Tunnel arrêté (code: $exitCode), relance dans 10s..." | Out-File -FilePath $logFile -Append

    Start-Sleep -Seconds 10
}
