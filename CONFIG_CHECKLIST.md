# ✅ CHECKLIST CẤU HÌNH - Cho Team Members

## 🎯 Mục Đích
File này giúp bạn kiểm tra nhanh xem đã cấu hình đúng chưa trước khi:
- Pull code mới về
- Push code lên
- Bàn giao cho thành viên khác

---

## 📋 CHECKLIST CẤU HÌNH

### ✅ Files Phải Có Trên Máy Local (KHÔNG push)

#### Frontend:
- [ ] `.env` - File config frontend riêng của bạn
  ```bash
  # Nội dung tối thiểu:
  VITE_API_BASE_URL=http://localhost:5000/api
  VITE_ENV=development
  ```

#### Backend:
- [ ] `SkaEV.API/appsettings.json` - File config backend riêng
  ```json
  {
    "ConnectionStrings": {
      "DefaultConnection": "Server=TÊN_MÁY_CỦA_BẠN\\INSTANCE;Database=SkaEV_DB;..."
    }
  }
  ```

---

### ✅ Files Template Phải Có Trong Git

- [x] `.env.example` - Mẫu config frontend
- [x] `SkaEV.API/appsettings.template.json` - Mẫu config backend
- [x] `QUICK_START.md` - Hướng dẫn setup nhanh
- [x] `SETUP_FOR_TEAM.md` - Hướng dẫn chi tiết
- [x] `ACCOUNT_PASSWORDS.md` - Thông tin tài khoản
- [x] `.gitignore` - Loại trừ files nhạy cảm

---

## 🚫 TRƯỚC KHI PUSH - Kiểm Tra

### 1. Chạy git status
```bash
git status
```

**KHÔNG được thấy:**
- ❌ `.env`
- ❌ `SkaEV.API/appsettings.json`
- ❌ `SkaEV.API/appsettings.Development.json`
- ❌ File `.ps1`, `.bat` (trừ các file example)
- ❌ `node_modules/`
- ❌ `SkaEV.API/bin/`, `SkaEV.API/obj/`

**Được phép thấy:**
- ✅ `.env.example`
- ✅ `SkaEV.API/appsettings.template.json`
- ✅ Source code (`.jsx`, `.cs`, `.sql`)
- ✅ Documentation (`.md`)

### 2. Kiểm tra files nhạy cảm
```bash
# Kiểm tra xem có file config trong staged area không
git diff --cached --name-only | grep -E "(appsettings\.json|\.env)$"

# Nếu có kết quả → NGUY HIỂM! Unstage ngay:
git restore --staged <tên-file>
```

### 3. Test code local
- [ ] Backend chạy được: `dotnet run` trong `SkaEV.API/`
- [ ] Frontend chạy được: `npm run dev`
- [ ] Đăng nhập thành công với tài khoản test

---

## 📥 SAU KHI PULL - Checklist

### 1. Kiểm tra files config
```bash
# Sau khi pull, kiểm tra xem file local config có bị ghi đè không
ls .env
ls SkaEV.API/appsettings.json
```

### 2. Nếu mất file config
```bash
# Copy lại từ template
copy .env.example .env
copy SkaEV.API/appsettings.template.json SkaEV.API/appsettings.json

# Chỉnh sửa lại connection string của bạn
```

### 3. Update dependencies
```bash
# Frontend
npm install

# Backend
cd SkaEV.API
dotnet restore
```

### 4. Migrate database (nếu có thay đổi)
```bash
cd SkaEV.API
dotnet ef database update
```

---

## 🔧 COMMON ISSUES

### Issue 1: "File appsettings.json bị tracked bởi Git"
**Nguyên nhân:** File đã được commit trước khi thêm vào `.gitignore`

**Giải pháp:**
```bash
# Xóa khỏi Git tracking (giữ nguyên file local)
git rm --cached SkaEV.API/appsettings.json

# Commit thay đổi
git commit -m "Remove appsettings.json from tracking"
```

### Issue 2: "Vô tình commit file .env"
**Giải pháp:**
```bash
# Nếu chưa push
git reset HEAD~1  # Undo commit
git restore --staged .env

# Nếu đã push
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

### Issue 3: "Connection string bị lộ"
**Giải pháp:**
```bash
# 1. Xóa file khỏi Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch SkaEV.API/appsettings.json" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (CHỈ làm nếu chắc chắn!)
git push origin --force --all

# 3. Đổi mật khẩu database nếu cần
```

---

## 📊 GIT IGNORE VERIFICATION

### Kiểm tra .gitignore hoạt động
```bash
# Test xem file có bị ignore không
git check-ignore -v .env
git check-ignore -v SkaEV.API/appsettings.json

# Kết quả mong đợi:
# .gitignore:50:.env    .env
# .gitignore:43:SkaEV.API/appsettings.json    SkaEV.API/appsettings.json
```

### List tất cả tracked files
```bash
# Xem files đang được Git track
git ls-files | grep -E "(appsettings|\.env)"

# Kết quả: KHÔNG được thấy appsettings.json hoặc .env
# Chỉ được thấy: appsettings.template.json, .env.example
```

---

## 🎓 BEST PRACTICES

### ✅ Nên Làm:
1. **Luôn copy từ template** khi setup mới
2. **Kiểm tra git status** trước mỗi commit
3. **Test local** trước khi push
4. **Backup config** của bạn ra ngoài repo
5. **Document** các thay đổi config mới

### ❌ Không Nên:
1. **Commit file config** có connection string thật
2. **Share password** qua Git
3. **Hardcode** thông tin nhạy cảm trong code
4. **Push** mà không test
5. **Ignore** warning của Git

---

## 📞 CONTACT

Gặp vấn đề? Hỏi trong group chat hoặc:
- Check file [SETUP_FOR_TEAM.md](./SETUP_FOR_TEAM.md)
- Check file [QUICK_START.md](./QUICK_START.md)
- Check file [ACCOUNT_PASSWORDS.md](./ACCOUNT_PASSWORDS.md)

---

**Last Updated:** 11/11/2025  
**Version:** 1.0
