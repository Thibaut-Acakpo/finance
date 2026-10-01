<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function bd(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOTE, DB_NOM);
    try {
        $pdo = new PDO($dsn, DB_UTILISATEUR, DB_MOT_DE_PASSE, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        error_log('Connexion BD impossible : ' . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'Erreur interne du serveur',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $pdo;
}
