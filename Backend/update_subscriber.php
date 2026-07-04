<?php
ob_start();

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

include 'db_PA.php';

function send_json($data) {
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($data);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$id = $input["id"] ?? null;
$nume = trim($input["nume"] ?? "");
$email = trim($input["email"] ?? "");
$telefon = trim($input["telefon"] ?? "");

if (!$id || !$nume || !$email || !$telefon) {
    send_json([
        "success" => false,
        "message" => "Toate câmpurile sunt obligatorii."
    ]);
}

$checkEmailSql = "
    SELECT id
    FROM Subscribers
    WHERE email = ?
      AND id <> ?
";

$checkStmt = sqlsrv_query($conn, $checkEmailSql, [$email, $id]);

if ($checkStmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea emailului.",
        "details" => sqlsrv_errors()
    ]);
}

if (sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC)) {
    send_json([
        "success" => false,
        "message" => "Acest email este deja folosit de alt utilizator."
    ]);
}

$updateSql = "
    UPDATE Subscribers
    SET nume = ?,
        email = ?,
        telefon = ?
    WHERE id = ?
";

$stmt = sqlsrv_query($conn, $updateSql, [$nume, $email, $telefon, $id]);

if ($stmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la actualizarea utilizatorului.",
        "details" => sqlsrv_errors()
    ]);
}

send_json([
    "success" => true,
    "message" => "Datele utilizatorului au fost actualizate cu succes."
]);