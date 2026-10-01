<?php
declare(strict_types=1);

function entetes_json(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
}

/** @param array<string,mixed>|list<mixed>|null $data */
function succes(string $message, $data = null, ?array $meta = null, int $code = 200): never
{
    entetes_json();
    http_response_code($code);
    $corps = ['success' => true, 'message' => $message, 'data' => $data];
    if ($meta !== null) {
        $corps['meta'] = $meta;
    }
    echo json_encode($corps, JSON_UNESCAPED_UNICODE);
    exit;
}

/** @param array<string,string> $errors */
function erreur(string $message, int $code = 400, array $errors = []): never
{
    entetes_json();
    http_response_code($code);
    $corps = ['success' => false, 'message' => $message];
    if ($errors) {
        $corps['errors'] = $errors;
    }
    echo json_encode($corps, JSON_UNESCAPED_UNICODE);
    exit;
}

/** @return array<string,mixed> */
function corps_json(): array
{
    $brut = file_get_contents('php://input') ?: '';
    $data = json_decode($brut, true);
    return is_array($data) ? $data : [];
}

function methode(string ...$autorisees): void
{
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($m, $autorisees, true)) {
        erreur('Méthode non autorisée', 405);
    }
}
