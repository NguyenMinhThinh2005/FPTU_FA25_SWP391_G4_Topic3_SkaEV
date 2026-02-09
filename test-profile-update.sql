-- =====================================================
-- Test Script: Kiểm tra cập nhật profile Staff
-- =====================================================

USE SkaEV_DB;
GO

-- 1. Xem thông tin Staff hiện tại TRƯỚC KHI cập nhật
SELECT 
    UserId,
    Email,
    FullName,
    PhoneNumber,
    Role,
    IsActive,
    CreatedAt,
    UpdatedAt
FROM Users
WHERE Email = 'staff@skaev.com';

-- Expected result TRƯỚC cập nhật:
-- FullName: 'Thành Đạt'
-- PhoneNumber: '0000000000'

GO

-- 2. Chạy lại query này SAU KHI cập nhật từ UI
-- Bước test:
-- a. Đăng nhập với staff@skaev.com
-- b. Vào /staff/profile
-- c. Nhấn "Chỉnh sửa hồ sơ"
-- d. Thay đổi:
--    - Họ: "Nguyễn Thành"
--    - Tên: "Đạt Updated"
--    - Số điện thoại: "0987654321"
-- e. Nhấn "Lưu"
-- f. Chạy query dưới để kiểm tra

SELECT 
    UserId,
    Email,
    FullName,
    PhoneNumber,
    Role,
    IsActive,
    CreatedAt,
    UpdatedAt,
    DATEDIFF(SECOND, UpdatedAt, GETUTCDATE()) as SecondsAgo
FROM Users
WHERE Email = 'staff@skaev.com';

-- Expected result SAU cập nhật:
-- FullName: 'Nguyễn Thành Đạt Updated'
-- PhoneNumber: '0987654321'
-- UpdatedAt: Thời gian vừa update (SecondsAgo < 60)

GO

-- 3. Kiểm tra Admin có thấy thay đổi không
-- Chạy query này để xem dữ liệu mà Admin sẽ thấy
SELECT 
    u.UserId,
    u.Email,
    u.FullName,
    u.PhoneNumber,
    u.Role,
    CASE WHEN u.IsActive = 1 THEN 'active' ELSE 'inactive' END as Status,
    u.CreatedAt,
    u.UpdatedAt,
    up.AvatarUrl,
    COUNT(DISTINCT b.BookingId) as TotalBookings,
    COUNT(DISTINCT v.VehicleId) as VehiclesCount
FROM Users u
LEFT JOIN UserProfiles up ON u.UserId = up.UserId
LEFT JOIN Bookings b ON u.UserId = b.UserId
LEFT JOIN Vehicles v ON u.UserId = v.UserId
WHERE u.Email = 'staff@skaev.com'
GROUP BY 
    u.UserId, u.Email, u.FullName, u.PhoneNumber, 
    u.Role, u.IsActive, u.CreatedAt, u.UpdatedAt, up.AvatarUrl;

-- Kết quả này PHẢI GIỐNG với kết quả query 2
-- Vì Admin đọc từ cùng bảng Users

GO

-- 4. Test rollback (nếu cần)
-- UPDATE Users 
-- SET 
--     FullName = 'Thành Đạt',
--     PhoneNumber = '0000000000',
--     UpdatedAt = GETUTCDATE()
-- WHERE Email = 'staff@skaev.com';

GO
