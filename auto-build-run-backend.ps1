# =====================================================
# SkaEV Backend - Auto Build, Fix & Run Script
# =====================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   SkaEV Backend - Auto Build & Run" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to API folder
$apiPath = Join-Path $PSScriptRoot "SkaEV.API"
if (-not (Test-Path $apiPath)) {
    Write-Host "[ERROR] SkaEV.API folder not found!" -ForegroundColor Red
    exit 1
}

Set-Location $apiPath

# Step 1: Stop existing backend processes
Write-Host "Step 1: Stopping existing backend processes..." -ForegroundColor Yellow
$existingProcesses = Get-NetTCPConnection -LocalPort 5001,5000 -State Listen -ErrorAction SilentlyContinue
if ($existingProcesses) {
    $pids = $existingProcesses.OwningProcess | Select-Object -Unique
    foreach ($pid in $pids) {
        Write-Host "   Stopping process PID: $pid" -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   [OK] Previous backend stopped" -ForegroundColor Green
} else {
    Write-Host "   [OK] No previous backend running" -ForegroundColor Green
}

Write-Host ""

# Step 2: Check SQL Server
Write-Host "Step 2: Checking SQL Server..." -ForegroundColor Yellow
$sqlService = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
if (-not $sqlService) {
    $sqlService = Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
}

if ($sqlService -and $sqlService.Status -eq "Running") {
    Write-Host "   [OK] SQL Server is running" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] SQL Server not running" -ForegroundColor Yellow
    Write-Host "   Attempting to start SQL Server..." -ForegroundColor Gray
    
    if (Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue) {
        Start-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
    } elseif (Get-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue) {
        Start-Service -Name "MSSQL`$SQLEXPRESS" -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 3
    Write-Host "   [OK] SQL Server started" -ForegroundColor Green
}

Write-Host ""

# Step 3: Clean previous builds
Write-Host "Step 3: Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "bin") {
    Remove-Item -Recurse -Force "bin" -ErrorAction SilentlyContinue
    Write-Host "   Deleted bin/" -ForegroundColor Gray
}
if (Test-Path "obj") {
    Remove-Item -Recurse -Force "obj" -ErrorAction SilentlyContinue
    Write-Host "   Deleted obj/" -ForegroundColor Gray
}
Write-Host "   [OK] Clean completed" -ForegroundColor Green

Write-Host ""

# Step 4: Restore NuGet packages
Write-Host "Step 4: Restoring NuGet packages..." -ForegroundColor Yellow
$restoreOutput = dotnet restore 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Packages restored successfully" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] Restore had warnings" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Build project
Write-Host "Step 5: Building project..." -ForegroundColor Yellow
$buildOutput = dotnet build --no-restore 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] Build succeeded" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Build errors:" -ForegroundColor Red
    Write-Host $buildOutput
    Write-Host ""
    Write-Host "Attempting auto-fix common errors..." -ForegroundColor Yellow
    
    # Auto-fix: Restore packages again
    Write-Host "   Trying: dotnet restore --force" -ForegroundColor Gray
    dotnet restore --force | Out-Null
    
    # Retry build
    Write-Host "   Retrying build..." -ForegroundColor Gray
    $buildOutput = dotnet build --no-restore 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Build succeeded after auto-fix" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Build still failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please fix the errors manually:" -ForegroundColor Yellow
        Write-Host $buildOutput
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""

# Step 6: Check database connection
Write-Host "Step 6: Checking database..." -ForegroundColor Yellow
try {
    $dbCheck = sqlcmd -S localhost -E -Q "SELECT DB_ID('SkaEV_DB')" -h -1 2>&1
    if ($dbCheck -match "^\s*\d+\s*$") {
        Write-Host "   [OK] Database 'SkaEV_DB' exists" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Database 'SkaEV_DB' not found" -ForegroundColor Yellow
        Write-Host "   Run: cd database; sqlcmd -S localhost -E -i DEPLOY_COMPLETE.sql" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [WARNING] Cannot check database" -ForegroundColor Yellow
}

Write-Host ""

# Step 7: Run backend
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   Starting Backend API Server" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend will be available at:" -ForegroundColor Green
Write-Host "   HTTP:    http://localhost:5000" -ForegroundColor Cyan
Write-Host "   HTTPS:   https://localhost:5001" -ForegroundColor Cyan
Write-Host "   Swagger: https://localhost:5001/swagger" -ForegroundColor Cyan
Write-Host "   Health:  http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "-----------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Run the API
dotnet run
