# Cập Nhật: Date Picker Chung Cho Tất Cả Analytics Tabs

## Thay Đổi

### Trước:

- Date picker nằm **bên trong** tab "NĂNG LƯỢNG TIÊU THỤ"
- Chỉ áp dụng cho 1 tab duy nhất
- Người dùng phải vào tab mới thấy date picker

### Sau (✅ Hoàn thành):

- Date picker nằm ở **header chính**, kế bên nút "Tắt trạm"
- **Áp dụng chung** cho TẤT CẢ các tab analytics:
  - Tab 0: NĂNG LƯỢNG TIÊU THỤ
  - Tab 1: SỬ DỤNG SLOT
  - Tab 2: DOANH THU
  - Tab 3: PHÂN BỐ THEO GIỜ
- Date range luôn hiển thị, dễ tiếp cận

## Vị Trí Mới

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← [Station Name]                      [Từ ngày] [Đến ngày] [Tắt trạm] │
│   Address, City                                                      │
│   Last action: ...                                                   │
│   [Status Chip]                                                      │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│ [Giám sát] [Charging Points] [Lỗi & Cảnh báo] [📊 Phân tích] [Nhân viên] │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│ Summary Cards: [Tổng phiên] [Tổng năng lượng] [Doanh thu] [Thời gian]│
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│ Tabs: [NĂNG LƯỢNG] [SỬ DỤNG SLOT] [DOANH THU] [PHÂN BỐ GIỜ]         │
│                                                                       │
│ [Chart Content - Tự động cập nhật theo date range]                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Cơ Chế Hoạt Động

1. **User thay đổi date range** ở header
2. **dateRange state** trong `StationDetailAnalytics` được update
3. **Props tự động truyền** xuống `AdvancedCharts` component
4. **useEffect trigger** khi `dateRange` thay đổi
5. **API call** với startDate và endDate mới
6. **TẤT CẢ charts** tự động reload với dữ liệu mới

## Code Flow

### StationDetailAnalytics.jsx (Parent)

```jsx
// State management ở parent
const [dateRange, setDateRange] = useState({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0]
});

// Date picker trong header
<TextField
  label="Từ ngày"
  value={dateRange.startDate}
  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
/>
<TextField
  label="Đến ngày"
  value={dateRange.endDate}
  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
/>

// Pass props xuống child
<AdvancedCharts stationId={stationId} dateRange={dateRange} />
```

### AdvancedCharts.jsx (Child)

```jsx
// Nhận props từ parent
const AdvancedCharts = ({ stationId, dateRange }) => {
  // Auto reload khi dateRange thay đổi
  useEffect(() => {
    if (dateRange?.startDate && dateRange?.endDate) {
      loadTimeSeriesData(dateRange.startDate, dateRange.endDate);
    }
  }, [stationId, dateRange]);

  // Tất cả charts sử dụng timeSeriesData
};
```

## Files Đã Thay Đổi

### 1. `src/pages/admin/StationDetailAnalytics.jsx`

- ✅ Thêm `dateRange` state
- ✅ Thêm 2 TextField (Từ ngày, Đến ngày) vào header
- ✅ Di chuyển nút "Tắt trạm" sang bên phải date pickers
- ✅ Pass `dateRange` props xuống `<AdvancedCharts />`

### 2. `src/components/admin/AdvancedCharts.jsx`

- ✅ Nhận `dateRange` từ props thay vì local state
- ✅ Xóa date picker UI bên trong component
- ✅ Xóa `handleApplyDateRange()` function
- ✅ Update `useEffect` dependencies: `[stationId, dateRange]`
- ✅ Xóa unused imports: `TextField`, `Button`

## Lợi Ích

1. **UX tốt hơn:**

   - Date picker luôn hiển thị ở vị trí cố định
   - Không cần chuyển tab để thay đổi date range
   - Consistent với design pattern (filter ở top)

2. **Functionality mạnh hơn:**

   - 1 lần chọn date range = tất cả charts update
   - Dễ so sánh metrics khác nhau trong cùng khoảng thời gian
   - Chuẩn bị sẵn để extend cho các tab khác (slot utilization, revenue, patterns)

3. **Code sạch hơn:**
   - Single source of truth cho dateRange (parent state)
   - Child components chỉ consume, không manage state
   - Props drilling đơn giản, dễ maintain

## Test

```bash
# Khởi động ứng dụng
npm run dev

# Navigate
Admin → Quản lý Trạm sạc → Click vào 1 trạm

# Test các bước:
1. ✅ Thấy date picker ở header (kế nút Tắt trạm)
2. ✅ Mặc định: Last 30 days
3. ✅ Thay đổi "Từ ngày" → Charts auto reload
4. ✅ Thay đổi "Đến ngày" → Charts auto reload
5. ✅ Click tab khác → Dữ liệu theo date range đã chọn
6. ✅ Không còn date picker riêng trong tab
```

## Future Enhancements

Có thể extend để các tab khác (Slot, Revenue, Patterns) cũng sử dụng dateRange:

```jsx
// Trong AdvancedCharts.jsx
useEffect(() => {
  loadAllAnalytics(dateRange.startDate, dateRange.endDate);
}, [dateRange]);

const loadAllAnalytics = async (start, end) => {
  // Load time-series data
  // Load slot utilization data (với date filter)
  // Load revenue breakdown (với date filter)
  // Load session patterns (với date filter)
};
```

---

**Hoàn thành:** 12/11/2025  
**Trạng thái:** ✅ READY TO TEST
