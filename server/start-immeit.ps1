param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Force
)

$ErrorActionPreference = 'SilentlyContinue'
$ScriptPath = $MyInvocation.MyCommand.Path
$ServerDir = Split-Path -Parent $ScriptPath
$ProjectDir = Split-Path -Parent $ServerDir
$LogsDir = Join-Path $ServerDir "logs"
$TunnelUrlFile = Join-Path $ServerDir ".tunnel-url"
$ScriptJsFile = Join-Path $ProjectDir "script.js"
$DistScriptJsFile = Join-Path $ProjectDir "dist\script.js"
$TaskName = "IMMEIT Server"
$TaskFile = Join-Path $Env:USERPROFILE "\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\immeit-startup.cmd"

if (-not (Test-Path $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }

function Write-Log {
    param($Msg)
    $t = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$t $Msg" | Out-File -Append -LiteralPath (Join-Path $LogsDir "startup.log")
    Write-Host "$t $Msg"
}

function Stop-Server {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -match "server.js"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

function Start-Server {
    $portInUse = netstat -ano 2>$null | Select-String ":3001.*LISTENING"
    if ($portInUse) {
        Write-Log "Serveur deja en cours (port 3001)"
        return $true
    }

    $env:NODE_ENV = "production"
    $logOut = Join-Path $LogsDir "out.log"
    $logErr = Join-Path $LogsDir "err.log"

    try {
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        $p = Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $ServerDir -RedirectStandardOutput $logOut -RedirectStandardError $logErr -PassThru
        Write-Log "Demarrage serveur (PID: $($p.Id))..."

        Start-Sleep -Seconds 3
        $resp = try { (Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -UseBasicParsing).StatusCode } catch { 0 }
        if ($resp -eq 200) {
            Write-Log "Serveur OK (port 3001)"
            return $true
        } else {
            Write-Log "ERREUR: Serveur non repond apres 3s, tentative en cours..."
            Start-Sleep -Seconds 5
            $resp2 = try { (Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -UseBasicParsing).StatusCode } catch { 0 }
            if ($resp2 -eq 200) { Write-Log "Serveur OK"; return $true }
            Write-Log "ERREUR: Serveur toujours non repondant"
            return $false
        }
    } catch {
        Write-Log "ERREUR demarrage serveur: $_"
        return $false
    }
}

function Start-Tunnel {
    $existing = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Log "cloudflared deja en cours (PID: $($existing.Id))"
        return $true
    }

    try {
        $tunnelLog = Join-Path $LogsDir "tunnel-out.log"
        $tunnelErr = Join-Path $LogsDir "tunnel-err.log"
        $p = Start-Process -NoNewWindow -FilePath "node" -ArgumentList "tunnel-cf.js" -WorkingDirectory $ServerDir -RedirectStandardOutput $tunnelLog -RedirectStandardError $tunnelErr -PassThru
        Write-Log "Demarrage tunnel-cf.js (PID: $($p.Id))..."

        $maxWait = 30
        $url = $null
        for ($i = 0; $i -lt $maxWait; $i++) {
            Start-Sleep -Seconds 1
            if (Test-Path $TunnelUrlFile) {
                $url = Get-Content $TunnelUrlFile -Raw
                $url = $url.Trim()
                if ($url -match "https://.*\.trycloudflare\.com") {
                    Write-Log "Tunnel actif: $url"
                    return $true
                }
            }
        }

        Write-Log "ERREUR: Tunnel non actif apres ${maxWait}s"
        $tunnelErrContent = Get-Content $tunnelErr -Tail 10 -ErrorAction SilentlyContinue
        if ($tunnelErrContent) { Write-Log "Dernieres erreurs tunnel: $tunnelErrContent" }
        return $false
    } catch {
        Write-Log "ERREUR demarrage tunnel: $_"
        return $false
    }
}

function Update-ScriptJs {
    param($TunnelUrl)

    if (-not $TunnelUrl) { return }

    $files = @($ScriptJsFile)
    if (Test-Path $DistScriptJsFile) { $files += $DistScriptJsFile }

    $markerStart = "// IMMEIT TUNNEL URL"
    $injection = "  ${markerStart} - mis a jour automatiquement`nwindow.IMMEIT_API_URL = '$TunnelUrl';`n  // FIN IMMEIT TUNNEL URL`n"

    foreach ($f in $files) {
        try {
            $content = Get-Content $f -Raw
            $oldMarker = [regex]::Escape("// IMMEIT TUNNEL URL - mis a jour automatiquement")
            $pattern = "(?s)$oldMarker.*?// FIN IMMEIT TUNNEL URL"

            if ($content -match $pattern) {
                $content = $content -replace $pattern, $injection.TrimEnd()
                Set-Content -Path $f -Value $content -NoNewline
                Write-Log "IMMEIT_API_URL mis a jour: $TunnelUrl -> $f"
            } elseif ($content -match "DOMContentLoaded") {
                $content = $content -replace "(document.addEventListener\('DOMContentLoaded', \(\) => \{)", "`$1`n$injection"
                Set-Content -Path $f -Value $content -NoNewline
                Write-Log "IMMEIT_API_URL injecte: $TunnelUrl -> $f"
            }
        } catch {
            Write-Log "ERREUR update $f : $_"
        }
    }
}

function Test-Server {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -UseBasicParsing
        return $r.StatusCode -eq 200
    } catch { return $false }
}

function Install-TaskScheduler {
    Write-Log "Installation demarrage automatique..."

    $taskExists = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($taskExists) {
        if (-not $Force) {
            Write-Log "Tache '$TaskName' existe deja. Use -Force to overwrite."
            return
        }
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    }

    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Limited

    try {
        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
        Write-Log "Tache planifiee creee: $TaskName (demarrage au boot)"
    } catch {
        Write-Log "ERREUR creation tache: $_"
        Write-Log "Tentative alternative: demarrage via Startup folder..."
        $startupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
        $shortcutPath = "$startupDir\IMMEIT Server.lnk"
        $wshell = New-Object -ComObject WScript.Shell
        $shortcut = $wshell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = "powershell.exe"
        $shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
        $shortcut.WorkingDirectory = $ServerDir
        $shortcut.Save()
        Write-Log "Raccourci Startup cree: $shortcutPath"
    }
}

function Uninstall-TaskScheduler {
    Write-Log "Desinstallation..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    $startupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $shortcutPath = "$startupDir\IMMEIT Server.lnk"
    if (Test-Path $shortcutPath) { Remove-Item $shortcutPath -Force }
    Write-Log "Desinstalle"
}

# ===== MAIN =====
Write-Log "=================================="
Write-Log "  IMMEIT Server - Demarrage"
Write-Log "=================================="

if ($Uninstall) {
    Uninstall-TaskScheduler
    Stop-Server
    Write-Log "Arrete. Pour relancer: start-immeit.ps1"
    exit 0
}

if ($Install) {
    Install-TaskScheduler
    if (-not $Force) { exit 0 }
}

if (Test-Server) {
    Write-Log "Serveur deja en ligne"
    $url = if (Test-Path $TunnelUrlFile) { Get-Content $TunnelUrlFile -Raw | ForEach-Object { $_.Trim() } } else { $null }
    if ($url -match "trycloudflare\.com") {
        Write-Log "Tunnel: $url"
        Update-ScriptJs -TunnelUrl $url
    }
    exit 0
}

$serverOk = Start-Server

if (-not $serverOk) {
    Write-Log "ERREUR CRITIQUE: Impossible de demarrer le serveur"
    exit 1
}

$tunnelOk = Start-Tunnel

if ($tunnelOk) {
    Start-Sleep -Seconds 2
    $url = if (Test-Path $TunnelUrlFile) { Get-Content $TunnelUrlFile -Raw | ForEach-Object { $_.Trim() } } else { $null }
    if ($url) {
        Write-Log "Mise a jour script.js avec: $url"
        Update-ScriptJs -TunnelUrl $url
        Write-Log "Publication du tunnel URL sur gh-pages..."
        try {
            $gitDir = $ProjectDir
            $currentBranch = & "C:\Program Files\Git\bin\git.exe" -C $gitDir rev-parse --abbrev-ref HEAD 2>&1
            & "C:\Program Files\Git\bin\git.exe" -C $gitDir stash 2>&1 | Out-Null
            & "C:\Program Files\Git\bin\git.exe" -C $gitDir checkout gh-pages 2>&1 | Out-Null
            $distFile = Join-Path $ProjectDir "dist\script.js"
            if (Test-Path $distFile) {
                $content = Get-Content $distFile -Raw
                $content = $content -replace "(?s)IMMEIT_API_URL = 'https?://[^']*'", "IMMEIT_API_URL = '$url'"
                Set-Content -Path $distFile -Value $content -NoNewline
                & "C:\Program Files\Git\bin\git.exe" -C $gitDir add -A 2>&1 | Out-Null
                & "C:\Program Files\Git\bin\git.exe" -C $gitDir commit --allow-empty -m "auto: update tunnel URL" 2>&1 | Out-Null
                & "C:\Program Files\Git\bin\git.exe" -C $gitDir push origin gh-pages 2>&1 | Out-Null
                Write-Log "gh-pages mis a jour avec le tunnel URL"
            }
            & "C:\Program Files\Git\bin\git.exe" -C $gitDir checkout $currentBranch 2>&1 | Out-Null
            & "C:\Program Files\Git\bin\git.exe" -C $gitDir stash pop 2>&1 | Out-Null
        } catch {
            Write-Log "ERREUR mise a jour gh-pages: $_"
        }
    }
} else {
    Write-Log "ATTENTION: Tunnel non demarre - le serveur local fonctionne"
}

Write-Log "=== Demarrage termine ==="

if ($Install -or (-not (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue))) {
    Install-TaskScheduler
}
