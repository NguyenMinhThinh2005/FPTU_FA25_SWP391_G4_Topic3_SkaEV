Runbook — Apply migrations, seed DB, start backend & frontend, run smoke tests

Prerequisites

- .NET 7 SDK (matching the project's global.json)
- SQL Server instance (or adjust to SQLite for demo)
- PowerShell on Windows (commands below are for PowerShell)

1. Apply DB schema changes

- Option A: Use EF Core migrations (recommended if you have dotnet-ef tool installed)
  ```powershell
  cd SkaEV.API
  dotnet tool restore
  dotnet ef migrations add AddDeletedAt_ForPostsSlotsReviewsNotifications -o Migrations
  dotnet ef database update
  ```
- Option B: Run provided SQL scripts directly (works for SQL Server). From repo root:
  ```powershell
  sqlcmd -S <ServerName> -U <User> -P <Password> -i .\docs\sql\20251120_add_deleted_at_columns.sql
  ```

2. Seed minimal required data (idempotent)

```powershell
sqlcmd -S <ServerName> -U <User> -P <Password> -i .\docs\sql\20251120_seed_required_data.sql
```

3. Start the backend

- From repo root:

```powershell
cd SkaEV.API
dotnet run --project SkaEV.API.csproj
```

- Program.cs is configured to apply migrations automatically for some environments (check logs). If you used SQL directly, the DB schema will already be correct.

4. Start the frontend (Vite)

```powershell
cd src
npm install
npm run dev
```

5. Quick smoke tests (PowerShell)

- Check station GET

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/stations/1 -Method Get
```

- Try delete station (should return 200 OK for soft-delete or 409 Conflict if business rule)

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/stations/1 -Method Delete -ErrorAction SilentlyContinue
```

6. Run integration tests

- From repo root (or test project folder) run:

```powershell
cd SkaEV.API.Tests
dotnet test
```

Notes & next steps

- If your DB uses different schema names or ports, update scripts accordingly.
- Replace placeholder password hashes in seed SQL with properly hashed values if seeding real credentials.
- After running seeds, verify bookings exist and then test delete flows.
- If you want, I can scaffold full EF migration C# files instead of SQL. Reply "scaffold ef migrations".
