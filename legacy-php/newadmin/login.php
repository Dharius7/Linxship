<?php

declare(strict_types=1);

require_once __DIR__ . '/admin_bootstrap.php';

if (current_admin() !== null) {
    redirect('index.php');
}

$pageTitle = 'Sign in';
$activePage = '';
require __DIR__ . '/partials/header.php';
?>
<section class="panel login-panel">
    <h1>Admin sign in</h1>
    <p class="muted">Use your administrator account to manage shipments.</p>
    <form action="login-exec.php" method="post" autocomplete="on">
        <?= csrf_input() ?>
        <div class="field">
            <label for="username">Username</label>
            <input id="username" name="username" autocomplete="username" required maxlength="80" autofocus>
        </div>
        <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" required maxlength="4096">
        </div>
        <button class="button" type="submit">Sign in</button>
    </form>
</section>
<?php require __DIR__ . '/partials/footer.php'; ?>
