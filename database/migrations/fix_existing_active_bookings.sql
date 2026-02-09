-- ========================================================
-- DATA FIX: Update existing active bookings
-- ========================================================
-- Purpose: Fix existing active sessions that don't have current_booking_id set
-- This happens when bookings were started before the sp_start_charging fix
-- ========================================================

USE [SkaEV_DB]
GO

PRINT '🔍 Checking for active bookings without current_booking_id...';
GO

-- Find active bookings that should be linked to slots
SELECT 
    b.booking_id,
    b.slot_id,
    b.status,
    b.actual_start_time,
    cs.current_booking_id AS slot_current_booking,
    cs.status AS slot_status
FROM bookings b
LEFT JOIN charging_slots cs ON b.slot_id = cs.slot_id
WHERE b.status = 'in_progress'
  AND cs.current_booking_id IS NULL;
GO

-- Fix the data
UPDATE cs
SET cs.current_booking_id = b.booking_id,
    cs.status = 'occupied',
    cs.updated_at = GETDATE()
FROM charging_slots cs
INNER JOIN bookings b ON cs.slot_id = b.slot_id
WHERE b.status = 'in_progress'
  AND cs.current_booking_id IS NULL;

PRINT '✅ Updated charging_slots.current_booking_id for active bookings';
GO

-- Verify the fix
SELECT 
    b.booking_id,
    b.slot_id,
    b.status AS booking_status,
    b.actual_start_time,
    u.full_name AS customer_name,
    cs.current_booking_id,
    cs.status AS slot_status,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector_code
FROM bookings b
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
INNER JOIN users u ON b.user_id = u.user_id
WHERE b.status = 'in_progress';
GO

PRINT '📊 Active sessions after fix:';
GO
