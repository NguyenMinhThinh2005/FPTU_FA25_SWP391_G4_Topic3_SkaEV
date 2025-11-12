-- =====================================================================
-- Script: seed-admin-user-detail-focused.sql
-- Purpose: Populate coherent demo data for admin user detail screens
--          including customer history, staff assignments, and admin logs.
-- Run on: SkaEV_DB (SQL Server)
-- Author: GitHub Copilot (automation assistant)
-- Date: 2025-11-07
-- =====================================================================

USE SkaEV_DB;
GO

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
PRINT '=== SkaEV admin detail dataset refurbishment ===';

-- ---------------------------------------------------------------------
-- Ensure incidents table is available (aligns with Domain.Entities.Incident)
-- ---------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'incidents' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    PRINT 'Creating dbo.incidents table...';
    CREATE TABLE dbo.incidents
    (
        incident_id           INT IDENTITY(1,1) PRIMARY KEY,
        station_id            INT           NOT NULL,
        post_id               INT           NULL,
        slot_id               INT           NULL,
        reported_by_user_id   INT           NULL,
        incident_type         NVARCHAR(50)  NOT NULL,
        severity              NVARCHAR(20)  NOT NULL,
        status                NVARCHAR(20)  NOT NULL DEFAULT N'open',
        title                 NVARCHAR(255) NOT NULL,
        description           NVARCHAR(MAX) NOT NULL,
        resolution_notes      NVARCHAR(MAX) NULL,
        assigned_to_staff_id  INT           NULL,
        reported_at           DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        acknowledged_at       DATETIME2     NULL,
        resolved_at           DATETIME2     NULL,
        closed_at             DATETIME2     NULL,
        created_at            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_incidents_station FOREIGN KEY (station_id) REFERENCES dbo.charging_stations(station_id),
        CONSTRAINT FK_incidents_post FOREIGN KEY (post_id) REFERENCES dbo.charging_posts(post_id),
        CONSTRAINT FK_incidents_slot FOREIGN KEY (slot_id) REFERENCES dbo.charging_slots(slot_id),
        CONSTRAINT FK_incidents_reporter FOREIGN KEY (reported_by_user_id) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_incidents_assignee FOREIGN KEY (assigned_to_staff_id) REFERENCES dbo.users(user_id)
    );
    PRINT 'dbo.incidents table created.';
END
ELSE
BEGIN
    PRINT 'dbo.incidents table already exists.';
END;

-- ---------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------
DECLARE @DefaultPassword NVARCHAR(255) = '$2a$11$POBYWmWcbBHj7hNjGitPBefqT/Lm6TNs5Hr9uUHOdY.cZ2RQayxHy';
DECLARE @UtcNow DATETIME2 = SYSUTCDATETIME();

-- ---------------------------------------------------------------------
-- Customer: Quốc Khoa Lê (focus account for history tabs)
-- ---------------------------------------------------------------------
IF EXISTS (SELECT 1 FROM dbo.users WHERE email = N'quockhoatg202099@gmail.com' AND user_id <> 14)
BEGIN
    UPDATE dbo.users
    SET email = email + '.archived-' + CAST(user_id AS NVARCHAR(10))
    WHERE email = N'quockhoatg202099@gmail.com' AND user_id <> 14;
END;

IF EXISTS (SELECT 1 FROM dbo.users WHERE user_id = 14)
BEGIN
    UPDATE dbo.users
    SET email = N'quockhoatg202099@gmail.com',
        password_hash = @DefaultPassword,
        full_name = N'Quốc Khoa Lê',
        phone_number = N'0336990235',
        role = N'customer',
        is_active = 1,
        created_at = '2025-11-02T07:15:16Z',
        updated_at = @UtcNow
    WHERE user_id = 14;
END
ELSE
BEGIN
    SET IDENTITY_INSERT dbo.users ON;
    INSERT INTO dbo.users (user_id, email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (14, N'quockhoatg202099@gmail.com', @DefaultPassword, N'Quốc Khoa Lê', N'0336990235', N'customer', 1, '2025-11-02T07:15:16Z', @UtcNow);
    SET IDENTITY_INSERT dbo.users OFF;
END;

DECLARE @CustomerId INT = 14;

IF EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @CustomerId)
BEGIN
    UPDATE dbo.user_profiles
    SET address = N'78-80 Lý Thường Kiệt, Tân Lợi, Buôn Ma Thuột, Đắk Lắk',
        city = N'Đắk Lắk',
        avatar_url = ISNULL(avatar_url, 'https://cdn.skaev.com/avatars/customer-14.png'),
        preferred_payment_method = N'momo',
        updated_at = @UtcNow
    WHERE user_id = @CustomerId;
END
ELSE
BEGIN
    INSERT INTO dbo.user_profiles (user_id, address, city, avatar_url, preferred_payment_method, created_at, updated_at)
    VALUES (@CustomerId, N'78-80 Lý Thường Kiệt, Tân Lợi, Buôn Ma Thuột, Đắk Lắk', N'Đắk Lắk', 'https://cdn.skaev.com/avatars/customer-14.png', N'momo', @UtcNow, @UtcNow);
END;

-- Vehicle setup
DECLARE @PrimaryVehicleId INT = (
    SELECT TOP (1) vehicle_id
    FROM dbo.vehicles
    WHERE user_id = @CustomerId AND deleted_at IS NULL
    ORDER BY is_primary DESC, created_at ASC
);

IF @PrimaryVehicleId IS NULL
BEGIN
    INSERT INTO dbo.vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
    VALUES (@CustomerId, N'car', N'BMW', N'iX xDrive40', N'30A-58922', 76.60, N'CCS2', 1, @UtcNow, @UtcNow);
    SET @PrimaryVehicleId = SCOPE_IDENTITY();
END
ELSE
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.vehicles WHERE license_plate = N'30A-58922' AND vehicle_id <> @PrimaryVehicleId)
    BEGIN
        UPDATE dbo.vehicles
        SET license_plate = license_plate + '-DUP'
        WHERE license_plate = N'30A-58922' AND vehicle_id <> @PrimaryVehicleId;
    END;

    UPDATE dbo.vehicles
    SET vehicle_type = N'car',
        brand = N'BMW',
        model = N'iX xDrive40',
        license_plate = N'30A-58922',
        battery_capacity = 76.60,
        charging_port_type = N'CCS2',
        is_primary = 1,
        updated_at = @UtcNow
    WHERE vehicle_id = @PrimaryVehicleId;
END;

UPDATE dbo.vehicles
SET deleted_at = @UtcNow,
    updated_at = @UtcNow,
    is_primary = 0
WHERE user_id = @CustomerId AND vehicle_id <> @PrimaryVehicleId AND deleted_at IS NULL;

-- ---------------------------------------------------------------------
-- Helper procedure to upsert bookings + invoices for the customer
-- ---------------------------------------------------------------------
DECLARE @BookingPayload TABLE
(
    StationId     INT,
    SlotId        INT,
    StartTimeUtc  DATETIME2,
    EndTimeUtc    DATETIME2,
    StatusLabel   NVARCHAR(20),
    TargetSoc     DECIMAL(5,2),
    EstimatedMin  INT,
    EnergyKwh     DECIMAL(10,2),
    UnitPrice     DECIMAL(10,2),
    PaymentMethod NVARCHAR(30)
);

INSERT INTO @BookingPayload (StationId, SlotId, StartTimeUtc, EndTimeUtc, StatusLabel, TargetSoc, EstimatedMin, EnergyKwh, UnitPrice, PaymentMethod)
VALUES
    (29, 502, '2025-11-07T02:41:52Z', '2025-11-07T03:21:52Z', N'completed', 90.0, 40, 32.50, 5200, N'momo'),
    (4,   54,  '2025-11-06T14:48:35Z', '2025-11-06T15:28:35Z', N'completed', 85.0, 45, 28.20, 5100, N'credit_card'),
    (20,  346, '2025-11-05T01:35:00Z', '2025-11-05T02:25:00Z', N'completed', 80.0, 50, 30.75, 5050, N'zalopay'),
    (1,   3,   '2025-11-04T11:00:00Z', '2025-11-04T11:45:00Z', N'completed', 88.0, 45, 26.10, 5000, N'momo'),
    (3,   38,  '2025-11-03T09:35:00Z', '2025-11-03T10:20:00Z', N'completed', 82.0, 45, 25.40, 5000, N'zalopay'),
    (30,  514, '2025-11-02T07:15:00Z', '2025-11-02T08:05:00Z', N'completed', 86.0, 50, 31.80, 5150, N'credit_card');

DECLARE @StationId INT, @SlotId INT, @Start DATETIME2, @End DATETIME2, @Status NVARCHAR(20), @Target DECIMAL(5,2), @Estimated INT,
        @Energy DECIMAL(10,2), @Unit DECIMAL(10,2), @Method NVARCHAR(30), @BookingId INT;

DECLARE BookingCursor CURSOR FAST_FORWARD FOR
    SELECT StationId, SlotId, StartTimeUtc, EndTimeUtc, StatusLabel, TargetSoc, EstimatedMin, EnergyKwh, UnitPrice, PaymentMethod
    FROM @BookingPayload;

OPEN BookingCursor;
FETCH NEXT FROM BookingCursor INTO @StationId, @SlotId, @Start, @End, @Status, @Target, @Estimated, @Energy, @Unit, @Method;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (
        SELECT 1
        FROM dbo.bookings
        WHERE user_id = @CustomerId AND station_id = @StationId AND scheduled_start_time = @Start
    )
    BEGIN
        SELECT TOP (1) @BookingId = booking_id
        FROM dbo.bookings
        WHERE user_id = @CustomerId AND station_id = @StationId AND scheduled_start_time = @Start
        ORDER BY booking_id DESC;

        UPDATE dbo.bookings
        SET vehicle_id = @PrimaryVehicleId,
            slot_id = @SlotId,
            actual_start_time = @Start,
            actual_end_time = @End,
            scheduled_start_time = @Start,
            status = @Status,
            target_soc = @Target,
            estimated_duration = @Estimated,
            scheduling_type = N'qr_immediate',
            updated_at = @UtcNow
        WHERE booking_id = @BookingId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.bookings
        (
            user_id, vehicle_id, slot_id, station_id, scheduling_type, estimated_arrival,
            scheduled_start_time, actual_start_time, actual_end_time, status, target_soc,
            estimated_duration, created_at, updated_at
        )
        VALUES
        (
            @CustomerId, @PrimaryVehicleId, @SlotId, @StationId, N'qr_immediate', @Start,
            @Start, @Start, @End, @Status, @Target,
            @Estimated, DATEADD(MINUTE, -20, @Start), DATEADD(MINUTE, -20, @Start)
        );

        SET @BookingId = SCOPE_IDENTITY();
    END;

    DECLARE @Subtotal DECIMAL(10,2) = ROUND(@Energy * @Unit, 2);
    DECLARE @Total DECIMAL(10,2) = @Subtotal;
    DECLARE @PaidAt DATETIME2 = DATEADD(MINUTE, 5, @End);

    IF EXISTS (SELECT 1 FROM dbo.invoices WHERE booking_id = @BookingId)
    BEGIN
        UPDATE dbo.invoices
        SET total_energy_kwh = @Energy,
            unit_price = @Unit,
            subtotal = @Subtotal,
            tax_amount = 0,
            total_amount = @Total,
            payment_method = @Method,
            payment_status = N'paid',
            paid_at = @PaidAt,
            updated_at = @UtcNow
        WHERE booking_id = @BookingId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.invoices
        (
            booking_id, user_id, total_energy_kwh, unit_price, subtotal, tax_amount,
            total_amount, payment_method, payment_status, paid_at, created_at, updated_at
        )
        VALUES
        (
            @BookingId, @CustomerId, @Energy, @Unit, @Subtotal, 0,
            @Total, @Method, N'paid', @PaidAt, @End, @UtcNow
        );
    END;

    FETCH NEXT FROM BookingCursor INTO @StationId, @SlotId, @Start, @End, @Status, @Target, @Estimated, @Energy, @Unit, @Method;
END;

CLOSE BookingCursor;
DEALLOCATE BookingCursor;

-- Future bookings for schedule visibility (no invoices yet)
IF NOT EXISTS (SELECT 1 FROM dbo.bookings WHERE user_id = @CustomerId AND station_id = 29 AND scheduled_start_time = '2025-11-09T01:00:00Z')
BEGIN
    INSERT INTO dbo.bookings
    (
        user_id, vehicle_id, slot_id, station_id, scheduling_type, estimated_arrival,
        scheduled_start_time, actual_start_time, actual_end_time, status, target_soc,
        estimated_duration, created_at, updated_at
    )
    VALUES
    (
        @CustomerId, @PrimaryVehicleId, 503, 29, N'scheduled', '2025-11-09T01:00:00Z',
        '2025-11-09T01:00:00Z', NULL, NULL, N'scheduled', 92.0, 60,
        DATEADD(DAY, -1, @UtcNow), DATEADD(DAY, -1, @UtcNow)
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.bookings WHERE user_id = @CustomerId AND station_id = 29 AND scheduled_start_time = '2025-11-10T03:00:00Z')
BEGIN
    INSERT INTO dbo.bookings
    (
        user_id, vehicle_id, slot_id, station_id, scheduling_type, estimated_arrival,
        scheduled_start_time, actual_start_time, actual_end_time, status, target_soc,
        estimated_duration, created_at, updated_at
    )
    VALUES
    (
        @CustomerId, @PrimaryVehicleId, 504, 29, N'scheduled', '2025-11-10T03:00:00Z',
        '2025-11-10T03:00:00Z', NULL, NULL, N'scheduled', 95.0, 75,
        DATEADD(DAY, -1, @UtcNow), DATEADD(DAY, -1, @UtcNow)
    );
END;

-- ---------------------------------------------------------------------
-- Staff account: Staff User
-- ---------------------------------------------------------------------
DECLARE @StaffEmail NVARCHAR(255) = N'staff@skaev.com';
DECLARE @StaffId INT = (SELECT user_id FROM dbo.users WHERE email = @StaffEmail);

IF @StaffId IS NULL
BEGIN
    INSERT INTO dbo.users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (@StaffEmail, @DefaultPassword, N'Staff User', N'0901234567', N'staff', 1, '2025-11-02T06:52:09Z', @UtcNow);
    SET @StaffId = SCOPE_IDENTITY();
END
ELSE
BEGIN
    UPDATE dbo.users
    SET full_name = N'Staff User',
        phone_number = N'0901234567',
        role = N'staff',
        is_active = 1,
        created_at = '2025-11-02T06:52:09Z',
        updated_at = @UtcNow
    WHERE user_id = @StaffId;
END;

IF EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @StaffId)
BEGIN
    UPDATE dbo.user_profiles
    SET address = N'45 Phan Chu Trinh, Quận 1, TP.HCM',
        city = N'TP.HCM',
        avatar_url = ISNULL(avatar_url, 'https://cdn.skaev.com/avatars/staff-default.png'),
        updated_at = @UtcNow
    WHERE user_id = @StaffId;
END
ELSE
BEGIN
    INSERT INTO dbo.user_profiles (user_id, address, city, avatar_url, created_at, updated_at)
    VALUES (@StaffId, N'45 Phan Chu Trinh, Quận 1, TP.HCM', N'TP.HCM', 'https://cdn.skaev.com/avatars/staff-default.png', @UtcNow, @UtcNow);
END;

-- Assign staff to Vincom Plaza Buôn Ma Thuột (station_id = 29)
UPDATE dbo.station_staff
SET is_active = 0
WHERE staff_user_id = @StaffId AND station_id <> 29 AND is_active = 1;

IF NOT EXISTS (SELECT 1 FROM dbo.station_staff WHERE staff_user_id = @StaffId AND station_id = 29 AND is_active = 1)
BEGIN
    INSERT INTO dbo.station_staff (staff_user_id, station_id, assigned_at, is_active)
    VALUES (@StaffId, 29, '2025-10-20T02:00:00Z', 1);
END;

-- Ensure at least one in-progress booking today for station metrics
IF NOT EXISTS (SELECT 1 FROM dbo.bookings WHERE station_id = 29 AND status = N'in_progress' AND actual_start_time >= CAST(@UtcNow AS DATE))
BEGIN
    INSERT INTO dbo.bookings
    (
        user_id, vehicle_id, slot_id, station_id, scheduling_type, estimated_arrival,
        scheduled_start_time, actual_start_time, actual_end_time, status, target_soc,
        estimated_duration, created_at, updated_at
    )
    VALUES
    (
        @CustomerId, @PrimaryVehicleId, 505, 29, N'qr_immediate', @UtcNow,
        @UtcNow, DATEADD(MINUTE, -15, @UtcNow), NULL, N'in_progress', 70.0, 60,
        DATEADD(MINUTE, -30, @UtcNow), DATEADD(MINUTE, -15, @UtcNow)
    );
END;

-- Seed incidents assigned to this staff member
IF NOT EXISTS (SELECT 1 FROM dbo.incidents WHERE title = N'Kiểm tra trụ P05 - sụt công suất')
BEGIN
    INSERT INTO dbo.incidents
    (
        station_id, post_id, slot_id, reported_by_user_id, incident_type, severity, status,
        title, description, assigned_to_staff_id, reported_at, acknowledged_at, created_at, updated_at
    )
    VALUES
    (
        29, 257, 505, @CustomerId, N'equipment_failure', N'high', N'in_progress',
        N'Kiểm tra trụ P05 - sụt công suất',
        N'Khách hàng báo trụ P05 chỉ đạt 40kW sau 10 phút. Cần kiểm tra bộ làm mát.',
        @StaffId, DATEADD(HOUR, -4, @UtcNow), DATEADD(HOUR, -3, @UtcNow), DATEADD(HOUR, -4, @UtcNow), @UtcNow
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.incidents WHERE title = N'Bổ sung vật tư vệ sinh khu vực trạm 29')
BEGIN
    INSERT INTO dbo.incidents
    (
        station_id, post_id, slot_id, reported_by_user_id, incident_type, severity, status,
        title, description, assigned_to_staff_id, reported_at, created_at, updated_at
    )
    VALUES
    (
        29, NULL, NULL, @StaffId, N'safety_issue', N'medium', N'open',
        N'Bổ sung vật tư vệ sinh khu vực trạm 29',
        N'Kho vật tư báo thiếu khăn lau và dung dịch vệ sinh cho khu vực chờ khách.',
        @StaffId, DATEADD(HOUR, -6, @UtcNow), DATEADD(HOUR, -6, @UtcNow), @UtcNow
    );
END;

-- ---------------------------------------------------------------------
-- Admin account: Admin System (for admin detail tabs)
-- ---------------------------------------------------------------------
DECLARE @AdminEmail NVARCHAR(255) = N'admin2@skaev.com';
DECLARE @AdminId INT = (SELECT user_id FROM dbo.users WHERE email = @AdminEmail);

IF @AdminId IS NULL
BEGIN
    INSERT INTO dbo.users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (@AdminEmail, @DefaultPassword, N'Admin System', N'0901111111', N'admin', 1, '2025-11-01T05:19:58Z', @UtcNow);
    SET @AdminId = SCOPE_IDENTITY();
END
ELSE
BEGIN
    UPDATE dbo.users
    SET full_name = N'Admin System',
        phone_number = N'0901111111',
        role = N'admin',
        is_active = 1,
        created_at = '2025-11-01T05:19:58Z',
        updated_at = @UtcNow
    WHERE user_id = @AdminId;
END;

IF EXISTS (SELECT 1 FROM dbo.user_profiles WHERE user_id = @AdminId)
BEGIN
    UPDATE dbo.user_profiles
    SET address = N'Level 18, Saigon Centre, 65 Lê Lợi, Quận 1, TP.HCM',
        city = N'TP.HCM',
        avatar_url = ISNULL(avatar_url, 'https://cdn.skaev.com/avatars/admin-default.png'),
        updated_at = @UtcNow
    WHERE user_id = @AdminId;
END
ELSE
BEGIN
    INSERT INTO dbo.user_profiles (user_id, address, city, avatar_url, created_at, updated_at)
    VALUES (@AdminId, N'Level 18, Saigon Centre, 65 Lê Lợi, Quận 1, TP.HCM', N'TP.HCM', 'https://cdn.skaev.com/avatars/admin-default.png', @UtcNow, @UtcNow);
END;

-- Seed system logs for admin activity & audit tabs
IF NOT EXISTS (SELECT 1 FROM dbo.system_logs WHERE message = N'Approved staff assignment for station 29')
BEGIN
    INSERT INTO dbo.system_logs (log_type, severity, message, user_id, ip_address, endpoint, created_at)
    VALUES (N'info', N'low', N'Approved staff assignment for station 29', @AdminId, N'10.0.0.12', N'/api/admin/stations/29/assign', DATEADD(DAY, -1, @UtcNow));
END;

IF NOT EXISTS (SELECT 1 FROM dbo.system_logs WHERE message = N'Regenerated pricing rules for tier-3 stations')
BEGIN
    INSERT INTO dbo.system_logs (log_type, severity, message, user_id, ip_address, endpoint, created_at)
    VALUES (N'info', N'low', N'Regenerated pricing rules for tier-3 stations', @AdminId, N'10.0.0.12', N'/api/admin/pricing/recalculate', DATEADD(HOUR, -18, @UtcNow));
END;

IF NOT EXISTS (SELECT 1 FROM dbo.system_logs WHERE message = N'Locked suspicious account pending review')
BEGIN
    INSERT INTO dbo.system_logs (log_type, severity, message, user_id, ip_address, endpoint, created_at)
    VALUES (N'security', N'high', N'Locked suspicious account pending review', @AdminId, N'10.0.0.12', N'/api/admin/users/lock', DATEADD(HOUR, -6, @UtcNow));
END;

IF NOT EXISTS (SELECT 1 FROM dbo.system_logs WHERE message = N'Exported monthly revenue dashboard')
BEGIN
    INSERT INTO dbo.system_logs (log_type, severity, message, user_id, ip_address, endpoint, created_at)
    VALUES (N'info', N'medium', N'Exported monthly revenue dashboard', @AdminId, N'10.0.0.12', N'/api/admin/reports/revenue/export', DATEADD(HOUR, -4, @UtcNow));
END;

-- ---------------------------------------------------------------------
-- Final summary output for quick verification
-- ---------------------------------------------------------------------
PRINT '--- Summary snapshot ---';
SELECT full_name, role, created_at
FROM dbo.users
WHERE user_id IN (@CustomerId, @StaffId, @AdminId);

SELECT COUNT(*) AS customer_charging_sessions
FROM dbo.bookings
WHERE user_id = @CustomerId;

SELECT TOP (5) booking_id, station_id, status, actual_start_time
FROM dbo.bookings
WHERE user_id = @CustomerId
ORDER BY actual_start_time DESC;

SELECT COUNT(*) AS staff_assigned_stations
FROM dbo.station_staff
WHERE staff_user_id = @StaffId AND is_active = 1;

SELECT COUNT(*) AS staff_incidents_assigned
FROM dbo.incidents
WHERE assigned_to_staff_id = @StaffId;

SELECT COUNT(*) AS admin_logs
FROM dbo.system_logs
WHERE user_id = @AdminId;

PRINT '=== Admin detail dataset ready ===';
GO
