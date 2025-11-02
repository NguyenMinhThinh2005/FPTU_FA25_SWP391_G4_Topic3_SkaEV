# 🚀 HƯỚNG DẪN ĐĂNG NHẬP - SKAEV SYSTEM

## ✅ HỆ THỐNG ĐÃ SẴN SÀNG 100%

Tất cả các thành phần đã hoạt động:

- ✅ Backend API (Port 5000)
- ✅ Frontend (Port 5173)
- ✅ Database SQL Server
- ✅ Authentication System

---

## 🔐 TÀI KHOẢN TEST (Tất cả dùng password: **Admin@123**)

### 👨‍💼 ADMIN ACCOUNTS

```
Email: admin2@skaev.com
Password: Admin@123
Role: Admin
Dashboard: http://localhost:5173/admin/dashboard
```

```
Email: thinh@gmail.com
Password: Admin@123
Role: Admin
Dashboard: http://localhost:5173/admin/dashboard
```

### 👷 STAFF ACCOUNT

```
Email: staff@skaev.com
Password: Admin@123
Role: Staff
Dashboard: http://localhost:5173/staff/dashboard
```

### 👤 CUSTOMER ACCOUNTS

```
Email: customer@skaev.com
Password: Admin@123
Role: Customer
Dashboard: http://localhost:5173/customer/charging
```

```
Email: test@skaev.com
Password: Admin@123
Role: Customer
Dashboard: http://localhost:5173/customer/charging
```

---

## 📝 CÁCH ĐĂNG NHẬP

### Bước 1: Truy cập trang web

Mở trình duyệt và truy cập:

```
http://localhost:5173
```

### Bước 2: Click "Đăng nhập"

Ở góc trên bên phải màn hình

### Bước 3: Nhập thông tin

- **Email:** Chọn một trong các email ở trên
- **Password:** `Admin@123` (cho tất cả tài khoản)

### Bước 4: Click nút "Đăng nhập"

Hệ thống sẽ tự động chuyển bạn đến dashboard phù hợp với role

---

## 🎯 TEST NHANH

### Test Admin Dashboard

1. Login với: `admin2@skaev.com` / `Admin@123`
2. Tự động chuyển đến: `/admin/dashboard`
3. Có thể quản lý: Users, Stations, Bookings, Reports

### Test Staff Dashboard

1. Login với: `staff@skaev.com` / `Admin@123`
2. Tự động chuyển đến: `/staff/dashboard`
3. Có thể: Scan QR, Manage charging sessions

### Test Customer Dashboard

1. Login với: `customer@skaev.com` / `Admin@123`
2. Tự động chuyển đến: `/customer/charging`
3. Có thể: Book charging, View stations, Make payments

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backend phải đang chạy** (Port 5000)

   ```powershell
   # Kiểm tra backend
   netstat -ano | findstr ":5000"
   ```

2. **Frontend phải đang chạy** (Port 5173)

   ```powershell
   # Kiểm tra frontend
   netstat -ano | findstr ":5173"
   ```

3. **Database phải kết nối được**
   ```powershell
   # Test database
   sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -Q "SELECT @@VERSION"
   ```

---

## 🔧 KHỞI ĐỘNG LẠI HỆ THỐNG (Nếu cần)

### Khởi động Backend

```powershell
cd SkaEV.API
dotnet run
```

### Khởi động Frontend

```powershell
npm run dev
```

### Hoặc dùng script tự động

```powershell
.\start-all.ps1
```

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Invalid email or password"

- ✅ **Giải pháp:** Đảm bảo dùng đúng password `Admin@123` (viết hoa A)

### Lỗi: Không load được trang

- ✅ **Giải pháp:** Kiểm tra frontend đã chạy chưa
  ```powershell
  npm run dev
  ```

### Lỗi: Network error

- ✅ **Giải pháp:** Kiểm tra backend đã chạy chưa
  ```powershell
  cd SkaEV.API
  dotnet run
  ```

### Lỗi: Sau khi login không chuyển trang

- ✅ **Giải pháp:**
  1. Mở Console (F12)
  2. Xem lỗi trong tab Console
  3. Thử xóa cache và refresh (Ctrl+Shift+R)

---

## 📊 KIỂM TRA TRẠNG THÁI HỆ THỐNG

### Kiểm tra tổng quát

```powershell
# Test login API
$body = @{ email = "admin2@skaev.com"; password = "Admin@123" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

### Xem logs

```powershell
# Backend logs
Get-Content SkaEV.API\logs\skaev-*.txt -Tail 50

# Frontend console
# Mở browser -> F12 -> Console
```

---

## ✅ CHECKLIST TRƯỚC KHI ĐĂNG NHẬP

- [ ] Backend đang chạy (port 5000)
- [ ] Frontend đang chạy (port 5173)
- [ ] Database đã có dữ liệu test
- [ ] Biết tài khoản và password đúng
- [ ] Browser đã mở http://localhost:5173

---

## 🎉 KẾT LUẬN

**HỆ THỐNG ĐÃ SẴN SÀNG!**

Tất cả 5 tài khoản test đều hoạt động với password `Admin@123`:

- ✅ 2 Admin accounts
- ✅ 1 Staff account
- ✅ 2 Customer accounts

Chỉ cần mở trình duyệt, truy cập `http://localhost:5173` và đăng nhập!

---

**Last Updated:** 02/11/2025  
**Status:** ✅ ALL SYSTEMS OPERATIONAL
