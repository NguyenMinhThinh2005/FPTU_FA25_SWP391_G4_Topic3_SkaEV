# 🔍 Debug: Tại sao Customer đã sạc nhưng Staff không thấy?

## ❓ Vấn đề

**Customer đã tạo booking và đang sạc**, nhưng **Staff Dashboard vẫn không hiển thị** phiên sạc đó.

---

## 🔎 Nguyên nhân có thể

### 1. **Booking chưa được START**
- Customer tạo booking (status = `reserved` hoặc `pending`)
- Nhưng chưa bấm "Bắt đầu sạc" → `ActualStartTime` = NULL
- Backend chỉ map `activeSession` khi booking có `ActualStartTime` và status = `in_progress`

### 2. **Slot chưa được UPDATE**
- Bảng `ChargingSlots` có field `CurrentBookingId`
- Khi customer start charging, field này phải được set = `BookingId`
- Nếu không, backend sẽ không tìm thấy active booking

### 3. **Staff và Customer ở khác Station**
- Customer book slot ở Station A
- Staff được assign vào Station B
- Dashboard chỉ hiển thị connectors của station mà staff quản lý

### 4. **Cache/Delay**
- Frontend có thể đang cache data cũ
- Backend chưa refresh real-time
- Cần reload để thấy data mới

---

## 🛠️ Các bước Debug

### **Bước 1: Kiểm tra Console Log**

Mở **Chrome DevTools** (F12) → Tab **Console** → Reload Staff Dashboard

Tìm các log sau:

```javascript
📡 Calling Staff Dashboard API...
✅ Full Dashboard Response: {...}
🔌 Connectors received: [...]
📊 Number of connectors: 4

Connector 1: {
  slotId: 1,
  code: "CON-01",
  status: "Charging",  // ← Nếu = "Charging" là ĐÚNG
  hasActiveSession: true,  // ← Phải là TRUE
  activeSession: {
    bookingId: 123,
    customerName: "...",
    vehicleInfo: "...",
    ...
  }
}
```

**Kết luận từ log:**
- ✅ `hasActiveSession: true` → Data đúng, hiển thị OK
- ❌ `hasActiveSession: false` → Backend chưa map booking vào slot

---

### **Bước 2: Kiểm tra Database**

Chạy query này trong SQL Server:

```sql
-- 1. Kiểm tra booking gần nhất
SELECT TOP 5 
    b.BookingId,
    b.BookingCode,
    b.UserId,
    b.StationId,
    b.SlotId,
    b.Status,
    b.ActualStartTime,
    b.ActualEndTime,
    b.CreatedAt
FROM Bookings b
ORDER BY b.CreatedAt DESC;

-- 2. Kiểm tra slot có CurrentBookingId không
SELECT 
    s.SlotId,
    s.SlotNumber,
    s.ConnectorType,
    s.Status,
    s.CurrentBookingId,  -- ← Phải có giá trị
    p.PostNumber,
    p.StationId
FROM ChargingSlots s
JOIN ChargingPosts p ON s.PostId = p.PostId
WHERE p.StationId = 1  -- Thay bằng StationId của staff
ORDER BY p.PostNumber, s.SlotNumber;

-- 3. Kiểm tra staff assignment
SELECT 
    ss.StaffUserId,
    ss.StationId,
    ss.IsActive,
    u.FullName,
    u.Email,
    st.StationName
FROM StationStaff ss
JOIN Users u ON ss.StaffUserId = u.UserId
JOIN ChargingStations st ON ss.StationId = st.StationId
WHERE ss.IsActive = 1;
```

**Kết quả mong đợi:**
- Booking có `Status = 'in_progress'` hoặc `'charging'`
- Booking có `ActualStartTime` không NULL
- Slot có `CurrentBookingId = BookingId` của booking đang sạc
- Staff được assign vào đúng `StationId`

---

### **Bước 3: Kiểm tra Backend API Response**

Mở **Chrome DevTools** → Tab **Network** → Filter `dashboard`

Click vào request **GET /api/staff/dashboard** → Tab **Response**

Xem JSON response:

```json
{
  "hasAssignment": true,
  "station": {
    "stationId": 1,
    "stationName": "VinFast Green Charging"
  },
  "connectors": [
    {
      "slotId": 1,
      "connectorCode": "CON-01",
      "operationalStatus": "Charging",  // ← Phải là "Charging"
      "activeSession": {  // ← Phải có object này
        "bookingId": 123,
        "customerId": 5,
        "customerName": "Nguyễn Văn A",
        "vehicleInfo": "VinFast VF8 - 29A-12345",
        "startedAt": "2025-11-10T15:30:00Z",
        "currentSoc": 45,
        "power": 22,
        "energyDelivered": 5.8
      }
    }
  ]
}
```

**Nếu `activeSession` = null:**
→ Backend không tìm thấy booking nào map với slot này

---

## 🔧 Các giải pháp

### **Giải pháp 1: Đảm bảo Customer START charging**

Trong Customer app, sau khi đặt booking, phải:
1. Navigate đến trang **"Booking của tôi"**
2. Click nút **"Bắt đầu sạc"** / **"Start Charging"**
3. Backend sẽ:
   - Set `Booking.ActualStartTime = NOW()`
   - Set `Booking.Status = 'in_progress'`
   - Set `ChargingSlot.CurrentBookingId = Booking.BookingId`

### **Giải pháp 2: Fix Backend - Update Slot khi Start**

Kiểm tra file `BookingsController.cs` hoặc service:

```csharp
[HttpPut("{bookingId}/start")]
public async Task<IActionResult> StartCharging(int bookingId, [FromBody] StartChargingDto dto)
{
    var booking = await _context.Bookings
        .Include(b => b.Slot)
        .FirstOrDefaultAsync(b => b.BookingId == bookingId);
    
    if (booking == null) return NotFound();
    
    // Update booking
    booking.ActualStartTime = DateTime.UtcNow;
    booking.Status = "in_progress";
    
    // ⚠️ QUAN TRỌNG: Update slot
    if (booking.Slot != null)
    {
        booking.Slot.CurrentBookingId = bookingId;
        booking.Slot.Status = "in_use";
    }
    
    await _context.SaveChangesAsync();
    
    return Ok();
}
```

### **Giải pháp 3: Thêm Auto-Refresh cho Staff**

✅ **ĐÃ THÊM** - Staff Dashboard tự động refresh mỗi 30 giây:

```javascript
useEffect(() => {
  loadDashboardData();
  
  // Auto-refresh every 30 seconds
  const interval = setInterval(() => {
    console.log("🔄 Auto-refreshing dashboard data...");
    loadDashboardData();
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

### **Giải pháp 4: Manual Refresh**

Staff có thể click nút **"Làm mới"** để reload data ngay lập tức.

---

## 📊 Flow hoàn chỉnh (Customer → Staff)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER SIDE                                │
├─────────────────────────────────────────────────────────────────┤
│ 1. Customer chọn trạm + slot                                    │
│    POST /api/bookings → CREATE booking                          │
│    ├─ Status: "reserved"                                        │
│    ├─ SlotId: 1                                                 │
│    └─ ActualStartTime: NULL                                     │
│                                                                  │
│ 2. Customer scan QR / click "Bắt đầu sạc"                       │
│    PUT /api/bookings/{id}/start                                 │
│    ├─ Status: "in_progress"                                     │
│    ├─ ActualStartTime: NOW()                                    │
│    └─ ChargingSlot.CurrentBookingId: {bookingId}  ← QUAN TRỌNG │
│                                                                  │
│ 3. Xe bắt đầu sạc, SOC tăng dần                                 │
│    POST /api/soc-tracking (real-time updates)                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     STAFF SIDE                                  │
├─────────────────────────────────────────────────────────────────┤
│ 1. Staff Dashboard load data                                    │
│    GET /api/staff/dashboard                                     │
│                                                                  │
│ 2. Backend query:                                               │
│    a. Get staff's assigned station                              │
│    b. Get all slots của station đó                              │
│    c. Join với Bookings WHERE:                                  │
│       - slot.CurrentBookingId = booking.BookingId               │
│       - booking.Status = 'in_progress'                          │
│    d. Join với SocTrackings (latest)                            │
│                                                                  │
│ 3. Response trả về:                                             │
│    connectors: [                                                │
│      {                                                          │
│        slotId: 1,                                               │
│        operationalStatus: "Charging",                           │
│        activeSession: {                                         │
│          bookingId: 123,                                        │
│          customerName: "...",                                   │
│          currentSoc: 45,                                        │
│          energyDelivered: 5.8                                   │
│        }                                                        │
│      }                                                          │
│    ]                                                            │
│                                                                  │
│ 4. Frontend render:                                             │
│    - Connector card hiển thị "Đang sạc" (màu xanh)              │
│    - Active session info hiển thị                               │
│    - Nút "Dừng sạc", "Thanh toán" enabled                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Troubleshooting

- [ ] Customer đã click "Bắt đầu sạc" chưa?
- [ ] Booking có `ActualStartTime` không NULL?
- [ ] Booking có `Status = 'in_progress'`?
- [ ] `ChargingSlot.CurrentBookingId` = `Booking.BookingId`?
- [ ] Staff assigned đúng `StationId`?
- [ ] Console log có `hasActiveSession: true`?
- [ ] Network tab có response `activeSession` object?
- [ ] Đã thử click "Làm mới" trên Staff Dashboard?
- [ ] Đã chờ 30 giây để auto-refresh?

---

## 🎯 Test Case

### **Scenario: Customer sạc xe → Staff thấy real-time**

1. **[Customer]** Login → Đặt chỗ sạc → Nhận QR code
2. **[Customer]** Click "Bắt đầu sạc" → Status = in_progress
3. **[Database]** Check `ChargingSlot.CurrentBookingId` phải có giá trị
4. **[Staff]** Refresh Dashboard (hoặc đợi 30s)
5. **[Staff]** Connector hiển thị:
   - Chip "Đang sạc" (màu xanh)
   - Active session với tên customer
   - SOC real-time
   - Nút "Dừng sạc" enabled

**Expected Result:**
✅ Staff thấy phiên sạc ngay khi customer start

---

## 🚀 Next Steps

Nếu vẫn không hoạt động:

1. Gửi screenshot **Console log** (Full Dashboard Response)
2. Gửi screenshot **Network Response** (GET /api/staff/dashboard)
3. Gửi kết quả **SQL query** (3 queries ở trên)
4. Tôi sẽ xác định chính xác vấn đề ở đâu

---

**📝 Ghi chú:** File này giúp debug toàn bộ flow từ Customer → Backend → Staff Dashboard.
