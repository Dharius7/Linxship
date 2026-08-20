<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

require_admin();
$query = request_string($_GET, 'q', 100);
$page = max(1, min(1000000, request_int($_GET, 'page') ?? 1));
$perPage = 25;
$offset = ($page - 1) * $perPage;

try {
    if ($query !== '') {
        $like = '%' . $query . '%';
        $count = db()->prepare(
            'SELECT COUNT(*) AS total FROM addshipping
             WHERE tracking_number LIKE ? OR sender_name LIKE ? OR recipient_name LIKE ?'
        );
        $count->bind_param('sss', $like, $like, $like);
        $count->execute();
        $total = (int) $count->get_result()->fetch_assoc()['total'];

        $statement = db()->prepare(
            'SELECT id, tracking_number, sender_name, recipient_name, destination, payment_status,
                    shipment_status, is_delivered, collection_date
             FROM addshipping
             WHERE tracking_number LIKE ? OR sender_name LIKE ? OR recipient_name LIKE ?
             ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?'
        );
        $statement->bind_param('sssii', $like, $like, $like, $perPage, $offset);
    } else {
        $total = (int) db()->query('SELECT COUNT(*) AS total FROM addshipping')->fetch_assoc()['total'];
        $statement = db()->prepare(
            'SELECT id, tracking_number, sender_name, recipient_name, destination, payment_status,
                    shipment_status, is_delivered, collection_date
             FROM addshipping ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?'
        );
        $statement->bind_param('ii', $perPage, $offset);
    }
    $statement->execute();
    $shipments = $statement->get_result()->fetch_all(MYSQLI_ASSOC);
} catch (Throwable $exception) {
    admin_log_exception($exception);
    $total = 0;
    $shipments = [];
    flash('error', 'Shipments could not be loaded.');
}
$pages = max(1, (int) ceil($total / $perPage));
$pageTitle = 'Shipments';
$activePage = 'shipments';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Shipments</h1><p class="muted"><?= $total ?> record<?= $total === 1 ? '' : 's' ?></p></div><a class="button" href="addshipping.php">Create shipment</a></div>
<section class="panel">
    <form method="get" class="actions">
        <input name="q" value="<?= e($query) ?>" placeholder="Search tracking number or name" aria-label="Search shipments">
        <button class="button button-secondary" type="submit">Search</button>
        <?php if ($query !== ''): ?><a class="button button-secondary" href="allclient.php">Clear</a><?php endif; ?>
    </form>
</section>
<section class="panel">
<?php if (!$shipments): ?><p class="empty">No shipments matched your search.</p><?php else: ?>
<div class="table-wrap"><table>
<thead><tr><th>Tracking</th><th>Sender → recipient</th><th>Destination</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
<tbody><?php foreach ($shipments as $shipment): ?><tr>
    <td><strong><?= e($shipment['tracking_number']) ?></strong></td>
    <td><?= e($shipment['sender_name']) ?> → <?= e($shipment['recipient_name']) ?></td>
    <td><?= e($shipment['destination']) ?></td>
    <td><span class="badge <?= strtolower((string) $shipment['payment_status']) === 'paid' ? 'badge-success' : 'badge-danger' ?>"><?= e(ucfirst((string) $shipment['payment_status'])) ?></span></td>
    <td><?= e($shipment['shipment_status']) ?><?= $shipment['is_delivered'] ? ' · Delivered' : '' ?></td>
    <td><?= e(format_date_value($shipment['collection_date'])) ?></td>
    <td><div class="actions">
        <a class="button button-small button-secondary" href="editship.php?id=<?= (int) $shipment['id'] ?>">Edit</a>
        <a class="button button-small button-secondary" href="addtrackinginfo.php?shipment_id=<?= (int) $shipment['id'] ?>">Events</a>
        <a class="button button-small button-secondary" href="invoice.php?id=<?= (int) $shipment['id'] ?>">Invoice</a>
        <form action="delete.php" method="post" onsubmit="return confirm('Delete this shipment and its related records?');">
            <?= csrf_input() ?><input type="hidden" name="type" value="shipment"><input type="hidden" name="id" value="<?= (int) $shipment['id'] ?>"><input type="hidden" name="return" value="allclient.php">
            <button class="button button-small button-danger" type="submit">Delete</button>
        </form>
    </div></td>
</tr><?php endforeach; ?></tbody></table></div>
<?php endif; ?>
<?php if ($pages > 1): ?><nav class="pagination" aria-label="Pagination">
    <?php if ($page > 1): ?><a href="?page=<?= $page - 1 ?>&amp;q=<?= rawurlencode($query) ?>">Previous</a><?php endif; ?>
    <span>Page <?= $page ?> of <?= $pages ?></span>
    <?php if ($page < $pages): ?><a href="?page=<?= $page + 1 ?>&amp;q=<?= rawurlencode($query) ?>">Next</a><?php endif; ?>
</nav><?php endif; ?>
</section>
<?php require __DIR__ . '/partials/footer.php'; ?>
