<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

$prenom  = $_POST['prenom'] ?? '';
$nom     = $_POST['nom'] ?? '';
$email   = $_POST['email'] ?? '';
$sujet   = $_POST['sujet'] ?? 'Nouveau message';
$message = $_POST['message'] ?? '';

if (empty($email) || empty($message)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'Email et message requis']);
  exit;
}

$template = file_get_contents(__DIR__ . '/email_template.html');
if ($template === false) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Template introuvable']);
  exit;
}

$html = str_replace([
  '{{PRENOM}}', '{{NOM}}', '{{EMAIL}}',
  '{{SUJET}}', '{{MESSAGE}}', '{{DATE}}',
  '{{SITE_NOM}}', '{{SITE_URL}}'
], [
  htmlspecialchars($prenom, ENT_QUOTES, 'UTF-8'),
  htmlspecialchars($nom, ENT_QUOTES, 'UTF-8'),
  htmlspecialchars($email, ENT_QUOTES, 'UTF-8'),
  htmlspecialchars($sujet, ENT_QUOTES, 'UTF-8'),
  nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')),
  date('d/m/Y à H:i'),
  'IMMEIT',
  'https://www.immeit.com'
], $template);

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: noreply@immeit.com\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$to      = 'demandes-p2m@immeit.com';
$subject = 'Nouveau message – ' . $sujet;

$sent = mail($to, $subject, $html, $headers);

if ($sent) {
  echo json_encode(['success' => true]);
} else {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'Échec envoi mail']);
}
