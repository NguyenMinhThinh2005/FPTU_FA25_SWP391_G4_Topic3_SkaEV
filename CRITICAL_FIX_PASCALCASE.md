# 🔴 CRITICAL FIX: PascalCase vs camelCase - Backend API Response

## 🚨 VẤN ĐỀ PHÁT HIỆN

**Triệu chứng:**
```javascript
📊 Using booking ID for API: BOOK1762960159121 Type: string  ❌
PUT /api/bookings/BOOK1762960159121/start → 400 Bad Request
```

Customer vẫn nhận được **STRING ID** thay vì **NUMERIC ID** sau khi tạo booking thành công!

## 🔍 NGUYÊN NHÂN GỐC RỂ

### **Backend trả về PascalCase, Frontend expect camelCase**

**Backend (C# - ASP.NET Core):**
```csharp
public class BookingDto
{
    public int BookingId { get; set; }      // ← PascalCase
    public int UserId { get; set; }         // ← PascalCase
    public string Status { get; set; }      // ← PascalCase
    public DateTime CreatedAt { get; set; } // ← PascalCase
}
```

**Frontend (JavaScript - bookingStore.js):**
```javascript
// ❌ SAI - Tìm camelCase nhưng backend trả về PascalCase
const booking = {
  id: response.bookingId || response.id,  // ← undefined!
  apiId: response.bookingId || response.id, // ← undefined!
  status: response.status,  // ← undefined!
  createdAt: response.createdAt,  // ← undefined!
};
```

**Kết quả:**
```javascript
// API Response:
{
  BookingId: 20,      // ← PascalCase
  Status: "scheduled",
  CreatedAt: "2025-11-12T15:09:19.121Z"
}

// bookingStore extracts:
booking.id = undefined          // ❌ Không tìm thấy bookingId
booking.apiId = undefined       // ❌ Không tìm thấy bookingId
booking.id = "BOOK1762960159121" // ✅ Fallback to string ID

// ChargingFlow uses:
bookingId = currentBooking.apiId || currentBooking.id
         = undefined || "BOOK1762960159121"
         = "BOOK1762960159121"  // ❌ STRING!
```

## ✅ GIẢI PHÁP ĐÃ TRIỂN KHAI

### **1. Fix createBooking() - Handle PascalCase**

**File: `src/store/bookingStore.js` (Line 243-260)**

```javascript
// ✅ ĐÚNG - Kiểm tra CẢHAI PascalCase VÀ camelCase
const response = await bookingsAPI.create(apiPayload);
console.log("✅ API Response:", response);

// Backend returns PascalCase (BookingId), not camelCase (bookingId)
const numericId = response.BookingId || response.bookingId || response.id;
console.log("📊 Extracted booking ID from API:", numericId, "Type:", typeof numericId);

// Merge API response
booking = {
  ...booking,
  id: numericId,                    // ← NUMERIC ID cho API calls
  bookingCode: booking.id,          // ← "BOOK..." cho display
  apiId: numericId,                 // ← Backward compatibility
  bookingId: numericId,             // ← Consistency
  status: response.Status || response.status || booking.status,
  createdAt: response.CreatedAt || response.createdAt || booking.createdAt,
};
```

### **2. Fix mapApiBookingToStore() - Handle ALL fields**

**File: `src/store/bookingStore.js` (Line 26-106)**

```javascript
const mapApiBookingToStore = (apiBooking) => {
  // ✅ ĐÚNG - Handle both PascalCase and camelCase
  const bookingId = apiBooking.BookingId || apiBooking.bookingId;
  const createdAt = normalizeTimestamp(apiBooking.CreatedAt || apiBooking.createdAt);
  const scheduledStart = normalizeTimestamp(apiBooking.ScheduledStartTime || apiBooking.scheduledStartTime);
  // ... tất cả fields khác

  return {
    id: bookingId,
    bookingId: bookingId,
    apiId: bookingId,
    userId: apiBooking.UserId || apiBooking.userId,
    customerName: apiBooking.CustomerName || apiBooking.customerName,
    stationId: apiBooking.StationId || apiBooking.stationId,
    status: ((apiBooking.Status || apiBooking.status) || "pending").toLowerCase(),
    // ... tất cả fields khác
  };
};
```

## 🔄 LUỒNG DỮ LIỆU SAU KHI SỬA

### **Customer tạo booking:**
```
1. Frontend: bookingStore.createBooking(data)
   → API POST /api/bookings

2. Backend: BookingsController.CreateBooking()
   → Returns BookingDto with PascalCase:
   {
     BookingId: 20,              // ← PascalCase
     Status: "scheduled",
     CreatedAt: "2025-11-12T..."
   }

3. Frontend: bookingStore receives response
   → Extracts: numericId = response.BookingId  // ✅ 20 (number)
   → Sets: booking.id = 20
          booking.apiId = 20
          booking.bookingCode = "BOOK1762960159121"
   
   Console log:
   ✅ API Response: {BookingId: 20, Status: "scheduled", ...}
   📊 Extracted booking ID from API: 20 Type: number  ✅
```

### **Customer bắt đầu sạc:**
```
4. Frontend: handleStartCharging()
   → bookingId = currentBooking.apiId || currentBooking.id
              = 20 || 20
              = 20  ✅ NUMERIC!
   
   Console log:
   📊 Using booking ID for API: 20 Type: number  ✅

5. Frontend: chargingAPI.startCharging(20)
   → API PUT /api/bookings/20/start  ✅

6. Backend: BookingsController.StartCharging(int id = 20)
   → sp_start_charging(@booking_id = 20)
   → ChargingSlots.current_booking_id = 20  ✅

7. Database updated successfully ✅
```

### **Staff Dashboard query:**
```
8. Staff: Dashboard loads
   → API GET /api/staff/dashboard

9. Backend: StaffDashboardService.GetDashboardData()
   → Query: SELECT * FROM charging_slots 
           WHERE current_booking_id IS NOT NULL
   → Finds: slot_id = 3, current_booking_id = 20  ✅

10. Frontend: Staff Dashboard receives data
    → Shows: "1 Đang Sạc"
            Customer: "Customer User"
            Energy: 0.5 kWh
    ✅ REAL-TIME SYNC!
```

## 📊 CONSOLE LOG MẪU (SAU KHI SỬA)

### **Customer - Tạo booking:**
```javascript
📝 Creating booking (API ENABLED): {...}
📤 API Payload: {stationId: 1, slotId: 3, vehicleId: 5, ...}
✅ API Response: {BookingId: 20, Status: "scheduled", CreatedAt: "2025-11-12T...", ...}
📊 Extracted booking ID from API: 20 Type: number  ✅
```

### **Customer - Bắt đầu sạc:**
```javascript
🔌 Starting charging session for booking: 20 {...}
📊 Using booking ID for API: 20 Type: number  ✅
✅ Charging session started via API: {message: "Charging started successfully"}
⚡ Charging started successfully
```

### **Staff - Dashboard:**
```javascript
📊 Dashboard API Response: {activeSessions: 1, connectors: [...]}
🔍 Checking connector: POST-01-A1 hasActiveSession: true  ✅
  → Customer: Customer User
  → Energy: 0.5 kWh
  → SOC: 35%
📈 Daily Stats from API: {activeSessions: 1, ...}
✅ Final calculated stats: {activeSessions: 1, energy: 0.5, revenue: 1750}
```

## 🧪 CÁCH KIỂM TRA

### **Bước 1: Xóa localStorage và refresh**
```javascript
// Trong Console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **Bước 2: Customer - Tạo booking mới**
1. Login as Customer
2. Chọn trạm sạc
3. Chọn loại sạc + cổng sạc
4. Đặt lịch hoặc sạc ngay
5. **Kiểm tra Console:**
   ```
   ✅ API Response: {BookingId: XX, ...}
   📊 Extracted booking ID from API: XX Type: number  ← PHẢI LÀ number!
   ```

### **Bước 3: Customer - Bắt đầu sạc**
1. Quét QR code
2. Nhấn "Bắt đầu sạc"
3. **Kiểm tra Console:**
   ```
   📊 Using booking ID for API: XX Type: number  ← PHẢI LÀ number!
   ✅ Charging session started via API: {...}
   ```

### **Bước 4: Staff - Kiểm tra Dashboard**
1. Mở tab mới
2. Login as Staff
3. Vào Dashboard
4. **Kiểm tra:**
   - "1 Đang Sạc" hiển thị ✅
   - Customer name hiển thị ✅
   - Energy, SOC hiển thị ✅

### **Bước 5: Kiểm tra Database**
```sql
SELECT 
  b.booking_id, 
  b.status, 
  cs.current_booking_id, 
  cs.status as slot_status
FROM Bookings b
LEFT JOIN charging_slots cs ON b.booking_id = cs.current_booking_id
WHERE b.booking_id = XX;  -- XX là booking ID từ console

-- Expected:
-- booking_id | status      | current_booking_id | slot_status
-- -----------|-------------|-------------------|-------------
-- XX         | in-progress | XX                | occupied
```

## ⚠️ LƯU Ý QUAN TRỌNG

### **1. Backend KHÔNG tự động convert PascalCase → camelCase**
- ASP.NET Core mặc định trả về PascalCase
- Cần configure JsonSerializerOptions nếu muốn camelCase:
  ```csharp
  builder.Services.AddControllers()
      .AddJsonOptions(options => {
          options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
      });
  ```
- **NHƯNG**: Không nên thay đổi backend lúc này, vì có thể ảnh hưởng toàn bộ API
- **GIẢI PHÁP**: Frontend handle both cases ✅

### **2. Axios KHÔNG tự động convert**
- `api.js` interceptor trả về `response.data` trực tiếp
- KHÔNG có middleware convert PascalCase → camelCase
- Frontend PHẢI kiểm tra CẢ HAI cases

### **3. Tất cả API endpoints cần kiểm tra**
- ✅ `POST /api/bookings` - Fixed
- ✅ `GET /api/bookings/{id}` - Fixed (mapApiBookingToStore)
- ✅ `GET /api/bookings/my-bookings` - Fixed (mapApiBookingToStore)
- ✅ `PUT /api/bookings/{id}/start` - OK (chỉ nhận integer ID)
- ✅ `PUT /api/bookings/{id}/complete` - OK (chỉ nhận integer ID)

## 📁 FILES ĐÃ SỬA

1. ✅ `src/store/bookingStore.js`
   - Line 243-260: createBooking() - Handle PascalCase
   - Line 26-106: mapApiBookingToStore() - Handle all fields

2. ✅ `src/pages/customer/ChargingFlow.jsx`
   - Line 573: Use apiId for startCharging()
   - Line 1413: Use apiId for completeCharging()

3. ✅ `src/pages/customer/ChargingSession.jsx`
   - Line 54: Use apiId for handleStartCharging()

## ✅ KẾT QUẢ MONG ĐỢI

**SAU KHI SỬA:**
1. ✅ Customer tạo booking → Nhận NUMERIC ID từ backend
2. ✅ Customer bắt đầu sạc → API call với NUMERIC ID
3. ✅ Backend nhận INTEGER ID → Update database
4. ✅ Staff Dashboard → Thấy session NGAY LẬP TỨC
5. ✅ Data đồng bộ 100% real-time Customer ↔ Staff

---
**Last Updated:** November 12, 2025 22:30  
**Status:** ✅ FIXED  
**Branch:** feature/tests/ev-booking  
**Commits:** 
- `fb17ccf` - Fix: Handle PascalCase API response from backend
- `bf03d64` - Fix: Customer-Staff real-time sync - Booking ID resolution
