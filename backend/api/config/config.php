<?php
declare(strict_types=1);

// ============================================================
// 1. CHARGEMENT DU FICHIER .ENV (pour le développement local)
// ============================================================
$fichierEnv = __DIR__ . '/../../.env';
if (is_readable($fichierEnv)) {
    foreach (file($fichierEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $ligne) {
        $ligne = trim($ligne);
        if ($ligne === '' || str_starts_with($ligne, '#') || !str_contains($ligne, '=')) {
            continue;
        }
        [$cle, $valeur] = explode('=', $ligne, 2);
        $cle = trim($cle);
        if (getenv($cle) === false) {
            putenv($cle . '=' . trim($valeur));
        }
    }
}

// ============================================================
// 2. PARAMÈTRES DE CONNEXION À LA BASE DE DONNÉES
// ============================================================
define('DB_HOTE', getenv('DB_HOTE') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NOM', getenv('DB_NOM') ?: 'gestion_finances');
define('DB_UTILISATEUR', getenv('DB_UTILISATEUR') ?: 'root');
define('DB_MOT_DE_PASSE', getenv('DB_MOT_DE_PASSE') ?: '');

/**
 * Retourne une connexion PDO unique (singleton).
 * Gère automatiquement le SSL si le certificat ca.pem est présent (TiDB Cloud).
 */
function getPDO(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // Activation du SSL si le certificat est présent (obligatoire pour TiDB Cloud)
    $caPath = '/var/www/html/ca.pem';
    if (!file_exists($caPath)) {
        $caPath = __DIR__ . '/../ca.pem'; // développement local
    }
    if (file_exists($caPath)) {
        $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;
        $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
    }

    $dsn = 'mysql:host=' . DB_HOTE . ';port=' . DB_PORT . ';dbname=' . DB_NOM . ';charset=utf8mb4';

    try {
        $pdo = new PDO($dsn, DB_UTILISATEUR, DB_MOT_DE_PASSE, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Erreur de connexion à la base de données']);
        exit;
    }

    return $pdo;
}

// ============================================================
// 3. CORS — AUTORISATION DES ORIGINES
// ============================================================
$origines_autorisees = array_filter(array_map(
    'trim',
    explode(',', getenv('ALLOWED_ORIGINS') ?: 'http://localhost:5173')
));
$origine_requete = $_SERVER['HTTP_ORIGIN'] ?? '';
$https_actif = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || ($_SERVER['SERVER_PORT'] ?? '') === '443'
    || getenv('RENDER') !== false;

if (php_sapi_name() !== 'cli' && $origine_requete !== '' && in_array($origine_requete, $origines_autorisees, true)) {
    header('Access-Control-Allow-Origin: ' . $origine_requete);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Réponse immédiate aux requêtes "preflight" OPTIONS
if (php_sapi_name() !== 'cli' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ============================================================
// 4. SESSIONS — CONFIGURATION POUR CROSS-ORIGIN (Vercel/Render)
// ============================================================
ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');

if ($https_actif) {
    // Production (Render) : le frontend est sur un autre domaine
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_secure', '1');
} else {
    // Développement local (http://localhost)
    ini_set('session.cookie_samesite', 'Lax');
}

// ============================================================
// 5. ERREURS ET FUSEAU HORAIRE
// ============================================================
ini_set('display_errors', '0');
error_reporting(E_ALL);
date_default_timezone_set('Africa/Abidjan');

// ============================================================
// 6. CONSTANTES MÉTIER
// ============================================================
const DEVISE = 'XOF';
const MOYENS_PAIEMENT = ['especes', 'mobile_money', 'carte', 'virement', 'cheque', 'autre'];
const CATEGORIES_REVENUS_DEFAUT = ['Salaire', 'Freelance', 'Commerce', 'Investissement', 'Autre'];
const CATEGORIES_DEPENSES_DEFAUT = [
    'Alimentation', 'Transport', 'Logement', 'Santé', 'Éducation',
    'Loisirs', 'Abonnements', 'Factures', 'Shopping', 'Autre',
];
