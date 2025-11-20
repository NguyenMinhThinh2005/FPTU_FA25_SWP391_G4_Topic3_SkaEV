-- Idempotent seed script for minimal required data to exercise backend/frontend flows.
-- Run after applying migrations that add deleted_at columns.
-- Adjust IDs and values to match your environment if necessary.

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Ensure admin user exists
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES ('admin@example.com', 'PLACEHOLDER_HASH', 'Admin User', '0000000000', 'admin', 1, GETUTCDATE(), GETUTCDATE());
END

-- Ensure a test station exists
IF NOT EXISTS (SELECT 1 FROM charging_stations WHERE station_name = 'Demo Station')
BEGIN
    INSERT INTO charging_stations (station_name, address, city, latitude, longitude, total_posts, available_posts, status, created_at, updated_at)
    VALUES ('Demo Station', '123 Demo St', 'DemoCity', 10.762622, 106.660172, 0, 0, 'active', GETUTCDATE(), GETUTCDATE());
END

-- Create posts and slots for the Demo Station if none exist
DECLARE @StationId INT = (SELECT TOP 1 station_id FROM charging_stations WHERE station_name = 'Demo Station');

IF NOT EXISTS (SELECT 1 FROM charging_posts WHERE station_id = @StationId)
BEGIN
    INSERT INTO charging_posts (station_id, post_number, post_type, power_output, connector_types, total_slots, available_slots, status, created_at, updated_at)
    VALUES (@StationId, 'DC-01', 'DC', 120.00, '["CCS"]', 2, 2, 'available', GETUTCDATE(), GETUTCDATE());

    INSERT INTO charging_posts (station_id, post_number, post_type, power_output, connector_types, total_slots, available_slots, status, created_at, updated_at)
    VALUES (@StationId, 'AC-01', 'AC', 22.00, '["Type2"]', 2, 2, 'available', GETUTCDATE(), GETUTCDATE());
END

-- Create slots for posts if none exist
DECLARE @PostId INT = (SELECT TOP 1 post_id FROM charging_posts WHERE station_id = @StationId);
IF NOT EXISTS (SELECT 1 FROM charging_slots WHERE post_id IN (SELECT post_id FROM charging_posts WHERE station_id = @StationId))
BEGIN
    INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power, status, created_at, updated_at)
    SELECT post_id, CONCAT(post_type, '-01'), CASE WHEN post_type = 'DC' THEN 'CCS' ELSE 'Type2' END, CASE WHEN post_type = 'DC' THEN 120.00 ELSE 22.00 END, 'available', GETUTCDATE(), GETUTCDATE()
    FROM charging_posts WHERE station_id = @StationId;

    INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power, status, created_at, updated_at)
    SELECT post_id, CONCAT(post_type, '-02'), CASE WHEN post_type = 'DC' THEN 'CCS' ELSE 'Type2' END, CASE WHEN post_type = 'DC' THEN 120.00 ELSE 22.00 END, 'available', GETUTCDATE(), GETUTCDATE()
    FROM charging_posts WHERE station_id = @StationId;
END

-- Ensure a sample user exists
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@example.com')
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES ('user@example.com', 'PLACEHOLDER_HASH', 'Demo User', '0111111111', 'user', 1, GETUTCDATE(), GETUTCDATE());
END

-- Create a completed booking to allow review creation for test user
DECLARE @UserId INT = (SELECT TOP 1 user_id FROM users WHERE email = 'user@example.com');
DECLARE @SlotId INT = (SELECT TOP 1 slot_id FROM charging_slots WHERE status = 'available');
IF NOT EXISTS (SELECT 1 FROM bookings WHERE user_id = @UserId AND station_id = @StationId AND status = 'completed')
BEGIN
    INSERT INTO bookings (user_id, vehicle_id, slot_id, station_id, scheduling_type, scheduled_start_time, actual_start_time, actual_end_time, status, created_at, updated_at)
    VALUES (@UserId, NULL, @SlotId, @StationId, 'ad_hoc', GETUTCDATE(), DATEADD(MINUTE, -60, GETUTCDATE()), DATEADD(MINUTE, -30, GETUTCDATE()), 'completed', GETUTCDATE(), GETUTCDATE());
END

COMMIT TRANSACTION;
GO

-- Note: Replace the placeholder password hashes with properly hashed values when seeding into production DB.
