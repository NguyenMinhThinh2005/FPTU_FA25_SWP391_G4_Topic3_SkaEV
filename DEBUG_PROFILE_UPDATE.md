# 🐛 Debug: Dữ liệu bị mất sau khi reload

## ✅ Đã sửa

### Vấn đề
Khi cập nhật thông tin và reload trang (F5), dữ liệu mới không hiển thị, quay về dữ liệu cũ.

### Nguyên nhân
1. `authStore` lưu vào sessionStorage qua Zustand persist
2. Khi reload, `authUser` được load từ sessionStorage
3. Nếu `updateAuthProfile()` không persist đúng, dữ liệu mới sẽ mất

### Giải pháp đã áp dụng

#### 1. Thêm log chi tiết
```javascript
console.log("🔄 Updating authStore with:", updatedUserData);
console.log("✓ AuthStore after update:", currentUser);
console.log("📋 Loading profile - Auth User from store:", authUser);
console.log("✓ Parsing name from:", authUser.full_name);
```

#### 2. Sử dụng useCallback
```javascript
const loadStaffProfile = useCallback(async () => {
  // ... load logic
}, [authUser]);
```

#### 3. Auto-reload khi authUser thay đổi
```javascript
useEffect(() => {
  loadStaffProfile();
}, [loadStaffProfile]);
```

---

## 🧪 Cách test

### Test 1: Kiểm tra Console Log

**Bước 1**: Mở Console (F12)

**Bước 2**: Vào `/staff/profile`, quan sát log:
```
📋 Loading profile - Auth User from store: {user_id: 123, full_name: "Thành Đạt", ...}
✓ Parsing name from: Thành Đạt
✓ Parsed - firstName: Thành lastName: Đạt
```

**Bước 3**: Nhấn "Chỉnh sửa", thay đổi tên thành "Nguyễn Thành Đạt Updated"

**Bước 4**: Nhấn "Lưu", quan sát log:
```
💾 Saving profile data: {fullName: "Nguyễn Thành Đạt Updated", phoneNumber: "..."}
✅ Profile updated: {data: {...}}
🔄 Updating authStore with: {full_name: "Nguyễn Thành Đạt Updated", ...}
✓ AuthStore after update: {user_id: 123, full_name: "Nguyễn Thành Đạt Updated", ...}
```

**Bước 5**: Reload trang (F5), quan sát log:
```
📋 Loading profile - Auth User from store: {user_id: 123, full_name: "Nguyễn Thành Đạt Updated", ...}
✓ Parsing name from: Nguyễn Thành Đạt Updated
✓ Parsed - firstName: Nguyễn Thành lastName: Đạt Updated
```

✅ **Nếu log hiển thị đúng dữ liệu mới → authStore đã persist thành công**

---

### Test 2: Kiểm tra sessionStorage

**Bước 1**: Mở DevTools > Application > Session Storage > `http://localhost:3000`

**Bước 2**: Tìm key `skaev-auth-storage`

**Bước 3**: Xem value, tìm `user.full_name`:
```json
{
  "state": {
    "user": {
      "user_id": 123,
      "full_name": "Nguyễn Thành Đạt Updated",
      "phone_number": "0987654321",
      ...
    },
    "isAuthenticated": true
  },
  "version": 0
}
```

✅ **Nếu full_name trong sessionStorage là dữ liệu mới → Persist thành công**

❌ **Nếu full_name vẫn là dữ liệu cũ → Vấn đề ở updateAuthProfile()**

---

### Test 3: Kiểm tra Database

**Bước 1**: Chạy SQL script `test-profile-update.sql`

**Bước 2**: So sánh kết quả TRƯỚC và SAU update:

TRƯỚC:
```
FullName: 'Thành Đạt'
PhoneNumber: '0000000000'
```

SAU:
```
FullName: 'Nguyễn Thành Đạt Updated'
PhoneNumber: '0987654321'
UpdatedAt: 2025-11-10 10:30:45 (vừa mới)
```

✅ **Nếu database cập nhật → Backend OK**

---

### Test 4: Kiểm tra đồng bộ Admin

**Bước 1**: Sau khi Staff update, đăng nhập Admin

**Bước 2**: Vào User Management, tìm staff user

**Bước 3**: Kiểm tra FullName và PhoneNumber

✅ **Phải hiển thị dữ liệu mới giống Staff**

---

## 🔍 Troubleshooting

### Case 1: Console log shows old data after reload

**Triệu chứng**:
```
📋 Loading profile - Auth User from store: {full_name: "Thành Đạt", ...}
```

**Nguyên nhân**: authStore không persist dữ liệu mới

**Giải pháp**:
1. Kiểm tra `updateAuthProfile()` có được gọi không
2. Kiểm tra Zustand persist middleware config
3. Xem sessionStorage có cập nhật không

---

### Case 2: sessionStorage shows old data

**Triệu chứng**: sessionStorage vẫn là dữ liệu cũ sau khi lưu

**Nguyên nhân**: `updateAuthProfile()` không trigger persist

**Giải pháp**:
```javascript
// Kiểm tra authStore.js - updateProfile function
updateProfile: (profileData) => {
  const currentUser = get().user;
  if (currentUser) {
    set({
      user: {
        ...currentUser,
        ...profileData,  // ← Đảm bảo merge đúng
      },
    });
  }
},
```

---

### Case 3: Database updated but UI shows old data

**Triệu chứng**: Database có dữ liệu mới nhưng UI vẫn cũ

**Nguyên nhân**: Frontend cache dữ liệu cũ trong authStore

**Giải pháp**:
1. Clear sessionStorage: `sessionStorage.clear()`
2. Đăng nhập lại
3. Hoặc fix code để force reload từ API

---

## 📝 Checklist Debug

- [ ] Console log hiển thị dữ liệu mới sau khi lưu
- [ ] Console log hiển thị dữ liệu mới sau khi reload
- [ ] sessionStorage chứa dữ liệu mới
- [ ] Database chứa dữ liệu mới
- [ ] Admin thấy dữ liệu mới
- [ ] UI hiển thị dữ liệu mới ngay sau khi lưu
- [ ] UI hiển thị dữ liệu mới sau khi F5

---

## 🎯 Expected Behavior

1. **Sau khi nhấn "Lưu"**:
   - ✅ Thông báo "Thông tin đã được cập nhật thành công!"
   - ✅ Tên và số điện thoại mới hiển thị ngay
   - ✅ authStore được cập nhật
   - ✅ sessionStorage được cập nhật

2. **Sau khi Reload (F5)**:
   - ✅ authStore load từ sessionStorage
   - ✅ `loadStaffProfile()` parse dữ liệu từ authStore
   - ✅ UI hiển thị dữ liệu mới

3. **Admin xem user**:
   - ✅ Thấy dữ liệu mới (cùng database)

---

## 🚨 Nếu vẫn bị lỗi

Hãy gửi cho tôi:
1. Console log đầy đủ (từ lúc vào trang đến lúc lưu đến lúc reload)
2. Screenshot sessionStorage
3. Kết quả SQL query từ `test-profile-update.sql`
