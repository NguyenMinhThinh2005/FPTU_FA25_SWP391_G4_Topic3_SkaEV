# =====================================================
# Script: Run Backend API - SkaEV Project
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting SkaEV Backend API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Di chuyển tới thư mục SkaEV.API
$apiPath = Join-Path $PSScriptRoot "SkaEV.API"

if (-not (Test-Path $apiPath)) {
    Write-Host "ERROR: SkaEV.API folder not found!" -ForegroundColor Red
    exit 1
}

Set-Location $apiPath

Write-Host "Starting API server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend API will be available at:" -ForegroundColor Green
Write-Host "  HTTP:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "  HTTPS: https://localhost:5001" -ForegroundColor Cyan  
Write-Host "  Swagger: https://localhost:5001/swagger" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Chạy API
dotnet run
