<?php
/** @var array<string,mixed> $shipment */
/** @var string $submitLabel */
/** @var list<array{id:int,name:string}> $statuses */
$value = static fn (string $key, mixed $default = ''): mixed => $shipment[$key] ?? $default;
?>
<div class="grid grid-2">
    <section class="panel">
        <h2>Sender</h2>
        <div class="field"><label for="sender_name">Name</label><input id="sender_name" name="sender_name" value="<?= e($value('sender_name')) ?>" required maxlength="150"></div>
        <div class="field"><label for="sender_phone">Phone</label><input id="sender_phone" name="sender_phone" value="<?= e($value('sender_phone')) ?>" maxlength="40"></div>
        <div class="field"><label for="sender_email">Email</label><input id="sender_email" name="sender_email" type="email" value="<?= e($value('sender_email')) ?>" maxlength="190"></div>
        <div class="field"><label for="sender_address">Address</label><textarea id="sender_address" name="sender_address" required maxlength="500"><?= e($value('sender_address')) ?></textarea></div>
    </section>
    <section class="panel">
        <h2>Recipient</h2>
        <div class="field"><label for="recipient_name">Name</label><input id="recipient_name" name="recipient_name" value="<?= e($value('recipient_name')) ?>" required maxlength="150"></div>
        <div class="field"><label for="recipient_phone">Phone</label><input id="recipient_phone" name="recipient_phone" value="<?= e($value('recipient_phone')) ?>" maxlength="40"></div>
        <div class="field"><label for="recipient_email">Email</label><input id="recipient_email" name="recipient_email" type="email" value="<?= e($value('recipient_email')) ?>" maxlength="190"></div>
        <div class="field"><label for="recipient_address">Address</label><textarea id="recipient_address" name="recipient_address" required maxlength="500"><?= e($value('recipient_address')) ?></textarea></div>
    </section>
</div>

<section class="panel">
    <h2>Shipment</h2>
    <div class="grid grid-3">
        <div class="field"><label for="tracking_number">Tracking number</label><input id="tracking_number" name="tracking_number" value="<?= e($value('tracking_number')) ?>" required maxlength="64" pattern="[A-Za-z0-9][A-Za-z0-9-]{3,63}"></div>
        <div class="field"><label for="service_type">Service type</label><input id="service_type" name="service_type" value="<?= e($value('service_type')) ?>" required maxlength="100" placeholder="Air freight"></div>
        <div class="field"><label for="shipment_status">Current status</label><input id="shipment_status" name="shipment_status" value="<?= e($value('shipment_status')) ?>" required maxlength="64" list="shipment-statuses"><datalist id="shipment-statuses"><?php foreach ($statuses as $status): ?><option value="<?= e($status['name']) ?>"><?php endforeach; ?></datalist></div>
        <div class="field"><label for="office_of_origin">Office of origin</label><input id="office_of_origin" name="office_of_origin" value="<?= e($value('office_of_origin')) ?>" required maxlength="150"></div>
        <div class="field"><label for="destination">Destination</label><input id="destination" name="destination" value="<?= e($value('destination')) ?>" required maxlength="150"></div>
        <div class="field"><label for="collection_date">Collection date</label><input id="collection_date" name="collection_date" type="date" value="<?= e($value('collection_date')) ?>" required></div>
        <div class="field"><label for="delivery_date">Expected/delivery date</label><input id="delivery_date" name="delivery_date" type="date" value="<?= e($value('delivery_date')) ?>"></div>
        <div class="field"><label for="quantity">Quantity</label><input id="quantity" name="quantity" type="number" min="1" max="1000000" step="1" value="<?= e($value('quantity', 1)) ?>" required></div>
        <div class="field"><label for="weight">Weight</label><input id="weight" name="weight" type="number" min="0" step="0.01" value="<?= e($value('weight')) ?>" required></div>
        <div class="field"><label for="insurance">Insurance</label><input id="insurance" name="insurance" type="number" min="0" step="0.01" value="<?= e($value('insurance', '0.00')) ?>"></div>
        <div class="field"><label for="freight_price">Freight price</label><input id="freight_price" name="freight_price" type="number" min="0" step="0.01" value="<?= e($value('freight_price', '0.00')) ?>"></div>
        <div class="field"><label for="package_value">Package value</label><input id="package_value" name="package_value" type="number" min="0" step="0.01" value="<?= e($value('package_value', '0.00')) ?>"></div>
        <div class="field"><label for="payment_status">Payment status</label><select id="payment_status" name="payment_status"><option value="unpaid"<?= $value('payment_status', 'unpaid') === 'unpaid' ? ' selected' : '' ?>>Unpaid</option><option value="paid"<?= $value('payment_status') === 'paid' ? ' selected' : '' ?>>Paid</option></select></div>
        <div class="field"><label for="billing_status">Billing status</label><select id="billing_status" name="billing_status"><option value="unpaid"<?= $value('billing_status', 'unpaid') === 'unpaid' ? ' selected' : '' ?>>Unpaid</option><option value="paid"<?= $value('billing_status') === 'paid' ? ' selected' : '' ?>>Paid</option></select></div>
        <div class="field"><label for="cargo_image_file">Cargo image</label><input id="cargo_image_file" name="cargo_image_file" type="file" accept="image/jpeg,image/png,image/webp"><small>Optional JPEG, PNG, or WebP; maximum 5 MB.<?php if ($value('cargo_image')): ?> A stored image already exists and is preserved unless replaced.<?php endif; ?></small><?php if ($value('cargo_image')): ?><label class="checkbox"><input type="checkbox" name="remove_cargo_image" value="1"> Remove the stored image</label><?php endif; ?></div>
    </div>
    <div class="field"><label for="package_description">Package description</label><textarea id="package_description" name="package_description" required maxlength="500"><?= e($value('package_description')) ?></textarea></div>
    <div class="field"><label for="shipment_details">Shipment details</label><textarea id="shipment_details" name="shipment_details" maxlength="4000"><?= e($value('shipment_details')) ?></textarea></div>
    <div class="actions">
        <label class="checkbox"><input type="checkbox" name="is_delivered" value="1"<?= admin_checked($value('is_delivered')) ?>> Delivered</label>
        <label class="checkbox"><input type="checkbox" name="show_billing" value="1"<?= admin_checked($value('show_billing')) ?>> Show billing publicly</label>
    </div>
</section>
<button class="button" type="submit"><?= e($submitLabel) ?></button>
