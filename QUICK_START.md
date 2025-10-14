# 🚀 Quick Start Guide - Chạy Local Nhanh

**Cập nhật:** 13/10/2025  
**Frontend đã migrate sang Real API - Không dùng mock data**

---

## ⚡ Chạy Trong 5 Phút

### Bước 1: Kiểm Tra Yêu Cầu (30 giây)

```powershell
# Check .NET SDK
dotnet --version  # Cần: 8.0.x

# Check Node.js
node --version    # Cần: 18.x hoặc cao hơn
npm --version     # Cần: 9.x hoặc cao hơn

# Check SQL Server
Get-Service -Name "MSSQL*" | Select-Object Name, Status
# Phải thấy: MSSQLSERVER - Running
```

**✅ Nếu OK:** Tiếp tục bước 2  
**❌ Nếu thiếu:** Xem file `LOCAL_SETUP_GUIDE.md` để cài đặt

---

### Bước 2: Setup Database (1-2 phút)

```powershell
# Mở PowerShell hoặc CMD tại thư mục project
cd "d:\University\SWP\FPTU_FA25_SWP391_G4_Topic3_SkaEV"

# Chạy script tạo database
cd database
sqlcmd -S localhost -E -i DEPLOY_COMPLETE.sql

# Quay lại root folder
cd ..
```

**Kiểm tra thành công:**
```powershell
sqlcmd -S localhost -Q "SELECT name FROM sys.databases WHERE name = 'SkaEV_DB'"
# Phải thấy: SkaEV_DB
```

---

### Bước 3: Chạy Backend (1 phút)

**Terminal 1 - Backend:**
```powershell
cd SkaEV.API
dotnet restore
dotnet run
```

**Đợi đến khi thấy:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5001
```

**Test Backend:**
- Mở browser: **https://localhost:5001/swagger**
- Bạn sẽ thấy Swagger UI với danh sách API

---

### Bước 4: Chạy Frontend (1 phút)

**Terminal 2 - Frontend (terminal mới, giữ backend chạy):**
```powershell
# Quay lại root folder
cd d:\University\SWP\FPTU_FA25_SWP391_G4_Topic3_SkaEV

# Install dependencies (chỉ lần đầu)
npm install

# Start frontend
npm run dev
```

**Đợi đến khi thấy:**
```
➜  Local:   http://localhost:5173/
```

**Mở browser:** **http://localhost:5173**

---

### Bước 5: Test Hoạt Động (1 phút)

1. **Register Account:**
   - Email: `test@example.com`
   - Password: `Test@123456`
   - Name: `Test User`

2. **Login:** Dùng tài khoản vừa tạo

3. **Mở DevTools (F12):**
   - Console tab: Xem logs
   - Network tab: Xem API calls
   - Phải thấy: `POST https://localhost:5001/api/auth/login` → 200 OK

4. **Check localStorage:**
   ```javascript
   localStorage.getItem('token')  // Phải có JWT token
   ```

**✅ Nếu thấy token và không có lỗi → Setup thành công!**

---

## 🎯 Workflow Làm Việc Hàng Ngày

### Mỗi Lần Bắt Đầu Code:

**Terminal 1 - Backend:**
```powershell
cd d:\University\SWP\FPTU_FA25_SWP391_G4_Topic3_SkaEV\SkaEV.API
dotnet run
```

**Terminal 2 - Frontend:**
```powershell
cd d:\University\SWP\FPTU_FA25_SWP391_G4_Topic3_SkaEV
npm run dev
```

**VS Code:** Mở folder project, edit code, auto-save sẽ trigger hot reload

---

## 🔧 Scripts Tiện Ích

### Windows PowerShell Scripts (đã có sẵn):

**Backend:**
```powershell
.\run-backend.ps1        # Chạy backend
.\SkaEV.API\start-api.ps1  # Hoặc chạy script trong API folder
```

**Frontend:**
```powershell
.\run-frontend.ps1       # Chạy frontend
```

**Database:**
```powershell
.\database\deploy-db-simple.ps1  # Deploy database
```

---

## 🐛 Lỗi Thường Gặp

### ❌ "Cannot connect to SQL Server"
```powershell
# Kiểm tra SQL Server đang chạy
Get-Service -Name "MSSQLSERVER" | Start-Service

# Nếu dùng SQL Express
Get-Service -Name "MSSQL$SQLEXPRESS" | Start-Service
```

### ❌ "Port 5001 already in use"
```powershell
# Tìm process đang dùng port
netstat -ano | findstr :5001

# Kill process (thay PID bằng số từ kết quả trên)
taskkill /F /PID 12345
```

### ❌ "CORS policy blocked"
```
✅ Backend phải chạy TRƯỚC frontend
✅ Backend phải ở https://localhost:5001
✅ Frontend phải ở http://localhost:5173
```

### ❌ "401 Unauthorized"
```javascript
// Xóa token cũ và login lại
localStorage.clear()
// Reload page và login lại
```

### ❌ Frontend lỗi "ERR_CONNECTION_REFUSED"
```
→ Backend chưa chạy! Start backend trước.
```

---

## 📊 Ports & URLs

| Service | URL | Mô tả |
|---------|-----|-------|
| Frontend | http://localhost:5173 | React + Vite dev server |
| Backend HTTP | http://localhost:5000 | ASP.NET Core API |
| Backend HTTPS | https://localhost:5001 | ASP.NET Core API (SSL) |
| Swagger | https://localhost:5001/swagger | API Documentation |
| Health Check | https://localhost:5001/health | API Health Status |
| Database | localhost:1433 | SQL Server default port |

---

## 📝 Test Data

### Admin Account:
```sql
-- Chạy trong SSMS hoặc Azure Data Studio
USE SkaEV_DB;

-- Tạo admin (password: Admin@123)
EXEC sp_create_user 
    @email = 'admin@skaev.com',
    @password = 'Admin@123',
    @full_name = 'Admin User',
    @phone_number = '0901234567',
    @role = 'admin';
```

### Charging Station Mẫu:
```sql
-- Trạm FPTU HCM
INSERT INTO charging_stations (
    station_name, address, city, 
    latitude, longitude, 
    total_posts, available_posts, 
    operating_hours, status
)
VALUES (
    'FPTU HCM Charging Station',
    'Lô E2a-7, D1, Long Thạnh Mỹ, Thủ Đức, HCM',
    'Ho Chi Minh City',
    10.8411276, 106.8097910,
    4, 4,
    '24/7', 'active'
);
```

---

## 🎯 Feature Testing Checklist

Sau khi setup, test các tính năng:

- [ ] **Register** - Tạo tài khoản mới
- [ ] **Login** - Đăng nhập
- [ ] **View Stations** - Xem danh sách trạm sạc
- [ ] **Search Nearby** - Tìm trạm gần (cần GPS)
- [ ] **Create Booking** - Đặt lịch sạc
- [ ] **QR Scan** - Quét mã QR (cần camera)
- [ ] **Start Charging** - Bắt đầu sạc
- [ ] **Monitor SOC** - Theo dõi % pin
- [ ] **Stop Charging** - Dừng sạc
- [ ] **View History** - Xem lịch sử
- [ ] **Submit Review** - Đánh giá trạm

---

## 🚀 Production Build

### Build Frontend cho Production:
```powershell
npm run build
# Output: dist/ folder

# Preview production build
npm run preview
```

### Build Backend cho Production:
```powershell
cd SkaEV.API
dotnet publish -c Release -o ./publish
```

---

## 📚 Tài Liệu Chi Tiết

- **Setup đầy đủ:** `LOCAL_SETUP_GUIDE.md`
- **API Documentation:** `API_DOCUMENTATION.md`
- **Database Schema:** `DATABASE_BACKEND_COMPATIBILITY.md`
- **Migration Status:** `MIGRATION_STATUS.md`

---

## 💡 Tips

1. **Dùng 2 terminals:** 1 cho backend, 1 cho frontend
2. **Keep Swagger open:** Test API nhanh hơn
3. **Check DevTools Console:** Debug frontend errors
4. **Check Backend Logs:** `SkaEV.API/logs/skaev-*.txt`
5. **Use React DevTools:** Debug React components
6. **Use SQL Profiler:** Debug SQL queries

---

## 🆘 Cần Giúp Đỡ?

1. Check `LOCAL_SETUP_GUIDE.md` → Section "Troubleshooting"
2. Check backend logs: `SkaEV.API/logs/`
3. Check browser console: F12 → Console tab
4. Test API trực tiếp: Swagger UI
5. Check database: SSMS hoặc Azure Data Studio

---

**✨ Happy Coding! 🚀**

**Updated:** 13/10/2025
