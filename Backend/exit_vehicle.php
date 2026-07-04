<?php
ob_start();

date_default_timezone_set("Europe/Bucharest");

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

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

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$plate = "";

if ($data && isset($data["plate"])) {
    $plate = strtoupper(trim($data["plate"]));
} elseif (isset($_POST["plate"])) {
    $plate = strtoupper(trim($_POST["plate"]));
} elseif (isset($_GET["plate"])) {
    $plate = strtoupper(trim($_GET["plate"]));
}

if (!$plate) {
    send_json([
        "success" => false,
        "status" => "lipsa_parametru",
        "message" => "Nu a fost trimis numărul de înmatriculare"
    ]);
}

$sqlVeh = "
    SELECT id, numar_inmatriculare, tip, abonat_id
    FROM Vehicles
    WHERE UPPER(numar_inmatriculare) = ?
";

$stmtVeh = sqlsrv_query($conn, $sqlVeh, [$plate]);

if ($stmtVeh === false) {
    send_json([
        "success" => false,
        "status" => "eroare_cautare_vehicul",
        "message" => "Eroare la interogarea vehiculului",
        "details" => sqlsrv_errors()
    ]);
}

$veh = sqlsrv_fetch_array($stmtVeh, SQLSRV_FETCH_ASSOC);

if (!$veh) {
    send_json([
        "success" => false,
        "status" => "vehicul_inexistent",
        "plate" => $plate,
        "message" => "Vehiculul nu există în baza de date"
    ]);
}

$vehicul_id = $veh["id"];

$sqlAccess = "
    SELECT TOP 1
        al.id,
        al.data_in,
        al.spot_id,
        ps.cod_loc
    FROM AccessLog al
    LEFT JOIN ParkingSpots ps
        ON ps.id = al.spot_id
    WHERE al.vehicul_id = ?
      AND al.data_out IS NULL
      AND al.status_acces = 'Permis'
    ORDER BY al.data_in DESC
";

$stmtAccess = sqlsrv_query($conn, $sqlAccess, [$vehicul_id]);

if ($stmtAccess === false) {
    send_json([
        "success" => false,
        "status" => "eroare_cautare_accesslog",
        "message" => "Eroare la interogarea AccessLog",
        "details" => sqlsrv_errors()
    ]);
}

$access = sqlsrv_fetch_array($stmtAccess, SQLSRV_FETCH_ASSOC);

if (!$access) {
    send_json([
        "success" => false,
        "status" => "acces_inexistent",
        "plate" => $plate,
        "message" => "Vehiculul nu are o intrare activă în parcare"
    ]);
}

$accesslog_id = $access["id"];
$spot_id = $access["spot_id"] ?? null;
$cod_loc = $access["cod_loc"] ?? null;

if (!sqlsrv_begin_transaction($conn)) {
    send_json([
        "success" => false,
        "status" => "eroare_tranzactie",
        "message" => "Nu s-a putut porni tranzacția",
        "details" => sqlsrv_errors()
    ]);
}

$data_out = date("Y-m-d H:i:s");

$sqlUpdateAccess = "
    UPDATE AccessLog
    SET data_out = ?,
        tarif_platit = NULL,
        status_iesire = 'finalizat'
    WHERE id = ?
";

$stmtUpdateAccess = sqlsrv_query($conn, $sqlUpdateAccess, [$data_out, $accesslog_id]);

if ($stmtUpdateAccess === false) {
    sqlsrv_rollback($conn);

    send_json([
        "success" => false,
        "status" => "eroare_update_accesslog",
        "message" => "Nu s-a putut actualiza ieșirea în AccessLog",
        "details" => sqlsrv_errors()
    ]);
}

if ($spot_id) {
    $sqlUpdateSpot = "
        UPDATE ParkingSpots
        SET status = 'liber'
        WHERE id = ?
    ";

    $stmtUpdateSpot = sqlsrv_query($conn, $sqlUpdateSpot, [$spot_id]);

    if ($stmtUpdateSpot === false) {
        sqlsrv_rollback($conn);

        send_json([
            "success" => false,
            "status" => "eroare_eliberare_loc",
            "message" => "Nu s-a putut elibera locul de parcare",
            "details" => sqlsrv_errors()
        ]);
    }

    $sqlCompleteReservation = "
        UPDATE Reservations
        SET [status] = 'completed'
        WHERE vehicle_id = ?
          AND spot_id = ?
          AND [status] = 'active'
          AND start_time <= GETDATE()
          AND end_time >= GETDATE()
    ";

    $stmtCompleteReservation = sqlsrv_query(
        $conn,
        $sqlCompleteReservation,
        [$vehicul_id, $spot_id]
    );

    if ($stmtCompleteReservation === false) {
        sqlsrv_rollback($conn);

        send_json([
            "success" => false,
            "status" => "eroare_finalizare_rezervare",
            "message" => "Nu s-a putut finaliza rezervarea activă",
            "details" => sqlsrv_errors()
        ]);
    }
}

sqlsrv_commit($conn);

$dataIn = $access["data_in"] instanceof DateTime
    ? $access["data_in"]->format("Y-m-d H:i:s")
    : $access["data_in"];

send_json([
    "success" => true,
    "status" => "ok",
    "plate" => $plate,
    "vehicul_id" => $vehicul_id,
    "accesslog_id" => $accesslog_id,
    "message" => "Ieșirea vehiculului a fost înregistrată cu succes",
    "data_in" => $dataIn,
    "data_out" => $data_out,
    "spot_id" => $spot_id,
    "cod_loc" => $cod_loc
]);
?>



