<?php
declare(strict_types=1);

require_once __DIR__ . '/reponse.php';

function demarrer_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

/** Identifiant de l'utilisateur connecté : TOUJOURS issu de la session, jamais du client. */
function utilisateur_id(): int
{
    demarrer_session();
    $id = $_SESSION['utilisateur_id'] ?? null;
    if (!is_int($id) || $id <= 0) {
        erreur('Authentification requise', 401);
    }
    return $id;
}

function connecter(int $id): void
{
    demarrer_session();
    session_regenerate_id(true);
    $_SESSION['utilisateur_id'] = $id;
}

function deconnecter(): void
{
    demarrer_session();
    $_SESSION = [];
    session_destroy();
}
