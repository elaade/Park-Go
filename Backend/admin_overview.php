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

/* Actualizează rezervările expirate */
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

/* Eliberează locurile fără rezervări active în prezent */
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
        AND r.start_time <= GETDATE()
        AND r.end_time >= GETDATE()
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

/* Funcție pentru citirea mai multor rezultate */
function fetch_all($conn, $sql, $params = []) {
    $stmt = sqlsrv_query($conn, $sql, $params);

    if ($stmt === false) {
        return [
            "error" => true,
            "details" => sqlsrv_errors()
        ];
    }

    $rows = [];

    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        foreach ($row as $key => $value) {
            if ($value instanceof DateTime) {
                $row[$key] = $value->format("Y-m-d H:i");
            }
        }

        $rows[] = $row;
    }

    return [
        "error" => false,
        "data" => $rows
    ];
}

/* 1. Plăți recente */
$paymentsSql = "
    SELECT TOP 10
        p.id,
        p.cod_bare,
        p.suma,
        p.data_plata,
        p.created_at,
        p.achitat,
        p.tip_plata,
        p.metoda_plata,
        p.reservation_id,
        p.subscription_id,
        v.numar_inmatriculare,
        s.nume,
        s.email
    FROM Payments p
    LEFT JOIN Vehicles v ON p.vehicul_id = v.id
    LEFT JOIN Subscribers s ON v.abonat_id = s.id
    ORDER BY p.created_at DESC
";

$paymentsResult = fetch_all($conn, $paymentsSql);

if ($paymentsResult["error"]) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea plăților recente",
        "details" => $paymentsResult["details"]
    ]);
}

/* 2. Abonamente active */
$activeSubscriptionsSql = "
    SELECT
        sub.id,
        sub.abonat_id,
        sub.tip,
        sub.data_start,
        sub.data_expirare,
        sub.status_plata,
        s.nume,
        s.email,
        s.telefon,
        p.suma,
        p.cod_bare,
        p.metoda_plata,
        p.achitat
    FROM Subscriptions sub
    INNER JOIN Subscribers s ON sub.abonat_id = s.id
    LEFT JOIN Payments p ON p.subscription_id = sub.id
    WHERE sub.status_plata = 1
    AND sub.data_expirare >= CAST(GETDATE() AS date)
    ORDER BY sub.data_expirare ASC
";

$activeSubscriptionsResult = fetch_all($conn, $activeSubscriptionsSql);

if ($activeSubscriptionsResult["error"]) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea abonamentelor active",
        "details" => $activeSubscriptionsResult["details"]
    ]);
}

/* 3. Rezervări active */
$activeReservationsSql = "
    SELECT
        r.id AS reservation_id,
        r.start_time,
        r.end_time,
        r.[status] AS reservation_status,
        r.created_at,

        v.id AS vehicle_id,
        v.abonat_id AS abonat_id,
        v.numar_inmatriculare,

        s.id AS subscriber_id,
        s.nume,
        s.email,
        s.telefon,

        ps.id AS spot_id,
        ps.cod_loc,

        p.suma,
        p.cod_bare,
        p.achitat,
        p.metoda_plata
    FROM Reservations r
    INNER JOIN Vehicles v ON r.vehicle_id = v.id
    INNER JOIN Subscribers s ON v.abonat_id = s.id
    INNER JOIN ParkingSpots ps ON r.spot_id = ps.id
    LEFT JOIN Payments p ON p.reservation_id = r.id
    WHERE r.[status] = 'active'
    ORDER BY r.start_time ASC
";

$activeReservationsResult = fetch_all($conn, $activeReservationsSql);

if ($activeReservationsResult["error"]) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea rezervărilor active",
        "details" => $activeReservationsResult["details"]
    ]);
}

/* 4. Istoric rezervări */
$reservationHistorySql = "
    SELECT
        r.id AS reservation_id,
        r.start_time,
        r.end_time,
        r.[status] AS reservation_status,
        r.created_at,

        v.id AS vehicle_id,
        v.abonat_id AS abonat_id,
        v.numar_inmatriculare,

        s.id AS subscriber_id,
        s.nume,
        s.email,

        ps.id AS spot_id,
        ps.cod_loc,

        p.suma,
        p.cod_bare,
        p.achitat,
        p.metoda_plata
    FROM Reservations r
    INNER JOIN Vehicles v ON r.vehicle_id = v.id
    INNER JOIN Subscribers s ON v.abonat_id = s.id
    INNER JOIN ParkingSpots ps ON r.spot_id = ps.id
    LEFT JOIN Payments p ON p.reservation_id = r.id
    ORDER BY r.created_at DESC
";

$reservationHistoryResult = fetch_all($conn, $reservationHistorySql);

if ($reservationHistoryResult["error"]) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea istoricului rezervărilor",
        "details" => $reservationHistoryResult["details"]
    ]);
}

/* 5. Istoric abonamente */
$subscriptionHistorySql = "
    SELECT
        sub.id,
        sub.abonat_id,
        sub.tip,
        sub.data_start,
        sub.data_expirare,
        sub.status_plata,
        s.nume,
        s.email,
        s.telefon,
        p.suma,
        p.cod_bare,
        p.metoda_plata,
        p.achitat,
        p.created_at AS payment_created_at
    FROM Subscriptions sub
    INNER JOIN Subscribers s ON sub.abonat_id = s.id
    LEFT JOIN Payments p ON p.subscription_id = sub.id
    ORDER BY sub.id DESC
";

$subscriptionHistoryResult = fetch_all($conn, $subscriptionHistorySql);

if ($subscriptionHistoryResult["error"]) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea istoricului abonamentelor",
        "details" => $subscriptionHistoryResult["details"]
    ]);
}

/* 6. Statistici scurte */
$statsSql = "
    SELECT
        (SELECT COUNT(*) FROM Reservations WHERE [status] = 'active') AS rezervari_active,
        (SELECT COUNT(*) FROM Reservations WHERE [status] = 'expired') AS rezervari_expirate,
        (SELECT COUNT(*) FROM Reservations WHERE [status] = 'cancelled') AS rezervari_anulate,
        (SELECT COUNT(*) FROM Subscriptions WHERE status_plata = 1 AND data_expirare >= CAST(GETDATE() AS date)) AS abonamente_active,
        (SELECT COUNT(*) FROM Payments WHERE achitat = 1) AS plati_achitate,
        (SELECT ISNULL(SUM(suma), 0) FROM Payments WHERE achitat = 1) AS incasari_totale
";

$statsResult = fetch_all($conn, $statsSql);

if ($statsResult["error"]) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea statisticilor",
        "details" => $statsResult["details"]
    ]);
}

send_json([
    "success" => true,
    "stats" => $statsResult["data"][0] ?? [],
    "recent_payments" => $paymentsResult["data"],
    "active_subscriptions" => $activeSubscriptionsResult["data"],
    "active_reservations" => $activeReservationsResult["data"],
    "reservation_history" => $reservationHistoryResult["data"],
    "subscription_history" => $subscriptionHistoryResult["data"]
]);
?>