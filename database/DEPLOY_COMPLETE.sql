-- =====================================================================================
-- SkaEV Database - Complete Deployment Script for Microsoft SQL Server 2019+
-- =====================================================================================
-- Description: Complete deployment script including schema, stored procedures, and verification
-- Database: SkaEV_DB (Electric Vehicle Charging Station Management)
-- Version: 1.0
-- Date: October 13, 2025
-- Author: SWP391_G4_Topic3
-- =====================================================================================

-- =====================================================================================
-- SECTION 1: DATABASE CREATION
-- =====================================================================================
-- SECTION 1: CREATE DATABASE AND USE
IF DB_ID(N'SkaEV_DB') IS NULL
BEGIN
    PRINT 'Creating database SkaEV_DB...';
    CREATE DATABASE SkaEV_DB;
    PRINT 'Database SkaEV_DB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database SkaEV_DB already exists.';
END
GO

USE [SkaEV_DB];
GO

PRINT '=====================================================================================';
PRINT 'Starting SkaEV Database Deployment...';
PRINT '=====================================================================================';
GO

-- =====================================================================================
-- SECTION 2: SCHEMA CREATION
-- =====================================================================================

PRINT 'Creating tables...';
GO

-- =====================================================================================
-- Table: users
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(255) NOT NULL,
        phone_number NVARCHAR(20),
        role NVARCHAR(50) NOT NULL CHECK (role IN ('customer', 'staff', 'admin')),
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table users created.';
END
GO

-- =====================================================================================
-- Table: user_profiles
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_profiles')
BEGIN
    CREATE TABLE user_profiles (
        profile_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        date_of_birth DATE,
        address NVARCHAR(500),
        city NVARCHAR(100),
        avatar_url NVARCHAR(500),
        preferred_payment_method NVARCHAR(50),
        notification_preferences NVARCHAR(MAX), -- JSON
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_profiles_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
    PRINT 'Table user_profiles created.';
END
GO

-- =====================================================================================
-- Table: vehicles
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicles')
BEGIN
    CREATE TABLE vehicles (
        vehicle_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        vehicle_type NVARCHAR(50) NOT NULL CHECK (vehicle_type IN ('motorcycle', 'car')),
        brand NVARCHAR(100),
        model NVARCHAR(100),
        license_plate NVARCHAR(20) UNIQUE,
        battery_capacity DECIMAL(10,2),
        charging_port_type NVARCHAR(50),
        is_primary BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_vehicles_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
    PRINT 'Table vehicles created.';
END
GO

-- =====================================================================================
-- Table: charging_stations
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'charging_stations')
BEGIN
    CREATE TABLE charging_stations (
        station_id INT IDENTITY(1,1) PRIMARY KEY,
        station_name NVARCHAR(255) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        city NVARCHAR(100) NOT NULL,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        total_posts INT NOT NULL DEFAULT 0,
        available_posts INT NOT NULL DEFAULT 0,
        operating_hours NVARCHAR(100),
        amenities NVARCHAR(MAX), -- JSON array
        station_image_url NVARCHAR(500),
        status NVARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Table charging_stations created.';
END
GO

-- Add computed geography column after table creation
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('charging_stations') AND name = 'location')
BEGIN
    ALTER TABLE charging_stations ADD location AS geography::Point(latitude, longitude, 4326) PERSISTED;
    PRINT 'Added geography column to charging_stations.';
END
GO

-- =====================================================================================
-- Table: charging_posts
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'charging_posts')
BEGIN
    CREATE TABLE charging_posts (
        post_id INT IDENTITY(1,1) PRIMARY KEY,
        station_id INT NOT NULL,
        post_number NVARCHAR(50) NOT NULL,
        post_type NVARCHAR(50) NOT NULL CHECK (post_type IN ('AC', 'DC')),
        power_output DECIMAL(10,2) NOT NULL,
        connector_types NVARCHAR(MAX), -- JSON array
        total_slots INT NOT NULL DEFAULT 0,
        available_slots INT NOT NULL DEFAULT 0,
        status NVARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'offline')),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_posts_stations FOREIGN KEY (station_id) REFERENCES charging_stations(station_id) ON DELETE CASCADE,
        CONSTRAINT UQ_post_number_per_station UNIQUE (station_id, post_number)
    );
    PRINT 'Table charging_posts created.';
END
GO

-- =====================================================================================
-- Table: charging_slots
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'charging_slots')
BEGIN
    CREATE TABLE charging_slots (
        slot_id INT IDENTITY(1,1) PRIMARY KEY,
        post_id INT NOT NULL,
        slot_number NVARCHAR(50) NOT NULL,
        connector_type NVARCHAR(50) NOT NULL,
        max_power DECIMAL(10,2) NOT NULL,
        status NVARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
        current_booking_id INT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_slots_posts FOREIGN KEY (post_id) REFERENCES charging_posts(post_id) ON DELETE CASCADE,
        CONSTRAINT UQ_slot_number_per_post UNIQUE (post_id, slot_number)
    );
    PRINT 'Table charging_slots created.';
END
GO

-- =====================================================================================
-- Table: bookings
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'bookings')
BEGIN
    CREATE TABLE bookings (
        booking_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        slot_id INT NOT NULL,
        station_id INT NOT NULL,
        scheduling_type NVARCHAR(50) NOT NULL CHECK (scheduling_type IN ('scheduled', 'qr_immediate')),
        estimated_arrival DATETIME2,
        scheduled_start_time DATETIME2,
        actual_start_time DATETIME2,
        actual_end_time DATETIME2,
        status NVARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
        target_soc DECIMAL(5,2),
        estimated_duration INT,
        qr_code_id INT NULL,
        cancellation_reason NVARCHAR(500),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_bookings_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION,
        CONSTRAINT FK_bookings_vehicles FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE NO ACTION,
        CONSTRAINT FK_bookings_slots FOREIGN KEY (slot_id) REFERENCES charging_slots(slot_id) ON DELETE NO ACTION,
        CONSTRAINT FK_bookings_stations FOREIGN KEY (station_id) REFERENCES charging_stations(station_id) ON DELETE NO ACTION
    );
    PRINT 'Table bookings created.';
END
GO

-- =====================================================================================
-- Table: soc_tracking (escaped reserved identifiers)
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'soc_tracking')
BEGIN
    CREATE TABLE soc_tracking (
        tracking_id INT IDENTITY(1,1) PRIMARY KEY,
        booking_id INT NOT NULL,
        [timestamp] DATETIME2 NOT NULL DEFAULT GETDATE(),
        current_soc DECIMAL(5,2) NOT NULL,
        voltage DECIMAL(10,2),
        [current] DECIMAL(10,2),
        [power] DECIMAL(10,2),
        energy_delivered DECIMAL(10,2),
        temperature DECIMAL(5,2),
        estimated_time_remaining INT,
        CONSTRAINT FK_soc_bookings FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
    );
    PRINT 'Table soc_tracking created.';
END
GO

-- =====================================================================================
-- Table: invoices
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'invoices')
BEGIN
    CREATE TABLE invoices (
        invoice_id INT IDENTITY(1,1) PRIMARY KEY,
        booking_id INT NOT NULL UNIQUE,
        user_id INT NOT NULL,
        total_energy_kwh DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method NVARCHAR(50),
        payment_status NVARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        paid_at DATETIME2,
        invoice_url NVARCHAR(500),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_invoices_bookings FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
        CONSTRAINT FK_invoices_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
    );
    PRINT 'Table invoices created.';
END
GO

-- =====================================================================================
-- Table: qr_codes
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'qr_codes')
BEGIN
    CREATE TABLE qr_codes (
        qr_id INT IDENTITY(1,1) PRIMARY KEY,
        station_id INT NOT NULL,
        slot_id INT NOT NULL,
        qr_data NVARCHAR(500) NOT NULL UNIQUE,
        is_active BIT NOT NULL DEFAULT 1,
        generated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        expires_at DATETIME2,
        last_scanned_at DATETIME2,
        scan_count INT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_qr_stations FOREIGN KEY (station_id) REFERENCES charging_stations(station_id) ON DELETE NO ACTION,
        CONSTRAINT FK_qr_slots FOREIGN KEY (slot_id) REFERENCES charging_slots(slot_id) ON DELETE NO ACTION
    );
    PRINT 'Table qr_codes created.';
END
GO

-- =====================================================================================
-- Table: notifications
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        notification_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        type NVARCHAR(50) NOT NULL CHECK (type IN ('booking_reminder', 'charging_complete', 'payment_due', 'system_alert')),
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        is_read BIT NOT NULL DEFAULT 0,
        related_booking_id INT,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_notifications_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
    PRINT 'Table notifications created.';
END
GO

-- =====================================================================================
-- Table: system_logs
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'system_logs')
BEGIN
    CREATE TABLE system_logs (
        log_id INT IDENTITY(1,1) PRIMARY KEY,
        log_type NVARCHAR(50) NOT NULL CHECK (log_type IN ('error', 'warning', 'info', 'security')),
        severity NVARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        message NVARCHAR(MAX) NOT NULL,
        stack_trace NVARCHAR(MAX),
        user_id INT,
        ip_address NVARCHAR(45),
        endpoint NVARCHAR(255),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_logs_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
    );
    PRINT 'Table system_logs created.';
END
GO

-- =====================================================================================
-- Table: reviews
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reviews')
BEGIN
    CREATE TABLE reviews (
        review_id INT IDENTITY(1,1) PRIMARY KEY,
        booking_id INT NOT NULL UNIQUE,
        user_id INT NOT NULL,
        station_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_reviews_bookings FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
        CONSTRAINT FK_reviews_users FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION,
        CONSTRAINT FK_reviews_stations FOREIGN KEY (station_id) REFERENCES charging_stations(station_id) ON DELETE NO ACTION
    );
    PRINT 'Table reviews created.';
END
GO

-- =====================================================================================
-- Table: pricing_rules
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pricing_rules')
BEGIN
    CREATE TABLE pricing_rules (
        rule_id INT IDENTITY(1,1) PRIMARY KEY,
        station_id INT,
        vehicle_type NVARCHAR(50) NULL,
        time_range_start TIME,
        time_range_end TIME,
        base_price DECIMAL(10,2) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT CK_pricing_vehicle_type CHECK (vehicle_type IN ('motorcycle', 'car') OR vehicle_type IS NULL),
        CONSTRAINT FK_pricing_stations FOREIGN KEY (station_id) REFERENCES charging_stations(station_id) ON DELETE CASCADE
    );
    PRINT 'Table pricing_rules created.';
END
GO

-- =====================================================================================
-- Table: station_staff
-- =====================================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'station_staff')
BEGIN
    CREATE TABLE station_staff (
        assignment_id INT IDENTITY(1,1) PRIMARY KEY,
        staff_user_id INT NOT NULL,
        station_id INT NOT NULL,
        assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        is_active BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_staff_users FOREIGN KEY (staff_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT FK_staff_stations FOREIGN KEY (station_id) REFERENCES charging_stations(station_id) ON DELETE CASCADE,
        CONSTRAINT UQ_staff_station UNIQUE (staff_user_id, station_id)
    );
    PRINT 'Table station_staff created.';
END
GO

PRINT 'All tables created successfully.';
GO

-- =====================================================================================
-- SECTION 3: INDEXES
-- =====================================================================================

PRINT 'Creating indexes...';
GO

-- Users indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_email' AND object_id = OBJECT_ID('users'))
    CREATE INDEX idx_users_email ON users(email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_role' AND object_id = OBJECT_ID('users'))
    CREATE INDEX idx_users_role ON users(role);

-- Vehicles indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_vehicles_user' AND object_id = OBJECT_ID('vehicles'))
    CREATE INDEX idx_vehicles_user ON vehicles(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_vehicles_license' AND object_id = OBJECT_ID('vehicles'))
    CREATE UNIQUE INDEX idx_vehicles_license ON vehicles(license_plate) WHERE license_plate IS NOT NULL;

-- Charging stations indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_stations_city' AND object_id = OBJECT_ID('charging_stations'))
    CREATE INDEX idx_stations_city ON charging_stations(city);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_stations_status' AND object_id = OBJECT_ID('charging_stations'))
    CREATE INDEX idx_stations_status ON charging_stations(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_stations_location' AND object_id = OBJECT_ID('charging_stations'))
    CREATE SPATIAL INDEX idx_stations_location ON charging_stations(location);

-- Charging posts indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_posts_station' AND object_id = OBJECT_ID('charging_posts'))
    CREATE INDEX idx_posts_station ON charging_posts(station_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_posts_status' AND object_id = OBJECT_ID('charging_posts'))
    CREATE INDEX idx_posts_status ON charging_posts(status);

-- Charging slots indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_slots_post' AND object_id = OBJECT_ID('charging_slots'))
    CREATE INDEX idx_slots_post ON charging_slots(post_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_slots_status' AND object_id = OBJECT_ID('charging_slots'))
    CREATE INDEX idx_slots_status ON charging_slots(status);

-- Bookings indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_bookings_user' AND object_id = OBJECT_ID('bookings'))
    CREATE INDEX idx_bookings_user ON bookings(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_bookings_station' AND object_id = OBJECT_ID('bookings'))
    CREATE INDEX idx_bookings_station ON bookings(station_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_bookings_slot' AND object_id = OBJECT_ID('bookings'))
    CREATE INDEX idx_bookings_slot ON bookings(slot_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_bookings_status' AND object_id = OBJECT_ID('bookings'))
    CREATE INDEX idx_bookings_status ON bookings(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_bookings_scheduled_start' AND object_id = OBJECT_ID('bookings'))
    CREATE INDEX idx_bookings_scheduled_start ON bookings(scheduled_start_time);

-- SOC tracking indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_soc_booking' AND object_id = OBJECT_ID('soc_tracking'))
    CREATE INDEX idx_soc_booking ON soc_tracking(booking_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_soc_timestamp' AND object_id = OBJECT_ID('soc_tracking'))
    CREATE INDEX idx_soc_timestamp ON soc_tracking([timestamp]);

-- Invoices indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_invoices_user' AND object_id = OBJECT_ID('invoices'))
    CREATE INDEX idx_invoices_user ON invoices(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_invoices_status' AND object_id = OBJECT_ID('invoices'))
    CREATE INDEX idx_invoices_status ON invoices(payment_status);

-- QR codes indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_qr_station' AND object_id = OBJECT_ID('qr_codes'))
    CREATE INDEX idx_qr_station ON qr_codes(station_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_qr_slot' AND object_id = OBJECT_ID('qr_codes'))
    CREATE INDEX idx_qr_slot ON qr_codes(slot_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_qr_active' AND object_id = OBJECT_ID('qr_codes'))
    CREATE INDEX idx_qr_active ON qr_codes(is_active);

-- Notifications indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_notifications_user' AND object_id = OBJECT_ID('notifications'))
    CREATE INDEX idx_notifications_user ON notifications(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_notifications_read' AND object_id = OBJECT_ID('notifications'))
    CREATE INDEX idx_notifications_read ON notifications(is_read);

-- System logs indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_logs_type' AND object_id = OBJECT_ID('system_logs'))
    CREATE INDEX idx_logs_type ON system_logs(log_type);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_logs_created' AND object_id = OBJECT_ID('system_logs'))
    CREATE INDEX idx_logs_created ON system_logs(created_at);

-- Reviews indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_reviews_station' AND object_id = OBJECT_ID('reviews'))
    CREATE INDEX idx_reviews_station ON reviews(station_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_reviews_user' AND object_id = OBJECT_ID('reviews'))
    CREATE INDEX idx_reviews_user ON reviews(user_id);

PRINT 'All indexes created successfully.';
GO

-- =====================================================================================
-- SECTION 4: TRIGGERS
-- =====================================================================================

PRINT 'Creating triggers...';
GO

-- Trigger: Update updated_at timestamp for users
IF OBJECT_ID('trg_users_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_users_updated_at;
GO
CREATE TRIGGER trg_users_updated_at ON users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE u
    SET updated_at = GETDATE()
    FROM users u
    INNER JOIN inserted i ON u.user_id = i.user_id;
END;
GO

-- Trigger: Update updated_at timestamp for user_profiles
IF OBJECT_ID('trg_user_profiles_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_user_profiles_updated_at;
GO
CREATE TRIGGER trg_user_profiles_updated_at ON user_profiles
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE up
    SET updated_at = GETDATE()
    FROM user_profiles up
    INNER JOIN inserted i ON up.profile_id = i.profile_id;
END;
GO

-- Trigger: Update updated_at timestamp for vehicles
IF OBJECT_ID('trg_vehicles_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_vehicles_updated_at;
GO
CREATE TRIGGER trg_vehicles_updated_at ON vehicles
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE v
    SET updated_at = GETDATE()
    FROM vehicles v
    INNER JOIN inserted i ON v.vehicle_id = i.vehicle_id;
END;
GO

-- Trigger: Update updated_at timestamp for charging_stations
IF OBJECT_ID('trg_charging_stations_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_charging_stations_updated_at;
GO
CREATE TRIGGER trg_charging_stations_updated_at ON charging_stations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE cs
    SET updated_at = GETDATE()
    FROM charging_stations cs
    INNER JOIN inserted i ON cs.station_id = i.station_id;
END;
GO

-- Trigger: Update updated_at timestamp for charging_posts
IF OBJECT_ID('trg_charging_posts_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_charging_posts_updated_at;
GO
CREATE TRIGGER trg_charging_posts_updated_at ON charging_posts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE cp
    SET updated_at = GETDATE()
    FROM charging_posts cp
    INNER JOIN inserted i ON cp.post_id = i.post_id;
END;
GO

-- Trigger: Update updated_at timestamp for charging_slots
IF OBJECT_ID('trg_charging_slots_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_charging_slots_updated_at;
GO
CREATE TRIGGER trg_charging_slots_updated_at ON charging_slots
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE cs
    SET updated_at = GETDATE()
    FROM charging_slots cs
    INNER JOIN inserted i ON cs.slot_id = i.slot_id;
END;
GO

-- Trigger: Update updated_at timestamp for bookings
IF OBJECT_ID('trg_bookings_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_bookings_updated_at;
GO
CREATE TRIGGER trg_bookings_updated_at ON bookings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE b
    SET updated_at = GETDATE()
    FROM bookings b
    INNER JOIN inserted i ON b.booking_id = i.booking_id;
END;
GO

-- Trigger: Update updated_at timestamp for invoices
IF OBJECT_ID('trg_invoices_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_invoices_updated_at;
GO
CREATE TRIGGER trg_invoices_updated_at ON invoices
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE inv
    SET updated_at = GETDATE()
    FROM invoices inv
    INNER JOIN inserted i ON inv.invoice_id = i.invoice_id;
END;
GO

-- Trigger: Update updated_at timestamp for qr_codes
IF OBJECT_ID('trg_qr_codes_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_qr_codes_updated_at;
GO
CREATE TRIGGER trg_qr_codes_updated_at ON qr_codes
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE qr
    SET updated_at = GETDATE()
    FROM qr_codes qr
    INNER JOIN inserted i ON qr.qr_id = i.qr_id;
END;
GO

-- Trigger: Update updated_at timestamp for reviews
IF OBJECT_ID('trg_reviews_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_reviews_updated_at;
GO
CREATE TRIGGER trg_reviews_updated_at ON reviews
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE r
    SET updated_at = GETDATE()
    FROM reviews r
    INNER JOIN inserted i ON r.review_id = i.review_id;
END;
GO

-- Trigger: Update updated_at timestamp for pricing_rules
IF OBJECT_ID('trg_pricing_rules_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_pricing_rules_updated_at;
GO
CREATE TRIGGER trg_pricing_rules_updated_at ON pricing_rules
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE pr
    SET updated_at = GETDATE()
    FROM pricing_rules pr
    INNER JOIN inserted i ON pr.rule_id = i.rule_id;
END;
GO

PRINT 'All triggers created successfully.';
GO

-- =====================================================================================
-- SECTION 5: VIEWS
-- =====================================================================================

PRINT 'Creating views...';
GO

-- View: Active bookings with full details
IF OBJECT_ID('vw_active_bookings', 'V') IS NOT NULL
    DROP VIEW vw_active_bookings;
GO
CREATE VIEW vw_active_bookings AS
SELECT 
    b.booking_id,
    b.user_id,
    u.full_name AS customer_name,
    u.email AS customer_email,
    u.phone_number AS customer_phone,
    b.vehicle_id,
    v.vehicle_type,
    v.license_plate,
    b.slot_id,
    cs.slot_number,
    cp.post_number,
    st.station_name,
    st.address AS station_address,
    b.scheduling_type,
    b.scheduled_start_time,
    b.actual_start_time,
    b.status,
    b.target_soc,
    b.created_at
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN vehicles v ON b.vehicle_id = v.vehicle_id
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
INNER JOIN charging_stations st ON cp.station_id = st.station_id
WHERE b.status IN ('scheduled', 'confirmed', 'in_progress');
GO

-- View: Station availability summary
IF OBJECT_ID('vw_station_availability', 'V') IS NOT NULL
    DROP VIEW vw_station_availability;
GO
CREATE VIEW vw_station_availability AS
SELECT 
    st.station_id,
    st.station_name,
    st.address,
    st.city,
    st.latitude,
    st.longitude,
    st.total_posts,
    st.available_posts,
    COUNT(DISTINCT cp.post_id) AS active_posts,
    COUNT(DISTINCT cs.slot_id) AS total_slots,
    SUM(CASE WHEN cs.status = 'available' THEN 1 ELSE 0 END) AS available_slots,
    st.operating_hours,
    st.status
FROM charging_stations st
LEFT JOIN charging_posts cp ON st.station_id = cp.station_id AND cp.status != 'offline'
LEFT JOIN charging_slots cs ON cp.post_id = cs.post_id
GROUP BY 
    st.station_id, st.station_name, st.address, st.city,
    st.latitude, st.longitude, st.total_posts, st.available_posts,
    st.operating_hours, st.status;
GO

PRINT 'All views created successfully.';
GO

-- =====================================================================================
-- SECTION 6: FUNCTIONS
-- =====================================================================================

PRINT 'Creating functions...';
GO

-- Function: Calculate distance between two points
IF OBJECT_ID('fn_calculate_distance', 'FN') IS NOT NULL
    DROP FUNCTION fn_calculate_distance;
GO
CREATE FUNCTION fn_calculate_distance(
    @lat1 DECIMAL(10,8),
    @lon1 DECIMAL(11,8),
    @lat2 DECIMAL(10,8),
    @lon2 DECIMAL(11,8)
)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @distance DECIMAL(10,2);
    DECLARE @point1 GEOGRAPHY = geography::Point(@lat1, @lon1, 4326);
    DECLARE @point2 GEOGRAPHY = geography::Point(@lat2, @lon2, 4326);
    
    SET @distance = @point1.STDistance(@point2) / 1000.0; -- Convert to kilometers
    
    RETURN @distance;
END;
GO

PRINT 'All functions created successfully.';
GO

-- =====================================================================================
-- SECTION 7: STORED PROCEDURES
-- =====================================================================================

PRINT 'Creating stored procedures...';
GO

-- =====================================================================================
-- Stored Procedure: User Authentication
-- =====================================================================================
IF OBJECT_ID('sp_authenticate_user', 'P') IS NOT NULL
    DROP PROCEDURE sp_authenticate_user;
GO
CREATE PROCEDURE sp_authenticate_user
    @email NVARCHAR(255),
    @password_hash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        user_id,
        email,
        full_name,
        phone_number,
        role,
        is_active
    FROM users
    WHERE email = @email 
        AND password_hash = @password_hash 
        AND is_active = 1;
END;
GO

-- =====================================================================================
-- Stored Procedure: Create User
-- =====================================================================================
IF OBJECT_ID('sp_create_user', 'P') IS NOT NULL
    DROP PROCEDURE sp_create_user;
GO
CREATE PROCEDURE sp_create_user
    @email NVARCHAR(255),
    @password_hash NVARCHAR(255),
    @full_name NVARCHAR(255),
    @phone_number NVARCHAR(20),
    @role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @user_id INT;
        
        INSERT INTO users (email, password_hash, full_name, phone_number, role)
        VALUES (@email, @password_hash, @full_name, @phone_number, @role);
        
        SET @user_id = SCOPE_IDENTITY();
        
        -- Create user profile
        INSERT INTO user_profiles (user_id)
        VALUES (@user_id);
        
        COMMIT TRANSACTION;
        
        SELECT @user_id AS user_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =====================================================================================
-- Stored Procedure: Search Stations by Location
-- =====================================================================================
IF OBJECT_ID('sp_search_stations_by_location', 'P') IS NOT NULL
    DROP PROCEDURE sp_search_stations_by_location;
GO
CREATE PROCEDURE sp_search_stations_by_location
    @latitude DECIMAL(10,8),
    @longitude DECIMAL(11,8),
    @radius_km DECIMAL(10,2) = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @search_point GEOGRAPHY = geography::Point(@latitude, @longitude, 4326);
    
    SELECT 
        st.station_id,
        st.station_name,
        st.address,
        st.city,
        st.latitude,
        st.longitude,
        st.total_posts,
        st.available_posts,
        st.operating_hours,
        st.amenities,
        st.station_image_url,
        st.status,
        @search_point.STDistance(st.location) / 1000.0 AS distance_km
    FROM charging_stations st
    WHERE st.status = 'active'
        AND @search_point.STDistance(st.location) <= (@radius_km * 1000)
    ORDER BY distance_km;
END;
GO

-- =====================================================================================
-- Stored Procedure: Get Available Slots
-- =====================================================================================
IF OBJECT_ID('sp_get_available_slots', 'P') IS NOT NULL
    DROP PROCEDURE sp_get_available_slots;
GO
CREATE PROCEDURE sp_get_available_slots
    @station_id INT,
    @vehicle_type NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cs.slot_id,
        cs.slot_number,
        cs.connector_type,
        cs.max_power,
        cs.status,
        cp.post_id,
        cp.post_number,
        cp.post_type,
        cp.power_output
    FROM charging_slots cs
    INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
    WHERE cp.station_id = @station_id
        AND cs.status = 'available'
        AND cp.status = 'available'
    ORDER BY cp.post_number, cs.slot_number;
END;
GO

-- =====================================================================================
-- Stored Procedure: Create Booking
-- =====================================================================================
IF OBJECT_ID('sp_create_booking', 'P') IS NOT NULL
    DROP PROCEDURE sp_create_booking;
GO
CREATE PROCEDURE sp_create_booking
    @user_id INT,
    @vehicle_id INT,
    @slot_id INT,
    @station_id INT,
    @scheduling_type NVARCHAR(50),
    @scheduled_start_time DATETIME2 = NULL,
    @estimated_arrival DATETIME2 = NULL,
    @target_soc DECIMAL(5,2) = NULL,
    @estimated_duration INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @booking_id INT;
        
        -- Check slot availability
        IF NOT EXISTS (
            SELECT 1 FROM charging_slots 
            WHERE slot_id = @slot_id AND status = 'available'
        )
        BEGIN
            RAISERROR('Slot is not available', 16, 1);
            RETURN;
        END
        
        -- Create booking
        INSERT INTO bookings (
            user_id, vehicle_id, slot_id, station_id,
            scheduling_type, scheduled_start_time, estimated_arrival,
            target_soc, estimated_duration, status
        )
        VALUES (
            @user_id, @vehicle_id, @slot_id, @station_id,
            @scheduling_type, @scheduled_start_time, @estimated_arrival,
            @target_soc, @estimated_duration, 
            CASE WHEN @scheduling_type = 'qr_immediate' THEN 'confirmed' ELSE 'scheduled' END
        );
        
        SET @booking_id = SCOPE_IDENTITY();
        
        -- Update slot status
        UPDATE charging_slots
        SET status = CASE WHEN @scheduling_type = 'qr_immediate' THEN 'occupied' ELSE 'reserved' END,
            current_booking_id = @booking_id
        WHERE slot_id = @slot_id;
        
        -- Update post availability
        UPDATE charging_posts
        SET available_slots = available_slots - 1
        WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @slot_id);
        
        -- Update station availability
        UPDATE charging_stations
        SET available_posts = (
            SELECT COUNT(DISTINCT cp.post_id)
            FROM charging_posts cp
            INNER JOIN charging_slots cs ON cp.post_id = cs.post_id
            WHERE cp.station_id = @station_id AND cs.status = 'available'
        )
        WHERE station_id = @station_id;
        
        COMMIT TRANSACTION;
        
        SELECT @booking_id AS booking_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =====================================================================================
-- Stored Procedure: Scan QR Code
-- =====================================================================================
IF OBJECT_ID('sp_scan_qr_code', 'P') IS NOT NULL
    DROP PROCEDURE sp_scan_qr_code;
GO
CREATE PROCEDURE sp_scan_qr_code
    @qr_data NVARCHAR(500),
    @user_id INT,
    @vehicle_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @qr_id INT;
        DECLARE @station_id INT;
        DECLARE @slot_id INT;
        
        -- Validate QR code
        SELECT @qr_id = qr_id, @station_id = station_id, @slot_id = slot_id
        FROM qr_codes
        WHERE qr_data = @qr_data 
            AND is_active = 1
            AND (expires_at IS NULL OR expires_at > GETDATE());
        
        IF @qr_id IS NULL
        BEGIN
            RAISERROR('Invalid or expired QR code', 16, 1);
            RETURN;
        END
        
        -- Update QR code scan info
        UPDATE qr_codes
        SET last_scanned_at = GETDATE(),
            scan_count = scan_count + 1
        WHERE qr_id = @qr_id;
        
        -- Create immediate booking via sp_create_booking
        EXEC sp_create_booking
            @user_id = @user_id,
            @vehicle_id = @vehicle_id,
            @slot_id = @slot_id,
            @station_id = @station_id,
            @scheduling_type = 'qr_immediate',
            @scheduled_start_time = NULL,
            @estimated_arrival = NULL,
            @target_soc = 80,
            @estimated_duration = NULL;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =====================================================================================
-- Stored Procedure: Start Charging
-- =====================================================================================
IF OBJECT_ID('sp_start_charging', 'P') IS NOT NULL
    DROP PROCEDURE sp_start_charging;
GO
CREATE PROCEDURE sp_start_charging
    @booking_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update booking status
        UPDATE bookings
        SET status = 'in_progress',
            actual_start_time = GETDATE()
        WHERE booking_id = @booking_id;
        
        -- Update slot status
        UPDATE charging_slots
        SET status = 'occupied'
        WHERE slot_id = (SELECT slot_id FROM bookings WHERE booking_id = @booking_id);
        
        COMMIT TRANSACTION;
        
        SELECT 'Charging started successfully' AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =====================================================================================
-- Stored Procedure: Update SOC Progress (escaped reserved identifiers)
-- =====================================================================================
IF OBJECT_ID('sp_update_soc_progress', 'P') IS NOT NULL
    DROP PROCEDURE sp_update_soc_progress;
GO
CREATE PROCEDURE sp_update_soc_progress
    @booking_id INT,
    @current_soc DECIMAL(5,2),
    @voltage DECIMAL(10,2) = NULL,
    @current DECIMAL(10,2) = NULL,
    @power DECIMAL(10,2) = NULL,
    @energy_delivered DECIMAL(10,2) = NULL,
    @temperature DECIMAL(5,2) = NULL,
    @estimated_time_remaining INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO soc_tracking (
        booking_id, current_soc, voltage, [current], [power],
        energy_delivered, temperature, estimated_time_remaining
    )
    VALUES (
        @booking_id, @current_soc, @voltage, @current, @power,
        @energy_delivered, @temperature, @estimated_time_remaining
    );
    
    SELECT 'SOC updated successfully' AS message;
END;
GO

-- =====================================================================================
-- Stored Procedure: Complete Charging
-- =====================================================================================
IF OBJECT_ID('sp_complete_charging', 'P') IS NOT NULL
    DROP PROCEDURE sp_complete_charging;
GO
CREATE PROCEDURE sp_complete_charging
    @booking_id INT,
    @final_soc DECIMAL(5,2),
    @total_energy_kwh DECIMAL(10,2),
    @unit_price DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @user_id INT;
        DECLARE @slot_id INT;
        DECLARE @subtotal DECIMAL(10,2);
        DECLARE @tax_amount DECIMAL(10,2);
        DECLARE @total_amount DECIMAL(10,2);
        
        -- Get booking details
        SELECT @user_id = user_id, @slot_id = slot_id
        FROM bookings
        WHERE booking_id = @booking_id;
        
        -- Calculate invoice amounts
        SET @subtotal = @total_energy_kwh * @unit_price;
        SET @tax_amount = @subtotal * 0.1; -- 10% tax
        SET @total_amount = @subtotal + @tax_amount;
        
        -- Update booking status
        UPDATE bookings
        SET status = 'completed',
            actual_end_time = GETDATE()
        WHERE booking_id = @booking_id;
        
        -- Record final SOC
        INSERT INTO soc_tracking (booking_id, current_soc, energy_delivered)
        VALUES (@booking_id, @final_soc, @total_energy_kwh);
        
        -- Create invoice
        INSERT INTO invoices (
            booking_id, user_id, total_energy_kwh, unit_price,
            subtotal, tax_amount, total_amount, payment_status
        )
        VALUES (
            @booking_id, @user_id, @total_energy_kwh, @unit_price,
            @subtotal, @tax_amount, @total_amount, 'pending'
        );
        
        -- Free up the slot
        UPDATE charging_slots
        SET status = 'available',
            current_booking_id = NULL
        WHERE slot_id = @slot_id;
        
        -- Update post availability
        UPDATE charging_posts
        SET available_slots = available_slots + 1
        WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @slot_id);
        
        -- Update station availability
        DECLARE @station_id INT = (SELECT station_id FROM bookings WHERE booking_id = @booking_id);
        UPDATE charging_stations
        SET available_posts = (
            SELECT COUNT(DISTINCT cp.post_id)
            FROM charging_posts cp
            INNER JOIN charging_slots cs ON cp.post_id = cs.post_id
            WHERE cp.station_id = @station_id AND cs.status = 'available'
        )
        WHERE station_id = @station_id;
        
        COMMIT TRANSACTION;
        
        SELECT 'Charging completed successfully' AS message, @total_amount AS total_amount;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =====================================================================================
-- Stored Procedure: Cancel Booking
-- =====================================================================================
IF OBJECT_ID('sp_cancel_booking', 'P') IS NOT NULL
    DROP PROCEDURE sp_cancel_booking;
GO
CREATE PROCEDURE sp_cancel_booking
    @booking_id INT,
    @cancellation_reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @slot_id INT;
        DECLARE @station_id INT;
        
        SELECT @slot_id = slot_id, @station_id = station_id
        FROM bookings
        WHERE booking_id = @booking_id;
        
        -- Update booking status
        UPDATE bookings
        SET status = 'cancelled',
            cancellation_reason = @cancellation_reason
        WHERE booking_id = @booking_id;
        
        -- Free up the slot
        UPDATE charging_slots
        SET status = 'available',
            current_booking_id = NULL
        WHERE slot_id = @slot_id;
        
        -- Update post availability
        UPDATE charging_posts
        SET available_slots = available_slots + 1
        WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @slot_id);
        
        -- Update station availability
        UPDATE charging_stations
        SET available_posts = (
            SELECT COUNT(DISTINCT cp.post_id)
            FROM charging_posts cp
            INNER JOIN charging_slots cs ON cp.post_id = cs.post_id
            WHERE cp.station_id = @station_id AND cs.status = 'available'
        )
        WHERE station_id = @station_id;
        
        COMMIT TRANSACTION;
        
        SELECT 'Booking cancelled successfully' AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =====================================================================================
-- Stored Procedure: Get User Booking History
-- =====================================================================================
IF OBJECT_ID('sp_get_user_booking_history', 'P') IS NOT NULL
    DROP PROCEDURE sp_get_user_booking_history;
GO
CREATE PROCEDURE sp_get_user_booking_history
    @user_id INT,
    @limit INT = 50,
    @offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.booking_id,
        b.scheduling_type,
        b.scheduled_start_time,
        b.actual_start_time,
        b.actual_end_time,
        b.status,
        b.target_soc,
        st.station_name,
        st.address AS station_address,
        v.vehicle_type,
        v.license_plate,
        i.total_amount,
        i.payment_status,
        b.created_at
    FROM bookings b
    INNER JOIN charging_stations st ON b.station_id = st.station_id
    INNER JOIN vehicles v ON b.vehicle_id = v.vehicle_id
    LEFT JOIN invoices i ON b.booking_id = i.booking_id
    WHERE b.user_id = @user_id
    ORDER BY b.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
END;
GO

-- =====================================================================================
-- Stored Procedure: Get Booking SOC History (escaped reserved identifiers)
-- =====================================================================================
IF OBJECT_ID('sp_get_booking_soc_history', 'P') IS NOT NULL
    DROP PROCEDURE sp_get_booking_soc_history;
GO
CREATE PROCEDURE sp_get_booking_soc_history
    @booking_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tracking_id,
        [timestamp],
        current_soc,
        voltage,
        [current],
        [power],
        energy_delivered,
        temperature,
        estimated_time_remaining
    FROM soc_tracking
    WHERE booking_id = @booking_id
    ORDER BY [timestamp] ASC;
END;
GO

-- =====================================================================================
-- Stored Procedure: Create Notification
-- =====================================================================================
IF OBJECT_ID('sp_create_notification', 'P') IS NOT NULL
    DROP PROCEDURE sp_create_notification;
GO
CREATE PROCEDURE sp_create_notification
    @user_id INT,
    @type NVARCHAR(50),
    @title NVARCHAR(255),
    @message NVARCHAR(MAX),
    @related_booking_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO notifications (user_id, type, title, message, related_booking_id)
    VALUES (@user_id, @type, @title, @message, @related_booking_id);
    
    SELECT SCOPE_IDENTITY() AS notification_id;
END;
GO

-- =====================================================================================
-- Stored Procedure: Get Station Analytics (fixed aggregate over subquery)
-- =====================================================================================
IF OBJECT_ID('sp_get_station_analytics', 'P') IS NOT NULL
    DROP PROCEDURE sp_get_station_analytics;
GO
CREATE PROCEDURE sp_get_station_analytics
    @station_id INT,
    @start_date DATETIME2,
    @end_date DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH bookings_in_range AS (
        SELECT *
        FROM bookings
        WHERE station_id = @station_id
          AND created_at BETWEEN @start_date AND @end_date
    ),
    energy_per_booking AS (
        SELECT booking_id, SUM(energy_delivered) AS total_energy_delivered_kwh
        FROM soc_tracking
        GROUP BY booking_id
    )
    SELECT 
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
        AVG(CASE WHEN b.status = 'completed' THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) END) AS avg_session_duration_minutes,
        SUM(CASE WHEN b.status = 'completed' THEN COALESCE(e.total_energy_delivered_kwh, 0) ELSE 0 END) AS total_energy_delivered_kwh,
        SUM(CASE WHEN b.status = 'completed' THEN COALESCE(i.total_amount, 0) ELSE 0 END) AS total_revenue
    FROM bookings_in_range b
    LEFT JOIN energy_per_booking e ON e.booking_id = b.booking_id
    LEFT JOIN invoices i ON i.booking_id = b.booking_id;
END;
GO

-- =====================================================================================
-- Stored Procedure: Get System Health
-- =====================================================================================
IF OBJECT_ID('sp_get_system_health', 'P') IS NOT NULL
    DROP PROCEDURE sp_get_system_health;
GO
CREATE PROCEDURE sp_get_system_health
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM charging_stations WHERE status = 'active') AS active_stations,
        (SELECT COUNT(*) FROM charging_posts WHERE status != 'offline') AS operational_posts,
        (SELECT COUNT(*) FROM charging_slots WHERE status = 'available') AS available_slots,
        (SELECT COUNT(*) FROM bookings WHERE status = 'in_progress') AS active_charging_sessions,
        (SELECT COUNT(*) FROM bookings WHERE status = 'scheduled' AND scheduled_start_time > GETDATE()) AS upcoming_bookings,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) AS active_users;
END;
GO

PRINT 'All stored procedures created successfully.';
GO

-- =====================================================================================
-- SECTION 8: VERIFICATION
-- =====================================================================================

PRINT '=====================================================================================';
PRINT 'DATABASE DEPLOYMENT VERIFICATION';
PRINT '=====================================================================================';
GO

-- List all tables
PRINT 'Tables:';
SELECT 
    t.TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS c WHERE c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = t.TABLE_SCHEMA) AS column_count
FROM INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_TYPE = 'BASE TABLE'
  AND t.TABLE_SCHEMA = 'dbo'
ORDER BY t.TABLE_NAME;
GO

-- List all stored procedures
PRINT 'Stored Procedures:';
SELECT 
    ROUTINE_NAME,
    CREATED,
    LAST_ALTERED
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'
ORDER BY ROUTINE_NAME;
GO

-- List all views
PRINT 'Views:';
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.VIEWS
ORDER BY TABLE_NAME;
GO

-- List all functions
PRINT 'Functions:';
SELECT ROUTINE_NAME
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'FUNCTION'
ORDER BY ROUTINE_NAME;
GO

-- List all indexes
PRINT 'Indexes:';
SELECT 
    t.name AS table_name,
    i.name AS index_name,
    i.type_desc AS index_type
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.name IS NOT NULL
ORDER BY t.name, i.name;
GO

-- List all triggers
PRINT 'Triggers:';
SELECT 
    t.name AS trigger_name,
    OBJECT_NAME(t.parent_id) AS table_name
FROM sys.triggers t
WHERE t.is_ms_shipped = 0
ORDER BY OBJECT_NAME(t.parent_id), t.name;
GO

-- List all foreign keys
PRINT 'Foreign Keys:';
SELECT 
    fk.name AS fk_name,
    OBJECT_NAME(fk.parent_object_id) AS table_name,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table
FROM sys.foreign_keys fk
ORDER BY OBJECT_NAME(fk.parent_object_id), fk.name;
GO

PRINT '=====================================================================================';
PRINT 'SkaEV Database Deployment Completed Successfully!';
PRINT '=====================================================================================';
PRINT 'Summary:';
PRINT '- 16 Tables created';
PRINT '- 15 Stored Procedures created';
PRINT '- 2 Views created';
PRINT '- 1 Function created';
PRINT '- Multiple Indexes and Triggers created';
PRINT '- All constraints and relationships configured';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Review the verification output above';
PRINT '2. Insert seed data if needed';
PRINT '3. Configure your application connection string';
PRINT '4. Test the stored procedures';
PRINT '=====================================================================================';
GO