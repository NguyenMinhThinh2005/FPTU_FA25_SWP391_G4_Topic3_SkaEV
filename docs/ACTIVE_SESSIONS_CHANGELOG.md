# ActiveSessions: Change Log

Date: 2025-11-11

Summary:

- Introduced `ActiveSessions` as a canonical, persisted metric on `charging_stations`.
- Definition: ActiveSessions = TotalSlots - AvailableSlots (aggregated from charging_posts -> charging_slots statuses).
- Backend: Calculation moved to a centralized helper `CapacityCalculator.CalculateCapacityMetrics` and persisted only when the computed value differs from stored value to reduce DB writes.
- Frontend: Admin Station Management dashboard now shows "Phiên sạc đang hoạt động" and displays persisted values; added tooltip and timestamp for clarity.
- DB: Migration added `ActiveSessions` column and existing stations were backfilled using an UPDATE query that summed total_slots and available_slots per station.

Notes:

- Consider a background worker or triggers if ActiveSessions must be strictly real-time and writes become heavy.
- Unit tests for capacity calculation were added under `SkaEV.API.Tests/CapacityCalculatorTests.cs`.
