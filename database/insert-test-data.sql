-- Insert test data for SkaEV_DB
USE [SkaEV_DB];
GO

-- Insert test vehicle for user (assuming user_id = 1 exists from registration)
IF NOT EXISTS (SELECT 1 FROM vehicles WHERE vehicle_id = 1)
BEGIN
    INSERT INTO vehicles (user_id, vehicle_type, battery_capacity, license_plate, created_at)
    VALUES (1, 'Tesla Model 3', 60.0, 'ABC-1234', GETUTCDATE());
    PRINT 'Test vehicle inserted';
END
ELSE
BEGIN
    PRINT 'Test vehicle already exists';
END
GO

-- Insert test charging slots for station_id = 1
-- First check if charging_posts exist for station_id = 1
IF EXISTS (SELECT 1 FROM charging_posts WHERE station_id = 1)
BEGIN
    DECLARE @post_id INT;
    SELECT TOP 1 @post_id = post_id FROM charging_posts WHERE station_id = 1;
    
    -- Insert slots if they don't exist
    IF NOT EXISTS (SELECT 1 FROM charging_slots WHERE post_id = @post_id)
    BEGIN
        INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power, status, created_at)
        VALUES 
            (@post_id, 'A1', 'CCS2', 150.0, 'available', GETUTCDATE()),
            (@post_id, 'A2', 'CCS2', 150.0, 'available', GETUTCDATE()),
            (@post_id, 'A3', 'Type 2', 50.0, 'available', GETUTCDATE());
        PRINT 'Test charging slots inserted for post_id: ' + CAST(@post_id AS NVARCHAR);
    END
    ELSE
    BEGIN
        PRINT 'Charging slots already exist';
    END
END
ELSE
BEGIN
    PRINT 'No charging posts found for station_id = 1. Creating posts first...';
    
    -- Insert a test charging post
    INSERT INTO charging_posts (station_id, post_number, post_type, power_output, connector_types, total_slots, available_slots, status, created_at, updated_at)
    VALUES (1, 'POST-01', 'DC', 150.0, 'CCS2,CHAdeMO', 3, 3, 'active', GETUTCDATE(), GETUTCDATE());
    
    DECLARE @new_post_id INT = SCOPE_IDENTITY();
    
    -- Insert slots for the new post
    INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power, status, created_at)
    VALUES 
        (@new_post_id, 'A1', 'CCS2', 150.0, 'available', GETUTCDATE()),
        (@new_post_id, 'A2', 'CCS2', 150.0, 'available', GETUTCDATE()),
        (@new_post_id, 'A3', 'Type 2', 50.0, 'available', GETUTCDATE());
    
    PRINT 'Created new charging post and slots';
END
GO

-- Verify the data
SELECT 'Vehicles' AS TableName, COUNT(*) AS RecordCount FROM vehicles;
SELECT 'Charging Slots' AS TableName, COUNT(*) AS RecordCount FROM charging_slots;
SELECT 'Charging Posts' AS TableName, COUNT(*) AS RecordCount FROM charging_posts;
GO

-- Show available slots
SELECT 
    cs.slot_id,
    cs.post_id,
    cs.slot_number,
    cs.connector_type,
    cs.max_power,
    cs.status,
    cp.station_id
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
WHERE cs.status = 'available';
GO
