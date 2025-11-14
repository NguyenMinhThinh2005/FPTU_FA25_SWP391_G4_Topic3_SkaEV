# SkaEV Full-Stack Audit (2025-11-06)

## Data & API Coverage

- ✅ `src/store/stationStore.js` now relies solely on real slot data; no mock poles/ports are generated when the API lacks details.
- ✅ `src/pages/admin/AdvancedAnalytics.jsx` shows only real `/admin/AdminReports/*` data and surfaces backend errors instead of generating mock analytics.
- `src/pages/staff/Dashboard.jsx` is entirely mock-driven despite the presence of `staffAPI`, so staff have no synchronized operational view yet.
- `src/pages/admin/UserDetail.jsx` notes missing vehicle data API; customer context remains stubbed.
- `src/store/bookingStore.js` never pulls booking history from the backend, so customer analytics (`useMasterDataSync`) run on empty arrays unless local mock bookings exist.
- `src/pages/staff/Monitoring.jsx` loads issues from API but leaves connectors empty when slot data is absent, so the incident board lacks live connector context.

## Role-Specific Detail Views

- Admin station detail (`src/pages/admin/StationDetailAnalytics.jsx`) now reads real APIs but still shares the same dataset regardless of viewer role.
- Staff dashboards (`src/pages/staff/*.jsx`) do not consume the admin analytics service, so staff lack tailored KPIs and actionable controls.
- Customer dashboard/analytics pages rely on `useMasterDataSync`, yet upstream booking data is missing, leaving customer views without real history.
- Authorization logic in backend controllers (e.g., `AdminReportsController`) permits staff, but frontend routing does not conditionally render scoped components.

## Analytics & Reporting Gaps

- DB scripts (`database/create-sample-analytics-data.ps1`) are optional; without executing them, `IReportService` returns empty sets, forcing UI mock fallbacks.
- No per-station advanced diagrams exist yet; `reportsAPI.getStationDetailedAnalytics` endpoints are unused in the UI.
- Incident/issue reporting lacks seed data (`database/seed-station-staff-assignments.sql` adds managers, but no incidents), so reports start blank.
- Customer payment and vehicle analytics reference helpers (`formatCurrency`, `useMasterDataSync`) but lack the API wiring for invoices/payments tables.

## Station Control & Status Logic

- ✅ Auto-refresh toggles removed from `src/pages/admin/RealtimeMonitoringDashboard.jsx`; dashboard now refreshes only on explicit admin action.
- ✅ Restart actions removed from `src/pages/admin/StationDetailAnalytics.jsx`; admin UI no longer exposes remote restart or auto-restart toggles.
- Availability counts derive from generated slots even when `status === "inactive"`, so inactive stations can show available ports (logic bug to fix server-side or client transform).
- Manager assignment UI was added, but syncing updates to list views (`src/pages/admin/StationManagement.jsx`, `src/pages/admin/UserManagement.jsx`) still depends on store refresh behavior.
