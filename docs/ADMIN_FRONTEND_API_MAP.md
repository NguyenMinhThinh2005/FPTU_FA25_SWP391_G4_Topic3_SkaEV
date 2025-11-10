# Admin Frontend → Backend API Map

This file lists the main admin frontend pages and the backend endpoints they call. Use this as a reference for audits, seeds and tests.

- `src/pages/admin/Dashboard.jsx`

  - GET /api/stations (stationsAPI.getAll)
  - GET /api/admin/stations/analytics (adminAPI.getStationAnalytics) — admin analytics

- `src/pages/admin/StationManagement.jsx`

  - GET /api/admin/stations (stationStore.fetchAdminStations)
  - GET /api/admin/adminusers (adminAPI.getAllUsers) — staff/users for assignment
  - POST/PUT/DELETE /api/stations (stationsAPI.create/update/delete)

- `src/pages/admin/StationDetailAnalytics.jsx`

  - GET /api/admin/AdminReports/stations/{stationId}/detailed-analytics (reportsAPI)
  - GET /api/stations/{id}/slots (stationsAPI.getStationSlots)

- `src/pages/admin/AdvancedAnalytics.jsx`

  - reportsAPI.getRevenueReports
  - reportsAPI.getUsageReports
  - reportsAPI.getStationPerformance
  - reportsAPI.getPeakHours

- `src/components/admin/IncidentManagement.jsx`
  - GET /api/incidents (incidentStore.fetchIncidents)
  - GET /api/incidents/{id} (incidentStore.fetchIncidentById)
  - POST /api/incidents (incidentStore.createIncident)
  - PATCH/PUT /api/incidents/{id} (incidentStore.updateIncident)

Notes:

- The shared axios instance lives at `src/services/api.js`. Many service helpers return `axiosInstance` results directly.
- Use `tools/run-smoke-tests.ps1` as a basic verification script after seeding and starting the backend.
