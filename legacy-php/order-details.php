<?php

declare(strict_types=1);

require_once __DIR__ . '/controllers/controllers.php';

$trackingCode = normalize_tracking_code(request_string($_GET, 'trackingcode', 65));
if ($trackingCode === null) {
    redirect('index.html?tracking=invalid#cta-6');
}

$shipment = null;
$events = [];
$messages = [];
$loadError = false;

try {
    $shipmentStatement = db()->prepare(
        'SELECT id, sender_name, sender_phone, sender_address, sender_email,
            recipient_name, recipient_phone, recipient_address, recipient_email,
            payment_status, service_type, office_of_origin, destination, insurance,
            quantity, weight, freight_price, package_value, package_description,
            billing_status, show_billing, tracking_number, collection_date, cargo_image,
            delivery_date, shipment_details, shipment_status, created_at, updated_at
         FROM addshipping
         WHERE tracking_number = ?
         LIMIT 1'
    );
    $shipmentStatement->bind_param('s', $trackingCode);
    $shipmentStatement->execute();
    $shipment = $shipmentStatement->get_result()->fetch_assoc();

    if (!$shipment) {
        redirect('index.html?tracking=not-found#cta-6');
    }

    $shipmentId = (int) $shipment['id'];

    $eventStatement = db()->prepare(
        'SELECT status, location, event_time, requires_payment, billing_amount
         FROM tracking_events
         WHERE shipment_id = ?
         ORDER BY event_time DESC, id DESC'
    );
    $eventStatement->bind_param('i', $shipmentId);
    $eventStatement->execute();
    $eventResult = $eventStatement->get_result();
    while ($event = $eventResult->fetch_assoc()) {
        $events[] = $event;
    }

    $messageStatement = db()->prepare(
        'SELECT message, created_at
         FROM shipment_messages
         WHERE shipment_id = ?
         ORDER BY created_at DESC, id DESC'
    );
    $messageStatement->bind_param('i', $shipmentId);
    $messageStatement->execute();
    $messageResult = $messageStatement->get_result();
    while ($message = $messageResult->fetch_assoc()) {
        $messages[] = $message;
    }
} catch (Throwable $exception) {
    if (APP_DEBUG) {
        error_log($exception->getMessage());
    }

    http_response_code(503);
    $loadError = true;
}

$display = static function (mixed $value, string $fallback = 'Not provided'): string {
    $text = trim((string) ($value ?? ''));
    return e($text !== '' ? $text : $fallback);
};

$currentStatus = $events[0]['status'] ?? ($shipment['shipment_status'] ?? 'Shipment information received');
$lastUpdated = $events[0]['event_time'] ?? ($shipment['updated_at'] ?? null);
$showBilling = isset($shipment['show_billing']) && (int) $shipment['show_billing'] === 1;
$paymentStatus = trim((string) ($shipment['payment_status'] ?? ''));
$paymentStatus = $paymentStatus !== '' ? ucfirst(strtolower($paymentStatus)) : 'Not provided';
$billingStatus = trim((string) ($shipment['billing_status'] ?? ''));
$billingStatus = $billingStatus !== '' ? ucfirst(strtolower($billingStatus)) : 'Not provided';

$cargoImage = null;
if (!$loadError && !empty($shipment['cargo_image'])) {
    $storedImage = ltrim(str_replace('\\', '/', trim((string) $shipment['cargo_image'])), '/');
    $candidates = [$storedImage, 'img/' . $storedImage];

    foreach ($candidates as $candidate) {
        if (
            !str_contains($candidate, '..')
            && preg_match('/\.(?:avif|gif|jpe?g|png|webp)$/i', $candidate) === 1
            && is_file(__DIR__ . '/' . $candidate)
        ) {
            $cargoImage = $candidate;
            break;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="View the latest status and route details for a Lion Gold shipment.">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <meta name="referrer" content="same-origin">
    <title>Shipment <?= e($trackingCode) ?> | Lion Gold Shipping and Storage</title>
    <link rel="icon" type="image/png" href="assets/images/favicon/favicon.png">
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="css/public.css">
</head>
<body class="tracking-page">
    <a class="skip-link" href="#main-content">Skip to shipment details</a>

    <header class="tracking-header">
        <div class="tracking-container tracking-header__inner">
            <a class="tracking-brand" href="index.html" aria-label="Lion Gold home">
                <img src="assets/images/logo/logo-dark.png" alt="Lion Gold Shipping and Storage">
            </a>
            <a class="tracking-header__link" href="index.html#cta-6">Track another shipment</a>
        </div>
    </header>

    <main id="main-content" class="tracking-container tracking-main" tabindex="-1">
        <?php if ($loadError): ?>
            <section class="tracking-card tracking-error" role="alert">
                <p class="tracking-eyebrow">Service temporarily unavailable</p>
                <h1>We could not load this shipment</h1>
                <p>Please try again shortly. Your tracking code has not been changed.</p>
                <a class="tracking-button" href="index.html#cta-6">Return to tracking</a>
            </section>
        <?php else: ?>
            <section class="tracking-hero" aria-labelledby="shipment-title">
                <div>
                    <p class="tracking-eyebrow">Shipment tracking</p>
                    <h1 id="shipment-title">Tracking <?= e($shipment['tracking_number']) ?></h1>
                    <p class="tracking-lead">Latest information from origin to destination.</p>
                </div>
                <div class="tracking-status" aria-label="Current shipment status">
                    <span>Current status</span>
                    <strong><?= $display($currentStatus) ?></strong>
                </div>
            </section>

            <section class="tracking-summary" aria-label="Shipment summary">
                <dl class="tracking-summary__item">
                    <dt>Collection date</dt>
                    <dd><?= e(format_date_value($shipment['collection_date'] ?? null)) ?></dd>
                </dl>
                <dl class="tracking-summary__item">
                    <dt>Expected delivery</dt>
                    <dd><?= e(format_date_value($shipment['delivery_date'] ?? null)) ?></dd>
                </dl>
                <dl class="tracking-summary__item">
                    <dt>Last update</dt>
                    <dd><?= e(format_datetime_value($lastUpdated)) ?></dd>
                </dl>
            </section>

            <?php if ($messages): ?>
                <section class="tracking-card" aria-labelledby="shipment-messages-title">
                    <div class="tracking-section-heading">
                        <p class="tracking-eyebrow">Updates from our team</p>
                        <h2 id="shipment-messages-title">Shipment messages</h2>
                    </div>
                    <div class="shipment-messages">
                        <?php foreach ($messages as $message): ?>
                            <article class="shipment-message">
                                <p><?= nl2br(e($message['message'])) ?></p>
                                <time datetime="<?= e($message['created_at']) ?>">
                                    <?= e(format_datetime_value($message['created_at'] ?? null)) ?>
                                </time>
                            </article>
                        <?php endforeach; ?>
                    </div>
                </section>
            <?php endif; ?>

            <div class="tracking-layout">
                <div class="tracking-layout__main">
                    <section class="tracking-card" aria-labelledby="route-title">
                        <div class="tracking-section-heading">
                            <p class="tracking-eyebrow">Route</p>
                            <h2 id="route-title">Delivery information</h2>
                        </div>
                        <div class="route-grid">
                            <article class="route-stop">
                                <span class="route-stop__label">From</span>
                                <h3><?= $display($shipment['office_of_origin']) ?></h3>
                                <dl class="details-list">
                                    <div><dt>Sender</dt><dd><?= $display($shipment['sender_name']) ?></dd></div>
                                    <div><dt>Address</dt><dd><?= $display($shipment['sender_address']) ?></dd></div>
                                    <div><dt>Phone</dt><dd><?= $display($shipment['sender_phone']) ?></dd></div>
                                    <div><dt>Email</dt><dd><?= $display($shipment['sender_email']) ?></dd></div>
                                </dl>
                            </article>
                            <article class="route-stop">
                                <span class="route-stop__label">To</span>
                                <h3><?= $display($shipment['destination']) ?></h3>
                                <dl class="details-list">
                                    <div><dt>Recipient</dt><dd><?= $display($shipment['recipient_name']) ?></dd></div>
                                    <div><dt>Address</dt><dd><?= $display($shipment['recipient_address']) ?></dd></div>
                                    <div><dt>Phone</dt><dd><?= $display($shipment['recipient_phone']) ?></dd></div>
                                    <div><dt>Email</dt><dd><?= $display($shipment['recipient_email']) ?></dd></div>
                                </dl>
                            </article>
                        </div>
                    </section>

                    <section class="tracking-card" aria-labelledby="package-title">
                        <div class="tracking-section-heading">
                            <p class="tracking-eyebrow">Contents</p>
                            <h2 id="package-title">Package information</h2>
                        </div>
                        <dl class="package-grid">
                            <div><dt>Description</dt><dd><?= $display($shipment['package_description']) ?></dd></div>
                            <div><dt>Service</dt><dd><?= $display($shipment['service_type']) ?></dd></div>
                            <div><dt>Quantity</dt><dd><?= $display($shipment['quantity']) ?></dd></div>
                            <div><dt>Weight</dt><dd><?= $display($shipment['weight']) ?><?= trim((string) ($shipment['weight'] ?? '')) !== '' ? ' kg' : '' ?></dd></div>
                            <div><dt>Declared value</dt><dd><?= e(format_money_value($shipment['package_value'] ?? null)) ?></dd></div>
                            <div><dt>Insurance</dt><dd><?= e(format_money_value($shipment['insurance'] ?? null)) ?></dd></div>
                            <?php if ($showBilling): ?>
                                <div><dt>Freight price</dt><dd><?= e(format_money_value($shipment['freight_price'] ?? null)) ?></dd></div>
                                <div><dt>Payment status</dt><dd><?= e($paymentStatus) ?></dd></div>
                                <div><dt>Billing status</dt><dd><?= e($billingStatus) ?></dd></div>
                            <?php endif; ?>
                        </dl>

                        <?php if (trim((string) ($shipment['shipment_details'] ?? '')) !== ''): ?>
                            <div class="shipment-description">
                                <h3>Shipment notes</h3>
                                <p><?= nl2br(e($shipment['shipment_details'])) ?></p>
                            </div>
                        <?php endif; ?>

                        <?php if ($cargoImage !== null): ?>
                            <figure class="cargo-image">
                                <img src="<?= e($cargoImage) ?>" alt="Cargo associated with shipment <?= e($shipment['tracking_number']) ?>">
                                <figcaption>Shipment cargo image</figcaption>
                            </figure>
                        <?php endif; ?>
                    </section>
                </div>

                <aside class="tracking-layout__aside" aria-labelledby="timeline-title">
                    <section class="tracking-card tracking-card--sticky">
                        <div class="tracking-section-heading">
                            <p class="tracking-eyebrow">Progress</p>
                            <h2 id="timeline-title">Tracking history</h2>
                        </div>

                        <?php if ($events): ?>
                            <ol class="tracking-timeline">
                                <?php foreach ($events as $index => $event): ?>
                                    <li class="tracking-timeline__event<?= $index === 0 ? ' is-current' : '' ?>">
                                        <h3><?= $display($event['status']) ?></h3>
                                        <?php if (trim((string) ($event['location'] ?? '')) !== ''): ?>
                                            <p><?= e($event['location']) ?></p>
                                        <?php endif; ?>
                                        <time datetime="<?= e($event['event_time']) ?>">
                                            <?= e(format_datetime_value($event['event_time'] ?? null)) ?>
                                        </time>
                                        <?php if ((int) ($event['requires_payment'] ?? 0) === 1): ?>
                                            <p class="payment-notice">
                                                Payment required
                                                <?php if ($event['billing_amount'] !== null && $event['billing_amount'] !== ''): ?>
                                                    — <?= e(format_money_value($event['billing_amount'])) ?>
                                                <?php endif; ?>
                                            </p>
                                        <?php endif; ?>
                                    </li>
                                <?php endforeach; ?>
                            </ol>
                        <?php else: ?>
                            <p>No tracking events have been posted yet.</p>
                        <?php endif; ?>
                    </section>
                </aside>
            </div>

            <section class="tracking-card tracking-again" aria-labelledby="track-again-title">
                <div>
                    <h2 id="track-again-title">Track another shipment</h2>
                    <p>Enter a 4–64 character tracking code using letters, numbers, or hyphens.</p>
                </div>
                <form class="tracking-again__form" action="controllers/tracking_exec.php" method="get">
                    <label for="trackingcode-again">Tracking code</label>
                    <div>
                        <input id="trackingcode-again" name="trackingcode" type="text" minlength="4" maxlength="64" pattern="[A-Za-z0-9][A-Za-z0-9-]{3,63}" autocomplete="off" autocapitalize="characters" spellcheck="false" required>
                        <button type="submit">Track shipment</button>
                    </div>
                </form>
            </section>
        <?php endif; ?>
    </main>

    <footer class="tracking-footer">
        <div class="tracking-container">
            <p>&copy; 2026 Lion Gold Shipping and Storage. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
