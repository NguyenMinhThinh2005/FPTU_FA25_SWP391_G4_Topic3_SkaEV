SET NOCOUNT ON;

DECLARE @email NVARCHAR(255) = N'skaev.admin.test@gmail.com';
DECLARE @passwordHash NVARCHAR(255) = N'$2a$12$cJSEqqZbTETiYQarxxLXieEJzaX3Q/ETJYmvVRgHpsrNkWnq1aTXK';
DECLARE @fullName NVARCHAR(255) = N'Project Admin';
DECLARE @phone NVARCHAR(20) = NULL;
DECLARE @role NVARCHAR(50) = N'admin';

IF EXISTS (SELECT 1 FROM users WHERE email = @email)
BEGIN
    UPDATE users
    SET password_hash = @passwordHash,
        full_name = @fullName,
        phone_number = @phone,
        role = @role,
        is_active = 1,
        updated_at = SYSUTCDATETIME(),
        deleted_at = NULL
    WHERE email = @email;
END
ELSE
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at, WalletBalance)
    VALUES (@email, @passwordHash, @fullName, @phone, @role, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0.00);
END

SELECT 'OK' AS Result, @email AS Email;
