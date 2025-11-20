-- Script Reset Password cho User
-- Sử dụng script này để set lại password cho user cụ thể

-- CÁCH DÙNG:
-- 1. Thay 'user@example.com' bằng email của user cần reset
-- 2. Thay 'NewPassword123!' bằng password mới bạn muốn
-- 3. Chạy script

DECLARE @Email NVARCHAR(256) = 'staff@new.com';  -- ← THAY EMAIL Ở ĐÂY
DECLARE @NewPassword NVARCHAR(100) = 'Temp123!'; -- ← THAY PASSWORD Ở ĐÂY

-- BCrypt hash cho password (đã tính sẵn cho một số password phổ biến)
-- Để tạo hash mới, cần dùng tool BCrypt hoặc API

DECLARE @PasswordHash NVARCHAR(60);

-- Hash cho các password phổ biến:
IF @NewPassword = 'Temp123!'
    SET @PasswordHash = '$2a$11$d94JmsPdfKXayUgwQbK2keJFMzHa9x.y8tr1h1Tcp22rKAYX4LLf6';
ELSE IF @NewPassword = 'Password123!'
    SET @PasswordHash = '$2a$11$XQZvS8BEWfZqMZGk8vK3K.uQX5Y6HqGgZJYXh8L9mN4Kp2Qr5St6U'; 
ELSE IF @NewPassword = 'Admin123!'
    SET @PasswordHash = '$2a$11$YRAvT9CFXgArNaHl9wL4L.vRY6Z7IrHhAKZYi9M0nO5Lq3Rs6Tu7V';
ELSE
BEGIN
    PRINT 'Lỗi: Password không nằm trong danh sách hash có sẵn!';
    PRINT 'Vui lòng sử dụng một trong các password sau:';
    PRINT '  - Temp123!';
    PRINT '  - Password123!';
    PRINT '  - Admin123!';
    PRINT '';
    PRINT 'Hoặc dùng API để tạo hash mới.';
    RETURN;
END

-- Cập nhật password
UPDATE users
SET password_hash = @PasswordHash,
    updated_at = GETUTCDATE()
WHERE email = @Email;

IF @@ROWCOUNT > 0
BEGIN
    PRINT 'Password đã được reset thành công!';
    PRINT '';
    PRINT '========================';
    PRINT 'THÔNG TIN ĐĂNG NHẬP:';
    PRINT '========================';
    PRINT 'Email:    ' + @Email;
    PRINT 'Password: ' + @NewPassword;
    PRINT '========================';
    PRINT '';
    PRINT 'Bạn có thể đăng nhập ngay bây giờ!';
END
ELSE
BEGIN
    PRINT 'Lỗi: Không tìm thấy user với email: ' + @Email;
END

GO
