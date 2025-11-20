-- ===================================================================
-- Script: Tạo dữ liệu đầy đủ cho Customer, Staff, Admin
-- Mục đích: Đảm bảo tất cả users có đủ thông tin để hiển thị trong UserDetail
-- ===================================================================

USE SkaEV_DB
GO

PRINT N'========================================';
PRINT N' TẠO DỮ LIỆU ĐẦY ĐỦ CHO USERS';
PRINT N'========================================';
GO

-- ============================================================
-- 1. TẠO DỮ LIỆU CHO CUSTOMER
-- ============================================================
PRINT N'';
PRINT N'--- TẠO DỮ LIỆU CHO CUSTOMER ---';
GO

DECLARE @customerId INT = (SELECT TOP 1 user_id FROM Users WHERE role = 'customer' ORDER BY user_id)

IF @customerId IS NOT NULL
BEGIN
    PRINT N'Customer ID: ' + CAST(@customerId AS NVARCHAR);
    
    -- Tạo UserProfile
    IF NOT EXISTS (SELECT 1 FROM UserProfiles WHERE user_id = @customerId)
    BEGIN
        INSERT INTO UserProfiles (user_id, date_of_birth, gender, avatar_url, created_at, updated_at)
        VALUES (@customerId, '1990-05-15', 'male', '/avatars/customer.png', GETDATE(), GETDATE())
        PRINT N'  ✓ Đã tạo UserProfile cho Customer';
    END
    ELSE
    BEGIN
        UPDATE UserProfiles 
        SET gender = 'male', date_of_birth = '1990-05-15'
        WHERE user_id = @customerId
        PRINT N'  ✓ Đã cập nhật UserProfile cho Customer';
    END
    
    -- Xóa phương tiện cũ
    DELETE FROM Vehicles WHERE user_id = @customerId
    
    -- Tạo 3 phương tiện mới
    INSERT INTO Vehicles (user_id, brand, model, license_plate, battery_capacity, connector_type, status, created_at, updated_at)
    VALUES 
        (@customerId, 'VinFast', 'VF 8', '30A-12345', 87.7, 'CCS2', 'active', GETDATE(), GETDATE()),
        (@customerId, 'Tesla', 'Model 3', '30B-67890', 75.0, 'CCS2', 'active', GETDATE(), GETDATE()),
        (@customerId, 'Hyundai', 'Kona Electric', '51C-11111', 64.0, 'Type 2', 'inactive', GETDATE(), GETDATE())
    
    PRINT N'  ✓ Đã tạo 3 phương tiện cho Customer';
    
    -- Tạo bookings
    DECLARE @stationId INT = (SELECT TOP 1 station_id FROM ChargingStations WHERE is_operational = 1 ORDER BY NEWID())
    DECLARE @postId INT = (SELECT TOP 1 post_id FROM ChargingPosts WHERE station_id = @stationId ORDER BY NEWID())
    DECLARE @vehicleId INT = (SELECT TOP 1 vehicle_id FROM Vehicles WHERE user_id = @customerId AND status = 'active')
    
    -- Xóa bookings cũ (giữ lại có invoice)
    DELETE FROM Bookings 
    WHERE user_id = @customerId 
    AND booking_id NOT IN (SELECT booking_id FROM Invoices WHERE user_id = @customerId)
    
    -- 5 bookings completed
    INSERT INTO Bookings (user_id, station_id, post_id, vehicle_id, start_time, end_time, status, total_kwh, total_cost, created_at)
    VALUES 
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(day, -90, GETDATE()), DATEADD(day, -90, DATEADD(hour, 2, GETDATE())), 'completed', 45.5, 227500, DATEADD(day, -90, GETDATE())),
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(day, -60, GETDATE()), DATEADD(day, -60, DATEADD(hour, 1.5, GETDATE())), 'completed', 38.2, 191000, DATEADD(day, -60, GETDATE())),
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(day, -45, GETDATE()), DATEADD(day, -45, DATEADD(hour, 3, GETDATE())), 'completed', 62.8, 314000, DATEADD(day, -45, GETDATE())),
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(day, -30, GETDATE()), DATEADD(day, -30, DATEADD(hour, 1, GETDATE())), 'completed', 25.3, 126500, DATEADD(day, -30, GETDATE())),
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(day, -15, GETDATE()), DATEADD(day, -15, DATEADD(hour, 2.5, GETDATE())), 'completed', 52.1, 260500, DATEADD(day, -15, GETDATE()))
    
    -- 2 bookings cancelled
    INSERT INTO Bookings (user_id, station_id, post_id, vehicle_id, start_time, status, created_at)
    VALUES 
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(day, -10, GETDATE()), 'cancelled', DATEADD(day, -10, GETDATE())),
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(day, -5, GETDATE()), 'cancelled', DATEADD(day, -5, GETDATE()))
    
    -- 2 bookings in_progress
    INSERT INTO Bookings (user_id, station_id, post_id, vehicle_id, start_time, status, created_at)
    VALUES 
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(hour, -1, GETDATE()), 'in_progress', DATEADD(hour, -1, GETDATE())),
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(hour, -0.5, GETDATE()), 'in_progress', DATEADD(hour, -0.5, GETDATE()))
    
    -- 1 booking scheduled
    INSERT INTO Bookings (user_id, station_id, post_id, vehicle_id, start_time, status, created_at)
    VALUES 
        (@customerId, @stationId, @postId, @vehicleId, DATEADD(day, 2, GETDATE()), 'scheduled', GETDATE())
    
    PRINT N'  ✓ Đã tạo 10 bookings cho Customer';
    
    -- Tạo invoices cho completed bookings
    INSERT INTO Invoices (booking_id, user_id, invoice_date, total_amount, payment_method, payment_status, created_at, updated_at)
    SELECT 
        b.booking_id,
        b.user_id,
        b.end_time,
        b.total_cost,
        CASE 
            WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 3 = 0 THEN 'credit_card'
            WHEN ROW_NUMBER() OVER (ORDER BY b.booking_id) % 3 = 1 THEN 'momo'
            ELSE 'zalopay'
        END,
        'paid',
        GETDATE(),
        GETDATE()
    FROM Bookings b
    WHERE b.user_id = @customerId 
    AND b.status = 'completed'
    AND NOT EXISTS (SELECT 1 FROM Invoices i WHERE i.booking_id = b.booking_id)
    
    PRINT N'  ✓ Đã tạo invoices cho bookings';
    PRINT N'✓ Hoàn thành tạo dữ liệu cho Customer';
END
GO

-- ============================================================
-- 2. TẠO DỮ LIỆU CHO STAFF
-- ============================================================
PRINT N'';
PRINT N'--- TẠO DỮ LIỆU CHO STAFF ---';
GO

DECLARE @staffId INT = (SELECT TOP 1 user_id FROM Users WHERE role = 'staff' ORDER BY user_id)

IF @staffId IS NOT NULL
BEGIN
    PRINT N'Staff ID: ' + CAST(@staffId AS NVARCHAR);
    
    -- Tạo UserProfile
    IF NOT EXISTS (SELECT 1 FROM UserProfiles WHERE user_id = @staffId)
    BEGIN
        INSERT INTO UserProfiles (user_id, date_of_birth, gender, avatar_url, created_at, updated_at)
        VALUES (@staffId, '1995-08-20', 'female', '/avatars/staff.png', GETDATE(), GETDATE())
        PRINT N'  ✓ Đã tạo UserProfile cho Staff';
    END
    ELSE
    BEGIN
        UPDATE UserProfiles 
        SET gender = 'female', date_of_birth = '1995-08-20'
        WHERE user_id = @staffId
        PRINT N'  ✓ Đã cập nhật UserProfile cho Staff';
    END
    
    -- Xóa assignments cũ
    DELETE FROM StationStaff WHERE staff_user_id = @staffId
    
    -- Gán vào 3 trạm
    DECLARE @station1 INT = (SELECT TOP 1 station_id FROM ChargingStations WHERE is_operational = 1 ORDER BY station_id)
    DECLARE @station2 INT = (SELECT TOP 1 station_id FROM ChargingStations WHERE is_operational = 1 AND station_id > @station1 ORDER BY station_id)
    DECLARE @station3 INT = (SELECT TOP 1 station_id FROM ChargingStations WHERE is_operational = 1 AND station_id > @station2 ORDER BY station_id)
    
    INSERT INTO StationStaff (station_id, staff_user_id, assigned_at, is_active)
    VALUES 
        (@station1, @staffId, DATEADD(day, -180, GETDATE()), 1),
        (@station2, @staffId, DATEADD(day, -90, GETDATE()), 1),
        (@station3, @staffId, DATEADD(day, -30, GETDATE()), 1)
    
    PRINT N'  ✓ Đã gán Staff vào 3 trạm sạc';
    
    -- Tạo maintenance records
    DECLARE @postId1 INT, @postId2 INT, @postId3 INT
    
    SELECT TOP 1 @postId1 = post_id FROM ChargingPosts ORDER BY NEWID()
    SELECT TOP 1 @postId2 = post_id FROM ChargingPosts WHERE post_id != @postId1 ORDER BY NEWID()
    SELECT TOP 1 @postId3 = post_id FROM ChargingPosts WHERE post_id NOT IN (@postId1, @postId2) ORDER BY NEWID()
    
    -- 10 completed maintenances
    INSERT INTO MaintenanceRecords (post_id, performed_by_user_id, maintenance_type, description, status, scheduled_at, completed_at, created_at, updated_at)
    VALUES 
        (@postId1, @staffId, 'routine_inspection', N'Kiểm tra định kỳ hàng tháng', 'completed', DATEADD(day, -90, GETDATE()), DATEADD(day, -90, DATEADD(hour, 2, GETDATE())), DATEADD(day, -90, GETDATE()), DATEADD(day, -90, DATEADD(hour, 2, GETDATE()))),
        (@postId2, @staffId, 'repair', N'Thay thế cáp sạc bị hỏng', 'completed', DATEADD(day, -80, GETDATE()), DATEADD(day, -80, DATEADD(hour, 4, GETDATE())), DATEADD(day, -80, GETDATE()), DATEADD(day, -80, DATEADD(hour, 4, GETDATE()))),
        (@postId3, @staffId, 'cleaning', N'Vệ sinh trạm sạc', 'completed', DATEADD(day, -70, GETDATE()), DATEADD(day, -70, DATEADD(hour, 1, GETDATE())), DATEADD(day, -70, GETDATE()), DATEADD(day, -70, DATEADD(hour, 1, GETDATE()))),
        (@postId1, @staffId, 'routine_inspection', N'Kiểm tra định kỳ', 'completed', DATEADD(day, -60, GETDATE()), DATEADD(day, -60, DATEADD(hour, 2, GETDATE())), DATEADD(day, -60, GETDATE()), DATEADD(day, -60, DATEADD(hour, 2, GETDATE()))),
        (@postId2, @staffId, 'upgrade', N'Cập nhật firmware', 'completed', DATEADD(day, -50, GETDATE()), DATEADD(day, -50, DATEADD(hour, 3, GETDATE())), DATEADD(day, -50, GETDATE()), DATEADD(day, -50, DATEADD(hour, 3, GETDATE()))),
        (@postId3, @staffId, 'repair', N'Sửa màn hình hiển thị', 'completed', DATEADD(day, -40, GETDATE()), DATEADD(day, -40, DATEADD(hour, 2, GETDATE())), DATEADD(day, -40, GETDATE()), DATEADD(day, -40, DATEADD(hour, 2, GETDATE()))),
        (@postId1, @staffId, 'cleaning', N'Vệ sinh trạm', 'completed', DATEADD(day, -30, GETDATE()), DATEADD(day, -30, DATEADD(hour, 1, GETDATE())), DATEADD(day, -30, GETDATE()), DATEADD(day, -30, DATEADD(hour, 1, GETDATE()))),
        (@postId2, @staffId, 'routine_inspection', N'Kiểm tra an toàn điện', 'completed', DATEADD(day, -20, GETDATE()), DATEADD(day, -20, DATEADD(hour, 2, GETDATE())), DATEADD(day, -20, GETDATE()), DATEADD(day, -20, DATEADD(hour, 2, GETDATE()))),
        (@postId3, @staffId, 'repair', N'Thay thế connector', 'completed', DATEADD(day, -10, GETDATE()), DATEADD(day, -10, DATEADD(hour, 3, GETDATE())), DATEADD(day, -10, GETDATE()), DATEADD(day, -10, DATEADD(hour, 3, GETDATE()))),
        (@postId1, @staffId, 'cleaning', N'Vệ sinh tổng thể', 'completed', DATEADD(day, -5, GETDATE()), DATEADD(day, -5, DATEADD(hour, 1.5, GETDATE())), DATEADD(day, -5, GETDATE()), DATEADD(day, -5, DATEADD(hour, 1.5, GETDATE())))
    
    -- 2 in_progress maintenances
    INSERT INTO MaintenanceRecords (post_id, performed_by_user_id, maintenance_type, description, status, scheduled_at, created_at, updated_at)
    VALUES 
        (@postId2, @staffId, 'upgrade', N'Nâng cấp hệ thống thanh toán', 'in_progress', DATEADD(hour, -2, GETDATE()), DATEADD(hour, -2, GETDATE()), GETDATE()),
        (@postId3, @staffId, 'routine_inspection', N'Kiểm tra định kỳ tháng này', 'in_progress', DATEADD(hour, -1, GETDATE()), DATEADD(hour, -1, GETDATE()), GETDATE())
    
    -- 3 scheduled maintenances
    INSERT INTO MaintenanceRecords (post_id, performed_by_user_id, maintenance_type, description, status, scheduled_at, created_at, updated_at)
    VALUES 
        (@postId1, @staffId, 'routine_inspection', N'Kiểm tra định kỳ tuần sau', 'scheduled', DATEADD(day, 7, GETDATE()), GETDATE(), GETDATE()),
        (@postId2, @staffId, 'cleaning', N'Vệ sinh định kỳ', 'scheduled', DATEADD(day, 14, GETDATE()), GETDATE(), GETDATE()),
        (@postId3, @staffId, 'upgrade', N'Nâng cấp phần mềm', 'scheduled', DATEADD(day, 21, GETDATE()), GETDATE(), GETDATE())
    
    PRINT N'  ✓ Đã tạo 15 maintenance records cho Staff';
    PRINT N'✓ Hoàn thành tạo dữ liệu cho Staff';
END
GO

-- ============================================================
-- 3. TẠO DỮ LIỆU CHO ADMIN
-- ============================================================
PRINT N'';
PRINT N'--- TẠO DỮ LIỆU CHO ADMIN ---';
GO

DECLARE @adminId INT = (SELECT TOP 1 user_id FROM Users WHERE role = 'admin' ORDER BY user_id)

IF @adminId IS NOT NULL
BEGIN
    PRINT N'Admin ID: ' + CAST(@adminId AS NVARCHAR);
    
    -- Tạo UserProfile
    IF NOT EXISTS (SELECT 1 FROM UserProfiles WHERE user_id = @adminId)
    BEGIN
        INSERT INTO UserProfiles (user_id, date_of_birth, gender, avatar_url, created_at, updated_at)
        VALUES (@adminId, '1985-03-10', 'male', '/avatars/admin.png', GETDATE(), GETDATE())
        PRINT N'  ✓ Đã tạo UserProfile cho Admin';
    END
    ELSE
    BEGIN
        UPDATE UserProfiles 
        SET gender = 'male', date_of_birth = '1985-03-10'
        WHERE user_id = @adminId
        PRINT N'  ✓ Đã cập nhật UserProfile cho Admin';
    END
    
    PRINT N'✓ Hoàn thành tạo dữ liệu cho Admin';
END
GO

-- ============================================================
-- 4. KIỂM TRA KẾT QUẢ
-- ============================================================
PRINT N'';
PRINT N'--- KIỂM TRA KẾT QUẢ ---';
GO

DECLARE @custId INT = (SELECT TOP 1 user_id FROM Users WHERE role = 'customer' ORDER BY user_id)
DECLARE @stfId INT = (SELECT TOP 1 user_id FROM Users WHERE role = 'staff' ORDER BY user_id)
DECLARE @admId INT = (SELECT TOP 1 user_id FROM Users WHERE role = 'admin' ORDER BY user_id)

IF @custId IS NOT NULL
BEGIN
    PRINT N'Customer (' + CAST(@custId AS NVARCHAR) + '):';
    SELECT 
        CAST((SELECT COUNT(*) FROM Vehicles WHERE user_id = @custId) AS NVARCHAR) + N' phương tiện',
        CAST((SELECT COUNT(*) FROM Bookings WHERE user_id = @custId) AS NVARCHAR) + N' bookings',
        CAST((SELECT COUNT(*) FROM Invoices WHERE user_id = @custId) AS NVARCHAR) + N' invoices',
        CAST((SELECT ISNULL(SUM(total_amount), 0) FROM Invoices WHERE user_id = @custId) AS NVARCHAR) + N' VND tổng chi'
END

IF @stfId IS NOT NULL
BEGIN
    PRINT N'Staff (' + CAST(@stfId AS NVARCHAR) + '):';
    SELECT 
        CAST((SELECT COUNT(*) FROM StationStaff WHERE staff_user_id = @stfId AND is_active = 1) AS NVARCHAR) + N' trạm',
        CAST((SELECT COUNT(*) FROM MaintenanceRecords WHERE performed_by_user_id = @stfId) AS NVARCHAR) + N' bảo trì',
        CAST((SELECT COUNT(*) FROM MaintenanceRecords WHERE performed_by_user_id = @stfId AND status = 'completed') AS NVARCHAR) + N' hoàn thành'
END

IF @admId IS NOT NULL
BEGIN
    PRINT N'Admin (' + CAST(@admId AS NVARCHAR) + ') - Tổng quan:';
    SELECT 
        CAST((SELECT COUNT(*) FROM Users) AS NVARCHAR) + N' người dùng',
        CAST((SELECT COUNT(*) FROM ChargingStations) AS NVARCHAR) + N' trạm sạc',
        CAST((SELECT COUNT(*) FROM Bookings) AS NVARCHAR) + N' bookings',
        CAST((SELECT ISNULL(SUM(total_amount), 0) FROM Invoices) AS NVARCHAR) + N' VND doanh thu'
END
GO

PRINT N'';
PRINT N'========================================';
PRINT N' HOÀN THÀNH 100% TẠO DỮ LIỆU';
PRINT N'========================================';
GO
