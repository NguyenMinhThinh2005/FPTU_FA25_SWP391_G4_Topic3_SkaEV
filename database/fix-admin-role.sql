-- Fix admin user role
USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Update admin@skaev.com to have admin role
UPDATE [dbo].[users]
SET role = 'admin'
WHERE email = 'admin@skaev.com';

-- Update admin@skaev.test (ID 29) to have admin role and hash password
-- Using the CORRECT BCrypt hash from admin@skaev.com (both use password: Admin123!)
UPDATE [dbo].[users]
SET role = 'admin',
    password_hash = '$2a$11$AO3OrjHmt6AkJpxu1.aJ8eBmaNlakaOEHsycBHrSstSUUAyXUThz.'
WHERE user_id = 29;

-- Verify the changes
SELECT 
    user_id,
    email,
    full_name,
    role,
    CASE 
        WHEN password_hash LIKE '$2a$%' THEN 'Hashed (BCrypt)'
        ELSE 'Plain Text'
    END AS password_status
FROM [dbo].[users]
WHERE email IN ('admin@skaev.com', 'admin@skaev.test')
ORDER BY user_id;

GO

PRINT 'Admin users have been fixed!';
PRINT 'admin@skaev.com: role = admin';
PRINT 'admin@skaev.test: role = admin, password hashed';
