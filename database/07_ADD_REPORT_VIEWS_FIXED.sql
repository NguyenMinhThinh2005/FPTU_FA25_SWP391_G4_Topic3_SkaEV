-- =============================================
-- Script: 07_ADD_REPORT_VIEWS_FIXED.sql
-- Description: Create views for reporting and analytics (FIXED FOR ACTUAL SCHEMA)
-- Version: 1.1
-- Date: 2025-10-14
-- =============================================

USE SkaEV_DB;
GO

PRINT 'Creating report views...';

-- =============================================
-- 1. User Cost Reports View
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_user_cost_reports')
    DROP VIEW v_user_cost_reports;
GO

CREATE VIEW v_user_cost_reports AS
SELECT 
    u.user_id,
    u.email,
    u.full_name,
    YEAR(i.created_at) AS year,
    MONTH(i.created_at) AS month,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    SUM(DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time)) AS total_charging_minutes,
    SUM(i.total_energy_kwh) AS total_energy_kwh,
    SUM(i.subtotal) AS total_energy_cost,
    SUM(i.tax_amount) AS total_tax,
    SUM(i.total_amount) AS total_amount_paid,
    AVG(i.total_amount) AS avg_cost_per_session,
    MIN(i.total_amount) AS min_session_cost,
    MAX(i.total_amount) AS max_session_cost
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
WHERE i.payment_status = 'paid'
GROUP BY 
    u.user_id,
    u.email,
    u.full_name,
    YEAR(i.created_at),
    MONTH(i.created_at);
GO

PRINT '✓ Created v_user_cost_reports view';
GO

-- =============================================
-- 2. User Charging Habits View
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_user_charging_habits')
    DROP VIEW v_user_charging_habits;
GO

CREATE VIEW v_user_charging_habits AS
SELECT 
    u.user_id,
    u.email,
    u.full_name,
    COUNT(DISTINCT b.booking_id) AS total_sessions,
    AVG(DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time)) AS avg_session_duration_minutes,
    AVG(i.total_energy_kwh) AS avg_energy_per_session,
    -- Preferred charging time (hour of day)
    (
        SELECT TOP 1 DATEPART(HOUR, b2.actual_start_time)
        FROM bookings b2
        WHERE b2.user_id = u.user_id AND b2.actual_start_time IS NOT NULL
        GROUP BY DATEPART(HOUR, b2.actual_start_time)
        ORDER BY COUNT(*) DESC
    ) AS preferred_hour_of_day,
    -- Most used station
    (
        SELECT TOP 1 cs.station_name
        FROM bookings b3
        INNER JOIN charging_stations cs ON b3.station_id = cs.station_id
        WHERE b3.user_id = u.user_id
        GROUP BY cs.station_name
        ORDER BY COUNT(*) DESC
    ) AS most_used_station,
    -- Most used connector type
    (
        SELECT TOP 1 cp.connector_type
        FROM bookings b4
        INNER JOIN charging_slots csl ON b4.slot_id = csl.slot_id
        INNER JOIN charging_posts cp ON csl.post_id = cp.post_id
        WHERE b4.user_id = u.user_id
        GROUP BY cp.connector_type
        ORDER BY COUNT(*) DESC
    ) AS preferred_connector_type,
    -- Average SOC at start and end
    AVG(st_start.current_soc) AS avg_start_soc,
    AVG(st_end.current_soc) AS avg_end_soc,
    -- Total spending
    SUM(i.total_amount) AS total_lifetime_spending
FROM users u
LEFT JOIN bookings b ON u.user_id = b.user_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
LEFT JOIN (
    SELECT booking_id, current_soc,
           ROW_NUMBER() OVER (PARTITION BY booking_id ORDER BY timestamp ASC) AS rn
    FROM soc_tracking
) st_start ON b.booking_id = st_start.booking_id AND st_start.rn = 1
LEFT JOIN (
    SELECT booking_id, current_soc,
           ROW_NUMBER() OVER (PARTITION BY booking_id ORDER BY timestamp DESC) AS rn
    FROM soc_tracking
) st_end ON b.booking_id = st_end.booking_id AND st_end.rn = 1
WHERE u.role = 'customer'
GROUP BY u.user_id, u.email, u.full_name;
GO

PRINT '✓ Created v_user_charging_habits view';
GO

-- =============================================
-- 3. Admin Revenue Reports View
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_admin_revenue_reports')
    DROP VIEW v_admin_revenue_reports;
GO

CREATE VIEW v_admin_revenue_reports AS
SELECT 
    cs.station_id,
    cs.station_name,
    cs.location,
    YEAR(i.created_at) AS year,
    MONTH(i.created_at) AS month,
    COUNT(DISTINCT i.invoice_id) AS total_transactions,
    COUNT(DISTINCT b.user_id) AS unique_customers,
    SUM(i.total_energy_kwh) AS total_energy_sold_kwh,
    SUM(i.subtotal) AS revenue_from_energy,
    SUM(i.tax_amount) AS revenue_from_tax,
    SUM(i.total_amount) AS total_revenue,
    AVG(i.total_amount) AS avg_transaction_value,
    MAX(i.total_amount) AS highest_transaction
FROM charging_stations cs
LEFT JOIN bookings b ON cs.station_id = b.station_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
WHERE i.payment_status = 'paid'
GROUP BY 
    cs.station_id,
    cs.station_name,
    cs.location,
    YEAR(i.created_at),
    MONTH(i.created_at);
GO

PRINT '✓ Created v_admin_revenue_reports view';
GO

-- =============================================
-- 4. Admin Usage Reports View
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_admin_usage_reports')
    DROP VIEW v_admin_usage_reports;
GO

CREATE VIEW v_admin_usage_reports AS
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
    -- Utilization rate (assuming 24/7 operation)
    CAST(SUM(CASE 
        WHEN b.actual_start_time IS NOT NULL AND b.actual_end_time IS NOT NULL 
        THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) 
        ELSE 0 
    END) AS FLOAT) / 
    NULLIF((DATEDIFF(DAY, MIN(b.actual_start_time), MAX(b.actual_end_time)) * 1440 * cs.total_posts), 0) * 100 
    AS utilization_rate_percent
FROM charging_stations cs
LEFT JOIN bookings b ON cs.station_id = b.station_id
GROUP BY 
    cs.station_id,
    cs.station_name,
    cs.total_posts,
    YEAR(b.actual_start_time),
    MONTH(b.actual_start_time);
GO

PRINT '✓ Created v_admin_usage_reports view';
GO

-- =============================================
-- 5. Station Performance View (Real-time)
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_station_performance')
    DROP VIEW v_station_performance;
GO

CREATE VIEW v_station_performance AS
SELECT 
    cs.station_id,
    cs.station_name,
    cs.location,
    cs.total_posts,
    cs.status AS station_status,
    -- Current active sessions
    COUNT(DISTINCT CASE WHEN b.status = 'in_progress' THEN b.booking_id END) AS active_sessions,
    -- Slots in use
    COUNT(DISTINCT CASE WHEN b.status = 'in_progress' THEN b.slot_id END) AS slots_in_use,
    -- Current occupancy
    CAST(COUNT(DISTINCT CASE WHEN b.status = 'in_progress' THEN b.slot_id END) AS FLOAT) / 
    NULLIF(cs.total_posts, 0) * 100 AS current_occupancy_percent,
    -- Today's stats
    COUNT(DISTINCT CASE 
        WHEN CAST(b.actual_start_time AS DATE) = CAST(GETDATE() AS DATE) 
        THEN b.booking_id 
    END) AS today_total_sessions,
    -- Last 24 hours revenue
    (
        SELECT ISNULL(SUM(i.total_amount), 0)
        FROM bookings b2
        INNER JOIN invoices i ON b2.booking_id = i.booking_id
        WHERE b2.station_id = cs.station_id 
        AND i.created_at >= DATEADD(HOUR, -24, GETDATE())
        AND i.payment_status = 'paid'
    ) AS revenue_last_24h,
    -- Average rating (if you have ratings)
    cs.average_rating
FROM charging_stations cs
LEFT JOIN bookings b ON cs.station_id = b.station_id
GROUP BY 
    cs.station_id,
    cs.station_name,
    cs.location,
    cs.total_posts,
    cs.status,
    cs.average_rating;
GO

PRINT '✓ Created v_station_performance view';
GO

-- =============================================
-- 6. Payment Methods Summary View
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_payment_methods_summary')
    DROP VIEW v_payment_methods_summary;
GO

CREATE VIEW v_payment_methods_summary AS
SELECT 
    u.user_id,
    u.email,
    u.full_name,
    COUNT(DISTINCT pm.method_id) AS total_payment_methods,
    COUNT(DISTINCT CASE WHEN pm.method_type = 'credit_card' THEN pm.method_id END) AS credit_cards,
    COUNT(DISTINCT CASE WHEN pm.method_type = 'debit_card' THEN pm.method_id END) AS debit_cards,
    COUNT(DISTINCT CASE WHEN pm.method_type = 'e_wallet' THEN pm.method_id END) AS e_wallets,
    (
        SELECT TOP 1 pm2.method_type
        FROM payment_methods pm2
        INNER JOIN invoices i ON i.payment_method_id = pm2.method_id
        WHERE pm2.user_id = u.user_id
        GROUP BY pm2.method_type
        ORDER BY COUNT(*) DESC
    ) AS preferred_payment_type,
    MAX(pm.created_at) AS last_method_added
FROM users u
LEFT JOIN payment_methods pm ON u.user_id = pm.user_id
WHERE pm.is_active = 1
GROUP BY u.user_id, u.email, u.full_name;
GO

PRINT '✓ Created v_payment_methods_summary view';
GO

PRINT '========================================';
PRINT 'Report Views Migration Completed!';
PRINT '========================================';
PRINT 'Views created:';
PRINT '  - v_user_cost_reports';
PRINT '  - v_user_charging_habits';
PRINT '  - v_admin_revenue_reports';
PRINT '  - v_admin_usage_reports';
PRINT '  - v_station_performance';
PRINT '  - v_payment_methods_summary';
PRINT '========================================';
PRINT '';
PRINT 'Usage examples:';
PRINT '  -- User cost analysis';
PRINT '  SELECT * FROM v_user_cost_reports WHERE user_id = 1;';
PRINT '';
PRINT '  -- Admin revenue for October 2025';
PRINT '  SELECT * FROM v_admin_revenue_reports WHERE year = 2025 AND month = 10;';
PRINT '';
PRINT '  -- Real-time station performance';
PRINT '  SELECT * FROM v_station_performance ORDER BY current_occupancy_percent DESC;';
PRINT '';
PRINT '  -- User charging habits';
PRINT '  SELECT * FROM v_user_charging_habits WHERE total_sessions > 5;';
PRINT '========================================';
GO
