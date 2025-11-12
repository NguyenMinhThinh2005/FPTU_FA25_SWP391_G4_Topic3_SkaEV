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

-- Ensure there is at least one unassigned station for UI validation
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

DECLARE @Station1Id INT = (SELECT station_id FROM dbo.charging_stations WHERE station_name = N'SkaEV Demo Station 1');
DECLARE @Station2Id INT = (SELECT station_id FROM dbo.charging_stations WHERE station_name = N'SkaEV Demo Station 2');

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

DECLARE @Staff1Id INT = (SELECT user_id FROM dbo.users WHERE email = 'demo.staff1@skaev.com');
DECLARE @Staff2Id INT = (SELECT user_id FROM dbo.users WHERE email = 'demo.staff2@skaev.com');

-- Helper: deactivate existing active assignments for the given station or staff
IF @Staff1Id IS NOT NULL
BEGIN
    UPDATE dbo.station_staff
    SET is_active = 0
    WHERE staff_user_id = @Staff1Id AND is_active = 1;
END;

IF @Staff2Id IS NOT NULL
BEGIN
    UPDATE dbo.station_staff
    SET is_active = 0
    WHERE staff_user_id = @Staff2Id AND is_active = 1;
END;

IF @Station1Id IS NOT NULL
BEGIN
    UPDATE dbo.station_staff
    SET is_active = 0
    WHERE station_id = @Station1Id AND is_active = 1;
END;

IF @Station2Id IS NOT NULL
BEGIN
    UPDATE dbo.station_staff
    SET is_active = 0
    WHERE station_id = @Station2Id AND is_active = 1;
END;

-- Assign staff to stations (one station per staff)
IF @Staff1Id IS NOT NULL AND @Station1Id IS NOT NULL
BEGIN
    INSERT INTO dbo.station_staff (staff_user_id, station_id, assigned_at, is_active)
    VALUES (@Staff1Id, @Station1Id, SYSDATETIME(), 1);
END;

IF @Staff2Id IS NOT NULL AND @Station2Id IS NOT NULL
BEGIN
    INSERT INTO dbo.station_staff (staff_user_id, station_id, assigned_at, is_active)
    VALUES (@Staff2Id, @Station2Id, SYSDATETIME(), 1);
END;

PRINT 'Demo station manager data ensured successfully.';
