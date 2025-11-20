# Database Sync & Seed Workflow (Team-safe)

This document explains the safe workflow we use to keep demo/dev databases in-sync across the team.

Core principles

- Always create a full backup (.bak) before running any seed or migration that modifies data.
- Prefer idempotent seeds (MERGE / INSERT ... WHERE NOT EXISTS) so scripts can be re-run safely.
- Keep seeds small, focused and constraint-aware (match column types and CHECK constraints).

Quick commands (PowerShell on Windows)

- Create backup and run a seed (provided helper):

  ```powershell
  .\tools\run-seeds.ps1 -SeedFile '.\database\seed-insert-admin.sql' -SqlInstance 'ADMIN-PC\MSSQLSERVER01' -Database 'SkaEV_DB' -BackupDir 'C:\temp'
  ```

- Restore from a .bak snapshot (use with caution):
  ```powershell
  .\tools\restore-db.ps1 -SqlInstance 'ADMIN-PC\MSSQLSERVER01' -Database 'SkaEV_DB' -BackupFile 'C:\temp\SkaEV_DB_backup_20251109_215337.bak'
  ```

Smoke tests

- After seeding, run the smoke tests to verify the backend and key admin endpoints:
  ```powershell
  .\tools\run-smoke-tests.ps1 -ApiBaseUrl 'http://localhost:5000' -AdminEmail 'admin@skaev.com' -AdminPassword 'Admin@123'
  ```

Notes

- Seed files are stored under `database/` and should be idempotent. The `tools/run-seeds.ps1` wrapper creates a backup automatically.
- Add any large or destructive changes as a documented migration and communicate to the team before applying.
