-- Migration: Add missing columns to vehicles table
-- Date: 2025-11-12
-- Description: Add vehicle_name, vehicle_year, vin, color, max_charging_speed, connector_types columns

USE [SkaEV_DB]
GO

-- Check if columns don't exist before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[vehicles]') AND name = 'vehicle_name')
BEGIN
    ALTER TABLE [dbo].[vehicles]
    ADD [vehicle_name] NVARCHAR(120) NOT NULL DEFAULT '';
    
    PRINT 'Added column: vehicle_name';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[vehicles]') AND name = 'vehicle_year')
BEGIN
    ALTER TABLE [dbo].[vehicles]
    ADD [vehicle_year] INT NULL;
    
    PRINT 'Added column: vehicle_year';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[vehicles]') AND name = 'vin')
BEGIN
    ALTER TABLE [dbo].[vehicles]
    ADD [vin] NVARCHAR(32) NULL;
    
    PRINT 'Added column: vin';
    
    -- Add unique index on VIN (with filter for non-null values)
    CREATE UNIQUE NONCLUSTERED INDEX [IX_vehicles_vin]
    ON [dbo].[vehicles]([vin])
    WHERE [vin] IS NOT NULL;
    
    PRINT 'Added unique index on vin';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[vehicles]') AND name = 'color')
BEGIN
    ALTER TABLE [dbo].[vehicles]
    ADD [color] NVARCHAR(50) NULL;
    
    PRINT 'Added column: color';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[vehicles]') AND name = 'max_charging_speed')
BEGIN
    ALTER TABLE [dbo].[vehicles]
    ADD [max_charging_speed] DECIMAL(10,2) NULL;
    
    PRINT 'Added column: max_charging_speed';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[vehicles]') AND name = 'connector_types')
BEGIN
    ALTER TABLE [dbo].[vehicles]
    ADD [connector_types] NVARCHAR(MAX) NULL;
    
    PRINT 'Added column: connector_types';
END
GO

-- Update existing vehicles to have a default vehicle_name if empty
UPDATE [dbo].[vehicles]
SET [vehicle_name] = CONCAT(ISNULL([brand], ''), ' ', ISNULL([model], 'Vehicle'))
WHERE [vehicle_name] = '' OR [vehicle_name] IS NULL;

PRINT 'Migration completed successfully!';
PRINT 'Added columns: vehicle_name, vehicle_year, vin, color, max_charging_speed, connector_types';
GO
