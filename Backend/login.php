<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'db_PA.php';

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$email = $data['email'] ?? '';
$parola = $data['parola'] ?? '';

if (!$email || !$parola) {
    echo json_encode(["success" => false, "error" => "Email sau parolă lipsă"]);
    exit;
}

$sql = "SELECT 
            s.id, 
            s.nume, 
            s.email, 
            s.telefon, 
            s.parola, 
            s.role, 
            v.numar_inmatriculare
        FROM Subscribers s
        LEFT JOIN Vehicles v ON s.id = v.abonat_id
        WHERE s.email = ?";

$params = [$email];
$stmt = sqlsrv_query($conn, $sql, $params);

if ($stmt && $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    if (password_verify($parola, $row['parola'])) {
        unset($row['parola']);

        if (!$row['role']) {
            $row['role'] = 'user';
        }

        if ($row['role'] === 'disabled') {
            echo json_encode([
                "success" => false,
                "error" => "Acest cont este dezactivat. Contactează administratorul."
            ]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "subscriber" => $row
        ]);
    } else {
        echo json_encode(["success" => false, "error" => "Parolă greșită"]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Cont inexistent"]);
}
?>

