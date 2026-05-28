<#
.SYNOPSIS
    Configuration complete d'IMMEIT - messagerie, tunnel, demarrage auto
.DESCRIPTION
    Configure l'authentification Cloudflare, cree le tunnel,
    et installe le demarrage automatique au boot de Windows.
#>

$ErrorActionPreference = 'Stop'
$ServerDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ServerDir

function Write-Step { param($Msg) Write-Host "`n=== $Msg ===" -ForegroundColor Cyan }
function Write-OK { Write-Host "  OK" -ForegroundColor Green }
function Write-Info { param($Msg) Write-Host "  $Msg" -ForegroundColor Yellow }

Write-Host @"

╔══════════════════════════════════════════════╗
║        IMMEIT - Configuration Complete       ║
║                                              ║
║  Installe le demarrage automatique et le     ║
║  tunnel Cloudflare pour une URL stable.      ║
╚══════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ===== Step 1: Verifier prerequis =====
Write-Step "1/5 Verification des prerequis"

$tools = @(
    @{Name="Node.js"; Cmd="node --version"}
    @{Name="cloudflared"; Cmd="cloudflared version"}
    @{Name="npm"; Cmd="npm --version"}
)

$allOk = $true
foreach ($t in $tools) {
    try {
        $v = cmd /c "$($t.Cmd) 2>nul"
        Write-OK "$($t.Name): $v"
    } catch {
        Write-Host "  MANQUANT: $($t.Name)" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host "ERREUR: Installez les prerequis manquants" -ForegroundColor Red
    exit 1
}

# ===== Step 2: Authentifier cloudflared =====
Write-Step "2/5 Authentification Cloudflare"

$certPath = "$env:USERPROFILE\.cloudflared\cert.pem"
if (Test-Path $certPath) {
    Write-OK "Deja authentifie aupres de Cloudflare"
} else {
    Write-Host "  Ouverture du navigateur pour authentification Cloudflare..." -ForegroundColor Yellow
    Write-Host "  1. Connectez-vous a votre compte Cloudflare" -ForegroundColor Yellow
    Write-Host "  2. Choisissez le domaine immeit.com" -ForegroundColor Yellow
    Write-Host "  3. Autorisez l'acces" -ForegroundColor Yellow
    try {
        Start-Process "cloudflared" -ArgumentList "tunnel login"
        Start-Sleep -Seconds 60
        if (Test-Path $certPath) {
            Write-OK "Authentification reussie"
        } else {
            Write-Host "  TIME OUT: Lancez manuellement: cloudflared tunnel login" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  Lancez manuellement: cloudflared tunnel login" -ForegroundColor Yellow
    }
}

# ===== Step 3: Creer le tunnel nomme =====
Write-Step "3/5 Creation du tunnel Cloudflare"

if (Test-Path $certPath) {
    try {
        $existing = & cloudflared tunnel list 2>&1 | Select-String "immeit"
        if ($existing) {
            Write-OK "Tunnel 'immeit' existe deja"
        } else {
            Write-Info "Creation du tunnel 'immeit'..."
            & cloudflared tunnel create immeit 2>&1
            Write-OK "Tunnel cree"
        }

        $dnsCheck = & cloudflared tunnel route dns immeit api.immeit.com 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-OK "DNS api.immeit.com -> tunnel"
        } else {
            Write-Info "DNS peut deja exister ou domaine non sur Cloudflare: $dnsCheck"
        }

        $credFile = Get-ChildItem "$env:USERPROFILE\.cloudflared\*.json" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($credFile) {
            @"
tunnel: immeit
credentials-file: $($credFile.FullName)
ingress:
  - hostname: api.immeit.com
    service: http://localhost:3001
  - service: http_status:404
"@ | Set-Content -Path "$ServerDir\cloudflared.yml" -Force
            Write-OK "Config tunnel creee: server\cloudflared.yml"
        }
    } catch {
        Write-Info "Erreur creation tunnel: $_"
        Write-Info "Le tunnel rapide sera utilise a la place"
    }
} else {
    Write-Info "Cloudflare non authentifie - utilisation du tunnel rapide"
    Write-Info "Pour une URL stable plus tard: cloudflared tunnel login"
}

# ===== Step 4: Installer le demarrage auto =====
Write-Step "4/5 Installation du demarrage automatique"

try {
    $taskName = "IMMEIT Server"
    $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existing) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    }

    $startupScript = "$ServerDir\start-immeit.ps1"
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startupScript`""
    $trigger = New-ScheduledTaskTrigger -AtStartup -RandomDelay (New-TimeSpan -Minutes 1)
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Limited

    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Write-OK "Tache planifiee creee: $taskName"
    Write-OK "Le serveur demarrera automatiquement au prochain boot"
} catch {
    Write-Info "Erreur Task Scheduler: $_"
    Write-Info "Methode alternative: copie dans le dossier Startup..."

    $startupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $shortcutPath = "$startupDir\IMMEIT Server.lnk"
    $wshell = New-Object -ComObject WScript.Shell
    $shortcut = $wshell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ServerDir\start-immeit.ps1`""
    $shortcut.WorkingDirectory = $ServerDir
    $shortcut.Save()
    Write-OK "Raccourci Startup cree"
}

# ===== Step 5: Demarrer maintenant =====
Write-Step "5/5 Demarrage du serveur"

& "$ServerDir\start-immeit.ps1"

Write-Host @"

╔══════════════════════════════════════════════╗
║          CONFIGURATION TERMINEE              ║
║                                              ║
║  Pour la messagerie:                         ║
║  - Le serveur demarre automatiquement         ║
║  - Le tunnel se reconnecte automatiquement    ║
║  - Le formulaire s'auto-decouvre              ║
║                                              ║
║  Commandes utiles:                            ║
║  server\start-immeit.ps1     Demarrer         ║
║  server\start-immeit.ps1 -Install  Installer  ║
║  server\setup-immeit.ps1     Config complete  ║
╚══════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
