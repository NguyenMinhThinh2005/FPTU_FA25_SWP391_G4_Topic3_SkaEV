# ✅ Driver Data Quick Verification Checklist

## 🎯 Mục tiêu

Đảm bảo 100% dữ liệu phần Driver (Customer) lấy từ database thông qua API

---

## 📋 Checklist - Kiểm tra từng bước

### ✅ Bước 1: Backend Verification

```bash
# Kiểm tra backend đang chạy
cd SkaEV.API
dotnet run

# Expected output:
# ✅ [INF] Starting SkaEV API...
# ✅ [INF] Environment: Development
# ✅ [INF] Backend is now running...
```

**Verify:**

- [ ] Backend chạy thành công
- [ ] Port: http://localhost:5000
- [ ] Database connection OK

---

### ✅ Bước 2: Database Verification

```sql
-- Kiểm tra các bảng quan trọng
USE SkaEV_DB;

-- 1. Users table
SELECT COUNT(*) AS TotalUsers FROM users WHERE role = 'customer';
-- Expected: > 0

-- 2. Bookings table
SELECT COUNT(*) AS TotalBookings FROM bookings;
-- Expected: > 0

-- 3. Vehicles table
SELECT COUNT(*) AS TotalVehicles FROM vehicles;
-- Expected: > 0

-- 4. Charging Sessions
SELECT COUNT(*) AS TotalSessions FROM charging_sessions;
-- Expected: >= 0

-- 5. Invoices
SELECT COUNT(*) AS TotalInvoices FROM invoices;
-- Expected: >= 0
```

**Verify:**

- [ ] User data exists
- [ ] Booking data exists
- [ ] Vehicle data exists
- [ ] Database structure correct

---

### ✅ Bước 3: API Endpoints Verification

Chạy test script tự động:

```bash
.\test-driver-data-integration.ps1
```

Hoặc test thủ công từng endpoint:

#### 3.1 Authentication

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"customer@skaev.com","password":"Customer@123"}'

# Expected:
# { "token": "...", "user": {...} }
```

- [ ] Login thành công
- [ ] Nhận được JWT token
- [ ] User data đúng

#### 3.2 User Profile

```bash
# Get Profile (cần token từ login)
$token = "YOUR_TOKEN_HERE"
curl -X GET http://localhost:5000/api/auth/profile `
  -H "Authorization: Bearer $token"

# Expected:
# { "userId": 1, "fullName": "...", "email": "..." }
```

- [ ] Profile data từ database
- [ ] Có đầy đủ thông tin

#### 3.3 Stations

```bash
# Get all stations
curl -X GET http://localhost:5000/api/stations `
  -H "Authorization: Bearer $token"

# Expected:
# { "data": [ {...stations...} ], "count": X }
```

- [ ] Stations list từ database
- [ ] Có location, power, status

#### 3.4 Bookings

```bash
# Get user bookings
curl -X GET http://localhost:5000/api/bookings `
  -H "Authorization: Bearer $token"

# Expected:
# { "data": [ {...bookings...} ], "count": X }
```

- [ ] Bookings từ database
- [ ] Có status, station info

#### 3.5 Vehicles

```bash
# Get user vehicles
curl -X GET http://localhost:5000/api/vehicles `
  -H "Authorization: Bearer $token"

# Expected:
# { "data": [ {...vehicles...} ] }
```

- [ ] Vehicles từ database
- [ ] Có brand, model, battery info

#### 3.6 Invoices

```bash
# Get user invoices
curl -X GET http://localhost:5000/api/invoices `
  -H "Authorization: Bearer $token"

# Expected:
# { "data": [ {...invoices...} ] }
```

- [ ] Invoices từ database
- [ ] Có amount, payment status

---

### ✅ Bước 4: Frontend Verification

#### 4.1 Khởi động Frontend

```bash
npm run dev
```

- [ ] Frontend chạy thành công
- [ ] Port: http://localhost:5173

#### 4.2 Test Login

```
1. Mở http://localhost:5173/login
2. Nhập: customer@skaev.com / Customer@123
3. Click Login
```

- [ ] Login thành công
- [ ] Redirect to /customer/dashboard
- [ ] Token được lưu

#### 4.3 Test Dashboard

```
Vào: /customer/dashboard
```

**Check:**

- [ ] Hiển thị user name từ DB
- [ ] Monthly stats từ bookings real
- [ ] Recent bookings từ DB
- [ ] Không có mock data

#### 4.4 Test Charging Flow

```
Vào: /customer/charging
```

**Check:**

- [ ] Stations list từ DB
- [ ] Real-time availability
- [ ] Map hiển thị đúng vị trí
- [ ] Có thể tạo booking → POST API

#### 4.5 Test Booking History

```
Vào: /customer/history
```

**Check:**

- [ ] Bookings từ DB
- [ ] Total cost tính từ real data
- [ ] Total energy từ sessions
- [ ] Có thể xem chi tiết

#### 4.6 Test Profile

```
Vào: /customer/profile
```

**Check:**

- [ ] Profile data từ DB
- [ ] Vehicles list từ DB
- [ ] Charging stats từ bookings
- [ ] Có thể update → PUT API

#### 4.7 Test Analytics

```
Vào: /customer/analytics
```

**Check:**

- [ ] Monthly reports từ invoices
- [ ] Charging habits từ sessions
- [ ] Charts hiển thị real data
- [ ] Statistics chính xác

---

### ✅ Bước 5: Data Flow Verification

#### Test End-to-End Flow:

```
1. Login ✅
   → API call to /auth/login
   → Response với user từ DB

2. View Dashboard ✅
   → Hiển thị stats từ bookings DB

3. Find Station ✅
   → API call to /stations/nearby
   → Map với stations từ DB

4. Create Booking ✅
   → API call to POST /bookings
   → Tạo booking trong DB
   → Verify: SELECT * FROM bookings ORDER BY created_at DESC

5. View History ✅
   → API call to /bookings
   → Hiển thị booking vừa tạo

6. View Analytics ✅
   → Stats tính từ DB data
```

**Final Verification:**

- [ ] Mỗi page gọi API
- [ ] API query database
- [ ] Frontend hiển thị data từ API
- [ ] Không có hardcoded/mock data

---

### ✅ Bước 6: Console Verification

#### Backend Console (dotnet run):

```
Expected logs:
✅ [INF] Executing endpoint 'GET /api/bookings'
✅ [INF] Entity Framework query: SELECT * FROM bookings...
✅ [INF] Returned 15 bookings
```

- [ ] Thấy SQL queries
- [ ] Queries đúng bảng
- [ ] Return real data

#### Frontend Console (Browser DevTools):

```
Expected:
✅ API call: GET http://localhost:5000/api/bookings
✅ Response: { data: [...real data...], count: 15 }
✅ Store updated with real data
```

- [ ] Network tab: API calls thành công
- [ ] Response có data từ DB
- [ ] Console không có errors

---

## 📊 Final Checklist Summary

### Database Layer:

- [ ] ✅ Tables exist and have data
- [ ] ✅ Stored procedures work
- [ ] ✅ Views return correct data

### Backend Layer:

- [ ] ✅ Controllers respond correctly
- [ ] ✅ Services query database
- [ ] ✅ Authentication works
- [ ] ✅ Authorization enforced

### Frontend Layer:

- [ ] ✅ API services defined
- [ ] ✅ Stores use real API
- [ ] ✅ Pages display real data
- [ ] ✅ No mock data usage

### Integration:

- [ ] ✅ API calls successful
- [ ] ✅ Data flows correctly
- [ ] ✅ Real-time updates work
- [ ] ✅ Error handling proper

---

## 🎯 Expected Result

**Khi tất cả checklist ✅:**

- Frontend hiển thị 100% data từ database
- Không có mock data
- API calls hoạt động bình thường
- Data flow: DB → API → Store → Component

**Nếu có item ❌:**

1. Check backend logs
2. Check browser console
3. Check database connection
4. Review DRIVER_DATA_VERIFICATION_REPORT.md

---

## 🚀 Quick Test Command

**Run all tests at once:**

```bash
.\test-driver-data-integration.ps1
```

**Expected output:**

```
🧪 DRIVER DATA INTEGRATION TEST
========================================
Testing: POST /auth/login... ✅ PASS
Testing: GET /auth/profile... ✅ PASS
Testing: GET /stations... ✅ PASS
Testing: GET /bookings... ✅ PASS
Testing: GET /vehicles... ✅ PASS
Testing: GET /invoices... ✅ PASS
...

🎯 TEST RESULTS SUMMARY
Total Tests: 10
Passed: 10
Failed: 0
Pass Rate: 100%

✅ ALL TESTS PASSED! Driver data is 100% from database!
```

---

**Report:** `DRIVER_DATA_VERIFICATION_REPORT.md`  
**Test Script:** `test-driver-data-integration.ps1`  
**Status:** Ready for verification ✅
