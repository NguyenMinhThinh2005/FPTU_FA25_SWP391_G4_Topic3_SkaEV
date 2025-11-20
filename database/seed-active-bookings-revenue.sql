-- =============================================
-- Seed Active Bookings and Revenue Data
-- Create diverse active charging sessions across all stations
-- This will populate activeSessions and todayRevenue for Dashboard
-- =============================================

USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
GO

-- First, let's check if we have customers
IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'customer' AND deleted_at IS NULL)
BEGIN
    PRINT 'No customers found. Please seed users first.';
    RETURN;
END
GO

-- Variables
DECLARE @CustomerId INT;
DECLARE @SlotId INT;
DECLARE @StationId INT;
DECLARE @PostId INT;
DECLARE @MaxPower DECIMAL(10,2);
DECLARE @BookingId INT;
DECLARE @StartTime DATETIME;
DECLARE @EstimatedEndTime DATETIME;
DECLARE @Counter INT = 0;
DECLARE @MaxBookings INT = 50; -- Create 50 active bookings

-- Temporary table to store available slots
CREATE TABLE #AvailableSlots (
    SlotId INT,
    StationId INT,
    PostId INT,
    MaxPower DECIMAL(10,2)
);

-- Get all available slots from active stations
INSERT INTO #AvailableSlots (SlotId, StationId, PostId, MaxPower)
SELECT TOP 100
    cs.slot_id,
    cp.station_id,
    cs.post_id,
    cs.max_power
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
INNER JOIN charging_stations station ON cp.station_id = station.station_id
WHERE cs.status = 'available'
    AND cp.status = 'available'
    AND station.status = 'active'
    AND station.deleted_at IS NULL
ORDER BY NEWID(); -- Random order

-- Cursor for customers
DECLARE @CustomerIds TABLE (UserId INT);
INSERT INTO @CustomerIds
SELECT TOP 50 user_id 
FROM users 
WHERE role = 'customer' AND deleted_at IS NULL
ORDER BY NEWID();

PRINT 'Creating active bookings...';

DECLARE booking_cursor CURSOR FOR
SELECT SlotId, StationId, PostId, MaxPower FROM #AvailableSlots;

OPEN booking_cursor;
FETCH NEXT FROM booking_cursor INTO @SlotId, @StationId, @PostId, @MaxPower;

WHILE @@FETCH_STATUS = 0 AND @Counter < @MaxBookings
BEGIN
    -- Get a random customer
    SELECT TOP 1 @CustomerId = UserId FROM @CustomerIds ORDER BY NEWID();
    
    -- Random start time within last 4 hours
    SET @StartTime = DATEADD(MINUTE, -ABS(CHECKSUM(NEWID()) % 240), GETUTCDATE());
    
    -- Estimated end time 30-120 minutes from start
    SET @EstimatedEndTime = DATEADD(MINUTE, 30 + ABS(CHECKSUM(NEWID()) % 90), @StartTime);
    
    -- Create booking
    INSERT INTO bookings (
        user_id, slot_id, vehicle_id, station_id,
        scheduling_type, scheduled_start_time, actual_start_time,
        estimated_duration, status,
        created_at, updated_at
    )
    VALUES (
        @CustomerId,
        @SlotId,
        NULL, -- No vehicle tracking for now
        @StationId,
        'instant', -- Instant booking
        @StartTime,
        @StartTime, -- Already started
        DATEDIFF(MINUTE, @StartTime, @EstimatedEndTime), -- Duration in minutes
        'in_progress', -- Active charging session
        @StartTime,
        GETUTCDATE()
    );
    
    SET @BookingId = SCOPE_IDENTITY();
    
    -- Update slot status to occupied
    UPDATE charging_slots
    SET status = 'occupied',
        current_booking_id = @BookingId,
        updated_at = GETUTCDATE()
    WHERE slot_id = @SlotId;
    
    -- Update post available slots count
    UPDATE charging_posts
    SET available_slots = (
        SELECT COUNT(*) 
        FROM charging_slots 
        WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @SlotId)
        AND status = 'available'
    ),
    updated_at = GETUTCDATE()
    WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @SlotId);
    
    -- Update station available posts count
    UPDATE charging_stations
    SET available_posts = (
        SELECT COUNT(DISTINCT cp.post_id)
        FROM charging_posts cp
        INNER JOIN charging_slots cs ON cp.post_id = cs.post_id
        WHERE cp.station_id = @StationId
        AND cp.status = 'available'
        AND cs.status = 'available'
    ),
    updated_at = GETUTCDATE()
    WHERE station_id = @StationId;
    
    SET @Counter = @Counter + 1;
    
    IF @Counter % 10 = 0
        PRINT 'Created ' + CAST(@Counter AS NVARCHAR) + ' active bookings...';
    
    FETCH NEXT FROM booking_cursor INTO @SlotId, @StationId, @PostId, @MaxPower;
END

CLOSE booking_cursor;
DEALLOCATE booking_cursor;

DROP TABLE #AvailableSlots;

PRINT '✅ Successfully created ' + CAST(@Counter AS NVARCHAR) + ' active charging sessions!';

-- Show summary
SELECT 
    cs.station_name AS 'Station',
    cs.city AS 'City',
    cs.status AS 'Status',
    COUNT(b.booking_id) AS 'Active Sessions',
    cs.total_posts AS 'Total Posts',
    cs.total_posts * 2 AS 'Total Slots (Posts x 2)',
    cs.available_posts AS 'Available Posts'
FROM charging_stations cs
LEFT JOIN bookings b ON cs.station_id = b.station_id 
    AND b.status = 'in_progress' 
    AND b.deleted_at IS NULL
WHERE cs.deleted_at IS NULL
GROUP BY cs.station_id, cs.station_name, cs.city, cs.status, cs.total_posts, cs.available_posts
ORDER BY COUNT(b.booking_id) DESC;

GO
