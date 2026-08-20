<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

require_method('POST');
if (current_admin() !== null) {
    redirect('index.php', 303);
}
verify_csrf_or_redirect('login.php');

$username = request_string($_POST, 'username', 80);
$passwordValue = $_POST['password'] ?? '';
$password = is_string($passwordValue) && strlen($passwordValue) <= 4096 ? $passwordValue : '';
if ($username === '' || $password === '') {
    flash('error', 'Username and password are required.');
    redirect('login.php', 303);
}

$now = time();
$attempts = array_values(array_filter(
    is_array($_SESSION['_login_attempts'] ?? null) ? $_SESSION['_login_attempts'] : [],
    static fn (mixed $attempt): bool => is_int($attempt) && $attempt > $now - 900
));
if (count($attempts) >= 5) {
    $_SESSION['_login_attempts'] = $attempts;
    flash('error', 'Too many sign-in attempts. Please wait 15 minutes and try again.');
    redirect('login.php', 303);
}

try {
    $statement = db()->prepare('SELECT id, username, password_hash FROM admins WHERE username = ? AND is_active = 1 LIMIT 1');
    $statement->bind_param('s', $username);
    $statement->execute();
    $account = $statement->get_result()->fetch_assoc();

    if (!$account || !password_verify($password, (string) $account['password_hash'])) {
        $attempts[] = $now;
        $_SESSION['_login_attempts'] = $attempts;
        usleep(250000);
        log_activity(null, 'login_failed', 'admin', null, 'Failed login for username: ' . $username);
        flash('error', 'The username or password is incorrect.');
        redirect('login.php', 303);
    }

    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $account['id'];
    $_SESSION['admin_last_activity'] = time();
    unset($_SESSION['_csrf'], $_SESSION['_login_attempts']);
    log_activity((int) $account['id'], 'login', 'admin', (int) $account['id'], 'Administrator signed in');
    flash('success', 'Welcome back, ' . (string) $account['username'] . '.');
    redirect('index.php', 303);
} catch (Throwable $exception) {
    admin_log_exception($exception);
    flash('error', 'Sign in is temporarily unavailable.');
    redirect('login.php', 303);
}
