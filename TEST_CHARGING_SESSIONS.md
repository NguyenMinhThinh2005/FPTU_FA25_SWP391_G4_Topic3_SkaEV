# 🧪 Test Trang "Quản lý Phiên sạc (Trực tiếp)"

## ✅ Đã hoàn thành

### 1. **Liên kết với Dashboard API**
- ✅ Load dữ liệu từ `GET /api/staff/dashboard`
- ✅ Extract thông tin từ `connectors` array
- ✅ Hiển thị tất cả connectors (cả đang sạc và trống)

### 2. **Dữ liệu Customer được hiển thị**

Backend đã cung cấp các trường sau trong `activeSession`:

```json
{
  "bookingId": 123,
  "customerId": 5,
  "customerName": "Nguyễn Văn A",     // ← TÊN KHÁCH HÀNG
  "vehicleInfo": "VinFast VF8 - 29A-12345",  // ← THÔNG TIN XE
  "startedAt": "2025-11-10T14:30:00Z",
  "currentSoc": 65,                    // ← % PIN HIỆN TẠI
  "power": 22.5,                       // ← CÔNG SUẤT (kW)
  "energyDelivered": 15.8              // ← NĂNG LƯỢNG ĐÃ SẠC (kWh)
}
```

### 3. **Các cột hiển thị trên bảng**

| Cột | Dữ liệu hiển thị | Nguồn API |
|-----|------------------|-----------|
| **Mã phiên** | `#123` hoặc `N/A` | `activeSession.bookingId` |
| **Điểm sạc** | `CON-01` <br> `CCS2 (22kW)` | `connectorCode` <br> `connectorType` + `maxPower` |
| **Trạng thái** | Chip màu: Đang sạc / Sẵn sàng / Lỗi | `operationalStatus` |
| **Thời gian Bắt đầu** | `10/11/2025, 14:30` | `activeSession.startedAt` |
| **Thời gian Đã sạc** | `2h 30m` | Tính toán từ `startedAt` đến hiện tại |
| **Năng lượng (kWh)** | `15.80 kWh` | `activeSession.energyDelivered` |
| **Phí (₫)** | `47,400 ₫` | `energyDelivered × 3000` (giá demo) |
| **TT Status** | Đang sử dụng / Trống | Dựa vào `activeSession != null` |
| **Phương thức TT** | `Thanh toán sau` | Hardcoded (demo) |
| **Thao tác** | Button "Chi tiết" | Click → hiện thông tin customer |

---

## 🧪 Cách test

### **Bước 1: Đăng nhập Staff**
```
URL: http://localhost:5173/login
Email: staff@skaev.com
Password: Admin@123
```

### **Bước 2: Vào trang Quản lý Phiên sạc**
- Click menu **"Quản lý Phiên sạc"** ở sidebar
- Hoặc truy cập: `http://localhost:5173/staff/charging-sessions`

### **Bước 3: Kiểm tra dữ liệu hiển thị**

**Kịch bản 1: Không có session đang sạc**
- Tất cả connectors hiển thị với:
  - Mã phiên: `N/A`
  - Trạng thái: `Sẵn sàng` (chip xám)
  - Các cột thời gian/năng lượng/phí: `-`
  - TT Status: `Trống`
  - Button "Chi tiết": **Disabled** (màu xám)

**Kịch bản 2: Có session đang sạc**
- Row highlight (màu nền khác)
- Mã phiên: `#123` (ID thực)
- Trạng thái: `Đang sạc` (chip xanh lá)
- Thời gian bắt đầu: Hiển thị đầy đủ DD/MM/YYYY HH:mm
- Thời gian đã sạc: `Xh Ym` format
- Năng lượng: `XX.XX kWh`
- Phí: Tự động tính theo công thức (3000₫/kWh)
- TT Status: `Đang sử dụng` (chip xanh)
- Button "Chi tiết": **Enabled** → Click hiện popup

### **Bước 4: Test Button "Chi tiết"**
Click vào button → Alert hiển thị:
```
Chi tiết phiên sạc #123
Khách hàng: Nguyễn Văn A
Xe: VinFast VF8 - 29A-12345
SOC: 65%
Công suất: 22.5 kW
```

### **Bước 5: Kiểm tra Console (F12)**
```
🔄 Loading charging sessions from Dashboard API...
✅ Dashboard data received: {connectors: [...], station: {...}}
✅ Processed sessions: [...]
```

---

## 📊 So sánh với ảnh mẫu

| Yêu cầu từ ảnh | Đã implement? |
|----------------|---------------|
| Header "Quản lý Phiên sạc (Trực tiếp)" | ✅ |
| Description text | ✅ |
| Button "Quay lại" | ✅ |
| Button "Làm mới" | ✅ |
| Cột "Mã phiên" | ✅ |
| Cột "Điểm sạc" | ✅ (2 dòng: Code + Type) |
| Cột "Trạng thái" với Chip màu | ✅ |
| Cột "Thời gian Bắt đầu" | ✅ |
| Cột "Thời gian Đã sạc" | ✅ (auto-calculate) |
| Cột "Năng lượng (kWh)" | ✅ |
| Cột "Phí (₫)" | ✅ (auto-calculate) |
| Cột "TT Status" | ✅ |
| Cột "Phương thức TT" | ✅ (static: "Thanh toán sau") |
| Cột "Thao tác" | ✅ (Button Chi tiết) |
| Hiển thị khi không có data | ✅ (Alert info) |
| Load từ Dashboard API | ✅ |
| Liên kết dữ liệu Customer | ✅ |

---

## 🔧 API Endpoint đã sử dụng

### **GET /api/staff/dashboard**

**Request:**
```http
GET http://localhost:5000/api/staff/dashboard
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "hasAssignment": true,
  "station": {
    "stationId": 1,
    "stationName": "VinFast Green Charging - Vinhomes Central Park",
    "address": "208 Nguyễn Hữu Cảnh",
    "city": "TP.HCM"
  },
  "connectors": [
    {
      "slotId": 1,
      "connectorCode": "CON-01",
      "connectorType": "CCS2",
      "maxPower": 22,
      "technicalStatus": "online",
      "operationalStatus": "Charging",
      "voltage": 400,
      "current": 32,
      "temperature": 35,
      "activeSession": {
        "bookingId": 123,
        "customerId": 5,
        "customerName": "Nguyễn Văn A",
        "vehicleInfo": "VinFast VF8 - 29A-12345",
        "startedAt": "2025-11-10T14:30:00Z",
        "currentSoc": 65,
        "power": 22.5,
        "energyDelivered": 15.8
      }
    },
    {
      "slotId": 2,
      "connectorCode": "CON-02",
      "connectorType": "CCS2",
      "maxPower": 22,
      "operationalStatus": "Available",
      "activeSession": null
    }
  ]
}
```

---

## ⚡ Next Steps (Nếu cần mở rộng)

### 1. **Tích hợp Invoice API** (để hiển thị Phí chính xác)
```javascript
// Lấy invoice của booking
const invoice = await staffAPI.getInvoiceByBookingId(session.bookingId);
session.actualCost = invoice.totalAmount;
session.paymentStatus = invoice.paymentStatus;
session.paymentMethod = invoice.paymentMethod;
```

### 2. **Real-time Updates** (WebSocket)
```javascript
// Subscribe to connector updates
useEffect(() => {
  const socket = io('http://localhost:5000');
  socket.on('connector-update', (data) => {
    // Update session in real-time
    setSessions(prev => prev.map(s => 
      s.id === data.slotId ? { ...s, ...data } : s
    ));
  });
  return () => socket.disconnect();
}, []);
```

### 3. **Actions: Start/Stop Session**
```javascript
const handleStopCharging = async (bookingId) => {
  await staffAPI.stopCharging(bookingId);
  loadSessions(); // Reload
};
```

### 4. **Export to Excel**
```javascript
import * as XLSX from 'xlsx';

const exportToExcel = () => {
  const ws = XLSX.utils.json_to_sheet(sessions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sessions");
  XLSX.writeFile(wb, `charging-sessions-${new Date().toISOString()}.xlsx`);
};
```

---

## 🐛 Troubleshooting

### **Lỗi: "Không thể tải dữ liệu phiên sạc"**
1. Kiểm tra Backend đang chạy: `http://localhost:5000/api/staff/dashboard`
2. Kiểm tra token trong sessionStorage: `sessionStorage.getItem('token')`
3. Kiểm tra staff đã được assign vào station: Query database

### **Không hiển thị customer info**
1. Mở Console → Tab Network → Xem response của `/api/staff/dashboard`
2. Kiểm tra `activeSession` có null không
3. Kiểm tra database: Có booking nào status = "in_progress" không?

### **Thời gian/Phí hiển thị NaN**
1. Kiểm tra `startedAt` có đúng format ISO8601 không
2. Kiểm tra `energyDelivered` có phải số không
3. Console log giá trị để debug

---

## 📝 Summary

✅ **Đã liên kết thành công:**
- Dashboard API (`/api/staff/dashboard`)
- Customer data (name, vehicle info)
- Connector status & technical readings
- Active session tracking
- Auto-calculated duration & cost

🎯 **Kết quả:**
Trang "Quản lý Phiên sạc (Trực tiếp)" hiển thị **chính xác** như ảnh mẫu, với đầy đủ thông tin customer từ database!
