<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/reponse.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/validation.php';

$pdo = bd();
$utilisateurId = utilisateur_id();
$methodeHttp = $_SERVER['REQUEST_METHOD'];
$parCategorie = ($_GET['portee'] ?? 'global') === 'categorie';

if ($methodeHttp === 'GET') {
    $mois = $_GET['mois'] ?? date('n');
    $annee = $_GET['annee'] ?? date('Y');
    $erreurs = valider_periode($mois, $annee);
    if ($erreurs) {
        erreur('Paramètres invalides', 422, $erreurs);
    }

    if ($parCategorie) {
        $st = $pdo->prepare(
            'SELECT b.id, b.categorie_id, c.nom AS categorie_nom, b.mois, b.annee, b.montant,
                    COALESCE((
                      SELECT SUM(d.montant) FROM depenses d
                      WHERE d.utilisateur_id = b.utilisateur_id
                        AND d.categorie_id = b.categorie_id
                        AND MONTH(d.date_operation) = b.mois
                        AND YEAR(d.date_operation) = b.annee
                    ), 0) AS depense
             FROM budgets_categories b
             LEFT JOIN categories_depenses c ON c.id = b.categorie_id
             WHERE b.utilisateur_id = :u AND b.mois = :m AND b.annee = :a
             ORDER BY c.nom'
        );
        $st->execute([':u' => $utilisateurId, ':m' => (int) $mois, ':a' => (int) $annee]);
        $lignes = $st->fetchAll();
        succes('Budgets par catégorie', $lignes, ['total' => count($lignes), 'devise' => DEVISE]);
    }

    $st = $pdo->prepare('SELECT id, mois, annee, montant FROM budgets WHERE utilisateur_id = :u AND mois = :m AND annee = :a');
    $st->execute([':u' => $utilisateurId, ':m' => (int) $mois, ':a' => (int) $annee]);
    $budget = $st->fetch() ?: null;

    $st = $pdo->prepare(
        'SELECT COALESCE(SUM(montant), 0) FROM depenses
         WHERE utilisateur_id = :u AND MONTH(date_operation) = :m AND YEAR(date_operation) = :a'
    );
    $st->execute([':u' => $utilisateurId, ':m' => (int) $mois, ':a' => (int) $annee]);
    $depense = (float) $st->fetchColumn();

    $montant = $budget ? (float) $budget['montant'] : 0.0;
    $pourcentage = $montant > 0 ? round($depense / $montant * 100, 2) : 0.0;
    $statut = $pourcentage > 100 ? 'exceeded' : ($pourcentage >= 80 ? 'warning' : 'normal');

    succes('Budget du mois', [
        'budget' => $budget,
        'depense' => $depense,
        'reste' => $montant - $depense,
        'pourcentage' => $pourcentage,
        'statut' => $statut,
    ], ['devise' => DEVISE]);
}

if ($methodeHttp === 'POST' || $methodeHttp === 'PUT') {
    $d = corps_json();
    $erreurs = valider_periode($d['mois'] ?? null, $d['annee'] ?? null);
    if (!isset($d['montant']) || !is_numeric($d['montant']) || (float) $d['montant'] <= 0) {
        $erreurs['montant'] = 'Le montant doit être supérieur à 0';
    }
    if ($erreurs) {
        erreur('Données invalides', 422, $erreurs);
    }

    if ($parCategorie) {
        $categorieId = (int) ($d['categorie_id'] ?? 0);
        if ($categorieId <= 0 || !categorie_appartient($pdo, 'categories_depenses', $categorieId, $utilisateurId)) {
            erreur('Catégorie introuvable', 404);
        }
        $st = $pdo->prepare(
            'INSERT INTO budgets_categories (utilisateur_id, categorie_id, mois, annee, montant)
             VALUES (:u, :c, :m, :a, :mt)
             ON DUPLICATE KEY UPDATE montant = VALUES(montant)'
        );
        $st->execute([
            ':u' => $utilisateurId,
            ':c' => $categorieId,
            ':m' => (int) $d['mois'],
            ':a' => (int) $d['annee'],
            ':mt' => (float) $d['montant'],
        ]);
        succes('Budget de catégorie enregistré');
    }

    $st = $pdo->prepare(
        'INSERT INTO budgets (utilisateur_id, mois, annee, montant)
         VALUES (:u, :m, :a, :mt)
         ON DUPLICATE KEY UPDATE montant = VALUES(montant)'
    );
    $st->execute([
        ':u' => $utilisateurId,
        ':m' => (int) $d['mois'],
        ':a' => (int) $d['annee'],
        ':mt' => (float) $d['montant'],
    ]);
    succes('Budget enregistré');
}

if ($methodeHttp === 'DELETE') {
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        erreur('Identifiant manquant', 422);
    }
    $table = $parCategorie ? 'budgets_categories' : 'budgets';
    $st = $pdo->prepare("DELETE FROM {$table} WHERE id = :i AND utilisateur_id = :u");
    $st->execute([':i' => $id, ':u' => $utilisateurId]);
    if ($st->rowCount() === 0) {
        erreur('Budget introuvable', 404);
    }
    succes('Budget supprimé');
}

erreur('Méthode non autorisée', 405);
