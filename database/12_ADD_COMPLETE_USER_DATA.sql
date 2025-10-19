-- =============================================
-- Add Complete Data for Test User: nguyenvanan@gmail.com
-- Includes: Vehicles, Payment Methods, Bookings, Reviews
-- =============================================

USE SkaEV_DB;
GO

DECLARE @UserID INT = (SELECT user_id FROM Users WHERE email = 'nguyenvanan@gmail.com');

IF @UserID IS NULL
BEGIN
    PRINT 'ERROR: User nguyenvanan@gmail.com not found!';
    PRINT 'Please run registration first.';
    RETURN;
END

PRINT '================================';
PRINT 'Adding data for UserID: ' + CAST(@UserID AS VARCHAR(10));
PRINT '================================';
PRINT '';

-- =============================================
-- 1. ADD VEHICLES
-- =============================================
PRINT '1. Adding Vehicles...';

-- Vehicle 1: Tesla Model 3
IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE user_id = @UserID AND license_plate = '30A-12345')
BEGIN
    INSERT INTO Vehicles (
        user_id,
        license_plate,
        vehicle_name,
        vehicle_model,
        battery_capacity,
        current_soc,
        charging_status,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        '30A-12345',
        N'Tesla Model 3 của tôi',
        'Tesla Model 3 Long Range',
        75.0,
        45.5,
        'Not Charging',
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added Tesla Model 3 (30A-12345)';
END

-- Vehicle 2: VinFast VF8
IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE user_id = @UserID AND license_plate = '29B-67890')
BEGIN
    INSERT INTO Vehicles (
        user_id,
        license_plate,
        vehicle_name,
        vehicle_model,
        battery_capacity,
        current_soc,
        charging_status,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        '29B-67890',
        N'VinFast VF8',
        'VinFast VF8 Plus',
        87.7,
        72.3,
        'Not Charging',
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added VinFast VF8 (29B-67890)';
END

PRINT '';

-- =============================================
-- 2. ADD PAYMENT METHODS
-- =============================================
PRINT '2. Adding Payment Methods...';

-- Payment Method 1: Visa
IF NOT EXISTS (SELECT 1 FROM PaymentMethods WHERE user_id = @UserID AND card_number_masked = '**** **** **** 1234')
BEGIN
    INSERT INTO PaymentMethods (
        user_id,
        card_type,
        card_number_masked,
        expiry_date,
        card_holder_name,
        is_default,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        'Visa',
        '**** **** **** 1234',
        '2026-12-31',
        N'NGUYEN VAN AN',
        1, -- Default card
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added Visa card (**** 1234)';
END

-- Payment Method 2: Mastercard
IF NOT EXISTS (SELECT 1 FROM PaymentMethods WHERE user_id = @UserID AND card_number_masked = '**** **** **** 5678')
BEGIN
    INSERT INTO PaymentMethods (
        user_id,
        card_type,
        card_number_masked,
        expiry_date,
        card_holder_name,
        is_default,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        'Mastercard',
        '**** **** **** 5678',
        '2027-06-30',
        N'NGUYEN VAN AN',
        0, -- Not default
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added Mastercard (**** 5678)';
END

PRINT '';

-- =============================================
-- 3. ADD BOOKINGS
-- =============================================
PRINT '3. Adding Bookings...';

-- Get sample station and port
DECLARE @StationID INT = (SELECT TOP 1 station_id FROM Stations WHERE is_active = 1 ORDER BY station_id);
DECLARE @PortID INT = (SELECT TOP 1 port_id FROM Ports WHERE station_id = @StationID ORDER BY port_id);
DECLARE @VehicleID INT = (SELECT TOP 1 vehicle_id FROM Vehicles WHERE user_id = @UserID);

IF @StationID IS NOT NULL AND @PortID IS NOT NULL AND @VehicleID IS NOT NULL
BEGIN
    -- Booking 1: Completed (1 week ago)
    INSERT INTO Bookings (
        user_id,
        vehicle_id,
        station_id,
        port_id,
        booking_date,
        start_time,
        end_time,
        status,
        total_cost,
        energy_consumed,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        @VehicleID,
        @StationID,
        @PortID,
        DATEADD(DAY, -7, CAST(GETDATE() AS DATE)),
        DATEADD(DAY, -7, CAST('2025-10-12 10:00:00' AS DATETIME)),
        DATEADD(DAY, -7, CAST('2025-10-12 12:30:00' AS DATETIME)),
        'Completed',
        175000.00,
        52.5,
        DATEADD(DAY, -7, GETDATE()),
        DATEADD(DAY, -7, GETDATE())
    );
    PRINT '  ✓ Added completed booking (1 week ago)';
    
    -- Booking 2: Completed (3 days ago)
    INSERT INTO Bookings (
        user_id,
        vehicle_id,
        station_id,
        port_id,
        booking_date,
        start_time,
        end_time,
        status,
        total_cost,
        energy_consumed,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        @VehicleID,
        @StationID,
        @PortID,
        DATEADD(DAY, -3, CAST(GETDATE() AS DATE)),
        DATEADD(DAY, -3, CAST('2025-10-16 14:00:00' AS DATETIME)),
        DATEADD(DAY, -3, CAST('2025-10-16 16:00:00' AS DATETIME)),
        'Completed',
        140000.00,
        42.0,
        DATEADD(DAY, -3, GETDATE()),
        DATEADD(DAY, -3, GETDATE())
    );
    PRINT '  ✓ Added completed booking (3 days ago)';
    
    -- Booking 3: Active/In Progress (today)
    INSERT INTO Bookings (
        user_id,
        vehicle_id,
        station_id,
        port_id,
        booking_date,
        start_time,
        end_time,
        status,
        total_cost,
        energy_consumed,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        @VehicleID,
        @StationID,
        @PortID,
        CAST(GETDATE() AS DATE),
        DATEADD(HOUR, -1, GETDATE()),
        DATEADD(HOUR, 1, GETDATE()),
        'In Progress',
        NULL,
        NULL,
        DATEADD(HOUR, -1, GETDATE()),
        GETDATE()
    );
    PRINT '  ✓ Added active booking (currently charging)';
    
    -- Booking 4: Upcoming (tomorrow)
    INSERT INTO Bookings (
        user_id,
        vehicle_id,
        station_id,
        port_id,
        booking_date,
        start_time,
        end_time,
        status,
        total_cost,
        energy_consumed,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        @VehicleID,
        @StationID,
        @PortID,
        DATEADD(DAY, 1, CAST(GETDATE() AS DATE)),
        DATEADD(DAY, 1, CAST('2025-10-20 09:00:00' AS DATETIME)),
        DATEADD(DAY, 1, CAST('2025-10-20 11:00:00' AS DATETIME)),
        'Confirmed',
        NULL,
        NULL,
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added upcoming booking (tomorrow)';
    
    -- Booking 5: Upcoming (next week)
    INSERT INTO Bookings (
        user_id,
        vehicle_id,
        station_id,
        port_id,
        booking_date,
        start_time,
        end_time,
        status,
        total_cost,
        energy_consumed,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        @VehicleID,
        @StationID,
        @PortID,
        DATEADD(DAY, 7, CAST(GETDATE() AS DATE)),
        DATEADD(DAY, 7, CAST('2025-10-26 15:00:00' AS DATETIME)),
        DATEADD(DAY, 7, CAST('2025-10-26 17:30:00' AS DATETIME)),
        'Confirmed',
        NULL,
        NULL,
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added upcoming booking (next week)';
END
ELSE
BEGIN
    PRINT '  ⚠ Cannot add bookings: No stations/ports/vehicles found';
END

PRINT '';

-- =============================================
-- 4. ADD INVOICES for completed bookings
-- =============================================
PRINT '4. Adding Invoices...';

DECLARE @CompletedBookingID1 INT = (
    SELECT TOP 1 booking_id 
    FROM Bookings 
    WHERE user_id = @UserID 
        AND status = 'Completed' 
        AND total_cost = 175000.00
);

DECLARE @CompletedBookingID2 INT = (
    SELECT TOP 1 booking_id 
    FROM Bookings 
    WHERE user_id = @UserID 
        AND status = 'Completed' 
        AND total_cost = 140000.00
);

DECLARE @PaymentMethodID INT = (
    SELECT TOP 1 payment_method_id 
    FROM PaymentMethods 
    WHERE user_id = @UserID 
        AND is_default = 1
);

IF @CompletedBookingID1 IS NOT NULL AND @PaymentMethodID IS NOT NULL
BEGIN
    INSERT INTO Invoices (
        booking_id,
        user_id,
        invoice_number,
        invoice_date,
        total_amount,
        payment_status,
        payment_method_id,
        payment_date,
        created_at,
        updated_at
    )
    VALUES (
        @CompletedBookingID1,
        @UserID,
        'INV-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-001',
        DATEADD(DAY, -7, GETDATE()),
        175000.00,
        'Paid',
        @PaymentMethodID,
        DATEADD(DAY, -7, GETDATE()),
        DATEADD(DAY, -7, GETDATE()),
        DATEADD(DAY, -7, GETDATE())
    );
    PRINT '  ✓ Added invoice for booking 1';
END

IF @CompletedBookingID2 IS NOT NULL AND @PaymentMethodID IS NOT NULL
BEGIN
    INSERT INTO Invoices (
        booking_id,
        user_id,
        invoice_number,
        invoice_date,
        total_amount,
        payment_status,
        payment_method_id,
        payment_date,
        created_at,
        updated_at
    )
    VALUES (
        @CompletedBookingID2,
        @UserID,
        'INV-' + FORMAT(GETDATE(), 'yyyyMMdd') + '-002',
        DATEADD(DAY, -3, GETDATE()),
        140000.00,
        'Paid',
        @PaymentMethodID,
        DATEADD(DAY, -3, GETDATE()),
        DATEADD(DAY, -3, GETDATE()),
        DATEADD(DAY, -3, GETDATE())
    );
    PRINT '  ✓ Added invoice for booking 2';
END

PRINT '';

-- =============================================
-- 5. ADD REVIEWS for completed bookings
-- =============================================
PRINT '5. Adding Reviews...';

IF @CompletedBookingID1 IS NOT NULL AND @StationID IS NOT NULL
BEGIN
    INSERT INTO Reviews (
        user_id,
        station_id,
        booking_id,
        rating,
        comment,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        @StationID,
        @CompletedBookingID1,
        5,
        N'Trạm sạc rất tốt, cổng sạc hoạt động ổn định. Nhân viên hỗ trợ nhiệt tình!',
        DATEADD(DAY, -6, GETDATE()),
        DATEADD(DAY, -6, GETDATE())
    );
    PRINT '  ✓ Added review for booking 1 (5 stars)';
END

IF @CompletedBookingID2 IS NOT NULL AND @StationID IS NOT NULL
BEGIN
    INSERT INTO Reviews (
        user_id,
        station_id,
        booking_id,
        rating,
        comment,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        @StationID,
        @CompletedBookingID2,
        4,
        N'Trạm sạc tốt, chỉ có điều khu vực đỗ xe hơi nhỏ.',
        DATEADD(DAY, -2, GETDATE()),
        DATEADD(DAY, -2, GETDATE())
    );
    PRINT '  ✓ Added review for booking 2 (4 stars)';
END

PRINT '';

-- =============================================
-- 6. SUMMARY
-- =============================================
PRINT '================================';
PRINT 'DATA SEEDING COMPLETED!';
PRINT '================================';
PRINT '';

SELECT 
    @UserID AS UserID,
    'nguyenvanan@gmail.com' AS Email,
    'Customer123!' AS Password,
    (SELECT COUNT(*) FROM Vehicles WHERE user_id = @UserID) AS VehiclesCount,
    (SELECT COUNT(*) FROM PaymentMethods WHERE user_id = @UserID) AS PaymentMethodsCount,
    (SELECT COUNT(*) FROM Bookings WHERE user_id = @UserID) AS BookingsCount,
    (SELECT COUNT(*) FROM Reviews WHERE user_id = @UserID) AS ReviewsCount;

PRINT '';
PRINT 'You can now login with:';
PRINT 'Email: nguyenvanan@gmail.com';
PRINT 'Password: Customer123!';
PRINT '';
PRINT '================================';

GO
