<?php
/** @var array<string,mixed> $event */
/** @var list<array{id:int,tracking_number:string,recipient_name:string}> $shipments */
/** @var list<array{id:int,name:string}> $statuses */
/** @var string $submitLabel */
$eventValue = static fn (string $key, mixed $default = ''): mixed => $event[$key] ?? $default;
?>
<div class="grid grid-2">
    <div class="field"><label for="shipment_id">Shipment</label><select id="shipment_id" name="shipment_id" required><option value="">Choose shipment</option><?php foreach ($shipments as $choice): ?><option value="<?= (int) $choice['id'] ?>"<?= (int) $eventValue('shipment_id') === (int) $choice['id'] ? ' selected' : '' ?>><?= e($choice['tracking_number'] . ' — ' . $choice['recipient_name']) ?></option><?php endforeach; ?></select></div>
    <div class="field"><label for="status">Status</label><input id="status" name="status" list="event-statuses" required maxlength="64" value="<?= e($eventValue('status')) ?>"><datalist id="event-statuses"><?php foreach ($statuses as $status): ?><option value="<?= e($status['name']) ?>"><?php endforeach; ?></datalist></div>
    <div class="field"><label for="location">Location</label><input id="location" name="location" required maxlength="190" value="<?= e($eventValue('location')) ?>"></div>
    <div class="field"><label for="event_time">Event date and time</label><input id="event_time" name="event_time" type="datetime-local" required value="<?= e(admin_datetime_input($eventValue('event_time'))) ?>"></div>
    <div class="field"><label for="billing_amount">Billing amount</label><input id="billing_amount" name="billing_amount" type="number" min="0" step="0.01" value="<?= e($eventValue('billing_amount', '0.00')) ?>"></div>
    <div class="field"><label class="checkbox"><input type="checkbox" name="requires_payment" value="1"<?= admin_checked($eventValue('requires_payment')) ?>> Customer payment required</label></div>
</div>
<button class="button" type="submit"><?= e($submitLabel) ?></button>
