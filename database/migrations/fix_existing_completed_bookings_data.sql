-- ========================================================
-- FIX EXISTING DATA: Restore current_booking_id for completed unpaid sessions
-- ========================================================
USE [SkaEV_DB]
GO

SET NOCOUNT ON;
GO

PRINT '========================================';
PRINT 'FIXING EXISTING DATA';
PRINT '========================================';
PRINT '';

-- Find completed bookings with pending invoices
PRINT '📋 Completed sessions with pending payment:';
SELECT 
    b.booking_id,
    u.full_name AS customer,
    b.status AS booking_status,
    FORMAT(b.actual_end_time, 'HH:mm:ss') AS completed_at,
    i.payment_status,
    cs.slot_id,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector,
    cs.current_booking_id,
    CASE 
        WHEN cs.current_booking_id IS NULL THEN '❌ NEEDS FIX'
        ELSE '✅ Already linked'
    END AS fix_status
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN invoices i ON b.booking_id = i.booking_id
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
WHERE b.status = 'completed'
  AND i.payment_status = 'pending'
  AND b.deleted_at IS NULL;

PRINT '';
PRINT '🔧 Restoring current_booking_id for unpaid sessions...';
PRINT '';

-- Fix: Restore current_booking_id for completed sessions with pending payment
UPDATE cs
SET cs.current_booking_id = b.booking_id,
    cs.status = 'occupied',  -- Occupied until payment
    cs.updated_at = GETDATE()
FROM charging_slots cs
INNER JOIN bookings b ON cs.slot_id = b.slot_id
INNER JOIN invoices i ON b.booking_id = i.booking_id
WHERE b.status = 'completed'
  AND i.payment_status = 'pending'
  AND cs.current_booking_id IS NULL
  AND b.deleted_at IS NULL;

PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' slots updated';
PRINT '';

-- Verify the fix
PRINT '========================================';
PRINT '✅ VERIFICATION: Sessions Staff Will See';
PRINT '========================================';
PRINT '';

SELECT 
    cs.slot_id,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector_code,
    cs.status AS slot_status,
    cs.current_booking_id,
    b.booking_id,
    b.status AS booking_status,
    u.full_name AS customer_name,
    FORMAT(b.actual_start_time, 'HH:mm:ss') AS started,
    FORMAT(b.actual_end_time, 'HH:mm:ss') AS completed,
    i.payment_status,
    i.total_amount,
    CASE 
        WHEN cs.current_booking_id IS NOT NULL AND i.payment_status = 'pending' 
        THEN '✅ Staff WILL see this as "Awaiting Payment"'
        ELSE '⚠️ Something wrong'
    END AS staff_visibility
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
LEFT JOIN bookings b ON cs.current_booking_id = b.booking_id
LEFT JOIN users u ON b.user_id = u.user_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
WHERE cp.station_id = 1
  AND cs.current_booking_id IS NOT NULL
ORDER BY cs.slot_id;

PRINT '';
PRINT '========================================';
PRINT '📊 Summary';
PRINT '========================================';

SELECT 
    COUNT(CASE WHEN cs.current_booking_id IS NOT NULL AND b.status = 'in_progress' THEN 1 END) AS active_charging_sessions,
    COUNT(CASE WHEN cs.current_booking_id IS NOT NULL AND b.status = 'completed' AND i.payment_status = 'pending' THEN 1 END) AS awaiting_payment_sessions,
    COUNT(CASE WHEN cs.current_booking_id IS NULL AND cs.status = 'available' THEN 1 END) AS available_slots,
    'These counts should match Staff Dashboard' AS note
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
LEFT JOIN bookings b ON cs.current_booking_id = b.booking_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
WHERE cp.station_id = 1;

PRINT '';
PRINT '✅ DATA FIX COMPLETE!';
PRINT '';
GO
