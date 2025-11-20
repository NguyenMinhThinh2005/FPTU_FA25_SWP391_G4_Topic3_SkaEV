USE SkaEV_DB;
GO

-- Ensure required SET options for operations against objects with filtered indexes / indexed views
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- Replace assignments from 'Lê Văn Cường (Đã nghỉ)' to an active staff account
-- Note: script is idempotent and prefers staff2@skaev.com then staff@skaev.com

-- Try several variants in case diacritics or formats differ in the DB
DECLARE @oldUserId INT = (
    SELECT TOP 1 user_id FROM users
    WHERE full_name = N'Lê Văn Cường (Đã nghỉ)'
       OR full_name LIKE N'%Lê Văn Cường%'
       OR full_name LIKE N'%Le Van Cuong%'
       OR full_name LIKE N'%Cuong%'
       OR email LIKE '%nhanvienC%'
);
IF @oldUserId IS NULL
BEGIN
    PRINT N'User "Lê Văn Cường (Đã nghỉ)" not found - nothing to replace.';
    RETURN;
END

-- Prefer staff2@skaev.com, then staff@skaev.com, otherwise pick any staff
DECLARE @newUserId INT = (
    SELECT TOP 1 user_id FROM users
    WHERE role = 'staff'
    ORDER BY CASE WHEN email = 'staff2@skaev.com' THEN 0 WHEN email = 'staff@skaev.com' THEN 1 ELSE 2 END
);

IF @newUserId IS NULL
BEGIN
    PRINT N'No replacement staff account found. Please create a staff user first.';
    RETURN;
END

PRINT N'OldUserId=' + CAST(@oldUserId AS NVARCHAR(20)) + N', NewUserId=' + CAST(@newUserId AS NVARCHAR(20));

-- Update incidents assigned to the old user
UPDATE incidents
SET assigned_to_staff_id = @newUserId
WHERE assigned_to_staff_id = @oldUserId;
PRINT N'Incidents updated: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));

-- Update station staff assignments
IF OBJECT_ID('dbo.station_staff') IS NOT NULL
BEGIN
    UPDATE station_staff
    SET staff_user_id = @newUserId
    WHERE staff_user_id = @oldUserId;
    PRINT N'Station staff assignments updated: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
END

-- Update payments processed_by_staff if exists
IF OBJECT_ID('dbo.payments') IS NOT NULL
BEGIN
    UPDATE payments
    SET processed_by_staff_id = @newUserId
    WHERE processed_by_staff_id = @oldUserId;
    PRINT N'Payments updated: ' + CAST(@@ROWCOUNT AS NVARCHAR(20));
END

-- Optionally mark the old user as replaced to avoid confusion in UI
UPDATE users
SET full_name = CASE WHEN full_name NOT LIKE N'% (Replaced)' THEN full_name + N' (Replaced)' ELSE full_name END
WHERE user_id = @oldUserId;
PRINT N'Old user renamed/marked.';

PRINT N'Replacement complete.';
GO
