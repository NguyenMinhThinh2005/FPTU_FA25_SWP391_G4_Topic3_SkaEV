Quick runbook: local SQL Server container + minimal seed for SkaEV API

This file explains how to run a local SQL Server container, seed it with a minimal dataset
suitable for testing the admin analytics pages, and start the backend and frontend.

1. Start SQL Server container (PowerShell, run as Administrator)

```powershell
# Use a strong SA password and keep it secure. Use the same password in appsettings.Development.json
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 --name skaev-sql -d mcr.microsoft.com/mssql/server:2022-latest

# Optional: wait for readiness
docker logs -f skaev-sql
```

2. Seed the database with the provided minimal SQL script

Option A (recommended): run the helper script that copies the seed SQL into the container and runs it

```powershell
# From repository root
.\SWP391_scripts\load_seed_to_container.ps1 -ContainerName 'skaev-sql' -SqlFile 'SkaEV.API/Tools/seed_minimal.sql' -SaPassword 'YourStrong!Passw0rd'
```

Option B: if the backend is running in Development, call the API seed endpoint

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/admin/AdminReports/seed-demo" -UseBasicParsing
```

3. Start the backend

```powershell
# Stop existing dotnet processes if necessary
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force

# Start backend (this start script will skip the Windows MSSQL service check if appsettings points to localhost)
.\start-backend.ps1
```

or run directly:

```powershell
dotnet run --project ".\SkaEV.API\SkaEV.API.csproj" --urls "http://localhost:5000"
```

4. Verify endpoints (examples)

```powershell
$start = (Get-Date).AddDays(-30).ToString("o")
$end   = (Get-Date).ToString("o")

# Revenue by connector
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/admin/AdminReports/revenue-by-connector?startDate=$([uri]::EscapeDataString($start))&endDate=$([uri]::EscapeDataString($end))" -UseBasicParsing | ConvertTo-Json -Depth 5

# Station time-series
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/admin/AdminReports/stations/1/time-series?granularity=daily&startDate=$([uri]::EscapeDataString($start))&endDate=$([uri]::EscapeDataString($end))" -UseBasicParsing | ConvertTo-Json -Depth 5

# Station detailed analytics
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/admin/AdminReports/stations/1/detailed-analytics?startDate=$([uri]::EscapeDataString($start))&endDate=$([uri]::EscapeDataString($end))" -UseBasicParsing | ConvertTo-Json -Depth 5
```

5. Start frontend & test UI

```powershell
cd .\src
npm install
npm run dev
```

Open the admin analytics page, select the desired date range (Từ/Đến) and mode (Ngày/Tháng/Năm),
click Áp dụng and validate the charts and tables reflect the returned API data.

6. Cleanup

```powershell
# Stop and remove container
docker stop skaev-sql
docker rm skaev-sql
```

Notes

- The seed SQL is intentionally minimal and creates only the tables required for revenue-by-connector,
  station time-series and basic analytics. For full production data, restore the real DB backup.
- The controller `GetRevenueByConnector` now requires authentication. During development, make sure
  to authenticate via JWT or adjust your `axiosConfig` (not recommended for production).
- The `start-backend.ps1` script will skip the Windows SQL service check when `appsettings.Development.json`
  contains a localhost/container-style connection string.
