<?php

declare(strict_types=1);

/** Load a small .env file without requiring Composer. */
function load_env_file(string $path): void
{
    if (!is_file($path) || !is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = array_map('trim', explode('=', $line, 2));
        if (!preg_match('/^[A-Z_][A-Z0-9_]*$/i', $name) || getenv($name) !== false) {
            continue;
        }

        if (strlen($value) >= 2) {
            $first = $value[0];
            $last = $value[strlen($value) - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                $value = substr($value, 1, -1);
            }
        }

        putenv($name . '=' . $value);
        $_ENV[$name] = $value;
    }
}

function env_value(string $name, ?string $default = null): ?string
{
    $value = getenv($name);
    return $value === false ? $default : $value;
}

function env_flag(string $name, bool $default = false): bool
{
    $value = env_value($name);
    if ($value === null) {
        return $default;
    }

    return filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $default;
}

// The environment file lives one level above the public document root so the
// built-in server and normal virtual-host configurations cannot serve it.
load_env_file(dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env');

define('APP_ENV', env_value('APP_ENV', 'production'));
define('APP_DEBUG', env_flag('APP_DEBUG', false));
define('APP_CURRENCY', env_value('APP_CURRENCY', 'USD'));

define('DB_HOST', env_value('DB_HOST', '127.0.0.1'));
define('DB_PORT', (int) env_value('DB_PORT', '3306'));
define('DB_NAME', env_value('DB_NAME', 'liongold'));
define('DB_USER', env_value('DB_USER', ''));
define('DB_PASSWORD', env_value('DB_PASSWORD', ''));

// Store and display application timestamps consistently across PHP and MySQL.
date_default_timezone_set('UTC');
