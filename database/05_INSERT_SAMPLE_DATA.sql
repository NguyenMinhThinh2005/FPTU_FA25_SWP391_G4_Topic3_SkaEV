-- =====================================================================================
-- SkaEV Database - Sample Data Insertion
-- Insert sample charging stations across Vietnam
-- =====================================================================================

USE SkaEV_DB;
GO

-- =====================================================================================
-- 1. INSERT SAMPLE CHARGING STATIONS
-- =====================================================================================

-- Stations in Ho Chi Minh City
INSERT INTO charging_stations (station_name, address, city, district, coordinates, total_posts, available_posts, operating_hours, contact_phone, amenities, status, created_at, updated_at)
VALUES 
-- District 1
('VinFast Station - Bitexco Financial Tower', 'Số 2 Hải Triều, Phường Bến Nghé', 'Hồ Chí Minh', 'Quận 1', 
    geography::Point(10.7718, 106.7039, 4326), 8, 8, '00:00-23:59', '1900 23 23 89', 
    'Parking, Restroom, Cafe, WiFi, Security', 'Active', GETDATE(), GETDATE()),

('EV Station - Landmark 81', '720A Đ. Điện Biên Phủ, Phường 22', 'Hồ Chí Minh', 'Quận Bình Thạnh', 
    geography::Point(10.7943, 106.7212, 4326), 12, 12, '06:00-22:00', '028 3519 8181', 
    'Parking, Restroom, Shopping Mall, Food Court, WiFi', 'Active', GETDATE(), GETDATE()),

('Aeon Mall Tân Phú Charging Hub', '30 Bờ Bao Tân Thắng, Phường Sơn Kỳ', 'Hồ Chí Minh', 'Quận Tân Phú', 
    geography::Point(10.8061, 106.6135, 4326), 10, 10, '08:00-22:00', '028 3815 2222', 
    'Parking, Shopping Mall, Food Court, Entertainment', 'Active', GETDATE(), GETDATE()),

-- District 7
('Green Energy Station - Crescent Mall', '101 Tôn Dật Tiên, Phường Tân Phú', 'Hồ Chí Minh', 'Quận 7', 
    geography::Point(10.7295, 106.7196, 4326), 15, 15, '08:00-23:00', '028 5413 3333', 
    'Parking, Restroom, Shopping, Cafe, Cinema', 'Active', GETDATE(), GETDATE()),

('VinFast Station - Phú Mỹ Hưng', '8 Nguyễn Văn Linh, Phường Tân Phú', 'Hồ Chí Minh', 'Quận 7', 
    geography::Point(10.7256, 106.7102, 4326), 20, 20, '00:00-23:59', '1900 23 23 89', 
    'Parking, Restroom, Convenience Store, Security, WiFi', 'Active', GETDATE(), GETDATE()),

-- Thủ Đức
('Gigamall Charging Station', '240-242 Phạm Văn Đồng, Phường Hiệp Bình Chánh', 'Hồ Chí Minh', 'Thành phố Thủ Đức', 
    geography::Point(10.8414, 106.7145, 4326), 10, 10, '08:00-22:00', '028 3724 4444', 
    'Parking, Shopping Mall, Food Court, Entertainment', 'Active', GETDATE(), GETDATE()),

('Vincom Mega Mall Thảo Điền EV Hub', '159 Xa lộ Hà Nội, Phường Thảo Điền', 'Hồ Chí Minh', 'Thành phố Thủ Đức', 
    geography::Point(10.8008, 106.7407, 4326), 12, 12, '08:30-22:30', '028 3744 6666', 
    'Parking, Shopping, Food Court, Cinema, Kids Zone', 'Active', GETDATE(), GETDATE()),

-- Other Districts
('Crescent Riverside Charging Point', 'Đ. Nguyễn Tri Phương, Phường 9', 'Hồ Chí Minh', 'Quận 10', 
    geography::Point(10.7652, 106.6680, 4326), 6, 6, '07:00-21:00', '028 3862 5555', 
    'Parking, Restroom, Cafe', 'Active', GETDATE(), GETDATE()),

-- Stations in Hanoi
('VinFast Station - Vincom Metropolis', '29 Liễu Giai, Phường Ngọc Khánh', 'Hà Nội', 'Quận Ba Đình', 
    geography::Point(21.0334, 105.8110, 4326), 10, 10, '00:00-23:59', '024 3833 7777', 
    'Parking, Restroom, Shopping Mall, Food Court, WiFi, Security', 'Active', GETDATE(), GETDATE()),

('Royal City Mega Charging Hub', '72A Nguyễn Trãi, Phường Thượng Đình', 'Hà Nội', 'Quận Thanh Xuân', 
    geography::Point(20.9954, 105.8096, 4326), 18, 18, '00:00-23:59', '024 3201 8888', 
    'Parking, Shopping Mall, Food Court, Cinema, Entertainment, Swimming Pool', 'Active', GETDATE(), GETDATE()),

('Aeon Mall Long Biên EV Station', '27 Cổ Linh, Phường Long Biên', 'Hà Nội', 'Quận Long Biên', 
    geography::Point(21.0365, 105.8975, 4326), 14, 14, '08:00-22:00', '024 3873 6688', 
    'Parking, Shopping Mall, Food Court, Entertainment', 'Active', GETDATE(), GETDATE()),

('Times City Green Charging', '458 Minh Khai, Phường Vĩnh Tuy', 'Hà Nội', 'Quận Hai Bà Trưng', 
    geography::Point(20.9978, 105.8636, 4326), 12, 12, '06:00-23:00', '024 3974 9999', 
    'Parking, Shopping, Food Court, Cinema, Water Park', 'Active', GETDATE(), GETDATE()),

-- Stations in Da Nang
('VinFast Station - Vincom Plaza Đà Nẵng', '910A Ngô Quyền, Phường An Hải Bắc', 'Đà Nẵng', 'Quận Sơn Trà', 
    geography::Point(16.0678, 108.2231, 4326), 10, 10, '08:00-22:00', '0236 3828 999', 
    'Parking, Shopping Mall, Food Court, Cinema', 'Active', GETDATE(), GETDATE()),

('Lotte Mart Đà Nẵng Charging Point', '6 Nại Nam, Phường Hòa Cường Bắc', 'Đà Nẵng', 'Quận Hải Châu', 
    geography::Point(16.0471, 108.2068, 4326), 8, 8, '08:00-22:00', '0236 3567 777', 
    'Parking, Shopping, Food Court, Entertainment', 'Active', GETDATE(), GETDATE()),

-- Stations in Can Tho
('Vincom Plaza Xuân Khánh EV Hub', '209 Đ. 30 Tháng 4, Xuân Khánh', 'Cần Thơ', 'Quận Ninh Kiều', 
    geography::Point(10.0452, 105.7469, 4326), 8, 8, '08:30-22:00', '0292 3730 888', 
    'Parking, Shopping Mall, Food Court, Cinema', 'Active', GETDATE(), GETDATE()),

-- Stations in Binh Duong
('VinFast Station - AEON Bình Dương Canary', 'Đại lộ Bình Dương, Thuận Giao', 'Bình Dương', 'Thành phố Thuận An', 
    geography::Point(10.9236, 106.7042, 4326), 12, 12, '08:00-22:00', '0274 3822 666', 
    'Parking, Shopping Mall, Food Court, Entertainment', 'Active', GETDATE(), GETDATE()),

('Becamex Tower Charging Station', '230 Đại lộ Bình Dương, Phú Hòa', 'Bình Dương', 'Thành phố Thủ Dầu Một', 
    geography::Point(10.9804, 106.6525, 4326), 10, 10, '00:00-23:59', '0274 3826 555', 
    'Parking, Restroom, Office Building, Cafe, Security', 'Active', GETDATE(), GETDATE()),

-- Stations in Vung Tau
('VinFast Station - Vũng Tàu Plaza', '22A Trương Công Định, Phường 1', 'Bà Rịa - Vũng Tàu', 'Thành phố Vũng Tàu', 
    geography::Point(10.3460, 107.0843, 4326), 8, 8, '07:00-22:00', '0254 3856 333', 
    'Parking, Restroom, Shopping, Beach Access, Cafe', 'Active', GETDATE(), GETDATE()),

-- Stations in Nha Trang
('Vincom Plaza Nha Trang EV Station', '52 Trần Phú, Lộc Thọ', 'Khánh Hòa', 'Thành phố Nha Trang', 
    geography::Point(12.2488, 109.1943, 4326), 10, 10, '08:00-22:00', '0258 3524 777', 
    'Parking, Shopping Mall, Food Court, Beach View', 'Active', GETDATE(), GETDATE());

PRINT '✓ Inserted 20 charging stations';
GO

-- =====================================================================================
-- 2. INSERT CHARGING POSTS FOR EACH STATION
-- =====================================================================================

DECLARE @StationID INT;
DECLARE @PostCount INT;
DECLARE @Counter INT;

-- Cursor to iterate through all stations
DECLARE station_cursor CURSOR FOR 
SELECT station_id, total_posts FROM charging_stations;

OPEN station_cursor;
FETCH NEXT FROM station_cursor INTO @StationID, @PostCount;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Counter = 1;
    
    WHILE @Counter <= @PostCount
    BEGIN
        -- Insert charging post with various connector types
        INSERT INTO charging_posts (station_id, post_number, connector_type, power_output, voltage, current_capacity, status, last_maintenance, created_at, updated_at)
        VALUES (
            @StationID,
            CONCAT('P', RIGHT('00' + CAST(@Counter AS VARCHAR), 2)),
            CASE 
                WHEN @Counter % 4 = 0 THEN 'CCS2'
                WHEN @Counter % 4 = 1 THEN 'CHAdeMO'
                WHEN @Counter % 4 = 2 THEN 'Type 2'
                ELSE 'GB/T'
            END,
            CASE 
                WHEN @Counter % 3 = 0 THEN 150.00  -- Fast DC
                WHEN @Counter % 3 = 1 THEN 50.00   -- Medium DC
                ELSE 22.00                          -- AC charging
            END,
            CASE 
                WHEN @Counter % 2 = 0 THEN 400
                ELSE 220
            END,
            CASE 
                WHEN @Counter % 3 = 0 THEN 375.00  -- 150kW / 400V
                WHEN @Counter % 3 = 1 THEN 125.00  -- 50kW / 400V
                ELSE 100.00                         -- 22kW / 220V
            END,
            'Available',
            DATEADD(DAY, -30, GETDATE()),
            GETDATE(),
            GETDATE()
        );
        
        SET @Counter = @Counter + 1;
    END
    
    FETCH NEXT FROM station_cursor INTO @StationID, @PostCount;
END

CLOSE station_cursor;
DEALLOCATE station_cursor;

PRINT '✓ Inserted charging posts for all stations';
GO

-- =====================================================================================
-- 3. INSERT CHARGING SLOTS (2 slots per post)
-- =====================================================================================

DECLARE @PostID INT;

DECLARE post_cursor CURSOR FOR 
SELECT post_id FROM charging_posts;

OPEN post_cursor;
FETCH NEXT FROM post_cursor INTO @PostID;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Insert 2 slots per post (most posts have 2 connectors)
    INSERT INTO charging_slots (post_id, slot_number, connector_type, max_power, status, created_at, updated_at)
    VALUES 
        (@PostID, 1, (SELECT connector_type FROM charging_posts WHERE post_id = @PostID), 
         (SELECT power_output FROM charging_posts WHERE post_id = @PostID), 'Available', GETDATE(), GETDATE()),
        (@PostID, 2, (SELECT connector_type FROM charging_posts WHERE post_id = @PostID), 
         (SELECT power_output FROM charging_posts WHERE post_id = @PostID), 'Available', GETDATE(), GETDATE());
    
    FETCH NEXT FROM post_cursor INTO @PostID;
END

CLOSE post_cursor;
DEALLOCATE post_cursor;

PRINT '✓ Inserted charging slots for all posts';
GO

-- =====================================================================================
-- 4. INSERT PRICING RULES
-- =====================================================================================

INSERT INTO pricing_rules (rule_name, station_id, connector_type, power_range_min, power_range_max, price_per_kwh, time_based_pricing, peak_hour_start, peak_hour_end, peak_price_multiplier, is_active, effective_from, effective_to, created_at, updated_at)
VALUES 
-- Standard pricing for AC charging (7-22kW)
('Standard AC Charging', NULL, 'Type 2', 7.00, 22.00, 3500.00, 0, NULL, NULL, 1.0, 1, '2025-01-01', '2025-12-31', GETDATE(), GETDATE()),

-- Standard pricing for DC Fast (50kW)
('Standard DC 50kW', NULL, 'CCS2', 40.00, 60.00, 5000.00, 0, NULL, NULL, 1.0, 1, '2025-01-01', '2025-12-31', GETDATE(), GETDATE()),
('Standard DC 50kW CHAdeMO', NULL, 'CHAdeMO', 40.00, 60.00, 5000.00, 0, NULL, NULL, 1.0, 1, '2025-01-01', '2025-12-31', GETDATE(), GETDATE()),

-- Ultra-fast DC charging (150kW+)
('Ultra-Fast DC 150kW', NULL, 'CCS2', 100.00, 200.00, 6500.00, 0, NULL, NULL, 1.0, 1, '2025-01-01', '2025-12-31', GETDATE(), GETDATE()),

-- Peak hour pricing (6 AM - 10 AM, 5 PM - 9 PM)
('Peak Hour AC', NULL, 'Type 2', 7.00, 22.00, 3500.00, 1, '06:00:00', '10:00:00', 1.3, 1, '2025-01-01', '2025-12-31', GETDATE(), GETDATE()),
('Peak Hour DC', NULL, 'CCS2', 40.00, 200.00, 5500.00, 1, '17:00:00', '21:00:00', 1.3, 1, '2025-01-01', '2025-12-31', GETDATE(), GETDATE()),

-- Night time discount (10 PM - 6 AM)
('Night Discount AC', NULL, 'Type 2', 7.00, 22.00, 2800.00, 1, '22:00:00', '06:00:00', 0.8, 1, '2025-01-01', '2025-12-31', GETDATE(), GETDATE()),
('Night Discount DC', NULL, 'CCS2', 40.00, 200.00, 4500.00, 1, '22:00:00', '06:00:00', 0.9, 1, '2025-01-01', '2025-12-31', GETDATE(), GETDATE());

PRINT '✓ Inserted pricing rules';
GO

-- =====================================================================================
-- 5. VERIFY DATA INSERTION
-- =====================================================================================

SELECT 
    '✓ Charging Stations' AS [Data Type],
    COUNT(*) AS [Count]
FROM charging_stations
UNION ALL
SELECT 
    '✓ Charging Posts' AS [Data Type],
    COUNT(*) AS [Count]
FROM charging_posts
UNION ALL
SELECT 
    '✓ Charging Slots' AS [Data Type],
    COUNT(*) AS [Count]
FROM charging_slots
UNION ALL
SELECT 
    '✓ Pricing Rules' AS [Data Type],
    COUNT(*) AS [Count]
FROM pricing_rules;

PRINT '';
PRINT '✅ Sample data insertion completed successfully!';
PRINT '📊 Summary:';
PRINT '   - 20 Charging Stations across major cities in Vietnam';
PRINT '   - Multiple charging posts per station';
PRINT '   - 2 slots per post for concurrent charging';
PRINT '   - Flexible pricing rules with peak/off-peak rates';
GO
