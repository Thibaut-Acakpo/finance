<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/reponse.php';
require_once __DIR__ . '/includes/auth.php';

methode('GET');

$pdo = bd();
$utilisateurId = utilisateur_id();

$params = [':u1' => $utilisateurId, ':u2' => $utilisateurId];
$filtreRev = '';
$filtreDep = '';

if (!empty($_GET['date_debut'])) {
    $filtreRev .= ' AND r.date_operation >= :debut1';
    $filtreDep .= ' AND d.date_operation >= :debut2';
    $params[':debut1'] = (string) $_GET['date_debut'];
    $params[':debut2'] = (string) $_GET['date_debut'];
}
if (!empty($_GET['date_fin'])) {
    $filtreRev .= ' AND r.date_operation <= :fin1';
    $filtreDep .= ' AND d.date_operation <= :fin2';
    $params[':fin1'] = (string) $_GET['date_fin'];
    $params[':fin2'] = (string) $_GET['date_fin'];
}
if (!empty($_GET['recherche'])) {
    $filtreRev .= ' AND r.description LIKE :q1';
    $filtreDep .= ' AND d.description LIKE :q2';
    $params[':q1'] = '%' . (string) $_GET['recherche'] . '%';
    $params[':q2'] = '%' . (string) $_GET['recherche'] . '%';
}

$sql = "
  SELECT * FROM (
    SELECT 'revenu' AS type, r.id, r.montant, r.date_operation, r.description,
           r.moyen_paiement, c.nom AS categorie_nom
    FROM revenus r
    LEFT JOIN categories_revenus c ON c.id = r.categorie_id
    WHERE r.utilisateur_id = :u1 {$filtreRev}
    UNION ALL
    SELECT 'depense' AS type, d.id, d.montant, d.date_operation, d.description,
           d.moyen_paiement, c.nom AS categorie_nom
    FROM depenses d
    LEFT JOIN categories_depenses c ON c.id = d.categorie_id
    WHERE d.utilisateur_id = :u2 {$filtreDep}
  ) t
  ORDER BY t.date_operation DESC, t.id DESC
";

$type = $_GET['type'] ?? 'tous';
$st = $pdo->prepare($sql);
$st->execute($params);
$lignes = $st->fetchAll();

if ($type === 'revenu' || $type === 'depense') {
    $lignes = array_values(array_filter($lignes, static fn($l) => $l['type'] === $type));
}

$page = max(1, (int) ($_GET['page'] ?? 1));
$parPage = min(100, max(1, (int) ($_GET['par_page'] ?? 20)));
$total = count($lignes);

$totalRevenus = 0.0;
$totalDepenses = 0.0;
foreach ($lignes as $l) {
    if ($l['type'] === 'revenu') {
        $totalRevenus += (float) $l['montant'];
    } else {
        $totalDepenses += (float) $l['montant'];
    }
}

succes('Historique des transactions', array_slice($lignes, ($page - 1) * $parPage, $parPage), [
    'page' => $page,
    'par_page' => $parPage,
    'total' => $total,
    'pages' => (int) ceil($total / $parPage),
    'total_revenus' => $totalRevenus,
    'total_depenses' => $totalDepenses,
    'solde' => $totalRevenus - $totalDepenses,
    'devise' => DEVISE,
]);
