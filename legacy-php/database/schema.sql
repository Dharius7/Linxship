-- Lion Gold Shipping and Storage
-- MySQL 8.0+ / MariaDB 10.4+
--
-- Select an empty database before importing this file. The application database
-- and database user are intentionally not created here so each environment can
-- apply its own least-privilege credentials.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS shipment_statuses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_shipment_statuses_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admins_username (username),
    KEY idx_admins_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS addshipping (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tracking_number VARCHAR(64) NOT NULL,
    sender_name VARCHAR(160) NOT NULL,
    sender_phone VARCHAR(40) NULL,
    sender_address TEXT NOT NULL,
    sender_email VARCHAR(254) NULL,
    recipient_name VARCHAR(160) NOT NULL,
    recipient_phone VARCHAR(40) NULL,
    recipient_address TEXT NOT NULL,
    recipient_email VARCHAR(254) NULL,
    payment_status VARCHAR(64) NOT NULL DEFAULT 'unpaid',
    service_type VARCHAR(100) NOT NULL,
    office_of_origin VARCHAR(190) NOT NULL,
    destination VARCHAR(190) NOT NULL,
    insurance DECIMAL(14,2) UNSIGNED NOT NULL DEFAULT 0.00,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    weight DECIMAL(14,2) UNSIGNED NOT NULL DEFAULT 0.00,
    freight_price DECIMAL(14,2) UNSIGNED NOT NULL DEFAULT 0.00,
    package_value DECIMAL(14,2) UNSIGNED NOT NULL DEFAULT 0.00,
    package_description TEXT NOT NULL,
    billing_status VARCHAR(64) NOT NULL DEFAULT 'unpaid',
    collection_date DATE NULL,
    cargo_image VARCHAR(255) NULL,
    delivery_date DATE NULL,
    shipment_details TEXT NULL,
    admin_id BIGINT UNSIGNED NULL,
    shipment_status VARCHAR(64) NOT NULL DEFAULT 'Pending',
    is_delivered TINYINT(1) NOT NULL DEFAULT 0,
    show_billing TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_addshipping_tracking_number (tracking_number),
    KEY idx_addshipping_admin (admin_id),
    KEY idx_addshipping_status (shipment_status),
    KEY idx_addshipping_sender_email (sender_email),
    KEY idx_addshipping_recipient_email (recipient_email),
    KEY idx_addshipping_created (created_at),
    CONSTRAINT fk_addshipping_admin
        FOREIGN KEY (admin_id) REFERENCES admins (id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tracking_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    shipment_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(64) NOT NULL,
    location VARCHAR(190) NULL,
    event_time DATETIME NOT NULL,
    requires_payment TINYINT(1) NOT NULL DEFAULT 0,
    billing_amount DECIMAL(14,2) UNSIGNED NOT NULL DEFAULT 0.00,
    admin_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tracking_events_timeline (shipment_id, event_time, id),
    KEY idx_tracking_events_status (status),
    KEY idx_tracking_events_admin (admin_id),
    CONSTRAINT fk_tracking_events_shipment
        FOREIGN KEY (shipment_id) REFERENCES addshipping (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tracking_events_admin
        FOREIGN KEY (admin_id) REFERENCES admins (id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shipment_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    shipment_id BIGINT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    admin_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_shipment_messages_shipment (shipment_id, created_at),
    KEY idx_shipment_messages_admin (admin_id),
    CONSTRAINT fk_shipment_messages_shipment
        FOREIGN KEY (shipment_id) REFERENCES addshipping (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_shipment_messages_admin
        FOREIGN KEY (admin_id) REFERENCES admins (id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(254) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_contact_messages_queue (is_read, created_at),
    KEY idx_contact_messages_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id BIGINT UNSIGNED NULL,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(80) NULL,
    entity_id BIGINT UNSIGNED NULL,
    details TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_activity_logs_admin (admin_id),
    KEY idx_activity_logs_entity (entity_type, entity_id),
    KEY idx_activity_logs_created (created_at),
    CONSTRAINT fk_activity_logs_admin
        FOREIGN KEY (admin_id) REFERENCES admins (id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO shipment_statuses (name)
VALUES
    ('Pending'),
    ('In Transit'),
    ('On Hold'),
    ('Out for Delivery'),
    ('Delivered'),
    ('Cancelled');
