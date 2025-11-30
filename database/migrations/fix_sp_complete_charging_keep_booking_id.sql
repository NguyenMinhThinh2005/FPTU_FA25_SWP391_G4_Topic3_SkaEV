-- ========================================================
-- FIX: sp_complete_charging - Keep current_booking_id until payment completed
-- ========================================================
-- ISSUE: Staff Dashboard cannot see completed sessions awaiting payment
--        because sp_complete_charging sets current_booking_id = NULL immediately
-- 
-- SOLUTION: Keep current_booking_id when status = 'completed'
--           Only clear it when payment is processed (in application code)
-- ========================================================

USE [SkaEV_DB]
GO

-- Drop old procedure
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_complete_charging')
BEGIN
    DROP PROCEDURE [dbo].[sp_complete_charging];
    PRINT '✅ Old sp_complete_charging dropped';
END
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_complete_charging]
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
            actual_end_time = GETDATE(),
            updated_at = GETDATE()
        WHERE booking_id = @booking_id;
        
        -- Create invoice
        INSERT INTO invoices (
            booking_id, user_id, total_energy_kwh, unit_price,
            subtotal, tax_amount, total_amount, payment_status, created_at
        )
        VALUES (
            @booking_id, @user_id, @total_energy_kwh, @unit_price,
            @subtotal, @tax_amount, @total_amount, 'pending', GETDATE()
        );
        
        -- 🔧 FIX: Update slot status to 'occupied' (still occupied until payment)
        -- Keep current_booking_id so Staff can see session awaiting payment!
        UPDATE charging_slots
        SET status = 'occupied',  -- Changed from 'available'
            -- current_booking_id stays the same (NOT NULL)
            updated_at = GETDATE()
        WHERE slot_id = @slot_id;
        
        COMMIT TRANSACTION;
        
        PRINT 'Charging completed successfully for booking #' + CAST(@booking_id AS VARCHAR);
        PRINT 'Slot remains occupied until payment processed';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        PRINT 'Error: ' + @ErrorMessage;
        THROW;
    END CATCH
END;
GO

PRINT '';
PRINT '========================================';
PRINT '✅ sp_complete_charging updated successfully';
PRINT '========================================';
PRINT 'Changes:';
PRINT '1. Slot status stays "occupied" after charging complete';
PRINT '2. current_booking_id is KEPT (not set to NULL)';
PRINT '3. Staff can now see sessions awaiting payment';
PRINT '4. Slot will be freed when payment is processed';
PRINT '';
GO

-- Verify the update
SELECT 
    OBJECT_NAME(object_id) AS ProcedureName,
    modify_date AS LastModified,
    CASE 
        WHEN modify_date >= DATEADD(MINUTE, -5, GETDATE()) THEN '✅ Just Updated'
        ELSE 'Updated Earlier'
    END AS Status
FROM sys.procedures
WHERE name = 'sp_complete_charging';
GO

PRINT '';
PRINT '========================================';
PRINT 'NEXT STEP: Update Payment Processing';
PRINT '========================================';
PRINT 'When payment is processed, application code should:';
PRINT '1. Update invoice payment_status = ''paid''';
PRINT '2. Update charging_slots:';
PRINT '   - SET status = ''available''';
PRINT '   - SET current_booking_id = NULL';
PRINT '3. Update station/post availability counts';
PRINT '';
GO
