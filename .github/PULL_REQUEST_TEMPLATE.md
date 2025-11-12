## What this PR does

- Wires Admin/Staff/Customer pages to use real backend data.
- Adds DB seeding and smoke-test helpers for local verification.

## Checklist for reviewers

- [ ] Lint passes (`npm run lint`)
- [ ] Manual smoke-tests: run `tools/run-smoke-tests.ps1` or `npm run smoke:admin` locally against a dev DB.
- [ ] Confirm no active page initializes UI with local mock data.

## How to run seeds & smoke-tests locally

1. Backup DB: `.	ools\backup-db.ps1 -DatabaseName SkaEV_DB -BackupFolder C:\temp`
2. Run seed: `.	ools\run-seeds.ps1 .\database\seed-insert-admin.sql`
3. (Optional) Register smoke user: `.	ools\register-smoke-user.ps1`
4. Run smoke-tests: `npm run smoke:admin`

## Notes

- CI should NOT run seeds against shared databases without explicit approval.
- If CI smoke-tests are desired, add a separate workflow and configure DB credentials via secrets.

<!-- Add any follow-up tasks here -->
