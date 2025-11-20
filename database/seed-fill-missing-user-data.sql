-- Seed script: Fill missing demo data for customers, staff, and admins
-- Ensures every customer has 1 vehicle + 1 completed booking + 1 invoice
-- Ensures every staff has 1 station assignment and 1 incident assigned
-- Ensures every admin has at least 1 system_log
-- Run on SkaEV_DB

USE SkaEV_DB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

PRINT '=== Seed: Fill missing user demo data START ===';
DECLARE @now DATETIME2 = SYSUTCDATETIME();

-- 1) Customers: add vehicle if missing, add one completed booking+invoice if no bookings/invoices
DECLARE @cust_cursor CURSOR;
DECLARE @custId INT;

SET @cust_cursor = CURSOR FOR
SELECT u.user_id
FROM dbo.users u
WHERE u.role = 'customer'
ORDER BY u.user_id;

OPEN @cust_cursor;
FETCH NEXT FROM @cust_cursor INTO @custId;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- ensure vehicle
        IF NOT EXISTS (SELECT 1 FROM dbo.vehicles v WHERE v.user_id = @custId AND v.deleted_at IS NULL)
        BEGIN
            INSERT INTO dbo.vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
            VALUES (@custId, N'car', N'DemoBrand', N'DemoModel', CONCAT('DEMO-C-', @custId), 50.0, N'CCS2', 1, @now, @now);
            PRINT CONCAT('Inserted vehicle for customer ', @custId);
        END;

        -- ensure at least one booking
        IF NOT EXISTS (SELECT 1 FROM dbo.bookings b WHERE b.user_id = @custId)
        BEGIN
            DECLARE @slotId INT = (SELECT TOP 1 cs.slot_id FROM dbo.charging_slots cs
                                    INNER JOIN dbo.charging_posts cp ON cs.post_id = cp.post_id
                                    INNER JOIN dbo.charging_stations s ON cp.station_id = s.station_id
                                    WHERE s.deleted_at IS NULL AND s.status = 'active' AND cs.status = 'available');

            IF @slotId IS NULL
            BEGIN
                -- fallback: create a very minimal booking without slot
                INSERT INTO dbo.bookings (user_id, vehicle_id, station_id, scheduling_type, scheduled_start_time, actual_start_time, actual_end_time, status, target_soc, estimated_duration, created_at, updated_at)
                VALUES (@custId, (SELECT TOP 1 vehicle_id FROM dbo.vehicles WHERE user_id = @custId), NULL, N'demo', DATEADD(MINUTE, -60, @now), DATEADD(MINUTE, -60, @now), DATEADD(MINUTE, -20, @now), N'completed', 90, 40, DATEADD(MINUTE, -65, @now), @now);
            END
            ELSE
            BEGIN
                DECLARE @postId INT = (SELECT post_id FROM dbo.charging_slots WHERE slot_id = @slotId);
                DECLARE @stationId INT = (SELECT cp.station_id FROM dbo.charging_posts cp INNER JOIN dbo.charging_slots cs ON cp.post_id = cs.post_id WHERE cs.slot_id = @slotId);

                INSERT INTO dbo.bookings (user_id, vehicle_id, slot_id, station_id, scheduling_type, scheduled_start_time, actual_start_time, actual_end_time, status, target_soc, estimated_duration, created_at, updated_at)
                VALUES (@custId, (SELECT TOP 1 vehicle_id FROM dbo.vehicles WHERE user_id = @custId), @slotId, @stationId, N'demo', DATEADD(MINUTE, -45, @now), DATEADD(MINUTE, -45, @now), DATEADD(MINUTE, -5, @now), N'completed', 85, 40, DATEADD(MINUTE, -50, @now), @now);

                -- mark slot available/occupied appropriately (best-effort)
                UPDATE dbo.charging_slots SET status = 'available', updated_at = @now WHERE slot_id = @slotId;
            END;

            DECLARE @newBookingId INT = SCOPE_IDENTITY();

            IF @newBookingId IS NULL
            BEGIN
                -- if SCOPE_IDENTITY didn't pick up because we used fallback branch, try to find recent booking
                SET @newBookingId = (SELECT TOP 1 booking_id FROM dbo.bookings WHERE user_id = @custId ORDER BY created_at DESC);
            END

            IF NOT EXISTS (SELECT 1 FROM dbo.invoices i WHERE i.booking_id = @newBookingId)
            BEGIN
                INSERT INTO dbo.invoices (booking_id, user_id, total_amount, payment_method, payment_status, created_at, updated_at)
                VALUES (@newBookingId, @custId, 50000, N'momo', N'paid', @now, @now);
                PRINT CONCAT('Inserted booking+invoice for customer ', @custId);
            END;
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        PRINT CONCAT('Error for customer ', @custId, ': ', ERROR_MESSAGE());
    END CATCH;

    FETCH NEXT FROM @cust_cursor INTO @custId;
END;

CLOSE @cust_cursor;
DEALLOCATE @cust_cursor;

-- 2) Staff: ensure station assignment if missing and create 1 incident if staff has no incidents
DECLARE @staff_cursor CURSOR;
DECLARE @staffId INT;

SET @staff_cursor = CURSOR FOR
SELECT u.user_id FROM dbo.users u WHERE u.role = 'staff' ORDER BY u.user_id;

OPEN @staff_cursor;
FETCH NEXT FROM @staff_cursor INTO @staffId;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- assignment
        IF NOT EXISTS (SELECT 1 FROM dbo.station_staff ss WHERE ss.staff_user_id = @staffId AND ss.is_active = 1)
        BEGIN
            DECLARE @anyStation INT = (SELECT TOP 1 station_id FROM dbo.charging_stations WHERE status = 'active');
            IF @anyStation IS NOT NULL
            BEGIN
                INSERT INTO dbo.station_staff (staff_user_id, station_id, assigned_at, is_active) VALUES (@staffId, @anyStation, @now, 1);
                PRINT CONCAT('Assigned staff ', @staffId, ' to station ', @anyStation);
            END;
        END;

        -- incident
        IF NOT EXISTS (SELECT 1 FROM dbo.incidents i WHERE i.assigned_to_staff_id = @staffId)
        BEGIN
            DECLARE @stationForIncident INT = (SELECT TOP 1 station_id FROM dbo.station_staff ss WHERE ss.staff_user_id = @staffId AND ss.is_active = 1);
            IF @stationForIncident IS NULL
                SET @stationForIncident = (SELECT TOP 1 station_id FROM dbo.charging_stations WHERE status = 'active');

            INSERT INTO dbo.incidents (station_id, post_id, slot_id, reported_by_user_id, incident_type, severity, status, title, description, assigned_to_staff_id, reported_at, created_at, updated_at)
            VALUES (ISNULL(@stationForIncident, NULL), NULL, NULL, NULL, N'demo_issue', N'medium', N'open', N'Demo incident for staff', N'Auto-created demo incident', @staffId, @now, @now, @now);
            PRINT CONCAT('Inserted incident for staff ', @staffId);
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        PRINT CONCAT('Error for staff ', @staffId, ': ', ERROR_MESSAGE());
    END CATCH;

    FETCH NEXT FROM @staff_cursor INTO @staffId;
END;

CLOSE @staff_cursor;
DEALLOCATE @staff_cursor;

-- 3) Admins: ensure at least one system_log per admin
DECLARE @admin_cursor CURSOR;
DECLARE @adminId INT;

SET @admin_cursor = CURSOR FOR
SELECT u.user_id FROM dbo.users u WHERE u.role = 'admin' ORDER BY u.user_id;

OPEN @admin_cursor;
FETCH NEXT FROM @admin_cursor INTO @adminId;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.system_logs sl WHERE sl.user_id = @adminId)
        BEGIN
            INSERT INTO dbo.system_logs (log_type, severity, message, user_id, ip_address, endpoint, created_at)
            VALUES (N'info', N'low', CONCAT(N'Auto-seeded admin log for user ', @adminId), @adminId, N'127.0.0.1', N'/seed/auto', @now);
            PRINT CONCAT('Inserted system_log for admin ', @adminId);
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        PRINT CONCAT('Error for admin ', @adminId, ': ', ERROR_MESSAGE());
    END CATCH;

    FETCH NEXT FROM @admin_cursor INTO @adminId;
END;

CLOSE @admin_cursor;
DEALLOCATE @admin_cursor;

PRINT '=== Seed: Fill missing user demo data END ===';
GO
