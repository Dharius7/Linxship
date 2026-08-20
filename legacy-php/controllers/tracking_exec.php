<?php

declare(strict_types=1);

require_once __DIR__ . '/controllers.php';

require_method('GET');

$trackingCode = normalize_tracking_code(request_string($_GET, 'trackingcode', 65));

if ($trackingCode === null) {
    redirect('../index.html?tracking=invalid#cta-6');
}

try {
    $statement = db()->prepare('SELECT id FROM addshipping WHERE tracking_number = ? LIMIT 1');
    $statement->bind_param('s', $trackingCode);
    $statement->execute();
    $shipment = $statement->get_result()->fetch_assoc();
} catch (Throwable $exception) {
    if (APP_DEBUG) {
        error_log($exception->getMessage());
    }

    redirect('../index.html?tracking=unavailable#cta-6');
}

if (!$shipment) {
    redirect('../index.html?tracking=not-found#cta-6');
}

redirect('../order-details.php?trackingcode=' . rawurlencode($trackingCode));
