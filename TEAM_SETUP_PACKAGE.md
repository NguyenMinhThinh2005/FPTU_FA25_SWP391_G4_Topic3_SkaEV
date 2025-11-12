# 📦 TEAM SETUP PACKAGE - Gói Cấu Hình Hoàn Chỉnh

**Ngày tạo:** 11/11/2025  
**Phiên bản:** 1.0  
**Mục đích:** Đảm bảo team pull code về không bị lỗi cấu hình

---

## 🎯 TÓM TẮT

Package này bao gồm **đầy đủ** các file cấu hình, hướng dẫn, và tài khoản test để team members có thể:
- ✅ Setup project trong 5 phút
- ✅ Không bị lỗi cấu hình khi pull code
- ✅ Biết chính xác file nào được commit, file nào không
- ✅ Có sẵn tài khoản test để đăng nhập ngay

---

## 📂 CẤU TRÚC FILES

### 🔵 FILES HƯỚNG DẪN (Đã commit)

#### 1. Hướng dẫn nhanh
- **[QUICK_START.md](./QUICK_START.md)** ⚡  
  → Setup trong 5 phút, chạy được ngay
  
- **[SETUP_FOR_TEAM.md](./SETUP_FOR_TEAM.md)** 📖  
  → Hướng dẫn chi tiết từng bước
  
- **[CONFIG_CHECKLIST.md](./CONFIG_CHECKLIST.md)** ✅  
  → Checklist trước khi push/pull code

#### 2. Thông tin quan trọng
- **[ACCOUNT_PASSWORDS.md](./ACCOUNT_PASSWORDS.md)** 🔐  
  → Tài khoản test: admin, staff, customer
  
- **[SETUP_DATABASE.md](./SETUP_DATABASE.md)** 💾  
  → Hướng dẫn setup database chi tiết

#### 3. File chính
- **[README.md](./README.md)** 📚  
  → Tổng quan project + links đến tất cả tài liệu

---

### 🟢 FILES MẪU (Templates - Đã commit)

#### Frontend
```
.env.example
```
**Nội dung:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENV=development
```

**Cách dùng:**
```bash
copy .env.example .env
# Chỉnh sửa .env nếu cần (thường không cần)
```

#### Backend
```
SkaEV.API/appsettings.template.json
```
**Nội dung:** Connection string mẫu

**Cách dùng:**
```bash
cd SkaEV.API
copy appsettings.template.json appsettings.json
# Sửa connection string theo SQL Server của bạn
```

---

### 🔴 FILES KHÔNG COMMIT (Local only)

**QUAN TRỌNG:** Các file này **PHẢI TẠO** trên máy local nhưng **KHÔNG** commit lên Git:

#### Frontend
- `.env` - Config thật của bạn

#### Backend
- `SkaEV.API/appsettings.json` - Config thật của bạn
- `SkaEV.API/appsettings.Development.json`

#### Scripts
- `*.ps1` (trừ file example)
- `*.bat` (trừ file example)

#### Build outputs
- `node_modules/`
- `dist/`
- `SkaEV.API/bin/`
- `SkaEV.API/obj/`

---

## 🚀 WORKFLOW CHUẨN

### 📥 Khi Pull Code Mới

```bash
# 1. Pull code
git pull origin main

# 2. Kiểm tra xem file config local còn không
ls .env
ls SkaEV.API/appsettings.json

# 3. Nếu mất, copy lại từ template
copy .env.example .env
copy SkaEV.API/appsettings.template.json SkaEV.API/appsettings.json

# 4. Update dependencies
npm install
cd SkaEV.API && dotnet restore && cd ..

# 5. Run migrations (nếu có thay đổi DB)
cd SkaEV.API
dotnet ef database update
cd ..

# 6. Test chạy
npm run dev          # Terminal 1
cd SkaEV.API && dotnet run  # Terminal 2
```

### 📤 Trước Khi Push Code

```bash
# 1. Kiểm tra git status
git status

# 2. ĐỪNG thấy các file này trong staged area:
# ❌ .env
# ❌ SkaEV.API/appsettings.json
# ❌ *.ps1 (trừ example)
# ❌ *.bat (trừ example)

# 3. Nếu vô tình staged, unstage ngay:
git restore --staged <file-name>

# 4. Verify lại
git status

# 5. Commit và push
git add .
git commit -m "Your commit message"
git push
```

---

## 🔑 TÀI KHOẢN TEST

### Đăng nhập tại: http://localhost:5173/login

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@skaev.com` | `Admin@123` |
| **Staff** | `staff@skaev.com` | `Admin@123` |
| **Customer** | `customer@skaev.com` | `Admin@123` |

**Chi tiết:** Xem file [ACCOUNT_PASSWORDS.md](./ACCOUNT_PASSWORDS.md)

---

## ⚙️ CẤU HÌNH MẶC ĐỊNH

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENV=development
```

### Backend (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER\\INSTANCE;Database=SkaEV_DB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

**Thay YOUR_SERVER\\INSTANCE bằng:**
- `localhost\\SQLEXPRESS` (SQL Express)
- `LAPTOP123\\SQLEXPRESS` (Tên máy của bạn)
- `localhost` (SQL Server default instance)

---

## 🛠️ TROUBLESHOOTING

### ❓ Làm sao biết SQL Server name?
```powershell
# Cách 1: SQL Server Management Studio
# Khi connect, copy chính xác tên server

# Cách 2: PowerShell
sqlcmd -L

# Cách 3: Check environment
echo $env:COMPUTERNAME
```

### ❓ Lỗi "Connection string not found"?
```bash
# Kiểm tra file config có tồn tại không
ls SkaEV.API/appsettings.json

# Nếu không có, copy từ template
copy SkaEV.API/appsettings.template.json SkaEV.API/appsettings.json
```

### ❓ Vô tình commit file .env?
```bash
# Unstage
git restore --staged .env

# Hoặc nếu đã commit
git reset HEAD~1
git restore --staged .env
```

### ❓ File config bị track bởi Git?
```bash
# Remove from tracking (giữ nguyên file local)
git rm --cached SkaEV.API/appsettings.json
git commit -m "Remove appsettings.json from tracking"
```

---

## ✅ VERIFICATION CHECKLIST

### Setup mới
- [ ] Đã copy `.env.example` → `.env`
- [ ] Đã copy `appsettings.template.json` → `appsettings.json`
- [ ] Đã sửa connection string theo SQL Server của mình
- [ ] `npm install` thành công
- [ ] `dotnet restore` thành công
- [ ] Backend chạy được: `dotnet run`
- [ ] Frontend chạy được: `npm run dev`
- [ ] Đăng nhập thành công với tài khoản test

### Trước khi push
- [ ] `git status` không có file config
- [ ] Code chạy được trên local
- [ ] Đã test với 3 tài khoản: admin, staff, customer
- [ ] Không commit sensitive data

---

## 📞 HỖ TRỢ

### Đọc tài liệu
1. [QUICK_START.md](./QUICK_START.md) - Setup nhanh
2. [SETUP_FOR_TEAM.md](./SETUP_FOR_TEAM.md) - Chi tiết
3. [CONFIG_CHECKLIST.md](./CONFIG_CHECKLIST.md) - Checklist
4. [ACCOUNT_PASSWORDS.md](./ACCOUNT_PASSWORDS.md) - Tài khoản

### Gặp vấn đề
- Check các file README
- Hỏi trong group chat
- Contact team lead

---

## 📊 THỐNG KÊ

**Files được commit:**
- 6 files hướng dẫn (.md)
- 2 files template (config mẫu)
- 1 file .gitignore (cập nhật)

**Files KHÔNG commit:**
- Config thật (.env, appsettings.json)
- Scripts cá nhân (.ps1, .bat)
- Build outputs (node_modules, dist, bin, obj)
- Logs và temporary files

**Tổng tài liệu:** 8 files markdown

---

## 🎉 KẾT LUẬN

Package này đảm bảo:
- ✅ **Zero configuration conflict** - Không conflict config khi pull
- ✅ **Quick onboarding** - Team mới join setup trong 5 phút
- ✅ **Clear separation** - Phân biệt rõ file commit vs local
- ✅ **Complete documentation** - Tài liệu đầy đủ cho mọi tình huống
- ✅ **Security** - Không leak sensitive data lên Git

**Happy coding! 🚀**

---

**Version:** 1.0  
**Last Updated:** 11/11/2025  
**Maintained by:** Development Team
