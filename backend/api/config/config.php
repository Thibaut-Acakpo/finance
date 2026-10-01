<?php
declare(strict_types=1);

// Charge automatiquement backend/.env (copié depuis .env.example) si présent,
// pour éviter de devoir définir les variables d'environnement à la main.
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

// Paramètres de connexion MySQL
define('DB_HOTE', getenv('DB_HOTE') ?: 'localhost');
define('DB_NOM', getenv('DB_NOM') ?: 'gestion_finances');
define('DB_UTILISATEUR', getenv('DB_UTILISATEUR') ?: 'root');
define('DB_MOT_DE_PASSE', getenv('DB_MOT_DE_PASSE') ?: '');

// Origines autorisées à appeler l'API depuis un autre domaine (le frontend React).
// Définir la variable d'environnement ALLOWED_ORIGINS avec une liste séparée par des
// virgules, ex : "http://localhost:5173,https://mon-app.exemple.com"
$origines_autorisees = array_filter(array_map(
    'trim',
    explode(',', getenv('ALLOWED_ORIGINS') ?: 'http://localhost:5173')
));
$origine_requete = $_SERVER['HTTP_ORIGIN'] ?? '';
$https_actif = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || ($_SERVER['SERVER_PORT'] ?? '') === '443';

if (php_sapi_name() !== 'cli' && $origine_requete !== '' && in_array($origine_requete, $origines_autorisees, true)) {
    header('Access-Control-Allow-Origin: ' . $origine_requete);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Le navigateur envoie une requête OPTIONS de "preflight" avant chaque PUT/DELETE
// ou POST avec un corps JSON en cross-origin : on répond immédiatement, sans routage.
if (php_sapi_name() !== 'cli' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Session — pour que le cookie de session survive à un appel cross-origin (frontend sur
// un autre domaine/port que l'API), il faut SameSite=None + Secure, ce qui impose HTTPS.
// En local (http://localhost), on reste en Lax : le frontend doit alors tourner sur le
// même domaine/port que l'API (ex. via un reverse proxy) pour garder la session.
ini_set('session.cookie_httponly', '1');
ini_set('session.use_strict_mode', '1');
if ($https_actif) {
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_secure', '1');
} else {
    ini_set('session.cookie_samesite', 'Lax');
}

// Ne jamais afficher les erreurs PHP au client
ini_set('display_errors', '0');
error_reporting(E_ALL);

date_default_timezone_set('Africa/Abidjan');

const DEVISE = 'XOF';
const MOYENS_PAIEMENT = ['especes', 'mobile_money', 'carte', 'virement', 'cheque', 'autre'];
const CATEGORIES_REVENUS_DEFAUT = ['Salaire', 'Freelance', 'Commerce', 'Investissement', 'Autre'];
const CATEGORIES_DEPENSES_DEFAUT = [
    'Alimentation', 'Transport', 'Logement', 'Santé', 'Éducation',
    'Loisirs', 'Abonnements', 'Factures', 'Shopping', 'Autre',
];
