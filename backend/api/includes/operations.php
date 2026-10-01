<?php
declare(strict_types=1);

require_once __DIR__ . '/reponse.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/validation.php';

/**
 * Contrôleur générique des opérations (revenus ou dépenses).
 * Le user_id provient toujours de la session : aucune donnée d'un autre
 * utilisateur ne peut être lue, modifiée ou supprimée.
 */
function controleur_operations(PDO $pdo, string $type): never
{
    $utilisateurId = utilisateur_id();
    $table = $type === 'revenu' ? 'revenus' : 'depenses';
    $tableCat = $type === 'revenu' ? 'categories_revenus' : 'categories_depenses';
    $methodeHttp = $_SERVER['REQUEST_METHOD'];

    if ($methodeHttp === 'GET') {
        $conditions = ['o.utilisateur_id = :u'];
        $params = [':u' => $utilisateurId];

        if (isset($_GET['mois'], $_GET['annee'])) {
            $erreurs = valider_periode($_GET['mois'], $_GET['annee']);
            if ($erreurs) {
                erreur('Paramètres invalides', 422, $erreurs);
            }
            $conditions[] = 'MONTH(o.date_operation) = :mois AND YEAR(o.date_operation) = :annee';
            $params[':mois'] = (int) $_GET['mois'];
            $params[':annee'] = (int) $_GET['annee'];
        }
        if (!empty($_GET['date_debut'])) {
            $conditions[] = 'o.date_operation >= :debut';
            $params[':debut'] = (string) $_GET['date_debut'];
        }
        if (!empty($_GET['date_fin'])) {
            $conditions[] = 'o.date_operation <= :fin';
            $params[':fin'] = (string) $_GET['date_fin'];
        }
        if (!empty($_GET['categorie_id'])) {
            $conditions[] = 'o.categorie_id = :cat';
            $params[':cat'] = (int) $_GET['categorie_id'];
        }
        if (!empty($_GET['recherche'])) {
            $conditions[] = 'o.description LIKE :q';
            $params[':q'] = '%' . (string) $_GET['recherche'] . '%';
        }
        $where = implode(' AND ', $conditions);

        $page = max(1, (int) ($_GET['page'] ?? 1));
        $parPage = min(100, max(1, (int) ($_GET['par_page'] ?? 20)));
        $offset = ($page - 1) * $parPage;

        $st = $pdo->prepare("SELECT COUNT(*) FROM {$table} o WHERE {$where}");
        $st->execute($params);
        $total = (int) $st->fetchColumn();

        $sql = "SELECT o.id, o.montant, o.date_operation, o.description, o.moyen_paiement,
                       o.categorie_id, c.nom AS categorie_nom, o.cree_le
                FROM {$table} o
                LEFT JOIN {$tableCat} c ON c.id = o.categorie_id
                WHERE {$where}
                ORDER BY o.date_operation DESC, o.id DESC
                LIMIT {$parPage} OFFSET {$offset}";
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $lignes = $st->fetchAll();

        $st = $pdo->prepare("SELECT COALESCE(SUM(o.montant), 0) FROM {$table} o WHERE {$where}");
        $st->execute($params);
        $somme = (float) $st->fetchColumn();

        succes('Liste des opérations', $lignes, [
            'page' => $page,
            'par_page' => $parPage,
            'total' => $total,
            'pages' => (int) ceil($total / $parPage),
            'somme' => $somme,
            'devise' => DEVISE,
        ]);
    }

    if ($methodeHttp === 'POST' || $methodeHttp === 'PUT') {
        $d = corps_json();
        [$valeurs, $erreurs] = valider_operation($d);
        if ($erreurs) {
            erreur('Données invalides', 422, $erreurs);
        }
        if (!categorie_appartient($pdo, $tableCat, $valeurs['categorie_id'], $utilisateurId)) {
            erreur('Catégorie introuvable', 404);
        }

        if ($methodeHttp === 'POST') {
            $st = $pdo->prepare(
                "INSERT INTO {$table}
                 (utilisateur_id, categorie_id, montant, date_operation, description, moyen_paiement)
                 VALUES (:u, :c, :m, :d, :desc, :moy)"
            );
            $st->execute([
                ':u' => $utilisateurId,
                ':c' => $valeurs['categorie_id'],
                ':m' => $valeurs['montant'],
                ':d' => $valeurs['date_operation'],
                ':desc' => $valeurs['description'],
                ':moy' => $valeurs['moyen_paiement'],
            ]);
            succes('Opération enregistrée', ['id' => (int) $pdo->lastInsertId()] + $valeurs, null, 201);
        }

        $id = (int) ($d['id'] ?? 0);
        if ($id <= 0) {
            erreur('Identifiant manquant', 422, ['id' => "L'identifiant est obligatoire"]);
        }
        $st = $pdo->prepare(
            "UPDATE {$table}
             SET categorie_id = :c, montant = :m, date_operation = :d,
                 description = :desc, moyen_paiement = :moy
             WHERE id = :i AND utilisateur_id = :u"
        );
        $st->execute([
            ':c' => $valeurs['categorie_id'],
            ':m' => $valeurs['montant'],
            ':d' => $valeurs['date_operation'],
            ':desc' => $valeurs['description'],
            ':moy' => $valeurs['moyen_paiement'],
            ':i' => $id,
            ':u' => $utilisateurId,
        ]);
        if ($st->rowCount() === 0) {
            erreur('Opération introuvable', 404);
        }
        succes('Opération modifiée', ['id' => $id] + $valeurs);
    }

    if ($methodeHttp === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            erreur('Identifiant manquant', 422);
        }
        $st = $pdo->prepare("DELETE FROM {$table} WHERE id = :i AND utilisateur_id = :u");
        $st->execute([':i' => $id, ':u' => $utilisateurId]);
        if ($st->rowCount() === 0) {
            erreur('Opération introuvable', 404);
        }
        succes('Opération supprimée');
    }

    erreur('Méthode non autorisée', 405);
}
