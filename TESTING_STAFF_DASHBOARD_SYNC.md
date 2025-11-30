# 🧪 Testing Staff Dashboard Sync Fix

## ✅ Database Fix Status

**Date Applied:** November 12, 2025, 19:56:19  
**Fix Applied:** Updated `sp_start_charging` stored procedure  
**Critical Change:** Added `current_booking_id = @booking_id` to `charging_slots` table  

---

## 📋 Test Verification Completed

### Database Test Results (Automated)
```
✅ Booking #20 created successfully
✅ sp_start_charging executed without errors
✅ Booking status changed: scheduled → in_progress
✅ Slot status changed: available → occupied
✅ Slot->Booking Link: SET (current_booking_id = 20)
✅ Fix Status: FIXED! Slot linked to booking
✅ Staff Query: Staff will see active session
```

---

## 🚀 Manual Testing Steps (IMPORTANT!)

### Prerequisites
1. ✅ Database fix applied (sp_start_charging updated)
2. ⚠️ **Backend API MUST be restarted** to use new stored procedure
3. ⚠️ Customer must actually **START CHARGING**, not just create booking

### Step 1: Restart Backend API

**CRITICAL:** The backend application caches stored procedures. You MUST restart it!

```powershell
# Navigate to backend folder
cd SkaEV.API

# Stop the running API (Ctrl+C if running in terminal)
# Then restart:
dotnet run
```

### Step 2: Customer Side - Create & Start Charging

1. **Login as Customer:**
   - Email: `customer@skaev.com`
   - Password: [your customer password]

2. **Create Booking:**
   - Go to "Book Charging" page
   - Select a station (e.g., VinFast Green Charging - Vinhomes Central Park)
   - Select connector: `POST-01-A1` or `POST-01-A2` or `POST-01-A3`
   - Fill in vehicle details
   - Click "Book Now"

3. **START CHARGING (CRITICAL STEP!):**
   - After booking created → Go to "My Bookings"
   - Find your booking (status should be "Scheduled" or "Confirmed")
   - Click **"Start Charging"** button ← THIS IS THE KEY ACTION!
   - This action calls `sp_start_charging` stored procedure
   - Booking status should change to "In Progress"

### Step 3: Staff Side - Verify Dashboard Shows Data

1. **Login as Staff:**
   - Email: `staff@skaev.com`
   - Password: [your staff password]

2. **Check Dashboard:**
   - Open Developer Console (F12)
   - Look for this log:
     ```javascript
     📊 Dashboard API Response: {
       activeSessions: 1,  // ← Should be 1 or more!
       connectors: [...],
       dailyStats: {...}
     }
     ```
   - **Expected Results:**
     - Active Sessions: `1` (was 0 before fix)
     - Connector Status: `occupied` (was available)
     - hasActiveSession: `true` (was false)

3. **Check Charging Sessions Page:**
   - Navigate to "Charging Sessions"
   - Should see your active session:
     - Customer name
     - Connector code (POST-01-A1)
     - Status: "In Progress"
     - Start time
     - Current duration

4. **Check Monitoring Page:**
   - Navigate to "Monitoring"
   - Connector should show as "Occupied"
   - Should display current session data

---

## 🔍 Troubleshooting

### Issue: Staff Dashboard still shows 0 active sessions

**Check 1: Did customer actually START charging?**
```sql
-- Run this query to check:
SELECT b.booking_id, b.status, b.actual_start_time,
       cs.current_booking_id,
       CASE 
           WHEN b.status = 'scheduled' OR b.status = 'confirmed' THEN '⚠️ Booking created but NOT STARTED yet'
           WHEN b.status = 'in_progress' AND cs.current_booking_id IS NULL THEN '❌ Backend using OLD procedure - RESTART API!'
           WHEN b.status = 'in_progress' AND cs.current_booking_id IS NOT NULL THEN '✅ Fix working correctly'
           ELSE 'Unknown state'
       END AS diagnosis
FROM bookings b
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
WHERE b.booking_id = [YOUR_BOOKING_ID];
```

**Check 2: Was backend API restarted?**
- If `actual_start_time` is NOT NULL but `current_booking_id` IS NULL
- → Backend is using OLD stored procedure
- → **MUST RESTART BACKEND API**

**Check 3: Verify stored procedure is updated:**
```sql
SELECT 
    OBJECT_NAME(object_id) AS ProcedureName,
    modify_date AS LastModified,
    CASE 
        WHEN modify_date >= '2025-11-12 19:55:00' THEN '✅ Recently Updated'
        ELSE '❌ Old Version - Run migration again!'
    END AS Status
FROM sys.procedures
WHERE name = 'sp_start_charging';
```

---

## 📊 Database Verification Queries

### Query 1: Check Active Sessions (What Staff Dashboard Sees)
```sql
SELECT 
    cs.slot_id,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector_code,
    cs.status AS slot_status,
    cs.current_booking_id,
    b.booking_id,
    u.full_name AS customer_name,
    b.status AS booking_status,
    FORMAT(b.actual_start_time, 'yyyy-MM-dd HH:mm:ss') AS started_at,
    CASE 
        WHEN cs.current_booking_id IS NOT NULL THEN '✅ Staff will see this session'
        ELSE '⚠️ Staff will NOT see this'
    END AS staff_visibility
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
LEFT JOIN bookings b ON cs.current_booking_id = b.booking_id
LEFT JOIN users u ON b.user_id = u.user_id
WHERE cs.station_id = 1  -- Your station ID
ORDER BY cs.slot_id;
```

### Query 2: Check Recent Bookings
```sql
SELECT TOP 10
    b.booking_id,
    u.full_name AS customer,
    b.status,
    FORMAT(b.created_at, 'HH:mm:ss') AS created,
    FORMAT(b.actual_start_time, 'HH:mm:ss') AS started,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector,
    cs.current_booking_id,
    CASE 
        WHEN b.status = 'in_progress' AND cs.current_booking_id = b.booking_id THEN '✅ Properly linked'
        WHEN b.status = 'in_progress' AND cs.current_booking_id IS NULL THEN '❌ NOT LINKED - Backend not restarted!'
        WHEN b.status IN ('scheduled', 'confirmed') THEN '⏳ Not started yet'
        ELSE 'N/A'
    END AS link_status
FROM bookings b
INNER JOIN users u ON b.user_id = u.user_id
INNER JOIN charging_slots cs ON b.slot_id = cs.slot_id
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
ORDER BY b.booking_id DESC;
```

---

## ✅ Success Criteria

The fix is working correctly when:

1. **Customer logs show:**
   - Booking created → Status: "Scheduled/Confirmed"
   - Click "Start Charging" → Status: "In Progress"
   - Can see charging progress

2. **Database shows:**
   - `bookings.status = 'in_progress'` ✅
   - `bookings.actual_start_time` IS NOT NULL ✅
   - `charging_slots.status = 'occupied'` ✅
   - `charging_slots.current_booking_id = bookings.booking_id` ✅

3. **Staff Dashboard logs show:**
   ```javascript
   📊 Dashboard API Response: {
     activeSessions: 1,  // ✅ NOT 0!
     // ...
   }
   🔍 Checking connector: POST-01-A1 hasActiveSession: true  // ✅ NOT false!
   ```

4. **Staff UI shows:**
   - Active Sessions count > 0
   - Connector status: "Occupied" (green dot)
   - Customer name visible
   - Current session duration counting up
   - All 3 pages synchronized (Dashboard, Sessions, Monitoring)

---

## 🐛 Common Mistakes

### ❌ Mistake #1: Only creating booking, not starting charging
**Symptom:** Booking exists but status = "scheduled"  
**Solution:** Customer must click "Start Charging" button

### ❌ Mistake #2: Not restarting backend API
**Symptom:** `actual_start_time` exists but `current_booking_id` is NULL  
**Solution:** Restart backend API with `dotnet run`

### ❌ Mistake #3: Testing with old bookings
**Symptom:** Bookings created before fix was applied  
**Solution:** Create NEW booking and start charging AFTER backend restart

---

## 📝 Test Log Template

Use this template to document your test:

```
Date/Time: _______________
Tester: _______________

✅ Pre-Test Checklist:
- [ ] Database fix verified (sp_start_charging modified after 2025-11-12 19:55)
- [ ] Backend API restarted
- [ ] Customer account ready (customer@skaev.com)
- [ ] Staff account ready (staff@skaev.com)

✅ Test Execution:
- [ ] Customer created booking #_____ at _____
- [ ] Customer clicked "Start Charging" at _____
- [ ] Booking status changed to "In Progress"
- [ ] Database query confirms current_booking_id is set
- [ ] Staff refreshed Dashboard
- [ ] Staff sees active session count > 0
- [ ] Staff sees connector as "Occupied"
- [ ] Staff sees customer name in session
- [ ] Charging Sessions page shows data
- [ ] Monitoring page shows data

✅ Results:
Pass ☐  Fail ☐

Notes:
_______________________________________
_______________________________________
```

---

## 🔗 Related Documents

- `CRITICAL_FIX_STAFF_DASHBOARD_SYNC.md` - Root cause analysis
- `STAFF_API_INTEGRATION_VERIFICATION.md` - API mapping
- `database/migrations/recreate_sp_start_charging.sql` - Final fix script
- `database/migrations/test_fix_verification.sql` - Automated test

---

**Last Updated:** November 12, 2025, 20:00  
**Status:** ✅ Database fix applied and verified  
**Next Step:** Manual end-to-end testing with actual Customer → Staff workflow
