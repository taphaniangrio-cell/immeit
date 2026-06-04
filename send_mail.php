<?php
/**
 * IMMEIT - Script d'envoi de mail HTML formaté
 * Version pérenne : le template HTML est intégré directement dans ce fichier.
 * Dépose ce fichier sur ton serveur et ne le modifie plus.
 *
 * CONFIGURATION : modifie uniquement la section CONFIG ci-dessous.
 */

// ============================================================
//  CONFIG — à adapter à ton hébergeur
// ============================================================
define('MAIL_TO',      'demandes-p2m@immeit.com');   // Email de réception
define('MAIL_FROM',    'noreply@immeit.com');          // Expéditeur (doit exister sur ton hébergeur)
define('MAIL_SUBJECT_PREFIX', '[IMMEIT - Demande]');  // Préfixe du sujet
define('ALLOWED_ORIGIN', 'https://www.immeit.com');   // Ton domaine (anti-CSRF)
// ============================================================

// ---- Sécurité de base ----
header('Content-Type: application/json; charset=utf-8');

// Vérification de l'origine (anti-spam basique)
$origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if (!str_contains($origin, 'immeit.com') && !empty($origin)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Origine non autorisée.']);
    exit;
}

// Vérification méthode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
    exit;
}

// ---- Récupération et nettoyage des champs ----
function clean(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$prenom    = clean($_POST['prenom']     ?? '');
$nom       = clean($_POST['nom']        ?? '');
$email     = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$telephone = clean($_POST['telephone']  ?? '');
$sujet     = clean($_POST['sujet']      ?? '');
$message   = clean($_POST['message']    ?? '');

// ---- Validation ----
$errors = [];
if (empty($prenom))                         $errors[] = 'Le prénom est requis.';
if (empty($nom))                            $errors[] = 'Le nom est requis.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Adresse e-mail invalide.';
if (empty($sujet))                          $errors[] = 'Le sujet est requis.';
if (empty($message))                        $errors[] = 'Le message est requis.';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ---- Construction du sujet ----
$mailSubject = MAIL_SUBJECT_PREFIX . ' ' . $sujet . ' — ' . $prenom . ' ' . $nom;

// ---- Date & heure ----
date_default_timezone_set('Africa/Dakar');
$dateEnvoi = date('d/m/Y à H:i');

// ---- Template HTML du mail (intégré directement = jamais perdu) ----
$messageHtml = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau message – IMMEIT</title>
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; outline:none; text-decoration:none; }

    body {
      margin: 0; padding: 0;
      background-color: #f0f2f5;
      font-family: 'Segoe UI', Arial, sans-serif;
    }

    /* Conteneur principal */
    .wrapper {
      width: 100%;
      background-color: #f0f2f5;
      padding: 40px 0;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #111927 0%, #1e3a5f 100%);
      padding: 36px 40px 28px 40px;
      text-align: center;
    }
    .header-logo {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .header-tagline {
      font-size: 11px;
      color: #8fa8c8;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .header-badge {
      display: inline-block;
      margin-top: 16px;
      background-color: #e8a000;
      color: #111927;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 20px;
    }

    /* Corps */
    .body {
      padding: 36px 40px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #111927;
      margin: 0 0 6px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #6b7a90;
      margin: 0 0 28px 0;
    }

    /* Bloc info */
    .info-block {
      background-color: #f8f9fb;
      border-left: 4px solid #e8a000;
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
    }
    .info-label {
      font-size: 11px;
      font-weight: 700;
      color: #6b7a90;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      min-width: 90px;
      padding-top: 2px;
    }
    .info-value {
      font-size: 14px;
      color: #111927;
      font-weight: 600;
    }
    .info-value a {
      color: #1e3a5f;
      text-decoration: none;
    }

    /* Bloc message */
    .message-block {
      background-color: #f8f9fb;
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }
    .message-label {
      font-size: 11px;
      font-weight: 700;
      color: #6b7a90;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }
    .message-text {
      font-size: 14px;
      color: #2c3e50;
      line-height: 1.75;
      white-space: pre-wrap;
    }

    /* CTA */
    .cta-block {
      text-align: center;
      margin-bottom: 28px;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #111927 0%, #1e3a5f 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 13px 32px;
      border-radius: 8px;
    }

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid #e8ecf0;
      margin: 0 0 24px 0;
    }

    /* Footer */
    .footer {
      background-color: #111927;
      padding: 24px 40px;
      text-align: center;
    }
    .footer-brand {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 2px;
    }
    .footer-text {
      font-size: 11px;
      color: #6b7a90;
      margin-top: 6px;
      line-height: 1.6;
    }
    .footer-meta {
      font-size: 10px;
      color: #3d4f63;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <!-- HEADER -->
      <div class="header">
        <div class="header-logo">IMMEIT</div>
        <div class="header-tagline">Installation · Méthodes · Maintenance</div>
        <div class="header-badge">📩 Nouveau message reçu</div>
      </div>

      <!-- CORPS -->
      <div class="body">
        <p class="title">Un visiteur vous a contacté</p>
        <p class="subtitle">Message reçu le {DATE} depuis le formulaire de contact.</p>

        <!-- Infos expéditeur -->
        <div class="info-block">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="info-label">Nom</td>
              <td class="info-value">{PRENOM} {NOM}</td>
            </tr>
            <tr>
              <td class="info-label" style="padding-top:8px;">Email</td>
              <td class="info-value" style="padding-top:8px;">
                <a href="mailto:{EMAIL}">{EMAIL}</a>
              </td>
            </tr>
            {TELEPHONE}
            <tr>
              <td class="info-label" style="padding-top:8px;">Sujet</td>
              <td class="info-value" style="padding-top:8px;">{SUJET}</td>
            </tr>
          </table>
        </div>

        <!-- Message -->
        <div class="message-block">
          <div class="message-label">💬 Message</div>
          <div class="message-text">{MESSAGE}</div>
        </div>

        <!-- CTA répondre -->
        <div class="cta-block">
          <a href="mailto:{EMAIL}?subject=Re: {SUJET}" class="cta-btn">
            Répondre à {PRENOM}
          </a>
        </div>

        <hr class="divider">

        <p style="font-size:12px; color:#9aa5b4; text-align:center; margin:0;">
          Ce message a été envoyé depuis le formulaire de contact de
          <a href="https://www.immeit.com" style="color:#1e3a5f;">www.immeit.com</a>
        </p>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div class="footer-brand">IMMEIT</div>
        <div class="footer-text">
          Cité Safco Niacoulrab, Villa N°40, Keur Massar — Dakar, Sénégal<br>
          +221 71 033 88 09 &nbsp;|&nbsp; +33 7 54 01 19 45
        </div>
        <div class="footer-meta">© 2026 IMMEIT — Tous droits réservés</div>
      </div>

    </div>
  </div>
</body>
</html>
HTML;

// ---- Injection des variables dans le template ----
$telephoneRow = $telephone
    ? '<tr><td class="info-label" style="padding-top:8px;">Téléphone</td><td class="info-value" style="padding-top:8px;"><a href="tel:' . $telephone . '">' . $telephone . '</a></td></tr>'
    : '';
$messageHtml = str_replace(
    ['{DATE}', '{PRENOM}', '{NOM}', '{EMAIL}', '{TELEPHONE}', '{SUJET}', '{MESSAGE}'],
    [$dateEnvoi, $prenom, $nom, $email, $telephoneRow, $sujet, nl2br($message)],
    $messageHtml
);

// ---- En-têtes mail (HTML obligatoire) ----
$boundary = '----=_IMMEIT_' . md5(uniqid(rand(), true));

$headers  = "From: IMMEIT Contact <" . MAIL_FROM . ">\r\n";
$headers .= "Reply-To: {$prenom} {$nom} <{$email}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "X-Priority: 1\r\n";

// ---- Envoi ----
$sent = mail(MAIL_TO, '=?UTF-8?B?' . base64_encode($mailSubject) . '?=', $messageHtml, $headers);

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Votre message a bien été envoyé. Nous vous répondrons sous 24h.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Une erreur est survenue lors de l\'envoi. Merci de réessayer ou de nous contacter directement.'
    ]);
}
