<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

$name = trim($input['name'] ?? $input['prenom'] . ' ' . $input['nom'] ?? '');
$prenom = trim($input['prenom'] ?? '');
$nom = trim($input['nom'] ?? '');
$email = trim($input['email'] ?? '');
$subject = trim($input['subject'] ?? 'Nouveau message IMMEIT');
$message = trim($input['message'] ?? '');

if (!$name || strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Nom invalide']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

if (strlen($message) < 10) {
    http_response_code(400);
    echo json_encode(['error' => 'Message trop court']);
    exit;
}

$to = 'demandes-p2m@immeit.com';
$headers = "From: $name <$email>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$body = "Nom : $name\n";
$body .= "Email : $email\n\n";
$body .= "Message :\n$message\n";

$success = mail($to, $subject, $body, $headers);

if ($success) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => "Échec de l'envoi"]);
}
