<?php
ob_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$abonat_id = $_GET['abonat_id'] ?? null;

if (!$abonat_id) {
    send_json([
        "success" => false,
        "message" => "Lipsește abonat_id"
    ]);
}

$expireSql = "
    UPDATE Reservations
    SET [status] = 'expired'
    WHERE [status] = 'active'
    AND end_time < GETDATE()
";

$expireQuery = sqlsrv_query($conn, $expireSql);

if ($expireQuery === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la actualizarea rezervărilor expirate",
        "details" => sqlsrv_errors()
    ]);
}

$freeSpotsSql = "
    UPDATE ps
    SET ps.[status] = 'liber'
    FROM ParkingSpots ps
    WHERE ps.[status] = 'rezervat'
    AND NOT EXISTS (
        SELECT 1
        FROM Reservations r
        WHERE r.spot_id = ps.id
        AND r.[status] = 'active'
    )
";

$freeSpotsQuery = sqlsrv_query($conn, $freeSpotsSql);

if ($freeSpotsQuery === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la eliberarea locurilor",
        "details" => sqlsrv_errors()
    ]);
}

$sql = "
    SELECT
        r.id AS reservation_id,
        r.start_time,
        r.end_time,
        r.[status] AS reservation_status,
        r.created_at,

        v.numar_inmatriculare,
        ps.cod_loc,

        p.id AS payment_id,
        p.cod_bare,
        p.suma,
        p.achitat,
        p.metoda_plata,
        p.tip_plata,
        p.data_plata
    FROM Reservations r
    INNER JOIN Vehicles v ON r.vehicle_id = v.id
    INNER JOIN ParkingSpots ps ON r.spot_id = ps.id
    LEFT JOIN Payments p ON p.reservation_id = r.id
    WHERE v.abonat_id = ?
    ORDER BY r.created_at DESC
";

$params = [$abonat_id];
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea rezervărilor utilizatorului",
        "details" => sqlsrv_errors()
    ]);
}

$reservations = [];

while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $reservations[] = [
        "reservation_id" => $row["reservation_id"],

        "start_time" => $row["start_time"] instanceof DateTime
            ? $row["start_time"]->format("Y-m-d H:i")
            : $row["start_time"],

        "end_time" => $row["end_time"] instanceof DateTime
            ? $row["end_time"]->format("Y-m-d H:i")
            : $row["end_time"],

        "reservation_status" => $row["reservation_status"],

        "created_at" => $row["created_at"] instanceof DateTime
            ? $row["created_at"]->format("Y-m-d H:i")
            : $row["created_at"],

        "numar_inmatriculare" => $row["numar_inmatriculare"],
        "cod_loc" => $row["cod_loc"],

        "payment_id" => $row["payment_id"],
        "cod_bare" => $row["cod_bare"],
        "suma" => $row["suma"],
        "achitat" => $row["achitat"],
        "metoda_plata" => $row["metoda_plata"],
        "tip_plata" => $row["tip_plata"],

        "data_plata" => $row["data_plata"] instanceof DateTime
            ? $row["data_plata"]->format("Y-m-d")
            : $row["data_plata"]
    ];
}

send_json([
    "success" => true,
    "reservations" => $reservations
]);
?>