SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO
PRINT 'Step 2/7: Creating 40 new vehicles...';
GO
SET IDENTITY_INSERT vehicles ON;
GO
DECLARE @StartVehicleId INT;
SELECT @StartVehicleId = ISNULL(MAX(vehicle_id), 0) + 1 FROM vehicles;
DECLARE @VehicleCounter INT = 0;

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

DECLARE @CustomerIds TABLE (UserId INT);
INSERT INTO @CustomerIds 
SELECT user_id FROM users 
WHERE role = 'customer' AND user_id NOT IN (1, 2) 
ORDER BY user_id;

DECLARE @TotalCustomers INT = (SELECT COUNT(*) FROM @CustomerIds);
DECLARE @VehiclesNeeded INT = 40;

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
    SET @VehicleUserId = (SELECT TOP 1 UserId FROM @CustomerIds ORDER BY NEWID());
    SELECT TOP 1 @VehicleBrand = Brand, @VehicleModel = Model, @BatteryCapacity = BatteryCapacity, @PortType = PortType
    FROM @VehicleModels ORDER BY NEWID();
    DECLARE @CityCode NVARCHAR(5) = (SELECT TOP 1 Code FROM (VALUES ('29'), ('30'), ('51'), ('59'), ('60'), ('43')) AS Codes(Code) ORDER BY NEWID());
    DECLARE @LetterCode NVARCHAR(2) = (SELECT TOP 1 Letter FROM (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H')) AS Letters(Letter) ORDER BY NEWID());
    SET @LicensePlate = @CityCode + @LetterCode + '-' + RIGHT('00000', 5 - LEN(CAST((ABS(CHECKSUM(NEWID())) % 99999 + 1) AS VARCHAR))) + CAST((ABS(CHECKSUM(NEWID())) % 99999 + 1) AS VARCHAR);
    SET @IsPrimary = CASE WHEN NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @VehicleUserId) THEN 1 ELSE 0 END;
    SET @VehicleCreated = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 180, GETDATE());
        INSERT INTO vehicles (vehicle_id, user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
        VALUES (@StartVehicleId + @VehicleCounter, @VehicleUserId, N'car', @VehicleBrand, @VehicleModel, @LicensePlate, @BatteryCapacity, @PortType, @IsPrimary, @VehicleCreated, @VehicleCreated);
    SET @VehicleCounter = @VehicleCounter + 1;
    SET @j = @j + 1;
END

PRINT 'Created ' + CAST(@VehicleCounter AS VARCHAR) + ' new vehicles';
SET IDENTITY_INSERT vehicles OFF;
GO
