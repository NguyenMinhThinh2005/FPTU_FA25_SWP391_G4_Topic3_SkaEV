# ✅ VERIFICATION - Complete Customer-Staff Data Flow

## 📊 Current Database State

```sql
-- Check current sessions
SELECT 
    cs.slot_id,
    CONCAT(cp.post_number, '-', cs.slot_number) AS connector,
    cs.status AS slot_status,
    cs.current_booking_id,
    b.booking_id,
    b.status AS booking_status,
    u.full_name AS customer,
    i.payment_status,
    CASE 
        WHEN cs.current_booking_id IS NOT NULL AND b.status = 'in_progress' 
        THEN '🔋 ACTIVE CHARGING'
        WHEN cs.current_booking_id IS NOT NULL AND b.status = 'completed' AND i.payment_status = 'pending'
        THEN '💳 AWAITING PAYMENT'
        WHEN cs.current_booking_id IS NULL AND cs.status = 'available'
        THEN '✅ AVAILABLE'
        ELSE '⚠️ Unknown state'
    END AS staff_will_see
FROM charging_slots cs
INNER JOIN charging_posts cp ON cs.post_id = cp.post_id
LEFT JOIN bookings b ON cs.current_booking_id = b.booking_id
LEFT JOIN users u ON b.user_id = u.user_id
LEFT JOIN invoices i ON b.booking_id = i.booking_id
WHERE cp.station_id = 1
ORDER BY cs.slot_id;
```

**Result:**
- Slot 3 (POST-01-A1): current_booking_id = 12, status = occupied → **💳 AWAITING PAYMENT**
- Slot 4 (POST-01-A2): current_booking_id = NULL, status = available → **✅ AVAILABLE**
- Slot 5 (POST-01-A3): current_booking_id = NULL, status = available → **✅ AVAILABLE**

---

## ✅ FIXES APPLIED

### 1. Database Stored Procedures

#### sp_start_charging ✅
```sql
-- FIXED: Now sets current_booking_id when charging starts
UPDATE charging_slots
SET status = 'occupied',
    current_booking_id = @booking_id,  -- ← ADDED
    updated_at = GETDATE()
WHERE slot_id = @slot_id;
```

#### sp_complete_charging ✅
```sql
-- FIXED: Keeps current_booking_id when charging completes (until payment)
UPDATE charging_slots
SET status = 'occupied',  -- ← Changed from 'available'
    -- current_booking_id NOT cleared here
    updated_at = GETDATE()
WHERE slot_id = @slot_id;
```

### 2. Backend Service Fixes

#### StaffDashboardService.cs ✅
```csharp
// BEFORE (WRONG):
var activeSessions = await _context.Bookings
    .Where(b => b.StationId == stationId && b.Status == "in_progress")
    .CountAsync();

// AFTER (CORRECT):
var activeSessions = await _context.ChargingSlots
    .Include(cs => cs.ChargingPost)
    .Where(cs => cs.ChargingPost.StationId == stationId && cs.CurrentBookingId.HasValue)
    .CountAsync();
```

#### InvoiceService.cs - ProcessPaymentAsync ✅
```csharp
// ADDED: Clear slot after payment
if (invoice.Booking != null)
{
    var slot = await _context.ChargingSlots
        .FirstOrDefaultAsync(cs => cs.SlotId == invoice.Booking.SlotId);
    
    if (slot != null && slot.CurrentBookingId == invoice.BookingId)
    {
        slot.Status = "available";
        slot.CurrentBookingId = null;
        slot.UpdatedAt = DateTime.UtcNow;
    }
}
```

---

## 🔄 Complete Flow Verification

### Flow 1: Customer Start Charging → Staff See Active

**Customer Action:**
```http
PUT /api/bookings/19/start
```

**Database Changes:**
```sql
-- sp_start_charging executes:
UPDATE bookings SET status = 'in_progress', actual_start_time = NOW() WHERE booking_id = 19;
UPDATE charging_slots SET status = 'occupied', current_booking_id = 19 WHERE slot_id = 3;
```

**Staff Dashboard Query:**
```csharp
var activeSessions = slots.Where(s => s.CurrentBookingId.HasValue).Count();
// Result: 1 (finds booking #19)
```

**Expected UI:**
- Staff Dashboard: `activeSessions: 1` ✅
- Connector POST-01-A1: Status "Occupied", Customer "Customer User" ✅
- Charging Sessions page: Shows active session ✅

---

### Flow 2: Customer Complete Charging → Staff See Awaiting Payment

**Customer Action:**
```http
PUT /api/bookings/19/complete
Body: { finalSoc: 80, totalEnergyKwh: 45.5, unitPrice: 3500 }
```

**Database Changes:**
```sql
-- sp_complete_charging executes:
UPDATE bookings SET status = 'completed', actual_end_time = NOW() WHERE booking_id = 19;
INSERT INTO invoices (...) VALUES (..., payment_status = 'pending');
UPDATE charging_slots SET status = 'occupied' WHERE slot_id = 3;
-- Note: current_booking_id = 19 is KEPT!
```

**Staff Dashboard Query:**
```csharp
var activeSessions = slots.Where(s => s.CurrentBookingId.HasValue).Count();
// Result: STILL 1 (booking #19 still linked)
```

**Expected UI:**
- Staff Dashboard: `activeSessions: 1` (still shows session) ✅
- Connector POST-01-A1: Status "Occupied", Shows "Awaiting Payment" badge ✅
- Charging Sessions page: Session in "Pending Payments" list ✅

---

### Flow 3: Staff Process Payment → Slot Becomes Available

**Staff Action:**
```http
POST /api/invoices/12/process-payment
Body: { method: "cash", amount: 159250, notes: "Cash payment" }
```

**Backend Code Executes:**
```csharp
// InvoiceService.ProcessPaymentAsync:
invoice.PaymentStatus = "paid";
invoice.PaidAt = DateTime.UtcNow;

// NEW CODE - Clear slot:
slot.Status = "available";
slot.CurrentBookingId = null;
```

**Staff Dashboard Query:**
```csharp
var activeSessions = slots.Where(s => s.CurrentBookingId.HasValue).Count();
// Result: 0 (booking #19 unlinked)
```

**Expected UI:**
- Staff Dashboard: `activeSessions: 0` ✅
- Connector POST-01-A1: Status "Available" (green) ✅
- Charging Sessions page: Session moved to "Completed" list ✅

---

## 📊 Staff Dashboard Data Mapping

### Backend API Response:
```json
{
  "station": { "stationId": 1, "name": "VinFast..." },
  "connectors": [
    {
      "slotId": 3,
      "connectorCode": "POST-01-A1",
      "technicalStatus": "occupied",
      "activeSession": {
        "bookingId": 12,
        "customerName": "Customer User",
        "actualStartTime": "2025-11-12T00:13:56",
        "status": "completed"  // ← Customer completed, awaiting payment
      }
    },
    {
      "slotId": 4,
      "connectorCode": "POST-01-A2",
      "technicalStatus": "available",
      "activeSession": null
    },
    {
      "slotId": 5,
      "connectorCode": "POST-01-A3",
      "technicalStatus": "available",
      "activeSession": null
    }
  ],
  "dailyStats": {
    "revenue": 0,
    "energyDeliveredKwh": 0,
    "completedSessions": 0,
    "activeSessions": 1,  // ← Counts slot #3
    "pendingPayments": 1
  }
}
```

### Frontend (Dashboard.jsx) Display:
```javascript
// Active Sessions Card
<Box>
  <Typography variant="h4">{dashboardData.dailyStats.activeSessions}</Typography>
  <Typography>Phiên đang hoạt động</Typography>
</Box>

// Connector Cards
connectors.map(connector => {
  const hasActiveSession = connector.activeSession !== null;
  const statusColor = hasActiveSession ? 'warning' : 'success';
  const statusText = hasActiveSession 
    ? (connector.activeSession.status === 'completed' 
        ? 'Chờ thanh toán' 
        : 'Đang sạc')
    : 'Rảnh';
  
  return (
    <Card>
      <Typography>{connector.connectorCode}</Typography>
      <Chip color={statusColor} label={statusText} />
      {hasActiveSession && (
        <Typography>Khách: {connector.activeSession.customerName}</Typography>
      )}
    </Card>
  );
})
```

---

## 🧪 NEXT STEPS TO TEST

### Test 1: Verify Current State
```powershell
# Refresh Staff Dashboard in browser (F5)
# Check console logs for:
```
```javascript
📊 Dashboard API Response: { activeSessions: 1 }
🔌 Connectors from API: [{ connectorCode: "POST-01-A1", activeSession: {...} }]
✅ Final calculated stats: { activeSessions: 1 }
```

### Test 2: Create New Booking & Start Charging
```sql
-- In SQL:
EXEC sp_start_charging @booking_id = 4;  -- Use existing booking #4
```
```javascript
// Staff Dashboard should update to:
{ activeSessions: 2 }  // Now shows both #12 and #4
```

### Test 3: Process Payment for Booking #12
```http
POST http://localhost:5000/api/invoices/12/process-payment
Authorization: Bearer {staff_token}
Content-Type: application/json

{
  "method": "cash",
  "amount": 159250
}
```
```javascript
// Staff Dashboard should update to:
{ activeSessions: 1 }  // Only #4 remains, #12 cleared
```

---

## ⚠️ IMPORTANT NOTES

### Backend Must Be Restarted!
The updated code in `StaffDashboardService.cs` and `InvoiceService.cs` will only work after backend restart:

```powershell
cd SkaEV.API
# Stop current process (Ctrl+C or taskkill)
dotnet build
dotnet run
```

### Frontend Refresh
After backend restart, refresh Staff Dashboard (F5) to see updated data.

---

## ✅ VERIFICATION CHECKLIST

- [x] sp_start_charging sets current_booking_id
- [x] sp_complete_charging keeps current_booking_id
- [x] StaffDashboardService counts based on current_booking_id
- [x] InvoiceService clears current_booking_id on payment
- [x] Existing data fixed (booking #12 linked)
- [ ] Backend restarted with new code
- [ ] Staff Dashboard shows activeSessions: 1
- [ ] Process payment test clears session

---

**Current Status:** ✅ All database and code fixes applied  
**Next Action:** Restart backend API and refresh Staff Dashboard  
**Expected Result:** Staff Dashboard will show `activeSessions: 1` with booking #12 awaiting payment
