-- Ensure every station has at least one completed session with positive revenue
USE SkaEV_DB;
GO

SET NOCOUNT ON;

DECLARE @DefaultPassword NVARCHAR(255) = CONVERT(nvarchar(255), HASHBYTES('SHA2_256', 'Temp123!'), 1);
DECLARE @CustomerId INT = (
    SELECT TOP 1 user_id
    FROM dbo.users
    WHERE role = 'customer' AND is_active = 1 AND deleted_at IS NULL
    ORDER BY created_at
);

IF @CustomerId IS NULL
BEGIN
    INSERT INTO dbo.users (
        email,
        password_hash,
        full_name,
        phone_number,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        'demo.analytics.customer@skaev.com',
        @DefaultPassword,
        N'Khách hàng Analytics',
        '0980000000',
        'customer',
        1,
        SYSDATETIME(),
        SYSDATETIME()
    );

    SET @CustomerId = SCOPE_IDENTITY();
END;

DECLARE @CreatedSessions INT = 0;
DECLARE @StationId INT;
DECLARE @StationName NVARCHAR(255);

DECLARE station_cursor CURSOR FOR
SELECT station_id, station_name
FROM dbo.charging_stations
WHERE deleted_at IS NULL;

OPEN station_cursor;
FETCH NEXT FROM station_cursor INTO @StationId, @StationName;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (
        SELECT 1
        FROM dbo.invoices i
        JOIN dbo.bookings b ON i.booking_id = b.booking_id
        WHERE b.station_id = @StationId
          AND i.payment_status = 'paid'
          AND i.total_amount > 0
          AND b.status = 'completed'
    )
    BEGIN
        FETCH NEXT FROM station_cursor INTO @StationId, @StationName;
        CONTINUE;
    END;

    DECLARE @SlotId INT;
    DECLARE @PostId INT;

    SELECT TOP 1
        @SlotId = cs.slot_id,
        @PostId = cp.post_id
    FROM dbo.charging_slots cs
    INNER JOIN dbo.charging_posts cp ON cs.post_id = cp.post_id
    WHERE cp.station_id = @StationId
    ORDER BY cs.slot_id;

    IF @SlotId IS NULL
    BEGIN
        PRINT CONCAT(N'⚠️ Bỏ qua trạm ', @StationName, N' do không tìm thấy cổng sạc.');
        FETCH NEXT FROM station_cursor INTO @StationId, @StationName;
        CONTINUE;
    END;

    DECLARE @StartTime DATETIME2 = DATEADD(HOUR, -ABS(CHECKSUM(NEWID()) % 168), SYSDATETIME());
    DECLARE @Duration INT = 35 + ABS(CHECKSUM(NEWID()) % 75); -- 35-109 phút
    DECLARE @EndTime DATETIME2 = DATEADD(MINUTE, @Duration, @StartTime);
    DECLARE @EnergyKwh DECIMAL(10,2) = ROUND(@Duration * 0.45, 2); -- 0.45 kWh mỗi phút trung bình
    DECLARE @UnitPrice DECIMAL(10,2) = 4500;
    DECLARE @Subtotal DECIMAL(10,2) = ROUND(@EnergyKwh * @UnitPrice, 2);
    DECLARE @TaxAmount DECIMAL(10,2) = ROUND(@Subtotal * 0.1, 2);
    DECLARE @TotalAmount DECIMAL(10,2) = @Subtotal + @TaxAmount;

    INSERT INTO dbo.bookings (
        user_id,
        slot_id,
        vehicle_id,
        station_id,
        scheduling_type,
        scheduled_start_time,
        actual_start_time,
        actual_end_time,
        target_soc,
        estimated_duration,
        status,
        created_at,
        updated_at
    )
    VALUES (
        @CustomerId,
        @SlotId,
        NULL,
        @StationId,
        'instant',
        @StartTime,
        @StartTime,
        @EndTime,
        90,
        @Duration,
        'completed',
        DATEADD(HOUR, -2, @StartTime),
        @EndTime
    );

    DECLARE @BookingId INT = SCOPE_IDENTITY();

    INSERT INTO dbo.invoices (
        booking_id,
        user_id,
        total_energy_kwh,
        unit_price,
        subtotal,
        tax_amount,
        total_amount,
        payment_method,
        payment_status,
        paid_at,
        created_at,
        updated_at
    )
    VALUES (
        @BookingId,
        @CustomerId,
        @EnergyKwh,
        @UnitPrice,
        @Subtotal,
        @TaxAmount,
        @TotalAmount,
        'momo',
        'paid',
        DATEADD(MINUTE, 3, @EndTime),
        @StartTime,
        @EndTime
    );

    UPDATE dbo.charging_slots
    SET status = 'available',
        current_booking_id = NULL,
        updated_at = SYSDATETIME()
    WHERE slot_id = @SlotId;

    UPDATE dbo.charging_posts
    SET available_slots = (
        SELECT COUNT(*)
        FROM dbo.charging_slots
        WHERE post_id = @PostId AND status = 'available'
    ),
        updated_at = SYSDATETIME()
    WHERE post_id = @PostId;

    UPDATE dbo.charging_stations
    SET available_posts = (
        SELECT COUNT(DISTINCT cp.post_id)
        FROM dbo.charging_posts cp
        INNER JOIN dbo.charging_slots cs2 ON cp.post_id = cs2.post_id
        WHERE cp.station_id = @StationId AND cs2.status = 'available'
    ),
        updated_at = SYSDATETIME()
    WHERE station_id = @StationId;

    SET @CreatedSessions = @CreatedSessions + 1;
    PRINT CONCAT(N'✅ Đã tạo phiên hoàn thành cho trạm ', @StationName, N' với doanh thu ',
                 CONVERT(NVARCHAR(32), @TotalAmount), N' VND.');

    FETCH NEXT FROM station_cursor INTO @StationId, @StationName;
END;

CLOSE station_cursor;
DEALLOCATE station_cursor;

PRINT CONCAT(N'Hoàn tất. ', CONVERT(NVARCHAR(10), @CreatedSessions),
             N' trạm đã được đảm bảo có phiên sạc thành công với doanh thu dương.');
GO
