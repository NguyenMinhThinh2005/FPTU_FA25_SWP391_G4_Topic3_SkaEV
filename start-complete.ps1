# Start both backend and frontend for complete testing
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  STARTING COMPLETE PROJECT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start SQL Server
Write-Host "[1/4] Checking SQL Server..." -ForegroundColor Yellow
$sql = Get-Service MSSQLSERVER -ErrorAction SilentlyContinue
if ($sql.Status -ne 'Running') {
    Write-Host "  Starting SQL Server..." -ForegroundColor Yellow
    Start-Service MSSQLSERVER
    Start-Sleep -Seconds 5
    Write-Host "  [OK] SQL Server started" -ForegroundColor Green
} else {
    Write-Host "  [OK] SQL Server already running" -ForegroundColor Green
}

# 2. Start Backend
Write-Host ""
Write-Host "[2/4] Starting Backend..." -ForegroundColor Yellow
cd D:\Term5\SWP391\FPTU_FA25_SWP391_G4_Topic3_SkaEV\SkaEV.API
$env:ASPNETCORE_URLS="http://localhost:5000"
$env:ASPNETCORE_ENVIRONMENT="Development"
Start-Process -FilePath "dotnet" -ArgumentList "bin\Debug\net9.0\SkaEV.API.dll" -WindowStyle Hidden
Start-Sleep -Seconds 8

# Test backend
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/stations" -TimeoutSec 5
    Write-Host "  [OK] Backend is running (Stations: $($health.Count))" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Backend failed to start!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Start Frontend
Write-Host ""
Write-Host "[3/4] Starting Frontend..." -ForegroundColor Yellow
cd D:\Term5\SWP391\FPTU_FA25_SWP391_G4_Topic3_SkaEV
Start-Process -FilePath "npm" -ArgumentList "run dev" -WindowStyle Hidden
Start-Sleep -Seconds 8

Write-Host "  [OK] Frontend starting..." -ForegroundColor Green

# 4. Run comprehensive test
Write-Host ""
Write-Host "[4/4] Running comprehensive test..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
.\test-comprehensive.ps1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PROJECT RUNNING" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin2@skaev.com / Admin@123" -ForegroundColor White
Write-Host "  Staff: staff2@skaev.com / Staff@123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to stop all services..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop services
Write-Host ""
Write-Host "Stopping services..." -ForegroundColor Yellow
Get-Process -Name "dotnet","node" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "[OK] All services stopped" -ForegroundColor Green
