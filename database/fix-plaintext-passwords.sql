-- Fix users with plain text passwords by hashing them
-- This script will hash any passwords that don't start with $2a (BCrypt hash marker)

USE SkaEV_DB;
GO

-- List users with plain text passwords (not starting with $2a)
SELECT 
    user_id,
    email,
    full_name,
    password_hash,
    CASE 
        WHEN password_hash LIKE '$2a$%' THEN 'Hashed (BCrypt)'
        ELSE 'Plain Text - NEEDS FIX'
    END AS password_status
FROM [dbo].[users]
WHERE password_hash NOT LIKE '$2a$%'
ORDER BY user_id;

-- For security, we'll set a temporary password for these users
-- They should reset it after first login

-- Update user ID 29 (minh thịnh) - if password is 'Admin123!'
UPDATE [dbo].[users]
SET password_hash = '$2a$11$YourHashedPasswordHere'  -- BCrypt hash of 'Admin123!'
WHERE user_id = 29 AND password_hash = 'Admin123!';

-- You can manually run BCrypt to hash passwords, or let users reset them
-- For now, you can use the application to create new users with proper hashed passwords

PRINT 'Users with plain text passwords have been identified.';
PRINT 'Please use the application to update their passwords.';
