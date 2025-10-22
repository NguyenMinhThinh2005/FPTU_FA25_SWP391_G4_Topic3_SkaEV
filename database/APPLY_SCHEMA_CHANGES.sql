-- ==========================================
-- SCHEMA UPDATE - Apply Database Changes
-- Must run this before starting backend!
-- ==========================================

USE SkaEV_DB;
GO

PRINT '=========================================='
PRINT 'APPLYING SCHEMA CHANGES'
PRINT '=========================================='

-- Add deleted_at columns
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'deleted_at')
BEGIN
    ALTER TABLE dbo.users ADD deleted_at DATETIME2(7) NULL;
    PRINT '✓ Added deleted_at to users'
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'deleted_at')
BEGIN
    ALTER TABLE dbo.bookings ADD deleted_at DATETIME2(7) NULL;
    PRINT '✓ Added deleted_at to bookings'
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.vehicles') AND name = 'deleted_at')
BEGIN
    ALTER TABLE dbo.vehicles ADD deleted_at DATETIME2(7) NULL;
    PRINT '✓ Added deleted_at to vehicles'
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.charging_stations') AND name = 'deleted_at')
BEGIN
    ALTER TABLE dbo.charging_stations ADD deleted_at DATETIME2(7) NULL;
    PRINT '✓ Added deleted_at to charging_stations'
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payment_methods') AND name = 'deleted_at')
BEGIN
    ALTER TABLE dbo.payment_methods ADD deleted_at DATETIME2(7) NULL;
    PRINT '✓ Added deleted_at to payment_methods'
END
GO

-- Add audit columns to bookings
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'created_by')
BEGIN
    ALTER TABLE dbo.bookings ADD created_by INT NULL;
    PRINT '✓ Added created_by to bookings'
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'updated_by')
BEGIN
    ALTER TABLE dbo.bookings ADD updated_by INT NULL;
    PRINT '✓ Added updated_by to bookings'
END

-- Add foreign keys
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_bookings_created_by')
BEGIN
    ALTER TABLE dbo.bookings 
    ADD CONSTRAINT FK_bookings_created_by 
    FOREIGN KEY (created_by) REFERENCES dbo.users(user_id);
    PRINT '✓ Added FK_bookings_created_by'
END

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_bookings_updated_by')
BEGIN
    ALTER TABLE dbo.bookings 
    ADD CONSTRAINT FK_bookings_updated_by 
    FOREIGN KEY (updated_by) REFERENCES dbo.users(user_id);
    PRINT '✓ Added FK_bookings_updated_by'
END
GO

PRINT '=========================================='
PRINT '✅ SCHEMA UPDATED SUCCESSFULLY!'
PRINT 'You can now start the backend API'
PRINT '=========================================='
GO
