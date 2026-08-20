<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/**
 * Return the shared application database connection.
 *
 * @throws mysqli_sql_exception when the database cannot be reached.
 */
function db(): mysqli
{
    static $connection = null;

    if ($connection instanceof mysqli) {
        return $connection;
    }

    if (DB_USER === '') {
        throw new RuntimeException('Database credentials are not configured.');
    }

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    $connection = mysqli_init();
    $connection->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5);
    $connection->real_connect(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
    $connection->set_charset('utf8mb4');
    $connection->query("SET time_zone = '+00:00'");

    return $connection;
}
