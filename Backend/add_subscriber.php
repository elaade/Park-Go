<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "success" => false,
        "error" => "Aceasta resursă acceptă doar cereri POST."
    ]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (
    !$data ||
    !isset($data['nume'], $data['email'], $data['telefon'], $data['parola']) ||
    empty(trim($data['nume'])) ||
    empty(trim($data['email'])) ||
    empty(trim($data['telefon'])) ||
    empty(trim($data['parola']))
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Datele sunt incomplete"
    ]);
    exit;
}

include 'db_PA.php';

$sqlEmail = "SELECT id FROM Subscribers WHERE email = ?";
$stmtEmail = sqlsrv_query($conn, $sqlEmail, [$data['email']]);

if ($stmtEmail && sqlsrv_fetch_array($stmtEmail)) {
    echo json_encode([
        "success" => false,
        "error" => "Există deja un cont cu acest email."
    ]);
    exit;
}

$hashedPassword = password_hash($data['parola'], PASSWORD_DEFAULT);

$sql = "INSERT INTO Subscribers (nume, email, telefon, parola) 
        OUTPUT INSERTED.id 
        VALUES (?, ?, ?, ?)";

$params = [
    trim($data['nume']),
    trim($data['email']),
    trim($data['telefon']),
    $hashedPassword
];

$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Eroare la salvare cont",
        "details" => sqlsrv_errors()
    ]);
    exit;
}

$row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
$user_id = $row['id'];

echo json_encode([
    "success" => true,
    "message" => "Cont creat cu succes",
    "user_id" => $user_id
]);
?>







