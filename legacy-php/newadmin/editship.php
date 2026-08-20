<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$admin = require_admin();
$id = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' ? admin_id_from_post() : admin_id_from_query();
if ($id === null) { admin_not_found('A valid shipment ID is required.'); }

try { $existing = find_shipment($id); } catch (Throwable $exception) { admin_log_exception($exception); $existing = null; }
if (!$existing) { admin_not_found('Shipment not found.'); }

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_post('editship.php?id=' . $id);
    $payload = shipment_form_payload($_POST);
    $payload['values']['cargo_image'] = $existing['cargo_image'];
    if ($payload['errors']) {
        $_SESSION['_shipment_old_' . $id] = $payload['values'];
        foreach ($payload['errors'] as $error) { flash('error', $error); }
        redirect('editship.php?id=' . $id, 303);
    }
    $image = save_cargo_image($existing['cargo_image'] ? (string) $existing['cargo_image'] : null);
    if ($image['error']) {
        $_SESSION['_shipment_old_' . $id] = $payload['values'];
        flash('error', $image['error']);
        redirect('editship.php?id=' . $id, 303);
    }
    $payload['values']['cargo_image'] = $image['path'];
    $removeExistingImage = isset($_POST['remove_cargo_image']) && !$image['replaced'];
    if ($removeExistingImage) { $payload['values']['cargo_image'] = null; }
    try {
        update_shipment($id, $payload['values']);
        if ($image['replaced'] || $removeExistingImage) { delete_managed_cargo_image($existing['cargo_image'] ? (string) $existing['cargo_image'] : null); }
        log_activity($admin['id'], 'update', 'shipment', $id, 'Updated shipment ' . $payload['values']['tracking_number']);
        flash('success', 'Shipment updated successfully.');
    } catch (mysqli_sql_exception $exception) {
        if ($image['replaced']) { delete_managed_cargo_image($image['path']); }
        admin_log_exception($exception);
        $payload['values']['cargo_image'] = $existing['cargo_image'];
        $_SESSION['_shipment_old_' . $id] = $payload['values'];
        flash('error', $exception->getCode() === 1062 ? 'That tracking number is already in use.' : 'Shipment could not be updated.');
    }
    redirect('editship.php?id=' . $id, 303);
}

$shipment = $_SESSION['_shipment_old_' . $id] ?? $existing;
unset($_SESSION['_shipment_old_' . $id]);
try { $statuses = status_choices(); } catch (Throwable $exception) { admin_log_exception($exception); $statuses = []; }
$pageTitle = 'Edit shipment'; $activePage = 'shipments';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Edit <?= e($existing['tracking_number']) ?></h1><p class="muted">Last updated <?= e(format_datetime_value($existing['updated_at'])) ?></p></div><div class="actions"><a class="button button-secondary" href="addtrackinginfo.php?shipment_id=<?= $id ?>">Tracking events</a><a class="button button-secondary" href="invoice.php?id=<?= $id ?>">Invoice</a></div></div>
<form method="post" enctype="multipart/form-data">
    <?= csrf_input() ?><input type="hidden" name="id" value="<?= $id ?>">
    <?php $submitLabel = 'Save changes'; require __DIR__ . '/partials/shipment-form.php'; ?>
</form>
<?php require __DIR__ . '/partials/footer.php'; ?>
