# 🧪 TEST FILTER TRẠNG THÁI TRẠM

## ✅ ĐÃ SỬA

### Vấn đề ban đầu:

- ❌ Filter theo trạng thái không tìm thấy trạm nào
- ❌ Database có status viết hoa: "Active", "Inactive", "Maintenance"
- ❌ Code filter so sánh exact match (case-sensitive)

### Giải pháp:

1. ✅ Cập nhật tất cả status trong DB về lowercase: "active", "inactive", "maintenance"
2. ✅ Thêm case-insensitive comparison trong filter logic
3. ✅ Bỏ option "Đang xây dựng" (không có trong DB constraint)
4. ✅ Cập nhật `getStatusChip()` để case-insensitive

---

## 📊 DỮ LIỆU TRONG DATABASE

```
Status      | Count | Trạm
------------|-------|--------------------------------------
active      | 25    | Trạm 6-30 (phần lớn)
inactive    | 3     | Trạm 1, 2, 3
maintenance | 2     | Trạm 4, 5
```

---

## 🔧 CODE CHANGES

### 1. Filter Logic (case-insensitive):

```javascript
const filteredStations = stationPerformance.filter((station) => {
  const matchesSearch =
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    station.location.address.toLowerCase().includes(searchQuery.toLowerCase());

  // Case-insensitive status comparison
  const stationStatus = (station.status || "").toLowerCase();
  const filterStatus = (statusFilter || "").toLowerCase();
  const matchesStatus =
    filterStatus === "all" || stationStatus === filterStatus;

  return matchesSearch && matchesStatus;
});
```

### 2. Status Chip (case-insensitive):

```javascript
const getStatusChip = (status) => {
  const statusLower = (status || "").toLowerCase();
  const configs = {
    active: { label: "Hoạt động", color: "success" },
    inactive: { label: "Không hoạt động", color: "error" },
    maintenance: { label: "Bảo trì", color: "warning" },
  };
  const config = configs[statusLower] || configs.inactive;
  return <Chip label={config.label} color={config.color} size="small" />;
};
```

### 3. Dropdown Options:

```javascript
<MenuItem value="all">Tất cả</MenuItem>
<MenuItem value="active">Hoạt động</MenuItem>
<MenuItem value="inactive">Không hoạt động</MenuItem>
<MenuItem value="maintenance">Bảo trì</MenuItem>
```

---

## 🧪 CÁCH TEST

### Bước 1: Đăng nhập Admin

- URL: http://localhost:5174
- Email: admin2@skaev.com
- Password: Admin@123

### Bước 2: Test Filter

#### Test 1: "Tất cả"

```
Expected: 30 trạm
Result: ✅ Hiển thị 30 trạm
```

#### Test 2: "Hoạt động"

```
Expected: 25 trạm (active)
Result: ✅ Hiển thị 25 trạm
Badge: [25 trạm]
```

#### Test 3: "Không hoạt động"

```
Expected: 3 trạm (inactive)
Stations: 1, 2, 3
Result: ✅ Hiển thị 3 trạm
Badge: [3 trạm]
```

#### Test 4: "Bảo trì"

```
Expected: 2 trạm (maintenance)
Stations: 4, 5
Result: ✅ Hiển thị 2 trạm
Badge: [2 trạm]
```

---

## 🎯 VERIFICATION

### SQL Query để verify:

```sql
-- Xem tất cả status
SELECT status, COUNT(*) as count
FROM charging_stations
GROUP BY status;

-- Xem trạm inactive
SELECT station_id, station_name, status
FROM charging_stations
WHERE status = 'inactive';

-- Xem trạm maintenance
SELECT station_id, station_name, status
FROM charging_stations
WHERE status = 'maintenance';
```

### PowerShell Test:

```powershell
# Kiểm tra status trong DB
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -Q `
  "SELECT status, COUNT(*) FROM charging_stations GROUP BY status" -W
```

---

## ✅ KẾT QUẢ

| Filter          | Expected | Actual  | Status  |
| --------------- | -------- | ------- | ------- |
| Tất cả          | 30 trạm  | 30 trạm | ✅ PASS |
| Hoạt động       | 25 trạm  | 25 trạm | ✅ PASS |
| Không hoạt động | 3 trạm   | 3 trạm  | ✅ PASS |
| Bảo trì         | 2 trạm   | 2 trạm  | ✅ PASS |

---

## 🔐 DATABASE CONSTRAINT

```sql
CHECK ([status]='maintenance' OR [status]='inactive' OR [status]='active')
```

Chỉ cho phép 3 giá trị lowercase:

- ✅ active
- ✅ inactive
- ✅ maintenance

---

## 📝 GHI CHÚ

1. **Case-sensitivity:** Tất cả so sánh giờ đều case-insensitive
2. **Database values:** Tất cả status đã được chuẩn hóa về lowercase
3. **UI Labels:** Hiển thị tiếng Việt rõ ràng
4. **Filter logic:** Hoạt động 100% với dữ liệu thật

---

**Status:** ✅ FIXED  
**Test Result:** ✅ ALL PASS  
**Last Updated:** 02/11/2025
