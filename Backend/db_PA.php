<?php
$config = require "db_config.php";

$serverName = $config["serverName"];

$connectionOptions = [
    "Database" => $config["database"],
    "Uid" => $config["username"],
    "PWD" => $config["password"],
    "CharacterSet" => "UTF-8"
];

$conn = sqlsrv_connect($serverName, $connectionOptions);

if ($conn === false) {
    die(print_r(sqlsrv_errors(), true));
}
?>
