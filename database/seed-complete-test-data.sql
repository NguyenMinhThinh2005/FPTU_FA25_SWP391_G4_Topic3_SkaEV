-- ============================================
-- SEED COMPLETE TEST DATA FOR 100% COMPLETION
-- ============================================
-- Purpose: Add missing test data for full functionality
-- Date: November 5, 2025
-- ============================================

USE SkaEV_DB;
GO

-- ============================================
-- 1. ADD MORE VEHICLES (for more users)
-- ============================================
PRINT '1. Adding more vehicles...';

-- User 3 (Customer Test) vehicles
INSERT INTO vehicles (user_id, vehicle_brand, vehicle_model, license_plate, battery_capacity_kwh, connector_type, max_charging_power_kw, status)
VALUES 
(3, 'VinFast', 'VF 8', '30A-12345', 87.7, 'CCS2', 150, 'active'),
(3, 'Tesla', 'Model 3', '30B-67890', 60, 'CCS2', 170, 'active');

-- User 14 (has bookings but no vehicles)
INSERT INTO vehicles (user_id, vehicle_brand, vehicle_model, license_plate, battery_capacity_kwh, connector_type, max_charging_power_kw, status)
VALUES 
(14, 'Hyundai', 'Ioniq 5', '51F-11111', 72.6, 'CCS2', 220, 'active');

-- User 4 (Staff)
INSERT INTO vehicles (user_id, vehicle_brand, vehicle_model, license_plate, battery_capacity_kwh, connector_type, max_charging_power_kw, status)
VALUES 
(4, 'VinFast', 'VF 9', '29A-99999', 123, 'CCS2', 150, 'active');

PRINT '  ✓ Added 4 vehicles';

-- ============================================
-- 2. ADD CHARGING POSTS & SLOTS FOR MORE STATIONS
-- ============================================
PRINT '2. Adding charging posts and slots for stations...';

-- Station 2: AEON Mall Bình Dương Canary
INSERT INTO charging_posts (station_id, post_number, post_type, power_output_kw, status, firmware_version)
VALUES 
(2, 'POST-01', 'DC', 150, 'available', 'v2.1.0'),
(2, 'POST-02', 'AC', 22, 'available', 'v2.1.0'),
(2, 'POST-03', 'DC', 150, 'available', 'v2.1.0');

DECLARE @Post2_1 INT;
SELECT @Post2_1 = post_id FROM charging_posts WHERE station_id = 2 AND post_number = 'POST-01';

DECLARE @Post2_2 INT;
SELECT @Post2_2 = post_id FROM charging_posts WHERE station_id = 2 AND post_number = 'POST-02';

DECLARE @Post2_3 INT;
SELECT @Post2_3 = post_id FROM charging_posts WHERE station_id = 2 AND post_number = 'POST-03';

INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power_kw, status)
VALUES 
(@Post2_1, 'A1', 'CCS2', 150, 'available'),
(@Post2_1, 'A2', 'CCS2', 150, 'available'),
(@Post2_2, 'B1', 'Type2', 22, 'available'),
(@Post2_2, 'B2', 'Type2', 22, 'available'),
(@Post2_3, 'C1', 'CCS2', 150, 'available');

-- Station 3: AEON Mall Bình Tân
INSERT INTO charging_posts (station_id, post_number, post_type, power_output_kw, status, firmware_version)
VALUES 
(3, 'POST-01', 'DC', 150, 'available', 'v2.1.0'),
(3, 'POST-02', 'AC', 22, 'available', 'v2.1.0');

DECLARE @Post3_1 INT;
SELECT @Post3_1 = post_id FROM charging_posts WHERE station_id = 3 AND post_number = 'POST-01';

DECLARE @Post3_2 INT;
SELECT @Post3_2 = post_id FROM charging_posts WHERE station_id = 3 AND post_number = 'POST-02';

INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power_kw, status)
VALUES 
(@Post3_1, 'A1', 'CCS2', 150, 'available'),
(@Post3_1, 'A2', 'CCS2', 150, 'available'),
(@Post3_2, 'B1', 'Type2', 22, 'available');

-- Station 4: AEON Mall Hải Phòng Lê Chân
INSERT INTO charging_posts (station_id, post_number, post_type, power_output_kw, status, firmware_version)
VALUES 
(4, 'POST-01', 'DC', 180, 'available', 'v2.2.0'),
(4, 'POST-02', 'DC', 180, 'available', 'v2.2.0');

DECLARE @Post4_1 INT;
SELECT @Post4_1 = post_id FROM charging_posts WHERE station_id = 4 AND post_number = 'POST-01';

DECLARE @Post4_2 INT;
SELECT @Post4_2 = post_id FROM charging_posts WHERE station_id = 4 AND post_number = 'POST-02';

INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power_kw, status)
VALUES 
(@Post4_1, 'A1', 'CCS2', 180, 'available'),
(@Post4_1, 'A2', 'CHAdeMO', 150, 'available'),
(@Post4_2, 'B1', 'CCS2', 180, 'available'),
(@Post4_2, 'B2', 'CHAdeMO', 150, 'available');

PRINT '  ✓ Added posts and slots for stations 2, 3, 4';

-- ============================================
-- 3. ADD ACTIVE BOOKINGS (in_progress)
-- ============================================
PRINT '3. Adding active (in_progress) bookings...';

-- Get slot IDs for active bookings
DECLARE @ActiveSlot1 INT;
SELECT @ActiveSlot1 = slot_id FROM charging_slots WHERE post_id = @Post2_1 AND slot_number = 'A1';

DECLARE @ActiveSlot2 INT;
SELECT @ActiveSlot2 = slot_id FROM charging_slots WHERE post_id = @Post3_1 AND slot_number = 'A1';

DECLARE @ActiveSlot3 INT;
SELECT @ActiveSlot3 = slot_id FROM charging_slots WHERE post_id = @Post4_1 AND slot_number = 'A1';

-- Get vehicle IDs
DECLARE @Vehicle3_1 INT;
SELECT @Vehicle3_1 = vehicle_id FROM vehicles WHERE user_id = 3 AND vehicle_model = 'VF 8';

DECLARE @Vehicle3_2 INT;
SELECT @Vehicle3_2 = vehicle_id FROM vehicles WHERE user_id = 3 AND vehicle_model = 'Model 3';

DECLARE @Vehicle14 INT;
SELECT @Vehicle14 = vehicle_id FROM vehicles WHERE user_id = 14 AND vehicle_model = 'Ioniq 5';

-- Active booking 1: User 3 at Station 2 (started 30 minutes ago)
INSERT INTO bookings (user_id, slot_id, vehicle_id, booking_code, status, scheduled_start_time, actual_start_time)
VALUES 
(3, @ActiveSlot1, @Vehicle3_1, 'BK-ACT-001', 'in_progress', DATEADD(MINUTE, -30, GETDATE()), DATEADD(MINUTE, -30, GETDATE()));

-- Update slot status
UPDATE charging_slots SET status = 'occupied' WHERE slot_id = @ActiveSlot1;

-- Active booking 2: User 3 at Station 3 (started 15 minutes ago)
INSERT INTO bookings (user_id, slot_id, vehicle_id, booking_code, status, scheduled_start_time, actual_start_time)
VALUES 
(3, @ActiveSlot2, @Vehicle3_2, 'BK-ACT-002', 'in_progress', DATEADD(MINUTE, -15, GETDATE()), DATEADD(MINUTE, -15, GETDATE()));

UPDATE charging_slots SET status = 'occupied' WHERE slot_id = @ActiveSlot2;

-- Active booking 3: User 14 at Station 4 (started 45 minutes ago)
INSERT INTO bookings (user_id, slot_id, vehicle_id, booking_code, status, scheduled_start_time, actual_start_time)
VALUES 
(14, @ActiveSlot3, @Vehicle14, 'BK-ACT-003', 'in_progress', DATEADD(MINUTE, -45, GETDATE()), DATEADD(MINUTE, -45, GETDATE()));

UPDATE charging_slots SET status = 'occupied' WHERE slot_id = @ActiveSlot3;

PRINT '  ✓ Added 3 active bookings';

-- ============================================
-- 4. ADD COMPLETED BOOKINGS FOR TODAY
-- ============================================
PRINT '4. Adding completed bookings for today...';

-- Get available slots
DECLARE @TodaySlot1 INT;
SELECT @TodaySlot1 = slot_id FROM charging_slots WHERE post_id = @Post2_2 AND slot_number = 'B1';

DECLARE @TodaySlot2 INT;
SELECT @TodaySlot2 = slot_id FROM charging_slots WHERE post_id = @Post3_2 AND slot_number = 'B1';

DECLARE @TodaySlot3 INT;
SELECT @TodaySlot3 = slot_id FROM charging_slots WHERE post_id = @Post4_2 AND slot_number = 'B1';

DECLARE @Vehicle1_1 INT;
SELECT TOP 1 @Vehicle1_1 = vehicle_id FROM vehicles WHERE user_id = 1;

DECLARE @Vehicle4 INT;
SELECT @Vehicle4 = vehicle_id FROM vehicles WHERE user_id = 4;

-- Today booking 1: User 1 at Station 2 (completed 2 hours ago)
DECLARE @TodayBooking1 INT;
INSERT INTO bookings (user_id, slot_id, vehicle_id, booking_code, status, scheduled_start_time, actual_start_time, actual_end_time)
VALUES 
(1, @TodaySlot1, @Vehicle1_1, 'BK-TOD-001', 'completed', DATEADD(HOUR, -3, GETDATE()), DATEADD(HOUR, -3, GETDATE()), DATEADD(HOUR, -2, GETDATE()));
SET @TodayBooking1 = SCOPE_IDENTITY();

-- Invoice for today booking 1
INSERT INTO invoices (booking_id, total_energy_kwh, energy_cost_vnd, service_fee_vnd, total_amount, payment_method, payment_status, paid_at)
VALUES 
(@TodayBooking1, 25.50, 76500, 3825, 80325, 'credit_card', 'paid', DATEADD(HOUR, -2, GETDATE()));

-- Today booking 2: User 3 at Station 3 (completed 1 hour ago)
DECLARE @TodayBooking2 INT;
INSERT INTO bookings (user_id, slot_id, vehicle_id, booking_code, status, scheduled_start_time, actual_start_time, actual_end_time)
VALUES 
(3, @TodaySlot2, @Vehicle3_1, 'BK-TOD-002', 'completed', DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, -1, GETDATE()));
SET @TodayBooking2 = SCOPE_IDENTITY();

INSERT INTO invoices (booking_id, total_energy_kwh, energy_cost_vnd, service_fee_vnd, total_amount, payment_method, payment_status, paid_at)
VALUES 
(@TodayBooking2, 32.80, 98400, 4920, 103320, 'momo', 'paid', DATEADD(HOUR, -1, GETDATE()));

-- Today booking 3: User 14 at Station 4 (completed 30 minutes ago)
DECLARE @TodayBooking3 INT;
INSERT INTO bookings (user_id, slot_id, vehicle_id, booking_code, status, scheduled_start_time, actual_start_time, actual_end_time)
VALUES 
(14, @TodaySlot3, @Vehicle14, 'BK-TOD-003', 'completed', DATEADD(MINUTE, -90, GETDATE()), DATEADD(MINUTE, -90, GETDATE()), DATEADD(MINUTE, -30, GETDATE()));
SET @TodayBooking3 = SCOPE_IDENTITY();

INSERT INTO invoices (booking_id, total_energy_kwh, energy_cost_vnd, service_fee_vnd, total_amount, payment_method, payment_status, paid_at)
VALUES 
(@TodayBooking3, 18.20, 54600, 2730, 57330, 'bank_transfer', 'paid', DATEADD(MINUTE, -30, GETDATE()));

-- Today booking 4: User 4 at Station 2 (completed 4 hours ago)
DECLARE @TodayBooking4 INT;
INSERT INTO bookings (user_id, slot_id, vehicle_id, booking_code, status, scheduled_start_time, actual_start_time, actual_end_time)
VALUES 
(4, @TodaySlot1, @Vehicle4, 'BK-TOD-004', 'completed', DATEADD(HOUR, -5, GETDATE()), DATEADD(HOUR, -5, GETDATE()), DATEADD(HOUR, -4, GETDATE()));
SET @TodayBooking4 = SCOPE_IDENTITY();

INSERT INTO invoices (booking_id, total_energy_kwh, energy_cost_vnd, service_fee_vnd, total_amount, payment_method, payment_status, paid_at)
VALUES 
(@TodayBooking4, 45.60, 136800, 6840, 143640, 'credit_card', 'paid', DATEADD(HOUR, -4, GETDATE()));

PRINT '  ✓ Added 4 completed bookings for today';

-- ============================================
-- 5. ADD SYSTEM ERROR LOGS
-- ============================================
PRINT '5. Adding system error logs...';

-- Error at Station 1
INSERT INTO system_logs (station_id, log_type, severity, error_code, message, details, created_at)
VALUES 
(1, 'hardware_error', 'warning', 'ERR_POST_COMM', 'Communication timeout with POST-03', 'Failed to receive heartbeat from charging post POST-03 for 120 seconds', DATEADD(HOUR, -2, GETDATE())),
(1, 'hardware_error', 'error', 'ERR_SLOT_FAULT', 'Slot A3 overcurrent detected', 'Slot A3 detected overcurrent condition (185A). Emergency shutdown triggered.', DATEADD(HOUR, -1, GETDATE()));

-- Error at Station 2
INSERT INTO system_logs (station_id, log_type, severity, error_code, message, details, created_at)
VALUES 
(2, 'software_error', 'warning', 'ERR_FW_UPDATE', 'Firmware update failed on POST-02', 'Failed to apply firmware v2.2.0 - checksum mismatch', DATEADD(HOUR, -3, GETDATE())),
(2, 'hardware_error', 'critical', 'ERR_TEMP_HIGH', 'High temperature alert on POST-01', 'POST-01 temperature reached 82°C (threshold: 75°C)', DATEADD(MINUTE, -30, GETDATE()));

-- Error at Station 3
INSERT INTO system_logs (station_id, log_type, severity, error_code, message, details, created_at)
VALUES 
(3, 'network_error', 'error', 'ERR_CONN_LOST', 'Network connection lost', 'Station lost internet connectivity for 15 minutes', DATEADD(HOUR, -6, GETDATE())),
(3, 'hardware_error', 'warning', 'ERR_CABLE_DETECT', 'Charging cable not properly connected', 'Slot B2 detected improper cable connection', DATEADD(MINUTE, -45, GETDATE()));

-- Error at Station 4
INSERT INTO system_logs (station_id, log_type, severity, error_code, message, details, created_at)
VALUES 
(4, 'power_error', 'critical', 'ERR_GRID_FAULT', 'Grid power fluctuation detected', 'Input voltage dropped to 380V (expected: 400V)', DATEADD(HOUR, -4, GETDATE())),
(4, 'software_error', 'info', 'INFO_MAINTENANCE', 'Scheduled maintenance completed', 'Monthly maintenance check completed successfully', DATEADD(HOUR, -12, GETDATE()));

PRINT '  ✓ Added 8 error logs';

-- ============================================
-- 6. ADD MORE NOTIFICATIONS
-- ============================================
PRINT '6. Adding more notifications...';

-- Notification for User 1 (Admin)
INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
VALUES 
(1, 'system_alert', 'Critical Error at Station 4', 'Grid power fluctuation detected at AEON Mall Hải Phòng. Immediate attention required.', 0, DATEADD(HOUR, -4, GETDATE())),
(1, 'maintenance', 'Maintenance Completed', 'Station 4 monthly maintenance check completed successfully.', 0, DATEADD(HOUR, -12, GETDATE()));

-- Notifications for User 3 (Customer)
INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
VALUES 
(3, 'booking_confirmed', 'Booking Confirmed', 'Your booking at AEON Mall Bình Tân has been confirmed.', 1, DATEADD(HOUR, -2, GETDATE())),
(3, 'charging_complete', 'Charging Complete', 'Your vehicle charging session is complete. Total energy: 32.80 kWh', 0, DATEADD(HOUR, -1, GETDATE())),
(3, 'promotion', 'Weekend Special Offer', 'Get 20% off on all charging sessions this weekend!', 0, DATEADD(DAY, -1, GETDATE()));

-- Notifications for User 14
INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
VALUES 
(14, 'booking_confirmed', 'Booking Confirmed', 'Your booking at AEON Mall Hải Phòng has been confirmed.', 1, DATEADD(MINUTE, -90, GETDATE())),
(14, 'charging_complete', 'Charging Complete', 'Your vehicle charging session is complete. Total energy: 18.20 kWh', 0, DATEADD(MINUTE, -30, GETDATE()));

-- Notifications for User 4 (Staff)
INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
VALUES 
(4, 'staff_alert', 'Station Error Reported', 'High temperature alert on Station 2, POST-01. Please investigate.', 0, DATEADD(MINUTE, -30, GETDATE()));

PRINT '  ✓ Added 8 notifications';

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================
PRINT '7. Running verification queries...';

PRINT '  Vehicles: ' + CAST((SELECT COUNT(*) FROM vehicles) AS VARCHAR);
PRINT '  Charging Posts: ' + CAST((SELECT COUNT(*) FROM charging_posts) AS VARCHAR);
PRINT '  Charging Slots: ' + CAST((SELECT COUNT(*) FROM charging_slots) AS VARCHAR);
PRINT '  Active Bookings: ' + CAST((SELECT COUNT(*) FROM bookings WHERE status = 'in_progress') AS VARCHAR);
PRINT '  Today Completed: ' + CAST((SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND CAST(actual_end_time AS DATE) = CAST(GETDATE() AS DATE)) AS VARCHAR);
PRINT '  Error Logs: ' + CAST((SELECT COUNT(*) FROM system_logs) AS VARCHAR);
PRINT '  Notifications: ' + CAST((SELECT COUNT(*) FROM notifications) AS VARCHAR);

-- ============================================
PRINT '';
PRINT '✅ SEED COMPLETE TEST DATA FINISHED!';
PRINT '============================================';
PRINT 'Summary:';
PRINT '  ✓ Added 4 more vehicles';
PRINT '  ✓ Added posts & slots for stations 2, 3, 4';
PRINT '  ✓ Added 3 active bookings (in_progress)';
PRINT '  ✓ Added 4 completed bookings for today';
PRINT '  ✓ Added 8 error logs';
PRINT '  ✓ Added 8 notifications';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Run API tests to verify active sessions';
PRINT '  2. Check realtime monitoring with active bookings';
PRINT '  3. Verify today statistics (energy, revenue)';
PRINT '  4. Test error management endpoints';
PRINT '============================================';
