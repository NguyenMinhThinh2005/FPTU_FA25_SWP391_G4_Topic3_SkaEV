-- ====================================================================
-- SKAEV COMPLETE DEMO DATA SEEDING SCRIPT
-- ====================================================================
-- Purpose: Generate comprehensive realistic demo data for Admin Dashboard
-- Author: GitHub Copilot
-- Date: 2025-11-05
-- 
-- This script will create:
-- - 60 new users (50 customers, 8 staff, 2 admins)
-- - 40 new vehicles (diverse brands and models)
-- - 400 new bookings (June-Nov 2025, distributed across all 30 stations)
-- - 400 new invoices (corresponding to bookings)
-- - 100 new reviews (for completed bookings)
-- - 35 new support requests (varied statuses and priorities)
-- ====================================================================

SET NOCOUNT ON;
GO

PRINT '========================================';
PRINT 'Starting SkaEV Demo Data Seeding...';
PRINT 'Time: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
GO

-- ====================================================================
-- SECTION 1: SEED USERS (60 new users: 50 customers, 8 staff, 2 admins)
-- ====================================================================
PRINT '';
PRINT 'Step 1/7: Creating 60 new users...';
GO

DECLARE @StartUserId INT = 15; -- Current max is 14
DECLARE @UserCounter INT = 0;

-- Vietnamese names pools
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

-- Cities pool
DECLARE @Cities TABLE (City NVARCHAR(100), District NVARCHAR(100));
INSERT INTO @Cities VALUES 
(N'Hồ Chí Minh', N'Quận 1'), (N'Hồ Chí Minh', N'Quận 3'), (N'Hồ Chí Minh', N'Quận 7'),
(N'Hồ Chí Minh', N'Bình Thạnh'), (N'Hồ Chí Minh', N'Thủ Đức'), (N'Hà Nội', N'Ba Đình'),
(N'Hà Nội', N'Hoàn Kiếm'), (N'Hà Nội', N'Cầu Giấy'), (N'Đà Nẵng', N'Hải Châu'),
(N'Đà Nẵng', N'Sơn Trà'), (N'Cần Thơ', N'Ninh Kiều'), (N'Hải Phòng', N'Ngô Quyền');

-- 50 Customers
DECLARE @i INT = 1;
WHILE @i <= 50
BEGIN
    DECLARE @UserId INT = @StartUserId + @UserCounter;
    DECLARE @FirstName NVARCHAR(50) = (SELECT TOP 1 Name FROM @FirstNames ORDER BY NEWID());
    DECLARE @LastName NVARCHAR(50) = (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID());
    DECLARE @FullName NVARCHAR(255) = @LastName + N' ' + @FirstName;
    DECLARE @Email NVARCHAR(255) = LOWER(
        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@FirstName, N'ă', 'a'), N'â', 'a'), N'đ', 'd'), N'ê', 'e'), N'ô', 'o')
        + REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@LastName, N'ă', 'a'), N'â', 'a'), N'đ', 'd'), N'ê', 'e'), N'ô', 'o')
        + CAST(@i AS VARCHAR) + '@gmail.com'
    );
    -- Clean email further
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ư', 'u'), N'ơ', 'o'), N'á', 'a'), N'à', 'a'), N'ả', 'a'), N'ã', 'a');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ạ', 'a'), N'é', 'e'), N'è', 'e'), N'ẻ', 'e'), N'ẽ', 'e'), N'ẹ', 'e');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'í', 'i'), N'ì', 'i'), N'ỉ', 'i'), N'ĩ', 'i'), N'ị', 'i'), N'ó', 'o');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ò', 'o'), N'ỏ', 'o'), N'õ', 'o'), N'ọ', 'o'), N'ú', 'u'), N'ù', 'u');
    SET @Email = REPLACE(REPLACE(REPLACE(REPLACE(@Email, N'ủ', 'u'), N'ũ', 'u'), N'ụ', 'u'), N'ý', 'y');
    SET @Email = REPLACE(REPLACE(REPLACE(@Email, N'ỳ', 'y'), N'ỷ', 'y'), N'ỹ', 'y');
    SET @Email = REPLACE(REPLACE(@Email, N'ỵ', 'y'), N'ế', 'e');
    
    DECLARE @Phone NVARCHAR(20) = '09' + RIGHT('00000000' + CAST(ABS(CHECKSUM(NEWID())) % 100000000 AS VARCHAR), 8);
    DECLARE @Password NVARCHAR(255) = '$2a$11$xvryBCoJK.zEWdP6dYlxQ.6ZpPPmw7gF3vXVVVqJYYIZmL2A/M8.K'; -- 123456
    DECLARE @CreatedDate DATETIME2 = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 180, GETDATE()); -- Random last 6 months
    
    INSERT INTO users (user_id, email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (@UserId, @Email, @Password, @FullName, @Phone, 'customer', 1, @CreatedDate, @CreatedDate);
    
    -- Create user_profile
    DECLARE @City NVARCHAR(100), @District NVARCHAR(100);
    SELECT TOP 1 @City = City, @District = District FROM @Cities ORDER BY NEWID();
    DECLARE @Address NVARCHAR(500) = CAST((ABS(CHECKSUM(NEWID())) % 500 + 1) AS NVARCHAR) + N' ' + @District + N', ' + @City;
    DECLARE @DOB DATE = DATEADD(YEAR, -(25 + ABS(CHECKSUM(NEWID())) % 30), GETDATE()); -- 25-55 years old
    
    INSERT INTO user_profiles (user_id, date_of_birth, address, city, preferred_payment_method, created_at, updated_at)
    VALUES (@UserId, @DOB, @Address, @City, 
            CASE (ABS(CHECKSUM(NEWID())) % 3) WHEN 0 THEN 'momo' WHEN 1 THEN 'vnpay' ELSE 'zalopay' END,
            @CreatedDate, @CreatedDate);
    
    SET @UserCounter = @UserCounter + 1;
    SET @i = @i + 1;
END

-- 8 Staff members
SET @i = 1;
WHILE @i <= 8
BEGIN
    DECLARE @StaffUserId INT = @StartUserId + @UserCounter;
    DECLARE @StaffFirstName NVARCHAR(50) = (SELECT TOP 1 Name FROM @FirstNames ORDER BY NEWID());
    DECLARE @StaffLastName NVARCHAR(50) = (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID());
    DECLARE @StaffFullName NVARCHAR(255) = @StaffLastName + N' ' + @StaffFirstName;
    DECLARE @StaffEmail NVARCHAR(255) = 'staff' + CAST(@i AS VARCHAR) + '@skaev.com';
    DECLARE @StaffPhone NVARCHAR(20) = '08' + RIGHT('00000000' + CAST(ABS(CHECKSUM(NEWID())) % 100000000 AS VARCHAR), 8);
    DECLARE @StaffCreated DATETIME2 = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 365, GETDATE()); -- Random last year
    
    INSERT INTO users (user_id, email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (@StaffUserId, @StaffEmail, @Password, @StaffFullName, @StaffPhone, 'staff', 1, @StaffCreated, @StaffCreated);
    
    SET @UserCounter = @UserCounter + 1;
    SET @i = @i + 1;
END

-- 2 Admin users
SET @i = 1;
WHILE @i <= 2
BEGIN
    DECLARE @AdminUserId INT = @StartUserId + @UserCounter;
    DECLARE @AdminFirstName NVARCHAR(50) = (SELECT TOP 1 Name FROM @FirstNames ORDER BY NEWID());
    DECLARE @AdminLastName NVARCHAR(50) = (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID());
    DECLARE @AdminFullName NVARCHAR(255) = @AdminLastName + N' ' + @AdminFirstName;
    DECLARE @AdminEmail NVARCHAR(255) = 'admin' + CAST(@i + 1 AS VARCHAR) + '@skaev.com'; -- admin2, admin3
    DECLARE @AdminPhone NVARCHAR(20) = '07' + RIGHT('00000000' + CAST(ABS(CHECKSUM(NEWID())) % 100000000 AS VARCHAR), 8);
    DECLARE @AdminCreated DATETIME2 = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 365, GETDATE());
    
    INSERT INTO users (user_id, email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (@AdminUserId, @AdminEmail, @Password, @AdminFullName, @AdminPhone, 'admin', 1, @AdminCreated, @AdminCreated);
    
    SET @UserCounter = @UserCounter + 1;
    SET @i = @i + 1;
END

PRINT 'Created ' + CAST(@UserCounter AS VARCHAR) + ' new users (50 customers, 8 staff, 2 admins)';
GO

-- ====================================================================
-- SECTION 2: SEED VEHICLES (40 new vehicles)
-- ====================================================================
PRINT '';
PRINT 'Step 2/7: Creating 40 new vehicles...';
GO

DECLARE @StartVehicleId INT = 7; -- Current max is 6
DECLARE @VehicleCounter INT = 0;

-- Vehicle brands and models
DECLARE @VehicleModels TABLE (Brand NVARCHAR(100), Model NVARCHAR(100), BatteryCapacity DECIMAL(10,2), PortType NVARCHAR(50));
INSERT INTO @VehicleModels VALUES 
(N'Tesla', N'Model 3 Standard Range', 60.0, N'CCS2'),
(N'Tesla', N'Model 3 Long Range', 75.0, N'CCS2'),
(N'Tesla', N'Model Y', 75.0, N'CCS2'),
(N'Tesla', N'Model S', 100.0, N'CCS2'),
(N'Tesla', N'Model X', 100.0, N'CCS2'),
(N'VinFast', N'VF8 Eco', 82.0, N'CCS2'),
(N'VinFast', N'VF8 Plus', 87.7, N'CCS2'),
(N'VinFast', N'VF9 Eco', 92.0, N'CCS2'),
(N'VinFast', N'VF9 Plus', 123.0, N'CCS2'),
(N'VinFast', N'VFe34', 42.0, N'CCS2'),
(N'BMW', N'iX xDrive40', 76.6, N'CCS2'),
(N'BMW', N'iX xDrive50', 111.5, N'CCS2'),
(N'BMW', N'i4 eDrive40', 83.9, N'CCS2'),
(N'Hyundai', N'Ioniq 5', 72.6, N'CCS2'),
(N'Hyundai', N'Ioniq 6', 77.4, N'CCS2'),
(N'Kia', N'EV6 GT-Line', 77.4, N'CCS2'),
(N'Kia', N'EV9', 99.8, N'CCS2'),
(N'Mercedes-Benz', N'EQE 350+', 90.6, N'CCS2'),
(N'Mercedes-Benz', N'EQS 450+', 107.8, N'CCS2'),
(N'Audi', N'e-tron GT', 93.4, N'CCS2'),
(N'Porsche', N'Taycan', 93.4, N'CCS2'),
(N'Polestar', N'Polestar 2', 78.0, N'CCS2'),
(N'Nissan', N'Leaf', 40.0, N'CCS2'),
(N'Chevrolet', N'Bolt EV', 65.0, N'CCS2');

-- Get all customer user_ids (excluding existing 2 users who already have vehicles)
DECLARE @CustomerIds TABLE (UserId INT);
INSERT INTO @CustomerIds 
SELECT user_id FROM users 
WHERE role = 'customer' AND user_id NOT IN (1, 2) -- Users 1,2 already have vehicles
ORDER BY user_id;

DECLARE @TotalCustomers INT = (SELECT COUNT(*) FROM @CustomerIds);
DECLARE @VehiclesNeeded INT = 40;

-- Assign vehicles to customers (some customers get 2 vehicles)
DECLARE @VehicleUserId INT;
DECLARE @VehicleBrand NVARCHAR(100);
DECLARE @VehicleModel NVARCHAR(100);
DECLARE @BatteryCapacity DECIMAL(10,2);
DECLARE @PortType NVARCHAR(50);
DECLARE @LicensePlate NVARCHAR(20);
DECLARE @IsPrimary BIT;
DECLARE @VehicleCreated DATETIME2;

DECLARE @j INT = 1;
WHILE @j <= @VehiclesNeeded
BEGIN
    -- Pick a customer (some will get 2 vehicles)
    SET @VehicleUserId = (SELECT TOP 1 UserId FROM @CustomerIds ORDER BY NEWID());
    
    -- Pick random vehicle model
    SELECT TOP 1 @VehicleBrand = Brand, @VehicleModel = Model, @BatteryCapacity = BatteryCapacity, @PortType = PortType
    FROM @VehicleModels ORDER BY NEWID();
    
    -- Generate Vietnamese license plate
    DECLARE @CityCode NVARCHAR(5) = (SELECT TOP 1 Code FROM (VALUES ('29'), ('30'), ('51'), ('59'), ('60'), ('43')) AS Codes(Code) ORDER BY NEWID());
    DECLARE @LetterCode NVARCHAR(2) = (SELECT TOP 1 Letter FROM (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H')) AS Letters(Letter) ORDER BY NEWID());
    SET @LicensePlate = @CityCode + @LetterCode + '-' + 
                        RIGHT('00000', 5 - LEN(CAST((ABS(CHECKSUM(NEWID())) % 99999 + 1) AS VARCHAR))) + 
                        CAST((ABS(CHECKSUM(NEWID())) % 99999 + 1) AS VARCHAR);
    
    -- Check if this is customer's first vehicle
    SET @IsPrimary = CASE WHEN NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @VehicleUserId) THEN 1 ELSE 0 END;
    
    SET @VehicleCreated = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 180, GETDATE());
    
    INSERT INTO vehicles (vehicle_id, user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
    VALUES (@StartVehicleId + @VehicleCounter, @VehicleUserId, N'EV', @VehicleBrand, @VehicleModel, @LicensePlate, 
            @BatteryCapacity, @PortType, @IsPrimary, @VehicleCreated, @VehicleCreated);
    
    SET @VehicleCounter = @VehicleCounter + 1;
    SET @j = @j + 1;
END

PRINT 'Created ' + CAST(@VehicleCounter AS VARCHAR) + ' new vehicles';
GO

-- ====================================================================
-- SECTION 3: SEED BOOKINGS (400 new bookings, June-Nov 2025)
-- ====================================================================
PRINT '';
PRINT 'Step 3/7: Creating 400 new bookings...';
GO

DECLARE @StartBookingId INT = 24; -- Current max is 23
DECLARE @BookingCounter INT = 0;

-- Get all stations
DECLARE @StationIds TABLE (StationId INT);
INSERT INTO @StationIds SELECT station_id FROM charging_stations WHERE deleted_at IS NULL;

-- Get all available slots (we'll use slot_id 1-15 cyclically)
DECLARE @SlotIds TABLE (SlotId INT);
INSERT INTO @SlotIds VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15);

-- Get all vehicles for bookings
DECLARE @VehicleIds TABLE (VehicleId INT, UserId INT);
INSERT INTO @VehicleIds SELECT vehicle_id, user_id FROM vehicles;

-- Time distribution: June 1 to Nov 5, 2025
DECLARE @StartDate DATETIME2 = '2025-06-01';
DECLARE @EndDate DATETIME2 = '2025-11-05';
DECLARE @TotalDays INT = DATEDIFF(DAY, @StartDate, @EndDate);

-- Peak hours: 7-9 AM (weight 3), 5-8 PM (weight 3), other hours (weight 1)
DECLARE @PeakMorningStart INT = 7;
DECLARE @PeakMorningEnd INT = 9;
DECLARE @PeakEveningStart INT = 17;
DECLARE @PeakEveningEnd INT = 20;

DECLARE @k INT = 1;
WHILE @k <= 400
BEGIN
    -- Pick random vehicle (and its user)
    DECLARE @BookingVehicleId INT, @BookingUserId INT;
    SELECT TOP 1 @BookingVehicleId = VehicleId, @BookingUserId = UserId FROM @VehicleIds ORDER BY NEWID();
    
    -- Pick random station
    DECLARE @BookingStationId INT = (SELECT TOP 1 StationId FROM @StationIds ORDER BY NEWID());
    
    -- Pick random slot
    DECLARE @BookingSlotId INT = (SELECT TOP 1 SlotId FROM @SlotIds ORDER BY NEWID());
    
    -- Generate random date in range
    DECLARE @RandomDay INT = ABS(CHECKSUM(NEWID())) % @TotalDays;
    DECLARE @BookingDate DATE = DATEADD(DAY, @RandomDay, @StartDate);
    
    -- Generate hour with peak preference
    DECLARE @HourWeight INT = ABS(CHECKSUM(NEWID())) % 10; -- 0-9
    DECLARE @BookingHour INT;
    IF @HourWeight < 3 -- 30% chance
        SET @BookingHour = @PeakMorningStart + (ABS(CHECKSUM(NEWID())) % (@PeakMorningEnd - @PeakMorningStart + 1));
    ELSE IF @HourWeight < 6 -- 30% chance
        SET @BookingHour = @PeakEveningStart + (ABS(CHECKSUM(NEWID())) % (@PeakEveningEnd - @PeakEveningStart + 1));
    ELSE -- 40% chance for other hours
        SET @BookingHour = (ABS(CHECKSUM(NEWID())) % 24);
    
    DECLARE @BookingMinute INT = (ABS(CHECKSUM(NEWID())) % 60);
    DECLARE @ActualStartTime DATETIME2 = DATEADD(MINUTE, @BookingMinute, DATEADD(HOUR, @BookingHour, @BookingDate));
    
    -- Charging duration: 30-120 minutes
    DECLARE @ChargingDuration INT = 30 + (ABS(CHECKSUM(NEWID())) % 91);
    DECLARE @ActualEndTime DATETIME2 = DATEADD(MINUTE, @ChargingDuration, @ActualStartTime);
    
    -- Target SOC: 70-100%
    DECLARE @TargetSOC DECIMAL(5,2) = 70 + (ABS(CHECKSUM(NEWID())) % 31);
    
    -- Status: 90% completed, 5% in_progress, 5% cancelled
    DECLARE @StatusRand INT = ABS(CHECKSUM(NEWID())) % 100;
    DECLARE @BookingStatus NVARCHAR(50);
    IF @StatusRand < 90
        SET @BookingStatus = 'completed';
    ELSE IF @StatusRand < 95
        SET @BookingStatus = 'in_progress';
    ELSE
        SET @BookingStatus = 'cancelled';
    
    DECLARE @CreatedAt DATETIME2 = DATEADD(HOUR, -2, @ActualStartTime); -- Booked 2 hours before
    
    INSERT INTO bookings (booking_id, user_id, vehicle_id, slot_id, station_id, scheduling_type, 
                         estimated_arrival, scheduled_start_time, actual_start_time, actual_end_time,
                         status, target_soc, estimated_duration, created_at, updated_at)
    VALUES (@StartBookingId + @BookingCounter, @BookingUserId, @BookingVehicleId, @BookingSlotId, @BookingStationId,
            'instant', @ActualStartTime, @ActualStartTime, @ActualStartTime, 
            CASE WHEN @BookingStatus = 'completed' THEN @ActualEndTime ELSE NULL END,
            @BookingStatus, @TargetSOC, @ChargingDuration, @CreatedAt, @CreatedAt);
    
    SET @BookingCounter = @BookingCounter + 1;
    SET @k = @k + 1;
END

PRINT 'Created ' + CAST(@BookingCounter AS VARCHAR) + ' new bookings';
GO

-- ====================================================================
-- SECTION 4: SEED INVOICES (400 invoices for new bookings)
-- ====================================================================
PRINT '';
PRINT 'Step 4/7: Creating 400 new invoices...';
GO

DECLARE @StartInvoiceId INT = 23; -- Current max is 22
DECLARE @InvoiceCounter INT = 0;

-- Get all new bookings
DECLARE @NewBookings TABLE (BookingId INT, UserId INT, ActualStartTime DATETIME2, ActualEndTime DATETIME2, Status NVARCHAR(50));
INSERT INTO @NewBookings 
SELECT booking_id, user_id, actual_start_time, actual_end_time, status 
FROM bookings 
WHERE booking_id >= 24;

DECLARE @InvoiceBookingId INT, @InvoiceUserId INT, @InvoiceStartTime DATETIME2, @InvoiceEndTime DATETIME2, @InvoiceStatus NVARCHAR(50);

DECLARE invoice_cursor CURSOR FOR
SELECT BookingId, UserId, ActualStartTime, ActualEndTime, Status FROM @NewBookings;

OPEN invoice_cursor;
FETCH NEXT FROM invoice_cursor INTO @InvoiceBookingId, @InvoiceUserId, @InvoiceStartTime, @InvoiceEndTime, @InvoiceStatus;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Calculate energy and pricing
    DECLARE @Duration INT = CASE WHEN @InvoiceEndTime IS NOT NULL 
                                  THEN DATEDIFF(MINUTE, @InvoiceStartTime, @InvoiceEndTime) 
                                  ELSE 0 END;
    DECLARE @EnergyKwh DECIMAL(10,2) = CAST(@Duration AS DECIMAL) * 0.5; -- Assume 0.5 kWh per minute (30 kW charging)
    
    -- Pricing tiers
    DECLARE @UnitPrice DECIMAL(10,2);
    IF @EnergyKwh <= 20 
        SET @UnitPrice = 3500; -- 3,500 VND/kWh for AC slow
    ELSE IF @EnergyKwh <= 40
        SET @UnitPrice = 4500; -- 4,500 VND/kWh for DC fast
    ELSE
        SET @UnitPrice = 5500; -- 5,500 VND/kWh for DC ultra fast
    
    DECLARE @Subtotal DECIMAL(10,2) = @EnergyKwh * @UnitPrice;
    DECLARE @TaxAmount DECIMAL(10,2) = @Subtotal * 0.1; -- 10% VAT
    DECLARE @TotalAmount DECIMAL(10,2) = @Subtotal + @TaxAmount;
    
    -- Payment method and status
    DECLARE @PaymentMethod NVARCHAR(50) = (SELECT TOP 1 Method FROM (VALUES ('momo'), ('vnpay'), ('zalopay'), ('banking')) AS Methods(Method) ORDER BY NEWID());
    DECLARE @PaymentStatus NVARCHAR(50);
    DECLARE @PaidAt DATETIME2 = NULL;
    
    IF @InvoiceStatus = 'completed'
    BEGIN
        -- 90% paid, 5% pending, 5% failed
        DECLARE @PaymentRand INT = ABS(CHECKSUM(NEWID())) % 100;
        IF @PaymentRand < 90
        BEGIN
            SET @PaymentStatus = 'paid';
            SET @PaidAt = DATEADD(MINUTE, 5, @InvoiceEndTime); -- Paid 5 minutes after charging ended
        END
        ELSE IF @PaymentRand < 95
            SET @PaymentStatus = 'pending';
        ELSE
            SET @PaymentStatus = 'failed';
    END
    ELSE IF @InvoiceStatus = 'in_progress'
        SET @PaymentStatus = 'pending';
    ELSE
        SET @PaymentStatus = 'cancelled';
    
    INSERT INTO invoices (invoice_id, booking_id, user_id, total_energy_kwh, unit_price, subtotal, 
                         tax_amount, total_amount, payment_method, payment_status, paid_at, created_at, updated_at)
    VALUES (@StartInvoiceId + @InvoiceCounter, @InvoiceBookingId, @InvoiceUserId, @EnergyKwh, @UnitPrice, 
            @Subtotal, @TaxAmount, @TotalAmount, @PaymentMethod, @PaymentStatus, @PaidAt, @InvoiceStartTime, @InvoiceStartTime);
    
    SET @InvoiceCounter = @InvoiceCounter + 1;
    
    FETCH NEXT FROM invoice_cursor INTO @InvoiceBookingId, @InvoiceUserId, @InvoiceStartTime, @InvoiceEndTime, @InvoiceStatus;
END

CLOSE invoice_cursor;
DEALLOCATE invoice_cursor;

PRINT 'Created ' + CAST(@InvoiceCounter AS VARCHAR) + ' new invoices';
GO

-- ====================================================================
-- SECTION 5: SEED REVIEWS (100 reviews for completed bookings)
-- ====================================================================
PRINT '';
PRINT 'Step 5/7: Creating 100 new reviews...';
GO

DECLARE @ReviewCounter INT = 0;

-- Get completed bookings without reviews
DECLARE @CompletedBookings TABLE (BookingId INT, UserId INT, StationId INT);
INSERT INTO @CompletedBookings 
SELECT TOP 100 b.booking_id, b.user_id, b.station_id 
FROM bookings b
WHERE b.status = 'completed' 
  AND b.booking_id >= 24
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.booking_id)
ORDER BY NEWID();

-- Vietnamese review comments pools
DECLARE @PositiveComments TABLE (Comment NVARCHAR(500));
INSERT INTO @PositiveComments VALUES 
(N'Trạm sạc rất tiện lợi, sạch sẽ và tốc độ sạc nhanh!'),
(N'Nhân viên hỗ trợ nhiệt tình, trạm có đầy đủ tiện nghi.'),
(N'Vị trí thuận tiện, đỗ xe dễ dàng, sẽ quay lại lần sau!'),
(N'Tốc độ sạc ấn tượng, chỉ mất 45 phút để sạc đầy.'),
(N'Trạm sạc hiện đại, ứng dụng dễ sử dụng, thanh toán nhanh chóng.'),
(N'Khu vực chờ thoải mái, có wifi miễn phí và nước uống.'),
(N'Giá cả hợp lý, chất lượng dịch vụ tuyệt vời!'),
(N'Trạm luôn sẵn sàng, không phải chờ đợi lâu.'),
(N'An ninh tốt, camera giám sát đầy đủ, yên tâm để xe.'),
(N'Thiết bị sạc mới, hoạt động ổn định không lỗi.');

DECLARE @NeutralComments TABLE (Comment NVARCHAR(500));
INSERT INTO @NeutralComments VALUES 
(N'Trạm sạc tốt nhưng đôi khi hơi đông vào giờ cao điểm.'),
(N'Dịch vụ ổn, giá hơi cao so với các trạm khác.'),
(N'Trạm sạc bình thường, không có gì đặc biệt.'),
(N'Vị trí hơi xa trung tâm nhưng trạm sạc nhanh.'),
(N'Tiện nghi cơ bản đầy đủ, có thể cải thiện thêm.');

DECLARE @ConstructiveComments TABLE (Comment NVARCHAR(500));
INSERT INTO @ConstructiveComments VALUES 
(N'Trạm tốt nhưng nên bổ sung thêm mái che cho khu vực chờ.'),
(N'Dịch vụ tốt, hy vọng sẽ có thêm điểm sạc trong tương lai.'),
(N'Cần cải thiện hệ thống thanh toán, đôi khi bị lỗi.'),
(N'Trạm sạc tốt nhưng app thỉnh thoảng load chậm.'),
(N'Nên có thêm nhân viên hỗ trợ vào giờ cao điểm.');

DECLARE @ReviewBookingId INT, @ReviewUserId INT, @ReviewStationId INT;

DECLARE review_cursor CURSOR FOR
SELECT BookingId, UserId, StationId FROM @CompletedBookings;

OPEN review_cursor;
FETCH NEXT FROM review_cursor INTO @ReviewBookingId, @ReviewUserId, @ReviewStationId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Rating distribution: 20% 5-star, 40% 4-star, 30% 3-star, 10% 2-star
    DECLARE @RatingRand INT = ABS(CHECKSUM(NEWID())) % 100;
    DECLARE @Rating INT;
    DECLARE @ReviewComment NVARCHAR(500);
    
    IF @RatingRand < 20
    BEGIN
        SET @Rating = 5;
        SELECT TOP 1 @ReviewComment = Comment FROM @PositiveComments ORDER BY NEWID();
    END
    ELSE IF @RatingRand < 60
    BEGIN
        SET @Rating = 4;
        SELECT TOP 1 @ReviewComment = Comment FROM @PositiveComments ORDER BY NEWID();
    END
    ELSE IF @RatingRand < 90
    BEGIN
        SET @Rating = 3;
        SELECT TOP 1 @ReviewComment = Comment FROM @NeutralComments ORDER BY NEWID();
    END
    ELSE
    BEGIN
        SET @Rating = 2;
        SELECT TOP 1 @ReviewComment = Comment FROM @ConstructiveComments ORDER BY NEWID();
    END
    
    DECLARE @ReviewCreated DATETIME2 = (SELECT DATEADD(DAY, 1, actual_end_time) FROM bookings WHERE booking_id = @ReviewBookingId); -- Review 1 day after booking
    
    INSERT INTO reviews (booking_id, user_id, station_id, rating, comment, created_at, updated_at)
    VALUES (@ReviewBookingId, @ReviewUserId, @ReviewStationId, @Rating, @ReviewComment, @ReviewCreated, @ReviewCreated);
    
    SET @ReviewCounter = @ReviewCounter + 1;
    
    FETCH NEXT FROM review_cursor INTO @ReviewBookingId, @ReviewUserId, @ReviewStationId;
END

CLOSE review_cursor;
DEALLOCATE review_cursor;

PRINT 'Created ' + CAST(@ReviewCounter AS VARCHAR) + ' new reviews';
GO

-- ====================================================================
-- SECTION 6: SEED SUPPORT REQUESTS (35 new requests)
-- ====================================================================
PRINT '';
PRINT 'Step 6/7: Creating 35 new support requests...';
GO

DECLARE @StartRequestId INT = 10; -- Current max is 9
DECLARE @RequestCounter INT = 0;

-- Support request templates
DECLARE @RequestTemplates TABLE (Category VARCHAR(50), Subject NVARCHAR(200), Description NVARCHAR(2000), Priority VARCHAR(20));
INSERT INTO @RequestTemplates VALUES 
('technical', N'Trạm sạc không hoạt động', N'Tôi đến trạm VinFast Green Charging nhưng cổng sạc số 3 không hoạt động. Màn hình báo lỗi kết nối.', 'high'),
('technical', N'Tốc độ sạc chậm bất thường', N'Xe của tôi sạc chậm hơn bình thường rất nhiều. Thông thường chỉ mất 1 giờ nhưng lần này đã 2 giờ vẫn chưa đầy.', 'medium'),
('technical', N'App không kết nối được với trạm', N'Ứng dụng báo lỗi "Cannot connect to charging station" khi tôi quét mã QR tại trạm Shell Recharge.', 'high'),
('billing', N'Bị tính phí sai', N'Hóa đơn của tôi cao hơn dự kiến. Tôi chỉ sạc 30 phút nhưng bị tính 2 giờ.', 'high'),
('billing', N'Chưa nhận được hóa đơn', N'Đã 3 ngày sau khi sạc xong nhưng tôi vẫn chưa nhận được hóa đơn qua email.', 'low'),
('billing', N'Thanh toán bị lỗi', N'Tôi đã thanh toán qua MoMo nhưng hệ thống vẫn hiển thị chưa thanh toán.', 'high'),
('location', N'Không tìm thấy trạm sạc', N'Bản đồ chỉ dẫn sai địa chỉ trạm AEON Mall Bình Tân. Tôi đến nơi nhưng không thấy trạm.', 'medium'),
('location', N'Đề xuất thêm trạm sạc mới', N'Khu vực Quận 2 còn thiếu trạm sạc. Đề xuất xây dựng thêm trạm tại khu Thảo Điền.', 'low'),
('account', N'Quên mật khẩu', N'Tôi không thể đăng nhập vào tài khoản. Email reset password không được gửi đến.', 'medium'),
('account', N'Cập nhật thông tin xe', N'Tôi muốn thêm xe mới vào tài khoản nhưng không tìm thấy chức năng này trên app.', 'low'),
('feedback', N'Đề xuất cải thiện UI app', N'Giao diện app nên hiển thị rõ hơn trạng thái sạc hiện tại và thời gian còn lại.', 'low'),
('feedback', N'Yêu cầu thêm tính năng đặt chỗ', N'Hy vọng app sẽ có tính năng đặt chỗ trước để không phải chờ đợi vào giờ cao điểm.', 'low'),
('other', N'Câu hỏi về membership', N'Tôi muốn biết thêm thông tin về gói membership và ưu đãi cho khách hàng thường xuyên.', 'low'),
('other', N'Hỏi về bảo trì trạm', N'Khi nào trạm Landmark 81 sẽ hoàn thành bảo trì và hoạt động trở lại?', 'medium');

-- Get staff IDs for assignment
DECLARE @StaffIds TABLE (UserId INT);
INSERT INTO @StaffIds SELECT user_id FROM users WHERE role IN ('staff', 'admin');

-- Get customer IDs for requests
DECLARE @RequestUserIds TABLE (UserId INT);
INSERT INTO @RequestUserIds SELECT TOP 35 user_id FROM users WHERE role = 'customer' ORDER BY NEWID();

DECLARE @l INT = 1;
WHILE @l <= 35
BEGIN
    DECLARE @ReqUserId INT = (SELECT TOP 1 UserId FROM @RequestUserIds ORDER BY NEWID());
    DECLARE @ReqCategory VARCHAR(50), @ReqSubject NVARCHAR(200), @ReqDescription NVARCHAR(2000), @ReqPriority VARCHAR(20);
    
    SELECT TOP 1 @ReqCategory = Category, @ReqSubject = Subject, @ReqDescription = Description, @ReqPriority = Priority
    FROM @RequestTemplates ORDER BY NEWID();
    
    -- Status distribution: 40% resolved, 30% in_progress, 30% open
    DECLARE @StatusRand2 INT = ABS(CHECKSUM(NEWID())) % 100;
    DECLARE @ReqStatus VARCHAR(20), @AssignedTo INT = NULL, @ResolvedAt DATETIME = NULL, @ResolutionNotes NVARCHAR(2000) = NULL;
    
    IF @StatusRand2 < 40
    BEGIN
        SET @ReqStatus = 'resolved';
        SET @AssignedTo = (SELECT TOP 1 UserId FROM @StaffIds ORDER BY NEWID());
        SET @ResolvedAt = DATEADD(DAY, ABS(CHECKSUM(NEWID())) % 7, DATEADD(DAY, -30, GETDATE())); -- Resolved within last 30 days
        SET @ResolutionNotes = N'Vấn đề đã được giải quyết. Cảm ơn bạn đã báo cáo.';
    END
    ELSE IF @StatusRand2 < 70
    BEGIN
        SET @ReqStatus = 'in_progress';
        SET @AssignedTo = (SELECT TOP 1 UserId FROM @StaffIds ORDER BY NEWID());
    END
    ELSE
        SET @ReqStatus = 'open';
    
    DECLARE @ReqCreated DATETIME = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 60, GETDATE()); -- Created within last 60 days
    
    INSERT INTO support_requests (request_id, user_id, category, subject, description, status, priority, 
                                  assigned_to, created_at, updated_at, resolved_at, resolution_notes)
    VALUES (@StartRequestId + @RequestCounter, @ReqUserId, @ReqCategory, @ReqSubject, @ReqDescription, 
            @ReqStatus, @ReqPriority, @AssignedTo, @ReqCreated, @ReqCreated, @ResolvedAt, @ResolutionNotes);
    
    SET @RequestCounter = @RequestCounter + 1;
    SET @l = @l + 1;
END

PRINT 'Created ' + CAST(@RequestCounter AS VARCHAR) + ' new support requests';
GO

-- ====================================================================
-- SECTION 7: VERIFICATION & SUMMARY
-- ====================================================================
PRINT '';
PRINT 'Step 7/7: Verifying seeded data...';
GO

SELECT 'users' as [Table], COUNT(*) as [Total_Records] FROM users
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'support_requests', COUNT(*) FROM support_requests;

PRINT '';
PRINT '========================================';
PRINT 'SEEDING COMPLETED SUCCESSFULLY!';
PRINT '';
PRINT 'Summary:';
PRINT '- Users: 60 new (50 customers, 8 staff, 2 admins)';
PRINT '- Vehicles: 40 new (diverse brands and models)';
PRINT '- Bookings: 400 new (June-Nov 2025, all stations)';
PRINT '- Invoices: 400 new (90% paid)';
PRINT '- Reviews: 100 new (ratings 2-5 stars)';
PRINT '- Support Requests: 35 new (varied status)';
PRINT '';
PRINT 'Time: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
GO
