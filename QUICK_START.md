# 🚀 QUICK START - Setup trong 5 phút

## 📌 Yêu Cầu Hệ Thống
- Node.js 18+ 
- .NET 8 SDK
- SQL Server (Express hoặc Developer Edition)
- Git

---

## ⚡ Setup Nhanh

### 1️⃣ Clone & Install Dependencies

```bash
# Clone repo
git clone <repository-url>
cd FPTU_FA25_SWP391_G4_Topic3_SkaEV

# Install frontend
npm install

# Install backend
cd SkaEV.API
dotnet restore
cd ..
```

### 2️⃣ Cấu Hình Backend

```bash
# Copy file template
cd SkaEV.API
copy appsettings.template.json appsettings.json
```

**Chỉnh sửa `appsettings.json`:**
- Thay `YOUR_SERVER_NAME\\YOUR_INSTANCE` bằng server SQL của bạn
- Ví dụ: `LAPTOP123\\SQLEXPRESS` hoặc `localhost\\SQLEXPRESS`

### 3️⃣ Setup Database

```sql
-- Tạo database (chạy trong SQL Server Management Studio)
CREATE DATABASE SkaEV_DB;
GO
```

Sau đó:
```bash
# Chạy migrations
cd SkaEV.API
dotnet ef database update
```

Hoặc xem chi tiết tại: [SETUP_DATABASE.md](./SETUP_DATABASE.md)

### 4️⃣ Chạy Ứng Dụng

**Terminal 1 - Backend:**
```bash
cd SkaEV.API
dotnet run
```
→ API chạy tại: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
→ App chạy tại: `http://localhost:5173`

---

## 🔑 Đăng Nhập Test

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@skaev.com` | `Admin@123` |
| Staff | `staff@skaev.com` | `Admin@123` |
| Customer | `customer@skaev.com` | `Admin@123` |

**Chi tiết tài khoản:** Xem file [ACCOUNT_PASSWORDS.md](./ACCOUNT_PASSWORDS.md)

---

## 📂 Cấu Trúc Project

```
FPTU_FA25_SWP391_G4_Topic3_SkaEV/
├── src/                    # Frontend React + Vite
├── SkaEV.API/              # Backend .NET 8
├── database/               # SQL scripts
├── .env.example            # Frontend config mẫu
└── SkaEV.API/
    └── appsettings.template.json  # Backend config mẫu
```

---

## ⚠️ Lưu Ý Quan Trọng

### ❌ KHÔNG Commit Các File Sau:
- `.env` (frontend config của bạn)
- `SkaEV.API/appsettings.json` (backend config của bạn)
- `*.ps1`, `*.bat` (scripts cá nhân)
- `node_modules/`, `bin/`, `obj/`

### ✅ CÓ Trong Git:
- `.env.example` (file mẫu)
- `appsettings.template.json` (file mẫu)
- `SETUP_*.md` (hướng dẫn)

---

## 🆘 Gặp Lỗi?

### Lỗi Connection String
```
Kiểm tra tên SQL Server:
1. Mở SQL Server Management Studio
2. Khi connect, sao chép chính xác tên server
3. Dán vào appsettings.json
```

### Lỗi Port Đã Dùng
```bash
# Thay đổi port trong:
# - SkaEV.API/Properties/launchSettings.json (backend)
# - vite.config.js (frontend)
```

### Database Migration Lỗi
```bash
# Xóa migrations cũ
cd SkaEV.API
rm -rf Migrations/

# Tạo migration mới
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

## 📚 Tài Liệu Chi Tiết

- [SETUP_FOR_TEAM.md](./SETUP_FOR_TEAM.md) - Hướng dẫn setup đầy đủ
- [SETUP_DATABASE.md](./SETUP_DATABASE.md) - Setup database chi tiết
- [ACCOUNT_PASSWORDS.md](./ACCOUNT_PASSWORDS.md) - Tài khoản test
- [README.md](./README.md) - Tổng quan dự án

---

## ✅ Checklist Trước Khi Push

- [ ] `git status` - không có file config cá nhân
- [ ] Code chạy được trên máy local
- [ ] Đã test đăng nhập với 3 tài khoản
- [ ] Không commit `appsettings.json` hoặc `.env`

---

**Setup xong rồi? Bắt đầu code thôi! 🎉**
