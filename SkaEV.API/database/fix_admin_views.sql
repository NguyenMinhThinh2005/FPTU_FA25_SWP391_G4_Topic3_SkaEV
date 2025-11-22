SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

-- Ensure v_admin_usage_reports returns decimals where the application expects decimals
CREATE OR ALTER VIEW [dbo].[v_admin_usage_reports] AS
SELECT 
    cs.station_id,
    cs.station_name,
    YEAR(b.actual_start_time) AS year,
    MONTH(b.actual_start_time) AS month,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.booking_id END) AS completed_sessions,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.booking_id END) AS cancelled_sessions,
    COUNT(DISTINCT CASE WHEN b.status = 'no_show' THEN b.booking_id END) AS no_show_sessions,
    -- Calculate total minutes used
    SUM(CASE 
        WHEN b.actual_start_time IS NOT NULL AND b.actual_end_time IS NOT NULL 
        THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) 
        ELSE 0 
    END) AS total_usage_minutes,
    -- Average session duration
    AVG(CASE 
        WHEN b.actual_start_time IS NOT NULL AND b.actual_end_time IS NOT NULL 
        THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) 
        ELSE NULL 
    END) AS avg_session_duration_minutes,
    -- Peak usage hour
    (
        SELECT TOP 1 DATEPART(HOUR, b2.actual_start_time)
        FROM bookings b2
        WHERE b2.station_id = cs.station_id AND b2.actual_start_time IS NOT NULL
        GROUP BY DATEPART(HOUR, b2.actual_start_time)
        ORDER BY COUNT(*) DESC
    ) AS peak_usage_hour,
    -- Utilization rate (assuming 24/7 operation) - return DECIMAL to match application expectations
    CAST(
        (
            CAST(SUM(CASE 
                WHEN b.actual_start_time IS NOT NULL AND b.actual_end_time IS NOT NULL 
                THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) 
                ELSE 0 
            END) AS FLOAT) / 
            NULLIF((DATEDIFF(DAY, MIN(b.actual_start_time), MAX(b.actual_end_time)) * 1440 * cs.total_posts), 0) * 100
        ) AS DECIMAL(10,2)
    ) AS utilization_rate_percent
FROM charging_stations cs
LEFT JOIN bookings b ON cs.station_id = b.station_id
GROUP BY 
    cs.station_id,
    cs.station_name,
    cs.total_posts,
    YEAR(b.actual_start_time),
    MONTH(b.actual_start_time);
GO

-- Create a station performance view used by admin dashboard and reports
CREATE OR ALTER VIEW [dbo].[v_station_performance] AS
SELECT
    cs.station_id,
    cs.station_name,
    (cs.address + ', ' + cs.city) AS location,
    cs.total_posts,
    cs.status AS station_status,
    ISNULL(cs.ActiveSessions, 0) AS active_sessions,
    -- slots in use (slots not 'available')
    ISNULL(
        (
            SELECT COUNT(*) FROM charging_slots s
            INNER JOIN charging_posts p ON s.post_id = p.post_id
            WHERE p.station_id = cs.station_id AND s.status != 'available'
        ), 0
    ) AS slots_in_use,
    -- current occupancy percent as DECIMAL
    CASE WHEN cs.total_posts > 0 THEN
        CAST(
            ISNULL(
                (
                    SELECT CAST(COUNT(*) AS FLOAT) FROM charging_slots s
                    INNER JOIN charging_posts p ON s.post_id = p.post_id
                    WHERE p.station_id = cs.station_id AND s.status != 'available'
                ), 0
            ) / CAST(cs.total_posts AS FLOAT) * 100
        AS DECIMAL(10,2))
    ELSE 0 END AS current_occupancy_percent,
    -- today's total sessions
    ISNULL((SELECT COUNT(*) FROM bookings b WHERE b.station_id = cs.station_id AND CONVERT(date, b.created_at) = CONVERT(date, GETUTCDATE())), 0) AS today_total_sessions,
    -- revenue last 24 hours
    ISNULL((
        SELECT SUM(i.total_amount) FROM invoices i
        INNER JOIN bookings b2 ON i.booking_id = b2.booking_id
        WHERE b2.station_id = cs.station_id AND i.payment_status = 'paid' AND i.created_at >= DATEADD(day, -1, GETUTCDATE())
    ), 0) AS revenue_last24h
FROM charging_stations cs;
GO
