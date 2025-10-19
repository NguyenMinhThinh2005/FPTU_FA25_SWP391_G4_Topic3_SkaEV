-- =============================================
-- Script: Add Real Vietnam Charging Stations
-- Description: Insert charging stations based on real locations in Vietnam
-- Author: SkaEV Team
-- Date: 2025-10-19
-- =============================================

USE [SkaEV_DB]
GO

-- Set required options for computed columns
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Clear existing stations (delete old data with encoding issues)
DELETE FROM charging_stations;
DBCC CHECKIDENT ('charging_stations', RESEED, 0);
GO

-- =============================================
-- HO CHI MINH CITY (TP.HCM) - CHARGING STATIONS
-- =============================================

-- 1. VinFast Green Charging Station - Vinhomes Central Park
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'VinFast Green Charging - Vinhomes Central Park',
    N'208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP.HCM',
    N'Hồ Chí Minh',
    10.79748200,
    106.72152400,
    12,
    10,
    N'24/7',
    N'WiFi miễn phí, Khu vực chờ có điều hòa, Cà phê, Nhà vệ sinh, Bãi đỗ xe rộng rãi, An ninh 24/7',
    N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 2. VinFast Green Charging Station - Landmark 81
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'VinFast Green Charging - Landmark 81',
    N'720A Điện Biên Phủ, Vinhomes Tân Cảng, Bình Thạnh, TP.HCM',
    N'Hồ Chí Minh',
    10.79460800,
    106.72191900,
    16,
    14,
    N'24/7',
    N'WiFi miễn phí, Trung tâm thương mại, Nhà hàng, Siêu thị, Rạp chiếu phim, Bãi đỗ xe trong nhà',
    N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 3. Shell Recharge - Nguyễn Văn Linh
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Shell Recharge - Nguyễn Văn Linh',
    N'456 Nguyễn Văn Linh, Tân Phú, Quận 7, TP.HCM',
    N'Hồ Chí Minh',
    10.73353500,
    106.71824900,
    8,
    6,
    N'06:00 - 23:00',
    N'Cửa hàng tiện lợi, Khu vực nghỉ ngơi, Máy ATM, Nhà vệ sinh',
    N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 4. AEON Mall Bình Tân - EV Charging Hub
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'AEON Mall Bình Tân - EV Charging',
    N'1 Đường số 17A, Bình Trị Đông B, Bình Tân, TP.HCM',
    N'Hồ Chí Minh',
    10.74013400,
    106.60750400,
    10,
    8,
    N'09:00 - 22:00',
    N'Trung tâm thương mại, Điện ảnh, Ẩm thực, WiFi miễn phí, Khu vui chơi trẻ em',
    N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 5. Crescent Mall - Green Charging Station
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Crescent Mall - Green Charging',
    N'101 Tôn Dật Tiên, Phú Mỹ Hưng, Quận 7, TP.HCM',
    N'Hồ Chí Minh',
    10.72935800,
    106.70239100,
    8,
    7,
    N'09:00 - 22:00',
    N'Trung tâm mua sắm, Nhà hàng cao cấp, Rạp chiếu phim, WiFi miễn phí, Bãi đỗ xe trong nhà',
    N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 6. Saigon Pearl - Fast Charging Station
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Saigon Pearl - Fast Charging',
    N'92 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP.HCM',
    N'Hồ Chí Minh',
    10.78819600,
    106.71406900,
    6,
    5,
    N'24/7',
    N'Khu dân cư cao cấp, An ninh 24/7, Khu vực chờ thoáng mát, WiFi miễn phí',
    N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- HANOI (HÀ NỘI) - CHARGING STATIONS
-- =============================================

-- 7. VinFast Green Charging - Vinhomes Ocean Park
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'VinFast Green Charging - Vinhomes Ocean Park',
    N'Đại lộ Đỗ Đức Dục, Gia Lâm, Hà Nội',
    N'Hà Nội',
    20.98582100,
    105.93889200,
    14,
    12,
    N'24/7',
    N'WiFi miễn phí, Khu phức hợp lớn, Trung tâm thương mại, Bãi đỗ xe rộng, An ninh 24/7',
    N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 8. VinFast Green Charging - Royal City
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'VinFast Green Charging - Royal City',
    N'72A Nguyễn Trãi, Thanh Xuân, Hà Nội',
    N'Hà Nội',
    21.00155600,
    105.81346100,
    12,
    10,
    N'24/7',
    N'Trung tâm thương mại lớn, Rạp chiếu phim, Khu ẩm thực, WiFi miễn phí, Bãi đỗ xe trong nhà',
    N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 9. AEON Mall Long Biên - EV Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'AEON Mall Long Biên - EV Charging',
    N'27 Cổ Linh, Long Biên, Hà Nội',
    N'Hà Nội',
    21.04575300,
    105.89164200,
    10,
    8,
    N'09:00 - 22:00',
    N'Trung tâm mua sắm, Siêu thị, Khu vui chơi, Ẩm thực đa dạng, WiFi miễn phí',
    N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 10. Lotte Center - Fast Charging Station
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Lotte Center Hanoi - Fast Charging',
    N'54 Liễu Giai, Ba Đình, Hà Nội',
    N'Hà Nội',
    21.02259400,
    105.81375800,
    8,
    7,
    N'24/7',
    N'Trung tâm thương mại cao cấp, Nhà hàng, Khách sạn, WiFi miễn phí, Bãi đỗ xe trong nhà',
    N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 11. Times City - Green Charging Hub
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Times City - Green Charging Hub',
    N'458 Minh Khai, Hai Bà Trưng, Hà Nội',
    N'Hà Nội',
    20.99562700,
    105.86516800,
    10,
    9,
    N'24/7',
    N'Khu đô thị lớn, Vincom Mega Mall, Rạp chiếu phim, Công viên nước, WiFi miễn phí',
    N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- DA NANG (ĐÀ NẴNG) - CHARGING STATIONS
-- =============================================

-- 12. VinFast Green Charging - Phạm Văn Đồng
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'VinFast Green Charging - Phạm Văn Đồng',
    N'768 Phạm Văn Đồng, Hòa Minh, Liên Chiểu, Đà Nẵng',
    N'Đà Nẵng',
    16.04719400,
    108.15193800,
    10,
    8,
    N'24/7',
    N'WiFi miễn phí, Khu vực chờ thoáng mát, Gần trung tâm thương mại, An ninh 24/7',
    N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 13. Vincom Plaza Đà Nẵng - EV Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Vincom Plaza Đà Nẵng - EV Charging',
    N'910A Ngô Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng',
    N'Đà Nẵng',
    16.06922100,
    108.22832600,
    8,
    7,
    N'09:00 - 22:00',
    N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực, WiFi miễn phí, Gần biển Mỹ Khê',
    N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 14. Lotte Mart Đà Nẵng - Charging Station
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Lotte Mart Đà Nẵng - Charging Station',
    N'6 Nại Nam, Hòa Cường Bắc, Hải Châu, Đà Nẵng',
    N'Đà Nẵng',
    16.04052900,
    108.20743300,
    6,
    5,
    N'08:00 - 22:00',
    N'Siêu thị lớn, Khu vực ẩm thực, WiFi miễn phí, Bãi đỗ xe rộng rãi',
    N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- BINH DUONG (BÌNH DƯƠNG) - CHARGING STATIONS
-- =============================================

-- 15. AEON Mall Bình Dương Canary - EV Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'AEON Mall Bình Dương Canary - EV Charging',
    N'50 Đại lộ Bình Dương, Thuận Giao, Thuận An, Bình Dương',
    N'Bình Dương',
    10.90557200,
    106.69662400,
    12,
    10,
    N'09:00 - 22:00',
    N'Trung tâm thương mại lớn, Rạp chiếu phim, Siêu thị, Ẩm thực, WiFi miễn phí',
    N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 16. Becamex Bình Dương - Fast Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Becamex Bình Dương - Fast Charging',
    N'230 Đại lộ Bình Dương, Phú Hòa, Thủ Dầu Một, Bình Dương',
    N'Bình Dương',
    10.96779500,
    106.66976000,
    8,
    6,
    N'24/7',
    N'Trung tâm hội chợ triển lãm, Khu thương mại, WiFi miễn phí, An ninh 24/7',
    N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- CAN THO (CẦN THƠ) - CHARGING STATIONS
-- =============================================

-- 17. Vincom Plaza Xuân Khánh - EV Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Vincom Plaza Xuân Khánh - EV Charging',
    N'209 Đường 30/4, Xuân Khánh, Ninh Kiều, Cần Thơ',
    N'Cần Thơ',
    10.03409200,
    105.77134600,
    8,
    7,
    N'09:00 - 22:00',
    N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực đặc sản miền Tây, WiFi miễn phí',
    N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 18. Sense City Cần Thơ - Green Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Sense City Cần Thơ - Green Charging',
    N'Đường Nguyễn Văn Cừ, An Khánh, Ninh Kiều, Cần Thơ',
    N'Cần Thơ',
    10.05180700,
    105.76831900,
    6,
    5,
    N'24/7',
    N'Khu đô thị mới, Trung tâm thương mại, WiFi miễn phí, Bãi đỗ xe rộng rãi',
    N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- NHA TRANG (KHÁNH HÒA) - CHARGING STATIONS
-- =============================================

-- 19. VinFast Green Charging - Vinpearl Nha Trang
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'VinFast Green Charging - Vinpearl Nha Trang',
    N'Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang, Khánh Hòa',
    N'Khánh Hòa',
    12.21898400,
    109.18641600,
    10,
    9,
    N'24/7',
    N'Khu du lịch cao cấp, Khách sạn 5 sao, Khu vui chơi giải trí, WiFi miễn phí, View biển tuyệt đẹp',
    N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 20. Lotte Mart Nha Trang - Charging Station
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Lotte Mart Nha Trang - Charging Station',
    N'32C Nguyễn Thị Minh Khai, Lộc Thọ, Nha Trang, Khánh Hòa',
    N'Khánh Hòa',
    12.24853500,
    109.19320000,
    6,
    5,
    N'08:00 - 22:00',
    N'Siêu thị lớn, Khu ẩm thực, WiFi miễn phí, Gần bãi biển',
    N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- HAI PHONG (HẢI PHÒNG) - CHARGING STATIONS
-- =============================================

-- 21. AEON Mall Hải Phòng Lê Chân - EV Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'AEON Mall Hải Phòng Lê Chân - EV Charging',
    N'10 Hồ Sen, Lê Chân, Hải Phòng',
    N'Hải Phòng',
    20.84510900,
    106.68031100,
    10,
    8,
    N'09:00 - 22:00',
    N'Trung tâm thương mại, Rạp chiếu phim, Siêu thị, Ẩm thực, WiFi miễn phí',
    N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 22. Vincom Plaza Hải Phòng - Fast Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Vincom Plaza Hải Phòng - Fast Charging',
    N'68A Lê Thánh Tông, Máy Chai, Ngô Quyền, Hải Phòng',
    N'Hải Phòng',
    20.86139100,
    106.68390300,
    8,
    7,
    N'09:00 - 22:00',
    N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực đa dạng, WiFi miễn phí',
    N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- VUNG TAU (BÀ RỊA - VŨNG TÀU) - CHARGING STATIONS
-- =============================================

-- 23. Shell Recharge - Thùy Vân
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Shell Recharge - Thùy Vân',
    N'1 Thùy Vân, Phường Thắng Tam, Vũng Tàu, Bà Rịa - Vũng Tàu',
    N'Bà Rịa - Vũng Tàu',
    10.34601700,
    107.08426100,
    8,
    6,
    N'06:00 - 23:00',
    N'Gần bãi biển, Cửa hàng tiện lợi, Khu vực nghỉ ngơi, View biển đẹp',
    N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 24. Lotte Mart Vũng Tàu - Charging Station
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Lotte Mart Vũng Tàu - Charging Station',
    N'39 Quang Trung, Phường 9, Vũng Tàu, Bà Rịa - Vũng Tàu',
    N'Bà Rịa - Vũng Tàu',
    10.35608400,
    107.07659900,
    6,
    5,
    N'08:00 - 22:00',
    N'Siêu thị lớn, Khu ẩm thực, WiFi miễn phí, Gần trung tâm thành phố',
    N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- HIGHWAY STATIONS (TRẠM SẠC TRÊN CAO TỐC)
-- =============================================

-- 25. VinFast Green Charging - Cao tốc Trung Lương
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'VinFast Green Charging - Cao tốc Trung Lương',
    N'Cao tốc TP.HCM - Trung Lương, Km 35, Bình Chánh, TP.HCM',
    N'Hồ Chí Minh',
    10.65284300,
    106.57862100,
    14,
    12,
    N'24/7',
    N'Trạm dừng chân cao tốc, Cửa hàng tiện lợi, Nhà hàng, Nhà vệ sinh, Bãi đỗ xe lớn',
    N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 26. Shell Recharge - Cao tốc Pháp Vân - Cầu Giẽ
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Shell Recharge - Cao tốc Pháp Vân - Cầu Giẽ',
    N'Cao tốc Pháp Vân - Cầu Giẽ, Km 20, Hà Nội',
    N'Hà Nội',
    20.90875600,
    105.87321400,
    10,
    8,
    N'24/7',
    N'Trạm dừng chân, Cửa hàng tiện lợi, Khu vực nghỉ ngơi, Nhà vệ sinh, Bãi đỗ xe rộng',
    N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 27. VinFast Green Charging - Cao tốc Đà Nẵng - Quảng Ngãi
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'VinFast Green Charging - Cao tốc Đà Nẵng - Quảng Ngãi',
    N'Cao tốc Đà Nẵng - Quảng Ngãi, Km 50, Duy Xuyên, Quảng Nam',
    N'Quảng Nam',
    15.91346800,
    108.18562300,
    8,
    7,
    N'24/7',
    N'Trạm dừng chân cao tốc, Cửa hàng tiện lợi, Nhà vệ sinh, Khu vực chờ có mái che',
    N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- =============================================
-- ADDITIONAL MAJOR CITIES
-- =============================================

-- 28. Vincom Plaza Huế - EV Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Vincom Plaza Huế - EV Charging',
    N'50 Hùng Vương, Vĩnh Ninh, Huế, Thừa Thiên Huế',
    N'Thừa Thiên Huế',
    16.46306500,
    107.59088200,
    8,
    6,
    N'09:00 - 22:00',
    N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực, WiFi miễn phí, Gần sông Hương',
    N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 29. Vincom Plaza Buôn Ma Thuột - EV Charging
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Vincom Plaza Buôn Ma Thuột - EV Charging',
    N'78-80 Lý Thường Kiệt, Tân Lợi, Buôn Ma Thuột, Đắk Lắk',
    N'Đắk Lắk',
    12.67546800,
    108.04233700,
    6,
    5,
    N'09:00 - 22:00',
    N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực, WiFi miễn phí, Đặc sản Tây Nguyên',
    N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

-- 30. Big C Quy Nhơn - Charging Station
INSERT INTO charging_stations (
    station_name, address, city, latitude, longitude,
    total_posts, available_posts, operating_hours, amenities,
    station_image_url, status, created_at, updated_at
) VALUES (
    N'Big C Quy Nhơn - Charging Station',
    N'450 Trần Hưng Đạo, Lê Hồng Phong, Quy Nhơn, Bình Định',
    N'Bình Định',
    13.77294700,
    109.22386300,
    6,
    5,
    N'08:00 - 22:00',
    N'Siêu thị lớn, Khu ẩm thực, WiFi miễn phí, Gần bãi biển Quy Nhơn',
    N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800',
    N'Active',
    GETDATE(),
    GETDATE()
);

GO

-- =============================================
-- VERIFY INSERTED DATA
-- =============================================

PRINT '=================================='
PRINT 'CHARGING STATIONS SUMMARY'
PRINT '=================================='
PRINT ''

SELECT 
    city,
    COUNT(*) AS total_stations,
    SUM(total_posts) AS total_charging_posts,
    SUM(available_posts) AS available_charging_posts
FROM charging_stations
GROUP BY city
ORDER BY COUNT(*) DESC;

PRINT ''
PRINT 'Total stations inserted: ' + CAST((SELECT COUNT(*) FROM charging_stations) AS VARCHAR(10))
PRINT 'Total charging posts: ' + CAST((SELECT SUM(total_posts) FROM charging_stations) AS VARCHAR(10))
PRINT ''
PRINT '=================================='
PRINT 'DATA INSERTION COMPLETED!'
PRINT '=================================='

GO
