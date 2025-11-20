-- Tạo user_id=14 với dữ liệu đầy đủ
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Tạo user với ID cố định = 14
SET IDENTITY_INSERT users ON;
INSERT INTO users (user_id, email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
SELECT 14, 'quockhoatle@gmail.com', password_hash, N'Quốc Khoa Lê', '0336930235', 'customer', 1, GETDATE(), GETDATE()
FROM users WHERE user_id=1;
SET IDENTITY_INSERT users OFF;
PRINT 'Created user_id: 14';
GO

-- 2. Tạo user profile
INSERT INTO user_profiles (user_id, date_of_birth, city, created_at, updated_at)
VALUES (14, '1992-03-20', N'Hồ Chí Minh', GETDATE(), GETDATE());
PRINT 'Created user profile';
GO

-- 3. Tạo 2 vehicles
INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
VALUES 
    (14, 'car', 'VinFast', 'VF 8', '30K-12345', 87.7, 'CCS2', 1, GETDATE(), GETDATE()),
    (14, 'car', 'VinFast', 'VF e34', '51B-99999', 42.0, 'Type 2', 0, GETDATE(), GETDATE());
PRINT 'Created 2 vehicles';
GO

-- 4. Copy 5 bookings từ user_id=1
DECLARE @vehicleId14 INT = (SELECT TOP 1 vehicle_id FROM vehicles WHERE user_id=14 ORDER BY vehicle_id);

INSERT INTO bookings (user_id, vehicle_id, slot_id, scheduling_type, actual_start_time, actual_end_time, status, target_soc, created_at, updated_at)
SELECT TOP 5
    14 AS user_id,
    @vehicleId14 AS vehicle_id,
    slot_id,
    scheduling_type,
    actual_start_time,
    actual_end_time,
    status,
    target_soc,
    GETDATE() AS created_at,
    GETDATE() AS updated_at
FROM bookings
WHERE user_id=1 AND status='completed' AND actual_end_time IS NOT NULL
ORDER BY booking_id;
PRINT 'Created 5 completed bookings';
GO

-- 5. Tạo invoices cho 5 bookings vừa tạo
INSERT INTO invoices (booking_id, user_id, total_amount, payment_method, payment_status, created_at, updated_at)
SELECT 
    b.booking_id,
    14 AS user_id,
    150000 + (ROW_NUMBER() OVER (ORDER BY b.booking_id) * 50000) AS total_amount,
    CASE (ROW_NUMBER() OVER (ORDER BY b.booking_id)) % 3
        WHEN 0 THEN 'credit_card'
        WHEN 1 THEN 'momo'
        ELSE 'zalopay'
    END AS payment_method,
    'paid' AS payment_status,
    GETDATE() AS created_at,
    GETDATE() AS updated_at
FROM bookings b
WHERE b.user_id=14 AND b.status='completed';
PRINT 'Created 5 invoices';
GO

-- 6. Verify
SELECT 
    'SUCCESS - User created' AS Result,
    14 AS user_id,
    (SELECT COUNT(*) FROM vehicles WHERE user_id=14) AS vehicles_count,
    (SELECT COUNT(*) FROM bookings WHERE user_id=14) AS bookings_count,
    (SELECT COUNT(*) FROM invoices WHERE user_id=14) AS invoices_count,
    (SELECT ISNULL(SUM(total_amount), 0) FROM invoices WHERE user_id=14) AS total_spent;
GO
