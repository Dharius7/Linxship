<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$admin = require_admin();
$selectedShipmentId = admin_id_from_query('shipment_id');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_post('addmessage.php');
    $shipmentId = admin_id_from_post('shipment_id');
    $message = request_string($_POST, 'message', 4000);
    $return = 'addmessage.php' . ($shipmentId ? '?shipment_id=' . $shipmentId : '');
    if ($shipmentId === null || $message === '') {
        flash('error', 'Choose a shipment and enter a message.'); redirect($return, 303);
    }
    try {
        if (!find_shipment($shipmentId)) { flash('error', 'The selected shipment does not exist.'); redirect('addmessage.php', 303); }
        $statement = db()->prepare('INSERT INTO shipment_messages (shipment_id, message, admin_id) VALUES (?, ?, ?)');
        $statement->bind_param('isi', $shipmentId, $message, $admin['id']); $statement->execute();
        $id = (int) db()->insert_id;
        log_activity($admin['id'], 'create', 'shipment_message', $id, 'Added message to shipment #' . $shipmentId);
        flash('success', 'Shipment message added.');
    } catch (Throwable $exception) { admin_log_exception($exception); flash('error', 'Message could not be added.'); }
    redirect($return, 303);
}

try {
    $shipments = shipment_choices();
    if ($selectedShipmentId) {
        $statement = db()->prepare(
            'SELECT sm.*, s.tracking_number, s.recipient_name, a.username AS admin_username
             FROM shipment_messages sm JOIN addshipping s ON s.id = sm.shipment_id
             LEFT JOIN admins a ON a.id = sm.admin_id WHERE sm.shipment_id = ?
             ORDER BY sm.created_at DESC, sm.id DESC LIMIT 100'
        );
        $statement->bind_param('i', $selectedShipmentId); $statement->execute();
        $messages = $statement->get_result()->fetch_all(MYSQLI_ASSOC);
    } else {
        $messages = db()->query(
            'SELECT sm.*, s.tracking_number, s.recipient_name, a.username AS admin_username
             FROM shipment_messages sm JOIN addshipping s ON s.id = sm.shipment_id
             LEFT JOIN admins a ON a.id = sm.admin_id ORDER BY sm.created_at DESC, sm.id DESC LIMIT 100'
        )->fetch_all(MYSQLI_ASSOC);
    }
} catch (Throwable $exception) { admin_log_exception($exception); $shipments = []; $messages = []; flash('error', 'Shipment messages could not be loaded.'); }

$pageTitle = 'Shipment messages'; $activePage = 'messages';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Shipment messages</h1><p class="muted">Notes shown with the associated shipment.</p></div><?php if ($selectedShipmentId): ?><a class="button button-secondary" href="addmessage.php">Show all shipments</a><?php endif; ?></div>
<section class="panel"><h2>Add message</h2><form method="post"><?= csrf_input() ?><div class="field"><label for="shipment_id">Shipment</label><select id="shipment_id" name="shipment_id" required><option value="">Choose shipment</option><?php foreach ($shipments as $shipment): ?><option value="<?= (int) $shipment['id'] ?>"<?= $selectedShipmentId === (int) $shipment['id'] ? ' selected' : '' ?>><?= e($shipment['tracking_number'] . ' — ' . $shipment['recipient_name']) ?></option><?php endforeach; ?></select></div><div class="field"><label for="message">Message</label><textarea id="message" name="message" required maxlength="4000"></textarea></div><button class="button" type="submit">Add message</button></form></section>
<section class="panel"><h2>Recent messages</h2><?php if (!$messages): ?><p class="empty">No shipment messages found.</p><?php else: ?><div class="table-wrap"><table><thead><tr><th>Shipment</th><th>Message</th><th>Added</th><th>Actions</th></tr></thead><tbody><?php foreach ($messages as $item): ?><tr><td><strong><?= e($item['tracking_number']) ?></strong><br><span class="muted"><?= e($item['recipient_name']) ?></span></td><td><?= nl2br(e($item['message'])) ?></td><td><?= e(format_datetime_value($item['created_at'])) ?><br><span class="muted"><?= e($item['admin_username'] ?: 'Unknown admin') ?></span></td><td><div class="actions"><a class="button button-small button-secondary" href="editmessage.php?id=<?= (int) $item['id'] ?>">Edit</a><form action="delete.php" method="post" onsubmit="return confirm('Delete this message?');"><?= csrf_input() ?><input type="hidden" name="type" value="shipment_message"><input type="hidden" name="id" value="<?= (int) $item['id'] ?>"><input type="hidden" name="return" value="addmessage.php"><button class="button button-small button-danger" type="submit">Delete</button></form></div></td></tr><?php endforeach; ?></tbody></table></div><?php endif; ?></section>
<?php require __DIR__ . '/partials/footer.php'; ?>
