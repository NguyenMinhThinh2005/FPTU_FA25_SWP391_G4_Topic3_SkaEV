# Quick backend restart script
Write-Host "=== SkaEV Backend Restart ===" -ForegroundColor Cyan

# Kill existing processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*SkaEV*" -or $_.Path -like "*SkaEV*"} | Stop-Process -Force
Start-Sleep -Seconds 2

# Check SQL Server
$sqlService = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
if ($sqlService.Status -ne 'Running') {
    Write-Host "Starting SQL Server..." -ForegroundColor Yellow
    Start-Service MSSQLSERVER -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# Build
Write-Host "Building..." -ForegroundColor Yellow
Set-Location "D:\Term5\SWP391\FPTU_FA25_SWP391_G4_Topic3_SkaEV\SkaEV.API"
$buildResult = dotnet build -c Debug -v quiet 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build FAILED!" -ForegroundColor Red
    exit 1
}

Write-Host "Build SUCCESS!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting backend on http://localhost:5000..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Start backend
dotnet run --no-build --no-launch-profile --urls "http://localhost:5000"
