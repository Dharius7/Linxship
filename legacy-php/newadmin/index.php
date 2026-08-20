<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

require_admin();

try {
    $summary = db()->query(
        "SELECT COUNT(*) AS total,
            COALESCE(SUM(is_delivered = 0), 0) AS active,
            COALESCE(SUM(is_delivered = 1), 0) AS delivered,
            COALESCE(SUM(LOWER(payment_status) = 'unpaid'), 0) AS unpaid
        FROM addshipping"
    )->fetch_assoc();
    $unreadContacts = (int) db()->query('SELECT COUNT(*) AS total FROM contact_messages WHERE is_read = 0')->fetch_assoc()['total'];
    $recent = db()->query(
        'SELECT id, tracking_number, recipient_name, destination, shipment_status, is_delivered, created_at
         FROM addshipping ORDER BY created_at DESC, id DESC LIMIT 8'
    )->fetch_all(MYSQLI_ASSOC);
} catch (Throwable $exception) {
    admin_log_exception($exception);
    $summary = ['total' => 0, 'active' => 0, 'delivered' => 0, 'unpaid' => 0];
    $unreadContacts = 0;
    $recent = [];
    flash('error', 'Dashboard data could not be loaded.');
}

$pageTitle = 'Dashboard';
$activePage = 'dashboard';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading">
    <div><h1>Dashboard</h1><p class="muted">A live overview of shipment operations.</p></div>
    <a class="button" href="addshipping.php">Create shipment</a>
</div>
<div class="grid grid-3">
    <section class="panel stat"><span class="muted">All shipments</span><strong><?= (int) $summary['total'] ?></strong></section>
    <section class="panel stat"><span class="muted">Active</span><strong><?= (int) $summary['active'] ?></strong></section>
    <section class="panel stat"><span class="muted">Delivered</span><strong><?= (int) $summary['delivered'] ?></strong></section>
    <section class="panel stat"><span class="muted">Unpaid</span><strong><?= (int) $summary['unpaid'] ?></strong></section>
    <section class="panel stat"><span class="muted">Unread contact messages</span><strong><?= $unreadContacts ?></strong><a href="contactmessages.php">Open inbox</a></section>
</div>
<section class="panel">
    <div class="page-heading"><h2>Recent shipments</h2><a href="allclient.php">View all</a></div>
    <?php if (!$recent): ?>
        <p class="empty">No shipments have been created yet.</p>
    <?php else: ?>
        <div class="table-wrap"><table>
            <thead><tr><th>Tracking</th><th>Recipient</th><th>Destination</th><th>Status</th><th>Created</th><th></th></tr></thead>
            <tbody><?php foreach ($recent as $shipment): ?><tr>
                <td><strong><?= e($shipment['tracking_number']) ?></strong></td>
                <td><?= e($shipment['recipient_name']) ?></td>
                <td><?= e($shipment['destination']) ?></td>
                <td><span class="badge <?= $shipment['is_delivered'] ? 'badge-success' : '' ?>"><?= e($shipment['shipment_status']) ?></span></td>
                <td><?= e(format_datetime_value($shipment['created_at'])) ?></td>
                <td><a href="editship.php?id=<?= (int) $shipment['id'] ?>">Manage</a></td>
            </tr><?php endforeach; ?></tbody>
        </table></div>
    <?php endif; ?>
</section>
<?php require __DIR__ . '/partials/footer.php'; ?>
