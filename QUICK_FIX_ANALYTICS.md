# 🚀 QUICK FIX: Analytics Real Data

## ⚡ TL;DR (Too Long; Didn't Read)

Analytics đang show số liệu random vì backend chưa kết nối database. Đã fix xong, chạy 1 command để test:

```powershell
.\fix-and-test-analytics.ps1
```

Done! ✅

---

## 📝 Chi Tiết (Nếu Script Lỗi)

### Bước 1: Tạo Sample Data

```powershell
cd database
.\create-sample-analytics-data.ps1
cd ..
```

### Bước 2: Restart Backend

```powershell
# Stop old backend
Stop-Process -Name "SkaEV.API" -Force -ErrorAction SilentlyContinue

# Rebuild
cd SkaEV.API
dotnet clean
dotnet build
dotnet run
```

Backend sẽ chạy tại: `http://localhost:5295`

### Bước 3: Test APIs

Mở terminal mới:

```powershell
.\test-analytics-real-data.ps1
```

**Expected:**

```
✅ Revenue API: Data count: 15
✅ Usage API: Data count: 12
✅ Performance API: Data count: 5
```

### Bước 4: Test Frontend

```powershell
npm run dev
```

1. Mở: `http://localhost:5173`
2. Login: `admin@ska.vn` / `Admin@123`
3. Go to: **Advanced Analytics**

**✅ PASS nếu:**

- Số liệu KHÔNG thay đổi khi refresh
- Không có warning "dữ liệu mẫu"

**❌ FAIL nếu:**

- Số liệu thay đổi liên tục
- Có warning "Đang sử dụng dữ liệu mẫu để demo"

---

## 🐛 Fix Nếu Vẫn Show Mock Data

### Kiểm tra backend có data không:

```powershell
$token = (Invoke-RestMethod -Uri http://localhost:5295/api/auth/login -Method POST -Body (@{email="admin@ska.vn"; password="Admin@123"} | ConvertTo-Json) -ContentType "application/json").data.token

Invoke-RestMethod -Uri "http://localhost:5295/api/admin/AdminReports/revenue?year=2025" -Headers @{Authorization="Bearer $token"}
```

**Nếu trả về `data: []` (empty):**

1. Check database có invoices không:

```sql
SELECT COUNT(*) FROM invoices WHERE payment_status = 'paid';
-- Nếu = 0, chạy lại: .\database\create-sample-analytics-data.ps1
```

2. Check backend logs:

```powershell
# Backend console sẽ show SQL queries hoặc errors
```

**Nếu trả về data (count > 0) nhưng frontend vẫn mock:**

- Clear browser cache (Ctrl+Shift+Del)
- Hard refresh (Ctrl+F5)
- Check console (F12) có errors không

---

## 📋 Checklist

- [ ] SQL Server đang chạy
- [ ] Database "Ska_EV" tồn tại
- [ ] Sample data đã được tạo (100 bookings)
- [ ] Backend build thành công
- [ ] Backend running trên port 5295
- [ ] APIs trả về data (count > 0)
- [ ] Frontend không show mock data warning
- [ ] Số liệu không đổi khi refresh

---

## 📖 Đọc Thêm

- **TEST_ANALYTICS_COMPLETE.md** - Hướng dẫn test đầy đủ
- **ANALYTICS_FIX_SUMMARY.md** - Technical summary
- **test-analytics-real-data.ps1** - API test script

---

## 🆘 Nếu Vẫn Không Được

Cung cấp:

1. Output của `.\test-analytics-real-data.ps1`
2. Backend console output
3. Frontend console errors (F12)
4. Screenshot màn hình Advanced Analytics

Hoặc đọc detailed guide: `TEST_ANALYTICS_COMPLETE.md`
