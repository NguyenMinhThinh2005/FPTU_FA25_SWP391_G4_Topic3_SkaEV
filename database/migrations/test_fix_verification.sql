-- ========================================================
-- TEST: Verify sp_start_charging fix
-- ========================================================
USE [SkaEV_DB]
GO

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @test_booking_id INT;
DECLARE @user_id INT = 10;  -- Customer User
DECLARE @slot_id INT = 3;   -- POST-01-A1
DECLARE @station_id INT = 1;
DECLARE @vehicle_id INT;

PRINT '========================================';
PRINT 'STEP 1: Setup test data';
PRINT '========================================';

-- Get or create vehicle
SELECT TOP 1 @vehicle_id = vehicle_id FROM vehicles WHERE user_id = @user_id AND deleted_at IS NULL;

IF @vehicle_id IS NULL
BEGIN
    PRINT '→ Creating test vehicle...';
    INSERT INTO vehicles (user_id, brand, model, license_plate, battery_capacity, created_at)
    VALUES (@user_id, 'Tesla', 'Model 3', 'TEST-001', 75.0, GETDATE());
    SET @vehicle_id = SCOPE_IDENTITY();
    PRINT '→ Vehicle created: ' + CAST(@vehicle_id AS VARCHAR);
END
ELSE
BEGIN
    PRINT '→ Using existing vehicle: ' + CAST(@vehicle_id AS VARCHAR);
END

PRINT '';
PRINT '========================================';
PRINT 'STEP 2: Create test booking';
PRINT '========================================';

-- Create test booking
INSERT INTO bookings (
    user_id, vehicle_id, slot_id, station_id, 
    scheduling_type, status, target_soc, created_at
)
VALUES (
    @user_id, @vehicle_id, @slot_id, @station_id,
    'qr_immediate', 'scheduled', 80.0, GETDATE()
);

SET @test_booking_id = SCOPE_IDENTITY();
PRINT '→ Test booking created: #' + CAST(@test_booking_id AS VARCHAR);

PRINT '';
PRINT '========================================';
PRINT 'STEP 3: Start charging (FIXED procedure)';
PRINT '========================================';

-- Execute the FIXED stored procedure
EXEC sp_start_charging @booking_id = @test_booking_id;

PRINT '';
PRINT '========================================';
PRINT 'STEP 4: VERIFY FIX WORKED';
PRINT '========================================';

-- Verify the fix
SELECT 
    b.booking_id AS [Booking ID],
    b.status AS [Booking Status],
    FORMAT(b.actual_start_time, 'yyyy-MM-dd HH:mm:ss') AS [Started At],
    cs.slot_id AS [Slot ID],
    CONCAT(cp.post_number, '-', cs.slot_number) AS [Connector],
    cs.status AS [Slot Status],
    cs.current_booking_id AS [Slot->Booking Link],
    CASE 
        WHEN cs.current_booking_id = b.booking_id THEN '✓ FIXED! Slot linked to booking'
        WHEN cs.current_booking_id IS NULL THEN '✗ FAILED: current_booking_id is NULL'
        ELSE '✗ FAILED: Wrong booking ID'
    END AS [Fix Status]
FROM bookings b
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
WHERE b.booking_id = @test_booking_id;

PRINT '';
PRINT '========================================';
PRINT 'STEP 5: Simulate Staff Dashboard query';
PRINT '========================================';

-- This is what StaffDashboardService does
SELECT 
    cs.slot_id,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector_code,
    cs.status AS slot_status,
    cs.current_booking_id,
    CASE WHEN cs.current_booking_id IS NOT NULL THEN '✓ Staff will see active session' ELSE 'Staff sees as Available' END AS staff_view,
    b.booking_id,
    u.full_name AS customer_name,
    b.status AS booking_status
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
LEFT JOIN bookings b ON cs.current_booking_id = b.booking_id
LEFT JOIN users u ON b.user_id = u.user_id
WHERE cs.slot_id = @slot_id;

PRINT '';
PRINT '========================================';
PRINT 'CLEANUP: Remove test booking';
PRINT '========================================';

-- Clean up test data
UPDATE charging_slots 
SET status = 'available', current_booking_id = NULL, updated_at = GETDATE()
WHERE slot_id = @slot_id;

DELETE FROM bookings WHERE booking_id = @test_booking_id;

PRINT '→ Test booking removed';
PRINT '';
PRINT '========================================';
PRINT '✓ TEST COMPLETE';
PRINT '========================================';
GO
