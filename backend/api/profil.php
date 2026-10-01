<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/reponse.php';
require_once __DIR__ . '/includes/auth.php';

$pdo = bd();
$utilisateurId = utilisateur_id();
$methodeHttp = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($methodeHttp === 'GET') {
    $st = $pdo->prepare('SELECT id, nom, email, cree_le FROM utilisateurs WHERE id = :u');
    $st->execute([':u' => $utilisateurId]);
    succes("Profil de l'utilisateur", $st->fetch() ?: null);
}

if ($methodeHttp === 'PUT' && $action === 'mot_de_passe') {
    $d = corps_json();
    $actuel = (string) ($d['mot_de_passe_actuel'] ?? '');
    $nouveau = (string) ($d['nouveau_mot_de_passe'] ?? '');
    if (strlen($nouveau) < 8) {
        erreur('Données invalides', 422, [
            'nouveau_mot_de_passe' => 'Le mot de passe doit contenir au moins 8 caractères',
        ]);
    }
    $st = $pdo->prepare('SELECT mot_de_passe FROM utilisateurs WHERE id = :u');
    $st->execute([':u' => $utilisateurId]);
    $hash = (string) $st->fetchColumn();
    if (!password_verify($actuel, $hash)) {
        erreur('Le mot de passe actuel est incorrect', 401);
    }
    $st = $pdo->prepare('UPDATE utilisateurs SET mot_de_passe = :m WHERE id = :u');
    $st->execute([':m' => password_hash($nouveau, PASSWORD_DEFAULT), ':u' => $utilisateurId]);
    succes('Mot de passe modifié');
}

if ($methodeHttp === 'PUT') {
    $d = corps_json();
    $nom = trim((string) ($d['nom'] ?? ''));
    $email = trim((string) ($d['email'] ?? ''));
    $erreurs = [];
    if ($nom === '') {
        $erreurs['nom'] = 'Le nom est obligatoire';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erreurs['email'] = "L'adresse email est invalide";
    }
    if ($erreurs) {
        erreur('Données invalides', 422, $erreurs);
    }
    $st = $pdo->prepare('SELECT 1 FROM utilisateurs WHERE email = :e AND id <> :u LIMIT 1');
    $st->execute([':e' => $email, ':u' => $utilisateurId]);
    if ($st->fetchColumn()) {
        erreur('Cet email est déjà utilisé', 409);
    }
    $st = $pdo->prepare('UPDATE utilisateurs SET nom = :n, email = :e WHERE id = :u');
    $st->execute([':n' => $nom, ':e' => $email, ':u' => $utilisateurId]);
    succes('Profil mis à jour', ['id' => $utilisateurId, 'nom' => $nom, 'email' => $email]);
}

erreur('Méthode non autorisée', 405);
