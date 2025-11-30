-- Fix column names in v_admin_usage_reports to match C# DTO (PascalCase)

USE SkaEV_DB;
GO

IF OBJECT_ID('v_admin_usage_reports', 'V') IS NOT NULL
    DROP VIEW v_admin_usage_reports;
GO

CREATE VIEW [dbo].[v_admin_usage_reports] AS
SELECT 
    cs.station_id AS StationId,
    cs.station_name AS StationName,
    YEAR(b.actual_start_time) AS [Year],
    MONTH(b.actual_start_time) AS [Month],
    COUNT(DISTINCT b.booking_id) AS TotalBookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.booking_id END) AS CompletedSessions,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.booking_id END) AS CancelledSessions,
    COUNT(DISTINCT CASE WHEN b.status = 'no_show' THEN b.booking_id END) AS NoShowSessions,
    -- Calculate total minutes used
    SUM(CASE 
        WHEN b.actual_start_time IS NOT NULL AND b.actual_end_time IS NOT NULL 
        THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) 
        ELSE 0 
    END) AS TotalUsageMinutes,
    -- Average session duration
    AVG(CASE 
        WHEN b.actual_start_time IS NOT NULL AND b.actual_end_time IS NOT NULL 
        THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) 
        ELSE NULL 
    END) AS AvgSessionDurationMinutes,
    -- Peak usage hour
    (
        SELECT TOP 1 DATEPART(HOUR, b2.actual_start_time)
        FROM bookings b2
        WHERE b2.station_id = cs.station_id AND b2.actual_start_time IS NOT NULL
        GROUP BY DATEPART(HOUR, b2.actual_start_time)
        ORDER BY COUNT(*) DESC
    ) AS PeakUsageHour,
    -- Utilization rate (assuming 24/7 operation)
    CAST(SUM(CASE 
        WHEN b.actual_start_time IS NOT NULL AND b.actual_end_time IS NOT NULL 
        THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) 
        ELSE 0 
    END) AS FLOAT) / 
    NULLIF((DATEDIFF(DAY, MIN(b.actual_start_time), MAX(b.actual_end_time)) * 1440 * cs.total_posts), 0) * 100 
    AS UtilizationRatePercent
FROM charging_stations cs
LEFT JOIN bookings b ON cs.station_id = b.station_id
GROUP BY 
    cs.station_id,
    cs.station_name,
    cs.total_posts,
    YEAR(b.actual_start_time),
    MONTH(b.actual_start_time);
GO

PRINT 'View v_admin_usage_reports updated with PascalCase column names!';
