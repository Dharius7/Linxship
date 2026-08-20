<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

$admin = require_admin();
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_admin_post('addshipping.php');
    $payload = shipment_form_payload($_POST);
    if ($payload['errors']) {
        $_SESSION['_shipment_old'] = $payload['values'];
        foreach ($payload['errors'] as $error) { flash('error', $error); }
        redirect('addshipping.php', 303);
    }
    $image = save_cargo_image();
    if ($image['error']) {
        $_SESSION['_shipment_old'] = $payload['values'];
        flash('error', $image['error']);
        redirect('addshipping.php', 303);
    }
    $payload['values']['cargo_image'] = $image['path'];
    try {
        $id = insert_shipment($payload['values'], $admin['id']);
        log_activity($admin['id'], 'create', 'shipment', $id, 'Created shipment ' . $payload['values']['tracking_number']);
        flash('success', 'Shipment created successfully.');
        redirect('editship.php?id=' . $id, 303);
    } catch (mysqli_sql_exception $exception) {
        if ($image['replaced']) { delete_managed_cargo_image($image['path']); }
        admin_log_exception($exception);
        $_SESSION['_shipment_old'] = $payload['values'];
        flash('error', $exception->getCode() === 1062 ? 'That tracking number is already in use.' : 'Shipment could not be created.');
        redirect('addshipping.php', 303);
    }
}

$shipment = $_SESSION['_shipment_old'] ?? [
    'tracking_number' => generate_tracking_code(), 'quantity' => 1, 'insurance' => '0.00',
    'freight_price' => '0.00', 'package_value' => '0.00', 'payment_status' => 'unpaid',
    'billing_status' => 'unpaid', 'shipment_status' => 'Shipment created', 'show_billing' => 0,
];
unset($_SESSION['_shipment_old']);
try { $statuses = status_choices(); } catch (Throwable $exception) { admin_log_exception($exception); $statuses = []; }
$pageTitle = 'New shipment'; $activePage = 'create';
require __DIR__ . '/partials/header.php';
?>
<div class="page-heading"><div><h1>Create shipment</h1><p class="muted">Enter sender, recipient, package, and delivery details.</p></div><a class="button button-secondary" href="allclient.php">Cancel</a></div>
<form method="post" enctype="multipart/form-data">
    <?= csrf_input() ?>
    <?php $submitLabel = 'Create shipment'; require __DIR__ . '/partials/shipment-form.php'; ?>
</form>
<?php require __DIR__ . '/partials/footer.php'; ?>
