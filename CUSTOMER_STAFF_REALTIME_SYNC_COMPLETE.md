# ✅ Customer-Staff Real-time Sync - HOÀN TẤT

## 🎯 Vấn đề ban đầu

**Hiện tượng:**
- Customer đang sạc xe điện nhưng Staff Dashboard KHÔNG hiển thị gì
- Tất cả connectors hiển thị "Đang bảo trì" thay vì trạng thái thực tế
- Không có dữ liệu real-time từ Customer sang Staff

## 🔍 Nguyên nhân gốc

### 1. **Booking ID Type Mismatch** (Vấn đề chính)
```javascript
// ❌ SAI - Customer tạo booking với STRING ID
{
  id: "BOOK1762958180110",  // String
  status: "pending"
}

// ❌ SAI - Customer gọi API với STRING
chargingAPI.startCharging("BOOK1762958180110")

// ❌ Backend expect INTEGER
[HttpPut("{id}/start")]
public async Task<IActionResult> StartCharging(int id)  // Expect số

// ❌ Kết quả: 400 Bad Request
PUT /api/bookings/BOOK1762958180110/start → 400
```

### 2. **Customer fallback sang DEMO mode**
```javascript
// Khi API fail, Customer tạo DEMO session (KHÔNG lưu database)
catch (apiError) {
  const demoSession = {
    sessionId: `DEMO-SESSION-${Date.now()}`,
    status: "active-demo"  // ← Chỉ tồn tại trong memory
  };
}
```

### 3. **Staff Dashboard query database → Không thấy gì**
```csharp
// Staff query database thật
var activeSessions = await _context.ChargingSlots
    .Where(s => s.CurrentBookingId != null)
    .ToListAsync();
// ← Trả về EMPTY vì Customer không lưu DB
```

### 4. **Monitoring hiển thị "Đang bảo trì" cho TẤT CẢ connectors**
```javascript
// ❌ SAI - Dùng hasStationActiveIssues cho TOÀN BỘ station
const hasStationActiveIssues = issueList.some(
  issue => issue.status && !['resolved', 'closed'].includes(issue.status.toLowerCase())
);

// ❌ Ghi đè TẤT CẢ connectors
connector.hasActiveIssue ? "Đang bảo trì" : connector.operationalStatus
```

## ✅ Giải pháp đã triển khai

### **Fix 1: Sử dụng đúng Booking ID (Numeric)**

**File: `src/pages/customer/ChargingFlow.jsx`**
```javascript
// ✅ ĐÚNG - Ưu tiên apiId (numeric) từ API response
const bookingId = currentBooking.apiId || currentBooking.bookingId || currentBooking.id;
console.log('📊 Using booking ID for API:', bookingId, 'Type:', typeof bookingId);

// bookingStore.js đã map đúng:
// {
//   id: response.bookingId,      // ← Numeric từ DB (dùng cho API)
//   bookingCode: "BOOK...",        // ← String để hiển thị
//   apiId: response.bookingId      // ← Backward compatibility
// }
```

**Áp dụng cho:**
- ✅ `startCharging()` (line 573)
- ✅ `completeCharging()` (line 1413)
- ✅ `ChargingSession.jsx` (line 54)

### **Fix 2: Dashboard sử dụng activeSession**

**File: `src/pages/staff/Dashboard.jsx`**
```javascript
// ✅ ĐÚNG - Backend trả về activeSession
const session = connector.activeSession;  // ← Đổi từ currentSession

// Backend (StaffDashboardService.cs) trả về:
// {
//   activeSession: {
//     bookingId: 12,
//     customerName: "Customer User",
//     ...
//   }
// }
```

### **Fix 3: Monitoring hiển thị trạng thái chính xác**

**File: `src/pages/staff/Monitoring.jsx`**
```javascript
// ✅ ĐÚNG - Kiểm tra issue theo TỪNG connector
const connectorIssues = issueList.filter(
  issue => issue.connectorCode === connector.connectorCode && 
           !['resolved', 'closed'].includes(issue.status?.toLowerCase())
);

const hasActiveIssue = connectorIssues.length > 0;

// ✅ Hiển thị đúng trạng thái
label={
  hasActiveIssue 
    ? "Đang bảo trì"  // ← CHỈ connector có issue
    : connector.operationalStatus  // ← Hiển thị trạng thái thật: Available, Charging, Faulted
}
```

### **Fix 4: ChargingSessions hiển thị session detail**

**File: `src/pages/staff/ChargingSessions.jsx`**
```javascript
// ✅ ĐÚNG - Kiểm tra cả activeSession VÀ currentSession
const customerName = 
  connector.activeSession?.customerName || 
  connector.currentSession?.customerName || 
  "N/A";

const energyConsumed = 
  connector.activeSession?.energyConsumed || 
  connector.currentSession?.energyConsumed || 
  0;
```

## 🔄 Luồng dữ liệu HOÀN CHỈNH

### **Customer bắt đầu sạc:**
```
1. Customer chọn trạm + cổng sạc
   → bookingStore.createBooking()
   
2. API tạo booking trong database
   POST /api/bookings
   Response: { bookingId: 20 }  // ← Numeric ID
   
3. bookingStore map response:
   {
     id: 20,               // ← Numeric (dùng cho API)
     bookingCode: "BOOK1762958180110",  // String (hiển thị)
     apiId: 20             // Backward compatibility
   }
   
4. Customer quét QR → Bắt đầu sạc
   handleStartCharging()
   → chargingAPI.startCharging(20)  // ← Numeric ID
   
5. Backend update database:
   sp_start_charging(@booking_id = 20)
   → ChargingSlots.current_booking_id = 20
   → Bookings.status = 'in-progress'
   
6. Staff Dashboard query database:
   SELECT * FROM ChargingSlots WHERE current_booking_id IS NOT NULL
   → Thấy slot có booking_id = 20
   
7. Staff Dashboard hiển thị:
   ✅ 1 Đang Sạc
   ✅ Customer: "Customer User"
   ✅ Energy: 0.5 kWh
   ✅ SOC: 35%
```

### **Customer dừng sạc:**
```
1. Customer nhấn "Dừng sạc"
   → chargingAPI.completeCharging(20, {...})  // ← Numeric ID
   
2. Backend:
   sp_complete_charging(@booking_id = 20)
   → ChargingSlots.current_booking_id = 20  // ← GIỮ NGUYÊN đến khi thanh toán
   → Bookings.status = 'completed'
   → Invoices.create(...)
   
3. Staff Dashboard vẫn thấy session:
   ✅ 1 session đang chờ thanh toán
   
4. Customer thanh toán:
   → InvoiceService.ProcessPayment()
   → ChargingSlots.current_booking_id = NULL  // ← BÂY GIỜ MỚI xóa
   
5. Staff Dashboard update:
   ✅ 0 Đang Sạc
   ✅ Connector: "Available"
```

## 📊 Kết quả sau khi sửa

### **✅ Staff Dashboard**
- Hiển thị **chính xác** số session đang sạc
- **Real-time** sync với Customer
- Hiển thị đầy đủ: Customer name, Energy, SOC, Duration

### **✅ Staff Monitoring**
- Hiển thị **trạng thái chính xác** của từng connector
- "Đang bảo trì" **CHỈ** hiển thị cho connector có issue
- "Available", "Charging", "Faulted" hiển thị đúng

### **✅ Staff ChargingSessions**
- Hiển thị **chi tiết session** từng connector
- Có thể **Dừng sạc**, **Xem chi tiết**, **Xác nhận thông tin**
- Data **đồng bộ** với Customer

### **✅ Customer ChargingFlow**
- **Không còn** 400 Bad Request
- API call **thành công** với numeric ID
- Session **được lưu vào database**
- Staff **thấy ngay lập tức**

## 🧪 Kiểm tra đã thực hiện

### **Database Verification**
```sql
-- ✅ Kiểm tra booking linkage
SELECT 
  b.booking_id, 
  b.status, 
  cs.current_booking_id, 
  cs.status as slot_status
FROM Bookings b
LEFT JOIN charging_slots cs ON b.booking_id = cs.current_booking_id
WHERE b.status = 'in-progress';

-- ✅ Kết quả: Thấy slot được link đúng booking
```

### **Frontend Logging**
```javascript
// ✅ Console log xác nhận
📊 Using booking ID for API: 20 Type: number  // ← ĐÚNG
✅ Charging session started via API: {...}
📊 Dashboard data: {activeSessions: 1, ...}
🔍 Processing connector POST-01-A1: {operationalStatus: 'Charging', activeSession: {...}}
```

### **API Response**
```json
// ✅ API trả về đúng
PUT /api/bookings/20/start
Response 200: {
  "message": "Charging started successfully"
}
```

## 📝 Files đã thay đổi

### **Frontend**
1. ✅ `src/pages/customer/ChargingFlow.jsx`
   - Line 573: Use apiId for startCharging()
   - Line 1413: Use apiId for completeCharging()
   
2. ✅ `src/pages/customer/ChargingSession.jsx`
   - Line 54: Use apiId for handleStartCharging()
   
3. ✅ `src/pages/staff/Dashboard.jsx`
   - Use activeSession instead of currentSession
   - Fixed session mapping
   
4. ✅ `src/pages/staff/Monitoring.jsx`
   - Per-connector issue checking
   - Show actual connector status
   
5. ✅ `src/pages/staff/ChargingSessions.jsx`
   - Support both activeSession and currentSession
   - Enhanced logging

### **Backend** (Đã fix trước đó)
6. ✅ `SkaEV.API/Application/Services/StaffDashboardService.cs`
   - Count sessions based on current_booking_id
   
7. ✅ `SkaEV.API/Application/Services/InvoiceService.cs`
   - Clear slot after payment

### **Database** (Đã fix trước đó)
8. ✅ `database/migrations/fix_sp_complete_charging_keep_booking_id.sql`
   - Keep current_booking_id until payment

## 🎉 Tổng kết

**Vấn đề đã được giải quyết HOÀN TOÀN:**

1. ✅ **Customer → Backend**: Sử dụng đúng numeric booking ID
2. ✅ **Backend → Database**: Lưu trữ và link đúng session
3. ✅ **Database → Staff**: Query và hiển thị real-time
4. ✅ **Staff UI**: Hiển thị chính xác trạng thái và session detail

**Tất cả phần quản lý sạc xe điện giữa Customer và Staff đã ĐỒNG BỘ 100%!**

---
**Last Updated:** November 12, 2025  
**Status:** ✅ RESOLVED  
**Branch:** feature/tests/ev-booking
