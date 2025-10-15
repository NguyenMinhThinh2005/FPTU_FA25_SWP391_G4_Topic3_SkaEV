-- =============================================
-- Script: 07_ADD_REPORT_VIEWS.sql
-- Description: Create views for reporting and analytics
-- Version: 1.0
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
    up.first_name + ' ' + up.last_name AS full_name,
    YEAR(i.created_at) AS year,
    MONTH(i.created_at) AS month,
    COUNT(DISTINCT i.invoice_id) AS total_transactions,
    SUM(i.total_amount) AS total_spent,
    AVG(i.total_amount) AS avg_transaction_amount,
    MIN(i.created_at) AS first_transaction,
    MAX(i.created_at) AS last_transaction
FROM users u
INNER JOIN user_profiles up ON u.user_id = up.user_id
LEFT JOIN bookings b ON u.user_id = b.user_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
WHERE u.role = 'customer'
GROUP BY 
    u.user_id, 
    u.email, 
    up.first_name, 
    up.last_name,
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
    up.first_name + ' ' + up.last_name AS full_name,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.booking_id END) AS completed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.booking_id END) AS cancelled_bookings,
    AVG(DATEDIFF(MINUTE, b.start_time, b.end_time)) AS avg_duration_minutes,
    MIN(b.start_time) AS first_booking_date,
    MAX(b.start_time) AS last_booking_date,
    -- Most used station
    (SELECT TOP 1 cs.station_name 
     FROM bookings b2
     INNER JOIN charging_slots sl ON b2.slot_id = sl.slot_id
     INNER JOIN charging_posts cp ON sl.post_id = cp.post_id
     INNER JOIN charging_stations cs ON cp.station_id = cs.station_id
     WHERE b2.user_id = u.user_id
     GROUP BY cs.station_name
     ORDER BY COUNT(*) DESC) AS most_used_station,
    -- Most used connector type
    (SELECT TOP 1 sl.connector_type 
     FROM bookings b3
     INNER JOIN charging_slots sl ON b3.slot_id = sl.slot_id
     WHERE b3.user_id = u.user_id
     GROUP BY sl.connector_type
     ORDER BY COUNT(*) DESC) AS preferred_connector_type,
    -- Average SOC reached
    (SELECT AVG(CAST(soc_percent AS DECIMAL(5,2))) 
     FROM soc_tracking st
     INNER JOIN bookings b4 ON st.booking_id = b4.booking_id
     WHERE b4.user_id = u.user_id) AS avg_soc_percent
FROM users u
INNER JOIN user_profiles up ON u.user_id = up.user_id
LEFT JOIN bookings b ON u.user_id = b.user_id
WHERE u.role = 'customer'
GROUP BY 
    u.user_id, 
    u.email, 
    up.first_name, 
    up.last_name;
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
    cs.city,
    YEAR(i.created_at) AS year,
    MONTH(i.created_at) AS month,
    COUNT(DISTINCT i.invoice_id) AS total_transactions,
    COUNT(DISTINCT b.user_id) AS unique_customers,
    SUM(i.total_amount) AS total_revenue,
    AVG(i.total_amount) AS avg_transaction_amount,
    SUM(i.energy_fee) AS total_energy_revenue,
    SUM(i.parking_fee) AS total_parking_revenue,
    SUM(i.service_fee) AS total_service_revenue,
    -- Payment method breakdown
    COUNT(CASE WHEN i.payment_method = 'online' THEN 1 END) AS online_payments,
    COUNT(CASE WHEN i.payment_method = 'cash' THEN 1 END) AS cash_payments,
    COUNT(CASE WHEN i.payment_method = 'card_on_site' THEN 1 END) AS card_payments,
    -- Status breakdown
    COUNT(CASE WHEN i.payment_status = 'completed' THEN 1 END) AS completed_payments,
    COUNT(CASE WHEN i.payment_status = 'pending' THEN 1 END) AS pending_payments
FROM charging_stations cs
LEFT JOIN charging_posts cp ON cs.station_id = cp.station_id
LEFT JOIN charging_slots sl ON cp.post_id = sl.post_id
LEFT JOIN bookings b ON sl.slot_id = b.slot_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
GROUP BY 
    cs.station_id, 
    cs.station_name,
    cs.city,
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
    cs.city,
    cs.operating_hours,
    -- Booking statistics
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.booking_id END) AS completed_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.booking_id END) AS cancelled_bookings,
    COUNT(DISTINCT CASE WHEN b.status = 'in_progress' THEN b.booking_id END) AS active_bookings,
    -- Time statistics
    AVG(DATEDIFF(MINUTE, b.start_time, b.end_time)) AS avg_session_duration_minutes,
    SUM(DATEDIFF(MINUTE, b.start_time, b.end_time)) AS total_usage_minutes,
    -- User statistics
    COUNT(DISTINCT b.user_id) AS unique_users,
    -- Post and slot statistics
    COUNT(DISTINCT cp.post_id) AS total_posts,
    COUNT(DISTINCT sl.slot_id) AS total_slots,
    COUNT(DISTINCT CASE WHEN sl.status = 'available' THEN sl.slot_id END) AS available_slots,
    COUNT(DISTINCT CASE WHEN sl.status = 'occupied' THEN sl.slot_id END) AS occupied_slots,
    COUNT(DISTINCT CASE WHEN sl.status = 'maintenance' THEN sl.slot_id END) AS maintenance_slots,
    -- Utilization rate
    CASE 
        WHEN COUNT(DISTINCT sl.slot_id) > 0 
        THEN CAST(COUNT(DISTINCT b.booking_id) AS FLOAT) / COUNT(DISTINCT sl.slot_id) * 100
        ELSE 0 
    END AS utilization_rate_percent,
    -- Date range
    MIN(b.start_time) AS first_booking_date,
    MAX(b.start_time) AS last_booking_date
FROM charging_stations cs
LEFT JOIN charging_posts cp ON cs.station_id = cp.station_id
LEFT JOIN charging_slots sl ON cp.post_id = sl.post_id
LEFT JOIN bookings b ON sl.slot_id = b.slot_id
GROUP BY 
    cs.station_id, 
    cs.station_name,
    cs.city,
    cs.operating_hours;
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
    cs.city,
    cs.status AS station_status,
    -- Capacity
    COUNT(DISTINCT cp.post_id) AS total_posts,
    COUNT(DISTINCT sl.slot_id) AS total_slots,
    COUNT(DISTINCT CASE WHEN sl.status = 'available' THEN sl.slot_id END) AS available_slots,
    COUNT(DISTINCT CASE WHEN sl.status = 'occupied' THEN sl.slot_id END) AS occupied_slots,
    -- Current occupancy rate
    CASE 
        WHEN COUNT(DISTINCT sl.slot_id) > 0 
        THEN CAST(COUNT(DISTINCT CASE WHEN sl.status = 'occupied' THEN sl.slot_id END) AS FLOAT) / COUNT(DISTINCT sl.slot_id) * 100
        ELSE 0 
    END AS current_occupancy_percent,
    -- Active bookings
    COUNT(DISTINCT CASE WHEN b.status = 'in_progress' THEN b.booking_id END) AS active_bookings,
    -- Today's statistics
    COUNT(DISTINCT CASE WHEN CAST(b.start_time AS DATE) = CAST(GETDATE() AS DATE) THEN b.booking_id END) AS today_bookings,
    SUM(CASE WHEN CAST(i.created_at AS DATE) = CAST(GETDATE() AS DATE) THEN i.total_amount ELSE 0 END) AS today_revenue,
    -- This month statistics
    COUNT(DISTINCT CASE WHEN YEAR(b.start_time) = YEAR(GETDATE()) AND MONTH(b.start_time) = MONTH(GETDATE()) THEN b.booking_id END) AS month_bookings,
    SUM(CASE WHEN YEAR(i.created_at) = YEAR(GETDATE()) AND MONTH(i.created_at) = MONTH(GETDATE()) THEN i.total_amount ELSE 0 END) AS month_revenue
FROM charging_stations cs
LEFT JOIN charging_posts cp ON cs.station_id = cp.station_id
LEFT JOIN charging_slots sl ON cp.post_id = sl.post_id
LEFT JOIN bookings b ON sl.slot_id = b.slot_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
GROUP BY 
    cs.station_id, 
    cs.station_name,
    cs.city,
    cs.status;
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
    up.first_name + ' ' + up.last_name AS full_name,
    COUNT(pm.payment_method_id) AS total_payment_methods,
    COUNT(CASE WHEN pm.type = 'credit_card' THEN 1 END) AS credit_cards,
    COUNT(CASE WHEN pm.type = 'debit_card' THEN 1 END) AS debit_cards,
    COUNT(CASE WHEN pm.type = 'e_wallet' THEN 1 END) AS e_wallets,
    MAX(CASE WHEN pm.is_default = 1 THEN pm.type END) AS default_payment_type,
    MAX(CASE WHEN pm.is_default = 1 THEN pm.provider END) AS default_payment_provider
FROM users u
INNER JOIN user_profiles up ON u.user_id = up.user_id
LEFT JOIN payment_methods pm ON u.user_id = pm.user_id AND pm.is_active = 1
GROUP BY 
    u.user_id, 
    u.email, 
    up.first_name, 
    up.last_name;
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
PRINT '  SELECT * FROM v_user_cost_reports WHERE user_id = 1;';
PRINT '  SELECT * FROM v_admin_revenue_reports WHERE year = 2025 AND month = 10;';
PRINT '  SELECT * FROM v_station_performance ORDER BY current_occupancy_percent DESC;';
PRINT '========================================';
GO
