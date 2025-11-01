# Check slot status in database
Write-Host "=== Checking Slot Status ===" -ForegroundColor Cyan

$query = @"
SELECT 
    slot_id,
    slot_number,
    connector_type,
    status,
    current_booking_id,
    post_id
FROM charging_slots
ORDER BY slot_id;
"@

sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -E -Q $query -W

Write-Host "`n=== Checking Bookings ===" -ForegroundColor Cyan

$query2 = @"
SELECT TOP 10
    booking_id,
    user_id,
    slot_id,
    status,
    scheduling_type,
    created_at
FROM bookings
ORDER BY created_at DESC;
"@

sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -E -Q $query2 -W
