<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include 'db_PA.php';

if (!isset($_GET['abonat_id'])) {
    echo json_encode(["success" => false, "error" => "Lipsește abonat_id"]);
    exit;
}

$abonat_id = intval($_GET['abonat_id']);

$sql = "SELECT id, numar_inmatriculare, tip FROM Vehicles WHERE abonat_id = ?";
$stmt = sqlsrv_query($conn, $sql, [$abonat_id]);

if ($stmt === false) {
    echo json_encode(["success" => false, "error" => "Eroare la interogare", "details" => sqlsrv_errors()]);
    exit;
}

$vehicule = [];
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $vehicule[] = [
        "id" => $row['id'],
        "numar_inmatriculare" => $row['numar_inmatriculare'],
        "tip" => $row['tip']
    ];
}

echo json_encode([
    "success" => true,
    "vehicule" => $vehicule
]);
?>