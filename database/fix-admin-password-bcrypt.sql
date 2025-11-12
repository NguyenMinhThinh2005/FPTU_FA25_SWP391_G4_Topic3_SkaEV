-- Fix admin password với BCrypt hash đúng
-- Password: Admin@123
-- BCrypt hash: $2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq

USE SkaEV_DB;
GO

-- Update admin password
UPDATE users 
SET password_hash = '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq',
    updated_at = GETUTCDATE()
WHERE email = 'admin@skaev.com';

-- Verify
SELECT user_id, email, full_name, role, is_active,
       LEFT(password_hash, 30) + '...' as password_hash_preview
FROM users 
WHERE email = 'admin@skaev.com';

PRINT 'Admin password updated!';
PRINT 'Email: admin@skaev.com';
PRINT 'Password: Admin@123';
GO
