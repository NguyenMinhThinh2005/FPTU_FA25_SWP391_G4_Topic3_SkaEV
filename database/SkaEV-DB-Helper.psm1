# SkaEV Database Helper Script
# Always use the correct SQL Server instance: ADMIN-PC\MSSQLSERVER01

$ServerInstance = "ADMIN-PC\MSSQLSERVER01"
$Database = "SkaEV_DB"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SkaEV Database Helper" -ForegroundColor Cyan
Write-Host "Server: $ServerInstance" -ForegroundColor Yellow
Write-Host "Database: $Database" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Invoke-SkaEVQuery {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Query
    )
    
    sqlcmd -S $ServerInstance -d $Database -E -Q $Query
}

function Invoke-SkaEVScript {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ScriptPath
    )
    
    sqlcmd -S $ServerInstance -d $Database -E -i $ScriptPath
}

# Export functions
Export-ModuleMember -Function Invoke-SkaEVQuery, Invoke-SkaEVScript

Write-Host "Available commands:" -ForegroundColor Green
Write-Host "  Invoke-SkaEVQuery -Query 'SELECT * FROM charging_stations'" -ForegroundColor White
Write-Host "  Invoke-SkaEVScript -ScriptPath 'database\script.sql'" -ForegroundColor White
Write-Host ""
Write-Host "Quick alias setup:" -ForegroundColor Green
Write-Host "  Set-Alias sq Invoke-SkaEVQuery" -ForegroundColor White
Write-Host "  Set-Alias ss Invoke-SkaEVScript" -ForegroundColor White
