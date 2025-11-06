-- =============================================
-- Seed ChargingPosts and ChargingSlots for All Stations
-- Each station gets posts and slots matching total_posts count
-- Rule: Each post has 2 slots (DC posts) or 2 slots (AC posts)
-- =============================================

USE SkaEV_DB;
GO

-- Delete existing posts and slots for stations 2-30 (keep station 1)
DELETE FROM charging_slots WHERE post_id IN (SELECT post_id FROM charging_posts WHERE station_id > 1);
DELETE FROM charging_posts WHERE station_id > 1;
GO

DECLARE @StationId INT;
DECLARE @TotalPosts INT;
DECLARE @PostNumber NVARCHAR(50);
DECLARE @PostId INT;
DECLARE @PostCounter INT;
DECLARE @SlotCounter INT;

-- Cursor to process each station
DECLARE station_cursor CURSOR FOR
SELECT station_id, total_posts 
FROM charging_stations 
WHERE station_id > 1 AND deleted_at IS NULL
ORDER BY station_id;

OPEN station_cursor;
FETCH NEXT FROM station_cursor INTO @StationId, @TotalPosts;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @PostCounter = 1;
    
    -- Create posts for this station (half DC, half AC)
    WHILE @PostCounter <= @TotalPosts
    BEGIN
        SET @PostNumber = 'P' + RIGHT('00' + CAST(@PostCounter AS NVARCHAR), 2);
        
        -- Alternate between DC (fast) and AC (standard) posts
        IF @PostCounter % 2 = 1
        BEGIN
            -- DC Fast Charging Post (50-150 kW)
            INSERT INTO charging_posts (
                station_id, post_number, post_type, power_output, 
                connector_types, total_slots, available_slots, 
                status, created_at, updated_at
            )
            VALUES (
                @StationId, @PostNumber, 'DC', 100.0,
                'CCS2,CHAdeMO', 2, 2,
                'available', GETUTCDATE(), GETUTCDATE()
            );
        END
        ELSE
        BEGIN
            -- AC Standard Charging Post (7-22 kW)
            INSERT INTO charging_posts (
                station_id, post_number, post_type, power_output,
                connector_types, total_slots, available_slots,
                status, created_at, updated_at
            )
            VALUES (
                @StationId, @PostNumber, 'AC', 22.0,
                'Type2', 2, 2,
                'available', GETUTCDATE(), GETUTCDATE()
            );
        END;
        
        -- Get the newly created post_id
        SET @PostId = SCOPE_IDENTITY();
        
        -- Create 2 slots for each post
        SET @SlotCounter = 1;
        WHILE @SlotCounter <= 2
        BEGIN
            DECLARE @ConnectorType NVARCHAR(50);
            DECLARE @MaxPower DECIMAL(10,2);
            
            -- Set connector type based on post type
            IF @PostCounter % 2 = 1
            BEGIN
                -- DC post - alternate between CCS2 and CHAdeMO
                SET @ConnectorType = CASE WHEN @SlotCounter = 1 THEN 'CCS2' ELSE 'CHAdeMO' END;
                SET @MaxPower = 100.0;
            END
            ELSE
            BEGIN
                -- AC post - all Type2
                SET @ConnectorType = 'Type2';
                SET @MaxPower = 22.0;
            END;
            
            INSERT INTO charging_slots (
                post_id, slot_number, connector_type, max_power,
                status, created_at, updated_at
            )
            VALUES (
                @PostId,
                @PostNumber + '-S' + CAST(@SlotCounter AS NVARCHAR),
                @ConnectorType,
                @MaxPower,
                'available',
                GETUTCDATE(),
                GETUTCDATE()
            );
            
            SET @SlotCounter = @SlotCounter + 1;
        END;
        
        SET @PostCounter = @PostCounter + 1;
    END;
    
    FETCH NEXT FROM station_cursor INTO @StationId, @TotalPosts;
END;

CLOSE station_cursor;
DEALLOCATE station_cursor;
GO

-- Verify the results
SELECT 
    s.station_id,
    s.station_name,
    s.total_posts as expected_posts,
    COUNT(DISTINCT p.post_id) as actual_posts,
    COUNT(slot.slot_id) as actual_slots,
    SUM(CASE WHEN slot.status = 'available' THEN 1 ELSE 0 END) as available_slots
FROM charging_stations s
LEFT JOIN charging_posts p ON s.station_id = p.station_id
LEFT JOIN charging_slots slot ON p.post_id = slot.post_id
WHERE s.deleted_at IS NULL
GROUP BY s.station_id, s.station_name, s.total_posts
ORDER BY s.station_id;
GO

PRINT 'Seeding complete! All stations now have posts and slots.';
GO
