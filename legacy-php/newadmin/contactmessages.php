<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$admin = require_admin();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_post('contactmessages.php');
    $id = admin_id_from_post();
    if ($id === null) { flash('error', 'A valid contact message is required.'); redirect('contactmessages.php', 303); }
    try {
        $statement = db()->prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?');
        $statement->bind_param('i', $id); $statement->execute();
        if ($statement->affected_rows > 0) {
            log_activity($admin['id'], 'mark_read', 'contact_message', $id, 'Marked contact message as read');
            flash('success', 'Message marked as read.');
        }
    } catch (Throwable $exception) { admin_log_exception($exception); flash('error', 'Contact message could not be updated.'); }
    redirect('contactmessages.php', 303);
}

$page = max(1, min(1000000, request_int($_GET, 'page') ?? 1)); $perPage = 30; $offset = ($page - 1) * $perPage;
try {
    $total = (int) db()->query('SELECT COUNT(*) AS total FROM contact_messages')->fetch_assoc()['total'];
    $statement = db()->prepare('SELECT * FROM contact_messages ORDER BY is_read ASC, created_at DESC, id DESC LIMIT ? OFFSET ?');
    $statement->bind_param('ii', $perPage, $offset); $statement->execute();
    $messages = $statement->get_result()->fetch_all(MYSQLI_ASSOC);
} catch (Throwable $exception) { admin_log_exception($exception); $total = 0; $messages = []; flash('error', 'Contact messages could not be loaded.'); }
$pages = max(1, (int) ceil($total / $perPage));
$pageTitle = 'Contact inbox'; $activePage = 'contacts';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Contact inbox</h1><p class="muted">Messages submitted through the public contact form.</p></div></div>
<section class="panel"><?php if (!$messages): ?><p class="empty">No contact messages have arrived.</p><?php else: ?><div class="table-wrap"><table><thead><tr><th>Status</th><th>From</th><th>Message</th><th>Received</th><th>Actions</th></tr></thead><tbody><?php foreach ($messages as $item): ?><tr><td><span class="badge <?= $item['is_read'] ? '' : 'badge-success' ?>"><?= $item['is_read'] ? 'Read' : 'New' ?></span></td><td><strong><?= e($item['name']) ?></strong><br><a href="mailto:<?= e($item['email']) ?>"><?= e($item['email']) ?></a></td><td><?= nl2br(e($item['message'])) ?></td><td><?= e(format_datetime_value($item['created_at'])) ?></td><td><div class="actions"><?php if (!$item['is_read']): ?><form method="post"><?= csrf_input() ?><input type="hidden" name="id" value="<?= (int) $item['id'] ?>"><button class="button button-small button-secondary" type="submit">Mark read</button></form><?php endif; ?><form action="delete.php" method="post" onsubmit="return confirm('Delete this contact message?');"><?= csrf_input() ?><input type="hidden" name="type" value="contact_message"><input type="hidden" name="id" value="<?= (int) $item['id'] ?>"><input type="hidden" name="return" value="contactmessages.php"><button class="button button-small button-danger" type="submit">Delete</button></form></div></td></tr><?php endforeach; ?></tbody></table></div><?php endif; ?>
<?php if ($pages > 1): ?><nav class="pagination" aria-label="Pagination"><?php if ($page > 1): ?><a href="?page=<?= $page - 1 ?>">Previous</a><?php endif; ?><span>Page <?= $page ?> of <?= $pages ?></span><?php if ($page < $pages): ?><a href="?page=<?= $page + 1 ?>">Next</a><?php endif; ?></nav><?php endif; ?></section>
<?php require __DIR__ . '/partials/footer.php'; ?>
