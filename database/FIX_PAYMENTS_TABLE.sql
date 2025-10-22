-- Fix payments table columns
USE SkaEV_DB;

-- Check and rename staff_id to processed_by_staff_id
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'staff_id')
BEGIN
    -- Drop default constraint if exists
    DECLARE @ConstraintName NVARCHAR(200)
    SELECT @ConstraintName = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.payments') AND c.name = 'staff_id'
    
    IF @ConstraintName IS NOT NULL
        EXEC('ALTER TABLE dbo.payments DROP CONSTRAINT [' + @ConstraintName + ']')
    
    -- Rename column
    EXEC sp_rename 'dbo.payments.staff_id', 'processed_by_staff_id', 'COLUMN';
    PRINT '✓ Renamed staff_id to processed_by_staff_id'
END

-- Check and rename payment_date to processed_at
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'payment_date')
BEGIN
    -- Drop default constraint if exists
    DECLARE @ConstraintName2 NVARCHAR(200)
    SELECT @ConstraintName2 = dc.name
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.payments') AND c.name = 'payment_date'
    
    IF @ConstraintName2 IS NOT NULL
        EXEC('ALTER TABLE dbo.payments DROP CONSTRAINT [' + @ConstraintName2 + ']')
    
    -- Rename column
    EXEC sp_rename 'dbo.payments.payment_date', 'processed_at', 'COLUMN';
    PRINT '✓ Renamed payment_date to processed_at'
END

-- Add refund_date if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'refund_date')
BEGIN
    ALTER TABLE dbo.payments ADD refund_date DATETIME2(7) NULL;
    PRINT '✓ Added refund_date'
END

-- Add notes if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.payments') AND name = 'notes')
BEGIN
    ALTER TABLE dbo.payments ADD notes NVARCHAR(MAX) NULL;
    PRINT '✓ Added notes'
END

SELECT 'Payments table updated!' AS Result;
