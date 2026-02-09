-- ========================================================
-- FIX: sp_start_charging - Add current_booking_id update
-- ========================================================
-- Issue: Staff Dashboard không hiển thị active sessions
-- Cause: Stored procedure không update charging_slots.current_booking_id
-- Fix: Thêm update current_booking_id khi start charging
-- Date: 2025-11-12
-- ========================================================

USE [SkaEV_DB]
GO

-- Drop existing procedure
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_start_charging')
BEGIN
    DROP PROCEDURE [dbo].[sp_start_charging];
    PRINT 'Dropped existing sp_start_charging';
END
GO

-- Create updated procedure
CREATE PROCEDURE [dbo].[sp_start_charging]
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
        
        -- Update slot status AND link booking (CRITICAL FIX)
        UPDATE charging_slots
        SET status = 'occupied',
            current_booking_id = @booking_id,  -- ← FIX: Link booking to slot for Staff Dashboard
            updated_at = GETDATE()
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

PRINT '✅ Successfully updated sp_start_charging with current_booking_id';
GO

-- Verify the update
SELECT 
    OBJECT_NAME(object_id) AS ProcedureName,
    create_date AS CreatedDate,
    modify_date AS LastModified
FROM sys.procedures
WHERE name = 'sp_start_charging';
GO

-- ========================================================
-- TESTING INSTRUCTIONS:
-- ========================================================
-- 1. Run this script in SQL Server Management Studio
-- 2. Verify output shows "Successfully updated"
-- 3. Test by creating new booking as customer:
--    - Customer creates booking
--    - Customer starts charging
--    - Check: SELECT * FROM charging_slots WHERE current_booking_id IS NOT NULL;
--    - Staff Dashboard should now show active session
-- ========================================================
