<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

require_admin();
$page = max(1, min(1000000, request_int($_GET, 'page') ?? 1));
$perPage = 50;
$offset = ($page - 1) * $perPage;
try {
    $total = (int) db()->query('SELECT COUNT(*) AS total FROM activity_logs')->fetch_assoc()['total'];
    $statement = db()->prepare(
        'SELECT al.*, a.username FROM activity_logs al LEFT JOIN admins a ON a.id = al.admin_id
         ORDER BY al.created_at DESC, al.id DESC LIMIT ? OFFSET ?'
    );
    $statement->bind_param('ii', $perPage, $offset); $statement->execute();
    $logs = $statement->get_result()->fetch_all(MYSQLI_ASSOC);
} catch (Throwable $exception) {
    admin_log_exception($exception); $total = 0; $logs = []; flash('error', 'Activity could not be loaded.');
}
$pages = max(1, (int) ceil($total / $perPage));
$pageTitle = 'Activity log'; $activePage = 'activity';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Activity log</h1><p class="muted">Administrative actions, newest first.</p></div></div>
<section class="panel"><?php if (!$logs): ?><p class="empty">No activity has been recorded.</p><?php else: ?><div class="table-wrap"><table><thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody><?php foreach ($logs as $log): ?><tr><td><?= e(format_datetime_value($log['created_at'])) ?></td><td><?= e($log['username'] ?: 'System/unknown') ?></td><td><span class="badge"><?= e($log['action']) ?></span></td><td><?= e($log['entity_type'] ?: '—') ?><?= $log['entity_id'] ? ' #' . (int) $log['entity_id'] : '' ?></td><td><?= e($log['details'] ?: '—') ?></td></tr><?php endforeach; ?></tbody></table></div><?php endif; ?>
<?php if ($pages > 1): ?><nav class="pagination" aria-label="Pagination"><?php if ($page > 1): ?><a href="?page=<?= $page - 1 ?>">Previous</a><?php endif; ?><span>Page <?= $page ?> of <?= $pages ?></span><?php if ($page < $pages): ?><a href="?page=<?= $page + 1 ?>">Next</a><?php endif; ?></nav><?php endif; ?></section>
<?php require __DIR__ . '/partials/footer.php'; ?>
