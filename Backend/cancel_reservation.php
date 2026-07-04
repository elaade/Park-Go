<?php
ob_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

ini_set('display_errors', 0);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db_PA.php";

function send_json($data) {
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($data);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$reservation_id = $data["reservation_id"] ?? null;
$abonat_id = $data["abonat_id"] ?? null;

if (!$reservation_id || !$abonat_id) {
    send_json([
        "success" => false,
        "message" => "Date lipsă pentru anularea rezervării"
    ]);
}

$checkSql = "
    SELECT
        r.id,
        r.spot_id,
        r.start_time,
        r.end_time,
        r.[status],
        ps.cod_loc
    FROM Reservations r
    INNER JOIN Vehicles v ON r.vehicle_id = v.id
    INNER JOIN ParkingSpots ps ON r.spot_id = ps.id
    WHERE r.id = ?
    AND v.abonat_id = ?
";

$checkParams = [$reservation_id, $abonat_id];
$checkQuery = sqlsrv_query($conn, $checkSql, $checkParams);

if ($checkQuery === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea rezervării",
        "details" => sqlsrv_errors()
    ]);
}

$reservation = sqlsrv_fetch_array($checkQuery, SQLSRV_FETCH_ASSOC);

if (!$reservation) {
    send_json([
        "success" => false,
        "message" => "Rezervarea nu există sau nu aparține acestui utilizator"
    ]);
}

if ($reservation["status"] === "cancelled") {
    send_json([
        "success" => false,
        "message" => "Rezervarea este deja anulată"
    ]);
}

if ($reservation["status"] === "expired") {
    send_json([
        "success" => false,
        "message" => "Rezervarea este expirată și nu mai poate fi anulată"
    ]);
}

$startTime = $reservation["start_time"];

if ($startTime instanceof DateTime) {
    $now = new DateTime();

    if ($startTime <= $now) {
        send_json([
            "success" => false,
            "message" => "Rezervarea a început deja și nu mai poate fi anulată"
        ]);
    }
}

$spot_id = $reservation["spot_id"];
$cod_loc = $reservation["cod_loc"];

sqlsrv_begin_transaction($conn);

$updateReservationSql = "
    UPDATE Reservations
    SET [status] = 'cancelled'
    WHERE id = ?
";

$updateReservationQuery = sqlsrv_query($conn, $updateReservationSql, [$reservation_id]);

if ($updateReservationQuery === false) {
    sqlsrv_rollback($conn);

    send_json([
        "success" => false,
        "message" => "Eroare la anularea rezervării",
        "details" => sqlsrv_errors()
    ]);
}

$updateSpotSql = "
    UPDATE ParkingSpots
    SET [status] = 'liber'
    WHERE id = ?
    AND NOT EXISTS (
        SELECT 1
        FROM Reservations
        WHERE spot_id = ?
        AND [status] = 'active'
        AND id <> ?
    )
";

$updateSpotParams = [$spot_id, $spot_id, $reservation_id];
$updateSpotQuery = sqlsrv_query($conn, $updateSpotSql, $updateSpotParams);

if ($updateSpotQuery === false) {
    sqlsrv_rollback($conn);

    send_json([
        "success" => false,
        "message" => "Rezervarea a fost anulată, dar locul nu a putut fi eliberat",
        "details" => sqlsrv_errors()
    ]);
}

sqlsrv_commit($conn);

send_json([
    "success" => true,
    "message" => "Rezervarea pentru locul " . $cod_loc . " a fost anulată cu succes."
]);
?>