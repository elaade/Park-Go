<?php
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

ini_set('display_errors', 0);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include "db_PA.php";

function send_json($data) {
    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($data);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$abonat_id = $data['abonat_id'] ?? null;
$tip = $data['tip'] ?? null;
$metoda_plata = $data['metoda_plata'] ?? 'card_simulat';

if (!$abonat_id || !$tip) {
    send_json([
        "success" => false,
        "message" => "Date lipsă pentru abonament"
    ]);
}

$plans = [
    "frequent_monthly" => [
        "nume" => "Frequent Traveller",
        "pret" => 399,
        "zile" => 30
    ],
    "annual_traveller" => [
        "nume" => "Annual Traveller",
        "pret" => 3990,
        "zile" => 365
    ]
];

if (!isset($plans[$tip])) {
    send_json([
        "success" => false,
        "message" => "Tip de abonament invalid"
    ]);
}

$plan = $plans[$tip];
$suma = $plan["pret"];
$durata_zile = $plan["zile"];
$nume_abonament = $plan["nume"];

$disableOldSql = "
    UPDATE Subscriptions
    SET status_plata = 0
    WHERE abonat_id = ?
    AND status_plata = 1
";

$disableOldQuery = sqlsrv_query($conn, $disableOldSql, [$abonat_id]);

if ($disableOldQuery === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la actualizarea abonamentelor vechi",
        "details" => sqlsrv_errors()
    ]);
}

$subscriptionSql = "
    INSERT INTO Subscriptions
    (abonat_id, tip, data_start, data_expirare, status_plata)
    OUTPUT INSERTED.id, INSERTED.data_expirare
    VALUES (?, ?, CAST(GETDATE() AS date), DATEADD(DAY, ?, CAST(GETDATE() AS date)), 1)
";

$subscriptionParams = [
    $abonat_id,
    $tip,
    $durata_zile
];

$subscriptionQuery = sqlsrv_query($conn, $subscriptionSql, $subscriptionParams);

if ($subscriptionQuery === false) {
    send_json([
        "success" => false,
        "message" => "Eroare la crearea abonamentului",
        "details" => sqlsrv_errors()
    ]);
}

$subscriptionRow = sqlsrv_fetch_array($subscriptionQuery, SQLSRV_FETCH_ASSOC);

if (!$subscriptionRow || !isset($subscriptionRow['id'])) {
    send_json([
        "success" => false,
        "message" => "Abonamentul a fost creat, dar ID-ul nu a putut fi preluat"
    ]);
}

$subscription_id = $subscriptionRow['id'];
$data_expirare = $subscriptionRow['data_expirare'];

if ($data_expirare instanceof DateTime) {
    $data_expirare_formatata = $data_expirare->format('Y-m-d');
} else {
    $data_expirare_formatata = date('Y-m-d', strtotime($data_expirare));
}

try {
    $cod_bare = "SUB-" . date("Ymd") . "-" . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
} catch (Exception $e) {
    $cod_bare = "SUB-" . date("Ymd") . "-" . strtoupper(substr(str_replace("-", "", uniqid()), 0, 8));
}

$paymentSql = "
    INSERT INTO Payments
    (cod_bare, vehicul_id, suma, data_plata, acces_id, achitat, reservation_id, subscription_id, tip_plata, metoda_plata)
    VALUES (?, NULL, ?, CAST(GETDATE() AS date), NULL, 1, NULL, ?, 'abonament', ?)
";

$paymentParams = [
    $cod_bare,
    $suma,
    $subscription_id,
    $metoda_plata
];

$paymentQuery = sqlsrv_query($conn, $paymentSql, $paymentParams);

if ($paymentQuery === false) {
    send_json([
        "success" => false,
        "message" => "Abonamentul a fost creat, dar plata nu a fost salvată",
        "details" => sqlsrv_errors()
    ]);
}

send_json([
    "success" => true,
    "message" => "Plată efectuată cu succes. Abonamentul " . $nume_abonament . " este activ până la " . $data_expirare_formatata . ".",
    "tip" => $tip,
    "nume_abonament" => $nume_abonament,
    "suma" => $suma,
    "data_expirare" => $data_expirare_formatata,
    "subscription_id" => $subscription_id,
    "cod_bare" => $cod_bare
]);
?>