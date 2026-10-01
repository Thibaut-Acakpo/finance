<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';

/**
 * @param array<string,mixed> $donnees
 * @return array{0:array<string,mixed>,1:array<string,string>}
 */
function valider_operation(array $donnees): array
{
    $erreurs = [];
    $montant = $donnees['montant'] ?? null;
    if (!is_numeric($montant) || (float) $montant <= 0) {
        $erreurs['montant'] = 'Le montant doit être un nombre supérieur à 0';
    }
    $date = (string) ($donnees['date_operation'] ?? '');
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date) {
        $erreurs['date_operation'] = 'La date doit être au format AAAA-MM-JJ';
    }
    $moyen = (string) ($donnees['moyen_paiement'] ?? 'especes');
    if (!in_array($moyen, MOYENS_PAIEMENT, true)) {
        $erreurs['moyen_paiement'] = 'Moyen de paiement invalide';
    }
    $description = trim((string) ($donnees['description'] ?? ''));
    if (mb_strlen($description) > 255) {
        $erreurs['description'] = 'La description ne peut dépasser 255 caractères';
    }
    $categorie = $donnees['categorie_id'] ?? null;
    if ($categorie !== null && $categorie !== '' && !ctype_digit((string) $categorie)) {
        $erreurs['categorie_id'] = 'Catégorie invalide';
    }

    return [[
        'montant' => (float) $montant,
        'date_operation' => $date,
        'moyen_paiement' => $moyen,
        'description' => $description,
        'categorie_id' => ($categorie === null || $categorie === '') ? null : (int) $categorie,
    ], $erreurs];
}

/** @return array<string,string> */
function valider_periode(mixed $mois, mixed $annee): array
{
    $erreurs = [];
    if (!ctype_digit((string) $mois) || (int) $mois < 1 || (int) $mois > 12) {
        $erreurs['mois'] = 'Le mois doit être compris entre 1 et 12';
    }
    if (!ctype_digit((string) $annee) || (int) $annee < 2000 || (int) $annee > 2100) {
        $erreurs['annee'] = "L'année est invalide";
    }
    return $erreurs;
}

/** Vérifie qu'une catégorie appartient bien à l'utilisateur courant. */
function categorie_appartient(PDO $pdo, string $table, ?int $categorieId, int $utilisateurId): bool
{
    if ($categorieId === null) {
        return true;
    }
    $sql = "SELECT 1 FROM {$table} WHERE id = :id AND utilisateur_id = :u LIMIT 1";
    $st = $pdo->prepare($sql);
    $st->execute([':id' => $categorieId, ':u' => $utilisateurId]);
    return (bool) $st->fetchColumn();
}
