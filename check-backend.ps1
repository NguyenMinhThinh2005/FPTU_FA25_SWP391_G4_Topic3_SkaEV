# SkaEV Backend Health Check Script
# Run: .\check-backend.ps1

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "           SkaEV Backend Health Check" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check SQL Server
Write-Host "1. SQL Server Status:" -ForegroundColor Yellow
$sql = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
if ($sql -and $sql.Status -eq "Running") {
    Write-Host "   [OK] Running" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Not running" -ForegroundColor Red
    $allGood = $false
}

# Check Backend Ports
Write-Host "`n2. Backend Ports:" -ForegroundColor Yellow
$port5001 = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue
$port5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

if ($port5001 -or $port5000) {
    Write-Host "   [OK] Backend listening" -ForegroundColor Green
    if ($port5001) { Write-Host "      - Port 5001 HTTPS" -ForegroundColor Gray }
    if ($port5000) { Write-Host "      - Port 5000 HTTP" -ForegroundColor Gray }
} else {
    Write-Host "   [ERROR] Ports not listening" -ForegroundColor Red
    $allGood = $false
}

# Check Dotnet Processes
Write-Host "`n3. Dotnet Processes:" -ForegroundColor Yellow
$procs = Get-Process -Name dotnet -ErrorAction SilentlyContinue
if ($procs) {
    $count = ($procs | Measure-Object).Count
    Write-Host "   [OK] $count dotnet processes running" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] No dotnet processes found" -ForegroundColor Yellow
}

# Test Health Endpoint
Write-Host "`n4. Health Endpoint Test:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   [OK] Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Health endpoint failed" -ForegroundColor Red
    $allGood = $false
}

# Test Swagger UI
Write-Host "`n5. Swagger UI Test:" -ForegroundColor Yellow
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $response = Invoke-WebRequest -Uri "https://localhost:5001/swagger/v1/swagger.json" -UseBasicParsing -TimeoutSec 5
    Write-Host "   [OK] Swagger JSON accessible" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Swagger not accessible" -ForegroundColor Red
    $allGood = $false
}

# Test Database
Write-Host "`n6. Database Connection:" -ForegroundColor Yellow
try {
    $result = sqlcmd -S localhost -E -Q "SELECT COUNT(station_id) FROM SkaEV_DB.dbo.charging_stations" -h -1 2>&1
    if ($result -match "^\s*\d+\s*$") {
        $count = $result.Trim()
        Write-Host "   [OK] Database connected - $count stations" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Database query failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [ERROR] Database connection failed" -ForegroundColor Red
    $allGood = $false
}

# Test API Stations
Write-Host "`n7. API Endpoints Test:" -ForegroundColor Yellow
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $response = Invoke-WebRequest -Uri "https://localhost:5001/api/stations" -UseBasicParsing -TimeoutSec 5
    Write-Host "   [OK] GET /api/stations working" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] GET /api/stations failed" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                    Summary" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Host "[OK] All checks passed! Backend is healthy." -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "   - Frontend:  http://localhost:5173" -ForegroundColor White
    Write-Host "   - Backend:   https://localhost:5001/api" -ForegroundColor White
    Write-Host "   - Swagger:   https://localhost:5001/swagger" -ForegroundColor White
} else {
    Write-Host "[WARNING] Some checks failed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "   - Start SQL:     Start-Service MSSQLSERVER" -ForegroundColor Gray
    Write-Host "   - Start Backend: cd SkaEV.API; dotnet run" -ForegroundColor Gray
}

Write-Host ""
