<?php
ob_start();

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Content-Type: application/json');

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

/*
    1. Actualizează abonamentele expirate:
       dacă un vehicul era abonat, dar nu mai are abonament activ,
       revine la utilizator.
*/
$updateExpiredSql = "
    UPDATE v
    SET v.tip = 'utilizator'
    FROM Vehicles v
    WHERE v.tip = 'abonat'
    AND NOT EXISTS (
        SELECT 1
        FROM Subscriptions s
        WHERE s.abonat_id = v.abonat_id
          AND s.status_plata = 1
          AND s.data_start <= CAST(GETDATE() AS date)
          AND s.data_expirare >= CAST(GETDATE() AS date)
    )
";

sqlsrv_query($conn, $updateExpiredSql);

/*
    2. Marchează rezervările expirate.
*/
$expireReservationsSql = "
    UPDATE Reservations
    SET [status] = 'expired'
    WHERE [status] = 'active'
      AND end_time < GETDATE()
";

sqlsrv_query($conn, $expireReservationsSql);

/*
    3. Preia utilizatorii cu vehicule, abonament activ,
       rezervare activă, status cont și status în parcare.
*/
$sql = "
    SELECT
        s.id AS subscriber_id,
        s.nume,
        s.email,
        s.telefon,
        s.role,

        v.id AS vehicle_id,
        v.numar_inmatriculare,
        v.tip AS tip_vehicul,

        sub.id AS subscription_id,
        sub.tip AS tip_abonament,
        sub.data_start AS abonament_start,
        sub.data_expirare AS abonament_expirare,

        r.id AS reservation_id,
        r.start_time AS rezervare_start,
        r.end_time AS rezervare_end,
        r.[status] AS rezervare_status,

        psRez.cod_loc AS loc_rezervat,

        al.id AS accesslog_id,
        al.data_in,
        al.spot_id AS access_spot_id,

        psOcupat.cod_loc AS loc_ocupat

    FROM Subscribers s

    LEFT JOIN Vehicles v
        ON v.abonat_id = s.id

    OUTER APPLY (
        SELECT TOP 1
            sub1.id,
            sub1.tip,
            sub1.data_start,
            sub1.data_expirare
        FROM Subscriptions sub1
        WHERE sub1.abonat_id = s.id
          AND sub1.status_plata = 1
          AND sub1.data_start <= CAST(GETDATE() AS date)
          AND sub1.data_expirare >= CAST(GETDATE() AS date)
        ORDER BY sub1.data_expirare DESC
    ) sub

    OUTER APPLY (
        SELECT TOP 1
            r1.id,
            r1.start_time,
            r1.end_time,
            r1.[status],
            r1.spot_id
        FROM Reservations r1
        WHERE r1.vehicle_id = v.id
          AND r1.[status] = 'active'
          AND r1.start_time <= GETDATE()
          AND r1.end_time >= GETDATE()
        ORDER BY r1.start_time ASC
    ) r

    LEFT JOIN ParkingSpots psRez
        ON psRez.id = r.spot_id

    OUTER APPLY (
        SELECT TOP 1
            al1.id,
            al1.data_in,
            al1.spot_id
        FROM AccessLog al1
        WHERE al1.vehicul_id = v.id
          AND al1.data_out IS NULL
          AND al1.status_acces = 'Permis'
        ORDER BY al1.data_in DESC
    ) al

    LEFT JOIN ParkingSpots psOcupat
        ON psOcupat.id = al.spot_id

    ORDER BY s.id DESC, v.id ASC
";

$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea utilizatorilor",
        "details" => sqlsrv_errors()
    ]);
}

$results = [];

while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $locOcupat = $row["loc_ocupat"] ?? null;
    $locRezervat = $row["loc_rezervat"] ?? null;

    $results[] = [
        "subscriber_id" => $row["subscriber_id"],
        "nume" => $row["nume"],
        "email" => $row["email"],
        "telefon" => $row["telefon"],
        "role" => $row["role"] ?: "user",

        "vehicle_id" => $row["vehicle_id"],
        "numar_inmatriculare" => $row["numar_inmatriculare"],
        "tip_vehicul" => $row["tip_vehicul"] ?: "utilizator",

        "abonament_activ" => $row["subscription_id"] ? true : false,
        "subscription_id" => $row["subscription_id"],
        "tip_abonament" => $row["tip_abonament"],
        "abonament_start" => $row["abonament_start"] instanceof DateTime
            ? $row["abonament_start"]->format("Y-m-d")
            : $row["abonament_start"],
        "abonament_expirare" => $row["abonament_expirare"] instanceof DateTime
            ? $row["abonament_expirare"]->format("Y-m-d")
            : $row["abonament_expirare"],

        "rezervare_activa" => $row["reservation_id"] ? true : false,
        "reservation_id" => $row["reservation_id"],
        "rezervare_start" => $row["rezervare_start"] instanceof DateTime
            ? $row["rezervare_start"]->format("Y-m-d H:i")
            : $row["rezervare_start"],
        "rezervare_end" => $row["rezervare_end"] instanceof DateTime
            ? $row["rezervare_end"]->format("Y-m-d H:i")
            : $row["rezervare_end"],
        "rezervare_status" => $row["rezervare_status"],

        "cod_loc" => $locOcupat ?: $locRezervat,

        "loc_ocupat" => $locOcupat,
        "loc_rezervat" => $locRezervat,

        "in_parcare" => $row["accesslog_id"] ? true : false,
        "data_in" => $row["data_in"] instanceof DateTime
            ? $row["data_in"]->format("Y-m-d H:i")
            : $row["data_in"]
    ];
}

send_json([
    "success" => true,
    "subscribers" => $results
]);
?>
