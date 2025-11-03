-- Add charging posts and slots for all stations that don't have them yet
-- This script adds a mix of DC fast charging and AC charging to each station

-- Stations 2-30 (excluding 1 and 10 which already have data)
DECLARE @stationId INT
DECLARE @postIdDC INT
DECLARE @postIdAC INT

DECLARE station_cursor CURSOR FOR 
SELECT station_id FROM charging_stations 
WHERE station_id NOT IN (1, 10)
ORDER BY station_id

OPEN station_cursor
FETCH NEXT FROM station_cursor INTO @stationId

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Add DC Fast Charging Post (150kW)
    INSERT INTO charging_posts (station_id, post_number, post_type, power_output, total_slots, available_slots, status)
    VALUES (@stationId, 'POST-DC-01', 'DC', 150, 2, 2, 'available')
    SET @postIdDC = SCOPE_IDENTITY()
    
    -- Add 2 DC slots (CCS2 connector)
    INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power, status)
    VALUES 
        (@postIdDC, 'SLOT-01', 'CCS2', 150, 'available'),
        (@postIdDC, 'SLOT-02', 'CCS2', 150, 'available')
    
    -- Add AC Charging Post (7kW)
    INSERT INTO charging_posts (station_id, post_number, post_type, power_output, total_slots, available_slots, status)
    VALUES (@stationId, 'POST-AC-01', 'AC', 7, 2, 2, 'available')
    SET @postIdAC = SCOPE_IDENTITY()
    
    -- Add 2 AC slots (Type 2 connector)
    INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power, status)
    VALUES 
        (@postIdAC, 'SLOT-01', 'Type 2', 7, 'available'),
        (@postIdAC, 'SLOT-02', 'Type 2', 7, 'available')
    
    PRINT 'Added charging infrastructure for station_id: ' + CAST(@stationId AS VARCHAR)
    
    FETCH NEXT FROM station_cursor INTO @stationId
END

CLOSE station_cursor
DEALLOCATE station_cursor

-- Verify results
SELECT 
    s.station_id,
    s.station_name,
    COUNT(DISTINCT p.post_id) as total_posts,
    COUNT(cs.slot_id) as total_slots
FROM charging_stations s
LEFT JOIN charging_posts p ON s.station_id = p.station_id
LEFT JOIN charging_slots cs ON p.post_id = cs.post_id
GROUP BY s.station_id, s.station_name
ORDER BY s.station_id
