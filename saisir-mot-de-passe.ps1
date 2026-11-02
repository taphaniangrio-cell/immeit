# Fenetre de saisie du mot de passe de la boite mail. Il est d'abord verifie aupres du serveur d'AMEN,
# puis envoye chez Cloudflare s'il est accepte. Il n'est ni affiche, ni journalise, ni ecrit sur le disque.
param([string]$Boite = 'demandes-p2m@immeit.com', [int]$MaxEssais = 3)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()

$SmtpHost = 'smtp-fr.securemail.pro'
$e = [string][char]0xE9
$utf8 = New-Object Text.UTF8Encoding($false)
function ConvertTo-B64([string]$text) { [Convert]::ToBase64String($utf8.GetBytes($text)) }

function Read-SmtpCode($reader) {
  while ($true) {
    $line = $reader.ReadLine()
    if ($null -eq $line) { return 0 }
    if ($line -match '^\d{3}( |$)') { return [int]$line.Substring(0, 3) }
  }
}

# Renvoie le code du serveur : 235 accepte, 535 refuse, 0 serveur injoignable
function Test-SmtpLogin([string]$user, [string]$password, [string]$method) {
  $client = New-Object Net.Sockets.TcpClient
  try {
    $wait = $client.BeginConnect($SmtpHost, 465, $null, $null)
    if (-not $wait.AsyncWaitHandle.WaitOne(10000)) { return 0 }
    $client.EndConnect($wait)
    $ssl = New-Object Net.Security.SslStream($client.GetStream(), $false)
    $ssl.AuthenticateAsClient($SmtpHost)
    $ssl.ReadTimeout = 15000
    $reader = New-Object IO.StreamReader($ssl, [Text.Encoding]::ASCII)
    $writer = New-Object IO.StreamWriter($ssl, [Text.Encoding]::ASCII)
    $writer.NewLine = "`r`n"
    $writer.AutoFlush = $true
    if ((Read-SmtpCode $reader) -ne 220) { return 0 }
    $writer.WriteLine('EHLO immeit-verification')
    if ((Read-SmtpCode $reader) -ne 250) { return 0 }
    if ($method -eq 'PLAIN') {
      $writer.WriteLine('AUTH PLAIN ' + (ConvertTo-B64 ("`0" + $user + "`0" + $password)))
      $code = Read-SmtpCode $reader
    } else {
      $writer.WriteLine('AUTH LOGIN')
      if ((Read-SmtpCode $reader) -ne 334) { return 0 }
      $writer.WriteLine((ConvertTo-B64 $user))
      if ((Read-SmtpCode $reader) -ne 334) { return 0 }
      $writer.WriteLine((ConvertTo-B64 $password))
      $code = Read-SmtpCode $reader
    }
    $writer.WriteLine('QUIT')
    return $code
  } catch {
    return 0
  } finally {
    $client.Close()
  }
}

$form = New-Object Windows.Forms.Form
$form.Text = 'IMMEIT - Formulaire de contact'
$form.Size = New-Object Drawing.Size(540, 350)
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.Font = New-Object Drawing.Font('Segoe UI', 10)

$label = New-Object Windows.Forms.Label
$label.Text = "Adresse de la bo$([char]0xEE)te mail dont tu connais le mot de passe :"
$label.Location = New-Object Drawing.Point(20, 14)
$label.Size = New-Object Drawing.Size(485, 24)
$form.Controls.Add($label)

$adresse = New-Object Windows.Forms.TextBox
$adresse.Text = $Boite
$adresse.Location = New-Object Drawing.Point(20, 40)
$adresse.Size = New-Object Drawing.Size(485, 30)
$form.Controls.Add($adresse)

$labelMotDePasse = New-Object Windows.Forms.Label
$labelMotDePasse.Text = 'Mot de passe de cette adresse :'
$labelMotDePasse.Location = New-Object Drawing.Point(20, 78)
$labelMotDePasse.Size = New-Object Drawing.Size(485, 24)
$form.Controls.Add($labelMotDePasse)

$champ = New-Object Windows.Forms.TextBox
$champ.UseSystemPasswordChar = $true
$champ.Location = New-Object Drawing.Point(20, 104)
$champ.Size = New-Object Drawing.Size(485, 30)
$form.Controls.Add($champ)

$note = New-Object Windows.Forms.Label
$note.Location = New-Object Drawing.Point(20, 144)
$note.Size = New-Object Drawing.Size(485, 76)
$note.Text = "Le mot de passe sera v$($e)rifi$e aupr$([char]0xE8)s d'AMEN avant d'$($([char]0xEA))tre enregistr$e."
$form.Controls.Add($note)

$ok = New-Object Windows.Forms.Button
$ok.Text = 'Enregistrer'
$ok.Location = New-Object Drawing.Point(300, 240)
$ok.Size = New-Object Drawing.Size(110, 36)
$ok.DialogResult = [Windows.Forms.DialogResult]::OK
$form.Controls.Add($ok)
$form.AcceptButton = $ok

$cancel = New-Object Windows.Forms.Button
$cancel.Text = 'Annuler'
$cancel.Location = New-Object Drawing.Point(415, 240)
$cancel.Size = New-Object Drawing.Size(90, 36)
$cancel.DialogResult = [Windows.Forms.DialogResult]::Cancel
$form.Controls.Add($cancel)
$form.CancelButton = $cancel

$form.Add_Shown({ $form.Activate(); $champ.Focus() })

for ($essai = 1; $essai -le $MaxEssais; $essai++) {
  if ($form.ShowDialog() -ne [Windows.Forms.DialogResult]::OK -or -not $champ.Text) {
    Write-Output 'RESULTAT: annule'
    exit 2
  }
  $Boite = $adresse.Text.Trim()
  if ($Boite -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
    $note.ForeColor = [Drawing.Color]::Firebrick
    $note.Text = 'Saisis une adresse mail compl' + [char]0xE8 + 'te, par exemple contact@immeit.com.'
    $essai--
    continue
  }
  $secret = $champ.Text
  $champ.Text = ''
  $login = Test-SmtpLogin $Boite $secret 'LOGIN'
  Write-Output "VERIFICATION: essai $essai, adresse $Boite, AUTH LOGIN = $login"

  if ($login -eq 235) {
    $plain = Test-SmtpLogin $Boite $secret 'PLAIN'
    Write-Output "VERIFICATION: AUTH PLAIN = $plain"
    Set-Location $PSScriptRoot
    $env:WRANGLER_SEND_METRICS = 'false'
    $OutputEncoding = $utf8
    $out = $secret | & '.\node_modules\.bin\wrangler.cmd' secret put MAILBOX_PASSWORD 2>&1 | ForEach-Object { "$_" }
    $code = $LASTEXITCODE
    $secret = $null
    if ($code -eq 0 -and ($out -match 'Success')) {
      Write-Output "RESULTAT: enregistre pour $Boite"
      [void][Windows.Forms.MessageBox]::Show("Mot de passe accept$e par AMEN et enregistr$e.`r`nTu peux revenir sur la conversation.", 'IMMEIT')
      exit 0
    }
    Write-Output "RESULTAT: echec de l'enregistrement (code $code)"
    [void][Windows.Forms.MessageBox]::Show("Mot de passe accept$e, mais l'enregistrement a $($e)chou$e.", 'IMMEIT')
    exit 1
  }

  $secret = $null
  if ($login -eq 0) {
    Write-Output 'RESULTAT: serveur injoignable'
    [void][Windows.Forms.MessageBox]::Show("Le serveur d'AMEN ne r$($e)pond pas. Rien n'a $($e)t$e enregistr$e.", 'IMMEIT')
    exit 3
  }
  $reste = $MaxEssais - $essai
  $note.ForeColor = [Drawing.Color]::Firebrick
  $note.Text = "AMEN refuse ce mot de passe pour $Boite. Rien n'a $($e)t$e enregistr$e.`r`nV$($e)rifie l'adresse et le mot de passe sur webmail.amen.fr. Essais restants : $reste."
}

Write-Output 'RESULTAT: mot de passe refuse'
[void][Windows.Forms.MessageBox]::Show("AMEN a refus$e ce mot de passe. Rien n'a $($e)t$e enregistr$e.", 'IMMEIT')
exit 4
