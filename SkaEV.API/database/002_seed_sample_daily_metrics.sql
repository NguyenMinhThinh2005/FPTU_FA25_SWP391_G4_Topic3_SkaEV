-- 002_seed_sample_daily_metrics.sql
-- Inserts synthetic daily_station_metrics rows for development/testing when the real aggregates are not yet present.
-- This script is safe to run multiple times; it will skip dates that already exist.

SET NOCOUNT ON;

DECLARE @today DATE = CAST(SYSUTCDATETIME() AS date);
DECLARE @start DATE = DATEADD(day, -29, @today);

-- Get top 5 stations (if any)
IF OBJECT_ID('dbo.daily_station_metrics', 'U') IS NULL
BEGIN
    RAISERROR('daily_station_metrics table not found. Run 001_create_daily_station_metrics.sql first.', 16, 1);
    RETURN;
END

WITH top_stations AS (
    SELECT TOP (5) StationId FROM charging_stations WHERE DeletedAt IS NULL ORDER BY StationId
)
INSERT INTO dbo.daily_station_metrics (station_id, metrics_date, total_bookings, completed_sessions, cancelled_sessions, no_show_sessions, total_usage_minutes, avg_session_minutes, total_energy_kwh, total_revenue, peak_hour, utilization_rate_percent)
SELECT ts.StationId, d.theDate,
       ABS(CHECKSUM(NEWID()) % 50) + 1 AS total_bookings,
       ABS(CHECKSUM(NEWID()) % 40) + 1 AS completed_sessions,
       ABS(CHECKSUM(NEWID()) % 5) AS cancelled_sessions,
       ABS(CHECKSUM(NEWID()) % 3) AS no_show_sessions,
       (ABS(CHECKSUM(NEWID()) % 4000) + 200) AS total_usage_minutes,
       CAST((ABS(CHECKSUM(NEWID()) % 120) + 20) AS DECIMAL(10,2)) AS avg_session_minutes,
       CAST((ABS(CHECKSUM(NEWID()) % 1000) + 10) AS DECIMAL(18,4)) AS total_energy_kwh,
       CAST((ABS(CHECKSUM(NEWID()) % 200000) + 1000) AS DECIMAL(18,2)) AS total_revenue,
       ABS(CHECKSUM(NEWID()) % 23) AS peak_hour,
       CAST((ABS(CHECKSUM(NEWID()) % 100)) AS DECIMAL(5,2)) AS utilization_rate_percent
FROM top_stations ts
CROSS APPLY (
    SELECT DATEADD(day, v.number, @start) AS theDate
    FROM master..spt_values v
    WHERE v.type = 'P' AND v.number BETWEEN 0 AND DATEDIFF(day, @start, @today)
) d
LEFT JOIN dbo.daily_station_metrics existing ON existing.station_id = ts.StationId AND existing.metrics_date = d.theDate
WHERE existing.station_id IS NULL;

PRINT 'Sample daily metrics seeded (if table existed and stations found).';
