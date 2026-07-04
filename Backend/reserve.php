<?php
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

$vehicle_id = $data['vehicle_id'] ?? null;
$start_time = $data['start_time'] ?? null;
$end_time = $data['end_time'] ?? null;
$metoda_plata = $data['metoda_plata'] ?? 'card_simulat';

if (!$vehicle_id || !$start_time || !$end_time) {
    send_json([
        "success" => false,
        "message" => "Date lipsă pentru rezervare"
    ]);
}

function calculeaza_suma_rezervare($start_time, $end_time) {
    $start = new DateTime($start_time);
    $end = new DateTime($end_time);

    if ($start >= $end) {
        return [
            "zile" => 0,
            "suma" => 0
        ];
    }

    $diffSeconds = $end->getTimestamp() - $start->getTimestamp();
    $zile = ceil($diffSeconds / (60 * 60 * 24));

    if ($zile < 1) {
        $zile = 1;
    }

    $tarife = [
        1 => 35,
        2 => 65,
        3 => 90,
        4 => 115,
        5 => 140,
        6 => 165,
        7 => 185,
        8 => 205,
        9 => 225,
        10 => 245,
        11 => 265,
        12 => 285,
        13 => 305,
        14 => 320
    ];

    if ($zile > 14) {
        send_json([
            "success" => false,
            "message" => "Rezervarea nu poate depăși 14 zile."
        ]);
    }

    if (!isset($tarife[$zile])) {
        send_json([
            "success" => false,
            "message" => "Nu există tarif definit pentru această durată."
        ]);
    }

    $suma = $tarife[$zile];

    return [
        "zile" => $zile,
        "suma" => $suma
    ];
}

$calcul = calculeaza_suma_rezervare($start_time, $end_time);
$zile_calculate = $calcul["zile"];
$suma_calculata = $calcul["suma"];

if ($zile_calculate <= 0 || $suma_calculata <= 0) {
    send_json([
        "success" => false,
        "message" => "Intervalul rezervării este invalid"
    ]);
}

$suma_finala = $suma_calculata;

$spotSql = "
    SELECT TOP 1 id, cod_loc
    FROM ParkingSpots
    WHERE [status] = 'liber'
    ORDER BY id ASC
";

$spotQuery = sqlsrv_query($conn, $spotSql);

if ($spotQuery === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la căutarea locului liber",
        "details" => sqlsrv_errors()
    ]);
}

$spot = sqlsrv_fetch_array($spotQuery, SQLSRV_FETCH_ASSOC);

if (!$spot) {
    send_json([
        "success" => false,
        "message" => "Nu există locuri libere"
    ]);
}

$spot_id = $spot['id'];
$cod_loc = $spot['cod_loc'];

$checkSql = "
    SELECT COUNT(*) AS cnt
    FROM Reservations
    WHERE spot_id = ?
    AND [status] = 'active'
    AND start_time < CAST(? AS datetime)
    AND end_time > CAST(? AS datetime)
";

$checkParams = [$spot_id, $end_time, $start_time];

$checkQuery = sqlsrv_query($conn, $checkSql, $checkParams);

if ($checkQuery === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la verificarea suprapunerilor",
        "details" => sqlsrv_errors()
    ]);
}

$result = sqlsrv_fetch_array($checkQuery, SQLSRV_FETCH_ASSOC);

if ($result['cnt'] > 0) {
    send_json([
        "success" => false,
        "message" => "Loc ocupat în interval"
    ]);
}

$insertSql = "
    INSERT INTO Reservations
    (vehicle_id, spot_id, start_time, end_time, [status])
    OUTPUT INSERTED.id
    VALUES (?, ?, CAST(? AS datetime), CAST(? AS datetime), 'active')
";

$insertParams = [$vehicle_id, $spot_id, $start_time, $end_time];

$insertQuery = sqlsrv_query($conn, $insertSql, $insertParams);

if ($insertQuery === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la crearea rezervării",
        "details" => sqlsrv_errors()
    ]);
}

$reservationRow = sqlsrv_fetch_array($insertQuery, SQLSRV_FETCH_ASSOC);

if (!$reservationRow || !isset($reservationRow['id'])) {
    send_json([
        "success" => false,
        "message" => "Rezervarea a fost creată, dar ID-ul nu a putut fi preluat"
    ]);
}

$reservation_id = $reservationRow['id'];

try {
    $cod_bare = "RES-" . date("Ymd") . "-" . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
} catch (Exception $e) {
    $cod_bare = "RES-" . date("Ymd") . "-" . strtoupper(substr(str_replace("-", "", uniqid()), 0, 8));
}

$paymentSql = "
    INSERT INTO Payments
    (cod_bare, vehicul_id, suma, data_plata, reservation_id, subscription_id, tip_plata, metoda_plata, achitat)
    VALUES (?, ?, ?, CAST(GETDATE() AS date), ?, NULL, 'rezervare', ?, 1)
";

$paymentParams = [
    $cod_bare,
    $vehicle_id,
    $suma_finala,
    $reservation_id,
    $metoda_plata
];

$paymentQuery = sqlsrv_query($conn, $paymentSql, $paymentParams);

if ($paymentQuery === false) {
    send_json([
        "success" => false,
        "message" => "Rezervarea a fost creată, dar plata nu a fost salvată",
        "details" => sqlsrv_errors()
    ]);
}

$updateSql = "
    UPDATE ParkingSpots
    SET [status] = 'rezervat'
    WHERE id = ?
";

$updateParams = [$spot_id];

$updateQuery = sqlsrv_query($conn, $updateSql, $updateParams);

if ($updateQuery === false) {
    send_json([
        "success" => false,
        "message" => "Rezervarea și plata au fost create, dar locul nu a fost actualizat",
        "details" => sqlsrv_errors()
    ]);
}

send_json([
    "success" => true,
    "message" => "Plată efectuată și rezervare creată pentru locul " . $cod_loc . ". Total: " . $suma_finala . " lei.",
    "spot" => $cod_loc,
    "suma" => $suma_finala,
    "zile" => $zile_calculate,
    "cod_bare" => $cod_bare,
    "reservation_id" => $reservation_id
]);
?>