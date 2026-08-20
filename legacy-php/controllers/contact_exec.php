<?php

declare(strict_types=1);

require_once __DIR__ . '/controllers.php';

require_method('POST');

// This hidden field should remain empty. Treat a filled value as a bot submission
// without revealing the filter to the sender.
if (request_string($_POST, 'website', 255) !== '') {
    redirect('../index.html?contact=sent#contact', 303);
}

$name = request_string($_POST, 'name', 81);
$email = request_string($_POST, 'email', 255);
$message = request_string($_POST, 'message', 4001);

$length = static function (string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
};

$valid = $length($name) >= 2
    && $length($name) <= 80
    && $length($email) <= 254
    && filter_var($email, FILTER_VALIDATE_EMAIL) !== false
    && $length($message) >= 10
    && $length($message) <= 4000;

if (!$valid) {
    redirect('../index.html?contact=invalid#contact', 303);
}

ensure_session();
$lastSubmission = (int) ($_SESSION['_contact_last_submission'] ?? 0);
if ($lastSubmission > 0 && time() - $lastSubmission < 10) {
    redirect('../index.html?contact=rate-limited#contact', 303);
}

try {
    $statement = db()->prepare(
        'INSERT INTO contact_messages (name, email, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())'
    );
    $statement->bind_param('sss', $name, $email, $message);
    $statement->execute();
    $_SESSION['_contact_last_submission'] = time();
} catch (Throwable $exception) {
    if (APP_DEBUG) {
        error_log($exception->getMessage());
    }

    redirect('../index.html?contact=unavailable#contact', 303);
}

redirect('../index.html?contact=sent#contact', 303);
