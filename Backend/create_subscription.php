<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'db_PA.php';

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$abonat_id = $data['abonat_id'] ?? null;
$tip = $data['tip'] ?? null;

if (!$abonat_id || !$tip) {
    echo json_encode(["success" => false, "error" => "Date lipsă"]);
    exit;
}

$sqlCheck = "SELECT 1 FROM subscriptions 
             WHERE abonat_id = ? 
               AND status_plata = 1 
               AND data_expirare >= GETDATE()";

$stmtCheck = sqlsrv_query($conn, $sqlCheck, [$abonat_id]);

if ($stmtCheck === false) {
    echo json_encode([
        "success" => false,
        "error" => "Eroare la verificarea abonamentului existent",
        "details" => sqlsrv_errors()
    ]);
    exit;
}

if (sqlsrv_fetch_array($stmtCheck)) {
    echo json_encode([
        "success" => false,
        "error" => "Ai deja un abonament activ. Nu poți activa altul până nu expiră."
    ]);
    exit;
}

$data_start = date('Y-m-d');
$data_expirare = $tip === 'lunar' 
    ? date('Y-m-d', strtotime('+1 month')) 
    : date('Y-m-d', strtotime('+1 year'));

$suma = $tip === 'lunar' ? 100 : 500;

$sqlSub = "INSERT INTO subscriptions (abonat_id, tip, data_start, data_expirare, status_plata)
           VALUES (?, ?, ?, ?, 1)";
$paramsSub = [$abonat_id, $tip, $data_start, $data_expirare];
$stmtSub = sqlsrv_query($conn, $sqlSub, $paramsSub);

if ($stmtSub === false) {
    echo json_encode([
        "success" => false, 
        "error" => "Eroare la inserare abonament", 
        "details" => sqlsrv_errors()
    ]);
    exit;
}

$sqlVeh = "SELECT id FROM Vehicles WHERE abonat_id = ?";
$stmtVeh = sqlsrv_query($conn, $sqlVeh, [$abonat_id]);

if ($stmtVeh === false) {
    echo json_encode([
        "success" => false,
        "error" => "Eroare la query vehicul",
        "details" => sqlsrv_errors()
    ]);
    exit;
}

$rowVeh = sqlsrv_fetch_array($stmtVeh, SQLSRV_FETCH_ASSOC);
if (!$rowVeh) {
    echo json_encode(["success" => false, "error" => "Vehicul inexistent pentru acest abonat"]);
    exit;
}

$vehicul_id = $rowVeh['id'];
$cod_bare = uniqid("ABON_", true);
$data_plata = date('Y-m-d');
$acces_id = null;

$sqlPay = "INSERT INTO payments (cod_bare, vehicul_id, suma, data_plata, acces_id, achitat)
           VALUES (?, ?, ?, ?, ?, ?)";
$paramsPay = [$cod_bare, $vehicul_id, $suma, $data_plata, $acces_id, null];
$stmtPay = sqlsrv_query($conn, $sqlPay, $paramsPay);

if ($stmtPay === false) {
    echo json_encode([
        "success" => false, 
        "error" => "Eroare la înregistrare plată",
        "details" => sqlsrv_errors()
    ]);
    exit;
}

$sqlUpdateRol = "UPDATE Vehicles SET tip = 'abonat' WHERE abonat_id = ?";
$stmtUpdateRol = sqlsrv_query($conn, $sqlUpdateRol, [$abonat_id]);

if (!$stmtUpdateRol) {
    echo json_encode([
        "success" => false,
        "error" => "Abonament creat, dar nu s-a putut actualiza tipul vehiculului.",
        "details" => sqlsrv_errors()
    ]);
    exit;
}

echo json_encode(["success" => true, "message" => "Abonamentul a fost activat cu succes."]);
?>

