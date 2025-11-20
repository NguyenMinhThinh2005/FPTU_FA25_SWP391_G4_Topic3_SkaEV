-- Add deleted_at columns to support soft-delete for posts, slots, reviews, notifications
-- Run this against your database (SQL Server). Adjust types if using SQLite.

ALTER TABLE charging_posts ADD deleted_at DATETIME2 NULL;
GO

ALTER TABLE charging_slots ADD deleted_at DATETIME2 NULL;
GO

ALTER TABLE reviews ADD deleted_at DATETIME2 NULL;
GO

ALTER TABLE notifications ADD deleted_at DATETIME2 NULL;
GO

-- Optional: initialize deleted_at for records previously considered deleted (if any)
-- UPDATE charging_posts SET deleted_at = NULL WHERE deleted_at IS NULL;
-- UPDATE charging_slots SET deleted_at = NULL WHERE deleted_at IS NULL;
-- UPDATE reviews SET deleted_at = NULL WHERE deleted_at IS NULL;
-- UPDATE notifications SET deleted_at = NULL WHERE deleted_at IS NULL;
