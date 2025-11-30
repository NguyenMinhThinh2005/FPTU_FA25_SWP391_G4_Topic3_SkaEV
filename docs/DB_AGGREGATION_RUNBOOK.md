## DB Aggregation Runbook

Purpose

- Provide automated steps to import a sanitized production dump, create pre-aggregated analytics tables, and verify data for the Admin frontend.

Prerequisites

- Local SQL Server instance with sufficient disk and permissions.
- `sqlcmd` available in PATH.
- A sanitized `.bak` or SQL export file provided by the data owner.

Steps

1. Place the sanitized backup file on your machine, e.g. `C:\dumps\skaev_sanitized.bak`.
2. From repository root, run PowerShell:

```powershell
cd SkaEV.API\database
.\import_and_aggregate.ps1 -BackupPath "C:\dumps\skaev_sanitized.bak" -InstanceName ".\MSSQLSERVER01" -DatabaseName "SkaEV_DB_Local"
```

3. The script restores the DB (if BackupPath provided), then executes `001_create_daily_station_metrics.sql` to build `daily_station_metrics`.
4. Start backend:

```powershell
./run-backend.ps1
```

5. Start frontend:

```powershell
./run-frontend.ps1
```

6. Verify via smoke tests or the helper `verify-admin-data.ps1` included in the repo.

Notes & Safety

- Do NOT run against production. Use a local SQL Server instance and a sanitized dump.
- If your SQL Server paths differ, edit `import_and_aggregate.ps1` to match your instance's data directory.

Troubleshooting

- If `sqlcmd` fails, install SQL Server Command-Line Tools or run the SQL in SSMS.
- If aggregation script errors because of missing columns/tables, ensure the DB restore used the correct schema version (migrations applied).
