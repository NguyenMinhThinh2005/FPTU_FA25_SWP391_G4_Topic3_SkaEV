# Start backend and run comprehensive test immediately
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  QUICK BACKEND TEST" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Kill existing
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start SQL Server
$sql = Get-Service MSSQLSERVER -ErrorAction SilentlyContinue
if ($sql.Status -ne 'Running') {
    Write-Host "Starting SQL Server..." -ForegroundColor Yellow
    Start-Service MSSQLSERVER
    Start-Sleep -Seconds 3
}

# Start backend in background
Write-Host "Starting backend..." -ForegroundColor Yellow
cd D:\Term5\SWP391\FPTU_FA25_SWP391_G4_Topic3_SkaEV\SkaEV.API
$env:ASPNETCORE_URLS="http://localhost:5000"
Start-Process -FilePath "dotnet" -ArgumentList "bin\Debug\net9.0\SkaEV.API.dll" -WindowStyle Hidden
Start-Sleep -Seconds 8

# Run comprehensive test IMMEDIATELY
Write-Host ""
cd D:\Term5\SWP391\FPTU_FA25_SWP391_G4_Topic3_SkaEV
.\test-comprehensive.ps1
