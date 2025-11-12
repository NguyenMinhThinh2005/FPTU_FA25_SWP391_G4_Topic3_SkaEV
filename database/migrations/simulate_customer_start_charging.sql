-- ========================================================
-- SIMULATE CUSTOMER START CHARGING
-- ========================================================
USE [SkaEV_DB]
GO

SET NOCOUNT ON;
GO

PRINT '========================================';
PRINT 'CUSTOMER ACTION: Start Charging';
PRINT '========================================';
PRINT '';

DECLARE @booking_id INT = 19;  -- Booking to start

-- Show BEFORE state
PRINT '📋 BEFORE Starting:';
SELECT 
    b.booking_id,
    u.full_name AS customer,
    b.status AS booking_status,
    FORMAT(b.actual_start_time, 'HH:mm:ss') AS started_time,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector,
    cs.status AS slot_status,
    cs.current_booking_id,
    CASE 
        WHEN cs.current_booking_id IS NULL THEN '⚠️ Staff will NOT see this'
        ELSE '✅ Staff will see this'
    END AS staff_visibility
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
WHERE b.booking_id = @booking_id;

PRINT '';
PRINT '⚡ Executing: sp_start_charging...';
PRINT '';

-- Execute the FIXED stored procedure
EXEC sp_start_charging @booking_id = @booking_id;

PRINT '';
PRINT '========================================';
PRINT '✅ Charging Started!';
PRINT '========================================';
PRINT '';

-- Show AFTER state
PRINT '📋 AFTER Starting:';
SELECT 
    b.booking_id,
    u.full_name AS customer,
    b.status AS booking_status,
    FORMAT(b.actual_start_time, 'HH:mm:ss') AS started_time,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector,
    cs.status AS slot_status,
    cs.current_booking_id,
    CASE 
        WHEN cs.current_booking_id = b.booking_id THEN '✅ Staff WILL see this active session!'
        WHEN cs.current_booking_id IS NULL THEN '❌ NOT LINKED - Backend not restarted!'
        ELSE '⚠️ Linked to different booking'
    END AS staff_visibility
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
WHERE b.booking_id = @booking_id;

PRINT '';
PRINT '========================================';
PRINT 'WHAT STAFF DASHBOARD WILL SEE:';
PRINT '========================================';
PRINT '';

-- This simulates what StaffDashboardService.GetDashboardAsync() does
SELECT 
    cs.slot_id,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector_code,
    cs.status AS connector_status,
    cs.current_booking_id,
    b.booking_id,
    b.status AS session_status,
    u.full_name AS customer_name,
    u.email AS customer_email,
    FORMAT(b.actual_start_time, 'yyyy-MM-dd HH:mm:ss') AS session_start,
    DATEDIFF(MINUTE, b.actual_start_time, GETDATE()) AS duration_minutes,
    CASE 
        WHEN cs.current_booking_id IS NOT NULL THEN 'Yes - Will appear in Active Sessions'
        ELSE 'No - Will NOT appear'
    END AS visible_to_staff
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
LEFT JOIN bookings b ON cs.current_booking_id = b.booking_id
LEFT JOIN users u ON b.user_id = u.user_id
WHERE cp.station_id = 1  -- VinFast station
ORDER BY cs.slot_id;

PRINT '';
PRINT '========================================';
PRINT '📊 Active Sessions Count:';
PRINT '========================================';

SELECT 
    COUNT(*) AS total_active_sessions,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Staff Dashboard will show: activeSessions = ' + CAST(COUNT(*) AS VARCHAR)
        ELSE '⚠️ No active sessions - Staff Dashboard shows 0'
    END AS dashboard_result
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
WHERE cp.station_id = 1 
  AND cs.current_booking_id IS NOT NULL;

PRINT '';
PRINT '✅ SIMULATION COMPLETE!';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Refresh Staff Dashboard (F5)';
PRINT '2. Check console for: activeSessions > 0';
PRINT '3. Connector should show as "Occupied"';
PRINT '';
GO
