# Quick script to reset slot 3 to available
Write-Host "=== Resetting Slot 3 to Available ===" -ForegroundColor Cyan

$query = @"
UPDATE charging_slots 
SET status = 'available', current_booking_id = NULL
WHERE slot_id = 3;

SELECT slot_id, status, current_booking_id FROM charging_slots;
"@

sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -E -Q $query -W

Write-Host "`n✅ Slot 3 reset to available" -ForegroundColor Green
