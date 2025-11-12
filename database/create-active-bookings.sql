-- Create active bookings for all occupied slots
USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
GO

DECLARE @CustomerId INT;
DECLARE @SlotId INT;
DECLARE @StationId INT;
DECLARE @PostId INT;
DECLARE @VehicleId INT;
DECLARE @StartTime DATETIME;
DECLARE @EstimatedDuration INT;
DECLARE @Counter INT = 0;

-- Get first vehicle ID or create one
SELECT TOP 1 @VehicleId = vehicle_id FROM vehicles;

IF @VehicleId IS NULL
BEGIN
    -- Get first customer
    SELECT TOP 1 @CustomerId = user_id FROM users WHERE role = 'customer';
    
    IF @CustomerId IS NOT NULL
    BEGIN
        -- Create a demo vehicle
        INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
        VALUES (@CustomerId, 'car', 'VinFast', 'VF 8', 'Demo-Vehicle', 87.7, 'CCS2', 1, GETUTCDATE(), GETUTCDATE());
        
        SET @VehicleId = SCOPE_IDENTITY();
        PRINT 'Created demo vehicle with ID: ' + CAST(@VehicleId AS NVARCHAR);
    END
END

PRINT 'Using vehicle_id: ' + CAST(@VehicleId AS NVARCHAR);
PRINT 'Creating bookings for occupied slots...';
PRINT '';

-- Cursor for occupied slots
DECLARE slot_cursor CURSOR FOR
SELECT cs.slot_id, cp.station_id, cp.post_id
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
WHERE cs.status = 'occupied'
ORDER BY cs.slot_id;

OPEN slot_cursor;
FETCH NEXT FROM slot_cursor INTO @SlotId, @StationId, @PostId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Get a random customer
    SELECT TOP 1 @CustomerId = user_id FROM users WHERE role = 'customer' ORDER BY NEWID();
    
    -- Random start time within last 3 hours
    SET @StartTime = DATEADD(MINUTE, -ABS(CHECKSUM(NEWID()) % 180), GETUTCDATE());
    
    -- Estimated duration 30-120 minutes
    SET @EstimatedDuration = 30 + ABS(CHECKSUM(NEWID()) % 90);
    
    -- Create booking with status 'in_progress'
    INSERT INTO bookings (
        user_id, slot_id, vehicle_id, station_id,
        scheduling_type, scheduled_start_time, actual_start_time,
        estimated_duration, status, target_soc,
        created_at, updated_at
    )
    VALUES (
        @CustomerId,
        @SlotId,
        @VehicleId,
        @StationId,
        'scheduled',
        @StartTime,
        @StartTime,
        @EstimatedDuration,
        'in_progress',  -- IMPORTANT: Must be 'in_progress' for activeSessions count
        80.0,
        @StartTime,
        GETUTCDATE()
    );
    
    -- Update slot current_booking_id
    UPDATE charging_slots
    SET current_booking_id = SCOPE_IDENTITY(),
        updated_at = GETUTCDATE()
    WHERE slot_id = @SlotId;
    
    SET @Counter = @Counter + 1;
    
    IF @Counter % 20 = 0
        PRINT 'Created ' + CAST(@Counter AS NVARCHAR) + ' active bookings...';
    
    FETCH NEXT FROM slot_cursor INTO @SlotId, @StationId, @PostId;
END

CLOSE slot_cursor;
DEALLOCATE slot_cursor;

PRINT '';
PRINT '✅ Successfully created ' + CAST(@Counter AS NVARCHAR) + ' active bookings with status = in_progress!';
PRINT '';

-- Verify results
SELECT 
    s.station_name,
    s.city,
    COUNT(b.booking_id) as 'Active Bookings',
    s.total_posts as 'Total Posts',
    (SELECT COUNT(*) FROM charging_slots cs 
     INNER JOIN charging_posts cp ON cs.post_id = cp.post_id 
     WHERE cp.station_id = s.station_id) as 'Total Slots',
    (SELECT COUNT(*) FROM charging_slots cs 
     INNER JOIN charging_posts cp ON cs.post_id = cp.post_id 
     WHERE cp.station_id = s.station_id AND cs.status = 'occupied') as 'Occupied Slots'
FROM charging_stations s
LEFT JOIN bookings b ON s.station_id = b.station_id AND b.status = 'in_progress'
GROUP BY s.station_id, s.station_name, s.city, s.total_posts
HAVING COUNT(b.booking_id) > 0
ORDER BY COUNT(b.booking_id) DESC;

GO
