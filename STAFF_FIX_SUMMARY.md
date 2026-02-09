# 🔧 SỬA LỖI API CHO STAFF DASHBOARD

## ✅ ĐÃ KHẮC PHỤC

### 1. **Vấn đề Token Storage**
- ❌ **Trước:** axiosConfig đọc token từ `localStorage`
- ✅ **Sau:** axiosConfig đọc token từ `sessionStorage` (khớp với authStore)

### 2. **Backend API**
- ✅ Backend đang chạy trên: `http://localhost:5000`
- ✅ Endpoint Staff Dashboard: `GET /api/staff/dashboard`
- ✅ Yêu cầu Authorization: `Bearer {token}`

### 3. **Dashboard Testing**
- ✅ Tạo file `DashboardSimple.jsx` để test API
- ✅ Hiển thị debug info và raw data từ API

## 🚀 CÁCH TEST

### Bước 1: Đảm bảo Backend đang chạy
```bash
# Kiểm tra port 5000
netstat -ano | findstr :5000

# Nếu không chạy, mở cửa sổ CMD mới và chạy:
cd D:\llll\ky5\SWP\prj1\FPTU_FA25_SWP391_G4_Topic3_SkaEV\SkaEV.API
dotnet run
```

### Bước 2: Đăng xuất và đăng nhập lại
1. Mở http://localhost:5173
2. Đăng xuất (nếu đang đăng nhập)
3. Đăng nhập lại với:
   - **Email:** staff@skaev.com
   - **Password:** Admin@123

### Bước 3: Test Dashboard
1. Sau khi đăng nhập, sẽ tự động chuyển đến Staff Dashboard
2. Dashboard sẽ hiển thị:
   - Loading spinner trong khi tải dữ liệu
   - Raw JSON data từ API
   - Thông tin trạm sạc (nếu có)
   - Thông tin nhân viên

### Bước 4: Kiểm tra Console
Mở F12 → Console, sẽ thấy:
```
🔄 Loading dashboard...
👤 Current user: {...}
🔑 Token: eyJhbG...
✅ Dashboard data: {...}
```

## 🔍 DEBUG CHECKLIST

Nếu vẫn lỗi 404:
- [ ] Backend API có chạy không? (netstat -ano | findstr :5000)
- [ ] Token có trong sessionStorage không? (F12 → Application → Session Storage)
- [ ] Token có hợp lệ không? (jwt.io để decode)
- [ ] User role có đúng là "staff" không?

Nếu lỗi 401:
- [ ] Token đã hết hạn? → Đăng nhập lại
- [ ] Token có đúng format Bearer không?
- [ ] Staff account có active không?

## 📝 FILES ĐÃ SỬA

1. ✅ `src/services/axiosConfig.js` - Sửa token storage
2. ✅ `src/pages/staff/Dashboard.jsx` - Thêm import staffAPI
3. ✅ `src/pages/staff/DashboardSimple.jsx` - Tạo mới (để test)

## 🎯 TIẾP THEO

Sau khi Dashboard chạy được, sẽ sửa tiếp:
- [ ] Monitoring page
- [ ] Charging Sessions page
- [ ] Station Management page
