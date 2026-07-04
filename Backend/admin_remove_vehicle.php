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

if (!$vehicleId) {
    send_json([
        "success" => false,
        "message" => "ID-ul vehiculului este obligatoriu."
    ]);
}

/*
    Nu permitem scoaterea vehiculului dacă este momentan în parcare.
*/
$checkInParkingSql = "
    SELECT id
    FROM AccessLog
    WHERE vehicul_id = ?
      AND data_out IS NULL
      AND status_acces = 'Permis'
";

$inParkingStmt = sqlsrv_query($conn, $checkInParkingSql, [$vehicleId]);

if ($inParkingStmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea statusului vehiculului.",
        "details" => sqlsrv_errors()
    ]);
}

if (sqlsrv_fetch_array($inParkingStmt, SQLSRV_FETCH_ASSOC)) {
    send_json([
        "success" => false,
        "message" => "Vehiculul nu poate fi șters deoarece este momentan în parcare."
    ]);
}

/*
    Nu permitem scoaterea dacă are rezervare activă viitoare sau curentă.
*/
$checkReservationSql = "
    SELECT id
    FROM Reservations
    WHERE vehicle_id = ?
      AND [status] = 'active'
      AND end_time >= GETDATE()
";

$reservationStmt = sqlsrv_query($conn, $checkReservationSql, [$vehicleId]);

if ($reservationStmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea rezervărilor active.",
        "details" => sqlsrv_errors()
    ]);
}

if (sqlsrv_fetch_array($reservationStmt, SQLSRV_FETCH_ASSOC)) {
    send_json([
        "success" => false,
        "message" => "Vehiculul nu poate fi șters deoarece are o rezervare activă."
    ]);
}

/*
    Scoatem vehiculul din contul utilizatorului, dar păstrăm istoricul.
*/
$updateSql = "
    UPDATE Vehicles
    SET abonat_id = NULL,
        tip = 'utilizator'
    WHERE id = ?
";

$stmt = sqlsrv_query($conn, $updateSql, [$vehicleId]);

if ($stmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la ștergerea vehiculului din cont.",
        "details" => sqlsrv_errors()
    ]);
}

send_json([
    "success" => true,
    "message" => "Vehiculul a fost șters din contul utilizatorului."
]);
?>