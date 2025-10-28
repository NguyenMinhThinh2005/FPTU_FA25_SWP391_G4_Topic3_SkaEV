-- Activate demo users for testing
USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Activate all demo users
UPDATE [dbo].[users]
SET is_active = 1
WHERE email IN ('admin@skaev.com', 'admin@skaev.test', 'staff@skaev.com', 'nguyenvanan@gmail.com');

-- Verify
SELECT 
    user_id,
    email,
    role,
    password_hash,
    is_active
FROM [dbo].[users]
WHERE email IN ('admin@skaev.com', 'admin@skaev.test', 'staff@skaev.com', 'nguyenvanan@gmail.com')
ORDER BY user_id;

PRINT 'Demo users activated successfully!';
