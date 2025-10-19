# Check Charging Stations Data with Proper Encoding
# This script connects directly to SQL Server and displays Vietnamese text correctly

$serverInstance = "localhost\SQLEXPRESS"
$database = "SkaEV_DB"

# Query to get first 5 stations
$query = @"
SELECT TOP 5 
    station_id,
    station_name,
    address,
    city,
    total_posts,
    available_posts,
    status
FROM charging_stations 
ORDER BY station_id
"@

try {
    # Create SQL connection
    $connectionString = "Server=$serverInstance;Database=$database;Integrated Security=True;TrustServerCertificate=True;"
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "DANH SÁCH TRẠM SẠC XE ĐIỆN" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    
    # Create SQL command
    $command = $connection.CreateCommand()
    $command.CommandText = $query
    
    # Execute query
    $reader = $command.ExecuteReader()
    
    $count = 0
    while ($reader.Read()) {
        $count++
        $stationNum = "Tram " + $count
        Write-Host $stationNum -ForegroundColor Cyan
        Write-Host "  ID: $($reader['station_id'])"
        Write-Host "  Ten: $($reader['station_name'])"
        Write-Host "  Dia chi: $($reader['address'])"
        Write-Host "  Thanh pho: $($reader['city'])"
        Write-Host "  Tong cong sac: $($reader['total_posts'])"
        Write-Host "  Cong kha dung: $($reader['available_posts'])"
        Write-Host "  Trang thai: $($reader['status'])"
        Write-Host ""
    }
    
    $reader.Close()
    
    # Get summary
    $command.CommandText = @"
SELECT 
    COUNT(*) as total_stations,
    SUM(total_posts) as total_posts,
    SUM(available_posts) as available_posts
FROM charging_stations
"@
    
    $reader = $command.ExecuteReader()
    
    if ($reader.Read()) {
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "TONG KET" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        Write-Host "Tong so tram sac: $($reader['total_stations'])" -ForegroundColor Yellow
        Write-Host "Tong so cong sac: $($reader['total_posts'])" -ForegroundColor Yellow
        Write-Host "Cong kha dung: $($reader['available_posts'])" -ForegroundColor Yellow
        Write-Host ""
    }
    
    $reader.Close()
    $connection.Close()
    
    Write-Host "Check du lieu thanh cong!" -ForegroundColor Green
    
} catch {
    Write-Host "Lỗi: $_" -ForegroundColor Red
    if ($connection.State -eq 'Open') {
        $connection.Close()
    }
}
