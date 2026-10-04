<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

// Chargement du .env pour le développement local (sans écraser les vraies variables)
$fichierEnv = __DIR__ . '/../../.env';
if (is_readable($fichierEnv)) {
    foreach (file($fichierEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ligne) {
        $ligne = trim($ligne);
        if ($ligne === '' || $ligne[0] === '#' || !str_contains($ligne, '=')) {
            continue;
        }
        [$cle, $valeur] = explode('=', $ligne, 2);
        $cle = trim($cle);
        $valeur = trim(trim($valeur), "\"'");
        if (getenv($cle) === false) {
            putenv($cle . '=' . $valeur);
        }
    }
}

function bd(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: 'localhost';
    $port = getenv('DB_PORT') ?: '3306';
    $nom  = getenv('DB_NAME') ?: 'gestion_finances';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASSWORD') ?: '';

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $caPathCandidates = [
        '/var/www/html/ca.pem',   // Docker / Render
        __DIR__ . '/../ca.pem',   // Local (backend/api/ca.pem)
        __DIR__ . '/../../ca.pem',
    ];
    foreach ($caPathCandidates as $caPath) {
        if (file_exists($caPath)) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            break;
        }
    }

    $dsn = "mysql:host=$host;port=$port;dbname=$nom;charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        error_log('Erreur PDO : ' . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Erreur de connexion à la base de données']);
        exit;
    }

    return $pdo;
}
