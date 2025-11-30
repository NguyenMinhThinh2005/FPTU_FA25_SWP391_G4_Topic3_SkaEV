**Summary of Admin-area Fixes and Verification**

- **What I changed**: centralized password hashing (BCrypt) and removed plaintext password writes; added audit logging for admin password resets; normalized controller role checks; created a safe seed script and password-hash tool; updated `start-backend.ps1` to auto-detect the SQL Server instance from connection strings instead of assuming `SQLEXPRESS`.
- **DB updates performed**: updated the `users.password_hash` for `admin@skaev.com` to a BCrypt hash so the account can log in with password `Admin@123` for smoke testing. The update was applied safely using `sqlcmd -i tools\update_admin_hash.sql` to avoid PowerShell `$` expansion.
- **Verification steps executed**:
  - Ensured SQL service `MSSQL$MSSQLSERVER01` was running on the machine.
  - Started the backend with `.	est-start-backend.ps1` (via updated `start-backend.ps1`) so it listens on `http://localhost:5000`.
  - Successfully logged in as `admin@skaev.com` and obtained a JWT.
  - Ran `tools\run-smoke-tests.ps1` against `http://localhost:5000` — all smoke tests passed.
- **Files added/modified**:
  - Modified: `start-backend.ps1` (instance detection), various server code changes committed earlier (password hashing, audit logs, authorization fixes).
  - Added: `tools\update_admin_hash.sql`, `SkaEV.API\Tools\PasswordHashTool` (helper), `SkaEV.API\Tools\seed_admin_and_demo.sql`.
  - Added report: `docs\ADMIN_FIX_REPORT.md` (this file).
- **How to re-run locally**:

  1. Ensure SQL Server instance from `SkaEV.API\appsettings.Development.json` (or `appsettings.template.json`) is running.
  2. Run `powershell -NoProfile -ExecutionPolicy Bypass .\start-backend.ps1` to start the API in a new window.
  3. Run `powershell -NoProfile -ExecutionPolicy Bypass .\tools\run-smoke-tests.ps1 -ApiBaseUrl 'http://localhost:5000'` to validate admin flows.

- **Next recommended steps**:
  - Run the full test suite (`SkaEV.API.Tests`) and iterate on any failing tests.
  - Review frontend expected response shapes and add small compatibility adapters if needed.
  - Commit and push these changes, and rotate the admin password after verification.

If you want, I can now: (A) commit and open a PR with the changes, (B) run the full test suite, or (C) continue to add integration tests for admin endpoints. Which would you like next?
