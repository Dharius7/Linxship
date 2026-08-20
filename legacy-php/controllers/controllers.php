<?php

declare(strict_types=1);

require_once __DIR__ . '/../database/connection.php';

if (PHP_SAPI !== 'cli' && !headers_sent()) {
    header_remove('X-Powered-By');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
}

function ensure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $sessionDirectory = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'sessions';
    if (!is_dir($sessionDirectory) && !mkdir($sessionDirectory, 0700, true) && !is_dir($sessionDirectory)) {
        throw new RuntimeException('The session storage directory could not be created.');
    }
    if (!is_writable($sessionDirectory)) {
        throw new RuntimeException('The session storage directory is not writable.');
    }
    session_save_path($sessionDirectory);

    $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== '' && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function e(mixed $value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function redirect(string $location, int $status = 302): never
{
    header('Location: ' . $location, true, $status);
    exit;
}

function require_method(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== strtoupper($method)) {
        http_response_code(405);
        header('Allow: ' . strtoupper($method));
        exit('Method Not Allowed');
    }
}

function flash(string $type, string $message): void
{
    ensure_session();
    $_SESSION['_flash'][$type][] = $message;
}

/** @return array<string, list<string>> */
function consume_flashes(): array
{
    ensure_session();
    $messages = $_SESSION['_flash'] ?? [];
    unset($_SESSION['_flash']);
    return is_array($messages) ? $messages : [];
}

function csrf_token(): string
{
    ensure_session();
    if (empty($_SESSION['_csrf'])) {
        $_SESSION['_csrf'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['_csrf'];
}

function csrf_input(): string
{
    return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

function verify_csrf_or_redirect(string $fallback): void
{
    ensure_session();
    $submitted = isset($_POST['csrf_token']) && is_string($_POST['csrf_token'])
        ? $_POST['csrf_token']
        : '';

    if ($submitted === '' || !hash_equals(csrf_token(), $submitted)) {
        flash('error', 'Your session expired. Please try again.');
        redirect($fallback, 303);
    }
}

function request_string(array $source, string $key, int $maxLength = 255): string
{
    $value = $source[$key] ?? '';
    if (!is_scalar($value)) {
        return '';
    }

    $value = trim((string) $value);
    return function_exists('mb_substr')
        ? mb_substr($value, 0, $maxLength)
        : substr($value, 0, $maxLength);
}

function request_int(array $source, string $key): ?int
{
    $value = filter_var($source[$key] ?? null, FILTER_VALIDATE_INT);
    return $value === false ? null : $value;
}

function normalize_tracking_code(string $value): ?string
{
    $value = strtoupper(trim($value));
    return preg_match('/^[A-Z0-9][A-Z0-9-]{3,63}$/', $value) === 1 ? $value : null;
}

function valid_date_or_null(string $value): ?string
{
    if ($value === '') {
        return null;
    }

    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value ? $value : null;
}

function format_date_value(?string $value, string $fallback = 'Not set'): string
{
    if (!$value) {
        return $fallback;
    }

    try {
        return (new DateTimeImmutable($value))->format('j M Y');
    } catch (Throwable) {
        return $fallback;
    }
}

function format_datetime_value(?string $value, string $fallback = 'Not set'): string
{
    if (!$value) {
        return $fallback;
    }

    try {
        return (new DateTimeImmutable($value))->format('j M Y, H:i');
    } catch (Throwable) {
        return $fallback;
    }
}

function format_money_value(mixed $value): string
{
    if ($value === null || $value === '') {
        return 'Not set';
    }

    return APP_CURRENCY . ' ' . number_format((float) $value, 2);
}

function generate_tracking_code(): string
{
    return 'LG' . strtoupper(bin2hex(random_bytes(5)));
}

function log_activity(?int $adminId, string $action, string $entityType, ?int $entityId, string $details = ''): void
{
    try {
        $statement = db()->prepare(
            'INSERT INTO activity_logs (admin_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)'
        );
        $statement->bind_param('issis', $adminId, $action, $entityType, $entityId, $details);
        $statement->execute();
    } catch (Throwable $exception) {
        if (APP_DEBUG) {
            error_log($exception->getMessage());
        }
    }
}
