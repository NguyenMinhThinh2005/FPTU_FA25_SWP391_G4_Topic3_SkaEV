# Check database statistics
Write-Host "=== Checking Database Statistics ===" -ForegroundColor Cyan

Write-Host "`n1. Active Stations:" -ForegroundColor Yellow
$query1 = "SELECT COUNT(*) as count FROM charging_stations WHERE status = 'active';"
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -E -Q $query1 -h-1 -W

Write-Host "`n2. Registered Customers:" -ForegroundColor Yellow
$query2 = "SELECT COUNT(*) as count FROM users WHERE role = 'customer' AND deleted_at IS NULL;"
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -E -Q $query2 -h-1 -W

Write-Host "`n3. Completed Bookings:" -ForegroundColor Yellow
$query3 = "SELECT COUNT(*) as count FROM bookings WHERE status = 'completed';"
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -E -Q $query3 -h-1 -W

Write-Host "`n4. Total Bookings:" -ForegroundColor Yellow
$query4 = "SELECT COUNT(*) as count FROM bookings;"
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -E -Q $query4 -h-1 -W

Write-Host "`n=== Summary ===" -ForegroundColor Green
