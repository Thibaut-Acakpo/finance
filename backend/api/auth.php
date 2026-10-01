<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/reponse.php';
require_once __DIR__ . '/includes/auth.php';

$action = $_GET['action'] ?? '';
$pdo = bd();

switch ($action) {
    case 'inscription':
        methode('POST');
        $d = corps_json();
        $nom = trim((string) ($d['nom'] ?? ''));
        $email = trim((string) ($d['email'] ?? ''));
        $mdp = (string) ($d['mot_de_passe'] ?? '');
        $erreurs = [];
        if ($nom === '') {
            $erreurs['nom'] = 'Le nom est obligatoire';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $erreurs['email'] = "L'adresse email est invalide";
        }
        if (strlen($mdp) < 8) {
            $erreurs['mot_de_passe'] = 'Le mot de passe doit contenir au moins 8 caractères';
        }
        if ($erreurs) {
            erreur('Données invalides', 422, $erreurs);
        }

        $st = $pdo->prepare('SELECT 1 FROM utilisateurs WHERE email = :e LIMIT 1');
        $st->execute([':e' => $email]);
        if ($st->fetchColumn()) {
            erreur('Un compte existe déjà avec cet email', 409);
        }

        try {
            $pdo->beginTransaction();
            $st = $pdo->prepare(
                'INSERT INTO utilisateurs (nom, email, mot_de_passe) VALUES (:n, :e, :m)'
            );
            $st->execute([
                ':n' => $nom,
                ':e' => $email,
                ':m' => password_hash($mdp, PASSWORD_DEFAULT),
            ]);
            $id = (int) $pdo->lastInsertId();

            $insRev = $pdo->prepare(
                'INSERT INTO categories_revenus (utilisateur_id, nom) VALUES (:u, :n)'
            );
            foreach (CATEGORIES_REVENUS_DEFAUT as $c) {
                $insRev->execute([':u' => $id, ':n' => $c]);
            }
            $insDep = $pdo->prepare(
                'INSERT INTO categories_depenses (utilisateur_id, nom) VALUES (:u, :n)'
            );
            foreach (CATEGORIES_DEPENSES_DEFAUT as $c) {
                $insDep->execute([':u' => $id, ':n' => $c]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            error_log('Inscription : ' . $e->getMessage());
            erreur('Erreur interne du serveur', 500);
        }

        connecter($id);
        succes('Compte créé avec succès', ['id' => $id, 'nom' => $nom, 'email' => $email], null, 201);

    case 'connexion':
        methode('POST');
        $d = corps_json();
        $email = trim((string) ($d['email'] ?? ''));
        $mdp = (string) ($d['mot_de_passe'] ?? '');
        $st = $pdo->prepare('SELECT id, nom, email, mot_de_passe FROM utilisateurs WHERE email = :e LIMIT 1');
        $st->execute([':e' => $email]);
        $u = $st->fetch();
        if (!$u || !password_verify($mdp, (string) $u['mot_de_passe'])) {
            erreur('Email ou mot de passe incorrect', 401);
        }
        connecter((int) $u['id']);
        succes('Connexion réussie', [
            'id' => (int) $u['id'],
            'nom' => $u['nom'],
            'email' => $u['email'],
        ]);

    case 'deconnexion':
        methode('POST');
        deconnecter();
        succes('Déconnexion réussie');

    case 'session':
        methode('GET');
        demarrer_session();
        $id = $_SESSION['utilisateur_id'] ?? null;
        if (!is_int($id)) {
            succes('Aucune session active', null);
        }
        $st = $pdo->prepare('SELECT id, nom, email, cree_le FROM utilisateurs WHERE id = :i');
        $st->execute([':i' => $id]);
        succes('Session active', $st->fetch() ?: null);

    default:
        erreur('Action inconnue', 404);
}
