PR: feature/admin-real-data — Admin area wired to real DB

This PR moves the Admin/Staff/Customer detail pages to use real backend data instead of local mock data and adds tooling to seed the DB and run smoke tests locally.

Checklist for reviewers

- [ ] Confirm `src/pages/admin/Dashboard.jsx`, `src/pages/admin/UserDetail.jsx`, `src/pages/staff/StationManagement.jsx`, and station analytics pages use `src/store/*` or `src/services/*` and do not initialize UI with mock arrays.
- [ ] Run linter locally: `npm run lint` — expect no errors.
- [ ] Create a backup of the target DB before running seeds (tools/backup-db.ps1).
- [ ] Apply idempotent seeds shown in `database/` (e.g., `database/seed-insert-admin.sql`) via `tools/run-seeds.ps1`.
- [ ] Register a smoke admin (optional): `tools/register-smoke-user.ps1`.
- [ ] Run smoke-tests: `npm run smoke:admin` (this will login and hit several admin endpoints). Ensure the running backend's `appsettings.Development.json` DefaultConnection points to the intended SQL Server instance.

Notes for CI

- Do NOT run seeds in shared or production DBs automatically. CI should either run against a disposable test DB or the job should require explicit permission and credentials.
- Recommended CI steps (manual/opt-in):
  1. Create test DB from backup.
  2. Apply seeds.
  3. Start backend.
  4. Run `npm ci` and `npm run smoke:admin`.

Files changed in this branch (summary)

- Frontend: Wired admin/staff pages to `stationStore` + `authStore`, removed mock initializers from active pages.
- Tools: `tools/*.ps1` (backup, seed, smoke-tests, register/login helpers).
- Docs: this file and `docs/ADMIN_FRONTEND_API_MAP.md` (if present).

If you want, I can prepare a GitHub Actions workflow that runs lint + unit tests and a separate optional workflow to run smoke-tests against a configured test DB (requires secrets).
