-- Script để test dữ liệu Dashboard Staff
-- Tạo dữ liệu mẫu cho các chỉ số: Doanh thu, Phiên hoàn thành, Năng lượng tiêu thụ, Xe đang sạc

USE SkaEV_DB;
GO

-- 1. Kiểm tra dữ liệu hiện tại
PRINT '=== KIỂM TRA DỮ LIỆU HIỆN TẠI ===';

-- Booking đang active
SELECT 
    'Active Bookings' AS DataType,
    COUNT(*) AS Count
FROM Bookings 
WHERE Status = 'in_progress';

-- Booking hoàn thành hôm nay
SELECT 
    'Completed Today' AS DataType,
    COUNT(*) AS Count
FROM Bookings 
WHERE Status = 'completed' 
    AND CAST(ActualStartTime AS DATE) = CAST(GETDATE() AS DATE);

-- Invoice đã thanh toán hôm nay
SELECT 
    'Revenue Today' AS DataType,
    ISNULL(SUM(TotalAmount), 0) AS TotalRevenue,
    ISNULL(SUM(TotalEnergyKwh), 0) AS TotalEnergy
FROM Invoices 
WHERE PaymentStatus = 'paid' 
    AND CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE);

PRINT '';
PRINT '=== TẠO DỮ LIỆU MẪU (nếu cần) ===';

-- 2. Tạo booking hoàn thành mẫu cho hôm nay
-- (Chỉ chạy nếu chưa có dữ liệu)

DECLARE @UserId INT = 2; -- Customer user
DECLARE @StationId INT = 1; -- VinFast Green Charging
DECLARE @SlotId INT = 1; -- Slot đầu tiên

-- Tạo 1 booking đã hoàn thành
IF NOT EXISTS (
    SELECT 1 FROM Bookings 
    WHERE Status = 'completed' 
        AND CAST(ActualStartTime AS DATE) = CAST(GETDATE() AS DATE)
)
BEGIN
    DECLARE @NewBookingId INT;
    
    INSERT INTO Bookings (
        UserId, StationId, SlotId, 
        BookingCode, 
        ReservationStartTime, ReservationEndTime,
        ActualStartTime, ActualEndTime,
        InitialSoc, FinalSoc,
        Status, 
        CreatedAt
    ) VALUES (
        @UserId, @StationId, @SlotId,
        'BK' + FORMAT(GETDATE(), 'yyyyMMddHHmmss'),
        DATEADD(HOUR, -3, GETDATE()), DATEADD(HOUR, -1, GETDATE()),
        DATEADD(HOUR, -2, GETDATE()), DATEADD(HOUR, -1, GETDATE()),
        20, 80,
        'completed',
        DATEADD(HOUR, -3, GETDATE())
    );
    
    SET @NewBookingId = SCOPE_IDENTITY();
    
    -- Tạo Invoice cho booking này
    INSERT INTO Invoices (
        BookingId,
        InvoiceCode,
        TotalAmount,
        TotalEnergyKwh,
        UnitPrice,
        PaymentMethod,
        PaymentStatus,
        CreatedAt
    ) VALUES (
        @NewBookingId,
        'INV' + FORMAT(GETDATE(), 'yyyyMMddHHmmss'),
        300000, -- 300,000 VND
        60, -- 60 kWh
        5000, -- 5,000 VND/kWh
        'cash',
        'paid',
        DATEADD(HOUR, -1, GETDATE())
    );
    
    -- Tạo SoC Tracking
    INSERT INTO SocTrackings (
        BookingId,
        RecordedAt,
        SocPercentage,
        VoltageVolts,
        CurrentAmperes,
        PowerKw,
        EnergyConsumedKwh
    ) VALUES 
    (@NewBookingId, DATEADD(HOUR, -2, GETDATE()), 20, 400, 125, 50, 0),
    (@NewBookingId, DATEADD(MINUTE, -90, GETDATE()), 40, 400, 125, 50, 20),
    (@NewBookingId, DATEADD(MINUTE, -60, GETDATE()), 60, 400, 125, 50, 40),
    (@NewBookingId, DATEADD(MINUTE, -30, GETDATE()), 80, 400, 100, 40, 60);
    
    PRINT '✅ Đã tạo 1 booking hoàn thành mẫu với doanh thu 300,000 VND';
END
ELSE
BEGIN
    PRINT '⚠️ Đã có booking hoàn thành hôm nay, bỏ qua tạo mẫu';
END

-- 3. Tạo booking đang sạc (in_progress)
IF NOT EXISTS (
    SELECT 1 FROM Bookings 
    WHERE Status = 'in_progress'
)
BEGIN
    DECLARE @ActiveBookingId INT;
    
    INSERT INTO Bookings (
        UserId, StationId, SlotId,
        BookingCode,
        ReservationStartTime, ReservationEndTime,
        ActualStartTime,
        InitialSoc, FinalSoc,
        Status,
        CreatedAt
    ) VALUES (
        @UserId, @StationId, 2, -- Slot 2
        'BK' + FORMAT(GETDATE(), 'yyyyMMddHHmmss') + 'ACT',
        DATEADD(MINUTE, -30, GETDATE()), DATEADD(HOUR, 2, GETDATE()),
        DATEADD(MINUTE, -30, GETDATE()),
        25, NULL,
        'in_progress',
        DATEADD(MINUTE, -30, GETDATE())
    );
    
    SET @ActiveBookingId = SCOPE_IDENTITY();
    
    -- Update slot to link to this booking
    UPDATE ChargingSlots 
    SET CurrentBookingId = @ActiveBookingId,
        Status = 'in_use'
    WHERE SlotId = 2;
    
    -- Tạo SoC Tracking cho booking đang sạc
    INSERT INTO SocTrackings (
        BookingId,
        RecordedAt,
        SocPercentage,
        VoltageVolts,
        CurrentAmperes,
        PowerKw,
        EnergyConsumedKwh
    ) VALUES 
    (@ActiveBookingId, DATEADD(MINUTE, -30, GETDATE()), 25, 400, 125, 50, 0),
    (@ActiveBookingId, DATEADD(MINUTE, -20, GETDATE()), 35, 400, 125, 50, 8.3),
    (@ActiveBookingId, DATEADD(MINUTE, -10, GETDATE()), 45, 400, 125, 50, 16.7),
    (@ActiveBookingId, GETDATE(), 55, 400, 125, 50, 25);
    
    PRINT '✅ Đã tạo 1 booking đang sạc (in_progress) với 25 kWh';
END
ELSE
BEGIN
    PRINT '⚠️ Đã có booking đang sạc, bỏ qua tạo mẫu';
END

PRINT '';
PRINT '=== KẾT QUẢ SAU KHI TẠO DỮ LIỆU ===';

-- Kiểm tra lại
SELECT 
    'Active Sessions' AS Metric,
    COUNT(*) AS Value
FROM Bookings 
WHERE Status = 'in_progress'
UNION ALL
SELECT 
    'Completed Today' AS Metric,
    COUNT(*) AS Value
FROM Bookings 
WHERE Status = 'completed' 
    AND CAST(ActualStartTime AS DATE) = CAST(GETDATE() AS DATE)
UNION ALL
SELECT 
    'Revenue Today (VND)' AS Metric,
    ISNULL(SUM(TotalAmount), 0) AS Value
FROM Invoices i
INNER JOIN Bookings b ON i.BookingId = b.BookingId
WHERE i.PaymentStatus = 'paid' 
    AND CAST(b.ActualStartTime AS DATE) = CAST(GETDATE() AS DATE)
UNION ALL
SELECT 
    'Energy Today (kWh)' AS Metric,
    ISNULL(SUM(i.TotalEnergyKwh), 0) AS Value
FROM Invoices i
INNER JOIN Bookings b ON i.BookingId = b.BookingId
WHERE CAST(b.ActualStartTime AS DATE) = CAST(GETDATE() AS DATE);

PRINT '';
PRINT '✅ Script hoàn tất! Bây giờ refresh Staff Dashboard để xem dữ liệu.';
