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

$abonatId = $input["abonat_id"] ?? null;
$numarInmatriculare = strtoupper(trim($input["numar_inmatriculare"] ?? ""));

if (!$abonatId || !$numarInmatriculare) {
    send_json([
        "success" => false,
        "message" => "ID-ul utilizatorului și numărul de înmatriculare sunt obligatorii."
    ]);
}

$checkSubscriberSql = "
    SELECT id
    FROM Subscribers
    WHERE id = ?
";

$subscriberStmt = sqlsrv_query($conn, $checkSubscriberSql, [$abonatId]);

if ($subscriberStmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea utilizatorului.",
        "details" => sqlsrv_errors()
    ]);
}

if (!sqlsrv_fetch_array($subscriberStmt, SQLSRV_FETCH_ASSOC)) {
    send_json([
        "success" => false,
        "message" => "Utilizatorul nu există."
    ]);
}

$checkVehicleSql = "
    SELECT id
    FROM Vehicles
    WHERE numar_inmatriculare = ?
";

$vehicleStmt = sqlsrv_query($conn, $checkVehicleSql, [$numarInmatriculare]);

if ($vehicleStmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea vehiculului.",
        "details" => sqlsrv_errors()
    ]);
}

if (sqlsrv_fetch_array($vehicleStmt, SQLSRV_FETCH_ASSOC)) {
    send_json([
        "success" => false,
        "message" => "Acest număr de înmatriculare există deja în sistem."
    ]);
}

$insertSql = "
    INSERT INTO Vehicles (numar_inmatriculare, tip, abonat_id)
    VALUES (?, 'utilizator', ?)
";

$stmt = sqlsrv_query($conn, $insertSql, [$numarInmatriculare, $abonatId]);

if ($stmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la adăugarea vehiculului.",
        "details" => sqlsrv_errors()
    ]);
}

send_json([
    "success" => true,
    "message" => "Vehiculul a fost adăugat cu succes."
]);