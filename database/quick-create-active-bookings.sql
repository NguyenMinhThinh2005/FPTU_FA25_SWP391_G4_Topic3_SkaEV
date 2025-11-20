USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
GO

-- Quick create 80 active bookings distributed across stations
DECLARE @i INT = 1;
DECLARE @userId INT;
DECLARE @vehicleId INT;
DECLARE @slotId INT;
DECLARE @stationId INT;
DECLARE @startTime DATETIME;

-- Get first vehicle
SELECT TOP 1 @vehicleId = vehicle_id FROM vehicles;

PRINT '🚀 Creating 80 active bookings...';

WHILE @i <= 80
BEGIN
    -- Random user
    SELECT TOP 1 @userId = user_id FROM users WHERE role = 'customer' ORDER BY NEWID();
    
    -- Random available slot
    SELECT TOP 1 @slotId = cs.slot_id, @stationId = cp.station_id
    FROM charging_slots cs
    INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
    WHERE cs.status = 'available'
    ORDER BY NEWID();
    
    IF @slotId IS NOT NULL
    BEGIN
        -- Random start time in last 2 hours
        SET @startTime = DATEADD(MINUTE, -ABS(CHECKSUM(NEWID()) % 120), GETUTCDATE());
        
        -- Create booking
        INSERT INTO bookings (
            user_id, slot_id, vehicle_id, station_id,
            scheduling_type, scheduled_start_time, actual_start_time,
            estimated_duration, status, target_soc,
            created_at, updated_at
        )
        VALUES (
            @userId, @slotId, @vehicleId, @stationId,
            'scheduled', @startTime, @startTime,
            60 + (ABS(CHECKSUM(NEWID()) % 60)), -- 60-120 minutes
            'in_progress',
            80.0,
            @startTime, GETUTCDATE()
        );
        
        -- Update slot status
        UPDATE charging_slots 
        SET status = 'occupied', 
            current_booking_id = SCOPE_IDENTITY(),
            updated_at = GETUTCDATE()
        WHERE slot_id = @slotId;
    END
    
    SET @i = @i + 1;
END

PRINT '✅ Created 80 active bookings!';
GO

-- Verify
SELECT s.station_name, COUNT(b.booking_id) as active_count
FROM charging_stations s
INNER JOIN bookings b ON s.station_id = b.station_id
WHERE b.status = 'in_progress' AND b.deleted_at IS NULL
GROUP BY s.station_id, s.station_name
ORDER BY COUNT(b.booking_id) DESC;
GO
