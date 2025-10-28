#!/usr/bin/env pwsh
# Seed sample charging stations to the database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Seeding Sample Stations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database connection string from appsettings
$Server = "TDAT\SQLEXPRESS"
$Database = "SkaEV_DB"

Write-Host "Connecting to database..." -ForegroundColor Yellow
Write-Host "  Server: $Server" -ForegroundColor Gray
Write-Host "  Database: $Database" -ForegroundColor Gray
Write-Host ""

# Run the seed script
$ScriptPath = Join-Path $PSScriptRoot "database\seed-stations.sql"

if (Test-Path $ScriptPath) {
    Write-Host "Running seed script: $ScriptPath" -ForegroundColor Yellow
    
    try {
        sqlcmd -S $Server -d $Database -i $ScriptPath -E
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  ✓ Sample stations seeded successfully!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Error seeding stations" -ForegroundColor Red
            Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
        }
    } catch {
        Write-Host ""
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Script file not found: $ScriptPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
