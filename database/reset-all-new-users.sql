-- Reset password cho tất cả users mới về Temp123!
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @PasswordHash NVARCHAR(60) = '$2a$11$d94JmsPdfKXayUgwQbK2keJFMzHa9x.y8tr1h1Tcp22rKAYX4LLf6';

UPDATE users 
SET password_hash = @PasswordHash,
    updated_at = GETUTCDATE()
WHERE email IN (
    'admin@new.com', 
    'staff@new.com', 
    'customer.new@skaev.com', 
    'staff.new@skaev.com', 
    'admin.new@skaev.com'
);

PRINT '✓ Password đã được reset cho ' + CAST(@@ROWCOUNT AS VARCHAR) + ' users';
PRINT '';
PRINT '==========================================';
PRINT '     DANH SÁCH TÀI KHOẢN ĐÃ RESET';
PRINT '==========================================';

SELECT 
    email as 'Email',
    'Temp123!' as 'Password',
    role as 'Role',
    full_name as 'Tên'
FROM users 
WHERE email IN (
    'admin@new.com', 
    'staff@new.com', 
    'customer.new@skaev.com', 
    'staff.new@skaev.com', 
    'admin.new@skaev.com'
)
ORDER BY role, email;

PRINT '';
PRINT 'LƯU Ý: Tất cả accounts trên đều có password: Temp123!';
PRINT '';

GO
