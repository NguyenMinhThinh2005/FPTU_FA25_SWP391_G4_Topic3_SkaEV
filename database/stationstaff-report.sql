-- stationstaff-report.sql
-- Read-only report: list all active StationStaff assignments and an aggregate view per staff user.
-- Run this in SSMS or with sqlcmd to inspect which users/assignments are active.

PRINT 'Detailed active StationStaff assignments';
SELECT
    ss.AssignmentId,
    ss.StaffUserId,
    u.FullName,
    u.Email,
    u.IsActive AS UserIsActive,
    ss.StationId,
    cs.StationName,
    ss.AssignedAt
FROM StationStaff ss
LEFT JOIN [Users] u ON u.UserId = ss.StaffUserId
LEFT JOIN ChargingStations cs ON cs.StationId = ss.StationId
WHERE ss.IsActive = 1
ORDER BY u.Email, ss.AssignedAt;

PRINT 'Aggregate: unique staff with active assignment counts and station list';
SELECT
    ss.StaffUserId,
    u.FullName,
    u.Email,
    COUNT(1) AS ActiveAssignmentCount,
    STRING_AGG(CONCAT(ss.StationId, ':', ISNULL(cs.StationName, '')) , '; ') AS Stations
FROM StationStaff ss
LEFT JOIN [Users] u ON u.UserId = ss.StaffUserId
LEFT JOIN ChargingStations cs ON cs.StationId = ss.StationId
WHERE ss.IsActive = 1
GROUP BY ss.StaffUserId, u.FullName, u.Email
ORDER BY ActiveAssignmentCount DESC, u.Email;

PRINT 'Unique staff userIds (active assignments)';
SELECT DISTINCT ss.StaffUserId, u.Email, u.FullName
FROM StationStaff ss
LEFT JOIN [Users] u ON u.UserId = ss.StaffUserId
WHERE ss.IsActive = 1
ORDER BY u.Email;
