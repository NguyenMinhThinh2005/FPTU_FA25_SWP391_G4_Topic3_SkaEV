USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Fixing slot/post counts...';

-- Station 1: 25 slots, need 24 (12 posts x 2)
DELETE TOP(1) FROM charging_slots 
WHERE post_id IN (SELECT post_id FROM charging_posts WHERE station_id = 1) 
AND status = 'available';
PRINT 'Station 1: Deleted 1 extra slot';

-- Station 15: Has 14 actual posts but total_posts = 12
UPDATE charging_stations SET total_posts = 14 WHERE station_id = 15;
PRINT 'Station 15: Updated total_posts to 14';

-- Station 21: Has 12 actual posts but total_posts = 10  
UPDATE charging_stations SET total_posts = 12 WHERE station_id = 21;
PRINT 'Station 21: Updated total_posts to 12';

PRINT '✅ Fixed all mismatches!';
GO

-- Verify
SELECT s.station_id, s.station_name, s.total_posts, 
       COUNT(cs.slot_id) as total_slots,
       COUNT(cs.slot_id) - (s.total_posts * 2) as difference
FROM charging_stations s
LEFT JOIN charging_posts cp ON s.station_id = cp.station_id
LEFT JOIN charging_slots cs ON cp.post_id = cs.post_id
WHERE s.station_id IN (1, 15, 21)
GROUP BY s.station_id, s.station_name, s.total_posts;
GO
