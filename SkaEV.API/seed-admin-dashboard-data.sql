-- Seed data for Admin Dashboard (Users, Stations, Bookings, Invoices, Logs)
-- Run this script to populate the database with realistic data for testing charts.
-- REVISED SCHEMA: snake_case for most, PascalCase for WalletBalance.

SET QUOTED_IDENTIFIER ON;
GO
USE SkaEV_DB;
GO

-- CLEANUP (Optional: Comment out if you want to append)
DELETE FROM system_logs;
DELETE FROM invoices;
DELETE FROM bookings;
DELETE FROM charging_slots;
DELETE FROM charging_posts;
DELETE FROM charging_stations;
DELETE FROM vehicles;
DELETE FROM users WHERE email LIKE 'customer%@example.com'; -- Only delete our test users

-- 1. Seed Users (Customers)
-- Note: No 'username' column, using 'email' as unique identifier if needed.
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'customer1@example.com')
BEGIN
    INSERT INTO users (password_hash, email, full_name, role, phone_number, is_active, created_at, updated_at, WalletBalance)
    VALUES 
    ('hashed_password', 'customer1@example.com', 'Nguyen Van A', 'Customer', '0901234567', 1, DATEADD(day, -30, GETDATE()), GETDATE(), 500000),
    ('hashed_password', 'customer2@example.com', 'Tran Thi B', 'Customer', '0901234568', 1, DATEADD(day, -25, GETDATE()), GETDATE(), 200000),
    ('hashed_password', 'customer3@example.com', 'Le Van C', 'Customer', '0901234569', 1, DATEADD(day, -20, GETDATE()), GETDATE(), 0),
    ('hashed_password', 'customer4@example.com', 'Pham Thi D', 'Customer', '0901234570', 1, DATEADD(day, -15, GETDATE()), GETDATE(), 1000000),
    ('hashed_password', 'customer5@example.com', 'Hoang Van E', 'Customer', '0901234571', 1, DATEADD(day, -10, GETDATE()), GETDATE(), 150000);
END

-- 2. Seed Stations
INSERT INTO charging_stations (station_name, address, city, latitude, longitude, status, operating_hours, created_at, updated_at)
VALUES 
('Station District 1', '123 Le Loi, District 1, HCMC', 'Ho Chi Minh City', 10.7769, 106.7009, 'Active', '06:00-22:00', GETDATE(), GETDATE()),
('Station District 7', '456 Nguyen Van Linh, District 7, HCMC', 'Ho Chi Minh City', 10.7326, 106.7086, 'Active', '00:00-23:59', GETDATE(), GETDATE()),
('Station Thu Duc', '789 Vo Van Ngan, Thu Duc, HCMC', 'Ho Chi Minh City', 10.8500, 106.7600, 'Maintenance', '07:00-21:00', GETDATE(), GETDATE());

-- Get IDs of inserted stations
DECLARE @Station1Id INT = (SELECT TOP 1 station_id FROM charging_stations WHERE station_name = 'Station District 1');
DECLARE @Station2Id INT = (SELECT TOP 1 station_id FROM charging_stations WHERE station_name = 'Station District 7');
DECLARE @Station3Id INT = (SELECT TOP 1 station_id FROM charging_stations WHERE station_name = 'Station Thu Duc');

-- 3. Seed Posts and Slots
-- Station 1
INSERT INTO charging_posts (station_id, post_number, status, power_output, connector_types, post_type, created_at, updated_at) VALUES (@Station1Id, 'Post 1-A', 'available', 22.0, 'Type 2', 'AC', GETDATE(), GETDATE());
DECLARE @Post1AId INT = SCOPE_IDENTITY();
INSERT INTO charging_slots (post_id, slot_number, status, connector_type, max_power, created_at, updated_at) VALUES (@Post1AId, 'Slot 1', 'available', 'Type 2', 22.0, GETDATE(), GETDATE()), (@Post1AId, 'Slot 2', 'available', 'Type 2', 22.0, GETDATE(), GETDATE());

INSERT INTO charging_posts (station_id, post_number, status, power_output, connector_types, post_type, created_at, updated_at) VALUES (@Station1Id, 'Post 1-B', 'available', 22.0, 'Type 2', 'AC', GETDATE(), GETDATE());
DECLARE @Post1BId INT = SCOPE_IDENTITY();
INSERT INTO charging_slots (post_id, slot_number, status, connector_type, max_power, created_at, updated_at) VALUES (@Post1BId, 'Slot 3', 'available', 'Type 2', 22.0, GETDATE(), GETDATE()), (@Post1BId, 'Slot 4', 'available', 'Type 2', 22.0, GETDATE(), GETDATE());

-- Station 2
INSERT INTO charging_posts (station_id, post_number, status, power_output, connector_types, post_type, created_at, updated_at) VALUES (@Station2Id, 'Post 2-A', 'available', 60.0, 'CCS2', 'DC', GETDATE(), GETDATE());
DECLARE @Post2AId INT = SCOPE_IDENTITY();
INSERT INTO charging_slots (post_id, slot_number, status, connector_type, max_power, created_at, updated_at) VALUES (@Post2AId, 'Slot 1', 'available', 'CCS2', 60.0, GETDATE(), GETDATE()), (@Post2AId, 'Slot 2', 'occupied', 'CCS2', 60.0, GETDATE(), GETDATE());

-- 4. Seed Vehicles
DECLARE @User1Id INT = (SELECT TOP 1 user_id FROM users WHERE email = 'customer1@example.com');
DECLARE @User2Id INT = (SELECT TOP 1 user_id FROM users WHERE email = 'customer2@example.com');

INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, vehicle_name, created_at, updated_at)
VALUES 
(@User1Id, 'Car', 'VinFast', 'VF8', '51H-12345', 82.0, 'CCS2', 1, 'My VF8', GETDATE(), GETDATE()),
(@User2Id, 'Car', 'Tesla', 'Model 3', '51H-67890', 75.0, 'CCS2', 1, 'My Tesla', GETDATE(), GETDATE());

DECLARE @Vehicle1Id INT = (SELECT TOP 1 vehicle_id FROM vehicles WHERE license_plate = '51H-12345');
DECLARE @Vehicle2Id INT = (SELECT TOP 1 vehicle_id FROM vehicles WHERE license_plate = '51H-67890');

-- 5. Seed Bookings (Past 30 days)
DECLARE @Slot1Id INT = (SELECT TOP 1 slot_id FROM charging_slots WHERE slot_number = 'Slot 1' AND post_id = @Post1AId);

-- Completed bookings
-- Note: bookings table has scheduled_start_time, actual_end_time, status.
INSERT INTO bookings (user_id, vehicle_id, slot_id, station_id, scheduling_type, scheduled_start_time, actual_end_time, status, created_at, updated_at)
VALUES 
(@User1Id, @Vehicle1Id, @Slot1Id, @Station1Id, 'qr_immediate', DATEADD(day, -28, GETDATE()), DATEADD(minute, 60, DATEADD(day, -28, GETDATE())), 'completed', DATEADD(day, -28, GETDATE()), DATEADD(day, -28, GETDATE())),
(@User2Id, @Vehicle2Id, @Slot1Id, @Station1Id, 'qr_immediate', DATEADD(day, -25, GETDATE()), DATEADD(minute, 120, DATEADD(day, -25, GETDATE())), 'completed', DATEADD(day, -25, GETDATE()), DATEADD(day, -25, GETDATE())),
(@User1Id, @Vehicle1Id, @Slot1Id, @Station1Id, 'qr_immediate', DATEADD(day, -20, GETDATE()), DATEADD(minute, 30, DATEADD(day, -20, GETDATE())), 'completed', DATEADD(day, -20, GETDATE()), DATEADD(day, -20, GETDATE())),
(@User2Id, @Vehicle2Id, @Slot1Id, @Station1Id, 'qr_immediate', DATEADD(day, -10, GETDATE()), DATEADD(minute, 90, DATEADD(day, -10, GETDATE())), 'completed', DATEADD(day, -10, GETDATE()), DATEADD(day, -10, GETDATE())),
(@User1Id, @Vehicle1Id, @Slot1Id, @Station1Id, 'qr_immediate', DATEADD(day, -5, GETDATE()), DATEADD(minute, 45, DATEADD(day, -5, GETDATE())), 'completed', DATEADD(day, -5, GETDATE()), DATEADD(day, -5, GETDATE())),
(@User1Id, @Vehicle1Id, @Slot1Id, @Station1Id, 'qr_immediate', DATEADD(day, -1, GETDATE()), DATEADD(minute, 60, DATEADD(day, -1, GETDATE())), 'completed', DATEADD(day, -1, GETDATE()), DATEADD(day, -1, GETDATE()));

-- Pending/Cancelled bookings
INSERT INTO bookings (user_id, vehicle_id, slot_id, station_id, scheduling_type, scheduled_start_time, actual_end_time, status, created_at, updated_at)
VALUES 
(@User2Id, @Vehicle2Id, @Slot1Id, @Station1Id, 'scheduled', DATEADD(hour, 2, GETDATE()), DATEADD(hour, 3, GETDATE()), 'scheduled', GETDATE(), GETDATE()),
(@User1Id, @Vehicle1Id, @Slot1Id, @Station1Id, 'scheduled', DATEADD(day, -2, GETDATE()), DATEADD(minute, 60, DATEADD(day, -2, GETDATE())), 'cancelled', DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE()));

-- 6. Seed Invoices (for Completed bookings)
-- We need booking_ids.
INSERT INTO invoices (booking_id, user_id, total_energy_kwh, unit_price, subtotal, tax_amount, total_amount, payment_method, payment_status, paid_at, created_at, updated_at)
SELECT 
    booking_id, 
    user_id, 
    10.0, -- Dummy Kwh
    5000, 
    50000, -- Dummy Subtotal
    0, 
    50000, -- Dummy Total
    'Wallet', 
    'Paid', 
    actual_end_time, 
    actual_end_time, 
    actual_end_time
FROM bookings 
WHERE status = 'completed' AND NOT EXISTS (SELECT 1 FROM invoices WHERE invoices.booking_id = bookings.booking_id);

-- 7. Seed System Logs
INSERT INTO system_logs (log_type, severity, message, user_id, ip_address, endpoint, created_at)
VALUES 
('Info', 'Low', 'User login successful', @User1Id, '192.168.1.10', '/api/auth/login', DATEADD(minute, -120, GETDATE())),
('Info', 'Low', 'User login successful', @User2Id, '192.168.1.11', '/api/auth/login', DATEADD(minute, -100, GETDATE())),
('Warning', 'Medium', 'Failed login attempt', NULL, '192.168.1.50', '/api/auth/login', DATEADD(minute, -90, GETDATE())),
('Info', 'Low', 'Booking created', @User1Id, '192.168.1.10', '/api/bookings', DATEADD(minute, -60, GETDATE())),
('Error', 'High', 'Payment gateway timeout', @User2Id, '192.168.1.11', '/api/payments', DATEADD(minute, -30, GETDATE()));

PRINT 'Seed data inserted successfully.';