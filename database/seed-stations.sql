-- Seed sample charging stations for SkaEV system
-- Run this script to add sample data to the charging_stations table

USE SkaEV_DB;
GO

-- Insert sample charging stations
INSERT INTO charging_stations 
  (station_name, address, city, latitude, longitude, total_posts, available_posts, operating_hours, amenities, status, created_at, updated_at)
VALUES
  -- Station 1: Landmark 81
  (
    N'Trạm sạc Landmark 81',
    N'720A Điện Biên Phủ, Phường 22, Bình Thạnh',
    N'TP. Hồ Chí Minh',
    10.7952,
    106.7219,
    8,
    8,
    '00:00-24:00',
    'WiFi,Cafe,RestRoom,Shopping',
    'active',
    GETUTCDATE(),
    GETUTCDATE()
  ),
  -- Station 2: Vincom Center
  (
    N'Trạm sạc Vincom Center',
    N'72 Lê Thánh Tôn, Bến Nghé, Quận 1',
    N'TP. Hồ Chí Minh',
    10.7764,
    106.7009,
    6,
    5,
    '06:00-23:00',
    'WiFi,Cafe,Shopping,Parking',
    'active',
    GETUTCDATE(),
    GETUTCDATE()
  ),
  -- Station 3: Saigon Centre
  (
    N'Trạm sạc Saigon Centre',
    N'65 Lê Lợi, Bến Nghé, Quận 1',
    N'TP. Hồ Chí Minh',
    10.7735,
    106.7009,
    10,
    8,
    '00:00-24:00',
    'WiFi,RestRoom,Shopping,FoodCourt',
    'active',
    GETUTCDATE(),
    GETUTCDATE()
  ),
  -- Station 4: Diamond Plaza
  (
    N'Trạm sạc Diamond Plaza',
    N'34 Lê Duẩn, Bến Nghé, Quận 1',
    N'TP. Hồ Chí Minh',
    10.7797,
    106.6992,
    4,
    4,
    '07:00-22:00',
    'WiFi,Cafe,Shopping',
    'active',
    GETUTCDATE(),
    GETUTCDATE()
  ),
  -- Station 5: AEON Mall Bình Tân
  (
    N'Trạm sạc AEON Mall Bình Tân',
    N'1 Đường số 17A, Bình Trị Đông B, Bình Tân',
    N'TP. Hồ Chí Minh',
    10.7401,
    106.6122,
    12,
    10,
    '08:00-22:00',
    'WiFi,Cafe,RestRoom,Shopping,FoodCourt,Parking',
    'active',
    GETUTCDATE(),
    GETUTCDATE()
  ),
  -- Station 6: Thảo Điền (maintenance)
  (
    N'Trạm sạc Thảo Điền',
    N'12 Quốc Hương, Thảo Điền, Quận 2',
    N'TP. Hồ Chí Minh',
    10.8037,
    106.7360,
    6,
    0,
    '00:00-24:00',
    'WiFi,Parking',
    'maintenance',
    GETUTCDATE(),
    GETUTCDATE()
  ),
  -- Station 7: Phú Mỹ Hưng
  (
    N'Trạm sạc Crescent Mall',
    N'101 Tôn Dật Tiên, Phường Tân Phú, Quận 7',
    N'TP. Hồ Chí Minh',
    10.7289,
    106.7100,
    8,
    6,
    '08:00-23:00',
    'WiFi,Cafe,RestRoom,Shopping,Parking',
    'active',
    GETUTCDATE(),
    GETUTCDATE()
  ),
  -- Station 8: Giga Mall
  (
    N'Trạm sạc Giga Mall',
    N'240-242 Phạm Văn Đồng, Hiệp Bình Chánh, Thủ Đức',
    N'TP. Hồ Chí Minh',
    10.8411,
    106.7148,
    10,
    9,
    '08:00-22:00',
    'WiFi,Cafe,RestRoom,Shopping,FoodCourt,Parking',
    'active',
    GETUTCDATE(),
    GETUTCDATE()
  );

GO

-- Verify the data
SELECT 
  station_id,
  station_name,
  city,
  total_posts,
  available_posts,
  status
FROM charging_stations
ORDER BY created_at DESC;

GO

PRINT 'Sample charging stations seeded successfully!';
