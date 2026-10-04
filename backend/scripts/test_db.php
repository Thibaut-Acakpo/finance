<?php
$host = 'gateway01.eu-central-1.prod.aws.tidbcloud.com';
$user = '3F36pCTRLqtQ2Fi.root';
echo "Mot de passe : ";
$pass = getenv('DB_PASS') ?: trim(fgets(STDIN));
echo "Longueur du mot de passe lu : " . strlen($pass) . PHP_EOL;

try {
    $pdo = new PDO(
        "mysql:host=$host;port=4000;dbname=gestion_finances;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_SSL_CA => __DIR__ . '/../api/ca.pem',
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true,
        ]
    );
    echo "Connexion OK : " . $pdo->query('SELECT VERSION()')->fetchColumn() . PHP_EOL;
} catch (PDOException $e) {
    echo "Echec : " . $e->getMessage() . PHP_EOL;
}