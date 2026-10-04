<?php
declare(strict_types=1);

/**
 * Retourne une connexion PDO unique (singleton) à la base de données.
 * Gère automatiquement le SSL si le certificat ca.pem est présent (TiDB Cloud).
 */
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

    // Chercher le certificat ca.pem dans plusieurs emplacements possibles
    $caPathCandidates = [
        '/var/www/html/ca.pem',                  // Dans le conteneur Docker sur Render
        __DIR__ . '/../ca.pem',                  // En local (backend/api/ca.pem)
        __DIR__ . '/../../ca.pem',               // Autre emplacement possible
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
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'error' => 'Erreur de connexion',
                'details' => $e->getMessage(),
                'host' => $host,
                'port' => $port,
                'db' => $nom,
                'user' => $user,
                'password_length' => strlen($pass),  // Longueur du mot de passe (pas le mot de passe !)
                'password_first_char' => substr($pass, 0, 1),  // Premier caractère
                'password_last_char' => substr($pass, -1),     // Dernier caractère
                'password_has_spaces' => (strpos($pass, ' ') !== false) ? 'OUI' : 'NON'
            ]);
            exit;
        }

    return $pdo;
}
