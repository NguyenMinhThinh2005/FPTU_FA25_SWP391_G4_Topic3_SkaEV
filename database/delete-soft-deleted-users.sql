-- Script to permanently delete all soft-deleted users and their related data
-- This will remove users where deleted_at IS NOT NULL

SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting permanent deletion of soft-deleted users...';
GO

BEGIN TRANSACTION;

-- Get list of user_ids to delete
DECLARE @DeletedUsers TABLE (user_id INT);
INSERT INTO @DeletedUsers (user_id)
SELECT user_id FROM users WHERE deleted_at IS NOT NULL;

DECLARE @UserCount INT = (SELECT COUNT(*) FROM @DeletedUsers);
PRINT 'Found ' + CAST(@UserCount AS VARCHAR) + ' soft-deleted users to permanently delete';

-- Step 1: Delete bookings related to vehicles owned by deleted users
DELETE FROM bookings
WHERE vehicle_id IN (
    SELECT vehicle_id FROM vehicles WHERE user_id IN (SELECT user_id FROM @DeletedUsers)
);
PRINT 'Deleted bookings for vehicles owned by soft-deleted users';

-- Step 2: Delete vehicles owned by deleted users
DELETE FROM vehicles
WHERE user_id IN (SELECT user_id FROM @DeletedUsers);
PRINT 'Deleted vehicles owned by soft-deleted users';

-- Step 3: Delete bookings made by deleted users
DELETE FROM bookings
WHERE user_id IN (SELECT user_id FROM @DeletedUsers);
PRINT 'Deleted bookings made by soft-deleted users';

-- Step 4: Delete payments
DELETE FROM payments
WHERE invoice_id IN (
    SELECT invoice_id FROM invoices WHERE user_id IN (SELECT user_id FROM @DeletedUsers)
);
PRINT 'Deleted payments';

-- Step 5: Delete invoices
DELETE FROM invoices
WHERE user_id IN (SELECT user_id FROM @DeletedUsers);
PRINT 'Deleted invoices';

-- Step 6: Delete reviews
DELETE FROM reviews
WHERE user_id IN (SELECT user_id FROM @DeletedUsers);
PRINT 'Deleted reviews';

-- Step 7: Delete notifications
DELETE FROM notifications
WHERE user_id IN (SELECT user_id FROM @DeletedUsers);
PRINT 'Deleted notifications';

-- Step 8: Delete user_profiles
DELETE FROM user_profiles 
WHERE user_id IN (SELECT user_id FROM @DeletedUsers);
PRINT 'Deleted user profiles';

-- Step 9: Finally delete users
DELETE FROM users 
WHERE user_id IN (SELECT user_id FROM @DeletedUsers);
PRINT 'Deleted users permanently';

COMMIT TRANSACTION;

PRINT 'Successfully deleted all soft-deleted users and their related data!';
GO

-- Show summary
SELECT COUNT(*) as 'Remaining Active Users' 
FROM users 
WHERE deleted_at IS NULL;

SELECT COUNT(*) as 'Soft-Deleted Users (should be 0)' 
FROM users 
WHERE deleted_at IS NOT NULL;

SELECT COUNT(*) as 'Total Users' 
FROM users;

GO
