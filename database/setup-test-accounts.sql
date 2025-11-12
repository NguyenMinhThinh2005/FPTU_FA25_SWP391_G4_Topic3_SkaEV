-- =================================================================
-- SCRIPT TẠO TÀI KHOẢN TEST CHO HỆ THỐNG SKAEV
-- Tất cả tài khoản sử dụng password: Admin@123
-- =================================================================

USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Password hash cho "Admin@123" (BCrypt)
-- Hash này được tạo từ backend với BCrypt.HashPassword("Admin@123")
DECLARE @PasswordHash NVARCHAR(255) = '$2a$11$fTrbXLCzcyIjORlsiR4qDeaxYxv2j1AQLncLIlS9sqXBf5c.kX4oK';

-- 1. UPDATE existing admin account (thinh@gmail.com) to use Admin@123
PRINT '=== Updating thinh@gmail.com password to Admin@123 ===';
UPDATE Users 
SET password_hash = @PasswordHash,
    updated_at = GETDATE()
WHERE email = 'thinh@gmail.com';

IF @@ROWCOUNT > 0
    PRINT '✓ Successfully updated thinh@gmail.com password';
ELSE
    PRINT '✗ Failed to update thinh@gmail.com';

-- 2. UPDATE test customer account
PRINT '';
PRINT '=== Updating test@skaev.com password to Admin@123 ===';
UPDATE Users 
SET password_hash = @PasswordHash,
    updated_at = GETDATE()
WHERE email = 'test@skaev.com';

IF @@ROWCOUNT > 0
    PRINT '✓ Successfully updated test@skaev.com password';
ELSE
    PRINT '✗ Failed to update test@skaev.com';

-- 3. CREATE Staff account if not exists
PRINT '';
PRINT '=== Creating staff@skaev.com account ===';
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'staff@skaev.com')
BEGIN
    INSERT INTO Users (
        email, 
        password_hash, 
        full_name, 
        phone_number, 
        role, 
        is_active, 
        created_at, 
        updated_at
    )
    VALUES (
        'staff@skaev.com',
        @PasswordHash,
        'Staff User',
        '0901234567',
        'staff',
        1,
        GETDATE(),
        GETDATE()
    );
    
    -- Create UserProfile for staff
    DECLARE @StaffUserId INT = SCOPE_IDENTITY();
    INSERT INTO user_profiles (user_id, created_at, updated_at)
    VALUES (@StaffUserId, GETDATE(), GETDATE());
    
    PRINT '✓ Successfully created staff@skaev.com';
END
ELSE
BEGIN
    -- Update existing staff account
    UPDATE Users 
    SET password_hash = @PasswordHash,
        updated_at = GETDATE()
    WHERE email = 'staff@skaev.com';
    PRINT '✓ Updated existing staff@skaev.com password';
END

-- 4. CREATE additional customer account for testing
PRINT '';
PRINT '=== Creating customer@skaev.com account ===';
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'customer@skaev.com')
BEGIN
    INSERT INTO Users (
        email, 
        password_hash, 
        full_name, 
        phone_number, 
        role, 
        is_active, 
        created_at, 
        updated_at
    )
    VALUES (
        'customer@skaev.com',
        @PasswordHash,
        'Customer Test',
        '0912345678',
        'customer',
        1,
        GETDATE(),
        GETDATE()
    );
    
    -- Create UserProfile for customer
    DECLARE @CustomerUserId INT = SCOPE_IDENTITY();
    INSERT INTO user_profiles (user_id, created_at, updated_at)
    VALUES (@CustomerUserId, GETDATE(), GETDATE());
    
    PRINT '✓ Successfully created customer@skaev.com';
END
ELSE
BEGIN
    -- Update existing customer account
    UPDATE Users 
    SET password_hash = @PasswordHash,
        updated_at = GETDATE()
    WHERE email = 'customer@skaev.com';
    PRINT '✓ Updated existing customer@skaev.com password';
END

-- 5. Display all test accounts
PRINT '';
PRINT '=================================================================';
PRINT 'TÀI KHOẢN TEST - TẤT CẢ DÙNG PASSWORD: Admin@123';
PRINT '=================================================================';
PRINT '';

SELECT 
    user_id AS [ID],
    email AS [Email],
    full_name AS [Full Name],
    role AS [Role],
    CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END AS [Status]
FROM Users
WHERE email IN (
    'admin2@skaev.com',
    'thinh@gmail.com',
    'staff@skaev.com',
    'customer@skaev.com',
    'test@skaev.com'
)
ORDER BY role, email;

PRINT '';
PRINT '=================================================================';
PRINT 'DANH SÁCH TÀI KHOẢN TEST';
PRINT '=================================================================';
PRINT '';
PRINT '1. ADMIN ACCOUNTS:';
PRINT '   - admin2@skaev.com / Admin@123';
PRINT '   - thinh@gmail.com / Admin@123 (đã update)';
PRINT '';
PRINT '2. STAFF ACCOUNT:';
PRINT '   - staff@skaev.com / Admin@123';
PRINT '';
PRINT '3. CUSTOMER ACCOUNTS:';
PRINT '   - customer@skaev.com / Admin@123';
PRINT '   - test@skaev.com / Admin@123 (đã update)';
PRINT '';
PRINT '=================================================================';
PRINT 'LƯU Ý: Tất cả tài khoản đều sử dụng password: Admin@123';
PRINT '=================================================================';

GO
