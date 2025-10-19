-- =============================================
-- SIMPLE METHOD: Use Backend Register API
-- =============================================
-- Instead of manually inserting, use the register endpoint:
-- POST http://localhost:5000/api/auth/register
-- Body:
-- {
--   "email": "nguyenvanan@gmail.com",
--   "password": "Customer123!",
--   "fullName": "Nguyễn Văn An",
--   "phoneNumber": "0123456789",
--   "role": "Customer"
-- }

-- =============================================
-- ALTERNATIVE: Add user with pre-hashed password
-- =============================================
-- Password: Customer123!
-- BCrypt Hash (generated with BCrypt.Net default cost 11):
-- You need to generate this hash first using the backend

USE SkaEV_DB;
GO

DECLARE @Password VARCHAR(100) = 'Customer123!';
DECLARE @PasswordHash VARCHAR(255);

-- OPTION 1: If you have the hash from backend generator
SET @PasswordHash = '$2a$11$PLACEHOLDER_REPLACE_WITH_REAL_BCRYPT_HASH_FROM_BACKEND';

-- Check if user exists
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'nguyenvanan@gmail.com')
BEGIN
    PRINT 'Adding user: nguyenvanan@gmail.com';
    
    DECLARE @NewUserID UNIQUEIDENTIFIER = NEWID();
    
    -- Insert User
    INSERT INTO Users (
        UserID,
        FullName,
        Email,
        PhoneNumber,
        PasswordHash,
        Role,
        IsActive,
        EmailVerified,
        CreatedAt,
        UpdatedAt
    )
    VALUES (
        @NewUserID,
        N'Nguyễn Văn An',
        'nguyenvanan@gmail.com',
        '0123456789',
        @PasswordHash,
        'Customer',
        1, -- IsActive
        1, -- EmailVerified
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'User created with ID: ' + CAST(@NewUserID AS VARCHAR(50));
    
    -- Add sample vehicle
    INSERT INTO Vehicles (
        VehicleID,
        UserID,
        LicensePlate,
        VehicleName,
        VehicleModel,
        BatteryCapacity,
        CurrentSOC,
        ChargingStatus,
        CreatedAt,
        UpdatedAt
    )
    VALUES (
        NEWID(),
        @NewUserID,
        N'30A-12345',
        N'Tesla Model 3',
        N'Tesla Model 3 Long Range',
        75.0, -- Battery capacity in kWh
        45.5, -- Current State of Charge
        'Not Charging',
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Sample vehicle added';
    
    -- Add sample payment method
    INSERT INTO PaymentMethods (
        PaymentMethodID,
        UserID,
        CardType,
        CardNumberMasked,
        ExpiryDate,
        CardHolderName,
        IsDefault,
        CreatedAt,
        UpdatedAt
    )
    VALUES (
        NEWID(),
        @NewUserID,
        'Visa',
        '**** **** **** 1234',
        '2026-12-31',
        N'NGUYEN VAN AN',
        1, -- IsDefault
        GETDATE(),
        GETDATE()
    );
    
    PRINT 'Sample payment method added';
    
    PRINT '';
    PRINT '================================';
    PRINT 'User created successfully!';
    PRINT 'Email: nguyenvanan@gmail.com';
    PRINT 'Password: Customer123!';
    PRINT '================================';
END
ELSE
BEGIN
    PRINT 'User nguyenvanan@gmail.com already exists.';
    PRINT 'Existing UserID: ' + CAST((SELECT UserID FROM Users WHERE Email = 'nguyenvanan@gmail.com') AS VARCHAR(50));
END
GO

-- Display user info
SELECT 
    UserID,
    FullName,
    Email,
    PhoneNumber,
    Role,
    IsActive,
    EmailVerified,
    CreatedAt
FROM Users
WHERE Email = 'nguyenvanan@gmail.com';
