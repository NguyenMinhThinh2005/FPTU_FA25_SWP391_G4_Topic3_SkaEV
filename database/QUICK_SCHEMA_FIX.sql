-- ==========================================
-- QUICK SCHEMA FIX - Copy and paste this into SSMS
-- Checks if columns exist before adding them
-- ==========================================

USE SkaEV_DB;
GO

-- Add deleted_at columns (only if not exists)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.users') AND name = 'deleted_at')
    ALTER TABLE dbo.users ADD deleted_at DATETIME2(7) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'deleted_at')
    ALTER TABLE dbo.bookings ADD deleted_at DATETIME2(7) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.vehicles') AND name = 'deleted_at')
    ALTER TABLE dbo.vehicles ADD deleted_at DATETIME2(7) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.charging_stations') AND name = 'deleted_at')
    ALTER TABLE dbo.charging_stations ADD deleted_at DATETIME2(7) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payment_methods') AND name = 'deleted_at')
    ALTER TABLE dbo.payment_methods ADD deleted_at DATETIME2(7) NULL;

-- Add audit columns (only if not exists)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'created_by')
    ALTER TABLE dbo.bookings ADD created_by INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'updated_by')
    ALTER TABLE dbo.bookings ADD updated_by INT NULL;

-- Add foreign keys (only if not exists)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_bookings_created_by')
    ALTER TABLE dbo.bookings ADD CONSTRAINT FK_bookings_created_by 
        FOREIGN KEY (created_by) REFERENCES dbo.users(user_id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_bookings_updated_by')
    ALTER TABLE dbo.bookings ADD CONSTRAINT FK_bookings_updated_by 
        FOREIGN KEY (updated_by) REFERENCES dbo.users(user_id);

SELECT 'Schema update completed!' AS Result;
GO
