<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$admin = require_admin();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_post('addstatus.php');
    $name = request_string($_POST, 'name', 64);
    if ($name === '') {
        flash('error', 'Status name is required.');
        redirect('addstatus.php', 303);
    }
    try {
        $statement = db()->prepare('INSERT INTO shipment_statuses (name) VALUES (?)');
        $statement->bind_param('s', $name); $statement->execute();
        $id = (int) db()->insert_id;
        log_activity($admin['id'], 'create', 'shipment_status', $id, 'Created status: ' . $name);
        flash('success', 'Status added.');
    } catch (mysqli_sql_exception $exception) {
        admin_log_exception($exception);
        flash('error', $exception->getCode() === 1062 ? 'That status already exists.' : 'Status could not be added.');
    }
    redirect('addstatus.php', 303);
}
try { $statuses = status_choices(); } catch (Throwable $exception) { admin_log_exception($exception); $statuses = []; flash('error', 'Statuses could not be loaded.'); }
$pageTitle = 'Statuses'; $activePage = 'statuses';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Shipment statuses</h1><p class="muted">Reusable labels for shipments and tracking events.</p></div></div>
<div class="grid grid-2">
<section class="panel"><h2>Add status</h2><form method="post"><?= csrf_input() ?><div class="field"><label for="name">Status name</label><input id="name" name="name" required maxlength="64"></div><button class="button" type="submit">Add status</button></form></section>
<section class="panel"><h2>Available statuses</h2><?php if (!$statuses): ?><p class="empty">No statuses have been added.</p><?php else: ?><table><tbody><?php foreach ($statuses as $status): ?><tr><td><?= e($status['name']) ?></td><td><form action="delete.php" method="post" onsubmit="return confirm('Delete this status option? Existing records keep their status text.');"><?= csrf_input() ?><input type="hidden" name="type" value="shipment_status"><input type="hidden" name="id" value="<?= (int) $status['id'] ?>"><input type="hidden" name="return" value="addstatus.php"><button class="button button-small button-danger" type="submit">Delete</button></form></td></tr><?php endforeach; ?></tbody></table><?php endif; ?></section>
</div>
<?php require __DIR__ . '/partials/footer.php'; ?>
