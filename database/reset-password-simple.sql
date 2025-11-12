-- ============================================================
-- SCRIPT ĐƠN GIẢN: SET PASSWORD "Admin@123" CHO TÀI KHOẢN
-- ============================================================
-- Cách dùng: Thay 'YOUR_EMAIL@gmail.com' bằng email của bạn
-- ============================================================

USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Password hash cho "Admin@123" (BCrypt)
DECLARE @PasswordHash NVARCHAR(255) = '$2a$11$fTrbXLCzcyIjORlsiR4qDeaxYxv2j1AQLncLIlS9sqXBf5c.kX4oK';

-- ============================================================
-- HƯỚNG DẪN: Uncomment (bỏ --) dòng UPDATE tương ứng với email của bạn
-- ============================================================

-- Ví dụ: Nếu email của bạn là nguyenvanan@gmail.com, uncomment dòng bên dưới:
/*
UPDATE Users 
SET password_hash = @PasswordHash, updated_at = GETDATE()
WHERE email = 'nguyenvanan@gmail.com';
PRINT '✓ Updated password for: nguyenvanan@gmail.com';
*/

-- Hoặc thinh100816@gmail.com:
/*
UPDATE Users 
SET password_hash = @PasswordHash, updated_at = GETDATE()
WHERE email = 'thinh100816@gmail.com';
PRINT '✓ Updated password for: thinh100816@gmail.com';
*/

-- Hoặc quockhoatg202012@gmail.com:
/*
UPDATE Users 
SET password_hash = @PasswordHash, updated_at = GETDATE()
WHERE email = 'quockhoatg202012@gmail.com';
PRINT '✓ Updated password for: quockhoatg202012@gmail.com';
*/

-- ============================================================
-- HOẶC: Sửa trực tiếp email bên dưới
-- ============================================================

-- Bước 1: Thay 'YOUR_EMAIL_HERE' bằng email của bạn
DECLARE @YourEmail NVARCHAR(255) = 'YOUR_EMAIL_HERE';  -- <-- SỬA DÒNG NÀY

-- Bước 2: Chạy script này
IF @YourEmail = 'YOUR_EMAIL_HERE'
BEGIN
    PRINT '⚠ VUI LÒNG SỬA @YourEmail Ở TRÊN!';
    PRINT '';
    PRINT 'Ví dụ:';
    PRINT 'DECLARE @YourEmail NVARCHAR(255) = ''nguyenvanan@gmail.com'';';
    PRINT '';
    PRINT 'Hoặc uncomment một trong các dòng UPDATE ở trên.';
END
ELSE
BEGIN
    IF EXISTS (SELECT 1 FROM Users WHERE email = @YourEmail)
    BEGIN
        UPDATE Users 
        SET password_hash = @PasswordHash,
            updated_at = GETDATE()
        WHERE email = @YourEmail;
        
        PRINT '=================================================';
        PRINT '✓ ĐÃ CẬP NHẬT PASSWORD THÀNH CÔNG!';
        PRINT '=================================================';
        PRINT '';
        PRINT 'Email:    ' + @YourEmail;
        PRINT 'Password: Admin@123';
        PRINT '';
        PRINT 'Bạn có thể đăng nhập tại: http://localhost:5173';
        PRINT '=================================================';
        
        -- Hiển thị thông tin user
        SELECT 
            user_id as [ID],
            email as [Email],
            full_name as [Name],
            role as [Role],
            CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END as [Status]
        FROM Users
        WHERE email = @YourEmail;
    END
    ELSE
    BEGIN
        PRINT '✗ KHÔNG TÌM THẤY USER VỚI EMAIL: ' + @YourEmail;
        PRINT '';
        PRINT 'Danh sách email trong hệ thống:';
        SELECT email FROM Users WHERE deleted_at IS NULL ORDER BY user_id;
    END
END

GO
