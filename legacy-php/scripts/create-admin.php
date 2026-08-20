<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    exit("Not found.\n");
}

require_once dirname(__DIR__) . '/database/connection.php';

function write_error(string $message): never
{
    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
}

function read_password(): string
{
    $password = getenv('ADMIN_PASSWORD');
    if ($password !== false) {
        putenv('ADMIN_PASSWORD');
        unset($_ENV['ADMIN_PASSWORD']);
        return $password;
    }

    fwrite(STDOUT, 'Password (input is visible): ');
    $input = fgets(STDIN);
    fwrite(STDOUT, PHP_EOL);

    return $input === false ? '' : rtrim($input, "\r\n");
}

$username = trim($argv[1] ?? '');
if ($username === '') {
    write_error('Usage: php scripts/create-admin.php <username>');
}

if (!preg_match('/\A[A-Za-z0-9][A-Za-z0-9_.-]{2,79}\z/', $username)) {
    write_error('Username must be 3-80 characters and use only letters, numbers, dot, underscore, or hyphen.');
}

$password = read_password();

if (strlen($password) < 12 || strlen($password) > 4096) {
    write_error('Password must be between 12 and 4096 characters.');
}

if (
    !preg_match('/[a-z]/', $password)
    || !preg_match('/[A-Z]/', $password)
    || !preg_match('/\d/', $password)
    || !preg_match('/[^A-Za-z0-9]/', $password)
) {
    write_error('Password must include lowercase, uppercase, number, and symbol characters.');
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
if ($passwordHash === false) {
    write_error('PHP could not hash the password.');
}

if (function_exists('sodium_memzero')) {
    sodium_memzero($password);
} else {
    $password = '';
}

try {
    $statement = db()->prepare(
        'INSERT INTO admins (username, password_hash, is_active) VALUES (?, ?, 1) '
        . 'ON DUPLICATE KEY UPDATE password_hash = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP'
    );
    $statement->bind_param('sss', $username, $passwordHash, $passwordHash);
    $statement->execute();
    $statement->close();

    fwrite(STDOUT, sprintf("Administrator '%s' is ready.%s", $username, PHP_EOL));
} catch (Throwable $exception) {
    write_error('Unable to create the administrator: ' . $exception->getMessage());
}
