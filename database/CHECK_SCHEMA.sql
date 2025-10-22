-- Check all columns that backend expects
USE SkaEV_DB;

PRINT '=== CHECKING DATABASE SCHEMA ==='

-- Check users table
SELECT 'users.deleted_at' AS Column_Check, 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'deleted_at') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END AS Status

UNION ALL SELECT 'bookings.deleted_at', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'deleted_at') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END

UNION ALL SELECT 'bookings.created_by', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'created_by') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END

UNION ALL SELECT 'bookings.updated_by', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'updated_by') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END

UNION ALL SELECT 'vehicles.deleted_at', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.vehicles') AND name = 'deleted_at') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END

UNION ALL SELECT 'charging_stations.deleted_at', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.charging_stations') AND name = 'deleted_at') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END

UNION ALL SELECT 'payment_methods.deleted_at', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payment_methods') AND name = 'deleted_at') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END

-- Check payments table
UNION ALL SELECT 'payments.processed_by_staff_id', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'processed_by_staff_id') 
    THEN '✓ EXISTS' ELSE '✗ MISSING (check if still named staff_id)' END

UNION ALL SELECT 'payments.processed_at', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'processed_at') 
    THEN '✓ EXISTS' ELSE '✗ MISSING (check if still named payment_date)' END

UNION ALL SELECT 'payments.refund_date', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'refund_date') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END

UNION ALL SELECT 'payments.notes', 
    CASE WHEN EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'notes') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END;
