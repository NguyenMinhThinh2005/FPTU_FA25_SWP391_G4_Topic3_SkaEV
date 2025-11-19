-- 01_users.sql
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO
PRINT 'Step 1/7: Creating 60 new users...';
GO
-- We'll let the DB assign user_id to avoid conflicts; track created count
DECLARE @UserCounter INT = 0;

-- (FirstNames, LastNames, Cities tables and the loops to insert customers, staff, admins)
DECLARE @FirstNames TABLE (Name NVARCHAR(50));
INSERT INTO @FirstNames VALUES 
(N'Minh'), (N'Hương'), (N'Tuấn'), (N'Linh'), (N'Đức'), (N'Hoa'), (N'Long'), (N'Mai'), 
(N'Khoa'), (N'Thảo'), (N'Phong'), (N'Lan'), (N'Tâm'), (N'Thu'), (N'Hải'), (N'Nga'),
(N'Quân'), (N'Trang'), (N'Nam'), (N'Huyền'), (N'Việt'), (N'Anh'), (N'Bảo'), (N'Chi'),
(N'Cường'), (N'Dung'), (N'Giang'), (N'Hùng'), (N'Khánh'), (N'Ly'), (N'Nhung'), (N'Phương'),
(N'Sơn'), (N'Thư'), (N'Trung'), (N'Vy'), (N'Yến'), (N'Đạt'), (N'Hiếu'), (N'Kỳ');

DECLARE @LastNames TABLE (Name NVARCHAR(50));
INSERT INTO @LastNames VALUES 
(N'Nguyễn'), (N'Trần'), (N'Lê'), (N'Phạm'), (N'Hoàng'), (N'Huỳnh'), (N'Phan'), (N'Vũ'), 
(N'Võ'), (N'Đặng'), (N'Bùi'), (N'Đỗ'), (N'Hồ'), (N'Ngô'), (N'Dương'), (N'Lý');

DECLARE @Cities TABLE (City NVARCHAR(100), District NVARCHAR(100));
INSERT INTO @Cities VALUES 
(N'Hồ Chí Minh', N'Quận 1'), (N'Hồ Chí Minh', N'Quận 3'), (N'Hồ Chí Minh', N'Quận 7'),
(N'Hồ Chí Minh', N'Bình Thạnh'), (N'Hồ Chí Minh', N'Thủ Đức'), (N'Hà Nội', N'Ba Đình'),
(N'Hà Nội', N'Hoàn Kiếm'), (N'Hà Nội', N'Cầu Giấy'), (N'Đà Nẵng', N'Hải Châu'),
(N'Đà Nẵng', N'Sơn Trà'), (N'Cần Thơ', N'Ninh Kiều'), (N'Hải Phòng', N'Ngô Quyền');

DECLARE @i INT = 1;
WHILE @i <= 50
BEGIN
    DECLARE @FirstName NVARCHAR(50) = (SELECT TOP 1 Name FROM @FirstNames ORDER BY NEWID());
    DECLARE @LastName NVARCHAR(50) = (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID());
    DECLARE @FullName NVARCHAR(255) = @LastName + N' ' + @FirstName;
    DECLARE @Email NVARCHAR(255) = LOWER(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@FirstName, N'ă', 'a'), N'â', 'a'), N'đ', 'd'), N'ê', 'e'), N'ô', 'o')
        + REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@LastName, N'ă', 'a'), N'â', 'a'), N'đ', 'd'), N'ê', 'e'), N'ô', 'o')
        + CAST(@i AS VARCHAR) + '@gmail.com'
    );
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ư', 'u'), N'ơ', 'o'), N'á', 'a'), N'à', 'a'), N'ả', 'a'), N'ã', 'a');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ạ', 'a'), N'é', 'e'), N'è', 'e'), N'ẻ', 'e'), N'ẽ', 'e'), N'ẹ', 'e');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'í', 'i'), N'ì', 'i'), N'ỉ', 'i'), N'ĩ', 'i'), N'ị', 'i'), N'ó', 'o');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ò', 'o'), N'ỏ', 'o'), N'õ', 'o'), N'ọ', 'o'), N'ú', 'u'), N'ù', 'u');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ủ', 'u'), N'ũ', 'u'), N'ụ', 'u'), N'ý', 'y');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ỳ', 'y'), N'ỷ', 'y'), N'ỹ', 'y'), N'ỵ', 'y');

    DECLARE @Phone NVARCHAR(20) = '09' + RIGHT('00000000' + CAST(ABS(CHECKSUM(NEWID())) % 100000000 AS VARCHAR), 8);
    DECLARE @Password NVARCHAR(255) = '$2a$11$xvryBCoJK.zEWdP6dYlxQ.6ZpPPmw7gF3vXVVVqJYYIZmL2A/M8.K';
    DECLARE @CreatedDate DATETIME2 = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 180, GETDATE());

    IF NOT EXISTS (SELECT 1 FROM users WHERE email = @Email)
    BEGIN
        INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
        VALUES (@Email, @Password, @FullName, @Phone, 'customer', 1, @CreatedDate, @CreatedDate);
        DECLARE @InsertedUserId INT = SCOPE_IDENTITY();
        DECLARE @City NVARCHAR(100), @District NVARCHAR(100);
        SELECT TOP 1 @City = City, @District = District FROM @Cities ORDER BY NEWID();
        DECLARE @Address NVARCHAR(500) = CAST((ABS(CHECKSUM(NEWID())) % 500 + 1) AS NVARCHAR) + N' ' + @District + N', ' + @City;
        DECLARE @DOB DATE = DATEADD(YEAR, -(25 + ABS(CHECKSUM(NEWID())) % 30), GETDATE());
        INSERT INTO user_profiles (user_id, date_of_birth, address, city, preferred_payment_method, created_at, updated_at)
        VALUES (@InsertedUserId, @DOB, @Address, @City, 
                CASE (ABS(CHECKSUM(NEWID())) % 3) WHEN 0 THEN 'momo' WHEN 1 THEN 'vnpay' ELSE 'zalopay' END,
                @CreatedDate, @CreatedDate);
        SET @UserCounter = @UserCounter + 1;
    END

    SET @i = @i + 1;
END

-- Staff users (8)
SET @i = 1;
WHILE @i <= 8
BEGIN
    DECLARE @StaffFirstName NVARCHAR(50) = (SELECT TOP 1 Name FROM @FirstNames ORDER BY NEWID());
    DECLARE @StaffLastName NVARCHAR(50) = (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID());
    DECLARE @StaffFullName NVARCHAR(255) = @StaffLastName + N' ' + @StaffFirstName;
    DECLARE @StaffEmail NVARCHAR(255) = 'staff' + CAST(@i AS VARCHAR) + '@skaev.com';
    DECLARE @StaffPhone NVARCHAR(20) = '08' + RIGHT('00000000' + CAST(ABS(CHECKSUM(NEWID())) % 100000000 AS VARCHAR), 8);
    DECLARE @StaffCreated DATETIME2 = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 365, GETDATE());
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = @StaffEmail)
    BEGIN
        INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
        VALUES (@StaffEmail, @Password, @StaffFullName, @StaffPhone, 'staff', 1, @StaffCreated, @StaffCreated);
        SET @UserCounter = @UserCounter + 1;
    END
    SET @i = @i + 1;
END

-- Admin users (2)
SET @i = 1;
WHILE @i <= 2
BEGIN
    DECLARE @AdminFirstName NVARCHAR(50) = (SELECT TOP 1 Name FROM @FirstNames ORDER BY NEWID());
    DECLARE @AdminLastName NVARCHAR(50) = (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID());
    DECLARE @AdminFullName NVARCHAR(255) = @AdminLastName + N' ' + @AdminFirstName;
    DECLARE @AdminEmail NVARCHAR(255) = 'admin' + CAST(@i + 1 AS VARCHAR) + '@skaev.com';
    DECLARE @AdminPhone NVARCHAR(20) = '07' + RIGHT('00000000' + CAST(ABS(CHECKSUM(NEWID())) % 100000000 AS VARCHAR), 8);
    DECLARE @AdminCreated DATETIME2 = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 365, GETDATE());
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = @AdminEmail)
    BEGIN
        INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
        VALUES (@AdminEmail, @Password, @AdminFullName, @AdminPhone, 'admin', 1, @AdminCreated, @AdminCreated);
        SET @UserCounter = @UserCounter + 1;
    END
    SET @i = @i + 1;
END

PRINT 'Created ' + CAST(@UserCounter AS VARCHAR) + ' new users inserted by this run (duplicates skipped)';
GO
GO
