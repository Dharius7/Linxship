<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$admin = require_admin();
$id = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' ? admin_id_from_post() : admin_id_from_query();
if ($id === null) { admin_not_found('A valid message ID is required.'); }
try {
    $statement = db()->prepare('SELECT * FROM shipment_messages WHERE id = ? LIMIT 1');
    $statement->bind_param('i', $id); $statement->execute(); $existing = $statement->get_result()->fetch_assoc();
} catch (Throwable $exception) { admin_log_exception($exception); $existing = null; }
if (!$existing) { admin_not_found('Shipment message not found.'); }

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_post('editmessage.php?id=' . $id);
    $shipmentId = admin_id_from_post('shipment_id'); $message = request_string($_POST, 'message', 4000);
    if ($shipmentId === null || $message === '') { flash('error', 'Choose a shipment and enter a message.'); redirect('editmessage.php?id=' . $id, 303); }
    try {
        if (!find_shipment($shipmentId)) { flash('error', 'The selected shipment does not exist.'); redirect('editmessage.php?id=' . $id, 303); }
        $update = db()->prepare('UPDATE shipment_messages SET shipment_id = ?, message = ?, admin_id = ?, updated_at = NOW() WHERE id = ?');
        $update->bind_param('isii', $shipmentId, $message, $admin['id'], $id); $update->execute();
        log_activity($admin['id'], 'update', 'shipment_message', $id, 'Updated shipment message');
        flash('success', 'Message updated.');
    } catch (Throwable $exception) { admin_log_exception($exception); flash('error', 'Message could not be updated.'); }
    redirect('editmessage.php?id=' . $id, 303);
}
try { $shipments = shipment_choices(); } catch (Throwable $exception) { admin_log_exception($exception); $shipments = []; }
$pageTitle = 'Edit message'; $activePage = 'messages';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Edit shipment message</h1><p class="muted">Message #<?= $id ?></p></div><a class="button button-secondary" href="addmessage.php?shipment_id=<?= (int) $existing['shipment_id'] ?>">Back to messages</a></div>
<section class="panel"><form method="post"><?= csrf_input() ?><input type="hidden" name="id" value="<?= $id ?>"><div class="field"><label for="shipment_id">Shipment</label><select id="shipment_id" name="shipment_id" required><?php foreach ($shipments as $shipment): ?><option value="<?= (int) $shipment['id'] ?>"<?= (int) $existing['shipment_id'] === (int) $shipment['id'] ? ' selected' : '' ?>><?= e($shipment['tracking_number'] . ' — ' . $shipment['recipient_name']) ?></option><?php endforeach; ?></select></div><div class="field"><label for="message">Message</label><textarea id="message" name="message" required maxlength="4000"><?= e($existing['message']) ?></textarea></div><button class="button" type="submit">Save message</button></form></section>
<?php require __DIR__ . '/partials/footer.php'; ?>
