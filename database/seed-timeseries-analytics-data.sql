-- ============================================
-- Seed Time-Series Analytics Data for Station Detail View
-- Creates realistic bookings and invoices for the last 60 days
-- Ensures time-series charts have sufficient data
-- ============================================

-- Generate bookings for each station over the last 60 days
DECLARE @StartDate DATE = DATEADD(DAY, -60, GETDATE());
DECLARE @EndDate DATE = GETDATE();
DECLARE @CurrentDate DATE = @StartDate;
DECLARE @StationId INT;
DECLARE @UserId INT;
DECLARE @SlotId INT;
DECLARE @BookingId INT;
DECLARE @DailyBookings INT;
DECLARE @HourOfDay INT;
DECLARE @Duration INT;
DECLARE @EnergyKwh DECIMAL(10,2);
DECLARE @TotalCost DECIMAL(10,2);

PRINT 'Starting time-series data seeding for last 60 days...';

-- Loop through each day
WHILE @CurrentDate <= @EndDate
BEGIN
    PRINT 'Processing date: ' + CONVERT(VARCHAR, @CurrentDate, 120);
    
    -- Loop through each station
    DECLARE station_cursor CURSOR FOR
    SELECT station_id FROM charging_stations WHERE status = 'active';
    
    OPEN station_cursor;
    FETCH NEXT FROM station_cursor INTO @StationId;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Determine number of bookings for this day (5-25 random)
        SET @DailyBookings = FLOOR(RAND() * 21) + 5;
        
        -- Create multiple bookings for this station on this day
        DECLARE @BookingCounter INT = 0;
        WHILE @BookingCounter < @DailyBookings
        BEGIN
            -- Random user (1-50)
            SET @UserId = FLOOR(RAND() * 50) + 1;
            
            -- Random slot from this station
            SELECT TOP 1 @SlotId = cs.slot_id
            FROM charging_slots cs
            INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
            WHERE cp.station_id = @StationId
            ORDER BY NEWID();
            
            IF @SlotId IS NOT NULL
            BEGIN
                -- Random hour (6-22 for realistic charging patterns)
                SET @HourOfDay = FLOOR(RAND() * 17) + 6;
                
                -- Random duration (30-180 minutes)
                SET @Duration = FLOOR(RAND() * 151) + 30;
                
                -- Random energy consumed (10-80 kWh based on duration)
                SET @EnergyKwh = CAST((RAND() * 70 + 10) AS DECIMAL(10,2));
                
                -- Calculate cost (3000 VND/kWh average)
                SET @TotalCost = @EnergyKwh * 3000;
                
                -- Insert booking
                INSERT INTO bookings (
                    user_id, 
                    station_id, 
                    slot_id, 
                    status, 
                    actual_start_time, 
                    actual_end_time,
                    created_at,
                    updated_at
                )
                VALUES (
                    @UserId,
                    @StationId,
                    @SlotId,
                    CASE 
                        WHEN RAND() < 0.85 THEN 'completed'  -- 85% completed
                        WHEN RAND() < 0.95 THEN 'cancelled'   -- 10% cancelled
                        ELSE 'no_show'                         -- 5% no-show
                    END,
                    DATEADD(HOUR, @HourOfDay, @CurrentDate),
                    DATEADD(MINUTE, @Duration, DATEADD(HOUR, @HourOfDay, @CurrentDate)),
                    DATEADD(HOUR, @HourOfDay - 1, @CurrentDate),
                    DATEADD(HOUR, @HourOfDay + (@Duration/60), @CurrentDate)
                );
                
                SET @BookingId = SCOPE_IDENTITY();
                
                -- Create invoice only for completed bookings
                IF EXISTS (SELECT 1 FROM bookings WHERE booking_id = @BookingId AND status = 'completed')
                BEGIN
                    INSERT INTO invoices (
                        booking_id,
                        total_amount,
                        total_energy_kwh,
                        payment_status,
                        payment_method,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        @BookingId,
                        @TotalCost,
                        @EnergyKwh,
                        'paid',
                        CASE FLOOR(RAND() * 3)
                            WHEN 0 THEN 'VNPay'
                            WHEN 1 THEN 'MoMo'
                            ELSE 'ZaloPay'
                        END,
                        DATEADD(HOUR, @HourOfDay + (@Duration/60), @CurrentDate),
                        DATEADD(HOUR, @HourOfDay + (@Duration/60), @CurrentDate)
                    );
                END
            END
            
            SET @BookingCounter = @BookingCounter + 1;
        END
        
        FETCH NEXT FROM station_cursor INTO @StationId;
    END
    
    CLOSE station_cursor;
    DEALLOCATE station_cursor;
    
    -- Move to next day
    SET @CurrentDate = DATEADD(DAY, 1, @CurrentDate);
END

PRINT 'Time-series data seeding completed!';

-- Show summary statistics
SELECT 
    'Total Bookings Created' AS Metric,
    COUNT(*) AS Value
FROM bookings
WHERE created_at >= DATEADD(DAY, -60, GETDATE())

UNION ALL

SELECT 
    'Total Invoices Created' AS Metric,
    COUNT(*) AS Value
FROM invoices
WHERE created_at >= DATEADD(DAY, -60, GETDATE())

UNION ALL

SELECT 
    'Date Range Start' AS Metric,
    CONVERT(VARCHAR, MIN(created_at), 120) AS Value
FROM bookings
WHERE created_at >= DATEADD(DAY, -60, GETDATE())

UNION ALL

SELECT 
    'Date Range End' AS Metric,
    CONVERT(VARCHAR, MAX(created_at), 120) AS Value
FROM bookings
WHERE created_at >= DATEADD(DAY, -60, GETDATE());

PRINT 'Seeding script execution completed successfully!';
