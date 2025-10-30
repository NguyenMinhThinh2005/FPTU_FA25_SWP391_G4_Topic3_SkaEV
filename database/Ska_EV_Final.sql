USE [master]
GO
/****** Object:  Database [SkaEV_DB]    Script Date: 10/22/2025 9:40:36 PM ******/
CREATE DATABASE [SkaEV_DB]
GO

ALTER DATABASE [SkaEV_DB] SET COMPATIBILITY_LEVEL = 150
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [SkaEV_DB].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [SkaEV_DB] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [SkaEV_DB] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [SkaEV_DB] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [SkaEV_DB] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [SkaEV_DB] SET ARITHABORT OFF 
GO
ALTER DATABASE [SkaEV_DB] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [SkaEV_DB] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [SkaEV_DB] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [SkaEV_DB] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [SkaEV_DB] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [SkaEV_DB] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [SkaEV_DB] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [SkaEV_DB] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [SkaEV_DB] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [SkaEV_DB] SET  ENABLE_BROKER 
GO
ALTER DATABASE [SkaEV_DB] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [SkaEV_DB] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [SkaEV_DB] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [SkaEV_DB] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [SkaEV_DB] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [SkaEV_DB] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [SkaEV_DB] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [SkaEV_DB] SET RECOVERY FULL 
GO
ALTER DATABASE [SkaEV_DB] SET  MULTI_USER 
GO
ALTER DATABASE [SkaEV_DB] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [SkaEV_DB] SET DB_CHAINING OFF 
GO
ALTER DATABASE [SkaEV_DB] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [SkaEV_DB] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [SkaEV_DB] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [SkaEV_DB] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
ALTER DATABASE [SkaEV_DB] SET QUERY_STORE = ON
GO
ALTER DATABASE [SkaEV_DB] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [SkaEV_DB]
GO
/****** Object:  UserDefinedFunction [dbo].[fn_calculate_distance]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[fn_calculate_distance](
    @lat1 DECIMAL(10,8),
    @lon1 DECIMAL(11,8),
    @lat2 DECIMAL(10,8),
@lon2 DECIMAL(11,8)
)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @distance DECIMAL(10,2);
    DECLARE @point1 GEOGRAPHY = geography::Point(@lat1, @lon1, 4326);
    DECLARE @point2 GEOGRAPHY = geography::Point(@lat2, @lon2, 4326);
    
    SET @distance = @point1.STDistance(@point2) / 1000.0; -- Convert to kilometers
    
    RETURN @distance;
END;

GO
/****** Object:  Table [dbo].[users]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[users](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[email] [nvarchar](255) NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[full_name] [nvarchar](255) NOT NULL,
	[phone_number] [nvarchar](20) NULL,
	[role] [nvarchar](50) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[deleted_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[vehicles]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vehicles](
	[vehicle_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[vehicle_type] [nvarchar](50) NOT NULL,
	[brand] [nvarchar](100) NULL,
	[model] [nvarchar](100) NULL,
	[license_plate] [nvarchar](20) NULL,
	[battery_capacity] [decimal](10, 2) NULL,
	[charging_port_type] [nvarchar](50) NULL,
	[is_primary] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[deleted_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[vehicle_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[charging_stations]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[charging_stations](
	[station_id] [int] IDENTITY(1,1) NOT NULL,
	[station_name] [nvarchar](255) NOT NULL,
	[address] [nvarchar](500) NOT NULL,
	[city] [nvarchar](100) NOT NULL,
	[latitude] [decimal](10, 8) NOT NULL,
	[longitude] [decimal](11, 8) NOT NULL,
	[total_posts] [int] NOT NULL,
	[available_posts] [int] NOT NULL,
	[operating_hours] [nvarchar](100) NULL,
	[amenities] [nvarchar](max) NULL,
	[station_image_url] [nvarchar](500) NULL,
	[status] [nvarchar](50) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[location]  AS ([geography]::Point([latitude],[longitude],(4326))) PERSISTED,
	[deleted_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[station_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[charging_posts]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[charging_posts](
	[post_id] [int] IDENTITY(1,1) NOT NULL,
	[station_id] [int] NOT NULL,
	[post_number] [nvarchar](50) NOT NULL,
	[post_type] [nvarchar](50) NOT NULL,
	[power_output] [decimal](10, 2) NOT NULL,
	[connector_types] [nvarchar](max) NULL,
	[total_slots] [int] NOT NULL,
	[available_slots] [int] NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[post_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[charging_slots]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[charging_slots](
	[slot_id] [int] IDENTITY(1,1) NOT NULL,
	[post_id] [int] NOT NULL,
	[slot_number] [nvarchar](50) NOT NULL,
	[connector_type] [nvarchar](50) NOT NULL,
	[max_power] [decimal](10, 2) NOT NULL,
	[status] [nvarchar](50) NOT NULL,
	[current_booking_id] [int] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[slot_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[bookings]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[bookings](
	[booking_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[vehicle_id] [int] NOT NULL,
	[slot_id] [int] NOT NULL,
	[station_id] [int] NOT NULL,
	[scheduling_type] [nvarchar](50) NOT NULL,
	[estimated_arrival] [datetime2](7) NULL,
	[scheduled_start_time] [datetime2](7) NULL,
	[actual_start_time] [datetime2](7) NULL,
	[actual_end_time] [datetime2](7) NULL,
	[status] [nvarchar](50) NOT NULL,
	[target_soc] [decimal](5, 2) NULL,
	[estimated_duration] [int] NULL,
	[qr_code_id] [int] NULL,
	[cancellation_reason] [nvarchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[created_by] [int] NULL,
	[updated_by] [int] NULL,
	[deleted_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[booking_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_active_bookings]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_active_bookings] AS
SELECT 
    b.booking_id,
    b.user_id,
    u.full_name AS customer_name,
    u.email AS customer_email,
    u.phone_number AS customer_phone,
    b.vehicle_id,
    v.vehicle_type,
    v.license_plate,
    b.slot_id,
    cs.slot_number,
    cp.post_number,
    st.station_name,
    st.address AS station_address,
    b.scheduling_type,
    b.scheduled_start_time,
    b.actual_start_time,
    b.status,
    b.target_soc,
    b.created_at
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN vehicles v ON b.vehicle_id = v.vehicle_id
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
INNER JOIN charging_stations st ON cp.station_id = st.station_id
WHERE b.status IN ('scheduled', 'confirmed', 'in_progress');

GO
/****** Object:  View [dbo].[v_station_availability]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE VIEW [dbo].[v_station_availability] AS
SELECT 
    st.station_id,
    st.station_name,
    st.address,
    st.city,
    st.latitude,
    st.longitude,
    st.total_posts,
    st.available_posts,
    COUNT(DISTINCT cp.post_id) AS active_posts,
    COUNT(DISTINCT cs.slot_id) AS total_slots,
    SUM(CASE WHEN cs.status = 'available' THEN 1 ELSE 0 END) AS available_slots,
    st.operating_hours,
    st.status
FROM charging_stations st
LEFT JOIN charging_posts cp ON st.station_id = cp.station_id AND cp.status != 'offline'
LEFT JOIN charging_slots cs ON cp.post_id = cs.post_id
GROUP BY 
    st.station_id, st.station_name, st.address, st.city,
    st.latitude, st.longitude, st.total_posts, st.available_posts,
    st.operating_hours, st.status;

GO
/****** Object:  Table [dbo].[invoices]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[invoices](
	[invoice_id] [int] IDENTITY(1,1) NOT NULL,
	[booking_id] [int] NOT NULL,
	[user_id] [int] NOT NULL,
	[total_energy_kwh] [decimal](10, 2) NOT NULL,
	[unit_price] [decimal](10, 2) NOT NULL,
	[subtotal] [decimal](10, 2) NOT NULL,
	[tax_amount] [decimal](10, 2) NOT NULL,
	[total_amount] [decimal](10, 2) NOT NULL,
	[payment_method] [nvarchar](50) NULL,
	[payment_status] [nvarchar](50) NOT NULL,
	[paid_at] [datetime2](7) NULL,
	[invoice_url] [nvarchar](500) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  View [dbo].[v_user_cost_reports]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER OFF
GO

CREATE VIEW [dbo].[v_user_cost_reports] AS
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
/****** Object:  View [dbo].[v_admin_usage_reports]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER OFF
GO

CREATE VIEW [dbo].[v_admin_usage_reports] AS
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
/****** Object:  Table [dbo].[notifications]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[notifications](
	[notification_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[type] [nvarchar](50) NOT NULL,
	[title] [nvarchar](255) NOT NULL,
	[message] [nvarchar](max) NOT NULL,
	[is_read] [bit] NOT NULL,
	[related_booking_id] [int] NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[notification_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payment_methods]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payment_methods](
	[payment_method_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[type] [nvarchar](50) NOT NULL,
	[provider] [nvarchar](50) NULL,
	[card_number_last4] [nvarchar](4) NULL,
	[cardholder_name] [nvarchar](255) NULL,
	[expiry_month] [int] NULL,
	[expiry_year] [int] NULL,
	[is_default] [bit] NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
	[deleted_at] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[payment_method_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[payments]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[payments](
	[payment_id] [int] IDENTITY(1,1) NOT NULL,
	[invoice_id] [int] NOT NULL,
	[payment_method_id] [int] NULL,
	[amount] [decimal](10, 2) NOT NULL,
	[payment_type] [nvarchar](50) NOT NULL,
	[transaction_id] [nvarchar](255) NULL,
	[processed_by_staff_id] [int] NULL,
	[status] [nvarchar](50) NULL,
	[processed_at] [datetime] NULL,
	[refund_date] [datetime2](7) NULL,
	[notes] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[payment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[pricing_rules]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[pricing_rules](
	[rule_id] [int] IDENTITY(1,1) NOT NULL,
	[station_id] [int] NULL,
	[vehicle_type] [nvarchar](50) NULL,
	[time_range_start] [time](7) NULL,
	[time_range_end] [time](7) NULL,
	[base_price] [decimal](10, 2) NOT NULL,
	[is_active] [bit] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
[rule_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[qr_codes]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[qr_codes](
	[qr_id] [int] IDENTITY(1,1) NOT NULL,
	[station_id] [int] NOT NULL,
	[slot_id] [int] NOT NULL,
	[qr_data] [nvarchar](500) NOT NULL,
	[is_active] [bit] NOT NULL,
	[generated_at] [datetime2](7) NOT NULL,
	[expires_at] [datetime2](7) NULL,
	[last_scanned_at] [datetime2](7) NULL,
	[scan_count] [int] NOT NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[qr_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[reviews]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[reviews](
	[review_id] [int] IDENTITY(1,1) NOT NULL,
	[booking_id] [int] NOT NULL,
	[user_id] [int] NOT NULL,
	[station_id] [int] NOT NULL,
	[rating] [int] NOT NULL,
	[comment] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[review_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[soc_tracking]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[soc_tracking](
	[tracking_id] [int] IDENTITY(1,1) NOT NULL,
	[booking_id] [int] NOT NULL,
	[timestamp] [datetime2](7) NOT NULL,
	[current_soc] [decimal](5, 2) NOT NULL,
	[voltage] [decimal](10, 2) NULL,
	[current] [decimal](10, 2) NULL,
	[power] [decimal](10, 2) NULL,
	[energy_delivered] [decimal](10, 2) NULL,
	[temperature] [decimal](5, 2) NULL,
	[estimated_time_remaining] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[tracking_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[station_staff]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[station_staff](
	[assignment_id] [int] IDENTITY(1,1) NOT NULL,
	[staff_user_id] [int] NOT NULL,
	[station_id] [int] NOT NULL,
	[assigned_at] [datetime2](7) NOT NULL,
	[is_active] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[assignment_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[system_logs]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[system_logs](
	[log_id] [int] IDENTITY(1,1) NOT NULL,
	[log_type] [nvarchar](50) NOT NULL,
	[severity] [nvarchar](20) NOT NULL,
	[message] [nvarchar](max) NOT NULL,
	[stack_trace] [nvarchar](max) NULL,
	[user_id] [int] NULL,
	[ip_address] [nvarchar](45) NULL,
	[endpoint] [nvarchar](255) NULL,
	[created_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[log_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[user_profiles]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[user_profiles](
	[profile_id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [int] NOT NULL,
	[date_of_birth] [date] NULL,
	[address] [nvarchar](500) NULL,
	[city] [nvarchar](100) NULL,
	[avatar_url] [nvarchar](500) NULL,
	[preferred_payment_method] [nvarchar](50) NULL,
	[notification_preferences] [nvarchar](max) NULL,
	[created_at] [datetime2](7) NOT NULL,
	[updated_at] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[profile_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[bookings] ON 

INSERT [dbo].[bookings] ([booking_id], [user_id], [vehicle_id], [slot_id], [station_id], [scheduling_type], [estimated_arrival], [scheduled_start_time], [actual_start_time], [actual_end_time], [status], [target_soc], [estimated_duration], [qr_code_id], [cancellation_reason], [created_at], [updated_at], [created_by], [updated_by], [deleted_at]) VALUES (1, 1, 5, 3, 1, N'scheduled', CAST(N'2025-10-24T05:00:00.0000000' AS DateTime2), CAST(N'2025-10-24T05:00:00.0000000' AS DateTime2), NULL, NULL, N'scheduled', CAST(80.00 AS Decimal(5, 2)), 60, NULL, NULL, CAST(N'2025-10-23T09:56:08.5033333' AS DateTime2), CAST(N'2025-10-23T09:56:08.5033333' AS DateTime2), NULL, NULL, NULL)
SET IDENTITY_INSERT [dbo].[bookings] OFF
GO
SET IDENTITY_INSERT [dbo].[charging_posts] ON 

INSERT [dbo].[charging_posts] ([post_id], [station_id], [post_number], [post_type], [power_output], [connector_types], [total_slots], [available_slots], [status], [created_at], [updated_at]) VALUES (4, 1, N'POST-01', N'DC', CAST(150.00 AS Decimal(10, 2)), N'CCS2', 3, 2, N'available', CAST(N'2025-10-23T02:54:26.0633333' AS DateTime2), CAST(N'2025-10-23T09:56:08.5400000' AS DateTime2))
SET IDENTITY_INSERT [dbo].[charging_posts] OFF
GO
SET IDENTITY_INSERT [dbo].[charging_slots] ON 

INSERT [dbo].[charging_slots] ([slot_id], [post_id], [slot_number], [connector_type], [max_power], [status], [current_booking_id], [created_at], [updated_at]) VALUES (3, 4, N'A1', N'CCS2', CAST(150.00 AS Decimal(10, 2)), N'reserved', 1, CAST(N'2025-10-23T02:54:34.5433333' AS DateTime2), CAST(N'2025-10-23T09:56:08.5333333' AS DateTime2))
INSERT [dbo].[charging_slots] ([slot_id], [post_id], [slot_number], [connector_type], [max_power], [status], [current_booking_id], [created_at], [updated_at]) VALUES (4, 4, N'A2', N'CCS2', CAST(150.00 AS Decimal(10, 2)), N'available', NULL, CAST(N'2025-10-23T02:54:34.5433333' AS DateTime2), CAST(N'2025-10-23T02:54:34.5433333' AS DateTime2))
INSERT [dbo].[charging_slots] ([slot_id], [post_id], [slot_number], [connector_type], [max_power], [status], [current_booking_id], [created_at], [updated_at]) VALUES (5, 4, N'A3', N'Type 2', CAST(50.00 AS Decimal(10, 2)), N'available', NULL, CAST(N'2025-10-23T02:54:34.5433333' AS DateTime2), CAST(N'2025-10-23T02:54:34.5433333' AS DateTime2))
SET IDENTITY_INSERT [dbo].[charging_slots] OFF
GO
SET IDENTITY_INSERT [dbo].[charging_stations] ON 

INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (1, N'VinFast Green Charging - Vinhomes Central Park', N'208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP.HCM', N'Hồ Chí Minh', CAST(10.79748200 AS Decimal(10, 8)), CAST(106.72152400 AS Decimal(11, 8)), 12, 1, N'24/7', N'WiFi miễn phí, Khu vực chờ có điều hòa, Cà phê, Nhà vệ sinh, Bãi đỗ xe rộng rãi, An ninh 24/7', N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8566667' AS DateTime2), CAST(N'2025-10-23T09:56:08.5500000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (2, N'VinFast Green Charging - Landmark 81', N'720A Điện Biên Phủ, Vinhomes Tân Cảng, Bình Thạnh, TP.HCM', N'Hồ Chí Minh', CAST(10.79460800 AS Decimal(10, 8)), CAST(106.72191900 AS Decimal(11, 8)), 16, 14, N'24/7', N'WiFi miễn phí, Trung tâm thương mại, Nhà hàng, Siêu thị, Rạp chiếu phim, Bãi đỗ xe trong nhà', N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8600000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8600000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (3, N'Shell Recharge - Nguyễn Văn Linh', N'456 Nguyễn Văn Linh, Tân Phú, Quận 7, TP.HCM', N'Hồ Chí Minh', CAST(10.73353500 AS Decimal(10, 8)), CAST(106.71824900 AS Decimal(11, 8)), 8, 6, N'06:00 - 23:00', N'Cửa hàng tiện lợi, Khu vực nghỉ ngơi, Máy ATM, Nhà vệ sinh', N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8600000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8600000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (4, N'AEON Mall Bình Tân - EV Charging', N'1 Đường số 17A, Bình Trị Đông B, Bình Tân, TP.HCM', N'Hồ Chí Minh', CAST(10.74013400 AS Decimal(10, 8)), CAST(106.60750400 AS Decimal(11, 8)), 10, 8, N'09:00 - 22:00', N'Trung tâm thương mại, Điện ảnh, Ẩm thực, WiFi miễn phí, Khu vui chơi trẻ em', N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8600000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8600000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (5, N'Crescent Mall - Green Charging', N'101 Tôn Dật Tiên, Phú Mỹ Hưng, Quận 7, TP.HCM', N'Hồ Chí Minh', CAST(10.72935800 AS Decimal(10, 8)), CAST(106.70239100 AS Decimal(11, 8)), 8, 7, N'09:00 - 22:00', N'Trung tâm mua sắm, Nhà hàng cao cấp, Rạp chiếu phim, WiFi miễn phí, Bãi đỗ xe trong nhà', N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8633333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8633333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (6, N'Saigon Pearl - Fast Charging', N'92 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP.HCM', N'Hồ Chí Minh', CAST(10.78819600 AS Decimal(10, 8)), CAST(106.71406900 AS Decimal(11, 8)), 6, 5, N'24/7', N'Khu dân cư cao cấp, An ninh 24/7, Khu vực chờ thoáng mát, WiFi miễn phí', N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8633333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8633333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (7, N'VinFast Green Charging - Vinhomes Ocean Park', N'Đại lộ Đỗ Đức Dục, Gia Lâm, Hà Nội', N'Hà Nội', CAST(20.98582100 AS Decimal(10, 8)), CAST(105.93889200 AS Decimal(11, 8)), 14, 12, N'24/7', N'WiFi miễn phí, Khu phức hợp lớn, Trung tâm thương mại, Bãi đỗ xe rộng, An ninh 24/7', N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8633333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8633333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (8, N'VinFast Green Charging - Royal City', N'72A Nguyễn Trãi, Thanh Xuân, Hà Nội', N'Hà Nội', CAST(21.00155600 AS Decimal(10, 8)), CAST(105.81346100 AS Decimal(11, 8)), 12, 10, N'24/7', N'Trung tâm thương mại lớn, Rạp chiếu phim, Khu ẩm thực, WiFi miễn phí, Bãi đỗ xe trong nhà', N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8666667' AS DateTime2), CAST(N'2025-10-19T19:46:12.8666667' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (9, N'AEON Mall Long Biên - EV Charging', N'27 Cổ Linh, Long Biên, Hà Nội', N'Hà Nội', CAST(21.04575300 AS Decimal(10, 8)), CAST(105.89164200 AS Decimal(11, 8)), 10, 8, N'09:00 - 22:00', N'Trung tâm mua sắm, Siêu thị, Khu vui chơi, Ẩm thực đa dạng, WiFi miễn phí', N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8666667' AS DateTime2), CAST(N'2025-10-19T19:46:12.8666667' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (10, N'Lotte Center Hanoi - Fast Charging', N'54 Liễu Giai, Ba Đình, Hà Nội', N'Hà Nội', CAST(21.02259400 AS Decimal(10, 8)), CAST(105.81375800 AS Decimal(11, 8)), 8, 7, N'24/7', N'Trung tâm thương mại cao cấp, Nhà hàng, Khách sạn, WiFi miễn phí, Bãi đỗ xe trong nhà', N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8666667' AS DateTime2), CAST(N'2025-10-19T19:46:12.8666667' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (11, N'Times City - Green Charging Hub', N'458 Minh Khai, Hai Bà Trưng, Hà Nội', N'Hà Nội', CAST(20.99562700 AS Decimal(10, 8)), CAST(105.86516800 AS Decimal(11, 8)), 10, 9, N'24/7', N'Khu đô thị lớn, Vincom Mega Mall, Rạp chiếu phim, Công viên nước, WiFi miễn phí', N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8700000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8700000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (12, N'VinFast Green Charging - Phạm Văn Đồng', N'768 Phạm Văn Đồng, Hòa Minh, Liên Chiểu, Đà Nẵng', N'Đà Nẵng', CAST(16.04719400 AS Decimal(10, 8)), CAST(108.15193800 AS Decimal(11, 8)), 10, 8, N'24/7', N'WiFi miễn phí, Khu vực chờ thoáng mát, Gần trung tâm thương mại, An ninh 24/7', N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8700000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8700000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (13, N'Vincom Plaza Đà Nẵng - EV Charging', N'910A Ngô Quyền, An Hải Bắc, Sơn Trà, Đà Nẵng', N'Đà Nẵng', CAST(16.06922100 AS Decimal(10, 8)), CAST(108.22832600 AS Decimal(11, 8)), 8, 7, N'09:00 - 22:00', N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực, WiFi miễn phí, Gần biển Mỹ Khê', N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8700000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8700000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (14, N'Lotte Mart Đà Nẵng - Charging Station', N'6 Nại Nam, Hòa Cường Bắc, Hải Châu, Đà Nẵng', N'Đà Nẵng', CAST(16.04052900 AS Decimal(10, 8)), CAST(108.20743300 AS Decimal(11, 8)), 6, 5, N'08:00 - 22:00', N'Siêu thị lớn, Khu vực ẩm thực, WiFi miễn phí, Bãi đỗ xe rộng rãi', N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8700000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8700000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (15, N'AEON Mall Bình Dương Canary - EV Charging', N'50 Đại lộ Bình Dương, Thuận Giao, Thuận An, Bình Dương', N'Bình Dương', CAST(10.90557200 AS Decimal(10, 8)), CAST(106.69662400 AS Decimal(11, 8)), 12, 10, N'09:00 - 22:00', N'Trung tâm thương mại lớn, Rạp chiếu phim, Siêu thị, Ẩm thực, WiFi miễn phí', N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8733333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8733333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (16, N'Becamex Bình Dương - Fast Charging', N'230 Đại lộ Bình Dương, Phú Hòa, Thủ Dầu Một, Bình Dương', N'Bình Dương', CAST(10.96779500 AS Decimal(10, 8)), CAST(106.66976000 AS Decimal(11, 8)), 8, 6, N'24/7', N'Trung tâm hội chợ triển lãm, Khu thương mại, WiFi miễn phí, An ninh 24/7', N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8733333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8733333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (17, N'Vincom Plaza Xuân Khánh - EV Charging', N'209 Đường 30/4, Xuân Khánh, Ninh Kiều, Cần Thơ', N'Cần Thơ', CAST(10.03409200 AS Decimal(10, 8)), CAST(105.77134600 AS Decimal(11, 8)), 8, 7, N'09:00 - 22:00', N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực đặc sản miền Tây, WiFi miễn phí', N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8733333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8733333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (18, N'Sense City Cần Thơ - Green Charging', N'Đường Nguyễn Văn Cừ, An Khánh, Ninh Kiều, Cần Thơ', N'Cần Thơ', CAST(10.05180700 AS Decimal(10, 8)), CAST(105.76831900 AS Decimal(11, 8)), 6, 5, N'24/7', N'Khu đô thị mới, Trung tâm thương mại, WiFi miễn phí, Bãi đỗ xe rộng rãi', N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8733333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8733333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (19, N'VinFast Green Charging - Vinpearl Nha Trang', N'Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang, Khánh Hòa', N'Khánh Hòa', CAST(12.21898400 AS Decimal(10, 8)), CAST(109.18641600 AS Decimal(11, 8)), 10, 9, N'24/7', N'Khu du lịch cao cấp, Khách sạn 5 sao, Khu vui chơi giải trí, WiFi miễn phí, View biển tuyệt đẹp', N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8766667' AS DateTime2), CAST(N'2025-10-19T19:46:12.8766667' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (20, N'Lotte Mart Nha Trang - Charging Station', N'32C Nguyễn Thị Minh Khai, Lộc Thọ, Nha Trang, Khánh Hòa', N'Khánh Hòa', CAST(12.24853500 AS Decimal(10, 8)), CAST(109.19320000 AS Decimal(11, 8)), 6, 5, N'08:00 - 22:00', N'Siêu thị lớn, Khu ẩm thực, WiFi miễn phí, Gần bãi biển', N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8766667' AS DateTime2), CAST(N'2025-10-19T19:46:12.8766667' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (21, N'AEON Mall Hải Phòng Lê Chân - EV Charging', N'10 Hồ Sen, Lê Chân, Hải Phòng', N'Hải Phòng', CAST(20.84510900 AS Decimal(10, 8)), CAST(106.68031100 AS Decimal(11, 8)), 10, 8, N'09:00 - 22:00', N'Trung tâm thương mại, Rạp chiếu phim, Siêu thị, Ẩm thực, WiFi miễn phí', N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8766667' AS DateTime2), CAST(N'2025-10-19T19:46:12.8766667' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (22, N'Vincom Plaza Hải Phòng - Fast Charging', N'68A Lê Thánh Tông, Máy Chai, Ngô Quyền, Hải Phòng', N'Hải Phòng', CAST(20.86139100 AS Decimal(10, 8)), CAST(106.68390300 AS Decimal(11, 8)), 8, 7, N'09:00 - 22:00', N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực đa dạng, WiFi miễn phí', N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8800000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8800000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (23, N'Shell Recharge - Thùy Vân', N'1 Thùy Vân, Phường Thắng Tam, Vũng Tàu, Bà Rịa - Vũng Tàu', N'Bà Rịa - Vũng Tàu', CAST(10.34601700 AS Decimal(10, 8)), CAST(107.08426100 AS Decimal(11, 8)), 8, 6, N'06:00 - 23:00', N'Gần bãi biển, Cửa hàng tiện lợi, Khu vực nghỉ ngơi, View biển đẹp', N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8800000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8800000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (24, N'Lotte Mart Vũng Tàu - Charging Station', N'39 Quang Trung, Phường 9, Vũng Tàu, Bà Rịa - Vũng Tàu', N'Bà Rịa - Vũng Tàu', CAST(10.35608400 AS Decimal(10, 8)), CAST(107.07659900 AS Decimal(11, 8)), 6, 5, N'08:00 - 22:00', N'Siêu thị lớn, Khu ẩm thực, WiFi miễn phí, Gần trung tâm thành phố', N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8800000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8800000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (25, N'VinFast Green Charging - Cao tốc Trung Lương', N'Cao tốc TP.HCM - Trung Lương, Km 35, Bình Chánh, TP.HCM', N'Hồ Chí Minh', CAST(10.65284300 AS Decimal(10, 8)), CAST(106.57862100 AS Decimal(11, 8)), 14, 12, N'24/7', N'Trạm dừng chân cao tốc, Cửa hàng tiện lợi, Nhà hàng, Nhà vệ sinh, Bãi đỗ xe lớn', N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8800000' AS DateTime2), CAST(N'2025-10-19T19:46:12.8800000' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (26, N'Shell Recharge - Cao tốc Pháp Vân - Cầu Giẽ', N'Cao tốc Pháp Vân - Cầu Giẽ, Km 20, Hà Nội', N'Hà Nội', CAST(20.90875600 AS Decimal(10, 8)), CAST(105.87321400 AS Decimal(11, 8)), 10, 8, N'24/7', N'Trạm dừng chân, Cửa hàng tiện lợi, Khu vực nghỉ ngơi, Nhà vệ sinh, Bãi đỗ xe rộng', N'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8833333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8833333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (27, N'VinFast Green Charging - Cao tốc Đà Nẵng - Quảng Ngãi', N'Cao tốc Đà Nẵng - Quảng Ngãi, Km 50, Duy Xuyên, Quảng Nam', N'Quảng Nam', CAST(15.91346800 AS Decimal(10, 8)), CAST(108.18562300 AS Decimal(11, 8)), 8, 7, N'24/7', N'Trạm dừng chân cao tốc, Cửa hàng tiện lợi, Nhà vệ sinh, Khu vực chờ có mái che', N'https://images.unsplash.com/photo-1617886903355-9354bb57751f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8833333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8833333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (28, N'Vincom Plaza Huế - EV Charging', N'50 Hùng Vương, Vĩnh Ninh, Huế, Thừa Thiên Huế', N'Thừa Thiên Huế', CAST(16.46306500 AS Decimal(10, 8)), CAST(107.59088200 AS Decimal(11, 8)), 8, 6, N'09:00 - 22:00', N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực, WiFi miễn phí, Gần sông Hương', N'https://images.unsplash.com/photo-1621570074981-ee92ff2b9a8f?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8833333' AS DateTime2), CAST(N'2025-10-19T19:46:12.8833333' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (29, N'Vincom Plaza Buôn Ma Thuột - EV Charging', N'78-80 Lý Thường Kiệt, Tân Lợi, Buôn Ma Thuột, Đắk Lắk', N'Đắk Lắk', CAST(12.67546800 AS Decimal(10, 8)), CAST(108.04233700 AS Decimal(11, 8)), 6, 5, N'09:00 - 22:00', N'Trung tâm thương mại, Rạp chiếu phim, Ẩm thực, WiFi miễn phí, Đặc sản Tây Nguyên', N'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8866667' AS DateTime2), CAST(N'2025-10-19T19:46:12.8866667' AS DateTime2), NULL)
INSERT [dbo].[charging_stations] ([station_id], [station_name], [address], [city], [latitude], [longitude], [total_posts], [available_posts], [operating_hours], [amenities], [station_image_url], [status], [created_at], [updated_at], [deleted_at]) VALUES (30, N'Big C Quy Nhơn - Charging Station', N'450 Trần Hưng Đạo, Lê Hồng Phong, Quy Nhơn, Bình Định', N'Bình Định', CAST(13.77294700 AS Decimal(10, 8)), CAST(109.22386300 AS Decimal(11, 8)), 6, 5, N'08:00 - 22:00', N'Siêu thị lớn, Khu ẩm thực, WiFi miễn phí, Gần bãi biển Quy Nhơn', N'https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?w=800', N'Active', CAST(N'2025-10-19T19:46:12.8866667' AS DateTime2), CAST(N'2025-10-19T19:46:12.8866667' AS DateTime2), NULL)
SET IDENTITY_INSERT [dbo].[charging_stations] OFF
GO
SET IDENTITY_INSERT [dbo].[user_profiles] ON 

INSERT [dbo].[user_profiles] ([profile_id], [user_id], [date_of_birth], [address], [city], [avatar_url], [preferred_payment_method], [notification_preferences], [created_at], [updated_at]) VALUES (1, 1, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-10-19T11:55:09.7313735' AS DateTime2), CAST(N'2025-10-19T11:55:09.7314507' AS DateTime2))
INSERT [dbo].[user_profiles] ([profile_id], [user_id], [date_of_birth], [address], [city], [avatar_url], [preferred_payment_method], [notification_preferences], [created_at], [updated_at]) VALUES (2, 2, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-10-20T02:43:04.3285146' AS DateTime2), CAST(N'2025-10-20T02:43:04.3285662' AS DateTime2))
INSERT [dbo].[user_profiles] ([profile_id], [user_id], [date_of_birth], [address], [city], [avatar_url], [preferred_payment_method], [notification_preferences], [created_at], [updated_at]) VALUES (3, 3, NULL, NULL, NULL, NULL, NULL, NULL, CAST(N'2025-10-20T03:41:01.3753802' AS DateTime2), CAST(N'2025-10-20T03:41:01.3754328' AS DateTime2))
SET IDENTITY_INSERT [dbo].[user_profiles] OFF
GO
SET IDENTITY_INSERT [dbo].[users] ON 

INSERT [dbo].[users] ([user_id], [email], [password_hash], [full_name], [phone_number], [role], [is_active], [created_at], [updated_at], [deleted_at]) VALUES (1, N'nguyenvanan@gmail.com', N'$2a$11$POBYWmWcbBHj7hNjGitPBefqT/Lm6TNs5Hr9uUHOdY.cZ2RQayxHy', N'Nguyễn Văn An', N'0123456789', N'customer', 1, CAST(N'2025-10-19T11:55:09.3027813' AS DateTime2), CAST(N'2025-10-19T11:55:09.3028387' AS DateTime2), NULL)
INSERT [dbo].[users] ([user_id], [email], [password_hash], [full_name], [phone_number], [role], [is_active], [created_at], [updated_at], [deleted_at]) VALUES (2, N'thinh100816@gmail.com', N'$2a$11$aNpqDb5vGiV/gqCRKaoA2.C5LaRCIVBMD13UZO.lL8LTwxt9b/dPa', N'Minh Thịnh đẹp', N'0902223334', N'customer', 1, CAST(N'2025-10-20T02:43:04.1137935' AS DateTime2), CAST(N'2025-10-20T11:10:03.1666667' AS DateTime2), NULL)
INSERT [dbo].[users] ([user_id], [email], [password_hash], [full_name], [phone_number], [role], [is_active], [created_at], [updated_at], [deleted_at]) VALUES (3, N'thinh@gmail.com', N'$2a$11$GnHB089c19woXPRiHO/EcuL6Av4LfXZ7pRjiO1rCpRuyQim8Qap/C', N'MThinh', N'0911887143', N'admin', 1, CAST(N'2025-10-20T03:41:01.1873963' AS DateTime2), CAST(N'2025-10-20T03:41:01.1874567' AS DateTime2), NULL)
SET IDENTITY_INSERT [dbo].[users] OFF
GO
SET IDENTITY_INSERT [dbo].[vehicles] ON 

INSERT [dbo].[vehicles] ([vehicle_id], [user_id], [vehicle_type], [brand], [model], [license_plate], [battery_capacity], [charging_port_type], [is_primary], [created_at], [updated_at], [deleted_at]) VALUES (5, 1, N'car', N'Tesla', N'Model 3 Long Range', N'30A-12345', CAST(75.00 AS Decimal(10, 2)), N'Type 2', 1, CAST(N'2025-10-19T19:18:04.6200000' AS DateTime2), CAST(N'2025-10-19T19:18:04.6200000' AS DateTime2), NULL)
INSERT [dbo].[vehicles] ([vehicle_id], [user_id], [vehicle_type], [brand], [model], [license_plate], [battery_capacity], [charging_port_type], [is_primary], [created_at], [updated_at], [deleted_at]) VALUES (6, 1, N'car', N'VinFast', N'VF8 Plus', N'29B-67890', CAST(87.70 AS Decimal(10, 2)), N'CCS2', 0, CAST(N'2025-10-19T19:18:04.6200000' AS DateTime2), CAST(N'2025-10-19T19:18:04.6200000' AS DateTime2), NULL)
SET IDENTITY_INSERT [dbo].[vehicles] OFF
GO
/****** Object:  Index [idx_bookings_created_by]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_created_by] ON [dbo].[bookings]
(
	[created_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_bookings_deleted]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_deleted] ON [dbo].[bookings]
(
	[deleted_at] ASC
)
WHERE ([deleted_at] IS NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_bookings_scheduled_start]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_scheduled_start] ON [dbo].[bookings]
(
	[scheduled_start_time] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_bookings_slot]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_slot] ON [dbo].[bookings]
(
	[slot_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_bookings_station]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_station] ON [dbo].[bookings]
(
	[station_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_bookings_status]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_status] ON [dbo].[bookings]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_bookings_updated_by]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_updated_by] ON [dbo].[bookings]
(
	[updated_by] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_bookings_user]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_user] ON [dbo].[bookings]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_bookings_user_status_date]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_bookings_user_status_date] ON [dbo].[bookings]
(
	[user_id] ASC,
	[status] ASC,
	[created_at] DESC
)
INCLUDE([vehicle_id],[station_id],[slot_id]) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_post_number_per_station]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[charging_posts] ADD  CONSTRAINT [UQ_post_number_per_station] UNIQUE NONCLUSTERED 
(
	[station_id] ASC,
	[post_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_posts_station]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_posts_station] ON [dbo].[charging_posts]
(
	[station_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_posts_status]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_posts_status] ON [dbo].[charging_posts]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ_slot_number_per_post]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[charging_slots] ADD  CONSTRAINT [UQ_slot_number_per_post] UNIQUE NONCLUSTERED 
(
	[post_id] ASC,
	[slot_number] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_slots_post]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_slots_post] ON [dbo].[charging_slots]
(
	[post_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_slots_status]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_slots_status] ON [dbo].[charging_slots]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_stations_city]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_stations_city] ON [dbo].[charging_stations]
(
	[city] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_stations_deleted]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_stations_deleted] ON [dbo].[charging_stations]
(
	[deleted_at] ASC
)
WHERE ([deleted_at] IS NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_stations_status]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_stations_status] ON [dbo].[charging_stations]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__invoices__5DE3A5B048E928E7]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[invoices] ADD UNIQUE NONCLUSTERED 
(
	[booking_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_invoices_status]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_invoices_status] ON [dbo].[invoices]
(
	[payment_status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_invoices_user]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_invoices_user] ON [dbo].[invoices]
(
[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_notifications_read]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_notifications_read] ON [dbo].[notifications]
(
	[is_read] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_notifications_user]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_notifications_user] ON [dbo].[notifications]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_payment_methods_deleted]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_payment_methods_deleted] ON [dbo].[payment_methods]
(
	[deleted_at] ASC
)
WHERE ([deleted_at] IS NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_PaymentMethods_Default]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [IX_PaymentMethods_Default] ON [dbo].[payment_methods]
(
	[user_id] ASC,
	[is_default] ASC
)
WHERE ([is_default]=(1))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_PaymentMethods_UserId]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [IX_PaymentMethods_UserId] ON [dbo].[payment_methods]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_payments_status_date]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_payments_status_date] ON [dbo].[payments]
(
	[status] ASC,
	[processed_at] ASC
)
WHERE ([status] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Payments_Invoice]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payments_Invoice] ON [dbo].[payments]
(
	[invoice_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Payments_Status]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payments_Status] ON [dbo].[payments]
(
	[status] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Payments_TransactionId]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [IX_Payments_TransactionId] ON [dbo].[payments]
(
	[transaction_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__qr_codes__E6582739CAE53B4A]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[qr_codes] ADD UNIQUE NONCLUSTERED 
(
	[qr_data] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_qr_active]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_qr_active] ON [dbo].[qr_codes]
(
	[is_active] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_qr_slot]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_qr_slot] ON [dbo].[qr_codes]
(
	[slot_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_qr_station]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_qr_station] ON [dbo].[qr_codes]
(
	[station_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__reviews__5DE3A5B0CAAA08C5]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[reviews] ADD UNIQUE NONCLUSTERED 
(
	[booking_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_reviews_station]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_reviews_station] ON [dbo].[reviews]
(
	[station_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_reviews_user]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_reviews_user] ON [dbo].[reviews]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_soc_booking]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_soc_booking] ON [dbo].[soc_tracking]
(
	[booking_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_soc_timestamp]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_soc_timestamp] ON [dbo].[soc_tracking]
(
	[timestamp] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ_staff_station]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[station_staff] ADD  CONSTRAINT [UQ_staff_station] UNIQUE NONCLUSTERED 
(
	[staff_user_id] ASC,
	[station_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_logs_created]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_logs_created] ON [dbo].[system_logs]
(
	[created_at] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_logs_type]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_logs_type] ON [dbo].[system_logs]
(
	[log_type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__user_pro__B9BE370E0BBCBABE]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[user_profiles] ADD UNIQUE NONCLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__users__AB6E61648CE19D4E]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[users] ADD UNIQUE NONCLUSTERED 
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_users_deleted]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_users_deleted] ON [dbo].[users]
(
	[deleted_at] ASC
)
WHERE ([deleted_at] IS NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_users_email]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_users_email] ON [dbo].[users]
(
	[email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_users_role]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_users_role] ON [dbo].[users]
(
	[role] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__vehicles__F72CD56E378EDBAF]    Script Date: 10/23/2025 10:11:34 AM ******/
ALTER TABLE [dbo].[vehicles] ADD UNIQUE NONCLUSTERED 
(
	[license_plate] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_vehicles_deleted]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_vehicles_deleted] ON [dbo].[vehicles]
(
	[deleted_at] ASC
)
WHERE ([deleted_at] IS NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [idx_vehicles_license]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE UNIQUE NONCLUSTERED INDEX [idx_vehicles_license] ON [dbo].[vehicles]
(
	[license_plate] ASC
)
WHERE ([license_plate] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [idx_vehicles_user]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE NONCLUSTERED INDEX [idx_vehicles_user] ON [dbo].[vehicles]
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[bookings] ADD  DEFAULT ('scheduled') FOR [status]
GO
ALTER TABLE [dbo].[bookings] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[bookings] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[charging_posts] ADD  DEFAULT ((0)) FOR [total_slots]
GO
ALTER TABLE [dbo].[charging_posts] ADD  DEFAULT ((0)) FOR [available_slots]
GO
ALTER TABLE [dbo].[charging_posts] ADD  DEFAULT ('available') FOR [status]
GO
ALTER TABLE [dbo].[charging_posts] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[charging_posts] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[charging_slots] ADD  DEFAULT ('available') FOR [status]
GO
ALTER TABLE [dbo].[charging_slots] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[charging_slots] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[charging_stations] ADD  DEFAULT ((0)) FOR [total_posts]
GO
ALTER TABLE [dbo].[charging_stations] ADD  DEFAULT ((0)) FOR [available_posts]
GO
ALTER TABLE [dbo].[charging_stations] ADD  DEFAULT ('active') FOR [status]
GO
ALTER TABLE [dbo].[charging_stations] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[charging_stations] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT ((0)) FOR [tax_amount]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT ('pending') FOR [payment_status]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[invoices] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT ((0)) FOR [is_read]
GO
ALTER TABLE [dbo].[notifications] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[payment_methods] ADD  DEFAULT ((0)) FOR [is_default]
GO
ALTER TABLE [dbo].[payment_methods] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[payment_methods] ADD  CONSTRAINT [DF_payment_methods_created_at]  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[payment_methods] ADD  CONSTRAINT [DF_payment_methods_updated_at]  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[payments] ADD  DEFAULT ('completed') FOR [status]
GO
ALTER TABLE [dbo].[payments] ADD  DEFAULT (getdate()) FOR [processed_at]
GO
ALTER TABLE [dbo].[payments] ADD  CONSTRAINT [DF_payments_created_at]  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[pricing_rules] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[pricing_rules] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[pricing_rules] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[qr_codes] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[qr_codes] ADD  DEFAULT (getdate()) FOR [generated_at]
GO
ALTER TABLE [dbo].[qr_codes] ADD  DEFAULT ((0)) FOR [scan_count]
GO
ALTER TABLE [dbo].[qr_codes] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[qr_codes] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[reviews] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[reviews] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[soc_tracking] ADD  DEFAULT (getdate()) FOR [timestamp]
GO
ALTER TABLE [dbo].[station_staff] ADD  DEFAULT (getdate()) FOR [assigned_at]
GO
ALTER TABLE [dbo].[station_staff] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[system_logs] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[user_profiles] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[user_profiles] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[users] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[vehicles] ADD  DEFAULT ((0)) FOR [is_primary]
GO
ALTER TABLE [dbo].[vehicles] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[vehicles] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [FK_bookings_created_by] FOREIGN KEY([created_by])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [FK_bookings_created_by]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [FK_bookings_qr_codes] FOREIGN KEY([qr_code_id])
REFERENCES [dbo].[qr_codes] ([qr_id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [FK_bookings_qr_codes]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [FK_bookings_slots] FOREIGN KEY([slot_id])
REFERENCES [dbo].[charging_slots] ([slot_id])
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [FK_bookings_slots]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [FK_bookings_stations] FOREIGN KEY([station_id])
REFERENCES [dbo].[charging_stations] ([station_id])
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [FK_bookings_stations]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [FK_bookings_updated_by] FOREIGN KEY([updated_by])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [FK_bookings_updated_by]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [FK_bookings_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [FK_bookings_users]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [FK_bookings_vehicles] FOREIGN KEY([vehicle_id])
REFERENCES [dbo].[vehicles] ([vehicle_id])
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [FK_bookings_vehicles]
GO
ALTER TABLE [dbo].[charging_posts]  WITH CHECK ADD  CONSTRAINT [FK_posts_stations] FOREIGN KEY([station_id])
REFERENCES [dbo].[charging_stations] ([station_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[charging_posts] CHECK CONSTRAINT [FK_posts_stations]
GO
ALTER TABLE [dbo].[charging_slots]  WITH CHECK ADD  CONSTRAINT [FK_slots_current_booking] FOREIGN KEY([current_booking_id])
REFERENCES [dbo].[bookings] ([booking_id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[charging_slots] CHECK CONSTRAINT [FK_slots_current_booking]
GO
ALTER TABLE [dbo].[charging_slots]  WITH CHECK ADD  CONSTRAINT [FK_slots_posts] FOREIGN KEY([post_id])
REFERENCES [dbo].[charging_posts] ([post_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[charging_slots] CHECK CONSTRAINT [FK_slots_posts]
GO
ALTER TABLE [dbo].[invoices]  WITH CHECK ADD  CONSTRAINT [FK_invoices_bookings] FOREIGN KEY([booking_id])
REFERENCES [dbo].[bookings] ([booking_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[invoices] CHECK CONSTRAINT [FK_invoices_bookings]
GO
ALTER TABLE [dbo].[invoices]  WITH CHECK ADD  CONSTRAINT [FK_invoices_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[invoices] CHECK CONSTRAINT [FK_invoices_users]
GO
ALTER TABLE [dbo].[notifications]  WITH CHECK ADD  CONSTRAINT [FK_notifications_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[notifications] CHECK CONSTRAINT [FK_notifications_users]
GO
ALTER TABLE [dbo].[payment_methods]  WITH CHECK ADD  CONSTRAINT [FK_PaymentMethods_Users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[payment_methods] CHECK CONSTRAINT [FK_PaymentMethods_Users]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [FK_Payments_Invoices] FOREIGN KEY([invoice_id])
REFERENCES [dbo].[invoices] ([invoice_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [FK_Payments_Invoices]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [FK_Payments_PaymentMethods] FOREIGN KEY([payment_method_id])
REFERENCES [dbo].[payment_methods] ([payment_method_id])
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [FK_Payments_PaymentMethods]
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD  CONSTRAINT [FK_Payments_Staff] FOREIGN KEY([processed_by_staff_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[payments] CHECK CONSTRAINT [FK_Payments_Staff]
GO
ALTER TABLE [dbo].[pricing_rules]  WITH CHECK ADD  CONSTRAINT [FK_pricing_stations] FOREIGN KEY([station_id])
REFERENCES [dbo].[charging_stations] ([station_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[pricing_rules] CHECK CONSTRAINT [FK_pricing_stations]
GO

ALTER TABLE [dbo].[qr_codes]  WITH CHECK ADD  CONSTRAINT [FK_qr_slots] FOREIGN KEY([slot_id])
REFERENCES [dbo].[charging_slots] ([slot_id])
GO
ALTER TABLE [dbo].[qr_codes] CHECK CONSTRAINT [FK_qr_slots]
GO
ALTER TABLE [dbo].[qr_codes]  WITH CHECK ADD  CONSTRAINT [FK_qr_stations] FOREIGN KEY([station_id])
REFERENCES [dbo].[charging_stations] ([station_id])
GO
ALTER TABLE [dbo].[qr_codes] CHECK CONSTRAINT [FK_qr_stations]
GO
ALTER TABLE [dbo].[reviews]  WITH CHECK ADD  CONSTRAINT [FK_reviews_bookings] FOREIGN KEY([booking_id])
REFERENCES [dbo].[bookings] ([booking_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[reviews] CHECK CONSTRAINT [FK_reviews_bookings]
GO
ALTER TABLE [dbo].[reviews]  WITH CHECK ADD  CONSTRAINT [FK_reviews_stations] FOREIGN KEY([station_id])
REFERENCES [dbo].[charging_stations] ([station_id])
GO
ALTER TABLE [dbo].[reviews] CHECK CONSTRAINT [FK_reviews_stations]
GO
ALTER TABLE [dbo].[reviews]  WITH CHECK ADD  CONSTRAINT [FK_reviews_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
GO
ALTER TABLE [dbo].[reviews] CHECK CONSTRAINT [FK_reviews_users]
GO
ALTER TABLE [dbo].[soc_tracking]  WITH CHECK ADD  CONSTRAINT [FK_soc_bookings] FOREIGN KEY([booking_id])
REFERENCES [dbo].[bookings] ([booking_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[soc_tracking] CHECK CONSTRAINT [FK_soc_bookings]
GO
ALTER TABLE [dbo].[station_staff]  WITH CHECK ADD  CONSTRAINT [FK_staff_stations] FOREIGN KEY([station_id])
REFERENCES [dbo].[charging_stations] ([station_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[station_staff] CHECK CONSTRAINT [FK_staff_stations]
GO
ALTER TABLE [dbo].[station_staff]  WITH CHECK ADD  CONSTRAINT [FK_staff_users] FOREIGN KEY([staff_user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[station_staff] CHECK CONSTRAINT [FK_staff_users]
GO
ALTER TABLE [dbo].[system_logs]  WITH CHECK ADD  CONSTRAINT [FK_logs_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[system_logs] CHECK CONSTRAINT [FK_logs_users]
GO
ALTER TABLE [dbo].[user_profiles]  WITH CHECK ADD  CONSTRAINT [FK_profiles_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[user_profiles] CHECK CONSTRAINT [FK_profiles_users]
GO
ALTER TABLE [dbo].[vehicles]  WITH CHECK ADD  CONSTRAINT [FK_vehicles_users] FOREIGN KEY([user_id])
REFERENCES [dbo].[users] ([user_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[vehicles] CHECK CONSTRAINT [FK_vehicles_users]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD CHECK  (([scheduling_type]='qr_immediate' OR [scheduling_type]='scheduled'))
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD CHECK  (([scheduling_type]='qr_immediate' OR [scheduling_type]='scheduled'))
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD CHECK  (([status]='no_show' OR [status]='cancelled' OR [status]='completed' OR [status]='in_progress' OR [status]='confirmed' OR [status]='scheduled'))
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD CHECK  (([status]='no_show' OR [status]='cancelled' OR [status]='completed' OR [status]='in_progress' OR [status]='confirmed' OR [status]='scheduled'))
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [CK_bookings_dates] CHECK  (([actual_end_time] IS NULL OR [actual_start_time] IS NULL OR [actual_end_time]>=[actual_start_time]))
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [CK_bookings_dates]
GO
ALTER TABLE [dbo].[bookings]  WITH CHECK ADD  CONSTRAINT [CK_bookings_target_soc] CHECK  (([target_soc] IS NULL OR [target_soc]>=(0) AND [target_soc]<=(100)))
GO
ALTER TABLE [dbo].[bookings] CHECK CONSTRAINT [CK_bookings_target_soc]
GO
ALTER TABLE [dbo].[charging_posts]  WITH CHECK ADD CHECK  (([post_type]='DC' OR [post_type]='AC'))
GO
ALTER TABLE [dbo].[charging_posts]  WITH CHECK ADD CHECK  (([post_type]='DC' OR [post_type]='AC'))
GO
ALTER TABLE [dbo].[charging_posts]  WITH CHECK ADD CHECK  (([status]='offline' OR [status]='maintenance' OR [status]='occupied' OR [status]='available'))
GO
ALTER TABLE [dbo].[charging_posts]  WITH CHECK ADD CHECK  (([status]='offline' OR [status]='maintenance' OR [status]='occupied' OR [status]='available'))
GO
ALTER TABLE [dbo].[charging_slots]  WITH CHECK ADD CHECK  (([status]='maintenance' OR [status]='reserved' OR [status]='occupied' OR [status]='available'))
GO
ALTER TABLE [dbo].[charging_slots]  WITH CHECK ADD CHECK  (([status]='maintenance' OR [status]='reserved' OR [status]='occupied' OR [status]='available'))
GO
ALTER TABLE [dbo].[charging_stations]  WITH CHECK ADD CHECK  (([status]='maintenance' OR [status]='inactive' OR [status]='active'))
GO
ALTER TABLE [dbo].[charging_stations]  WITH CHECK ADD CHECK  (([status]='maintenance' OR [status]='inactive' OR [status]='active'))
GO
ALTER TABLE [dbo].[invoices]  WITH CHECK ADD CHECK  (([payment_status]='refunded' OR [payment_status]='failed' OR [payment_status]='paid' OR [payment_status]='pending'))
GO
ALTER TABLE [dbo].[invoices]  WITH CHECK ADD CHECK  (([payment_status]='refunded' OR [payment_status]='failed' OR [payment_status]='paid' OR [payment_status]='pending'))
GO
ALTER TABLE [dbo].[invoices]  WITH CHECK ADD  CONSTRAINT [CK_invoices_positive_amounts] CHECK  (([total_energy_kwh]>=(0) AND [total_amount]>=(0)))
GO
ALTER TABLE [dbo].[invoices] CHECK CONSTRAINT [CK_invoices_positive_amounts]
GO
ALTER TABLE [dbo].[notifications]  WITH CHECK ADD CHECK  (([type]='system_alert' OR [type]='payment_due' OR [type]='charging_complete' OR [type]='booking_reminder'))
GO
ALTER TABLE [dbo].[notifications]  WITH CHECK ADD CHECK  (([type]='system_alert' OR [type]='payment_due' OR [type]='charging_complete' OR [type]='booking_reminder'))
GO
ALTER TABLE [dbo].[payment_methods]  WITH CHECK ADD CHECK  (([expiry_month]>=(1) AND [expiry_month]<=(12)))
GO
ALTER TABLE [dbo].[payment_methods]  WITH CHECK ADD CHECK  (([type]='bank_transfer' OR [type]='e_wallet' OR [type]='debit_card' OR [type]='credit_card'))
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD CHECK  (([payment_type]='e_wallet' OR [payment_type]='card' OR [payment_type]='cash' OR [payment_type]='online'))
GO
ALTER TABLE [dbo].[payments]  WITH CHECK ADD CHECK  (([status]='refunded' OR [status]='failed' OR [status]='completed' OR [status]='pending'))
GO
ALTER TABLE [dbo].[pricing_rules]  WITH CHECK ADD  CONSTRAINT [CK_pricing_vehicle_type] CHECK  (([vehicle_type]='car' OR [vehicle_type]='motorcycle' OR [vehicle_type] IS NULL))
GO
ALTER TABLE [dbo].[pricing_rules] CHECK CONSTRAINT [CK_pricing_vehicle_type]
GO
ALTER TABLE [dbo].[reviews]  WITH CHECK ADD CHECK  (([rating]>=(1) AND [rating]<=(5)))
GO
ALTER TABLE [dbo].[reviews]  WITH CHECK ADD CHECK  (([rating]>=(1) AND [rating]<=(5)))
GO
ALTER TABLE [dbo].[system_logs]  WITH CHECK ADD CHECK  (([log_type]='security' OR [log_type]='info' OR [log_type]='warning' OR [log_type]='error'))
GO
ALTER TABLE [dbo].[system_logs]  WITH CHECK ADD CHECK  (([log_type]='security' OR [log_type]='info' OR [log_type]='warning' OR [log_type]='error'))
GO
ALTER TABLE [dbo].[system_logs]  WITH CHECK ADD CHECK  (([severity]='critical' OR [severity]='high' OR [severity]='medium' OR [severity]='low'))
GO
ALTER TABLE [dbo].[system_logs]  WITH CHECK ADD CHECK  (([severity]='critical' OR [severity]='high' OR [severity]='medium' OR [severity]='low'))
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD CHECK  (([role]='admin' OR [role]='staff' OR [role]='customer'))
GO
ALTER TABLE [dbo].[users]  WITH CHECK ADD CHECK  (([role]='admin' OR [role]='staff' OR [role]='customer'))
GO
ALTER TABLE [dbo].[vehicles]  WITH CHECK ADD CHECK  (([vehicle_type]='car' OR [vehicle_type]='motorcycle'))
GO
ALTER TABLE [dbo].[vehicles]  WITH CHECK ADD CHECK  (([vehicle_type]='car' OR [vehicle_type]='motorcycle'))
GO
/****** Object:  StoredProcedure [dbo].[sp_authenticate_user]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_authenticate_user]
    @email NVARCHAR(255),
    @password_hash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        user_id,
        email,
        full_name,
        phone_number,
        role,
        is_active
    FROM users
    WHERE email = @email 
        AND password_hash = @password_hash 
        AND is_active = 1;
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_cancel_booking]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_cancel_booking]
    @booking_id INT,
    @cancellation_reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @slot_id INT;
        DECLARE @station_id INT;
        
        SELECT @slot_id = slot_id, @station_id = station_id
        FROM bookings
        WHERE booking_id = @booking_id;
        
        -- Update booking status
        UPDATE bookings
        SET status = 'cancelled',
cancellation_reason = @cancellation_reason
        WHERE booking_id = @booking_id;
        
        -- Free up the slot
        UPDATE charging_slots
        SET status = 'available',
            current_booking_id = NULL
        WHERE slot_id = @slot_id;
        
        -- Update post availability
        UPDATE charging_posts
        SET available_slots = available_slots + 1
        WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @slot_id);
        
        -- Update station availability
        UPDATE charging_stations
        SET available_posts = (
            SELECT COUNT(DISTINCT cp.post_id)
            FROM charging_posts cp
            INNER JOIN charging_slots cs ON cp.post_id = cs.post_id
            WHERE cp.station_id = @station_id AND cs.status = 'available'
        )
        WHERE station_id = @station_id;
        
        COMMIT TRANSACTION;
        
        SELECT 'Booking cancelled successfully' AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_complete_charging]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_complete_charging]
    @booking_id INT,
    @final_soc DECIMAL(5,2),
    @total_energy_kwh DECIMAL(10,2),
    @unit_price DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @user_id INT;
        DECLARE @slot_id INT;
        DECLARE @subtotal DECIMAL(10,2);
        DECLARE @tax_amount DECIMAL(10,2);
        DECLARE @total_amount DECIMAL(10,2);
        
        -- Get booking details
        SELECT @user_id = user_id, @slot_id = slot_id
        FROM bookings
        WHERE booking_id = @booking_id;
        
        -- Calculate invoice amounts
        SET @subtotal = @total_energy_kwh * @unit_price;
        SET @tax_amount = @subtotal * 0.1; -- 10% tax
        SET @total_amount = @subtotal + @tax_amount;
        
        -- Update booking status
        UPDATE bookings
        SET status = 'completed',
            actual_end_time = GETDATE()
        WHERE booking_id = @booking_id;
        
        -- Record final SOC
        INSERT INTO soc_tracking (booking_id, current_soc, energy_delivered)
        VALUES (@booking_id, @final_soc, @total_energy_kwh);
        
        -- Create invoice
        INSERT INTO invoices (
            booking_id, user_id, total_energy_kwh, unit_price,
            subtotal, tax_amount, total_amount, payment_status
        )
        VALUES (
            @booking_id, @user_id, @total_energy_kwh, @unit_price,
            @subtotal, @tax_amount, @total_amount, 'pending'
        );
        
        -- Free up the slot
        UPDATE charging_slots
        SET status = 'available',
            current_booking_id = NULL
        WHERE slot_id = @slot_id;
        
        -- Update post availability
UPDATE charging_posts
        SET available_slots = available_slots + 1
        WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @slot_id);
        
        -- Update station availability
        DECLARE @station_id INT = (SELECT station_id FROM bookings WHERE booking_id = @booking_id);
        UPDATE charging_stations
        SET available_posts = (
            SELECT COUNT(DISTINCT cp.post_id)
            FROM charging_posts cp
            INNER JOIN charging_slots cs ON cp.post_id = cs.post_id
            WHERE cp.station_id = @station_id AND cs.status = 'available'
        )
        WHERE station_id = @station_id;
        
        COMMIT TRANSACTION;
        
        SELECT 'Charging completed successfully' AS message, @total_amount AS total_amount;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_create_booking]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_create_booking]
    @user_id INT,
    @vehicle_id INT,
    @slot_id INT,
    @station_id INT,
    @scheduling_type NVARCHAR(50),
    @scheduled_start_time DATETIME2 = NULL,
    @estimated_arrival DATETIME2 = NULL,
    @target_soc DECIMAL(5,2) = NULL,
    @estimated_duration INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @booking_id INT;
        
        -- Check slot availability
        IF NOT EXISTS (
            SELECT 1 FROM charging_slots 
            WHERE slot_id = @slot_id AND status = 'available'
        )
        BEGIN
            RAISERROR('Slot is not available', 16, 1);
            RETURN;
        END
        
        -- Create booking
        INSERT INTO bookings (
            user_id, vehicle_id, slot_id, station_id,
            scheduling_type, scheduled_start_time, estimated_arrival,
            target_soc, estimated_duration, status
        )
        VALUES (
            @user_id, @vehicle_id, @slot_id, @station_id,
            @scheduling_type, @scheduled_start_time, @estimated_arrival,
            @target_soc, @estimated_duration, 
            CASE WHEN @scheduling_type = 'qr_immediate' THEN 'confirmed' ELSE 'scheduled' END
        );
        
        SET @booking_id = SCOPE_IDENTITY();
        
        -- Update slot status
        UPDATE charging_slots
        SET status = CASE WHEN @scheduling_type = 'qr_immediate' THEN 'occupied' ELSE 'reserved' END,
            current_booking_id = @booking_id
        WHERE slot_id = @slot_id;
        
        -- Update post availability
        UPDATE charging_posts
        SET available_slots = available_slots - 1
        WHERE post_id = (SELECT post_id FROM charging_slots WHERE slot_id = @slot_id);
        
        -- Update station availability
        UPDATE charging_stations
        SET available_posts = (
SELECT COUNT(DISTINCT cp.post_id)
            FROM charging_posts cp
            INNER JOIN charging_slots cs ON cp.post_id = cs.post_id
            WHERE cp.station_id = @station_id AND cs.status = 'available'
        )
        WHERE station_id = @station_id;
        
        COMMIT TRANSACTION;
        
        SELECT @booking_id AS booking_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_create_notification]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_create_notification]
    @user_id INT,
    @type NVARCHAR(50),
    @title NVARCHAR(255),
    @message NVARCHAR(MAX),
    @related_booking_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO notifications (user_id, type, title, message, related_booking_id)
    VALUES (@user_id, @type, @title, @message, @related_booking_id);
    
    SELECT SCOPE_IDENTITY() AS notification_id;
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_create_user]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_create_user]
    @email NVARCHAR(255),
    @password_hash NVARCHAR(255),
    @full_name NVARCHAR(255),
    @phone_number NVARCHAR(20),
    @role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @user_id INT;
        
        INSERT INTO users (email, password_hash, full_name, phone_number, role)
        VALUES (@email, @password_hash, @full_name, @phone_number, @role);
        
        SET @user_id = SCOPE_IDENTITY();
        
        -- Create user profile
        INSERT INTO user_profiles (user_id)
        VALUES (@user_id);
        
        COMMIT TRANSACTION;
        
        SELECT @user_id AS user_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_get_available_slots]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_get_available_slots]
    @station_id INT,
    @vehicle_type NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cs.slot_id,
        cs.slot_number,
        cs.connector_type,
        cs.max_power,
        cs.status,
        cp.post_id,
        cp.post_number,
        cp.post_type,
        cp.power_output
    FROM charging_slots cs
    INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
    WHERE cp.station_id = @station_id
        AND cs.status = 'available'
        AND cp.status = 'available'
    ORDER BY cp.post_number, cs.slot_number;
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_get_booking_soc_history]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_get_booking_soc_history]
    @booking_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        tracking_id,
        [timestamp],
        current_soc,
        voltage,
        [current],
        [power],
        energy_delivered,
        temperature,
        estimated_time_remaining
    FROM soc_tracking
    WHERE booking_id = @booking_id
    ORDER BY [timestamp] ASC;
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_get_station_analytics]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_get_station_analytics]
    @station_id INT,
    @start_date DATETIME2,
    @end_date DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH bookings_in_range AS (
        SELECT *
        FROM bookings
        WHERE station_id = @station_id
          AND created_at BETWEEN @start_date AND @end_date
    ),
    energy_per_booking AS (
        SELECT booking_id, SUM(energy_delivered) AS total_energy_delivered_kwh
        FROM soc_tracking
        GROUP BY booking_id
    )
    SELECT 
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
        SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings,
        AVG(CASE WHEN b.status = 'completed' THEN DATEDIFF(MINUTE, b.actual_start_time, b.actual_end_time) END) AS avg_session_duration_minutes,
        SUM(CASE WHEN b.status = 'completed' THEN COALESCE(e.total_energy_delivered_kwh, 0) ELSE 0 END) AS total_energy_delivered_kwh,
        SUM(CASE WHEN b.status = 'completed' THEN COALESCE(i.total_amount, 0) ELSE 0 END) AS total_revenue
    FROM bookings_in_range b
    LEFT JOIN energy_per_booking e ON e.booking_id = b.booking_id
    LEFT JOIN invoices i ON i.booking_id = b.booking_id;
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_get_system_health]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_get_system_health]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM charging_stations WHERE status = 'active') AS active_stations,
        (SELECT COUNT(*) FROM charging_posts WHERE status != 'offline') AS operational_posts,
        (SELECT COUNT(*) FROM charging_slots WHERE status = 'available') AS available_slots,
        (SELECT COUNT(*) FROM bookings WHERE status = 'in_progress') AS active_charging_sessions,
        (SELECT COUNT(*) FROM bookings WHERE status = 'scheduled' AND scheduled_start_time > GETDATE()) AS upcoming_bookings,
        (SELECT COUNT(*) FROM users WHERE is_active = 1) AS active_users;
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_get_user_booking_history]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_get_user_booking_history]
    @user_id INT,
    @limit INT = 50,
    @offset INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
b.booking_id,
        b.scheduling_type,
        b.scheduled_start_time,
        b.actual_start_time,
        b.actual_end_time,
        b.status,
        b.target_soc,
        st.station_name,
        st.address AS station_address,
        v.vehicle_type,
        v.license_plate,
        i.total_amount,
        i.payment_status,
        b.created_at
    FROM bookings b
    INNER JOIN charging_stations st ON b.station_id = st.station_id
    INNER JOIN vehicles v ON b.vehicle_id = v.vehicle_id
    LEFT JOIN invoices i ON b.booking_id = i.booking_id
    WHERE b.user_id = @user_id
    ORDER BY b.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY;
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_scan_qr_code]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_scan_qr_code]
    @qr_data NVARCHAR(500),
    @user_id INT,
    @vehicle_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @qr_id INT;
        DECLARE @station_id INT;
        DECLARE @slot_id INT;
        
        -- Validate QR code
        SELECT @qr_id = qr_id, @station_id = station_id, @slot_id = slot_id
        FROM qr_codes
        WHERE qr_data = @qr_data 
            AND is_active = 1
            AND (expires_at IS NULL OR expires_at > GETDATE());
        
        IF @qr_id IS NULL
        BEGIN
            RAISERROR('Invalid or expired QR code', 16, 1);
            RETURN;
        END
        
        -- Update QR code scan info
        UPDATE qr_codes
        SET last_scanned_at = GETDATE(),
            scan_count = scan_count + 1
        WHERE qr_id = @qr_id;
        
        -- Create immediate booking via sp_create_booking
        EXEC sp_create_booking
            @user_id = @user_id,
            @vehicle_id = @vehicle_id,
            @slot_id = @slot_id,
            @station_id = @station_id,
            @scheduling_type = 'qr_immediate',
            @scheduled_start_time = NULL,
            @estimated_arrival = NULL,
            @target_soc = 80,
            @estimated_duration = NULL;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_search_stations_by_location]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_search_stations_by_location]
    @latitude DECIMAL(10,8),
    @longitude DECIMAL(11,8),
    @radius_km DECIMAL(10,2) = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @search_point GEOGRAPHY = geography::Point(@latitude, @longitude, 4326);
    
    SELECT 
        st.station_id,
        st.station_name,
        st.address,
        st.city,
        st.latitude,
        st.longitude,
        st.total_posts,
        st.available_posts,
        st.operating_hours,
        st.amenities,
st.station_image_url,
        st.status,
        @search_point.STDistance(st.location) / 1000.0 AS distance_km
    FROM charging_stations st
    WHERE st.status = 'active'
        AND @search_point.STDistance(st.location) <= (@radius_km * 1000)
    ORDER BY distance_km;
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_start_charging]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_start_charging]
    @booking_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update booking status
        UPDATE bookings
        SET status = 'in_progress',
            actual_start_time = GETDATE()
        WHERE booking_id = @booking_id;
        
        -- Update slot status
        UPDATE charging_slots
        SET status = 'occupied'
        WHERE slot_id = (SELECT slot_id FROM bookings WHERE booking_id = @booking_id);
        
        COMMIT TRANSACTION;
        
        SELECT 'Charging started successfully' AS message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO
/****** Object:  StoredProcedure [dbo].[sp_update_soc_progress]    Script Date: 10/23/2025 10:11:34 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_update_soc_progress]
    @booking_id INT,
    @current_soc DECIMAL(5,2),
    @voltage DECIMAL(10,2) = NULL,
    @current DECIMAL(10,2) = NULL,
    @power DECIMAL(10,2) = NULL,
    @energy_delivered DECIMAL(10,2) = NULL,
    @temperature DECIMAL(5,2) = NULL,
    @estimated_time_remaining INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO soc_tracking (
        booking_id, current_soc, voltage, [current], [power],
        energy_delivered, temperature, estimated_time_remaining
    )
    VALUES (
        @booking_id, @current_soc, @voltage, @current, @power,
        @energy_delivered, @temperature, @estimated_time_remaining
    );
    
    SELECT 'SOC updated successfully' AS message;
END;

GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Charging session bookings - scheduled or QR immediate' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'bookings'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Main user table containing authentication and basic info' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'users'
GO
SET ARITHABORT ON
SET CONCAT_NULL_YIELDS_NULL ON
SET QUOTED_IDENTIFIER ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
SET NUMERIC_ROUNDABORT OFF
GO
/****** Object:  Index [idx_stations_location]    Script Date: 10/23/2025 10:11:34 AM ******/
CREATE SPATIAL INDEX [idx_stations_location] ON [dbo].[charging_stations]
(
	[location]
)USING  GEOGRAPHY_AUTO_GRID 
WITH (
CELLS_PER_OBJECT = 12, PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
USE [master]
GO
ALTER DATABASE [SkaEV_DB] SET  READ_WRITE 
GO
