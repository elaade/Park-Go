<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'db_PA.php';

$abonat_id = $_GET['abonat_id'] ?? null;

if (!$abonat_id) {
    echo json_encode(["success" => false, "error" => "ID abonat lipsă"]);
    exit;
}

$sql = "SELECT TOP 1 tip, data_expirare FROM subscriptions 
        WHERE abonat_id = ? AND status_plata = 1 AND data_expirare >= GETDATE()
        ORDER BY data_expirare DESC";

$stmt = sqlsrv_query($conn, $sql, [$abonat_id]);

if ($stmt === false) {
    echo json_encode(["success" => false, "error" => "Eroare interogare abonament"]);
    exit;
}

$row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);

if ($row) {
    echo json_encode([
        "success" => true,
        "abonament_activ" => true,
        "tip" => $row['tip'],
        "expira" => $row['data_expirare']->format('Y-m-d')
    ]);
} else {
    echo json_encode([
        "success" => true,
        "abonament_activ" => false
    ]);
}
