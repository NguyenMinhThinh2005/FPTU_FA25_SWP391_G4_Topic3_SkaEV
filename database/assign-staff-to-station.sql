-- Assign staff@skaev.com to a station
USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DECLARE @StaffUserId INT;
DECLARE @StationId INT;

-- Get staff user ID
SELECT @StaffUserId = user_id FROM users WHERE email = 'staff@skaev.com';

-- Get first available station
SELECT TOP 1 @StationId = station_id FROM charging_stations WHERE deleted_at IS NULL;

-- Remove any existing assignments for this staff
UPDATE station_staff SET is_active = 0 WHERE staff_user_id = @StaffUserId;

-- Create new assignment
IF @StaffUserId IS NOT NULL AND @StationId IS NOT NULL
BEGIN
    -- Check if assignment already exists
    IF NOT EXISTS (
        SELECT 1 FROM station_staff 
        WHERE staff_user_id = @StaffUserId AND station_id = @StationId
    )
    BEGIN
        INSERT INTO station_staff (staff_user_id, station_id, assigned_at, is_active)
        VALUES (@StaffUserId, @StationId, GETDATE(), 1);
        
        PRINT '✓ Assigned staff to station ' + CAST(@StationId AS NVARCHAR);
    END
    ELSE
    BEGIN
        UPDATE station_staff 
        SET is_active = 1, assigned_at = GETDATE()
        WHERE staff_user_id = @StaffUserId AND station_id = @StationId;
        
        PRINT '✓ Reactivated staff assignment to station ' + CAST(@StationId AS NVARCHAR);
    END
    
    -- Show assignment
    SELECT 
        u.full_name AS StaffName,
        u.email AS StaffEmail,
        cs.station_name AS StationName,
        cs.address AS StationAddress,
        ss.assigned_at AS AssignedAt
    FROM station_staff ss
    JOIN users u ON ss.staff_user_id = u.user_id
    JOIN charging_stations cs ON ss.station_id = cs.station_id
    WHERE ss.staff_user_id = @StaffUserId AND ss.is_active = 1;
END
ELSE
BEGIN
    PRINT '✗ Staff or Station not found!';
    PRINT 'Staff ID: ' + ISNULL(CAST(@StaffUserId AS NVARCHAR), 'NULL');
    PRINT 'Station ID: ' + ISNULL(CAST(@StationId AS NVARCHAR), 'NULL');
END

GO
