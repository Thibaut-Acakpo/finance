<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/reponse.php';
require_once __DIR__ . '/includes/auth.php';

$pdo = bd();
$utilisateurId = utilisateur_id();

$type = $_GET['type'] ?? 'depense';
$table = $type === 'revenu' ? 'categories_revenus' : 'categories_depenses';
$tableOps = $type === 'revenu' ? 'revenus' : 'depenses';

$methodeHttp = $_SERVER['REQUEST_METHOD'];

if ($methodeHttp === 'GET') {
    $st = $pdo->prepare("SELECT id, nom, cree_le FROM {$table} WHERE utilisateur_id = :u ORDER BY nom");
    $st->execute([':u' => $utilisateurId]);
    $lignes = $st->fetchAll();
    succes('Liste des catégories', $lignes, ['total' => count($lignes)]);
}

if ($methodeHttp === 'POST') {
    $d = corps_json();
    $nom = trim((string) ($d['nom'] ?? ''));
    if ($nom === '' || mb_strlen($nom) > 120) {
        erreur('Données invalides', 422, ['nom' => 'Le nom est obligatoire (120 caractères maximum)']);
    }
    try {
        $st = $pdo->prepare("INSERT INTO {$table} (utilisateur_id, nom) VALUES (:u, :n)");
        $st->execute([':u' => $utilisateurId, ':n' => $nom]);
    } catch (PDOException $e) {
        erreur('Cette catégorie existe déjà', 409);
    }
    succes('Catégorie créée', ['id' => (int) $pdo->lastInsertId(), 'nom' => $nom], null, 201);
}

if ($methodeHttp === 'PUT') {
    $d = corps_json();
    $id = (int) ($d['id'] ?? 0);
    $nom = trim((string) ($d['nom'] ?? ''));
    if ($id <= 0 || $nom === '') {
        erreur('Données invalides', 422, ['nom' => 'Identifiant et nom obligatoires']);
    }
    $st = $pdo->prepare("UPDATE {$table} SET nom = :n WHERE id = :i AND utilisateur_id = :u");
    $st->execute([':n' => $nom, ':i' => $id, ':u' => $utilisateurId]);
    if ($st->rowCount() === 0) {
        erreur('Catégorie introuvable', 404);
    }
    succes('Catégorie modifiée', ['id' => $id, 'nom' => $nom]);
}

if ($methodeHttp === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        erreur('Identifiant manquant', 422);
    }
    $st = $pdo->prepare("SELECT COUNT(*) FROM {$tableOps} WHERE categorie_id = :c AND utilisateur_id = :u");
    $st->execute([':c' => $id, ':u' => $utilisateurId]);
    if ((int) $st->fetchColumn() > 0) {
        erreur('Cette catégorie est utilisée par des données existantes', 409);
    }
    $st = $pdo->prepare("DELETE FROM {$table} WHERE id = :i AND utilisateur_id = :u");
    $st->execute([':i' => $id, ':u' => $utilisateurId]);
    if ($st->rowCount() === 0) {
        erreur('Catégorie introuvable', 404);
    }
    succes('Catégorie supprimée');
}

erreur('Méthode non autorisée', 405);
