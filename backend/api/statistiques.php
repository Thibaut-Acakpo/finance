<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/reponse.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/validation.php';

methode('GET');

$pdo = bd();
$utilisateurId = utilisateur_id();

$mois = $_GET['mois'] ?? date('n');
$annee = $_GET['annee'] ?? date('Y');
$erreurs = valider_periode($mois, $annee);
if ($erreurs) {
    erreur('Paramètres invalides', 422, $erreurs);
}
$mois = (int) $mois;
$annee = (int) $annee;

function somme_mois(PDO $pdo, string $table, int $u, int $m, int $a): float
{
    $st = $pdo->prepare(
        "SELECT COALESCE(SUM(montant), 0) FROM {$table}
         WHERE utilisateur_id = :u AND MONTH(date_operation) = :m AND YEAR(date_operation) = :a"
    );
    $st->execute([':u' => $u, ':m' => $m, ':a' => $a]);
    return (float) $st->fetchColumn();
}

function repartition(PDO $pdo, string $table, string $tableCat, int $u, int $m, int $a): array
{
    $st = $pdo->prepare(
        "SELECT COALESCE(c.nom, 'Sans catégorie') AS categorie_nom, SUM(o.montant) AS montant
         FROM {$table} o
         LEFT JOIN {$tableCat} c ON c.id = o.categorie_id
         WHERE o.utilisateur_id = :u AND MONTH(o.date_operation) = :m AND YEAR(o.date_operation) = :a
         GROUP BY categorie_nom
         ORDER BY montant DESC"
    );
    $st->execute([':u' => $u, ':m' => $m, ':a' => $a]);
    $lignes = $st->fetchAll();
    $total = array_sum(array_map(static fn($l) => (float) $l['montant'], $lignes));
    return array_map(static function ($l) use ($total) {
        $montant = (float) $l['montant'];
        return [
            'categorie_nom' => $l['categorie_nom'],
            'montant' => $montant,
            'pourcentage' => $total > 0 ? round($montant / $total * 100, 2) : 0.0,
        ];
    }, $lignes);
}

$totalRevenus = somme_mois($pdo, 'revenus', $utilisateurId, $mois, $annee);
$totalDepenses = somme_mois($pdo, 'depenses', $utilisateurId, $mois, $annee);

$evolution = [];
for ($m = 1; $m <= 12; $m++) {
    $r = somme_mois($pdo, 'revenus', $utilisateurId, $m, $annee);
    $d = somme_mois($pdo, 'depenses', $utilisateurId, $m, $annee);
    $evolution[] = ['mois' => $m, 'revenus' => $r, 'depenses' => $d, 'solde' => $r - $d];
}

succes('Statistiques de la période', [
    'periode' => ['mois' => $mois, 'annee' => $annee],
    'total_revenus' => $totalRevenus,
    'total_depenses' => $totalDepenses,
    'solde' => $totalRevenus - $totalDepenses,
    'taux_epargne' => $totalRevenus > 0
        ? round(($totalRevenus - $totalDepenses) / $totalRevenus * 100, 2)
        : 0.0,
    'repartition_depenses' => repartition($pdo, 'depenses', 'categories_depenses', $utilisateurId, $mois, $annee),
    'repartition_revenus' => repartition($pdo, 'revenus', 'categories_revenus', $utilisateurId, $mois, $annee),
    'evolution_annuelle' => $evolution,
], ['devise' => DEVISE]);
