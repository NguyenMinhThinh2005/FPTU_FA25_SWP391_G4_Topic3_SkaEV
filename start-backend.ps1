# Start Backend Server
# Run: .\start-backend.ps1

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "           Starting SkaEV Backend Server" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "SkaEV.API\SkaEV.API.csproj"

# Check if project exists
if (-not (Test-Path $projectPath)) {
    Write-Host "[ERROR] Project file not found: $projectPath" -ForegroundColor Red
    Write-Host "Please run this script from the workspace root directory." -ForegroundColor Yellow
    exit 1
}

# Check SQL Server
Write-Host "Checking SQL Server..." -ForegroundColor Yellow
$sql = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
if (-not $sql -or $sql.Status -ne "Running") {
    Write-Host "[ERROR] SQL Server is not running!" -ForegroundColor Red
    Write-Host "Start SQL Server with: Start-Service MSSQLSERVER" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] SQL Server is running" -ForegroundColor Green

# Check if port 5000 is already in use
Write-Host "`nChecking port availability..." -ForegroundColor Yellow
$port = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "[WARNING] Port 5000 is already in use!" -ForegroundColor Yellow
    Write-Host "A backend instance may already be running." -ForegroundColor Yellow
    $response = Read-Host "Do you want to kill existing process and restart? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "[OK] Existing processes killed" -ForegroundColor Green
    } else {
        Write-Host "Cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

# Build project
Write-Host "`nBuilding project..." -ForegroundColor Yellow
$buildOutput = dotnet build $projectPath 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}
Write-Host "[OK] Build successful" -ForegroundColor Green

# Start backend in new window
Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend will start in a new PowerShell window." -ForegroundColor Cyan
Write-Host "Keep that window open to keep the server running." -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$Host.UI.RawUI.WindowTitle = 'SkaEV Backend Server'
Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '           SkaEV Backend Server Running' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Backend URL:  http://localhost:5000' -ForegroundColor Green
Write-Host 'Swagger UI:   http://localhost:5000/swagger' -ForegroundColor Green
Write-Host 'Health Check: http://localhost:5000/health' -ForegroundColor Green
Write-Host ''
Write-Host 'Press Ctrl+C to stop the server' -ForegroundColor Yellow
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
cd '$PWD'
dotnet run --project $projectPath
"@

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if backend is running
$port = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($port) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "           Backend Started Successfully!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "  - Backend API:  http://localhost:5000" -ForegroundColor White
    Write-Host "  - Swagger UI:   http://localhost:5000/swagger" -ForegroundColor White
    Write-Host "  - Health Check: http://localhost:5000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "The backend is running in a separate window." -ForegroundColor Yellow
    Write-Host "Do not close that window!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Backend failed to start!" -ForegroundColor Red
    Write-Host "Check the backend window for error messages." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
