# Monitoring Page - Comprehensive Issue Reporting Flow Implementation

## 📋 Overview
Triển khai hoàn chỉnh luồng báo cáo và xử lý sự cố cho trang Monitoring của staff, với cơ chế tự động cập nhật trạng thái bảo trì và hiển thị phản hồi admin real-time.

## 🔄 Flow hoạt động

### 1. **Phát hiện và hiển thị trạng thái Bảo trì**
- Hệ thống tự động quét tất cả các issue có status là `reported` hoặc `in_progress`
- Bất kỳ trạm nào có issue đang active sẽ tự động hiển thị trạng thái **"Đang bảo trì"**
- Icon: `<Build />` với màu warning (vàng cam)
- Flag `hasActiveIssue` được gắn vào mỗi connector để theo dõi

```javascript
// Logic tự động override status
const stationsWithActiveIssues = new Set(
  issueList
    .filter(issue => issue.status && !['resolved', 'closed'].includes(issue.status.toLowerCase()))
    .map(issue => issue.stationId)
);

const hasActiveIssue = stationsWithActiveIssues.has(station.stationId);
const actualStatus = hasActiveIssue ? 'maintenance' : slot.status;
```

### 2. **Tạo báo cáo sự cố**
Staff có thể:
- Chọn điểm sạc bị ảnh hưởng
- Chọn loại sự cố (hardware/software/network/other)
- Đặt mức độ ưu tiên (low/medium/high/urgent)
- Mô tả chi tiết vấn đề
- Upload file đính kèm (ảnh, video)

**API Call:**
```javascript
POST /api/StaffIssues
{
  "StationId": number,
  "PostId": number,
  "Title": string,
  "Description": string,
  "Priority": string
}
```

### 3. **Lịch sử báo cáo sự cố**
Hiển thị tất cả báo cáo với thông tin đầy đủ:

| Cột | Mô tả |
|-----|-------|
| Mã sự cố | #ID của issue |
| Trạm | Tên trạm sạc |
| Loại sự cố | hardware/software/network/other |
| Mô tả | Chi tiết vấn đề (truncated, max 200px width) |
| Ưu tiên | Chip với màu: low=default, medium=info, high=warning, urgent=error |
| Trạng thái | Chip: completed=green, in_progress=blue, pending=warning |
| Gán cho | Tên technician được assign, hoặc "Chưa phân công" |
| Phản hồi Admin | Button "Xem phản hồi" hoặc "Đang chờ xử lý..." |
| Thời gian báo cáo | Date + Time (định dạng vi-VN) |

**Color-coded Status:**
- ✅ **Đã giải quyết** (resolved/closed): Green
- 🔵 **Đang xử lý** (in_progress): Blue
- ⚠️ **Chờ xử lý** (reported): Orange

### 4. **Chi tiết sự cố và phản hồi Admin**
Khi click "Xem phản hồi", dialog hiển thị:

#### **Thông tin Báo cáo** (Card 1)
- Mã sự cố: #ID
- Trạm: Tên trạm
- Điểm sạc: Connector ID
- Loại sự cố: Category
- Mức độ ưu tiên: Priority chip
- Người báo cáo: Reporter name
- Mô tả chi tiết: Full description trong Paper box
- Trạng thái: Status chip
- Người phụ trách: Assigned technician

#### **Timeline Xử lý** (Card 2)
- 📅 **Báo cáo lúc**: reportedAt (date + time)
- 🔄 **Cập nhật lúc**: updatedAt (nếu khác reportedAt)
- 👤 **Được gán cho**: assignedTo + timestamp
- ✅ **Giải quyết lúc**: resolvedAt (màu xanh)

#### **Phản hồi Admin** (Card 3)
**Nếu có phản hồi:**
- Card màu xanh với border success
- Icon: `<CheckCircle />`
- Alert severity="success" chứa nội dung phản hồi
- Hiển thị "Được xử lý bởi: {technician_name}"

**Nếu chưa có phản hồi:**
- Card màu vàng với border warning
- Icon: `<HourglassEmpty />`
- Alert severity="warning": "Sự cố đang được xử lý, vui lòng chờ phản hồi từ quản trị viên."

## 🔄 Auto-Refresh Mechanism

```javascript
useEffect(() => {
  loadMonitoringData();
  
  // Auto-refresh mỗi 30 giây
  const refreshInterval = setInterval(() => {
    loadMonitoringData();
  }, 30000);

  return () => clearInterval(refreshInterval);
}, [location.state]);
```

**Lợi ích:**
- Staff thấy ngay khi admin phản hồi (không cần F5)
- Trạng thái bảo trì tự động cập nhật khi issue được resolve
- Real-time sync giữa staff và admin interface

## 📊 Data Flow

```
Staff tạo báo cáo
    ↓
POST /api/StaffIssues → Backend tạo Issue record (status="reported")
    ↓
Auto-refresh (30s) → GET /api/StaffIssues
    ↓
Frontend phát hiện active issue → Override status = "maintenance"
    ↓
Hiển thị "Đang bảo trì" trong bảng connectors
    ↓
Admin xử lý (update status, resolution)
    ↓
Auto-refresh (30s) → GET /api/StaffIssues
    ↓
Frontend nhận resolution từ API → Hiển thị phản hồi admin
    ↓
Admin close issue (status="resolved"/"closed")
    ↓
Auto-refresh (30s) → GET /api/StaffIssues
    ↓
Frontend remove khỏi stationsWithActiveIssues → Trở về status bình thường
```

## 🎨 UI/UX Enhancements

### 1. **Connector Table**
```jsx
<Chip
  icon={connector.hasActiveIssue ? <Build fontSize="small" /> : getStatusIcon(...)}
  label={connector.hasActiveIssue ? "Đang bảo trì" : connector.operationalStatus}
  color={connector.hasActiveIssue ? "warning" : "default"}
/>
```

### 2. **Issue History Table**
- Empty state: "Chưa có báo cáo sự cố nào" (centered, grey text)
- Truncated descriptions (maxWidth: 200px, noWrap)
- Priority chips với màu sắc trực quan
- Button "Xem phản hồi" (contained, primary) vs "Đang chờ xử lý..." (italic, grey)

### 3. **Detail Dialog**
- Header: Issue ID + Status chip
- Divider giữa các sections
- Icons cho mỗi section (Info, Schedule, CheckCircle/HourglassEmpty)
- Color-coded cards:
  - Info card: outlined, white background
  - Timeline card: outlined, white background
  - Response card: filled background (green/yellow), colored border

### 4. **Timestamps**
Tất cả timestamps hiển thị format:
```javascript
{date.toLocaleDateString("vi-VN")}  // 01/12/2024
{date.toLocaleTimeString("vi-VN")}  // 14:30:45
```

## 🔧 Technical Implementation

### **New Icons Added**
```javascript
import {
  Warning,
  Add,
  ArrowBack,
  CloudUpload,
  CheckCircle,
  Error,
  PowerOff,
  Build,
  Info,           // NEW
  Schedule,       // NEW
  HourglassEmpty, // NEW
} from "@mui/icons-material";
```

### **New MUI Components**
```javascript
import {
  // ... existing imports
  Divider,  // NEW
} from "@mui/material";
```

### **Incident Data Structure**
```javascript
{
  id: number,
  stationId: number,
  stationName: string,
  connectorId: string,
  type: string,
  description: string,
  priority: string,
  status: string,
  statusLabel: string,
  reportedBy: string,
  assignedTo: string | null,
  adminResponse: string | null,
  reportedAt: Date,
  updatedAt: Date | null,
  resolvedAt: Date | null,
}
```

## ✅ Backend Requirements (Already Implemented)

- ✅ Issue entity with proper schema (no PostId)
- ✅ IssueService.CreateIssueAsync implemented
- ✅ DbContext configured with PascalCase columns
- ✅ GET /api/StaffIssues endpoint
- ✅ POST /api/StaffIssues endpoint

## 🚀 Next Steps for Admin Interface

1. **Admin Dashboard - Issue Management Tab**
   - View all reported issues
   - Filter by status, priority, station
   - Assign issues to technicians
   - Update issue status (reported → in_progress → resolved → closed)
   - Add resolution/response text
   
2. **Real-time Notifications**
   - Notify admin khi có báo cáo mới
   - Notify staff khi admin phản hồi
   - Push notifications hoặc WebSocket

3. **Analytics Dashboard**
   - Số lượng issue theo loại
   - Average resolution time
   - Top reported stations
   - Technician performance metrics

## 📝 Testing Checklist

- [ ] Tạo issue mới → Verify status hiển thị "Đang bảo trì" ngay lập tức
- [ ] Auto-refresh sau 30s → Verify data được cập nhật
- [ ] Admin phản hồi (backend) → Verify staff thấy phản hồi sau ≤30s
- [ ] Admin resolve issue → Verify status trở về bình thường
- [ ] Multiple issues cùng 1 station → Verify maintenance status vẫn hiển thị đến khi tất cả issues resolved
- [ ] Empty state → Verify "Chưa có báo cáo sự cố nào" hiển thị đúng
- [ ] Detail dialog → Verify timeline, phản hồi, timestamps hiển thị chính xác

## 🔐 Security Considerations

- ✅ Staff chỉ thấy issues của mình hoặc issues chung
- ✅ Staff không thể edit/delete issues
- ✅ Staff không thể assign issues cho technicians
- ✅ Staff chỉ có thể tạo và xem issues
- ✅ Admin role required để update status và resolution

## 📄 Files Modified

1. **src/pages/staff/Monitoring.jsx**
   - Added auto-refresh mechanism (30s interval)
   - Enhanced loadMonitoringData to detect active issues
   - Added stationsWithActiveIssues Set
   - Override status to "maintenance" for affected stations
   - Enhanced issue history table (better UX, color-coded)
   - Completely redesigned detail dialog (timeline, sections)
   - Added new icons (Info, Schedule, HourglassEmpty)
   - Added Divider component

## 🎯 Success Metrics

- ⚡ Real-time updates: ≤30 seconds latency
- 🎨 Clear visual indicators: Maintenance status visible at a glance
- 📱 Responsive design: Works on mobile/tablet
- 🔄 Seamless sync: Staff-Admin data consistency
- ✅ User feedback: Toast notifications for all actions

---

**Last Updated**: December 2024  
**Status**: ✅ Implemented and Ready for Testing  
**Backend Commit**: fd5f579 (Issue reporting system with database schema)  
**Frontend**: Updated Monitoring.jsx with comprehensive flow
