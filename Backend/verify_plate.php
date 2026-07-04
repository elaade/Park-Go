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

$updateExpiredSubscribersSql = "
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

$updateExpiredSubscribersQuery = sqlsrv_query($conn, $updateExpiredSubscribersSql);

if ($updateExpiredSubscribersQuery === false) {
    send_json([
        "status" => "eroare_actualizare_abonamente_expirate",
        "details" => sqlsrv_errors()
    ]);
}

$plate = isset($_POST["plate"]) ? strtoupper(trim($_POST["plate"])) : "";

if (!$plate) {
    send_json([
        "status" => "lipsa_parametru",
        "message" => "Nu a fost trimis numărul de înmatriculare"
    ]);
}

$sqlVeh = "
    SELECT 
        v.id,
        v.numar_inmatriculare,
        v.tip,
        v.abonat_id,
        s.role AS subscriber_role
    FROM Vehicles v
    LEFT JOIN Subscribers s
        ON s.id = v.abonat_id
    WHERE UPPER(v.numar_inmatriculare) = ?
";

$stmtVeh = sqlsrv_query($conn, $sqlVeh, [$plate]);

if ($stmtVeh === false) {
    send_json([
        "status" => "eroare_cautare_vehicul",
        "details" => sqlsrv_errors()
    ]);
}

$veh = sqlsrv_fetch_array($stmtVeh, SQLSRV_FETCH_ASSOC);

if (!$veh) {
    send_json([
        "status" => "vehicul_neinregistrat",
        "plate" => $plate,
        "acces_permis" => false,
        "autorizare" => "respins",
        "motiv" => "Vehiculul nu este înregistrat în sistem"
    ]);
}

$vehicul_id = $veh["id"];
$tip_vehicul = strtolower(trim($veh["tip"] ?? "utilizator"));
$abonat_id = $veh["abonat_id"] ?? null;
$subscriber_role = strtolower(trim($veh["subscriber_role"] ?? "user"));

if ($subscriber_role === "disabled") {
    send_json([
        "status" => "cont_dezactivat",
        "plate" => $plate,
        "vehicul_id" => $vehicul_id,
        "tip_vehicul" => $tip_vehicul,
        "acces_permis" => false,
        "autorizare" => "respins",
        "motiv" => "Acces respins. Contul asociat acestui vehicul este dezactivat.",
        "already_inside" => false,
        "accesslog_inserted" => false,
        "spot_id" => null,
        "cod_loc" => null,
        "rezervare" => null,
        "abonament" => null
    ]);
}

$sqlCheck = "
    SELECT TOP 1
        al.id,
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

$stmtCheck = sqlsrv_query($conn, $sqlCheck, [$vehicul_id]);

if ($stmtCheck === false) {
    send_json([
        "status" => "eroare_check_accesslog",
        "details" => sqlsrv_errors()
    ]);
}

$accessActiv = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);

$sqlRezervare = "
    SELECT TOP 1
        r.id,
        r.spot_id,
        r.start_time,
        r.end_time,
        ps.cod_loc,
        ps.status AS spot_status
    FROM Reservations r
    INNER JOIN ParkingSpots ps
        ON r.spot_id = ps.id
    WHERE r.vehicle_id = ?
      AND r.[status] = 'active'
      AND r.start_time <= GETDATE()
      AND r.end_time >= GETDATE()
    ORDER BY r.start_time ASC
";

$stmtRezervare = sqlsrv_query($conn, $sqlRezervare, [$vehicul_id]);

if ($stmtRezervare === false) {
    send_json([
        "status" => "eroare_query_rezervare",
        "details" => sqlsrv_errors()
    ]);
}

$rezervare = sqlsrv_fetch_array($stmtRezervare, SQLSRV_FETCH_ASSOC);

$abonament = null;

if ($abonat_id) {
    $sqlAbonament = "
        SELECT TOP 1
            s.id,
            s.tip,
            s.data_start,
            s.data_expirare
        FROM Subscriptions s
        WHERE s.abonat_id = ?
          AND s.status_plata = 1
          AND s.data_start <= CAST(GETDATE() AS date)
          AND s.data_expirare >= CAST(GETDATE() AS date)
        ORDER BY s.data_expirare DESC
    ";

    $stmtAbonament = sqlsrv_query($conn, $sqlAbonament, [$abonat_id]);

    if ($stmtAbonament === false) {
        send_json([
            "status" => "eroare_query_abonament",
            "details" => sqlsrv_errors()
        ]);
    }

    $abonament = sqlsrv_fetch_array($stmtAbonament, SQLSRV_FETCH_ASSOC);
}

if ($abonament && $tip_vehicul !== "abonat") {
    $updateToSubscriberSql = "
        UPDATE Vehicles
        SET tip = 'abonat'
        WHERE id = ?
    ";

    $updateToSubscriberQuery = sqlsrv_query($conn, $updateToSubscriberSql, [$vehicul_id]);

    if ($updateToSubscriberQuery === false) {
        send_json([
            "status" => "eroare_actualizare_tip_abonat",
            "details" => sqlsrv_errors()
        ]);
    }

    $tip_vehicul = "abonat";
}

$acces_permis = false;
$autorizare = "respins";
$motiv = "";

if ($tip_vehicul === "abonat") {
    if ($abonament) {
        $acces_permis = true;
        $autorizare = "abonat";
        $motiv = "Acces permis pe baza unui abonament activ";
    } else {
        $acces_permis = false;
        $autorizare = "respins";
        $motiv = "Vehicul de tip abonat, dar fără abonament activ";
    }
} else {
    if ($rezervare) {
        $acces_permis = true;
        $autorizare = "rezervare";
        $motiv = "Acces permis pe baza unei rezervări active";
    } else {
        $acces_permis = false;
        $autorizare = "respins";
        $motiv = "Utilizator fără rezervare activă în acest moment";
    }
}

$accesslog_inserted = false;
$spot_id_ocupat = $accessActiv["spot_id"] ?? null;
$cod_loc_ocupat = $accessActiv["cod_loc"] ?? null;

if ($accessActiv) {
    $rezervareData = null;

    if ($rezervare) {
        $rezervareData = [
            "id" => $rezervare["id"],
            "cod_loc" => $rezervare["cod_loc"],
            "start_time" => $rezervare["start_time"] instanceof DateTime
                ? $rezervare["start_time"]->format("Y-m-d H:i")
                : $rezervare["start_time"],
            "end_time" => $rezervare["end_time"] instanceof DateTime
                ? $rezervare["end_time"]->format("Y-m-d H:i")
                : $rezervare["end_time"]
        ];
    }

    $abonamentData = null;

    if ($abonament) {
        $abonamentData = [
            "id" => $abonament["id"],
            "tip" => $abonament["tip"],
            "data_start" => $abonament["data_start"] instanceof DateTime
                ? $abonament["data_start"]->format("Y-m-d")
                : $abonament["data_start"],
            "data_expirare" => $abonament["data_expirare"] instanceof DateTime
                ? $abonament["data_expirare"]->format("Y-m-d")
                : $abonament["data_expirare"]
        ];
    }

    send_json([
        "status" => "ok",
        "plate" => $plate,
        "vehicul_id" => $vehicul_id,
        "tip_vehicul" => $tip_vehicul,
        "acces_permis" => $acces_permis,
        "autorizare" => $autorizare,
        "motiv" => "Vehiculul este deja în parcare",
        "already_inside" => true,
        "accesslog_inserted" => false,
        "spot_id" => $spot_id_ocupat,
        "cod_loc" => $cod_loc_ocupat,
        "rezervare" => $rezervareData,
        "abonament" => $abonamentData
    ]);
}

if ($acces_permis) {
    if (!sqlsrv_begin_transaction($conn)) {
        send_json([
            "status" => "eroare_tranzactie",
            "details" => sqlsrv_errors()
        ]);
    }

    $spot_id = null;
    $cod_loc = null;

    if ($autorizare === "rezervare") {
        $spot_id = $rezervare["spot_id"];
        $cod_loc = $rezervare["cod_loc"];
        $spotStatus = strtolower(trim($rezervare["spot_status"] ?? "liber"));

        if ($spotStatus === "ocupat") {
            sqlsrv_rollback($conn);

            $acces_permis = false;
            $autorizare = "respins";
            $motiv = "Locul rezervat este deja ocupat";
        }
    }

    if ($autorizare === "abonat") {
        $sqlFindSpot = "
            SELECT TOP 1
                ps.id,
                ps.cod_loc
            FROM ParkingSpots ps WITH (UPDLOCK, READPAST, ROWLOCK)
            WHERE ps.status = 'liber'
              AND NOT EXISTS (
                  SELECT 1
                  FROM Reservations r
                  WHERE r.spot_id = ps.id
                    AND r.[status] = 'active'
                    AND r.start_time <= GETDATE()
                    AND r.end_time >= GETDATE()
              )
            ORDER BY ps.id ASC
        ";

        $stmtFindSpot = sqlsrv_query($conn, $sqlFindSpot);

        if ($stmtFindSpot === false) {
            sqlsrv_rollback($conn);

            send_json([
                "status" => "eroare_cautare_loc_liber",
                "details" => sqlsrv_errors()
            ]);
        }

        $freeSpot = sqlsrv_fetch_array($stmtFindSpot, SQLSRV_FETCH_ASSOC);

        if (!$freeSpot) {
            sqlsrv_rollback($conn);

            $acces_permis = false;
            $autorizare = "respins";
            $motiv = "Nu există locuri disponibile în parcare";
        } else {
            $spot_id = $freeSpot["id"];
            $cod_loc = $freeSpot["cod_loc"];
        }
    }

    if ($acces_permis && $spot_id) {
        if ($autorizare === "rezervare") {
            $sqlUpdateSpot = "
                UPDATE ParkingSpots
                SET status = 'ocupat'
                WHERE id = ?
                  AND status IN ('liber', 'rezervat')
            ";
        } else {
            $sqlUpdateSpot = "
                UPDATE ParkingSpots
                SET status = 'ocupat'
                WHERE id = ?
                  AND status = 'liber'
            ";
        }

        $stmtUpdateSpot = sqlsrv_query($conn, $sqlUpdateSpot, [$spot_id]);

        if ($stmtUpdateSpot === false) {
            sqlsrv_rollback($conn);

            send_json([
                "status" => "eroare_update_loc",
                "details" => sqlsrv_errors()
            ]);
        }

        $rowsUpdated = sqlsrv_rows_affected($stmtUpdateSpot);

        if ($rowsUpdated === false || $rowsUpdated < 1) {
            sqlsrv_rollback($conn);

            $acces_permis = false;
            $autorizare = "respins";
            $motiv = $autorizare === "rezervare"
                ? "Locul rezervat nu mai este disponibil"
                : "Locul nu mai este disponibil";
        } else {
            $sqlInsert = "
                INSERT INTO AccessLog (vehicul_id, data_in, status_acces, spot_id)
                VALUES (?, GETDATE(), 'Permis', ?)
            ";

            $stmtInsert = sqlsrv_query($conn, $sqlInsert, [$vehicul_id, $spot_id]);

            if ($stmtInsert === false) {
                sqlsrv_rollback($conn);

                send_json([
                    "status" => "eroare_insert_accesslog",
                    "details" => sqlsrv_errors()
                ]);
            }

            sqlsrv_commit($conn);

            $accesslog_inserted = true;
            $spot_id_ocupat = $spot_id;
            $cod_loc_ocupat = $cod_loc;
        }
    } else {
        sqlsrv_rollback($conn);
    }
}

$rezervareData = null;

if ($rezervare) {
    $rezervareData = [
        "id" => $rezervare["id"],
        "cod_loc" => $rezervare["cod_loc"],
        "start_time" => $rezervare["start_time"] instanceof DateTime
            ? $rezervare["start_time"]->format("Y-m-d H:i")
            : $rezervare["start_time"],
        "end_time" => $rezervare["end_time"] instanceof DateTime
            ? $rezervare["end_time"]->format("Y-m-d H:i")
            : $rezervare["end_time"]
    ];
}

$abonamentData = null;

if ($abonament) {
    $abonamentData = [
        "id" => $abonament["id"],
        "tip" => $abonament["tip"],
        "data_start" => $abonament["data_start"] instanceof DateTime
            ? $abonament["data_start"]->format("Y-m-d")
            : $abonament["data_start"],
        "data_expirare" => $abonament["data_expirare"] instanceof DateTime
            ? $abonament["data_expirare"]->format("Y-m-d")
            : $abonament["data_expirare"]
    ];
}

send_json([
    "status" => "ok",
    "plate" => $plate,
    "vehicul_id" => $vehicul_id,
    "tip_vehicul" => $tip_vehicul,
    "acces_permis" => $acces_permis,
    "autorizare" => $autorizare,
    "motiv" => $motiv,
    "already_inside" => false,
    "accesslog_inserted" => $accesslog_inserted,
    "spot_id" => $spot_id_ocupat,
    "cod_loc" => $cod_loc_ocupat,
    "rezervare" => $rezervareData,
    "abonament" => $abonamentData
]);
?>