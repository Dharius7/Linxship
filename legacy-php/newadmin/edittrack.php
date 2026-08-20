<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$admin = require_admin();
$id = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' ? admin_id_from_post() : admin_id_from_query();
if ($id === null) { admin_not_found('A valid tracking-event ID is required.'); }

try {
    $statement = db()->prepare('SELECT * FROM tracking_events WHERE id = ? LIMIT 1');
    $statement->bind_param('i', $id); $statement->execute();
    $existing = $statement->get_result()->fetch_assoc();
} catch (Throwable $exception) { admin_log_exception($exception); $existing = null; }
if (!$existing) { admin_not_found('Tracking event not found.'); }

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_post('edittrack.php?id=' . $id);
    $payload = tracking_event_payload($_POST);
    if ($payload['errors']) {
        $_SESSION['_tracking_edit_' . $id] = $payload['values'];
        foreach ($payload['errors'] as $error) { flash('error', $error); }
        redirect('edittrack.php?id=' . $id, 303);
    }
    try {
        if (!find_shipment((int) $payload['values']['shipment_id'])) {
            flash('error', 'The selected shipment does not exist.'); redirect('edittrack.php?id=' . $id, 303);
        }
        db()->begin_transaction();
        $update = db()->prepare(
            'UPDATE tracking_events SET shipment_id = ?, status = ?, location = ?, event_time = ?,
             requires_payment = ?, billing_amount = ?, admin_id = ?, updated_at = NOW() WHERE id = ?'
        );
        $update->execute([
            $payload['values']['shipment_id'], $payload['values']['status'], $payload['values']['location'],
            $payload['values']['event_time'], $payload['values']['requires_payment'], $payload['values']['billing_amount'],
            $admin['id'], $id,
        ]);
        sync_shipment_status((int) $existing['shipment_id']);
        if ((int) $existing['shipment_id'] !== (int) $payload['values']['shipment_id']) {
            sync_shipment_status((int) $payload['values']['shipment_id']);
        }
        db()->commit();
        log_activity($admin['id'], 'update', 'tracking_event', $id, 'Updated tracking event');
        flash('success', 'Tracking event updated.');
    } catch (Throwable $exception) {
        try { db()->rollback(); } catch (Throwable) {}
        admin_log_exception($exception); $_SESSION['_tracking_edit_' . $id] = $payload['values'];
        flash('error', 'Tracking event could not be updated.');
    }
    redirect('edittrack.php?id=' . $id, 303);
}

try { $shipments = shipment_choices(); $statuses = status_choices(); } catch (Throwable $exception) { admin_log_exception($exception); $shipments = []; $statuses = []; }
$event = $_SESSION['_tracking_edit_' . $id] ?? $existing; unset($_SESSION['_tracking_edit_' . $id]);
$pageTitle = 'Edit tracking event'; $activePage = 'tracking';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Edit tracking event</h1><p class="muted">Event #<?= $id ?></p></div><a class="button button-secondary" href="addtrackinginfo.php?shipment_id=<?= (int) $existing['shipment_id'] ?>">Back to events</a></div>
<section class="panel"><form method="post"><?= csrf_input() ?><input type="hidden" name="id" value="<?= $id ?>"><?php $submitLabel = 'Save event'; require __DIR__ . '/partials/tracking-event-form.php'; ?></form></section>
<?php require __DIR__ . '/partials/footer.php'; ?>
