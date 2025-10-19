-- =============================================
-- Add Vehicles for User: nguyenvanan@gmail.com
-- Using CORRECT schema from database
-- =============================================

USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
GO

DECLARE @UserID INT = (SELECT user_id FROM users WHERE email = 'nguyenvanan@gmail.com');

IF @UserID IS NULL
BEGIN
    PRINT 'ERROR: User not found!';
    RETURN;
END

PRINT 'Adding vehicles for User ID: ' + CAST(@UserID AS VARCHAR(10));
PRINT '';

-- Vehicle 1: Tesla Model 3
IF NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @UserID AND license_plate = '30A-12345')
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
        'car',
        'Tesla',
        'Model 3 Long Range',
        '30A-12345',
        75.00,
        'Type 2',
        1,
        GETDATE(),
        GETDATE()
    );
    PRINT '✓ Added Tesla Model 3 (30A-12345)';
END
ELSE
    PRINT '⚠ Tesla Model 3 already exists';

-- Vehicle 2: VinFast VF8
IF NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @UserID AND license_plate = '29B-67890')
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
        'car',
        'VinFast',
        'VF8 Plus',
        '29B-67890',
        87.70,
        'CCS2',
        0,
        GETDATE(),
        GETDATE()
    );
    PRINT '✓ Added VinFast VF8 (29B-67890)';
END
ELSE
    PRINT '⚠ VinFast VF8 already exists';

PRINT '';
PRINT 'Vehicles added successfully!';
PRINT '';

-- Show results
SELECT 
    vehicle_id,
    brand + ' ' + model AS vehicle_name,
    license_plate,
    battery_capacity,
    charging_port_type,
    CASE WHEN is_primary = 1 THEN 'Primary' ELSE 'Secondary' END AS vehicle_status
FROM vehicles
WHERE user_id = @UserID;

GO
