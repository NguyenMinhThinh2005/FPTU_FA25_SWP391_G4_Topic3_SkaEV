# ============================================================================
# SkaEV - Start All Services
# ============================================================================
# Mô tả: Script tự động start Backend API + Frontend Dev Server
# Ngày: 13/10/2025
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "   SkaEV - Electric Vehicle Charging Station Management System" -ForegroundColor Cyan
Write-Host "   Starting All Services..." -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra SQL Server
Write-Host "[1/5] Checking SQL Server..." -ForegroundColor Yellow
$sqlService = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
if ($sqlService -and $sqlService.Status -eq "Running") {
    Write-Host "  ✅ SQL Server is running" -ForegroundColor Green
} else {
    Write-Host "  ❌ SQL Server is not running!" -ForegroundColor Red
    Write-Host "  Please start SQL Server service first:" -ForegroundColor Yellow
    Write-Host "  Get-Service -Name 'MSSQLSERVER' | Start-Service" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

# Kiểm tra Database
Write-Host "`n[2/5] Checking Database..." -ForegroundColor Yellow
$dbCheck = sqlcmd -S localhost -Q "SELECT name FROM sys.databases WHERE name = 'SkaEV_DB'" -h -1 2>&1
if ($dbCheck -match "SkaEV_DB") {
    Write-Host "  ✅ Database 'SkaEV_DB' found" -ForegroundColor Green
} else {
    Write-Host "  ❌ Database 'SkaEV_DB' not found!" -ForegroundColor Red
    Write-Host "  Please run database setup first:" -ForegroundColor Yellow
    Write-Host "  cd database; sqlcmd -S localhost -E -i DEPLOY_COMPLETE.sql" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

# Kiểm tra .NET SDK
Write-Host "`n[3/5] Checking .NET SDK..." -ForegroundColor Yellow
$dotnetVersion = dotnet --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ .NET SDK $dotnetVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ .NET SDK not found!" -ForegroundColor Red
    Write-Host "  Download: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Kiểm tra Node.js
Write-Host "`n[4/5] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js not found!" -ForegroundColor Red
    Write-Host "  Download: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n[5/5] Starting Services..." -ForegroundColor Yellow
Write-Host ""

# Start Backend trong terminal mới
Write-Host "  → Starting Backend API (https://localhost:5001)..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "SkaEV.API"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend API Server' -ForegroundColor Green; Write-Host 'Running on: https://localhost:5001' -ForegroundColor Yellow; Write-Host 'Swagger UI: https://localhost:5001/swagger' -ForegroundColor Yellow; Write-Host ''; dotnet run"

# Đợi backend start
Write-Host "  ⏳ Waiting for backend to start (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Kiểm tra backend đã chạy chưa
$backendRunning = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendRunning = $true
            break
        }
    } catch {
        Write-Host "  ⏳ Retry $i/5..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if ($backendRunning) {
    Write-Host "  ✅ Backend API is running" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Backend might still be starting... Check the Backend terminal" -ForegroundColor Yellow
}

# Start Frontend trong terminal mới
Write-Host "`n  → Starting Frontend Dev Server (http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '🎨 Frontend Dev Server' -ForegroundColor Green; Write-Host 'Running on: http://localhost:5173' -ForegroundColor Yellow; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  ✅ All services started successfully!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📌 URLs:" -ForegroundColor White
Write-Host "     Frontend:     http://localhost:5173" -ForegroundColor Yellow
Write-Host "     Backend API:  https://localhost:5001" -ForegroundColor Yellow
Write-Host "     Swagger UI:   https://localhost:5001/swagger" -ForegroundColor Yellow
Write-Host ""
Write-Host "  💡 Tips:" -ForegroundColor White
Write-Host "     - Frontend requires Backend to be running" -ForegroundColor Gray
Write-Host "     - Check DevTools Console (F12) for errors" -ForegroundColor Gray
Write-Host "     - Backend logs: SkaEV.API/logs/skaev-*.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "  🛑 To stop services: Close both terminal windows" -ForegroundColor White
Write-Host ""
Write-Host "  ✨ Happy Coding!" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close this window"
