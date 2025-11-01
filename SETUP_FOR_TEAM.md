# 🚀 Hướng Dẫn Setup Cho Các Thành Viên Team

## ⚠️ QUAN TRỌNG - ĐỌC KỸ TRƯỚC KHI BẮT ĐẦU!

Các file cấu hình cá nhân **KHÔNG** được push lên Git. Mỗi thành viên cần tạo file riêng cho máy của mình.

---

## 📋 Các Bước Setup

### 1️⃣ Clone Repository
```bash
git clone <repository-url>
cd FPTU_FA25_SWP391_G4_Topic3_SkaEV
```

### 2️⃣ Tạo File Cấu Hình Backend

#### Sao chép file template:
```powershell
# Trong thư mục gốc
cd SkaEV.API
copy appsettings.template.json appsettings.json
copy appsettings.SQLite.json.example appsettings.SQLite.json
```

#### Chỉnh sửa `appsettings.SQLite.json`:
Thay đổi connection string theo máy của bạn:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=TÊN_MÁY_CỦA_BẠN\\TÊN_INSTANCE;Database=SkaEV_DB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

**Ví dụ:**
- Nếu server của bạn là `LAPTOP123\SQLEXPRESS` thì điền:
  ```
  Server=LAPTOP123\\SQLEXPRESS;Database=SkaEV_DB;...
  ```
- Nếu dùng SQL Server mặc định (không có instance): 
  ```
  Server=LAPTOP123;Database=SkaEV_DB;...
  ```

### 3️⃣ Tạo Script Riêng (Nếu Cần)

Nếu bạn muốn tạo script riêng, đặt tên theo format: `my-script.ps1` hoặc `tên-của-bạn-script.ps1`

**Lưu ý:** Các script `.ps1` và `.bat` sẽ **KHÔNG** được track bởi Git.

### 4️⃣ Cài Đặt Dependencies

#### Frontend:
```bash
npm install
```

#### Backend:
```bash
cd SkaEV.API
dotnet restore
```

### 5️⃣ Setup Database
Xem file [SETUP_DATABASE.md](./SETUP_DATABASE.md) để biết chi tiết.

---

## ✅ Kiểm Tra Setup

### Test Backend:
```bash
cd SkaEV.API
dotnet run
```
Backend sẽ chạy tại: `https://localhost:7041`

### Test Frontend:
```bash
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

---

## 🔒 Các File KHÔNG Được Commit

Các file sau đây chỉ tồn tại trên máy cá nhân, **KHÔNG** push lên Git:

### Backend:
- ✗ `SkaEV.API/appsettings.json`
- ✗ `SkaEV.API/appsettings.Development.json`
- ✗ `SkaEV.API/appsettings.SQLite.json`
- ✗ `SkaEV.API/appsettings.*.json` (trừ template)

### Scripts:
- ✗ Tất cả file `.ps1`
- ✗ Tất cả file `.bat`

### Logs & Build:
- ✗ `logs/`
- ✗ `SkaEV.API/bin/`
- ✗ `SkaEV.API/obj/`
- ✗ `node_modules/`
- ✗ `dist/`

---

## 📝 File Template Được Commit

Các file này được dùng làm mẫu và **CÓ** trong Git:

- ✓ `SkaEV.API/appsettings.template.json`
- ✓ `SkaEV.API/appsettings.SQLite.json.example`
- ✓ `SETUP_GUIDE.md`
- ✓ `SETUP_DATABASE.md`

---

## ❓ Gặp Vấn Đề?

### Lỗi Connection String:
1. Kiểm tra tên server SQL Server của bạn
2. Đảm bảo SQL Server đang chạy
3. Kiểm tra authentication mode (Windows Authentication hoặc SQL Authentication)

### Lỗi Port đã được sử dụng:
- Thay đổi port trong `appsettings.json` hoặc `launchSettings.json`

### Cần Hỗ Trợ:
- Liên hệ các thành viên trong team
- Xem file README.md để biết thêm chi tiết

---

## 🎯 Checklist Trước Khi Push Code

- [ ] Kiểm tra `git status` - không có file config trong staged files
- [ ] Đã test code trên máy local
- [ ] Không commit file có connection string riêng
- [ ] Không commit file script cá nhân (.ps1, .bat)
- [ ] Code chạy được trên máy của bạn

---

**Chúc các bạn setup thành công! 🎉**
