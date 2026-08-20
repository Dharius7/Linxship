<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$returns = ['allclient.php', 'addtrackinginfo.php', 'addmessage.php', 'addstatus.php', 'contactmessages.php'];
$return = request_string($_POST, 'return', 80);
if (!in_array($return, $returns, true)) { $return = 'index.php'; }
$admin = require_admin_post($return);
$id = admin_id_from_post();
$type = request_string($_POST, 'type', 40);
$tables = [
    'shipment' => 'addshipping',
    'tracking_event' => 'tracking_events',
    'shipment_message' => 'shipment_messages',
    'shipment_status' => 'shipment_statuses',
    'contact_message' => 'contact_messages',
];
if ($id === null || !isset($tables[$type])) {
    flash('error', 'The requested delete operation is not allowed.'); redirect($return, 303);
}

$shipmentId = null; $cargoImage = null;
try {
    if ($type === 'tracking_event') {
        $lookup = db()->prepare('SELECT shipment_id FROM tracking_events WHERE id = ?');
        $lookup->bind_param('i', $id); $lookup->execute();
        $shipmentId = $lookup->get_result()->fetch_assoc()['shipment_id'] ?? null;
    } elseif ($type === 'shipment') {
        $lookup = db()->prepare('SELECT cargo_image FROM addshipping WHERE id = ?');
        $lookup->bind_param('i', $id); $lookup->execute();
        $cargoImage = $lookup->get_result()->fetch_assoc()['cargo_image'] ?? null;
    }
    db()->begin_transaction();
    $statement = db()->prepare('DELETE FROM ' . $tables[$type] . ' WHERE id = ?');
    $statement->bind_param('i', $id); $statement->execute();
    if ($statement->affected_rows < 1) { throw new RuntimeException('Record not found'); }
    if ($shipmentId) { sync_shipment_status((int) $shipmentId); }
    db()->commit();
    if ($type === 'shipment') { delete_managed_cargo_image(is_string($cargoImage) ? $cargoImage : null); }
    log_activity($admin['id'], 'delete', $type, $id, 'Deleted ' . str_replace('_', ' ', $type));
    flash('success', 'Record deleted.');
} catch (Throwable $exception) {
    try { db()->rollback(); } catch (Throwable) {}
    admin_log_exception($exception); flash('error', 'The record could not be deleted.');
}
redirect($return, 303);
