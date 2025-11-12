-- Update sp_start_charging with proper settings
USE [SkaEV_DB]
GO

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_start_charging')
BEGIN
    DROP PROCEDURE [dbo].[sp_start_charging];
    PRINT 'Old procedure dropped';
END
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_start_charging]
    @booking_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @slot_id INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Get the slot_id from the booking
        SELECT @slot_id = slot_id 
        FROM bookings 
        WHERE booking_id = @booking_id;
        
        -- Update booking status and actual start time
        UPDATE bookings
        SET status = 'in_progress',
            actual_start_time = GETDATE(),
            updated_at = GETDATE()
        WHERE booking_id = @booking_id;
        
        -- Update charging slot status and CRITICAL: link to booking
        UPDATE charging_slots
        SET status = 'occupied',
            current_booking_id = @booking_id,
            updated_at = GETDATE()
        WHERE slot_id = @slot_id;
        
        COMMIT TRANSACTION;
        
        PRINT 'Charging started successfully for booking #' + CAST(@booking_id AS VARCHAR);
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

PRINT 'sp_start_charging recreated with proper settings';
GO
