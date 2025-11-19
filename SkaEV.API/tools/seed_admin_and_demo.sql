-- Seed script: create admin user and sample station
-- WARNING: run only in development environments

SET NOCOUNT ON;

-- Replace values as needed
DECLARE @adminEmail NVARCHAR(255) = 'admin@skaev.com';
DECLARE @plainPassword NVARCHAR(100) = 'Admin@123';
DECLARE @fullName NVARCHAR(255) = 'System Admin';
DECLARE @now DATETIME2 = SYSUTCDATETIME();

-- Note: Password hashing is performed by the application (BCrypt).
-- This script will insert a placeholder hash that must be replaced with a real BCrypt hash.
-- To avoid storing plaintext-derived predictable values in the script, we insert a temporary random password
-- and then you should call the Admin reset endpoint to set a known password securely.

-- Insert admin user if not exists
IF NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER(@adminEmail) AND deleted_at IS NULL)
BEGIN
    INSERT INTO users (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
    VALUES (
        @adminEmail,
        'TEMP_NEED_APP_RESET', -- placeholder; replace by running admin reset or updating with hashed value via app service
        @fullName,
        NULL,
        'admin',
        1,
        @now,
        @now
    );
END

-- Create a minimal sample station if none exist
IF NOT EXISTS (SELECT 1 FROM charging_stations WHERE deleted_at IS NULL)
BEGIN
    INSERT INTO charging_stations (station_name, address, city, latitude, longitude, total_posts, available_posts, operating_hours, amenities, station_image_url, status, created_at, updated_at)
    VALUES (
        'Demo Station 1',
        '123 Demo Street',
        'DemoCity',
        10.762622, -- lat
        106.660172, -- lon
        2,
        2,
        '00:00-23:59',
        'restroom,shop',
        NULL,
        'active',
        @now,
        @now
    );
END

SELECT 'Seed script completed. Note: password is set to placeholder "TEMP_NEED_APP_RESET". Use Admin API to reset password or update password_hash with a BCrypt hash.' AS message;
