-- Create missing database views for admin reports

USE SkaEV_DB;
GO

-- Drop existing views if they exist
IF OBJECT_ID('v_admin_revenue_reports', 'V') IS NOT NULL
    DROP VIEW v_admin_revenue_reports;
GO

IF OBJECT_ID('v_station_performance', 'V') IS NOT NULL
    DROP VIEW v_station_performance;
GO

IF OBJECT_ID('v_payment_methods_summary', 'V') IS NOT NULL
    DROP VIEW v_payment_methods_summary;
GO

-- Create Admin Revenue Reports View
CREATE VIEW v_admin_revenue_reports AS
SELECT 
    cs.station_id AS StationId,
    cs.station_name AS StationName,
    YEAR(i.created_at) AS [Year],
    MONTH(i.created_at) AS [Month],
    COUNT(DISTINCT i.invoice_id) AS TotalTransactions,
    COUNT(DISTINCT b.user_id) AS UniqueCustomers,
    ISNULL(SUM(i.total_energy_kwh), 0) AS TotalEnergySoldKwh,
    ISNULL(SUM(i.subtotal), 0) AS RevenueFromEnergy,
    ISNULL(SUM(i.tax_amount), 0) AS RevenueFromTax,
    ISNULL(SUM(i.total_amount), 0) AS TotalRevenue,
    ISNULL(AVG(i.total_amount), 0) AS AvgTransactionValue,
    MAX(i.total_amount) AS HighestTransaction
FROM dbo.charging_stations cs
LEFT JOIN dbo.bookings b ON cs.station_id = b.station_id
LEFT JOIN dbo.invoices i ON b.booking_id = i.booking_id AND i.payment_status = 'paid'
WHERE i.invoice_id IS NOT NULL OR b.booking_id IS NULL  -- Include all stations
GROUP BY 
    cs.station_id,
    cs.station_name,
    YEAR(i.created_at),
    MONTH(i.created_at);
GO

-- Create Station Performance View  
CREATE VIEW v_station_performance AS
SELECT 
    cs.station_id AS StationId,
    cs.station_name AS StationName,
    cs.address AS Location,
    cs.total_posts AS TotalPosts,
    cs.status AS StationStatus,
    -- Active sessions (currently charging)
    (SELECT COUNT(*) FROM dbo.bookings b 
     WHERE b.station_id = cs.station_id 
     AND b.status = 'in_progress'
     AND b.actual_start_time IS NOT NULL 
     AND b.actual_end_time IS NULL) AS ActiveSessions,
    -- Slots in use
    (SELECT COUNT(*) FROM dbo.charging_slots slot
     WHERE slot.post_id IN (
         SELECT post_id FROM dbo.charging_posts 
         WHERE station_id = cs.station_id
     ) 
     AND slot.status = 'occupied') AS SlotsInUse,
    -- Current occupancy
    CAST((SELECT COUNT(*) FROM dbo.charging_slots slot
          WHERE slot.post_id IN (
              SELECT post_id FROM dbo.charging_posts 
              WHERE station_id = cs.station_id
          ) 
          AND slot.status = 'occupied') AS FLOAT) / 
    NULLIF(cs.total_posts, 0) * 100 AS CurrentOccupancyPercent,
    -- Today's sessions
    (SELECT COUNT(*) FROM dbo.bookings b
     WHERE b.station_id = cs.station_id
     AND CAST(b.created_at AS DATE) = CAST(GETDATE() AS DATE)) AS TodayTotalSessions,
    -- Revenue last 24h
    ISNULL((SELECT SUM(i.total_amount) 
            FROM dbo.bookings b
            JOIN dbo.invoices i ON b.booking_id = i.booking_id
            WHERE b.station_id = cs.station_id
            AND i.payment_status = 'paid'
            AND i.created_at >= DATEADD(HOUR, -24, GETDATE())), 0) AS RevenueLast24h
FROM dbo.charging_stations cs;
GO

-- Create Payment Methods Summary View
CREATE VIEW v_payment_methods_summary AS
SELECT 
    u.user_id AS UserId,
    u.email AS Email,
    u.full_name AS FullName,
    COUNT(pm.payment_method_id) AS TotalPaymentMethods,
    SUM(CASE WHEN pm.type = 'credit_card' THEN 1 ELSE 0 END) AS CreditCards,
    SUM(CASE WHEN pm.type = 'debit_card' THEN 1 ELSE 0 END) AS DebitCards,
    SUM(CASE WHEN pm.type = 'ewallet' THEN 1 ELSE 0 END) AS EWallets,
    (SELECT TOP 1 type FROM dbo.payment_methods 
     WHERE user_id = u.user_id 
     GROUP BY type 
     ORDER BY COUNT(*) DESC) AS PreferredPaymentType,
    MAX(pm.created_at) AS LastMethodAdded
FROM dbo.users u
LEFT JOIN dbo.payment_methods pm ON u.user_id = pm.user_id
GROUP BY u.user_id, u.email, u.full_name;
GO

PRINT 'Admin report views created successfully!';
