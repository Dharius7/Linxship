<?php
/** @var string $pageTitle */
/** @var string $activePage */
$admin = current_admin();
$flashes = consume_flashes();
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
$navigation = [
    'dashboard' => ['index.php', 'Dashboard'],
    'shipments' => ['allclient.php', 'Shipments'],
    'create' => ['addshipping.php', 'New shipment'],
    'tracking' => ['addtrackinginfo.php', 'Tracking events'],
    'statuses' => ['addstatus.php', 'Statuses'],
    'messages' => ['addmessage.php', 'Shipment messages'],
    'contacts' => ['contactmessages.php', 'Contact inbox'],
    'activity' => ['activitylog.php', 'Activity log'],
];
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title><?= e($pageTitle) ?> · Lion Gold Admin</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>
<header class="topbar">
    <a class="brand" href="index.php">
        <img src="../assets/images/logo/logo-dark.png" alt="Lion Gold">
        <span>Admin</span>
    </a>
    <?php if ($admin): ?>
        <div class="admin-account">
            <span><?= e($admin['username']) ?></span>
            <form action="logout.php" method="post">
                <?= csrf_input() ?>
                <button class="button button-ghost button-small" type="submit">Sign out</button>
            </form>
        </div>
    <?php endif; ?>
</header>
<div class="app-shell">
    <?php if ($admin): ?>
        <nav class="sidebar" aria-label="Admin navigation">
            <?php foreach ($navigation as $key => [$href, $label]): ?>
                <a class="<?= $activePage === $key ? 'active' : '' ?>" href="<?= e($href) ?>"><?= e($label) ?></a>
            <?php endforeach; ?>
            <a href="../index.html">View public site</a>
        </nav>
    <?php endif; ?>
    <main class="content<?= $admin ? '' : ' content-centered' ?>">
        <?php foreach ($flashes as $type => $messages): ?>
            <?php foreach ($messages as $message): ?>
                <div class="flash flash-<?= e($type) ?>" role="status"><?= e($message) ?></div>
            <?php endforeach; ?>
        <?php endforeach; ?>
