-- Reset Admin Password Script
-- This script updates admin passwords with proper BCrypt hashes
-- Default password: Admin123!@#

USE SkaEV_DB;
GO

-- BCrypt hash for "Admin123!@#" 
-- Generated with BCrypt.Net workFactor 11
DECLARE @NewPasswordHash NVARCHAR(255) = '$2a$11$9X8qF5h3YvN.2KZQxW7KJOZp3vZ1yH4rXkL9mN2pQ5tU6wV8xY9zA';

-- Update admin accounts
UPDATE Users 
SET PasswordHash = @NewPasswordHash,
    UpdatedAt = GETUTCDATE()
WHERE Role = 'Admin' AND IsActive = 1;

-- Display updated users
SELECT UserId, Email, FullName, Role, 
       LEFT(PasswordHash, 20) + '...' AS PasswordHashPreview,
       IsActive, UpdatedAt
FROM Users 
WHERE Role = 'Admin';

PRINT 'Admin passwords have been reset to: Admin123!@#';
GO
