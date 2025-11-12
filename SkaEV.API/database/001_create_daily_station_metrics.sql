-- 001_create_daily_station_metrics.sql
-- Creates a physical table to hold daily pre-aggregated metrics per station
-- Run after importing the production DB dump to populate fast analytics

IF OBJECT_ID('dbo.daily_station_metrics', 'U') IS NOT NULL
    DROP TABLE dbo.daily_station_metrics;

CREATE TABLE dbo.daily_station_metrics (
    station_id INT NOT NULL,
    metrics_date DATE NOT NULL,
    total_bookings INT NOT NULL DEFAULT(0),
    completed_sessions INT NOT NULL DEFAULT(0),
    cancelled_sessions INT NOT NULL DEFAULT(0),
    no_show_sessions INT NOT NULL DEFAULT(0),
    total_usage_minutes INT NOT NULL DEFAULT(0),
    avg_session_minutes DECIMAL(10,2) NULL,
    total_energy_kwh DECIMAL(18,4) NOT NULL DEFAULT(0),
    total_revenue DECIMAL(18,2) NOT NULL DEFAULT(0),
    peak_hour TINYINT NULL,
    utilization_rate_percent DECIMAL(5,2) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_daily_station_metrics PRIMARY KEY (station_id, metrics_date)
);

-- Helpful indexes for queries filtering by date ranges
CREATE INDEX IX_daily_station_metrics_date ON dbo.daily_station_metrics(metrics_date);
CREATE INDEX IX_daily_station_metrics_station ON dbo.daily_station_metrics(station_id);

-- Populate initial data for the last 3 years (this can be constrained on large DBs)
-- WARNING: Adjust the WHERE clause to limit range when running on very large datasets.
INSERT INTO dbo.daily_station_metrics (station_id, metrics_date, total_bookings, completed_sessions, cancelled_sessions, no_show_sessions, total_usage_minutes, avg_session_minutes, total_energy_kwh, total_revenue, peak_hour, utilization_rate_percent)
SELECT
    b.StationId,
    CAST(b.CreatedAt AS date) AS metrics_date,
    COUNT(*) AS total_bookings,
    SUM(CASE WHEN b.Status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions,
    SUM(CASE WHEN b.Status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_sessions,
    SUM(CASE WHEN b.Status = 'no_show' THEN 1 ELSE 0 END) AS no_show_sessions,
    SUM(CASE WHEN i.TotalAmount IS NOT NULL THEN dbo.CalculateBookingMinutes(b.ActualStartTime, b.ActualEndTime, b.EstimatedDuration) ELSE 0 END) AS total_usage_minutes,
    NULL AS avg_session_minutes,
    SUM(ISNULL(i.TotalEnergyKwh,0)) AS total_energy_kwh,
    SUM(ISNULL(i.TotalAmount,0)) AS total_revenue,
    NULL AS peak_hour,
    NULL AS utilization_rate_percent
FROM bookings b
LEFT JOIN invoices i ON i.BookingId = b.BookingId AND i.PaymentStatus = 'paid'
WHERE b.CreatedAt >= DATEADD(year, -3, SYSUTCDATETIME())
GROUP BY b.StationId, CAST(b.CreatedAt AS date);

-- Update avg_session_minutes, peak_hour and utilization heuristics
-- avg_session_minutes
UPDATE d
SET avg_session_minutes = sub.avg_minutes
FROM dbo.daily_station_metrics d
INNER JOIN (
    SELECT CAST(b.CreatedAt AS date) AS metrics_date, b.StationId, AVG(datediff(minute, b.ActualStartTime, b.ActualEndTime)) AS avg_minutes
    FROM bookings b
    WHERE b.ActualStartTime IS NOT NULL AND b.ActualEndTime IS NOT NULL
    GROUP BY b.StationId, CAST(b.CreatedAt AS date)
) sub ON sub.stationId = d.station_id AND sub.metrics_date = d.metrics_date;

-- peak_hour
WITH HourCounts AS (
    SELECT CAST(b.CreatedAt AS date) AS metrics_date, b.StationId, DATEPART(hour, b.ActualStartTime) AS hr, COUNT(*) AS cnt
    FROM bookings b
    WHERE b.ActualStartTime IS NOT NULL
    GROUP BY b.StationId, CAST(b.CreatedAt AS date), DATEPART(hour, b.ActualStartTime)
)
UPDATE d
SET peak_hour = h.hr
FROM dbo.daily_station_metrics d
INNER JOIN (
    SELECT metrics_date, StationId, hr, cnt,
           ROW_NUMBER() OVER (PARTITION BY StationId, metrics_date ORDER BY cnt DESC, hr) AS rn
    FROM HourCounts
) h ON h.metrics_date = d.metrics_date AND h.StationId = d.station_id AND h.rn = 1;

-- utilization_rate_percent: completed_sessions / total_slots * 100 (approx)
-- We estimate total_slots by summing ChargingSlots per station
UPDATE d
SET utilization_rate_percent = CASE WHEN s.total_slots > 0 THEN ROUND((CAST(d.completed_sessions AS DECIMAL(18,2)) / s.total_slots) * 100, 2) ELSE 0 END
FROM dbo.daily_station_metrics d
INNER JOIN (
    SELECT p.StationId, SUM(sl.TotalSlots) AS total_slots
    FROM ChargingPosts p
    LEFT JOIN (SELECT ChargingPostId AS post_id, COUNT(*) AS TotalSlots FROM charging_slots GROUP BY ChargingPostId) sl ON sl.post_id = p.PostId
    GROUP BY p.StationId
) s ON s.StationId = d.station_id;

-- Update timestamps
UPDATE dbo.daily_station_metrics SET updated_at = SYSUTCDATETIME();

-- Helper function used above (if not existing)
IF OBJECT_ID('dbo.CalculateBookingMinutes', 'FN') IS NULL
EXEC('CREATE FUNCTION dbo.CalculateBookingMinutes(@start DATETIME2, @end DATETIME2, @estimated INT)
RETURNS INT
AS
BEGIN
    IF @start IS NOT NULL AND @end IS NOT NULL
        RETURN CASE WHEN DATEDIFF(MINUTE, @start, @end) < 0 THEN 0 ELSE DATEDIFF(MINUTE, @start, @end) END;
    IF @estimated IS NOT NULL
        RETURN @estimated;
    RETURN 0;
END');

-- Done
