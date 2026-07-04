<?php
ob_start();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

ini_set("display_errors", 0);
error_reporting(E_ALL);

include("db_PA.php");

function send_json($data) {
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($data);
    exit;
}

$sqlTotal = "
    SELECT COUNT(*) AS total
    FROM ParkingSpots
";

$stmtTotal = sqlsrv_query($conn, $sqlTotal);

if ($stmtTotal === false) {
    send_json([
        "success" => false,
        "status" => "eroare_total_locuri",
        "details" => sqlsrv_errors()
    ]);
}

$rowTotal = sqlsrv_fetch_array($stmtTotal, SQLSRV_FETCH_ASSOC);
$totalLocuri = intval($rowTotal["total"] ?? 0);

$sqlOcupate = "
    SELECT COUNT(*) AS ocupate
    FROM ParkingSpots
    WHERE status = 'ocupat'
";

$stmtOcupate = sqlsrv_query($conn, $sqlOcupate);

if ($stmtOcupate === false) {
    send_json([
        "success" => false,
        "status" => "eroare_locuri_ocupate",
        "details" => sqlsrv_errors()
    ]);
}

$rowOcupate = sqlsrv_fetch_array($stmtOcupate, SQLSRV_FETCH_ASSOC);
$locuriOcupate = intval($rowOcupate["ocupate"] ?? 0);

$sqlRezervate = "
    SELECT COUNT(DISTINCT r.spot_id) AS rezervate
    FROM Reservations r
    INNER JOIN ParkingSpots ps
        ON ps.id = r.spot_id
    WHERE r.[status] = 'active'
      AND r.start_time <= GETDATE()
      AND r.end_time >= GETDATE()
      AND ps.status <> 'ocupat'
";

$stmtRezervate = sqlsrv_query($conn, $sqlRezervate);

if ($stmtRezervate === false) {
    send_json([
        "success" => false,
        "status" => "eroare_locuri_rezervate",
        "details" => sqlsrv_errors()
    ]);
}

$rowRezervate = sqlsrv_fetch_array($stmtRezervate, SQLSRV_FETCH_ASSOC);
$locuriRezervate = intval($rowRezervate["rezervate"] ?? 0);

$locuriDisponibile = $totalLocuri - $locuriOcupate - $locuriRezervate;

if ($locuriDisponibile < 0) {
    $locuriDisponibile = 0;
}

send_json([
    "success" => true,
    "nr_total_locuri" => $totalLocuri,
    "locuri_ocupate" => $locuriOcupate,
    "locuri_rezervate" => $locuriRezervate,
    "locuri_disponibile" => $locuriDisponibile
]);
?>