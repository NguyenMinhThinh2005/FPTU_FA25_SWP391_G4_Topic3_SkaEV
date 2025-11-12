USE SkaEV_DB;
GO

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

DECLARE @Now DATETIME2 = SYSDATETIME();
DECLARE @TodayStart DATETIME2 = CONVERT(DATETIME2(0), CAST(GETDATE() AS DATE));
DECLARE @PasswordHash NVARCHAR(255) = CONVERT(NVARCHAR(255), HASHBYTES('SHA2_256', 'Temp123!'), 1);

PRINT N'============================================';
PRINT N' ĐỒNG BỘ NHÂN SỰ & DOANH THU TRẠM SKAEV';
PRINT N'============================================';

-------------------------------------------------
-- 1. Đảm bảo đủ nhân viên quản lý (staff users)
-------------------------------------------------
DECLARE @StationTotal INT = (SELECT COUNT(*) FROM charging_stations WHERE deleted_at IS NULL);
DECLARE @ExistingStaff INT = (SELECT COUNT(*) FROM users WHERE role = 'staff' AND deleted_at IS NULL);

IF @ExistingStaff < @StationTotal
BEGIN
    DECLARE @Needed INT = @StationTotal - @ExistingStaff;
    DECLARE @Index INT = 1;

    WHILE @Index <= @Needed
    BEGIN
        DECLARE @Sequence INT = @ExistingStaff + @Index;
        DECLARE @Email NVARCHAR(120) = CONCAT('staff', RIGHT('0000' + CAST(@Sequence AS NVARCHAR(4)), 4), '@skaev.com');
        DECLARE @Phone NVARCHAR(20) = CONCAT('09', RIGHT('00000000' + CAST(@Sequence AS NVARCHAR(8)), 8));
        DECLARE @FullName NVARCHAR(120) = N'Nhân viên SkaEV ' + CAST(@Sequence AS NVARCHAR(10));

        IF NOT EXISTS (SELECT 1 FROM users WHERE email = @Email)
        BEGIN
            INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
            VALUES (@Email, @PasswordHash, @FullName, @Phone, 'staff', 1, @Now, @Now);
        END
        ELSE
        BEGIN
            UPDATE users
            SET role = 'staff',
                is_active = 1,
                full_name = ISNULL(full_name, @FullName),
                phone_number = ISNULL(phone_number, @Phone),
                updated_at = @Now
            WHERE email = @Email;
        END

        IF NOT EXISTS (SELECT 1 FROM user_profiles up JOIN users u ON up.user_id = u.user_id WHERE u.email = @Email)
        BEGIN
            INSERT INTO user_profiles (user_id, date_of_birth, avatar_url, created_at, updated_at)
            SELECT user_id, '1990-01-01', '/avatars/staff.png', @Now, @Now
            FROM users
            WHERE email = @Email;
        END

        SET @Index += 1;
    END
END

-------------------------------------------------
-- 2. Phân công nhân viên quản lý cho toàn bộ trạm
-------------------------------------------------
DECLARE @StaffPool TABLE (row_num INT IDENTITY(1,1), user_id INT);
INSERT INTO @StaffPool (user_id)
SELECT user_id
FROM users
WHERE role = 'staff' AND is_active = 1 AND deleted_at IS NULL
ORDER BY user_id;

DECLARE @StaffCount INT = (SELECT COUNT(*) FROM @StaffPool);
IF @StaffCount = 0
BEGIN
    RAISERROR (N'Không có nhân viên nào khả dụng để phân công.', 16, 1);
    RETURN;
END

DECLARE @Assignments TABLE (station_id INT PRIMARY KEY, staff_user_id INT);
INSERT INTO @Assignments (station_id, staff_user_id)
SELECT s.station_id, st.user_id
FROM (
     SELECT station_id,
         ROW_NUMBER() OVER (ORDER BY station_id) AS rn
     FROM charging_stations
     WHERE deleted_at IS NULL
     ) AS s
JOIN (
     SELECT user_id,
         ROW_NUMBER() OVER (ORDER BY user_id) AS rn
     FROM users
     WHERE role = 'staff' AND is_active = 1 AND deleted_at IS NULL
     ) AS st
  ON st.rn = ((s.rn - 1) % @StaffCount) + 1;

DELETE FROM station_staff
WHERE station_id IN (SELECT station_id FROM charging_stations WHERE deleted_at IS NULL);

INSERT INTO station_staff (staff_user_id, station_id, assigned_at, is_active)
SELECT staff_user_id, station_id, @Now, 1
FROM @Assignments;

-------------------------------------------------
-- 3. Đảm bảo mỗi trạm có phiên hoàn thành & doanh thu hôm nay
-------------------------------------------------
DECLARE @CustomerId INT = (
    SELECT TOP 1 user_id
    FROM users
    WHERE role = 'customer' AND is_active = 1 AND deleted_at IS NULL
    ORDER BY user_id
);

IF @CustomerId IS NULL
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES ('demo.customer@skaev.com', @PasswordHash, N'Khách hàng Demo', '0988888888', 'customer', 1, @Now, @Now);
    SET @CustomerId = SCOPE_IDENTITY();
END

IF NOT EXISTS (SELECT 1 FROM vehicles WHERE user_id = @CustomerId AND deleted_at IS NULL)
BEGIN
    INSERT INTO vehicles (user_id, vehicle_type, brand, model, license_plate, battery_capacity, charging_port_type, is_primary, created_at, updated_at)
    VALUES (@CustomerId, 'car', N'VinFast', N'VF e34', '30A-99999', 42.0, 'CCS2', 1, @Now, @Now);
END

DECLARE @VehicleId INT = (
    SELECT TOP 1 vehicle_id
    FROM vehicles
    WHERE user_id = @CustomerId AND deleted_at IS NULL
    ORDER BY is_primary DESC, vehicle_id
);

DECLARE @StationId INT;
DECLARE station_cursor CURSOR FOR
    SELECT station_id FROM charging_stations WHERE deleted_at IS NULL ORDER BY station_id;

OPEN station_cursor;
FETCH NEXT FROM station_cursor INTO @StationId;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM bookings b
        INNER JOIN invoices i ON i.booking_id = b.booking_id
        WHERE b.station_id = @StationId
          AND b.status = 'completed'
          AND b.deleted_at IS NULL
          AND b.created_at >= @TodayStart
    )
    BEGIN
        DECLARE @SlotId INT = (
            SELECT TOP 1 cs.slot_id
            FROM charging_slots cs
            INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
            WHERE cp.station_id = @StationId
            ORDER BY cs.slot_id
        );

        IF @SlotId IS NOT NULL
        BEGIN
            DECLARE @Start DATETIME2 = DATEADD(MINUTE, ABS(CHECKSUM(NEWID()) % 480), DATEADD(HOUR, 7, @TodayStart));
            DECLARE @Duration INT = 35 + ABS(CHECKSUM(NEWID()) % 80);
            DECLARE @End DATETIME2 = DATEADD(MINUTE, @Duration, @Start);
            DECLARE @Energy DECIMAL(10,2) = ROUND(@Duration * 0.42, 2);
            DECLARE @UnitPrice DECIMAL(10,2) = 4500;
            DECLARE @Subtotal DECIMAL(10,2) = ROUND(@Energy * @UnitPrice, 2);
            DECLARE @TaxAmount DECIMAL(10,2) = ROUND(@Subtotal * 0.1, 2);
            DECLARE @TotalAmount DECIMAL(10,2) = @Subtotal + @TaxAmount;

            INSERT INTO bookings (
                user_id, vehicle_id, slot_id, station_id,
                scheduling_type, estimated_arrival, scheduled_start_time,
                actual_start_time, actual_end_time, status,
                target_soc, estimated_duration, cancellation_reason,
                created_at, updated_at
            )
            VALUES (
                @CustomerId, @VehicleId, @SlotId, @StationId,
                'qr_immediate', @Start, @Start,
                @Start, @End, 'completed',
                90, @Duration, NULL,
                DATEADD(MINUTE, -10, @Start), @End
            );

            DECLARE @NewBookingId INT = SCOPE_IDENTITY();

            INSERT INTO invoices (
                booking_id, user_id, total_energy_kwh, unit_price,
                subtotal, tax_amount, total_amount,
                payment_method, payment_status, paid_at,
                created_at, updated_at
            )
            VALUES (
                @NewBookingId, @CustomerId, @Energy, @UnitPrice,
                @Subtotal, @TaxAmount, @TotalAmount,
                'credit_card', 'paid', @End,
                @End, @End
            );

            UPDATE charging_slots
            SET status = 'available',
                current_booking_id = NULL,
                updated_at = @End
            WHERE slot_id = @SlotId;

            UPDATE charging_posts
            SET available_slots = (
                    SELECT COUNT(*)
                    FROM charging_slots
                    WHERE post_id = charging_posts.post_id AND status = 'available'
                ),
                updated_at = @End
            WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @SlotId);

            UPDATE charging_stations
            SET available_posts = (
                    SELECT COUNT(DISTINCT cp.post_id)
                    FROM charging_posts cp
                    INNER JOIN charging_slots cs2 ON cp.post_id = cs2.post_id
                    WHERE cp.station_id = @StationId AND cs2.status = 'available'
                ),
                updated_at = @End
            WHERE station_id = @StationId;
        END
        ELSE
        BEGIN
            PRINT CONCAT(N'⚠️ Không tìm thấy slot khả dụng cho trạm ', @StationId, N'. Bỏ qua tạo revenue.');
        END
    END

    FETCH NEXT FROM station_cursor INTO @StationId;
END

CLOSE station_cursor;
DEALLOCATE station_cursor;

-------------------------------------------------
-- 4. Thống kê nhanh
-------------------------------------------------
DECLARE @ActiveAssignments INT = (SELECT COUNT(*) FROM station_staff WHERE is_active = 1);
DECLARE @BookingsToday INT = (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.status = 'completed'
      AND b.deleted_at IS NULL
      AND b.created_at >= @TodayStart
);
DECLARE @TodayRevenue DECIMAL(18,2) = (
    SELECT ISNULL(SUM(i.total_amount), 0)
    FROM invoices i
    INNER JOIN bookings b ON b.booking_id = i.booking_id
    WHERE b.status = 'completed'
      AND b.deleted_at IS NULL
      AND b.created_at >= @TodayStart
);

PRINT N'--------------------------------------------';
PRINT CONCAT(N'✓ Nhân viên quản lý đang hoạt động: ', @ActiveAssignments);
PRINT CONCAT(N'✓ Phiên hoàn thành (hôm nay): ', @BookingsToday);
PRINT CONCAT(N'✓ Doanh thu (hôm nay): ', FORMAT(@TodayRevenue, 'N0'), N' ₫');
PRINT N'============================================';
PRINT N' ĐỒNG BỘ HOÀN TẤT 100%';
PRINT N'============================================';
GO
