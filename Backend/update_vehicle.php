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

$vehicleId = $input["vehicle_id"] ?? null;
$numarInmatriculare = strtoupper(trim($input["numar_inmatriculare"] ?? ""));

if (!$vehicleId || !$numarInmatriculare) {
    send_json([
        "success" => false,
        "message" => "ID-ul vehiculului și numărul de înmatriculare sunt obligatorii."
    ]);
}

$checkSql = "
    SELECT id
    FROM Vehicles
    WHERE numar_inmatriculare = ?
      AND id <> ?
";

$checkStmt = sqlsrv_query($conn, $checkSql, [$numarInmatriculare, $vehicleId]);

if ($checkStmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea numărului de înmatriculare.",
        "details" => sqlsrv_errors()
    ]);
}

if (sqlsrv_fetch_array($checkStmt, SQLSRV_FETCH_ASSOC)) {
    send_json([
        "success" => false,
        "message" => "Acest număr de înmatriculare există deja în sistem."
    ]);
}

$updateSql = "
    UPDATE Vehicles
    SET numar_inmatriculare = ?
    WHERE id = ?
";

$stmt = sqlsrv_query($conn, $updateSql, [$numarInmatriculare, $vehicleId]);

if ($stmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la actualizarea vehiculului.",
        "details" => sqlsrv_errors()
    ]);
}

send_json([
    "success" => true,
    "message" => "Numărul de înmatriculare a fost actualizat cu succes."
]);