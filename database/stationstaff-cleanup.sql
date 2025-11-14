-- stationstaff-cleanup.sql
-- Idempotent cleanup template to deactivate (soft-delete) unwanted StationStaff assignments.
-- IMPORTANT: This script is intentionally conservative. It provides a PREVIEW SELECT first.
-- Replace the placeholder emails or userIds in the whitelist with the canonical staff you want to KEEP.
-- Run the PREVIEW section, review rows, then run the UPDATE within a transaction and COMMIT when satisfied.

-- === CONFIGURE: canonical staff to KEEP ===
-- By default this script uses explicit user IDs (safer than emails). Update the list below if needed.
DECLARE @KeepUserIds TABLE (UserId int);
-- Insert the canonical staff userIds to KEEP (these won't be deactivated)
INSERT INTO @KeepUserIds (UserId) VALUES (71), (70), (5), (10);

-- If you prefer to use emails instead, comment out the @KeepUserIds block above and
-- uncomment and populate @KeepEmails below. Using userIds avoids ambiguity.
-- DECLARE @KeepEmails TABLE (Email nvarchar(256));
-- INSERT INTO @KeepEmails (Email) VALUES ('nhanvienA@skaev.com'), ('staff6@skaev.com'), ('staff7@skaev.com'), ('staff2@skaev.com');

-- 1) PREVIEW: show rows that WOULD BE deactivated (do not modify yet)
PRINT 'PREVIEW: StationStaff assignments that WOULD BE deactivated (ss.IsActive = 1 AND user NOT in keep list)';
SELECT
    ss.AssignmentId,
    ss.StaffUserId,
    u.Email,
    u.FullName,
    ss.StationId,
    cs.StationName,
    ss.AssignedAt
FROM StationStaff ss
JOIN [Users] u ON u.UserId = ss.StaffUserId
LEFT JOIN ChargingStations cs ON cs.StationId = ss.StationId
WHERE ss.IsActive = 1
  AND NOT EXISTS (SELECT 1 FROM @KeepUserIds k WHERE k.UserId = ss.StaffUserId);


-- === When satisfied with PREVIEW, run the UPDATE within an explicit transaction ===
-- Uncomment and run the following block to perform the soft-delete (IsActive = 0).
-- NOTE: This update is idempotent: running it twice won't flip already-deactivated rows back.

-- BEGIN TRANSACTION;
--
-- PRINT 'About to deactivate the rows shown in PREVIEW above';
-- UPDATE ss
-- SET ss.IsActive = 0
-- FROM StationStaff ss
-- JOIN [Users] u ON u.UserId = ss.StaffUserId
-- WHERE ss.IsActive = 1
--   AND NOT EXISTS (SELECT 1 FROM @KeepUserIds k WHERE k.UserId = ss.StaffUserId);
--
-- -- Verify changes
-- SELECT ss.AssignmentId, ss.StaffUserId, u.Email, ss.StationId, cs.StationName, ss.IsActive
-- FROM StationStaff ss
-- JOIN [Users] u ON u.UserId = ss.StaffUserId
-- LEFT JOIN ChargingStations cs ON cs.StationId = ss.StationId
-- WHERE u.Email IN (SELECT Email FROM @KeepEmails) OR ss.IsActive = 0
-- ORDER BY u.Email;
--
-- -- If everything looks good, commit; otherwise rollback
-- COMMIT;
-- -- ROLLBACK; -- use if you change your mind

-- === Safety notes ===
-- 1) This script only DEACTIVATES assignments by setting IsActive = 0. It does not delete rows.
-- 2) It is idempotent: re-running the UPDATE will have no additional effect on already deactivated rows.
-- 3) Always run the PREVIEW SELECT first and review results before uncommenting the UPDATE block.
-- 4) If you prefer stricter rules (e.g., only deactivate assignments that have StationId IS NULL, or match name patterns), let me know and I will create a targeted variant.
