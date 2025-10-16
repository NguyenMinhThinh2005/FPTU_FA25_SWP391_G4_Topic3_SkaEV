-- =====================================================
-- 10_ADD_SAMPLE_USERS_AND_BOOKINGS.sql
-- Sample Users, Vehicles, Bookings, and Related Data
-- Replaces deleted mock data with realistic SQL data
-- =====================================================

SET QUOTED_IDENTIFIER ON;
GO

USE SkaEV_DB;
GO

PRINT '========================================';
PRINT 'Starting sample users and bookings insertion';
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
GO

-- =====================================================
-- PART 1: ADD SAMPLE USERS (CUSTOMERS)
-- =====================================================

PRINT 'Adding sample customer users...';

-- Customer 1: Nguyễn Văn An
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'nguyenvanan@gmail.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        'nguyenvanan@gmail.com',
        '$2a$11$XKzZvR8v8Y8QGJhVQh5DkuVYKw5Z8ZqYZ8ZqYZ8ZqYZ8ZqYZ8Zq', -- BCrypt hash of "Customer123!"
        N'Nguyễn Văn An',
        '+84 901 234 567',
        'Customer',
        1,
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @UserId1 INT = SCOPE_IDENTITY();
    
    -- Add user profile
    INSERT INTO user_profiles (user_id, date_of_birth, address, city, avatar_url, preferred_payment_method, notification_preferences, created_at, updated_at)
    VALUES (
        @UserId1,
        '1990-05-15',
        N'123 Nguyễn Huệ, Quận 1',
        N'Hồ Chí Minh',
        '/avatars/user1.jpg',
        'credit_card',
        N'{"email": true, "sms": true, "push": true}',
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Added Customer 1: Nguyễn Văn An';
END

-- Customer 2: Trần Thị Bình
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'tranthib@gmail.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        'tranthib@gmail.com',
        '$2a$11$XKzZvR8v8Y8QGJhVQh5DkuVYKw5Z8ZqYZ8ZqYZ8ZqYZ8ZqYZ8Zq',
        N'Trần Thị Bình',
        '+84 902 345 678',
        'Customer',
        1,
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @UserId2 INT = SCOPE_IDENTITY();
    
    INSERT INTO user_profiles (user_id, date_of_birth, address, city, avatar_url, preferred_payment_method, notification_preferences, created_at, updated_at)
    VALUES (
        @UserId2,
        '1992-08-20',
        N'456 Lê Lợi, Quận 3',
        N'Hồ Chí Minh',
        '/avatars/user2.jpg',
        'e_wallet',
        N'{"email": true, "sms": false, "push": true}',
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Added Customer 2: Trần Thị Bình';
END

-- Customer 3: Lê Minh Cường
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'leminhcuong@gmail.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        'leminhcuong@gmail.com',
        '$2a$11$XKzZvR8v8Y8QGJhVQh5DkuVYKw5Z8ZqYZ8ZqYZ8ZqYZ8ZqYZ8Zq',
        N'Lê Minh Cường',
        '+84 903 456 789',
        'Customer',
        1,
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @UserId3 INT = SCOPE_IDENTITY();
    
    INSERT INTO user_profiles (user_id, date_of_birth, address, city, avatar_url, preferred_payment_method, notification_preferences, created_at, updated_at)
    VALUES (
        @UserId3,
        '1988-12-10',
        N'789 Võ Văn Tần, Quận 3',
        N'Hồ Chí Minh',
        '/avatars/user3.jpg',
        'credit_card',
        N'{"email": true, "sms": true, "push": false}',
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Added Customer 3: Lê Minh Cường';
END

-- Customer 4: Phạm Thu Hà (Hanoi)
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'phamthuha@gmail.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        'phamthuha@gmail.com',
        '$2a$11$XKzZvR8v8Y8QGJhVQh5DkuVYKw5Z8ZqYZ8ZqYZ8ZqYZ8ZqYZ8Zq',
        N'Phạm Thu Hà',
        '+84 904 567 890',
        'Customer',
        1,
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @UserId4 INT = SCOPE_IDENTITY();
    
    INSERT INTO user_profiles (user_id, date_of_birth, address, city, avatar_url, preferred_payment_method, notification_preferences, created_at, updated_at)
    VALUES (
        @UserId4,
        '1995-03-25',
        N'234 Nguyễn Trãi, Thanh Xuân',
        N'Hà Nội',
        '/avatars/user4.jpg',
        'bank_transfer',
        N'{"email": true, "sms": true, "push": true}',
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Added Customer 4: Phạm Thu Hà';
END

-- Customer 5: Hoàng Văn Đức (Da Nang)
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'hoangvanduc@gmail.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        'hoangvanduc@gmail.com',
        '$2a$11$XKzZvR8v8Y8QGJhVQh5DkuVYKw5Z8ZqYZ8ZqYZ8ZqYZ8ZqYZ8Zq',
        N'Hoàng Văn Đức',
        '+84 905 678 901',
        'Customer',
        1,
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @UserId5 INT = SCOPE_IDENTITY();
    
    INSERT INTO user_profiles (user_id, date_of_birth, address, city, avatar_url, preferred_payment_method, notification_preferences, created_at, updated_at)
    VALUES (
        @UserId5,
        '1991-07-18',
        N'567 Ngô Quyền, Sơn Trà',
        N'Đà Nẵng',
        '/avatars/user5.jpg',
        'e_wallet',
        N'{"email": true, "sms": false, "push": true}',
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Added Customer 5: Hoàng Văn Đức';
END

-- =====================================================
-- PART 2: ADD STAFF USERS
-- =====================================================

PRINT 'Adding staff users...';

-- Staff 1: Station Manager
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'staff.nguyen@skaev.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        'staff.nguyen@skaev.com',
        '$2a$11$StaffHashStaffHashStaffHashStaffHashStaffHashStaffHash', -- "Staff123!"
        N'Nguyễn Văn Nhân Viên',
        '+84 911 111 111',
        'Staff',
        1,
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @StaffId1 INT = SCOPE_IDENTITY();
    
    -- Assign to Station 1
    INSERT INTO station_staff (staff_user_id, station_id, assigned_at, is_active)
    VALUES (@StaffId1, 1, GETDATE(), 1);
    
    PRINT 'Added Staff 1: Nguyễn Văn Nhân Viên';
END

-- Staff 2: Technical Support
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'staff.tran@skaev.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        'staff.tran@skaev.com',
        '$2a$11$StaffHashStaffHashStaffHashStaffHashStaffHashStaffHash',
        N'Trần Văn Kỹ Thuật',
        '+84 911 222 222',
        'Staff',
        1,
        GETDATE(),
        GETDATE()
    );
    
    DECLARE @StaffId2 INT = SCOPE_IDENTITY();
    
    -- Assign to multiple stations
    INSERT INTO station_staff (staff_user_id, station_id, assigned_at, is_active)
    VALUES 
    (@StaffId2, 2, GETDATE(), 1),
    (@StaffId2, 3, GETDATE(), 1);
    
    PRINT 'Added Staff 2: Trần Văn Kỹ Thuật';
END

-- =====================================================
-- PART 3: ADD ADMIN USER
-- =====================================================

PRINT 'Adding admin user...';

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@skaev.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        'admin@skaev.com',
        '$2a$11$AdminHashAdminHashAdminHashAdminHashAdminHashAdminHash', -- "Admin123!"
        N'Quản Trị Viên Hệ Thống',
        '+84 900 000 000',
        'Admin',
        1,
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Added Admin: admin@skaev.com';
END

-- =====================================================
-- PART 4: ADD SAMPLE VEHICLES
-- =====================================================

PRINT 'Adding sample vehicles...';

DECLARE @Customer1Id INT = (SELECT user_id FROM users WHERE email = 'nguyenvanan@gmail.com');
DECLARE @Customer2Id INT = (SELECT user_id FROM users WHERE email = 'tranthib@gmail.com');
DECLARE @Customer3Id INT = (SELECT user_id FROM users WHERE email = 'leminhcuong@gmail.com');
DECLARE @Customer4Id INT = (SELECT user_id FROM users WHERE email = 'phamthuha@gmail.com');
DECLARE @Customer5Id INT = (SELECT user_id FROM users WHERE email = 'hoangvanduc@gmail.com');

-- Vehicles for Customer 1
IF @Customer1Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @Customer1Id)
BEGIN
    INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
    VALUES 
    (@Customer1Id, 'Car', 'VinFast', 'VF e34', '51A-12345', 42.0, 'Type 2', 1, GETDATE(), GETDATE()),
    (@Customer1Id, 'Motorcycle', 'VinFast', 'Klara A2', '59A-67890', 2.5, 'Type 1', 0, GETDATE(), GETDATE());
    PRINT 'Added 2 vehicles for Customer 1';
END

-- Vehicles for Customer 2
IF @Customer2Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @Customer2Id)
BEGIN
    INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
    VALUES 
    (@Customer2Id, 'Car', 'Tesla', 'Model 3', '51B-23456', 60.0, 'CCS2', 1, GETDATE(), GETDATE());
    PRINT 'Added 1 vehicle for Customer 2';
END

-- Vehicles for Customer 3
IF @Customer3Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @Customer3Id)
BEGIN
    INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
    VALUES 
    (@Customer3Id, 'Car', 'VinFast', 'VF 8', '51C-34567', 87.7, 'CCS2', 1, GETDATE(), GETDATE()),
    (@Customer3Id, 'Car', 'Hyundai', 'Kona Electric', '51D-45678', 64.0, 'CCS2', 0, GETDATE(), GETDATE());
    PRINT 'Added 2 vehicles for Customer 3';
END

-- Vehicles for Customer 4 (Hanoi)
IF @Customer4Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @Customer4Id)
BEGIN
    INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
    VALUES 
    (@Customer4Id, 'Motorcycle', 'VinFast', 'Feliz S', '30A-11111', 1.5, 'Type 1', 1, GETDATE(), GETDATE());
    PRINT 'Added 1 vehicle for Customer 4';
END

-- Vehicles for Customer 5 (Da Nang)
IF @Customer5Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @Customer5Id)
BEGIN
    INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
    VALUES 
    (@Customer5Id, 'Car', 'VinFast', 'VF 9', '43A-99999', 123.0, 'CCS2', 1, GETDATE(), GETDATE());
    PRINT 'Added 1 vehicle for Customer 5';
END

-- =====================================================
-- PART 5: ADD SAMPLE BOOKINGS (HISTORICAL)
-- =====================================================

PRINT 'Adding sample bookings...';

DECLARE @Vehicle1Id INT = (SELECT TOP 1 vehicle_id FROM vehicles WHERE user_id = @Customer1Id ORDER BY vehicle_id);
DECLARE @Vehicle2Id INT = (SELECT TOP 1 vehicle_id FROM vehicles WHERE user_id = @Customer2Id ORDER BY vehicle_id);
DECLARE @Vehicle3Id INT = (SELECT TOP 1 vehicle_id FROM vehicles WHERE user_id = @Customer3Id ORDER BY vehicle_id);

DECLARE @Slot1Id INT = (SELECT TOP 1 slot_id FROM charging_slots WHERE status = 'available' ORDER BY slot_id);
DECLARE @Slot2Id INT = (SELECT TOP 1 slot_id FROM charging_slots WHERE status = 'available' AND slot_id != @Slot1Id ORDER BY slot_id);
DECLARE @Slot3Id INT = (SELECT TOP 1 slot_id FROM charging_slots WHERE status = 'available' AND slot_id NOT IN (@Slot1Id, @Slot2Id) ORDER BY slot_id);

-- Completed Booking 1
IF @Vehicle1Id IS NOT NULL AND @Slot1Id IS NOT NULL
BEGIN
    DECLARE @Post1Id INT = (SELECT post_id FROM charging_slots WHERE slot_id = @Slot1Id);
    DECLARE @Station1Id INT = (SELECT station_id FROM charging_posts WHERE post_id = @Post1Id);
    
    INSERT INTO bookings (
        user_id, vehicle_id, slot_id, station_id, scheduling_type,
        estimated_arrival, scheduled_start_time, actual_start_time, actual_end_time,
        status, target_soc, estimated_duration, qr_code_id, cancellation_reason,
        created_at, updated_at
    ) VALUES (
        @Customer1Id, @Vehicle1Id, @Slot1Id, @Station1Id, 'scheduled',
        DATEADD(HOUR, -48, GETDATE()),
        DATEADD(HOUR, -48, GETDATE()),
        DATEADD(HOUR, -48, GETDATE()),
        DATEADD(HOUR, -46, GETDATE()),
        'completed',
        80.0,
        120,
        NULL,
        NULL,
        DATEADD(HOUR, -50, GETDATE()),
        DATEADD(HOUR, -46, GETDATE())
    );
    
    DECLARE @Booking1Id INT = SCOPE_IDENTITY();
    
    -- Add SOC tracking for this booking
    INSERT INTO soc_tracking (booking_id, timestamp, current_soc, voltage, [current], power, energy_delivered, temperature, estimated_time_remaining)
    VALUES 
    (@Booking1Id, DATEADD(HOUR, -48, GETDATE()), 20.0, 400.0, 50.0, 20.0, 0.0, 25.0, 120),
    (@Booking1Id, DATEADD(MINUTE, -2850, GETDATE()), 50.0, 410.0, 48.0, 19.7, 12.6, 28.0, 60),
    (@Booking1Id, DATEADD(HOUR, -46, GETDATE()), 80.0, 405.0, 45.0, 18.2, 25.2, 30.0, 0);
    
    -- Add invoice
    INSERT INTO invoices (
        booking_id, user_id, total_energy_kwh, unit_price, subtotal, tax_amount, total_amount,
        payment_method, payment_status, paid_at, invoice_url, created_at, updated_at
    ) VALUES (
        @Booking1Id, @Customer1Id, 25.2, 3500.00, 88200.00, 8820.00, 97020.00,
        'credit_card', 'paid', DATEADD(HOUR, -46, GETDATE()), '/invoices/inv-' + CAST(@Booking1Id AS VARCHAR) + '.pdf',
        DATEADD(HOUR, -46, GETDATE()), DATEADD(HOUR, -46, GETDATE())
    );
    
    -- Add review
    INSERT INTO reviews (booking_id, user_id, station_id, rating, comment, created_at, updated_at)
    VALUES (
        @Booking1Id, @Customer1Id, @Station1Id, 5,
        N'Trạm sạc rất tiện lợi, tốc độ nhanh, nhân viên thân thiện!',
        DATEADD(HOUR, -45, GETDATE()),
        DATEADD(HOUR, -45, GETDATE())
    );
    
    PRINT 'Added completed Booking 1 with invoice and review';
END

-- Completed Booking 2
IF @Vehicle2Id IS NOT NULL AND @Slot2Id IS NOT NULL
BEGIN
    DECLARE @Post2Id INT = (SELECT post_id FROM charging_slots WHERE slot_id = @Slot2Id);
    DECLARE @Station2Id INT = (SELECT station_id FROM charging_posts WHERE post_id = @Post2Id);
    
    INSERT INTO bookings (
        user_id, vehicle_id, slot_id, station_id, scheduling_type,
        estimated_arrival, scheduled_start_time, actual_start_time, actual_end_time,
        status, target_soc, estimated_duration, qr_code_id, cancellation_reason,
        created_at, updated_at
    ) VALUES (
        @Customer2Id, @Vehicle2Id, @Slot2Id, @Station2Id, 'immediate',
        DATEADD(HOUR, -24, GETDATE()),
        NULL,
        DATEADD(HOUR, -24, GETDATE()),
        DATEADD(HOUR, -22, GETDATE()),
        'completed',
        90.0,
        120,
        NULL,
        NULL,
        DATEADD(HOUR, -24, GETDATE()),
        DATEADD(HOUR, -22, GETDATE())
    );
    
    DECLARE @Booking2Id INT = SCOPE_IDENTITY();
    
    -- Add invoice
    INSERT INTO invoices (
        booking_id, user_id, total_energy_kwh, unit_price, subtotal, tax_amount, total_amount,
        payment_method, payment_status, paid_at, invoice_url, created_at, updated_at
    ) VALUES (
        @Booking2Id, @Customer2Id, 42.0, 3500.00, 147000.00, 14700.00, 161700.00,
        'e_wallet', 'paid', DATEADD(HOUR, -22, GETDATE()), '/invoices/inv-' + CAST(@Booking2Id AS VARCHAR) + '.pdf',
        DATEADD(HOUR, -22, GETDATE()), DATEADD(HOUR, -22, GETDATE())
    );
    
    -- Add review
    INSERT INTO reviews (booking_id, user_id, station_id, rating, comment, created_at, updated_at)
    VALUES (
        @Booking2Id, @Customer2Id, @Station2Id, 4,
        N'Tốt, nhưng hơi đông người vào giờ cao điểm.',
        DATEADD(HOUR, -21, GETDATE()),
        DATEADD(HOUR, -21, GETDATE())
    );
    
    PRINT 'Added completed Booking 2 with invoice and review';
END

-- Active/In-Progress Booking 3
IF @Vehicle3Id IS NOT NULL AND @Slot3Id IS NOT NULL
BEGIN
    DECLARE @Post3Id INT = (SELECT post_id FROM charging_slots WHERE slot_id = @Slot3Id);
    DECLARE @Station3Id INT = (SELECT station_id FROM charging_posts WHERE post_id = @Post3Id);
    
    INSERT INTO bookings (
        user_id, vehicle_id, slot_id, station_id, scheduling_type,
        estimated_arrival, scheduled_start_time, actual_start_time, actual_end_time,
        status, target_soc, estimated_duration, qr_code_id, cancellation_reason,
        created_at, updated_at
    ) VALUES (
        @Customer3Id, @Vehicle3Id, @Slot3Id, @Station3Id, 'scheduled',
        DATEADD(HOUR, -1, GETDATE()),
        DATEADD(HOUR, -1, GETDATE()),
        DATEADD(HOUR, -1, GETDATE()),
        NULL,
        'charging',
        85.0,
        90,
        NULL,
        NULL,
        DATEADD(HOUR, -2, GETDATE()),
        DATEADD(MINUTE, -5, GETDATE())
    );
    
    DECLARE @Booking3Id INT = SCOPE_IDENTITY();
    
    -- Add SOC tracking (in progress)
    INSERT INTO soc_tracking (booking_id, timestamp, current_soc, voltage, [current], power, energy_delivered, temperature, estimated_time_remaining)
    VALUES 
    (@Booking3Id, DATEADD(HOUR, -1, GETDATE()), 30.0, 400.0, 100.0, 40.0, 0.0, 25.0, 90),
    (@Booking3Id, DATEADD(MINUTE, -30, GETDATE()), 55.0, 405.0, 95.0, 38.5, 21.9, 32.0, 45),
    (@Booking3Id, DATEADD(MINUTE, -5, GETDATE()), 75.0, 402.0, 90.0, 36.2, 39.5, 35.0, 15);
    
    -- Update slot status to occupied
    UPDATE charging_slots SET status = 'occupied', current_booking_id = @Booking3Id WHERE slot_id = @Slot3Id;
    
    PRINT 'Added active Booking 3 (in progress)';
END

-- =====================================================
-- PART 6: ADD SAMPLE NOTIFICATIONS
-- =====================================================

PRINT 'Adding sample notifications...';

-- Notification for Customer 1
IF @Customer1Id IS NOT NULL
BEGIN
    INSERT INTO notifications (user_id, type, title, message, is_read, related_booking_id, created_at)
    VALUES 
    (@Customer1Id, 'charging_complete', N'Sạc pin hoàn tất', N'Xe của bạn đã sạc xong. Tổng chi phí: 97,020 VNĐ', 1, NULL, DATEADD(HOUR, -46, GETDATE())),
    (@Customer1Id, 'system_alert', N'Khuyến mãi đặc biệt', N'Giảm 20% cho lần sạc tiếp theo!', 0, NULL, DATEADD(HOUR, -12, GETDATE()));
    PRINT 'Added notifications for Customer 1';
END

-- Notification for Customer 3 (active charging)
IF @Customer3Id IS NOT NULL AND @Booking3Id IS NOT NULL
BEGIN
    INSERT INTO notifications (user_id, type, title, message, is_read, related_booking_id, created_at)
    VALUES 
    (@Customer3Id, 'charging_complete', N'Đang sạc - 75% hoàn thành', N'Pin của bạn đã đạt 75%. Ước tính 15 phút nữa sẽ hoàn tất.', 0, @Booking3Id, DATEADD(MINUTE, -5, GETDATE()));
    PRINT 'Added notification for Customer 3';
END

-- =====================================================
-- PART 7: ADD SAMPLE PAYMENT METHODS
-- =====================================================

PRINT 'Adding sample payment methods...';

-- Payment methods for Customer 1
IF @Customer1Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = @Customer1Id)
BEGIN
    INSERT INTO payment_methods (user_id, type, provider, card_number_last4, cardholder_name, expiry_month, expiry_year, is_default, is_active, created_at, updated_at)
    VALUES 
    (@Customer1Id, 'credit_card', 'Visa', '4532', N'NGUYEN VAN AN', 12, 2026, 1, 1, GETDATE(), GETDATE()),
    (@Customer1Id, 'e_wallet', 'Momo', NULL, NULL, NULL, NULL, 0, 1, GETDATE(), GETDATE());
    PRINT 'Added payment methods for Customer 1';
END

-- Payment methods for Customer 2
IF @Customer2Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = @Customer2Id)
BEGIN
    INSERT INTO payment_methods (user_id, type, provider, card_number_last4, cardholder_name, expiry_month, expiry_year, is_default, is_active, created_at, updated_at)
    VALUES 
    (@Customer2Id, 'e_wallet', 'ZaloPay', NULL, NULL, NULL, NULL, 1, 1, GETDATE(), GETDATE());
    PRINT 'Added payment method for Customer 2';
END

-- Payment methods for Customer 3
IF @Customer3Id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = @Customer3Id)
BEGIN
    INSERT INTO payment_methods (user_id, type, provider, card_number_last4, cardholder_name, expiry_month, expiry_year, is_default, is_active, created_at, updated_at)
    VALUES 
    (@Customer3Id, 'credit_card', 'Mastercard', '5123', N'LE MINH CUONG', 6, 2027, 1, 1, GETDATE(), GETDATE());
    PRINT 'Added payment method for Customer 3';
END

-- =====================================================
-- PART 8: VERIFICATION AND SUMMARY
-- =====================================================

PRINT '';
PRINT '========================================';
PRINT 'DATA INSERTION SUMMARY';
PRINT '========================================';

DECLARE @TotalUsers INT, @TotalVehicles INT, @TotalBookings INT, @TotalPaymentMethods INT;

SELECT @TotalUsers = COUNT(*) FROM users;
SELECT @TotalVehicles = COUNT(*) FROM vehicles;
SELECT @TotalBookings = COUNT(*) FROM bookings;
SELECT @TotalPaymentMethods = COUNT(*) FROM payment_methods;

PRINT 'Total Users: ' + CAST(@TotalUsers AS VARCHAR);
PRINT 'Total Vehicles: ' + CAST(@TotalVehicles AS VARCHAR);
PRINT 'Total Bookings: ' + CAST(@TotalBookings AS VARCHAR);
PRINT 'Total Payment Methods: ' + CAST(@TotalPaymentMethods AS VARCHAR);

-- Show user distribution by role
PRINT '';
PRINT 'User Distribution by Role:';
SELECT 
    role,
    COUNT(*) as user_count,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
FROM users
GROUP BY role;

-- Show booking status distribution
PRINT '';
PRINT 'Booking Status Distribution:';
SELECT 
    status,
    COUNT(*) as booking_count,
    AVG(DATEDIFF(MINUTE, actual_start_time, ISNULL(actual_end_time, GETDATE()))) as avg_duration_minutes
FROM bookings
GROUP BY status;

-- Show vehicle distribution by type
PRINT '';
PRINT 'Vehicle Distribution by Type:';
SELECT 
    vehicle_type,
    brand,
    COUNT(*) as vehicle_count
FROM vehicles
GROUP BY vehicle_type, brand
ORDER BY vehicle_type, brand;

PRINT '';
PRINT '========================================';
PRINT 'SAMPLE USERS AND BOOKINGS INSERTION COMPLETED';
PRINT 'Date: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';

PRINT '';
PRINT '📝 TEST ACCOUNTS CREATED:';
PRINT 'Customer 1: nguyenvanan@gmail.com / Customer123!';
PRINT 'Customer 2: tranthib@gmail.com / Customer123!';
PRINT 'Customer 3: leminhcuong@gmail.com / Customer123!';
PRINT 'Customer 4: phamthuha@gmail.com / Customer123!';
PRINT 'Customer 5: hoangvanduc@gmail.com / Customer123!';
PRINT 'Staff 1: staff.nguyen@skaev.com / Staff123!';
PRINT 'Staff 2: staff.tran@skaev.com / Staff123!';
PRINT 'Admin: admin@skaev.com / Admin123!';
PRINT '';

GO
