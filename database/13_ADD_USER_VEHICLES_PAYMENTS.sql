-- =============================================
-- Add Sample Data for User: nguyenvanan@gmail.com
-- SIMPLIFIED VERSION - Only Vehicles & Payment Methods
-- =============================================

USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
GO

DECLARE @UserID INT = (SELECT user_id FROM Users WHERE email = 'nguyenvanan@gmail.com');

IF @UserID IS NULL
BEGIN
    PRINT 'ERROR: User not found! Please register first.';
    RETURN;
END

PRINT '================================';
PRINT 'Adding data for User ID: ' + CAST(@UserID AS VARCHAR(10));
PRINT 'Email: nguyenvanan@gmail.com';
PRINT '================================';
PRINT '';

-- =============================================
-- 1. ADD VEHICLES
-- =============================================
PRINT '1. Adding Vehicles...';

-- Vehicle 1: Tesla Model 3
IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE user_id = @UserID AND license_plate = '30A-12345')
BEGIN
    INSERT INTO vehicles (
        user_id,
        vehicle_type,
        brand,
        model,
        license_plate,
        battery_capacity,
        charging_port_type,
        is_primary,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        'Electric Car',
        'Tesla',
        'Model 3 Long Range',
        '30A-12345',
        75.00,
        'Type 2',
        1, -- Primary vehicle
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added Tesla Model 3 (30A-12345)';
END
ELSE
    PRINT '  ⚠ Tesla Model 3 already exists';

-- Vehicle 2: VinFast VF8
IF NOT EXISTS (SELECT 1 FROM Vehicles WHERE user_id = @UserID AND license_plate = '29B-67890')
BEGIN
    INSERT INTO vehicles (
        user_id,
        vehicle_type,
        brand,
        model,
        license_plate,
        battery_capacity,
        charging_port_type,
        is_primary,
        created_at,
        updated_at
    )
    VALUES (
        @UserID,
        'Electric Car',
        'VinFast',
        'VF8 Plus',
        '29B-67890',
        87.70,
        'CCS2',
        0, -- Not primary
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added VinFast VF8 (29B-67890)';
END
ELSE
    PRINT '  ⚠ VinFast VF8 already exists';

PRINT '';

-- =============================================
-- 2. ADD PAYMENT METHODS
-- =============================================
PRINT '2. Adding Payment Methods...';

-- Payment 1: Visa
IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = @UserID AND card_number_masked = '**** **** **** 1234')
BEGIN
    INSERT INTO payment_methods (
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
        'NGUYEN VAN AN',
        1, -- Default
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added Visa (**** 1234)';
END
ELSE
    PRINT '  ⚠ Visa card already exists';

-- Payment 2: Mastercard
IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = @UserID AND card_number_masked = '**** **** **** 5678')
BEGIN
    INSERT INTO payment_methods (
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
        'NGUYEN VAN AN',
        0, -- Not default
        GETDATE(),
        GETDATE()
    );
    PRINT '  ✓ Added Mastercard (**** 5678)';
END
ELSE
    PRINT '  ⚠ Mastercard already exists';

PRINT '';

-- =============================================
-- 3. SUMMARY
-- =============================================
PRINT '================================';
PRINT 'DATA ADDED SUCCESSFULLY!';
PRINT '================================';
PRINT '';

SELECT 
    u.user_id,
    u.email,
    u.full_name,
    (SELECT COUNT(*) FROM vehicles WHERE user_id = u.user_id) AS vehicles_count,
    (SELECT COUNT(*) FROM payment_methods WHERE user_id = u.user_id) AS payment_methods_count
FROM users u
WHERE u.user_id = @UserID;

PRINT '';
PRINT 'Vehicles:';
SELECT 
    vehicle_id,
    brand + ' ' + model AS vehicle_name,
    license_plate,
    battery_capacity,
    charging_port_type,
    CASE WHEN is_primary = 1 THEN 'Primary' ELSE 'Secondary' END AS status
FROM vehicles
WHERE user_id = @UserID;

PRINT '';
PRINT 'Payment Methods:';
SELECT 
    payment_method_id,
    card_type,
    card_number_masked,
    expiry_date,
    CASE WHEN is_default = 1 THEN 'Default' ELSE 'Not Default' END AS status
FROM payment_methods
WHERE user_id = @UserID;

PRINT '';
PRINT '================================';
PRINT 'Login Credentials:';
PRINT 'Email: nguyenvanan@gmail.com';
PRINT 'Password: Customer123!';
PRINT '================================';
PRINT '';
PRINT 'NOTE: Use the frontend to create bookings';
PRINT 'The booking system has complex relationships with';
PRINT 'stations, slots, posts, and requires QR codes.';
PRINT '================================';

GO
