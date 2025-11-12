-- Fix admin@skaev.test password hash
-- Using the same BCrypt hash as admin@skaev.com (both passwords: Admin123!)

USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Copy the correct hash from admin@skaev.com to admin@skaev.test
UPDATE [dbo].[users]
SET password_hash = (
    SELECT password_hash 
    FROM [dbo].[users] 
    WHERE email = 'admin@skaev.com'
)
WHERE user_id = 29;

GO

-- Verify both users now have the same hash
SELECT 
    user_id,
    email,
    role,
    password_hash,
    CASE 
        WHEN password_hash LIKE '$2a$11$AO3OrjHmt6AkJpxu1.aJ8eBmaNlakaOEHsycBHrSstSUUAyXUThz.' THEN 'CORRECT'
        ELSE 'INCORRECT'
    END AS hash_status
FROM [dbo].[users]
WHERE user_id IN (10, 29)
ORDER BY user_id;

GO

PRINT 'Password hash copied successfully!';
PRINT 'Both admin@skaev.com and admin@skaev.test now have password: Admin123!';
