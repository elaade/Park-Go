<?php
include 'db_PA.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$paymentId = $_POST['payment_id'] ?? null;

if (!$paymentId) {
    echo json_encode(['status' => 'error', 'message' => 'Lipsă payment_id']);
    exit;
}

$sql = "UPDATE Payments SET achitat = 1 WHERE id = ?";
$params = [$paymentId];
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt === false) {
    echo json_encode(['status' => 'error', 'message' => 'Eroare update Payments']);
    exit;
}

$sql2 = "SELECT acces_id FROM Payments WHERE id = ?";
$stmt2 = sqlsrv_query($conn, $sql2, $params);

if ($stmt2 === false) {
    echo json_encode(['status' => 'error', 'message' => 'Eroare select acces_id']);
    exit;
}

$payment = sqlsrv_fetch_array($stmt2, SQLSRV_FETCH_ASSOC);
if (!$payment) {
    echo json_encode(['status' => 'error', 'message' => 'Plata inexistentă']);
    exit;
}

$acces_id = $payment['acces_id'];

$sql3 = "UPDATE AccessLog SET status_iesire = 'platit' WHERE id = ?";
$params3 = [$acces_id];
$stmt3 = sqlsrv_query($conn, $sql3, $params3);

if ($stmt3 === false) {
    echo json_encode(['status' => 'error', 'message' => 'Eroare update AccessLog']);
    exit;
}

echo json_encode(['status' => 'ok', 'message' => 'Plata confirmată']);
?> 



