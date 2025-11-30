-- Reset admin password to Admin@123
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

UPDATE users 
SET password_hash = '$2a$11$fTrbXLCzcyIjORlsiR4qDeaxYxv2j1AQLncLIlS9sqXBf5c.kX4oK',
    updated_at = GETDATE()
WHERE email = 'thinh@gmail.com';

SELECT 
    'Password updated successfully!' as [Status],
    email as [Email],
    role as [Role],
    'Admin@123' as [New Password]
FROM users
WHERE email = 'thinh@gmail.com';
