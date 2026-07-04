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

$subscriberId = $input["subscriber_id"] ?? null;
$action = $input["action"] ?? "";

if (!$subscriberId || !$action) {
    send_json([
        "success" => false,
        "message" => "ID-ul utilizatorului și acțiunea sunt obligatorii."
    ]);
}

if (!in_array($action, ["deactivate", "reactivate"])) {
    send_json([
        "success" => false,
        "message" => "Acțiune invalidă."
    ]);
}

$checkSql = "
    SELECT id, role
    FROM Subscribers
    WHERE id = ?
";

$checkStmt = sqlsrv_query($conn, $checkSql, [$subscriberId]);

if ($checkStmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea utilizatorului.",
        "details" => sqlsrv_errors()
    ]);
}

$user = sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC);

if (!$user) {
    send_json([
        "success" => false,
        "message" => "Utilizatorul nu există."
    ]);
}

if (($user["role"] ?? "user") === "admin") {
    send_json([
        "success" => false,
        "message" => "Conturile de administrator nu pot fi dezactivate de aici."
    ]);
}

$newRole = $action === "deactivate" ? "disabled" : "user";

$updateSql = "
    UPDATE Subscribers
    SET role = ?
    WHERE id = ?
";

$stmt = sqlsrv_query($conn, $updateSql, [$newRole, $subscriberId]);

if ($stmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la actualizarea statusului contului.",
        "details" => sqlsrv_errors()
    ]);
}

send_json([
    "success" => true,
    "message" => $action === "deactivate"
        ? "Contul a fost dezactivat cu succes."
        : "Contul a fost reactivat cu succes."
]);
?>