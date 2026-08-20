<?php

declare(strict_types=1);

require_once __DIR__ . '/../controllers/controllers.php';

ensure_session();

/** @return array{id:int,username:string}|null */
function current_admin(): ?array
{
    static $loaded = false;
    static $admin = null;

    if ($loaded) {
        return $admin;
    }
    $loaded = true;

    $adminId = filter_var($_SESSION['admin_id'] ?? null, FILTER_VALIDATE_INT);
    if ($adminId === false || $adminId < 1) {
        return null;
    }
    $lastActivity = filter_var($_SESSION['admin_last_activity'] ?? null, FILTER_VALIDATE_INT);
    if ($lastActivity === false || $lastActivity < time() - 1800) {
        unset($_SESSION['admin_id'], $_SESSION['admin_last_activity'], $_SESSION['_csrf']);
        return null;
    }
    try {
        $statement = db()->prepare('SELECT id, username FROM admins WHERE id = ? AND is_active = 1 LIMIT 1');
        $statement->bind_param('i', $adminId);
        $statement->execute();
        $row = $statement->get_result()->fetch_assoc();
        if ($row) {
            $_SESSION['admin_last_activity'] = time();
            $admin = ['id' => (int) $row['id'], 'username' => (string) $row['username']];
            return $admin;
        }
    } catch (Throwable $exception) {
        admin_log_exception($exception);
        http_response_code(503);
        exit('The admin database is temporarily unavailable.');
    }

    unset($_SESSION['admin_id'], $_SESSION['admin_last_activity'], $_SESSION['_csrf']);
    return null;
}

/** @return array{id:int,username:string} */
function require_admin(): array
{
    $admin = current_admin();
    if ($admin === null) {
        flash('error', 'Please sign in to continue.');
        redirect('login.php');
    }
    return $admin;
}

/** @return array{id:int,username:string} */
function require_admin_post(string $fallback): array
{
    require_method('POST');
    $admin = require_admin();
    verify_csrf_or_redirect($fallback);
    return $admin;
}

function admin_log_exception(Throwable $exception): void
{
    error_log('[admin] ' . $exception->getMessage());
}

function admin_id_from_query(string $name = 'id'): ?int
{
    $id = request_int($_GET, $name);
    return $id !== null && $id > 0 ? $id : null;
}

function admin_id_from_post(string $name = 'id'): ?int
{
    $id = request_int($_POST, $name);
    return $id !== null && $id > 0 ? $id : null;
}

function admin_decimal(array $source, string $key, bool $required = false): ?string
{
    $value = request_string($source, $key, 32);
    if ($value === '') {
        return $required ? null : '0.00';
    }
    if (!preg_match('/^\d{1,12}(?:\.\d{1,2})?$/', $value)) {
        return null;
    }
    [$whole, $fraction] = array_pad(explode('.', $value, 2), 2, '');
    $whole = ltrim($whole, '0');
    return ($whole === '' ? '0' : $whole) . '.' . str_pad($fraction, 2, '0');
}

function admin_datetime_or_null(string $value): ?string
{
    if ($value === '') {
        return null;
    }
    $date = DateTimeImmutable::createFromFormat('!Y-m-d\TH:i', $value);
    return $date && $date->format('Y-m-d\TH:i') === $value
        ? $date->format('Y-m-d H:i:s')
        : null;
}

function admin_datetime_input(?string $value): string
{
    if (!$value) {
        return '';
    }
    try {
        return (new DateTimeImmutable($value))->format('Y-m-d\TH:i');
    } catch (Throwable) {
        return '';
    }
}

/** @return array<string,mixed>|null */
function find_shipment(int $id): ?array
{
    $statement = db()->prepare('SELECT * FROM addshipping WHERE id = ? LIMIT 1');
    $statement->bind_param('i', $id);
    $statement->execute();
    return $statement->get_result()->fetch_assoc() ?: null;
}

/** @return list<array{id:int,tracking_number:string,recipient_name:string}> */
function shipment_choices(): array
{
    $result = db()->query(
        'SELECT id, tracking_number, recipient_name FROM addshipping ORDER BY created_at DESC, id DESC LIMIT 500'
    );
    return $result->fetch_all(MYSQLI_ASSOC);
}

/** @return list<array{id:int,name:string}> */
function status_choices(): array
{
    $result = db()->query('SELECT id, name FROM shipment_statuses ORDER BY name ASC');
    return $result->fetch_all(MYSQLI_ASSOC);
}

function admin_not_found(string $message = 'Record not found.'): never
{
    http_response_code(404);
    $pageTitle = 'Not found';
    $activePage = '';
    require __DIR__ . '/partials/header.php';
    echo '<section class="panel"><h1>Not found</h1><p>' . e($message) . '</p></section>';
    require __DIR__ . '/partials/footer.php';
    exit;
}

function admin_checked(bool|int|string|null $value): string
{
    return (bool) $value ? ' checked' : '';
}

/**
 * @return array{values:array<string,mixed>,errors:list<string>}
 */
function shipment_form_payload(array $source): array
{
    $values = [
        'sender_name' => request_string($source, 'sender_name', 150),
        'sender_phone' => request_string($source, 'sender_phone', 40),
        'sender_address' => request_string($source, 'sender_address', 500),
        'sender_email' => request_string($source, 'sender_email', 190),
        'recipient_name' => request_string($source, 'recipient_name', 150),
        'recipient_phone' => request_string($source, 'recipient_phone', 40),
        'recipient_address' => request_string($source, 'recipient_address', 500),
        'recipient_email' => request_string($source, 'recipient_email', 190),
        'payment_status' => request_string($source, 'payment_status', 20),
        'service_type' => request_string($source, 'service_type', 100),
        'office_of_origin' => request_string($source, 'office_of_origin', 150),
        'destination' => request_string($source, 'destination', 150),
        'insurance' => admin_decimal($source, 'insurance'),
        'quantity' => request_int($source, 'quantity'),
        'weight' => admin_decimal($source, 'weight', true),
        'freight_price' => admin_decimal($source, 'freight_price'),
        'package_value' => admin_decimal($source, 'package_value'),
        'package_description' => request_string($source, 'package_description', 500),
        'billing_status' => request_string($source, 'billing_status', 20),
        'tracking_number' => normalize_tracking_code(request_string($source, 'tracking_number', 64)),
        'collection_date' => valid_date_or_null(request_string($source, 'collection_date', 10)),
        'cargo_image' => null,
        'delivery_date' => valid_date_or_null(request_string($source, 'delivery_date', 10)),
        'shipment_details' => request_string($source, 'shipment_details', 4000),
        'shipment_status' => request_string($source, 'shipment_status', 64),
        'is_delivered' => isset($source['is_delivered']) ? 1 : 0,
        'show_billing' => isset($source['show_billing']) ? 1 : 0,
    ];

    $errors = [];
    foreach ([
        'sender_name' => 'Sender name',
        'sender_address' => 'Sender address',
        'recipient_name' => 'Recipient name',
        'recipient_address' => 'Recipient address',
        'service_type' => 'Service type',
        'office_of_origin' => 'Office of origin',
        'destination' => 'Destination',
        'package_description' => 'Package description',
        'shipment_status' => 'Shipment status',
    ] as $field => $label) {
        if ($values[$field] === '') {
            $errors[] = $label . ' is required.';
        }
    }
    if ($values['tracking_number'] === null) {
        $errors[] = 'Tracking number must be 4–64 characters using letters, numbers, or hyphens.';
    }
    if ($values['collection_date'] === null) {
        $errors[] = 'A valid collection date is required.';
    }
    if (request_string($source, 'delivery_date', 10) !== '' && $values['delivery_date'] === null) {
        $errors[] = 'Delivery date is invalid.';
    }
    if ($values['collection_date'] !== null && $values['delivery_date'] !== null
        && $values['delivery_date'] < $values['collection_date']) {
        $errors[] = 'Delivery date cannot be earlier than collection date.';
    }
    if ($values['quantity'] === null || $values['quantity'] < 1 || $values['quantity'] > 1000000) {
        $errors[] = 'Quantity must be between 1 and 1,000,000.';
    }
    foreach (['insurance', 'weight', 'freight_price', 'package_value'] as $field) {
        if ($values[$field] === null) {
            $errors[] = ucfirst(str_replace('_', ' ', $field)) . ' must be a valid non-negative number.';
        }
    }
    foreach (['sender_email' => 'Sender', 'recipient_email' => 'Recipient'] as $field => $label) {
        if ($values[$field] !== '' && filter_var($values[$field], FILTER_VALIDATE_EMAIL) === false) {
            $errors[] = $label . ' email address is invalid.';
        }
    }
    if (!in_array($values['payment_status'], ['paid', 'unpaid'], true)) {
        $errors[] = 'Payment status is invalid.';
    }
    if (!in_array($values['billing_status'], ['paid', 'unpaid'], true)) {
        $errors[] = 'Billing status is invalid.';
    }

    return ['values' => $values, 'errors' => $errors];
}

function insert_shipment(array $values, int $adminId): int
{
    $statement = db()->prepare(
        'INSERT INTO addshipping (
            sender_name, sender_phone, sender_address, sender_email,
            recipient_name, recipient_phone, recipient_address, recipient_email,
            payment_status, service_type, office_of_origin, destination,
            insurance, quantity, weight, freight_price, package_value,
            package_description, billing_status, tracking_number, collection_date,
            cargo_image, delivery_date, shipment_details, shipment_status,
            is_delivered, show_billing, admin_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $statement->execute([
        $values['sender_name'], $values['sender_phone'], $values['sender_address'], $values['sender_email'],
        $values['recipient_name'], $values['recipient_phone'], $values['recipient_address'], $values['recipient_email'],
        $values['payment_status'], $values['service_type'], $values['office_of_origin'], $values['destination'],
        $values['insurance'], $values['quantity'], $values['weight'], $values['freight_price'], $values['package_value'],
        $values['package_description'], $values['billing_status'], $values['tracking_number'], $values['collection_date'],
        $values['cargo_image'] ?: null, $values['delivery_date'], $values['shipment_details'], $values['shipment_status'],
        $values['is_delivered'], $values['show_billing'], $adminId,
    ]);
    return (int) db()->insert_id;
}

function update_shipment(int $id, array $values): void
{
    $statement = db()->prepare(
        'UPDATE addshipping SET
            sender_name = ?, sender_phone = ?, sender_address = ?, sender_email = ?,
            recipient_name = ?, recipient_phone = ?, recipient_address = ?, recipient_email = ?,
            payment_status = ?, service_type = ?, office_of_origin = ?, destination = ?,
            insurance = ?, quantity = ?, weight = ?, freight_price = ?, package_value = ?,
            package_description = ?, billing_status = ?, tracking_number = ?, collection_date = ?,
            cargo_image = ?, delivery_date = ?, shipment_details = ?, shipment_status = ?,
            is_delivered = ?, show_billing = ?, updated_at = NOW()
        WHERE id = ?'
    );
    $statement->execute([
        $values['sender_name'], $values['sender_phone'], $values['sender_address'], $values['sender_email'],
        $values['recipient_name'], $values['recipient_phone'], $values['recipient_address'], $values['recipient_email'],
        $values['payment_status'], $values['service_type'], $values['office_of_origin'], $values['destination'],
        $values['insurance'], $values['quantity'], $values['weight'], $values['freight_price'], $values['package_value'],
        $values['package_description'], $values['billing_status'], $values['tracking_number'], $values['collection_date'],
        $values['cargo_image'] ?: null, $values['delivery_date'], $values['shipment_details'], $values['shipment_status'],
        $values['is_delivered'], $values['show_billing'], $id,
    ]);
}

function sync_shipment_status(int $shipmentId): void
{
    $statement = db()->prepare(
        'SELECT status FROM tracking_events WHERE shipment_id = ? ORDER BY event_time DESC, id DESC LIMIT 1'
    );
    $statement->bind_param('i', $shipmentId);
    $statement->execute();
    $latest = $statement->get_result()->fetch_assoc();
    $status = $latest ? (string) $latest['status'] : 'Pending';
    $isDelivered = strcasecmp($status, 'Delivered') === 0 ? 1 : 0;
    $update = db()->prepare(
        'UPDATE addshipping SET shipment_status = ?, is_delivered = ?, updated_at = NOW() WHERE id = ?'
    );
    $update->bind_param('sii', $status, $isDelivered, $shipmentId);
    $update->execute();
}

/** @return array{values:array<string,mixed>,errors:list<string>} */
function tracking_event_payload(array $source): array
{
    $eventTimeInput = request_string($source, 'event_time', 16);
    $values = [
        'shipment_id' => request_int($source, 'shipment_id'),
        'status' => request_string($source, 'status', 64),
        'location' => request_string($source, 'location', 190),
        'event_time' => admin_datetime_or_null($eventTimeInput),
        'requires_payment' => isset($source['requires_payment']) ? 1 : 0,
        'billing_amount' => admin_decimal($source, 'billing_amount'),
    ];
    $errors = [];
    if ($values['shipment_id'] === null || $values['shipment_id'] < 1) { $errors[] = 'Choose a shipment.'; }
    if ($values['status'] === '') { $errors[] = 'Status is required.'; }
    if ($values['location'] === '') { $errors[] = 'Location is required.'; }
    if ($values['event_time'] === null) { $errors[] = 'A valid event date and time is required.'; }
    if ($values['billing_amount'] === null) { $errors[] = 'Billing amount is invalid.'; }
    if (!$values['requires_payment']) { $values['billing_amount'] = '0.00'; }
    return ['values' => $values, 'errors' => $errors];
}

/** @return array{path:?string,error:?string,replaced:bool} */
function save_cargo_image(?string $existingPath = null): array
{
    $file = $_FILES['cargo_image_file'] ?? null;
    if (!is_array($file) || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return ['path' => $existingPath, 'error' => null, 'replaced' => false];
    }
    if ((int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return ['path' => $existingPath, 'error' => 'The cargo image upload did not complete.', 'replaced' => false];
    }

    $size = (int) ($file['size'] ?? 0);
    $temporaryPath = (string) ($file['tmp_name'] ?? '');
    if ($size < 1 || $size > 5 * 1024 * 1024 || !is_uploaded_file($temporaryPath)) {
        return ['path' => $existingPath, 'error' => 'Cargo images must be uploaded files no larger than 5 MB.', 'replaced' => false];
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($temporaryPath);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!is_string($mime) || !isset($extensions[$mime])) {
        return ['path' => $existingPath, 'error' => 'Cargo images must be JPEG, PNG, or WebP files.', 'replaced' => false];
    }

    $directory = dirname(__DIR__) . '/uploads/shipments';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        return ['path' => $existingPath, 'error' => 'The image storage directory is unavailable.', 'replaced' => false];
    }
    $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    $destination = $directory . '/' . $filename;
    if (!move_uploaded_file($temporaryPath, $destination)) {
        return ['path' => $existingPath, 'error' => 'The cargo image could not be stored.', 'replaced' => false];
    }
    return ['path' => 'uploads/shipments/' . $filename, 'error' => null, 'replaced' => true];
}

function delete_managed_cargo_image(?string $path): void
{
    if (!$path || preg_match('#^uploads/shipments/[a-f0-9]{32}\.(?:jpg|png|webp)$#', $path) !== 1) {
        return;
    }
    $file = dirname(__DIR__) . '/' . $path;
    if (is_file($file)) {
        @unlink($file);
    }
}
