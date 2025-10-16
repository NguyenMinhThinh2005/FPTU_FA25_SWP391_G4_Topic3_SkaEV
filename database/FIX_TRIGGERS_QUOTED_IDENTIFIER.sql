-- =====================================================
-- FIX_TRIGGERS_QUOTED_IDENTIFIER.sql
-- Recreate all triggers with QUOTED_IDENTIFIER ON
-- Required for computed columns compatibility
-- =====================================================

USE SkaEV_DB;
GO

SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Recreating triggers with QUOTED_IDENTIFIER ON...';

-- Drop existing triggers if they exist
IF OBJECT_ID('trg_charging_stations_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_charging_stations_updated_at;
GO

IF OBJECT_ID('trg_charging_posts_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_charging_posts_updated_at;
GO

IF OBJECT_ID('trg_charging_slots_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_charging_slots_updated_at;
GO

IF OBJECT_ID('trg_bookings_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_bookings_updated_at;
GO

IF OBJECT_ID('trg_users_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER trg_users_updated_at;
GO

-- Recreate trigger for charging_stations
CREATE TRIGGER trg_charging_stations_updated_at
ON charging_stations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE charging_stations
    SET updated_at = GETDATE()
    FROM charging_stations cs
    INNER JOIN inserted i ON cs.station_id = i.station_id;
END;
GO

PRINT 'Created trigger: trg_charging_stations_updated_at';

-- Recreate trigger for charging_posts
CREATE TRIGGER trg_charging_posts_updated_at
ON charging_posts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE charging_posts
    SET updated_at = GETDATE()
    FROM charging_posts cp
    INNER JOIN inserted i ON cp.post_id = i.post_id;
END;
GO

PRINT 'Created trigger: trg_charging_posts_updated_at';

-- Recreate trigger for charging_slots
CREATE TRIGGER trg_charging_slots_updated_at
ON charging_slots
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE charging_slots
    SET updated_at = GETDATE()
    FROM charging_slots cs
    INNER JOIN inserted i ON cs.slot_id = i.slot_id;
END;
GO

PRINT 'Created trigger: trg_charging_slots_updated_at';

-- Recreate trigger for bookings
CREATE TRIGGER trg_bookings_updated_at
ON bookings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE bookings
    SET updated_at = GETDATE()
    FROM bookings b
    INNER JOIN inserted i ON b.booking_id = i.booking_id;
END;
GO

PRINT 'Created trigger: trg_bookings_updated_at';

-- Recreate trigger for users
CREATE TRIGGER trg_users_updated_at
ON users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE users
    SET updated_at = GETDATE()
    FROM users u
    INNER JOIN inserted i ON u.user_id = i.user_id;
END;
GO

PRINT 'Created trigger: trg_users_updated_at';

PRINT '';
PRINT '========================================';
PRINT 'All triggers recreated successfully with QUOTED_IDENTIFIER ON';
PRINT '========================================';

GO
