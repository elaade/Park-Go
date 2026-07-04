<?php
include 'db_PA.php';
header("Access-Control-Allow-Origin: *");

$sql = "
    SELECT 
        l.id AS log_id,
        v.numar_inmatriculare,
        v.tip,
        s.nume,
        l.data_in,
        l.data_out
    FROM AccessLog l
    LEFT JOIN Vehicles v ON l.vehicul_id = v.id
    LEFT JOIN Subscribers s ON v.abonat_id = s.id
    ORDER BY l.data_in DESC
";

$stmt = sqlsrv_query($conn, $sql);

if ($stmt === false) {
    die(json_encode(["error" => sqlsrv_errors()]));
}

$logs = [];
while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
    $logs[] = [
        "vehicul" => $row['numar_inmatriculare'] ?? "N/A",
        "tip" => $row["tip"],
        "nume" => $row['nume'] ?? "-",
        "intrare" => $row['data_in'] ? $row['data_in']->format('Y-m-d H:i:s') : "N/A",
        "iesire" => $row['data_out'] ? $row['data_out']->format('Y-m-d H:i:s') : "În parcare"
    ];
}

header('Content-Type: application/json');
echo json_encode($logs);
?>