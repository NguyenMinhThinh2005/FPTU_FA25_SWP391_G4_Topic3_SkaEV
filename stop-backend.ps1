# =====================================================
# Script: Stop Backend API - SkaEV Project
# =====================================================

Write-Host "========================================" -ForegroundColor Red
Write-Host "  Stopping SkaEV Backend API" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Method 1: Stop processes using port 5001
Write-Host "1. Checking processes on port 5001..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 5001,5000 -State Listen -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections.OwningProcess | Select-Object -Unique
    foreach ($pid in $pids) {
        Write-Host "   Stopping process PID: $pid" -ForegroundColor Cyan
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "   ? Process $pid stopped" -ForegroundColor Green
    }
} else {
    Write-Host "   No processes found on ports 5000/5001" -ForegroundColor Gray
}

Write-Host ""

# Method 2: Stop all dotnet processes in SkaEV.API directory
Write-Host "2. Stopping dotnet processes..." -ForegroundColor Yellow
$dotnetProcesses = Get-Process -Name dotnet -ErrorAction SilentlyContinue

if ($dotnetProcesses) {
    foreach ($proc in $dotnetProcesses) {
        try {
            # Only stop if it's related to SkaEV.API
            if ($proc.Path -like "*SkaEV.API*" -or $proc.MainWindowTitle -like "*SkaEV*") {
                Write-Host "   Stopping dotnet process: PID $($proc.Id)" -ForegroundColor Cyan
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Host "   ? Process $($proc.Id) stopped" -ForegroundColor Green
            }
        } catch {
            # Ignore errors for processes we can't access
        }
    }
    
    # If no SkaEV-specific process found, stop all dotnet
    if (-not ($dotnetProcesses | Where-Object { $_.Path -like "*SkaEV.API*" })) {
        Write-Host "   Stopping all dotnet processes..." -ForegroundColor Yellow
        Stop-Process -Name dotnet -Force -ErrorAction SilentlyContinue
        Write-Host "   ? All dotnet processes stopped" -ForegroundColor Green
    }
} else {
    Write-Host "   No dotnet processes found" -ForegroundColor Gray
}

Write-Host ""

# Wait a moment for processes to fully stop
Start-Sleep -Seconds 2

# Verify backend is stopped
Write-Host "3. Verifying backend stopped..." -ForegroundColor Yellow
$stillRunning = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue

if ($stillRunning) {
    Write-Host "   ? Backend still running on port 5001!" -ForegroundColor Red
    Write-Host "   Please manually close any terminal windows running backend" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Or press Ctrl+C in the backend terminal window" -ForegroundColor Yellow
} else {
    Write-Host "   ? Backend stopped successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Backend API Stopped" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}

Write-Host ""
Write-Host "You can start backend again with:" -ForegroundColor Cyan
Write-Host "  .\run-backend.ps1" -ForegroundColor White
Write-Host ""
