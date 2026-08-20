<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

require_admin();
$id = admin_id_from_query();
if ($id === null) { admin_not_found('A valid shipment ID is required.'); }
try {
    $shipment = find_shipment($id);
    if (!$shipment) { admin_not_found('Shipment not found.'); }
    $statement = db()->prepare('SELECT * FROM tracking_events WHERE shipment_id = ? ORDER BY event_time ASC, id ASC');
    $statement->bind_param('i', $id); $statement->execute(); $events = $statement->get_result()->fetch_all(MYSQLI_ASSOC);
} catch (Throwable $exception) { admin_log_exception($exception); http_response_code(503); exit('The invoice is temporarily unavailable.'); }

$pageTitle = 'Invoice ' . $shipment['tracking_number']; $activePage = 'shipments';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading no-print"><div><h1>Shipment invoice</h1><p class="muted"><?= e($shipment['tracking_number']) ?></p></div><div class="actions"><button class="button" type="button" onclick="window.print()">Print</button><a class="button button-secondary" href="editship.php?id=<?= $id ?>">Back to shipment</a></div></div>
<article class="panel invoice">
<div class="page-heading"><div><img src="../assets/images/logo/logo-dark.png" alt="Lion Gold" style="max-height:58px;max-width:220px"><h2>Shipment invoice</h2></div><div><strong><?= e($shipment['tracking_number']) ?></strong><br><span class="muted">Created <?= e(format_date_value($shipment['created_at'])) ?></span></div></div>
<div class="grid grid-2"><section><h2>Sender</h2><strong><?= e($shipment['sender_name']) ?></strong><p><?= nl2br(e($shipment['sender_address'])) ?><br><?= e($shipment['sender_phone']) ?><br><?= e($shipment['sender_email']) ?></p></section><section><h2>Recipient</h2><strong><?= e($shipment['recipient_name']) ?></strong><p><?= nl2br(e($shipment['recipient_address'])) ?><br><?= e($shipment['recipient_phone']) ?><br><?= e($shipment['recipient_email']) ?></p></section></div>
<table><tbody>
<tr><th>Service</th><td><?= e($shipment['service_type']) ?></td><th>Status</th><td><?= e($shipment['shipment_status']) ?></td></tr>
<tr><th>Origin</th><td><?= e($shipment['office_of_origin']) ?></td><th>Destination</th><td><?= e($shipment['destination']) ?></td></tr>
<tr><th>Collection</th><td><?= e(format_date_value($shipment['collection_date'])) ?></td><th>Delivery</th><td><?= e(format_date_value($shipment['delivery_date'])) ?></td></tr>
<tr><th>Package</th><td><?= e($shipment['package_description']) ?></td><th>Quantity / weight</th><td><?= (int) $shipment['quantity'] ?> / <?= e($shipment['weight']) ?></td></tr>
</tbody></table>
<h2>Charges</h2><table><tbody><tr><th>Freight</th><td><?= e(format_money_value($shipment['freight_price'])) ?></td></tr><tr><th>Insurance</th><td><?= e(format_money_value($shipment['insurance'])) ?></td></tr><tr><th>Declared value</th><td><?= e(format_money_value($shipment['package_value'])) ?></td></tr><tr><th>Payment</th><td><?= e(ucfirst((string) $shipment['payment_status'])) ?></td></tr></tbody></table>
<p class="invoice-total">Freight total: <?= e(format_money_value($shipment['freight_price'])) ?></p>
<?php if ($events): ?><h2>Tracking history</h2><table><thead><tr><th>Date</th><th>Status</th><th>Location</th></tr></thead><tbody><?php foreach ($events as $event): ?><tr><td><?= e(format_datetime_value($event['event_time'])) ?></td><td><?= e($event['status']) ?></td><td><?= e($event['location']) ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?>
</article>
<?php require __DIR__ . '/partials/footer.php'; ?>
