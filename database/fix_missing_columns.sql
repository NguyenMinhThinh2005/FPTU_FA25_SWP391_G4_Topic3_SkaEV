-- Add missing columns to database to match EF Core model

-- Add ActiveSessions column to charging_stations table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('charging_stations') AND name = 'ActiveSessions')
BEGIN
    ALTER TABLE charging_stations ADD ActiveSessions INT NOT NULL DEFAULT 0;
END

-- Add deleted_at column to charging_posts table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('charging_posts') AND name = 'deleted_at')
BEGIN
    ALTER TABLE charging_posts ADD deleted_at DATETIME2 NULL;
END

-- Add deleted_at column to charging_slots table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('charging_slots') AND name = 'deleted_at')
BEGIN
    ALTER TABLE charging_slots ADD deleted_at DATETIME2 NULL;
END

-- Add deleted_at column to reviews table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('reviews') AND name = 'deleted_at')
BEGIN
    ALTER TABLE reviews ADD deleted_at DATETIME2 NULL;
END

-- Add deleted_at column to notifications table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'deleted_at')
BEGIN
    ALTER TABLE notifications ADD deleted_at DATETIME2 NULL;
END

PRINT 'Database schema updated successfully';