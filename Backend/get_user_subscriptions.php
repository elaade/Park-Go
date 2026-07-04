<?php
ob_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
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

$abonat_id = isset($_GET["abonat_id"]) ? intval($_GET["abonat_id"]) : 0;

if (!$abonat_id) {
    send_json([
        "success" => false,
        "message" => "Lipsește abonat_id"
    ]);
}

$sql = "
    SELECT
        s.id,
        s.tip,
        s.data_start,
        s.data_expirare,
        s.status_plata,
        p.suma,
        p.metoda_plata,
        p.cod_bare,
        p.achitat,
        p.created_at
    FROM Subscriptions s
    LEFT JOIN Payments p
        ON p.subscription_id = s.id
    WHERE s.abonat_id = ?
    ORDER BY s.data_start DESC, s.id DESC
";

$stmt = sqlsrv_query($conn, $sql, [$abonat_id]);

if ($stmt === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la preluarea istoricului de abonamente",
        "details" => sqlsrv_errors()
    ]);
}

$subscriptions = [];

while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $subscriptions[] = [
        "id" => $row["id"],
        "tip" => $row["tip"],
        "data_start" => $row["data_start"] instanceof DateTime
            ? $row["data_start"]->format("Y-m-d")
            : $row["data_start"],
        "data_expirare" => $row["data_expirare"] instanceof DateTime
            ? $row["data_expirare"]->format("Y-m-d")
            : $row["data_expirare"],
        "status_plata" => $row["status_plata"],
        "suma" => $row["suma"],
        "metoda_plata" => $row["metoda_plata"],
        "cod_bare" => $row["cod_bare"],
        "achitat" => $row["achitat"],
        "created_at" => $row["created_at"] instanceof DateTime
            ? $row["created_at"]->format("Y-m-d H:i")
            : $row["created_at"]
    ];
}

send_json([
    "success" => true,
    "subscriptions" => $subscriptions
]);
?>