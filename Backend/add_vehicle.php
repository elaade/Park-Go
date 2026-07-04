<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (
    !$data ||
    !isset($data['numar_inmatriculare'], $data['abonat_id']) ||
    empty(trim($data['numar_inmatriculare']))
) {
    echo json_encode([
        "success" => false,
        "error" => "Date incomplete"
    ]);
    exit;
}

include 'db_PA.php';

$numar = strtoupper(trim($data['numar_inmatriculare']));
$abonat_id = $data['abonat_id'];

$sqlCheck = "SELECT id, abonat_id FROM Vehicles WHERE numar_inmatriculare = ?";
$stmtCheck = sqlsrv_query($conn, $sqlCheck, [$numar]);

if ($stmtCheck === false) {
    echo json_encode([
        "success" => false,
        "error" => "Eroare la verificare vehicul",
        "details" => sqlsrv_errors()
    ]);
    exit;
}

$veh = sqlsrv_fetch_array($stmtCheck, SQLSRV_FETCH_ASSOC);

if ($veh) {

    if (!is_null($veh['abonat_id'])) {
        echo json_encode([
            "success" => false,
            "error" => "Vehiculul este deja asociat unui cont"
        ]);
        exit;
    }

    $sqlUpdate = "UPDATE Vehicles SET abonat_id = ?, tip = 'utilizator' WHERE id = ?";
    $stmtUpdate = sqlsrv_query($conn, $sqlUpdate, [$abonat_id, $veh['id']]);

    if ($stmtUpdate === false) {
        echo json_encode([
            "success" => false,
            "error" => "Eroare la actualizare vehicul",
            "details" => sqlsrv_errors()
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Vehicul asociat contului cu succes"
    ]);
    exit;

} else {

    $sqlInsert = "INSERT INTO Vehicles (numar_inmatriculare, abonat_id)
                  VALUES (?, ?)";

    $stmtInsert = sqlsrv_query($conn, $sqlInsert, [$numar, $abonat_id]);

    if ($stmtInsert === false) {
        echo json_encode([
            "success" => false,
            "error" => "Eroare la salvare vehicul",
            "details" => sqlsrv_errors()
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Vehicul adăugat cu succes"
    ]);
}
?>