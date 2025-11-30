# 🚨 CRITICAL BUG FIX: Staff Dashboard Không Hiển Thị Active Sessions

## ❌ Vấn đề
**Customer đã đặt và sạc xe**, nhưng **Staff Dashboard vẫn hiển thị connector là "Rảnh"** (Available).

## 🔍 Root Cause Analysis

### Vấn đề Database
Stored procedure `sp_start_charging` **THIẾU** dòng update quan trọng:

```sql
-- ❌ CODE CŨ (SAI):
UPDATE charging_slots
SET status = 'occupied'
WHERE slot_id = (SELECT slot_id FROM bookings WHERE booking_id = @booking_id);

-- Thiếu: current_booking_id = @booking_id
```

### Tại sao gây lỗi?

1. **Customer starts charging:**
   ```
   Customer clicks "Bắt đầu sạc"
   → API: PUT /api/bookings/{id}/start
   → Backend: BookingService.StartChargingAsync()
   → Database: EXEC sp_start_charging @booking_id
   → Updates:
      ✅ bookings.status = 'in_progress'
      ✅ bookings.actual_start_time = GETDATE()
      ✅ charging_slots.status = 'occupied'
      ❌ charging_slots.current_booking_id = NULL  ← VẤN ĐỀ!
   ```

2. **Staff Dashboard loads:**
   ```
   Staff opens Dashboard
   → API: GET /api/staff/dashboard
   → Backend: StaffDashboardService.GetDashboardAsync()
   → Query:
      SELECT slot_id, current_booking_id FROM charging_slots
      WHERE station_id = @staff_station_id
   
   → Code checks:
      if (slot.CurrentBookingId.HasValue) {
          // Get booking details
          var booking = await _context.Bookings
              .Where(b => b.BookingId == slot.CurrentBookingId)
              .FirstOrDefault();
      }
   
   → Result: current_booking_id = NULL
   → Staff sees NO active sessions! ❌
   ```

---

## ✅ Solution

### Step 1: Update Stored Procedure

**File:** `database/migrations/fix_sp_start_charging_add_current_booking_id.sql`

Run script này trong SQL Server Management Studio:

```sql
USE [SkaEV_DB]
GO

-- Drop and recreate sp_start_charging
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_start_charging')
BEGIN
    DROP PROCEDURE [dbo].[sp_start_charging];
END
GO

CREATE PROCEDURE [dbo].[sp_start_charging]
    @booking_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update booking
        UPDATE bookings
        SET status = 'in_progress',
            actual_start_time = GETDATE()
        WHERE booking_id = @booking_id;
        
        -- Update slot WITH current_booking_id ← FIX!
        UPDATE charging_slots
        SET status = 'occupied',
            current_booking_id = @booking_id,  -- ✅ THÊM DÒNG NÀY
            updated_at = GETDATE()
        WHERE slot_id = (SELECT slot_id FROM bookings WHERE booking_id = @booking_id);
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
```

### Step 2: Fix Existing Data

**File:** `database/migrations/fix_existing_active_bookings.sql`

Nếu đã có bookings đang active (status='in_progress') nhưng chưa có `current_booking_id`:

```sql
USE [SkaEV_DB]
GO

-- Fix existing active bookings
UPDATE cs
SET cs.current_booking_id = b.booking_id,
    cs.status = 'occupied',
    cs.updated_at = GETDATE()
FROM charging_slots cs
INNER JOIN bookings b ON cs.slot_id = b.slot_id
WHERE b.status = 'in_progress'
  AND cs.current_booking_id IS NULL;
GO

-- Verify
SELECT 
    b.booking_id,
    u.full_name AS customer,
    cs.current_booking_id,
    cs.status AS slot_status,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector
FROM bookings b
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
INNER JOIN users u ON b.user_id = u.user_id
WHERE b.status = 'in_progress';
GO
```

---

## 📋 Testing Instructions

### 1. Apply Database Fixes

Mở SQL Server Management Studio:

```powershell
# Connect to database
Server: localhost (or your server)
Database: SkaEV_DB
Authentication: SQL Server Authentication
```

Chạy 2 scripts theo thứ tự:
1. ✅ `fix_sp_start_charging_add_current_booking_id.sql`
2. ✅ `fix_existing_active_bookings.sql`

### 2. Verify Database

```sql
-- Check stored procedure updated
SELECT modify_date 
FROM sys.procedures 
WHERE name = 'sp_start_charging';
-- Should show today's date

-- Check active bookings have current_booking_id
SELECT 
    cs.slot_id,
    cs.current_booking_id,
    cs.status,
    b.booking_id,
    b.status AS booking_status
FROM charging_slots cs
LEFT JOIN bookings b ON cs.current_booking_id = b.booking_id
WHERE cs.current_booking_id IS NOT NULL;
```

### 3. Test Customer → Staff Flow

#### A. Customer Side:
1. Login as customer: `giohoang@gmail.com` / `Password@123`
2. Đặt chỗ sạc tại trạm
3. Bắt đầu sạc
4. **Verify in database:**
   ```sql
   SELECT booking_id, status, actual_start_time 
   FROM bookings 
   WHERE user_id = (SELECT user_id FROM users WHERE email = 'giohoang@gmail.com')
   ORDER BY booking_id DESC;
   
   SELECT slot_id, current_booking_id, status 
   FROM charging_slots 
   WHERE current_booking_id IS NOT NULL;
   ```

#### B. Staff Side:
1. Login as staff: `thanhdatnguyen@gmail.com` / `Password@123`
2. Go to Dashboard
3. **Expected result:**
   - Connector should show status **"Đang sạc"** (Charging)
   - Customer name should be visible
   - Energy consumed should update
   - Active sessions count > 0

4. Go to "Quản lý Phiên sạc"
5. **Expected result:**
   - See active session with booking details
   - Customer name, vehicle info shown
   - Energy delivered displayed

6. Go to "Theo dõi & Báo cáo"
7. **Expected result:**
   - Connector status = "Đang hoạt động"
   - Technical status = "Online"

---

## 🔄 Data Flow After Fix

```
┌──────────────────────────────────────────────────────────┐
│                     CUSTOMER SIDE                         │
├──────────────────────────────────────────────────────────┤
│ 1. Creates booking                                        │
│    INSERT INTO bookings (...) VALUES (...)               │
│                                                           │
│ 2. Clicks "Bắt đầu sạc"                                  │
│    EXEC sp_start_charging @booking_id = 123              │
│                                                           │
│    ✅ UPDATE bookings                                     │
│       SET status = 'in_progress',                        │
│           actual_start_time = GETDATE()                  │
│                                                           │
│    ✅ UPDATE charging_slots                               │
│       SET status = 'occupied',                           │
│           current_booking_id = 123  ← FIX!               │
│                                                           │
│ 3. SOC tracking updates                                  │
│    INSERT INTO soc_trackings (...)                       │
└──────────────────────────────────────────────────────────┘
                           ↓
                   DATABASE UPDATED
                           ↓
┌──────────────────────────────────────────────────────────┐
│                      STAFF SIDE                           │
├──────────────────────────────────────────────────────────┤
│ GET /api/staff/dashboard                                 │
│                                                           │
│ StaffDashboardService.GetDashboardAsync():               │
│                                                           │
│ 1. Load slots:                                           │
│    SELECT * FROM charging_slots                          │
│    WHERE station_id = @staff_station                     │
│    → slot.current_booking_id = 123 ✅                     │
│                                                           │
│ 2. Load active bookings:                                 │
│    SELECT * FROM bookings                                │
│    WHERE booking_id IN (123)                             │
│    → Returns booking with customer info ✅                │
│                                                           │
│ 3. Load SOC tracking:                                    │
│    SELECT * FROM soc_trackings                           │
│    WHERE booking_id = 123                                │
│    → Returns energy, voltage, current ✅                  │
│                                                           │
│ 4. Build response:                                       │
│    {                                                      │
│      connectors: [{                                      │
│        slotId: 4,                                        │
│        connectorCode: "POST-01-A1",                      │
│        status: "occupied",                               │
│        activeSession: {                  ← NOW SHOWS!    │
│          bookingId: 123,                                 │
│          customerName: "Gio Hoàng",                      │
│          energyDelivered: 5.2,                           │
│          currentSoc: 25                                  │
│        }                                                  │
│      }]                                                   │
│    }                                                      │
└──────────────────────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### Why This Happened
- Stored procedures were created early in development
- `current_booking_id` column was added later for reporting
- Stored procedure was not updated to populate this field
- Frontend relies on this field for displaying active sessions

### Impact
- **Before fix:** Staff cannot see any active charging sessions
- **After fix:** Full synchronization between Customer and Staff
- All 3 staff pages will now show real-time data:
  - ✅ Dashboard
  - ✅ Quản lý Phiên sạc
  - ✅ Theo dõi & Báo cáo Sự cố

### Prevention
- Always update stored procedures when schema changes
- Add database constraints/triggers to enforce data integrity
- Add integration tests for Customer→Staff data flow

---

## 📊 Verification Queries

### Check Active Sessions
```sql
SELECT 
    b.booking_id,
    u.full_name AS customer,
    v.license_plate AS vehicle,
    b.status AS booking_status,
    b.actual_start_time,
    cs.slot_id,
    cs.current_booking_id,
    cs.status AS slot_status,
    cp.post_number,
    cs.slot_number,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector_code,
    DATEDIFF(MINUTE, b.actual_start_time, GETDATE()) AS charging_duration_minutes
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN vehicles v ON b.vehicle_id = v.vehicle_id
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
WHERE b.status = 'in_progress'
  AND cs.current_booking_id = b.booking_id;
```

### Check Latest SOC Data
```sql
SELECT TOP 1
    st.booking_id,
    st.current_soc,
    st.voltage,
    st.current,
    st.power,
    st.energy_delivered,
    st.temperature,
    st.timestamp
FROM soc_tracking st
WHERE st.booking_id = (
    SELECT TOP 1 booking_id 
    FROM bookings 
    WHERE status = 'in_progress' 
    ORDER BY booking_id DESC
)
ORDER BY st.timestamp DESC;
```

---

## 🎯 Commits
- **fa1fe63** - CRITICAL FIX: Staff Dashboard not showing active customer sessions
- **8d225d7** - Refactor: Integrate real Payment/Invoice APIs
- **62483a2** - docs: Add comprehensive Staff API integration verification report

---

**Status:** ✅ FIXED  
**Severity:** CRITICAL  
**Affected:** Staff Dashboard, ChargingSessions, Monitoring  
**Fixed Date:** 2025-11-12  
**Developer:** AI Assistant
