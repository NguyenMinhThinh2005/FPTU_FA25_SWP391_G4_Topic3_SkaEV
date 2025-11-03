# 🔧 Booking Flow Fix - Database Sync Enabled

## ✅ Các thay đổi đã thực hiện

### 1. **Enable API cho Complete Booking** (`bookingStore.js`)
- ✅ Bật `ENABLE_COMPLETE_API = true`
- ✅ Gọi `bookingsAPI.complete()` khi hoàn thành charging
- ✅ Lưu vào database qua stored procedure `sp_complete_charging`
- ✅ Tạo invoice tự động
- ✅ Free up charging slot
- ✅ Update station availability

### 2. **Enable API cho Start Charging** (`bookingStore.js`)
- ✅ Gọi `bookingsAPI.start()` khi bắt đầu charging
- ✅ Update booking status = 'in_progress' trong database
- ✅ Set actual_start_time
- ✅ Handle gracefully nếu API requires staff role

### 3. **Load Bookings từ Database** (`bookingStore.js`)
- ✅ Thêm function `loadUserBookings()` 
- ✅ Fetch bookings từ backend API `/bookings`
- ✅ Map database fields sang store format
- ✅ Sync với localStorage

### 4. **Auto-sync khi Login** (`useMasterDataSync.js`)
- ✅ Tự động load bookings từ database khi user đăng nhập
- ✅ Update localStorage với data mới nhất
- ✅ Fallback gracefully nếu API fails

### 5. **Fix API Endpoints** (`api.js`)
- ✅ Thêm `bookingsAPI.start(id)` method
- ✅ Update `getUserBookings()` để gọi `/bookings` endpoint
- ✅ Verify `complete()` endpoint

---

## 🔄 Flow hoàn chỉnh: FE → BE → Database

### **1. Tạo Booking**
```
User clicks "Đặt trạm"
  → FE: bookingStore.createBooking(data)
    → API: POST /bookings
      → BE: BookingsController.CreateBooking()
        → DB: sp_create_booking
          ✅ Insert vào bookings table
          ✅ Reserve charging_slot
          ✅ Update station availability
      ← Response: { bookingId: 15, status: "pending" }
    ← Update localStorage
  → User sees booking confirmation
```

### **2. Scan QR Code**
```
User scans QR
  → FE: bookingStore.scanQRCode(bookingId)
    → Update local status = "confirmed"
  → Ready to start charging
```

### **3. Start Charging**
```
User clicks "Bắt đầu sạc"
  → FE: bookingStore.startCharging(bookingId)
    → API: PUT /bookings/{id}/start
      → BE: BookingsController.StartCharging()
        → DB: sp_start_charging (if exists)
          ✅ Update status = 'in_progress'
          ✅ Set actual_start_time
      ← Response: 200 OK
    ← Update localStorage
  → Charging session starts (SOC tracking)
```

### **4. Complete Charging**
```
User clicks "Dừng sạc"
  → FE: bookingStore.completeBooking(bookingId, sessionData)
    → API: PUT /bookings/{id}/complete
      → Payload: { finalSoc: 80, totalEnergyKwh: 15.5, unitPrice: 8500 }
      → BE: BookingsController.CompleteCharging()
        → DB: sp_complete_charging
          ✅ Update status = 'completed'
          ✅ Set actual_end_time
          ✅ Insert soc_tracking
          ✅ Create invoice
          ✅ Free charging_slot
          ✅ Update station availability
      ← Response: { message: "Success", total_amount: 131750 }
    ← Update localStorage với totalAmount từ API
  → User sees payment summary
```

### **5. View Booking History**
```
User opens Dashboard/Payment History
  → FE: useMasterDataSync() hook
    → API: GET /bookings (auto on login)
      → BE: BookingsController.GetBookings(userId)
        → DB: sp_get_user_booking_history
          ✅ Join với stations, invoices, vehicles
          ✅ Calculate totals
      ← Response: [ {...bookings...} ]
    ← Sync với localStorage
  → Stats calculated từ synced data
  → User sees accurate history
```

---

## 🧪 Test Cases

### **Test 1: Tạo booking mới**
1. Login với user có role `customer`
2. Chọn trạm sạc
3. Điền thông tin booking
4. Click "Đặt trạm"
5. ✅ Kiểm tra console: `📤 API Response: { bookingId: ... }`
6. ✅ Kiểm tra database: `SELECT * FROM bookings WHERE booking_id = ...`

### **Test 2: Complete booking flow**
1. Tạo booking mới (Test 1)
2. Scan QR code
3. Click "Bắt đầu sạc"
4. ✅ Kiểm tra: `SELECT status FROM bookings WHERE booking_id = ...` → `in_progress`
5. Wait for SOC tracking
6. Click "Dừng sạc"
7. ✅ Kiểm tra console: `✅ Booking completed via API`
8. ✅ Kiểm tra database:
   ```sql
   SELECT b.status, b.actual_end_time, i.total_amount
   FROM bookings b
   LEFT JOIN invoices i ON b.booking_id = i.booking_id
   WHERE b.booking_id = ...
   ```
   → `status = 'completed'`, `actual_end_time IS NOT NULL`, `total_amount > 0`

### **Test 3: Load bookings from database**
1. Login với user có bookings
2. Mở Dashboard
3. ✅ Kiểm tra console:
   ```
   📥 Loading user bookings from database...
   ✅ Loaded bookings from database: 20
   📊 Master Data Sync - Current stats: {...}
   ```
4. ✅ Verify stats match với database:
   ```sql
   SELECT COUNT(*) as total,
          SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
          SUM(i.total_amount) as totalAmount
   FROM bookings b
   LEFT JOIN invoices i ON b.booking_id = i.booking_id
   WHERE b.user_id = ...
   ```

---

## 🐛 Error Handling

### **Scenario 1: API fails during complete**
- ✅ Error logged: `❌ Error completing booking via API`
- ✅ Error thrown to caller
- ❌ Local state NOT updated (different from before)
- → User sees error message
- → Booking remains in "charging" status

### **Scenario 2: API requires staff role**
- ✅ Start API: Graceful fallback, continues with local update
- ✅ Complete API: Throws error, user must contact staff

### **Scenario 3: Database connection lost**
- ✅ `loadUserBookings()` fails silently
- ✅ App continues with localStorage data
- ✅ User sees last synced bookings

---

## 📝 Backend Requirements

### **Stored Procedures cần có:**
- ✅ `sp_create_booking` - Tạo booking mới
- ✅ `sp_complete_charging` - Hoàn thành charging
- ⚠️ `sp_start_charging` - (Optional) Start charging
- ✅ `sp_get_user_booking_history` - Get user bookings với joins

### **API Endpoints cần có:**
- ✅ `POST /bookings` - Create booking
- ✅ `GET /bookings` - Get user's bookings
- ✅ `PUT /bookings/{id}/start` - Start charging
- ✅ `PUT /bookings/{id}/complete` - Complete charging

---

## 🚀 Deployment Checklist

- [ ] Backup database trước khi deploy
- [ ] Test stored procedures trên DEV database
- [ ] Deploy backend API updates
- [ ] Deploy frontend code
- [ ] Test end-to-end flow
- [ ] Monitor logs cho errors
- [ ] Verify data consistency (localStorage vs Database)

---

## 📊 Monitoring

### **Console logs quan trọng:**
```
✅ Success logs:
📤 API Response: {...}
✅ Booking completed via API
✅ Loaded bookings from database: 20

❌ Error logs:
❌ Error completing booking via API
❌ Error loading user bookings
❌ Booking has no API ID
```

### **Database queries để verify:**
```sql
-- Check recent bookings
SELECT TOP 10 * FROM bookings 
WHERE user_id = @userId 
ORDER BY created_at DESC;

-- Check completed bookings with invoices
SELECT b.booking_id, b.status, b.actual_end_time, i.total_amount
FROM bookings b
LEFT JOIN invoices i ON b.booking_id = i.booking_id
WHERE b.user_id = @userId AND b.status = 'completed';

-- Check slot availability
SELECT station_id, COUNT(*) as available_slots
FROM charging_slots
WHERE status = 'available'
GROUP BY station_id;
```

---

## 🎯 Expected Results

Sau khi deploy, user flow sẽ là:

1. **Tạo booking** → ✅ Lưu vào database ngay lập tức
2. **Start charging** → ✅ Database status = 'in_progress'
3. **Complete charging** → ✅ Database status = 'completed' + invoice created
4. **View stats** → ✅ Stats được tính từ database data (synced qua API)
5. **Cross-device** → ✅ User thấy bookings trên mọi thiết bị (data từ database)

**🎉 No more localStorage-only data! Everything synced with database!**
