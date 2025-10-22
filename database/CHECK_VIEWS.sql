-- Check if all views are working
USE SkaEV_DB;

PRINT 'Checking views...';

-- Test each view
BEGIN TRY
    SELECT TOP 1 * FROM dbo.vw_active_bookings;
    PRINT '✓ vw_active_bookings OK';
END TRY
BEGIN CATCH
    PRINT '✗ vw_active_bookings ERROR: ' + ERROR_MESSAGE();
END CATCH

BEGIN TRY
    SELECT TOP 1 * FROM dbo.vw_user_booking_history;
    PRINT '✓ vw_user_booking_history OK';
END TRY
BEGIN CATCH
    PRINT '✗ vw_user_booking_history ERROR: ' + ERROR_MESSAGE();
END CATCH

BEGIN TRY
    SELECT TOP 1 * FROM dbo.vw_station_availability;
    PRINT '✓ vw_station_availability OK';
END TRY
BEGIN CATCH
    PRINT '✗ vw_station_availability ERROR: ' + ERROR_MESSAGE();
END CATCH

BEGIN TRY
    SELECT TOP 1 * FROM dbo.vw_payment_summaries;
    PRINT '✓ vw_payment_summaries OK';
END TRY
BEGIN CATCH
    PRINT '✗ vw_payment_summaries ERROR: ' + ERROR_MESSAGE();
END CATCH

BEGIN TRY
    SELECT TOP 1 * FROM dbo.vw_charging_session_details;
    PRINT '✓ vw_charging_session_details OK';
END TRY
BEGIN CATCH
    PRINT '✗ vw_charging_session_details ERROR: ' + ERROR_MESSAGE();
END CATCH

PRINT 'View check completed.';
