-- Seed sample staff-to-station assignments for SkaEV admin testing
USE SkaEV_DB;
GO

SET NOCOUNT ON;

-- Ensure demo charging stations exist
IF NOT EXISTS (SELECT 1 FROM dbo.charging_stations WHERE station_name = N'SkaEV Demo Station 1')
BEGIN
    INSERT INTO dbo.charging_stations (
        station_name,
        address,
        city,
        latitude,
        longitude,
        total_posts,
        available_posts,
        operating_hours,
        amenities,
        station_image_url,
        status,
        created_at,
        updated_at
    )
    VALUES (
        N'SkaEV Demo Station 1',
        N'01 Đường EV, Quận Hoàn Kiếm',
        N'Hà Nội',
        21.027763,
        105.834160,
        6,
        6,
        N'00:00-24:00',
        N'Parking,Restroom,Security',
        NULL,
        N'active',
        SYSDATETIME(),
        SYSDATETIME()
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.charging_stations WHERE station_name = N'SkaEV Demo Station 2')
BEGIN
    INSERT INTO dbo.charging_stations (
        station_name,
        address,
        city,
        latitude,
        longitude,
        total_posts,
        available_posts,
        operating_hours,
        amenities,
        station_image_url,
        status,
        created_at,
        updated_at
    )
    VALUES (
        N'SkaEV Demo Station 2',
        N'88 Xa Lộ EV, Thành phố Thủ Đức',
        N'TP. Hồ Chí Minh',
        10.792275,
        106.703781,
        8,
        7,
        N'06:00-22:00',
        N'Cafe,Parking,Maintenance',
        NULL,
        N'active',
        SYSDATETIME(),
        SYSDATETIME()
    );
END;

-- Ensure demo station 3 exists to cover central region scenarios
IF NOT EXISTS (SELECT 1 FROM dbo.charging_stations WHERE station_name = N'SkaEV Demo Station 3')
BEGIN
    INSERT INTO dbo.charging_stations (
        station_name,
        address,
        city,
        latitude,
        longitude,
        total_posts,
        available_posts,
        operating_hours,
        amenities,
        station_image_url,
        status,
        created_at,
        updated_at
    )
    VALUES (
        N'SkaEV Demo Station 3',
        N'15 Đại Lộ Năng Lượng, Quận Hải Châu',
        N'Đà Nẵng',
        16.047079,
        108.206230,
        10,
        10,
        N'00:00-24:00',
        N'Parking,WiFi,Restroom',
        NULL,
        N'active',
        SYSDATETIME(),
        SYSDATETIME()
    );
END;

-- Ensure demo staff users exist
IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'demo.staff1@skaev.com')
BEGIN
    INSERT INTO dbo.users (
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
        'demo.staff1@skaev.com',
        CONVERT(nvarchar(255), HASHBYTES('SHA2_256', 'Temp123!'), 1),
        N'Trần Minh Khoa',
        '0901234567',
        'staff',
        1,
        SYSDATETIME(),
        SYSDATETIME()
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'demo.staff2@skaev.com')
BEGIN
    INSERT INTO dbo.users (
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
        'demo.staff2@skaev.com',
        CONVERT(nvarchar(255), HASHBYTES('SHA2_256', 'Temp123!'), 1),
        N'Lê Quỳnh Anh',
        '0912345678',
        'staff',
        1,
        SYSDATETIME(),
        SYSDATETIME()
    );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = 'demo.staff3@skaev.com')
BEGIN
    INSERT INTO dbo.users (
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
        'demo.staff3@skaev.com',
        CONVERT(nvarchar(255), HASHBYTES('SHA2_256', 'Temp123!'), 1),
        N'Nguyễn Minh Hùng',
        '0923456789',
        'staff',
        1,
        SYSDATETIME(),
        SYSDATETIME()
    );
END;

DECLARE @TotalStations INT = (
    SELECT COUNT(*)
    FROM dbo.charging_stations
    WHERE deleted_at IS NULL
);

DECLARE @ActiveStaffCount INT = (
    SELECT COUNT(*)
    FROM dbo.users
    WHERE role = 'staff' AND is_active = 1 AND deleted_at IS NULL
);

DECLARE @ExistingStaffCount INT = (
    SELECT COUNT(*)
    FROM dbo.users
    WHERE role = 'staff' AND deleted_at IS NULL
);

IF @ActiveStaffCount < @TotalStations
BEGIN
    DECLARE @Needed INT = @TotalStations - @ActiveStaffCount;
    DECLARE @Counter INT = 1;

    WHILE @Counter <= @Needed
    BEGIN
        DECLARE @NewIndex INT = @ExistingStaffCount + @Counter;
        DECLARE @GeneratedEmail NVARCHAR(100) =
            CONCAT('auto.staff', RIGHT('0000' + CAST(@NewIndex AS NVARCHAR(4)), 4), '@skaev.com');

        IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = @GeneratedEmail)
        BEGIN
            INSERT INTO dbo.users (
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
                @GeneratedEmail,
                CONVERT(nvarchar(255), HASHBYTES('SHA2_256', 'Temp123!'), 1),
                N'Nhân viên tự động ' + CAST(@NewIndex AS NVARCHAR(10)),
                CONCAT('093', RIGHT('000000' + CAST(@NewIndex AS NVARCHAR(6)), 6)),
                'staff',
                1,
                SYSDATETIME(),
                SYSDATETIME()
            );
        END
        ELSE
        BEGIN
            UPDATE dbo.users
            SET is_active = 1,
                updated_at = SYSDATETIME()
            WHERE email = @GeneratedEmail;
        END

        SET @Counter += 1;
    END
END

DECLARE @StaffPool TABLE (
    RowNum INT,
    UserId INT
);

INSERT INTO @StaffPool (RowNum, UserId)
SELECT ROW_NUMBER() OVER (ORDER BY user_id) AS RowNum,
       user_id
FROM dbo.users
WHERE role = 'staff' AND is_active = 1 AND deleted_at IS NULL;

IF NOT EXISTS (SELECT 1 FROM @StaffPool)
BEGIN
    RAISERROR (N'Không có nhân viên nào khả dụng để phân công.', 16, 1);
    RETURN;
END;

DECLARE @StaffCount INT = (SELECT COUNT(*) FROM @StaffPool);

UPDATE dbo.station_staff
SET is_active = 0
WHERE is_active = 1;

DECLARE @Assignments TABLE (
    StationId INT,
    StaffUserId INT
);

WITH StationList AS (
    SELECT station_id,
           ROW_NUMBER() OVER (ORDER BY station_id) AS RowNum
    FROM dbo.charging_stations
    WHERE deleted_at IS NULL
)
INSERT INTO @Assignments (StationId, StaffUserId)
SELECT s.station_id,
       sp.UserId
FROM StationList s
CROSS APPLY (
    SELECT UserId
    FROM @StaffPool
    WHERE RowNum = ((s.RowNum - 1) % @StaffCount) + 1
) sp;

DELETE ss
FROM dbo.station_staff ss
JOIN @Assignments a ON ss.station_id = a.StationId AND ss.staff_user_id = a.StaffUserId;

INSERT INTO dbo.station_staff (staff_user_id, station_id, assigned_at, is_active)
SELECT StaffUserId, StationId, SYSDATETIME(), 1
FROM @Assignments;

UPDATE cs
SET manager_user_id = a.StaffUserId,
    updated_at = SYSDATETIME()
FROM dbo.charging_stations cs
JOIN @Assignments a ON cs.station_id = a.StationId;

DECLARE @AssignedCount INT = (SELECT COUNT(*) FROM @Assignments);
PRINT CONCAT(N'✅ Đã phân công ', CONVERT(NVARCHAR(10), @AssignedCount), N' trạm cho các nhân viên quản lý.');
