<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$admin = require_admin();
$selectedShipmentId = admin_id_from_query('shipment_id');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_post('addtrackinginfo.php');
    $payload = tracking_event_payload($_POST);
    $return = 'addtrackinginfo.php' . ($payload['values']['shipment_id'] ? '?shipment_id=' . (int) $payload['values']['shipment_id'] : '');
    if ($payload['errors']) {
        $_SESSION['_tracking_old'] = $payload['values'];
        foreach ($payload['errors'] as $error) { flash('error', $error); }
        redirect($return, 303);
    }
    try {
        if (!find_shipment((int) $payload['values']['shipment_id'])) {
            flash('error', 'The selected shipment does not exist.');
            redirect('addtrackinginfo.php', 303);
        }
        db()->begin_transaction();
        $statement = db()->prepare(
            'INSERT INTO tracking_events (shipment_id, status, location, event_time, requires_payment, billing_amount, admin_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([
            $payload['values']['shipment_id'], $payload['values']['status'], $payload['values']['location'],
            $payload['values']['event_time'], $payload['values']['requires_payment'],
            $payload['values']['billing_amount'], $admin['id'],
        ]);
        $eventId = (int) db()->insert_id;
        sync_shipment_status((int) $payload['values']['shipment_id']);
        db()->commit();
        log_activity($admin['id'], 'create', 'tracking_event', $eventId, 'Added tracking event to shipment #' . $payload['values']['shipment_id']);
        flash('success', 'Tracking event added.');
    } catch (Throwable $exception) {
        try { db()->rollback(); } catch (Throwable) {}
        admin_log_exception($exception);
        $_SESSION['_tracking_old'] = $payload['values'];
        flash('error', 'Tracking event could not be added.');
    }
    redirect($return, 303);
}

try {
    $shipments = shipment_choices();
    $statuses = status_choices();
    if ($selectedShipmentId) {
        $statement = db()->prepare(
            'SELECT te.*, s.tracking_number, s.recipient_name FROM tracking_events te
             JOIN addshipping s ON s.id = te.shipment_id WHERE te.shipment_id = ?
             ORDER BY te.event_time DESC, te.id DESC LIMIT 100'
        );
        $statement->bind_param('i', $selectedShipmentId);
        $statement->execute();
        $events = $statement->get_result()->fetch_all(MYSQLI_ASSOC);
    } else {
        $events = db()->query(
            'SELECT te.*, s.tracking_number, s.recipient_name FROM tracking_events te
             JOIN addshipping s ON s.id = te.shipment_id ORDER BY te.event_time DESC, te.id DESC LIMIT 100'
        )->fetch_all(MYSQLI_ASSOC);
    }
} catch (Throwable $exception) {
    admin_log_exception($exception); $shipments = []; $statuses = []; $events = [];
    flash('error', 'Tracking information could not be loaded.');
}
$event = $_SESSION['_tracking_old'] ?? [
    'shipment_id' => $selectedShipmentId, 'event_time' => date('Y-m-d H:i:s'),
    'billing_amount' => '0.00', 'requires_payment' => 0,
];
unset($_SESSION['_tracking_old']);
$pageTitle = 'Tracking events'; $activePage = 'tracking';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Tracking events</h1><p class="muted">Record the shipment’s progress in chronological order.</p></div><?php if ($selectedShipmentId): ?><a class="button button-secondary" href="addtrackinginfo.php">Show all shipments</a><?php endif; ?></div>
<section class="panel"><h2>Add event</h2><form method="post"><?= csrf_input() ?><?php $submitLabel = 'Add event'; require __DIR__ . '/partials/tracking-event-form.php'; ?></form></section>
<section class="panel"><h2>Recent events</h2>
<?php if (!$events): ?><p class="empty">No tracking events found.</p><?php else: ?><div class="table-wrap"><table>
<thead><tr><th>Shipment</th><th>Status</th><th>Location</th><th>Time</th><th>Billing</th><th>Actions</th></tr></thead>
<tbody><?php foreach ($events as $item): ?><tr>
<td><strong><?= e($item['tracking_number']) ?></strong><br><span class="muted"><?= e($item['recipient_name']) ?></span></td>
<td><?= e($item['status']) ?></td><td><?= e($item['location']) ?></td><td><?= e(format_datetime_value($item['event_time'])) ?></td>
<td><?= $item['requires_payment'] ? e(format_money_value($item['billing_amount'])) : 'None' ?></td>
<td><div class="actions"><a class="button button-small button-secondary" href="edittrack.php?id=<?= (int) $item['id'] ?>">Edit</a><form action="delete.php" method="post" onsubmit="return confirm('Delete this tracking event?');"><?= csrf_input() ?><input type="hidden" name="type" value="tracking_event"><input type="hidden" name="id" value="<?= (int) $item['id'] ?>"><input type="hidden" name="return" value="addtrackinginfo.php"><button class="button button-small button-danger" type="submit">Delete</button></form></div></td>
</tr><?php endforeach; ?></tbody></table></div><?php endif; ?></section>
<?php require __DIR__ . '/partials/footer.php'; ?>
