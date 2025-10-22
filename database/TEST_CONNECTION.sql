-- Test connection to database
SELECT 
    @@SERVERNAME AS ServerName,
    DB_NAME() AS CurrentDatabase,
    GETDATE() AS CurrentTime,
    (SELECT COUNT(*) FROM dbo.charging_stations) AS StationCount,
    (SELECT COUNT(*) FROM dbo.users) AS UserCount;
