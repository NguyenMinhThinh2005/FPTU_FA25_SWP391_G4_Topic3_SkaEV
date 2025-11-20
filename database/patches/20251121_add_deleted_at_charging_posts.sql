-- Migration: Add deleted_at column to charging_posts table
-- Date: 2025-11-21
-- Description: Add soft delete functionality to charging_posts table

USE [SkaEV_DB]
GO

-- Check if column doesn't exist before adding
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[charging_posts]') AND name = 'deleted_at')
BEGIN
    ALTER TABLE [dbo].[charging_posts]
    ADD [deleted_at] DATETIME2(7) NULL;

    PRINT 'Added column: deleted_at to charging_posts table';
END
ELSE
BEGIN
    PRINT 'Column deleted_at already exists in charging_posts table';
END
GO

PRINT 'Migration completed successfully!';
GO