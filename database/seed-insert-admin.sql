SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

USE SkaEV_DB;
GO

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@skaev.com')
BEGIN
  INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
  VALUES (
    'admin@skaev.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- Admin@123 bcrypt hash
    'System Admin',
    NULL,
    'admin',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  );
  PRINT 'Inserted admin@skaev.com';
END
ELSE
BEGIN
  PRINT 'admin@skaev.com already exists';
END
GO
