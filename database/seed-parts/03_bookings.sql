SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO
PRINT 'Step 3/7: Creating 400 new bookings...';
GO
SET IDENTITY_INSERT bookings ON;
GO
DECLARE @StartBookingId INT;
SELECT @StartBookingId = ISNULL(MAX(booking_id), 0) + 1 FROM bookings;
DECLARE @BookingCounter INT = 0;

DECLARE @StationIds TABLE (StationId INT);
INSERT INTO @StationIds SELECT station_id FROM charging_stations WHERE deleted_at IS NULL;

-- pick slots dynamically from charging_slots (avoid hard-coded IDs)

DECLARE @VehicleIds TABLE (VehicleId INT, UserId INT);
INSERT INTO @VehicleIds SELECT vehicle_id, user_id FROM vehicles;

DECLARE @StartDate DATETIME2 = '2025-06-01';
DECLARE @EndDate DATETIME2 = '2025-11-05';
DECLARE @TotalDays INT = DATEDIFF(DAY, @StartDate, @EndDate);

DECLARE @PeakMorningStart INT = 7;
DECLARE @PeakMorningEnd INT = 9;
DECLARE @PeakEveningStart INT = 17;
DECLARE @PeakEveningEnd INT = 20;

DECLARE @k INT = 1;
WHILE @k <= 400
BEGIN
    DECLARE @BookingVehicleId INT, @BookingUserId INT;
    SELECT TOP 1 @BookingVehicleId = VehicleId, @BookingUserId = UserId FROM @VehicleIds ORDER BY NEWID();
    DECLARE @BookingStationId INT = (SELECT TOP 1 StationId FROM @StationIds ORDER BY NEWID());
    DECLARE @BookingSlotId INT = (
        SELECT TOP 1 cs.slot_id
        FROM charging_slots cs
        INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
        WHERE cp.station_id = @BookingStationId
        ORDER BY NEWID()
    );
    DECLARE @RandomDay INT = ABS(CHECKSUM(NEWID())) % @TotalDays;
    DECLARE @BookingDate DATETIME2 = DATEADD(DAY, @RandomDay, @StartDate);
    DECLARE @HourWeight INT = ABS(CHECKSUM(NEWID())) % 10;
    DECLARE @BookingHour INT;
    IF @HourWeight < 3
        SET @BookingHour = @PeakMorningStart + (ABS(CHECKSUM(NEWID())) % (@PeakMorningEnd - @PeakMorningStart + 1));
    ELSE IF @HourWeight < 6
        SET @BookingHour = @PeakEveningStart + (ABS(CHECKSUM(NEWID())) % (@PeakEveningEnd - @PeakEveningStart + 1));
    ELSE
        SET @BookingHour = (ABS(CHECKSUM(NEWID())) % 24);
    DECLARE @BookingMinute INT = (ABS(CHECKSUM(NEWID())) % 60);
    DECLARE @ActualStartTime DATETIME2 = DATEADD(MINUTE, @BookingMinute, DATEADD(HOUR, @BookingHour, @BookingDate));
    DECLARE @ChargingDuration INT = 30 + (ABS(CHECKSUM(NEWID())) % 91);
    DECLARE @ActualEndTime DATETIME2 = DATEADD(MINUTE, @ChargingDuration, @ActualStartTime);
    DECLARE @TargetSOC DECIMAL(5,2) = 70 + (ABS(CHECKSUM(NEWID())) % 31);
    DECLARE @StatusRand INT = ABS(CHECKSUM(NEWID())) % 100;
    DECLARE @BookingStatus NVARCHAR(50);
    IF @StatusRand < 90
        SET @BookingStatus = 'completed';
    ELSE IF @StatusRand < 95
        SET @BookingStatus = 'in_progress';
    ELSE
        SET @BookingStatus = 'cancelled';
    DECLARE @CreatedAt DATETIME2 = DATEADD(HOUR, -2, @ActualStartTime);
    INSERT INTO bookings (booking_id, user_id, vehicle_id, slot_id, station_id, scheduling_type, 
                         estimated_arrival, scheduled_start_time, actual_start_time, actual_end_time,
                         status, target_soc, estimated_duration, created_at, updated_at)
        VALUES (@StartBookingId + @BookingCounter, @BookingUserId, @BookingVehicleId, @BookingSlotId, @BookingStationId,
            'qr_immediate', @ActualStartTime, @ActualStartTime, @ActualStartTime, 
            CASE WHEN @BookingStatus = 'completed' THEN @ActualEndTime ELSE NULL END,
            @BookingStatus, @TargetSOC, @ChargingDuration, @CreatedAt, @CreatedAt);
    SET @BookingCounter = @BookingCounter + 1;
    SET @k = @k + 1;
END

PRINT 'Created ' + CAST(@BookingCounter AS VARCHAR) + ' new bookings';
SET IDENTITY_INSERT bookings OFF;
GO
