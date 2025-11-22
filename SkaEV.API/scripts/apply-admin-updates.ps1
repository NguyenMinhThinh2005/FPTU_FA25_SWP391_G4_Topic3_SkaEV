<#
.DESCRIPTION
    Safe script to apply admin DB updates: backup -> apply schema updates -> apply admin seeds.

.USAGE
    Dry-run (shows actions):
        .\apply-admin-updates.ps1

    Execute (perform backup and apply scripts):
        .\apply-admin-updates.ps1 -Execute

    Use EF Core migration instead of SQL scripts (optional):
        .\apply-admin-updates.ps1 -Execute -UseEf

.NOTES
    - Requires `sqlcmd` in PATH to run SQL scripts and create backups.
    - Run from the `SkaEV.API\scripts` directory or provide correct relative paths.
    - The script is idempotent for the provided SQL scripts; nevertheless, BACKUP is recommended.
#>

param(
    [switch]$Execute,
    [switch]$UseEf
)

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path "$scriptRoot\.." | Select-Object -ExpandProperty Path

$appSettingsPath = Join-Path $repoRoot 'appsettings.json'

Write-Info "Script root: $scriptRoot"
Write-Info "Repo root: $repoRoot"

if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    Write-Warn "Could not find 'sqlcmd' in PATH. Please install 'SQL Server Command Line Utilities' or ensure 'sqlcmd' is available.";
}

# Default connection values (kept as examples). The script will read the connection string from SkaEV.API\appsettings.json if present.
$defaultServer = 'ADMIN-PC\\MSSQLSERVER01'
$defaultDb = 'SkaEV_DB'

# Try to read connection string from appsettings.json in SkaEV.API if available
try {
    $appSettingsFullPath = Join-Path $repoRoot 'appsettings.json'
    if (Test-Path $appSettingsFullPath) {
        $json = Get-Content $appSettingsFullPath -Raw | ConvertFrom-Json
        if ($json.ConnectionStrings -and $json.ConnectionStrings.DefaultConnection) {
            $conn = $json.ConnectionStrings.DefaultConnection
            # crude parse: Server=...;Database=...;
            if ($conn -match 'Server=([^;]+);') { $defaultServer = $Matches[1] }
            if ($conn -match 'Database=([^;]+);') { $defaultDb = $Matches[1] }
        }
    }
} catch {
    Write-Warn "Failed parsing appsettings.json: $_"
}

$server = $defaultServer
$database = $defaultDb

$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$backupDir = "C:\temp\skaev_db_backups"
$backupFile = Join-Path $backupDir ("SkaEV_DB_backup_$timestamp.bak")

$updateScript = Join-Path $repoRoot 'database\update_schema.sql'
$viewsScript = Join-Path $repoRoot 'database\fix_admin_views.sql'
$seedScript = Join-Path $repoRoot 'seed-admin-dashboard-data.sql'

Write-Info "Target SQL Server: $server"
Write-Info "Target Database: $database"

if (-not $Execute) {
    Write-Host "Dry run: the script will perform the following actions if run with -Execute:`n" -ForegroundColor Green
    Write-Host " 1) Ensure backup directory '$backupDir' exists and create a backup to: $backupFile" -ForegroundColor Green
    Write-Host " 2) Run SQL script: $updateScript" -ForegroundColor Green
    Write-Host " 3) Run SQL script: $viewsScript (if present)" -ForegroundColor Green
    Write-Host " 4) Run SQL script: $seedScript" -ForegroundColor Green
    Write-Host " 4) (Optional) Run 'dotnet ef database update' if -UseEf is supplied and dotnet-ef is installed." -ForegroundColor Green
    Write-Host "`nTo actually execute, rerun with the -Execute switch." -ForegroundColor Green
    return
}

if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    Write-Err "'sqlcmd' not found. Aborting. Install sqlcmd or run the SQL scripts manually via SSMS." ; exit 1
}

if (-not (Test-Path $backupDir)) { New-Item -Path $backupDir -ItemType Directory -Force | Out-Null }

Write-Info "Creating backup..."
$backupSql = "BACKUP DATABASE [$database] TO DISK = N'$backupFile' WITH INIT, STATS = 10"
$secureServer = $server -replace '\\','\\\\'
try {
    sqlcmd -S $server -E -Q $backupSql
    Write-Info "Backup created: $backupFile"
} catch {
    Write-Err "Backup failed: $_"; exit 1
}

if (-not (Test-Path $updateScript)) {
    Write-Err "Schema update script not found at: $updateScript"; exit 1
}

if (-not (Test-Path $seedScript)) {
    Write-Warn "Seed script not found at: $seedScript. Skipping seeding step.";
}

Write-Info "Applying schema updates from: $updateScript"
try {
    sqlcmd -S $server -E -d $database -i $updateScript
    Write-Info "Schema update applied successfully."
} catch {
    Write-Err "Failed applying schema updates: $_"; exit 1
}

if (Test-Path $viewsScript) {
    Write-Info "Applying view fixes from: $viewsScript"
    try {
        sqlcmd -S $server -E -d $database -i $viewsScript
        Write-Info "View fixes applied successfully."
    } catch {
        Write-Err "Failed applying view fixes: $_"; exit 1
    }
} else {
    Write-Warn "Views script not found at: $viewsScript. Skipping view-fix step."
}

if (Test-Path $seedScript) {
    Write-Info "Applying admin seed data from: $seedScript"
    try {
        sqlcmd -S $server -E -d $database -i $seedScript
        Write-Info "Seed data applied successfully."
    } catch {
        Write-Err "Failed applying seed data: $_"; exit 1
    }
}

if ($UseEf) {
    if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
        Write-Warn "dotnet not found, cannot run EF migrations. Skipping.";
    } else {
        if (-not (Get-Command dotnet-ef -ErrorAction SilentlyContinue)) {
            Write-Warn "dotnet-ef not installed globally. You can install with: dotnet tool install --global dotnet-ef";
        } else {
            Write-Info "Running 'dotnet ef database update' as additional safety step"
            Push-Location $repoRoot
            try {
                dotnet ef database update --project .\SkaEV.API\SkaEV.API.csproj --startup-project .\SkaEV.API\SkaEV.API.csproj
                Write-Info "EF migrations applied."
            } catch {
                Write-Warn "dotnet ef failed: $_"
            } finally { Pop-Location }
        }
    }
}

Write-Info "All done. Start your API and verify admin pages are working against the '$database' database on server '$server'."
