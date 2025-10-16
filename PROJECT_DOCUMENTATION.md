# 📚 SkaEV - COMPREHENSIVE PROJECT DOCUMENTATION

## Tài Liệu Dự Án Hệ Thống Quản Lý Trạm Sạc Xe Điện

**Cập nhật lần cuối:** 15 Tháng 10, 2025  
**Phiên bản:** 1.0.0  
**Nhóm:** SWP391_G4_Topic3 - FPT University

---

## 📋 MỤC LỤC

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Công Nghệ Sử Dụng](#3-công-nghệ-sử-dụng)
4. [Cấu Trúc Database](#4-cấu-trúc-database)
5. [Backend API](#5-backend-api)
6. [Frontend Application](#6-frontend-application)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Tính Năng Chính](#8-tính-năng-chính)
9. [API Endpoints](#9-api-endpoints)
10. [Hướng Dẫn Cài Đặt](#10-hướng-dẫn-cài-đặt)
11. [Testing & Deployment](#11-testing--deployment)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Giới Thiệu

**SkaEV (Smart Charging Station for Electric Vehicles)** là một hệ thống quản lý trạm sạc xe điện toàn diện, được phát triển như một dự án môn Software Project Management (SWP391) tại FPT University.

### 1.2. Mục Tiêu

- ✅ Quản lý mạng lưới trạm sạc xe điện
- ✅ Đặt lịch và thanh toán tự động
- ✅ Theo dõi SOC (State of Charge) thời gian thực
- ✅ Quản lý QR code và kiểm soát truy cập
- ✅ Phân tích dữ liệu và báo cáo

### 1.3. Đối Tượng Sử Dụng

| Vai trò | Mô tả | Chức năng chính |
|---------|-------|-----------------|
| **Customer** | Người dùng xe điện | Tìm trạm, đặt lịch, sạc xe, thanh toán |
| **Staff** | Nhân viên trạm sạc | Quản lý booking, xử lý sự cố, hỗ trợ khách hàng |
| **Admin** | Quản trị viên | Quản lý toàn hệ thống, báo cáo, analytics |

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Kiến Trúc Tổng Thể

```
┌────────────────────────────────────────────────────────────────┐
│                    CLIENT TIER (Frontend)                       │
│  React 19 + Vite 7 + Zustand State Management                  │
│  ├── Customer Dashboard (Booking, Charging, Payment)           │
│  ├── Staff Dashboard (Booking Management, Issue Handling)      │
│  └── Admin Dashboard (Analytics, User Management, Reports)     │
└────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/REST API
┌────────────────────────────────────────────────────────────────┐
│                  APPLICATION TIER (Backend)                     │
│  ASP.NET Core 8.0 Web API + JWT Authentication                 │
│  ├── Controllers (17 controllers, 100+ endpoints)              │
│  ├── Services (15 services với business logic)                 │
│  ├── DTOs (45+ Data Transfer Objects)                          │
│  ├── Entities (18 domain entities)                             │
│  └── Middleware (Auth, CORS, Logging, Error Handling)          │
└────────────────────────────────────────────────────────────────┘
                              ↓ EF Core ORM
┌────────────────────────────────────────────────────────────────┐
│                      DATA TIER (Database)                       │
│  SQL Server 2022 - Database: SkaEV_DB                          │
│  ├── Tables: 18 bảng chính                                     │
│  ├── Views: 6 analytical views                                 │
│  ├── Stored Procedures: 15 procedures                          │
│  ├── Spatial Data: NetTopologySuite (Geography)                │
│  └── Indexes & Constraints                                     │
└────────────────────────────────────────────────────────────────┘
```

### 2.2. Design Patterns

- **Repository Pattern**: Truy cập dữ liệu thông qua Entity Framework Core DbContext
- **Service Layer Pattern**: Business logic tách biệt trong các service classes
- **DTO Pattern**: Data Transfer Objects cho API communication
- **Dependency Injection**: .NET Core built-in DI container
- **JWT Authentication**: Stateless authentication với Bearer tokens

### 2.3. Luồng Dữ Liệu

```
User Request → Controller → Service → DbContext → Database
                  ↓           ↓          ↓
               AuthZ      Business    EF Core
              Middleware   Logic      ORM
```

---

## 3. CÔNG NGHỆ SỬ DỤNG

### 3.1. Backend Technologies

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **.NET SDK** | 8.0 | Backend framework |
| **ASP.NET Core** | 8.0 | Web API framework |
| **Entity Framework Core** | 8.0.11 | ORM cho database access |
| **SQL Server** | 2022 | Relational database |
| **JWT Bearer** | 8.0.11 | Authentication |
| **BCrypt.Net** | 4.0.3 | Password hashing |
| **Serilog** | 8.0.0 | Structured logging |
| **AutoMapper** | 12.0.1 | Object mapping |
| **FluentValidation** | 11.3.0 | Input validation |
| **NetTopologySuite** | 2.5.0 | Spatial data (geography) |
| **QRCoder** | 1.4.3 | QR code generation |
| **Swagger/OpenAPI** | 6.5.0 | API documentation |

### 3.2. Frontend Technologies

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **React** | 19.1.1 | UI library |
| **Vite** | 7.1.9 | Build tool & dev server |
| **Zustand** | 5.0.2 | State management |
| **Axios** | 1.12.2 | HTTP client |
| **React Router** | 7.1.0 | Client-side routing |
| **Material-UI** | 6.1.8 | UI component library |
| **React Hook Form** | 7.55.0 | Form validation |
| **Leaflet** | 1.9.4 | Map integration |
| **Recharts** | 2.15.4 | Data visualization |
| **Date-fns** | 4.1.0 | Date manipulation |
| **Zod** | 3.24.1 | Schema validation |

### 3.3. Development Tools

- **Visual Studio Code**: IDE
- **SQL Server Management Studio (SSMS)**: Database management
- **Postman**: API testing
- **Git**: Version control
- **PowerShell**: Script automation

---

## 4. CẤU TRÚC DATABASE

### 4.1. Sơ Đồ ERD (Entity Relationship Diagram)

```
users ──┬──→ user_profiles
        ├──→ vehicles
        ├──→ bookings
        ├──→ invoices
        ├──→ payment_methods
        ├──→ notifications
        └──→ reviews

charging_stations ──┬──→ charging_posts ──→ charging_slots
                    ├──→ bookings
                    ├──→ qr_codes
                    ├──→ reviews
                    ├──→ pricing_rules
                    └──→ station_staff

bookings ──┬──→ soc_tracking
           ├──→ invoices
           ├──→ reviews
           └──→ qr_codes

invoices ──→ payments
```

### 4.2. Danh Sách Bảng (18 Tables)

#### **User Management (3 tables)**

1. **users** - Tài khoản người dùng
   - `user_id` (PK), `email`, `password_hash`, `full_name`, `phone_number`, `role`, `is_active`
   - **Roles**: Customer, Staff, Admin
   - **Index**: Unique index trên `email`

2. **user_profiles** - Thông tin profile mở rộng
   - `profile_id` (PK), `user_id` (FK), `date_of_birth`, `address`, `city`, `avatar_url`
   - `preferred_payment_method`, `notification_preferences`

3. **vehicles** - Xe điện của người dùng
   - `vehicle_id` (PK), `user_id` (FK), `vehicle_type`, `brand`, `model`, `license_plate`
   - `battery_capacity`, `charging_port_type`, `is_primary`

#### **Charging Infrastructure (4 tables)**

4. **charging_stations** - Trạm sạc
   - `station_id` (PK), `station_name`, `address`, `city`, `latitude`, `longitude`
   - `location` (geography), `total_posts`, `available_posts`, `operating_hours`
   - `amenities`, `station_image_url`, `status`

5. **charging_posts** - Cột sạc (AC/DC)
   - `post_id` (PK), `station_id` (FK), `post_number`, `post_type`, `power_output`
   - `connector_types`, `total_slots`, `available_slots`, `status`

6. **charging_slots** - Ổ cắm sạc cụ thể
   - `slot_id` (PK), `post_id` (FK), `slot_number`, `connector_type`, `max_power`
   - `status`, `current_booking_id` (FK)

7. **pricing_rules** - Quy tắc định giá
   - `rule_id` (PK), `station_id` (FK), `vehicle_type`, `time_range_start/end`
   - `base_price`, `is_active`

#### **Booking & Charging (2 tables)**

8. **bookings** - Đặt lịch sạc
   - `booking_id` (PK), `user_id` (FK), `vehicle_id` (FK), `slot_id` (FK), `station_id` (FK)
   - `scheduling_type` (scheduled/immediate), `estimated_arrival`, `scheduled_start_time`
   - `actual_start_time`, `actual_end_time`, `status`, `target_soc`, `qr_code_id` (FK)

9. **soc_tracking** - Theo dõi SOC thời gian thực
   - `tracking_id` (PK), `booking_id` (FK), `timestamp`, `current_soc`, `voltage`, `current`
   - `power`, `energy_delivered`, `temperature`, `estimated_time_remaining`

#### **Payment (3 tables)**

10. **invoices** - Hóa đơn
    - `invoice_id` (PK), `booking_id` (FK), `user_id` (FK), `total_energy_kwh`, `unit_price`
    - `subtotal`, `tax_amount`, `total_amount`, `payment_method`, `payment_status`
    - `paid_at`, `invoice_url`, `paid_by_staff_id` (FK), `payment_method_id` (FK)

11. **payment_methods** - Phương thức thanh toán
    - `payment_method_id` (PK), `user_id` (FK), `type`, `provider`, `card_number_last4`
    - `cardholder_name`, `expiry_month`, `expiry_year`, `is_default`, `is_active`

12. **payments** - Giao dịch thanh toán
    - `payment_id` (PK), `invoice_id` (FK), `payment_method_id` (FK), `amount`
    - `payment_type`, `transaction_id`, `staff_id` (FK), `status`, `payment_date`
    - `refund_date`, `notes`

#### **Features (4 tables)**

13. **qr_codes** - Mã QR
    - `qr_id` (PK), `station_id` (FK), `slot_id` (FK), `qr_data`, `is_active`
    - `generated_at`, `expires_at`, `last_scanned_at`, `scan_count`

14. **notifications** - Thông báo
    - `notification_id` (PK), `user_id` (FK), `type`, `title`, `message`, `is_read`
    - `related_booking_id` (FK), `created_at`

15. **reviews** - Đánh giá trạm
    - `review_id` (PK), `booking_id` (FK), `user_id` (FK), `station_id` (FK)
    - `rating` (1-5), `comment`, `created_at`, `updated_at`

16. **station_staff** - Phân công nhân viên
    - `assignment_id` (PK), `staff_user_id` (FK), `station_id` (FK)
    - `assigned_at`, `is_active`

#### **System (2 tables)**

17. **system_logs** - Nhật ký hệ thống
    - `log_id` (PK), `log_type`, `severity`, `message`, `stack_trace`
    - `user_id` (FK), `ip_address`, `endpoint`, `created_at`

18. **sysdiagrams** - SQL Server diagrams (system table)

### 4.3. Database Views (6 Views)

#### **User Reports**
- **v_user_cost_reports** - Chi phí sạc của từng user
- **v_user_charging_habits** - Thói quen sạc của user

#### **Admin Reports**
- **v_admin_revenue_reports** - Báo cáo doanh thu theo trạm/thời gian
- **v_admin_usage_reports** - Báo cáo sử dụng (utilization rate, peak hours)
- **v_station_performance** - Hiệu suất từng trạm
- **v_payment_methods_summary** - Thống kê phương thức thanh toán

---

## 5. BACKEND API

### 5.1. Cấu Trúc Project

```
SkaEV.API/
├── Controllers/              # 17 API Controllers
│   ├── AuthController.cs
│   ├── StationsController.cs
│   ├── BookingsController.cs
│   ├── InvoicesController.cs
│   ├── VehiclesController.cs
│   ├── NotificationsController.cs
│   ├── ReviewsController.cs
│   ├── PostsController.cs
│   ├── SlotsController.cs
│   ├── QRCodesController.cs
│   ├── UserProfilesController.cs
│   ├── PaymentMethodsController.cs
│   ├── AdminUsersController.cs
│   ├── AdminReportsController.cs
│   ├── ReportsController.cs
│   ├── StaffIssuesController.cs
│   └── TestController.cs
│
├── Application/
│   ├── Services/            # 15 Business Logic Services
│   │   ├── AuthService.cs
│   │   ├── StationService.cs
│   │   ├── BookingService.cs
│   │   ├── VehicleService.cs
│   │   ├── NotificationService.cs
│   │   ├── ReviewService.cs
│   │   ├── PostService.cs
│   │   ├── SlotService.cs
│   │   ├── QRCodeService.cs
│   │   ├── InvoiceService.cs
│   │   ├── UserProfileService.cs
│   │   ├── PaymentMethodService.cs
│   │   ├── AdminUserService.cs
│   │   ├── ReportService.cs
│   │   └── IssueService.cs (placeholder)
│   │
│   └── DTOs/                # 45+ Data Transfer Objects
│       ├── Auth/
│       ├── Stations/
│       ├── Bookings/
│       ├── Invoices/
│       ├── Vehicles/
│       ├── Notifications/
│       ├── Reviews/
│       ├── Posts/
│       ├── Slots/
│       ├── QRCodes/
│       ├── UserProfiles/
│       ├── Payments/
│       ├── Admin/
│       ├── Issues/
│       └── Reports/
│
├── Domain/
│   └── Entities/            # 18 Domain Entities
│       ├── User.cs
│       ├── UserProfile.cs
│       ├── Vehicle.cs
│       ├── ChargingStation.cs
│       ├── ChargingPost.cs
│       ├── ChargingSlot.cs
│       ├── Booking.cs
│       ├── SocTracking.cs
│       ├── Invoice.cs
│       ├── PaymentMethod.cs (includes Payment class)
│       ├── QRCode.cs
│       ├── Notification.cs
│       ├── Review.cs
│       ├── PricingRule.cs
│       ├── StationStaff.cs
│       ├── SystemLog.cs
│       └── Views/           # View Entities
│           └── ReportViews.cs
│
├── Infrastructure/
│   └── Data/
│       └── SkaEVDbContext.cs  # Entity Framework DbContext
│
├── Program.cs               # Application configuration
├── appsettings.json         # Configuration file
└── SkaEV.API.csproj         # Project file
```

### 5.2. Dependency Injection Configuration

**File: `Program.cs`**

```csharp
// Database
builder.Services.AddDbContext<SkaEVDbContext>(options =>
    options.UseSqlServer(connectionString, 
        sqlOptions => sqlOptions.UseNetTopologySuite()));

// Services - Scoped lifetime
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStationService, StationService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ISlotService, SlotService>();
builder.Services.AddScoped<IQRCodeService, QRCodeService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();
builder.Services.AddScoped<IAdminUserService, AdminUserService>();
builder.Services.AddScoped<IReportService, ReportService>();
// Optional: builder.Services.AddScoped<IIssueService, IssueService>();

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { ... });

// CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Logging (Serilog)
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/skaev-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();
```

### 5.3. Authentication Flow

```
1. User Login
   POST /api/auth/login → AuthService.LoginAsync()
   ↓
2. Validate Credentials
   BCrypt.Verify(password, user.PasswordHash)
   ↓
3. Generate JWT Token
   JwtSecurityTokenHandler.WriteToken(token)
   ↓
4. Return Token to Client
   { token: "eyJ...", user: {...} }
   ↓
5. Client Stores Token
   localStorage.setItem('authToken', token)
   ↓
6. Authenticated Requests
   Authorization: Bearer eyJ...
   ↓
7. JWT Middleware Validation
   [Authorize] attribute checks token
```

---

## 6. FRONTEND APPLICATION

### 6.1. Cấu Trúc Project

```
src/
├── components/              # Reusable Components
│   ├── layout/
│   │   ├── AppLayout/      # Main layout wrapper
│   │   ├── Header/         # Navigation header
│   │   └── Sidebar/        # Side navigation
│   ├── ui/
│   │   ├── LoadingSpinner/ # Loading indicator
│   │   └── ErrorBoundary/  # Error handling
│   ├── customer/
│   │   └── BookingModal/   # Booking form modal
│   └── NotificationCenter/ # Real-time notifications
│
├── pages/                   # Page Components
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── customer/
│   │   ├── Dashboard.jsx   # Customer main dashboard
│   │   ├── FindStations.jsx
│   │   ├── BookingHistory.jsx
│   │   ├── CustomerProfile.jsx
│   │   └── PaymentMethods.jsx
│   ├── staff/
│   │   ├── Dashboard.jsx   # Staff dashboard
│   │   ├── Profile.jsx
│   │   └── StationManagement.jsx
│   ├── admin/
│   │   ├── Dashboard.jsx   # Admin dashboard
│   │   ├── UserManagement.jsx
│   │   ├── StationManagement.jsx
│   │   ├── AdvancedAnalytics.jsx
│   │   ├── SystemReports.jsx
│   │   ├── Settings.jsx
│   │   └── NotificationDashboard.jsx
│   └── public/
│       └── Home.jsx         # Landing page
│
├── services/
│   └── api.js              # Axios HTTP client
│
├── store/                   # Zustand State Management
│   ├── authStore.js        # Authentication state
│   ├── bookingStore.js     # Booking management
│   ├── stationStore.js     # Station data
│   └── notificationStore.js # Notifications
│
├── utils/
│   ├── constants.js        # App constants
│   ├── helpers.js          # Utility functions
│   └── imageAssets.js      # Image imports
│
├── theme/
│   ├── index.js            # Material-UI theme
│   └── simple.js           # Simple theme variant
│
├── App.jsx                  # Main app component
├── main.jsx                 # Entry point
└── index.css                # Global styles
```

### 6.2. State Management (Zustand)

**authStore.js**
```javascript
const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: false,
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    set({ user: response.data.user, token: response.data.token, isAuthenticated: true });
    localStorage.setItem('authToken', response.data.token);
  },
  
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('authToken');
  }
}));
```

**bookingStore.js**
```javascript
const useBookingStore = create((set) => ({
  bookings: [],
  activeBooking: null,
  
  fetchBookings: async () => {
    const response = await api.get('/bookings');
    set({ bookings: response.data });
  },
  
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    set((state) => ({ bookings: [...state.bookings, response.data] }));
  }
}));
```

### 6.3. API Service Layer

**services/api.js**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 7. AUTHENTICATION & AUTHORIZATION

### 7.1. JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1",                    // User ID
    "email": "user@example.com",
    "role": "Customer",
    "exp": 1697443200,             // Expiration timestamp
    "iss": "SkaEV.API",            // Issuer
    "aud": "SkaEV.Client"          // Audience
  },
  "signature": "..."
}
```

### 7.2. Authorization Levels

| Endpoint | Anonymous | Customer | Staff | Admin |
|----------|-----------|----------|-------|-------|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| POST /auth/register | ✅ | ✅ | ✅ | ✅ |
| GET /stations | ✅ | ✅ | ✅ | ✅ |
| POST /bookings | ❌ | ✅ | ✅ | ✅ |
| GET /admin/users | ❌ | ❌ | ❌ | ✅ |
| POST /admin/users | ❌ | ❌ | ❌ | ✅ |
| PUT /invoices/{id}/process | ❌ | ❌ | ✅ | ✅ |

### 7.3. Role-Based Access Control

**Controller Example:**
```csharp
[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    [HttpGet]
    [Authorize] // Any authenticated user
    public async Task<IActionResult> GetMyBookings() { }
    
    [HttpPost]
    [Authorize(Roles = "Customer,Staff,Admin")] // Specific roles
    public async Task<IActionResult> CreateBooking() { }
    
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")] // Admin only
    public async Task<IActionResult> DeleteBooking(int id) { }
}
```

---

## 8. TÍNH NĂNG CHÍNH

### 8.1. Customer Features

#### 🔍 **Tìm Kiếm Trạm Sạc**
- Tìm theo GPS (nearby stations)
- Tìm theo địa chỉ/thành phố
- Lọc theo loại connector (CCS, CHAdeMO, Type 2)
- Hiển thị trên bản đồ (Leaflet)
- Xem tình trạng trạm real-time (available/occupied)

#### 📅 **Đặt Lịch Sạc**
- **Scheduled Booking**: Đặt trước theo thời gian
- **Immediate Booking**: Đặt ngay lập tức
- Chọn target SOC (State of Charge)
- Ước tính thời gian và chi phí
- Nhận QR code sau khi đặt

#### ⚡ **Quá Trình Sạc**
1. Quét QR code tại trạm → Validate booking
2. Bắt đầu sạc → Start charging session
3. Theo dõi SOC real-time:
   - Current SOC percentage
   - Voltage, Current, Power
   - Energy delivered (kWh)
   - Temperature
   - Estimated time remaining
4. Tự động dừng khi đạt target SOC
5. Hoặc dừng thủ công bất kỳ lúc nào

#### 💰 **Thanh Toán**
- Quản lý payment methods (Credit/Debit card, E-wallet)
- Xem invoice sau mỗi lần sạc
- Lịch sử thanh toán
- Export invoice PDF

#### 📊 **Dashboard & Reports**
- Lịch sử booking
- Thống kê chi phí sạc
- Thống kê năng lượng tiêu thụ
- Thói quen sạc (favorite stations, peak times)

### 8.2. Staff Features

#### 📋 **Quản Lý Booking**
- Xem tất cả bookings tại trạm
- Xử lý check-in khách hàng
- Hỗ trợ khách hàng trong quá trình sạc
- Cancel booking nếu cần

#### 💳 **Xử Lý Thanh Toán**
- Xử lý thanh toán tiền mặt
- Cập nhật payment status
- Ghi nhận giao dịch

#### 🔧 **Quản Lý Sự Cố**
- Tạo issue report
- Theo dõi trạng thái xử lý
- Escalate to admin nếu cần

### 8.3. Admin Features

#### 👥 **Quản Lý User**
- CRUD users (Customer, Staff, Admin)
- Assign staff to stations
- Active/Inactive accounts
- Reset passwords
- View user statistics

#### 🏢 **Quản Lý Trạm**
- CRUD charging stations
- CRUD charging posts
- CRUD charging slots
- Set pricing rules
- View station performance

#### 📈 **Analytics & Reports**
- **Revenue Reports**: Doanh thu theo trạm/thời gian
- **Usage Reports**: Utilization rate, peak hours
- **Station Performance**: Top stations, average ratings
- **Payment Methods**: Phân bố phương thức thanh toán
- **User Analysis**: Active users, spending patterns

#### 🔔 **Notification Management**
- Gửi notification đến user cụ thể
- Broadcast notification theo role
- Xem lịch sử notifications

---

## 9. API ENDPOINTS

### 9.1. Authentication (AuthController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới | ❌ |
| POST | `/api/auth/login` | Đăng nhập | ❌ |
| GET | `/api/auth/profile` | Lấy thông tin profile | ✅ |
| PUT | `/api/auth/profile` | Cập nhật profile | ✅ |
| POST | `/api/auth/refresh` | Refresh JWT token | ✅ |

### 9.2. Stations (StationsController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stations` | Lấy tất cả trạm | ❌ |
| GET | `/api/stations/{id}` | Chi tiết trạm | ❌ |
| GET | `/api/stations/nearby?lat={lat}&lng={lng}&radius={km}` | Tìm trạm gần | ❌ |
| GET | `/api/stations/{id}/availability` | Kiểm tra trạng thái | ❌ |
| POST | `/api/stations` | Tạo trạm mới | 🔒 Admin |
| PUT | `/api/stations/{id}` | Cập nhật trạm | 🔒 Admin |
| DELETE | `/api/stations/{id}` | Xóa trạm | 🔒 Admin |

### 9.3. Bookings (BookingsController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bookings` | Lấy bookings của user | ✅ |
| GET | `/api/bookings/{id}` | Chi tiết booking | ✅ |
| POST | `/api/bookings` | Tạo booking mới | ✅ |
| POST | `/api/bookings/{id}/scan-qr` | Scan QR code | ✅ |
| POST | `/api/bookings/{id}/start` | Bắt đầu sạc | ✅ |
| PUT | `/api/bookings/{id}/progress` | Cập nhật SOC | ✅ |
| POST | `/api/bookings/{id}/stop` | Dừng sạc | ✅ |
| DELETE | `/api/bookings/{id}` | Hủy booking | ✅ |

### 9.4. Vehicles (VehiclesController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vehicles` | Lấy xe của user | ✅ |
| GET | `/api/vehicles/{id}` | Chi tiết xe | ✅ |
| POST | `/api/vehicles` | Thêm xe mới | ✅ |
| PUT | `/api/vehicles/{id}` | Cập nhật xe | ✅ |
| DELETE | `/api/vehicles/{id}` | Xóa xe | ✅ |
| PUT | `/api/vehicles/{id}/set-primary` | Đặt xe chính | ✅ |

### 9.5. Posts & Slots (PostsController, SlotsController)

**Posts:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/posts/station/{stationId}` | Posts của trạm | ❌ |
| POST | `/api/posts` | Tạo post | 🔒 Admin |
| PUT | `/api/posts/{id}` | Cập nhật post | 🔒 Admin |
| DELETE | `/api/posts/{id}` | Xóa post | 🔒 Admin |

**Slots:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/slots/post/{postId}` | Slots của post | ❌ |
| POST | `/api/slots/bulk` | Tạo nhiều slots | 🔒 Admin |
| PUT | `/api/slots/{id}/block` | Block slot | 🔒 Staff |
| PUT | `/api/slots/{id}/unblock` | Unblock slot | 🔒 Staff |

### 9.6. Reviews (ReviewsController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reviews/station/{stationId}` | Reviews của trạm | ❌ |
| POST | `/api/reviews` | Tạo review | ✅ |
| PUT | `/api/reviews/{id}` | Cập nhật review | ✅ |
| DELETE | `/api/reviews/{id}` | Xóa review | ✅ |
| GET | `/api/reviews/station/{stationId}/summary` | Tổng hợp rating | ❌ |

### 9.7. QR Codes (QRCodesController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/qrcodes/generate` | Tạo QR code | 🔒 Admin |
| POST | `/api/qrcodes/validate` | Validate QR | ✅ |
| POST | `/api/qrcodes/use` | Sử dụng QR | ✅ |

### 9.8. Invoices (InvoicesController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/invoices` | Invoices của user | ✅ |
| GET | `/api/invoices/{id}` | Chi tiết invoice | ✅ |
| POST | `/api/invoices/{id}/process` | Xử lý thanh toán | 🔒 Staff |
| PUT | `/api/invoices/{id}/payment-status` | Cập nhật trạng thái | 🔒 Staff |
| GET | `/api/invoices/{id}/payment-history` | Lịch sử payment | ✅ |

### 9.9. Payment Methods (PaymentMethodsController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/payment-methods` | Payment methods của user | ✅ |
| POST | `/api/payment-methods` | Thêm payment method | ✅ |
| PUT | `/api/payment-methods/{id}` | Cập nhật | ✅ |
| DELETE | `/api/payment-methods/{id}` | Xóa | ✅ |
| PUT | `/api/payment-methods/{id}/set-default` | Đặt làm mặc định | ✅ |

### 9.10. User Profiles (UserProfilesController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user-profiles` | Lấy profile hiện tại | ✅ |
| PUT | `/api/user-profiles` | Cập nhật profile | ✅ |
| POST | `/api/user-profiles/avatar` | Upload avatar | ✅ |
| POST | `/api/user-profiles/change-password` | Đổi mật khẩu | ✅ |
| GET | `/api/user-profiles/statistics` | Thống kê user | ✅ |

### 9.11. Notifications (NotificationsController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Notifications của user | ✅ |
| GET | `/api/notifications/unread-count` | Số thông báo chưa đọc | ✅ |
| POST | `/api/notifications` | Tạo notification | 🔒 Admin |
| PUT | `/api/notifications/{id}/mark-read` | Đánh dấu đã đọc | ✅ |
| POST | `/api/notifications/broadcast` | Broadcast theo role | 🔒 Admin |

### 9.12. Admin Users (AdminUsersController)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/users` | Danh sách users (phân trang) | 🔒 Admin |
| GET | `/api/admin/users/{id}` | Chi tiết user | 🔒 Admin |
| POST | `/api/admin/users` | Tạo user mới | 🔒 Admin |
| PUT | `/api/admin/users/{id}` | Cập nhật user | 🔒 Admin |
| DELETE | `/api/admin/users/{id}` | Xóa user (soft delete) | 🔒 Admin |
| PUT | `/api/admin/users/{id}/activate` | Kích hoạt user | 🔒 Admin |
| PUT | `/api/admin/users/{id}/deactivate` | Vô hiệu hóa user | 🔒 Admin |
| POST | `/api/admin/users/{id}/reset-password` | Reset password | 🔒 Admin |
| GET | `/api/admin/users/{id}/activity-summary` | Tóm tắt hoạt động | 🔒 Admin |

### 9.13. Reports (ReportsController, AdminReportsController)

**User Reports:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports/my-costs` | Chi phí của tôi | ✅ |
| GET | `/api/reports/my-charging-habits` | Thói quen sạc | ✅ |

**Admin Reports:**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/reports/revenue` | Báo cáo doanh thu | 🔒 Admin |
| GET | `/api/admin/reports/usage` | Báo cáo sử dụng | 🔒 Admin |
| GET | `/api/admin/reports/station-performance` | Hiệu suất trạm | 🔒 Admin |
| GET | `/api/admin/reports/payment-methods` | Thống kê payment | 🔒 Admin |

---

## 10. HƯỚNG DẪN CÀI ĐẶT

### 10.1. Yêu Cầu Hệ Thống

| Phần mềm | Version | Link Download |
|----------|---------|---------------|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/download |
| Node.js | 18+ | https://nodejs.org/ |
| SQL Server | 2019+ | https://www.microsoft.com/sql-server |
| Git | Latest | https://git-scm.com/ |

### 10.2. Clone Repository

```powershell
git clone https://github.com/NguyenMinhThinh2005/FPTU_FA25_SWP391_G4_Topic3_SkaEV.git
cd FPTU_FA25_SWP391_G4_Topic3_SkaEV
```

### 10.3. Setup Database

#### **Cách 1: Automatic (Khuyến nghị)**
```powershell
cd database
sqlcmd -S localhost -E -i DEPLOY_COMPLETE.sql
```

#### **Cách 2: Manual**
```powershell
# 1. Tạo database
sqlcmd -S localhost -E -i 01_CREATE_DATABASE.sql

# 2. Tạo tables
sqlcmd -S localhost -d SkaEV_DB -E -i 02_CREATE_TABLES.sql

# 3. Insert master data
sqlcmd -S localhost -d SkaEV_DB -E -i 03_INSERT_DATA.sql

# 4. Tạo stored procedures
sqlcmd -S localhost -d SkaEV_DB -E -i 04_STORED_PROCEDURES.sql

# 5. Tạo views
sqlcmd -S localhost -d SkaEV_DB -E -i 05_CREATE_VIEWS.sql

# 6. Payment support
sqlcmd -S localhost -d SkaEV_DB -E -i 06_ADD_PAYMENT_SUPPORT.sql

# 7. Analytical views
sqlcmd -S localhost -d SkaEV_DB -E -i 07_ADD_REPORT_VIEWS_FIXED.sql
```

### 10.4. Configure Backend

**File: `SkaEV.API/appsettings.json`**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SkaEV_DB;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "JwtSettings": {
    "SecretKey": "YourVeryLongSecretKeyHere_AtLeast32Characters!",
    "Issuer": "SkaEV.API",
    "Audience": "SkaEV.Client",
    "ExpirationMinutes": 60
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

**⚠️ LƯU Ý:**
- Đối với môi trường production, đổi sang SQL Server Authentication:
  ```
  Server=localhost;Database=SkaEV_DB;User Id=sa;Password=YourPassword;TrustServerCertificate=True
  ```
- Thay `SecretKey` bằng chuỗi ngẫu nhiên dài ít nhất 32 ký tự
- Không commit `appsettings.json` có thông tin nhạy cảm lên Git

### 10.5. Setup Backend

```powershell
cd SkaEV.API

# Restore packages
dotnet restore

# Build
dotnet build

# Run
dotnet run
```

Backend sẽ chạy tại:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `https://localhost:5001/swagger`

### 10.6. Setup Frontend

```powershell
# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

### 10.7. Verify Installation

#### **Test Database Connection**
```powershell
sqlcmd -S localhost -d SkaEV_DB -E -Q "SELECT COUNT(*) AS TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"
# Expected: 18
```

#### **Test Backend API**
```powershell
# Health check
curl http://localhost:5000/health

# Get stations
curl http://localhost:5000/api/stations
```

#### **Test Frontend**
1. Mở browser: `http://localhost:5173`
2. Kiểm tra console (F12) không có lỗi
3. Thử đăng ký/đăng nhập

---

## 11. TESTING & DEPLOYMENT

### 11.1. Testing Strategies

#### **Unit Testing (Backend)**
```powershell
cd SkaEV.API
dotnet test
```

#### **Integration Testing**
- Sử dụng Postman collection
- Test các endpoint với different roles
- Verify database state sau mỗi operation

#### **Manual Testing Checklist**

**Authentication:**
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập với email/password
- [ ] Đăng nhập với tài khoản không tồn tại (expected: error)
- [ ] Đăng nhập với password sai (expected: error)
- [ ] Access protected endpoint without token (expected: 401)
- [ ] Access endpoint with expired token (expected: 401)

**Booking Flow:**
- [ ] Tìm trạm gần vị trí hiện tại
- [ ] Xem chi tiết trạm và availability
- [ ] Tạo scheduled booking
- [ ] Tạo immediate booking
- [ ] Scan QR code để validate
- [ ] Start charging session
- [ ] Xem real-time SOC updates
- [ ] Stop charging session
- [ ] Xem invoice được generate

**Payment:**
- [ ] Thêm payment method
- [ ] Set payment method mặc định
- [ ] Xem lịch sử invoices
- [ ] Process payment (staff)
- [ ] Xem payment history

**Admin:**
- [ ] Xem danh sách users (pagination)
- [ ] Tạo user mới
- [ ] Assign role cho user
- [ ] Deactivate user
- [ ] Reset password cho user
- [ ] Xem revenue reports
- [ ] Xem station performance

### 11.2. Build for Production

#### **Backend**
```powershell
cd SkaEV.API
dotnet publish -c Release -o ./publish
```

#### **Frontend**
```powershell
npm run build
# Output: dist/ folder
npm run preview  # Preview production build
```

### 11.3. Deployment Options

#### **Option 1: IIS (Windows Server)**
1. Install .NET Runtime trên server
2. Copy `publish/` folder đến server
3. Tạo Application Pool trong IIS
4. Point đến `publish/` folder
5. Configure binding (port 80/443)

#### **Option 2: Azure App Service**
1. Create App Service (Windows, .NET 8)
2. Deploy từ Visual Studio hoặc Azure CLI
3. Configure Connection String trong App Settings
4. Enable Always On

#### **Option 3: Docker**
```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY publish/ .
ENTRYPOINT ["dotnet", "SkaEV.API.dll"]
```

```powershell
docker build -t skaev-api .
docker run -p 5000:80 skaev-api
```

---

## 12. TROUBLESHOOTING

### 12.1. Common Backend Issues

#### **Issue: "Cannot connect to SQL Server"**
**Giải pháp:**
```powershell
# Kiểm tra SQL Server đang chạy
Get-Service -Name "MSSQLSERVER" | Start-Service

# Test connection
sqlcmd -S localhost -E -Q "SELECT @@VERSION"

# Kiểm tra connection string trong appsettings.json
```

#### **Issue: "JWT token expired"**
**Giải pháp:**
```javascript
// Frontend: Clear localStorage và login lại
localStorage.clear();
window.location.href = '/login';
```

#### **Issue: "CORS error"**
**Giải pháp:**
- Kiểm tra `Program.cs` → `AddCors()` configuration
- Đảm bảo frontend URL đúng trong `WithOrigins()`
- Restart backend sau khi thay đổi

#### **Issue: "Build failed - Missing packages"**
**Giải pháp:**
```powershell
cd SkaEV.API
dotnet clean
dotnet restore
dotnet build
```

### 12.2. Common Frontend Issues

#### **Issue: "npm install failed"**
**Giải pháp:**
```powershell
# Xóa node_modules và package-lock.json
Remove-Item -Recurse -Force node_modules, package-lock.json

# Install lại
npm install
```

#### **Issue: "Cannot reach backend API"**
**Giải pháp:**
- Kiểm tra backend đang chạy: `curl http://localhost:5000/health`
- Kiểm tra `baseURL` trong `services/api.js`
- Kiểm tra browser console cho CORS errors

#### **Issue: "Unauthorized 401"**
**Giải pháp:**
- Kiểm tra token trong localStorage
- Login lại để lấy token mới
- Verify token chưa expire

### 12.3. Database Issues

#### **Issue: "Table not found"**
**Giải pháp:**
```sql
-- Kiểm tra tables
USE SkaEV_DB;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';
-- Expected: 18 tables

-- Re-run migration nếu thiếu
sqlcmd -S localhost -d SkaEV_DB -E -i database/02_CREATE_TABLES.sql
```

#### **Issue: "Foreign key constraint error"**
**Giải pháp:**
- Kiểm tra thứ tự insert data
- Đảm bảo parent record exists trước khi insert child
- Check constraint names trong error message

#### **Issue: "Login stored procedure fails"**
**Giải pháp:**
```sql
-- Verify stored procedure exists
SELECT name FROM sys.procedures WHERE name = 'sp_authenticate_user';

-- Re-create nếu cần
sqlcmd -S localhost -d SkaEV_DB -E -i database/04_STORED_PROCEDURES.sql
```

### 12.4. Performance Issues

#### **Issue: "Slow API response"**
**Giải pháp:**
- Enable SQL Server query profiling
- Check indexes trên frequently queried columns
- Consider caching with Redis
- Optimize N+1 query problems với `.Include()`

#### **Issue: "High memory usage"**
**Giải pháp:**
- Implement pagination cho large datasets
- Dispose DbContext properly (using statement)
- Optimize LINQ queries (avoid `.ToList()` prematurely)

---

## 📊 THỐNG KÊ DỰ ÁN

### Code Statistics

| Metric | Backend | Frontend | Database | Total |
|--------|---------|----------|----------|-------|
| **Files** | 80+ | 50+ | 10+ | 140+ |
| **Lines of Code** | ~15,000 | ~8,000 | ~3,000 | ~26,000 |
| **Controllers** | 17 | - | - | 17 |
| **Services** | 15 | - | - | 15 |
| **Entities** | 18 | - | - | 18 |
| **DTOs** | 45+ | - | - | 45+ |
| **API Endpoints** | 100+ | - | - | 100+ |
| **Database Tables** | - | - | 18 | 18 |
| **Database Views** | - | - | 6 | 6 |
| **Stored Procedures** | - | - | 15 | 15 |

### Development Timeline

- **Week 1-2**: Database design, ERD, schema
- **Week 3-4**: Backend API development (Auth, Stations, Bookings)
- **Week 5-6**: Frontend development (React components, routing)
- **Week 7-8**: Integration (API connection, state management)
- **Week 9-10**: Advanced features (Payment, QR, Reports)
- **Week 11-12**: Testing, bug fixes, deployment preparation

---

## 🎯 FUTURE ENHANCEMENTS

### Phase 2 Features (Planned)

1. **Real-time Communication**
   - SignalR for real-time SOC updates
   - Live chat support
   - Push notifications

2. **Mobile Application**
   - React Native app
   - Native QR scanner
   - Offline mode

3. **Advanced Analytics**
   - Machine learning for demand prediction
   - Price optimization algorithms
   - User behavior analysis

4. **Integration**
   - Payment gateways (VNPay, Momo, ZaloPay)
   - Google Maps API
   - Email service (SendGrid)
   - SMS notifications

5. **IoT Integration**
   - Connect to actual charging hardware
   - OCPP (Open Charge Point Protocol) support
   - Real sensor data integration

---

## 📞 SUPPORT & CONTACT

### Project Team

**SWP391_G4_Topic3 - FPT University**

### Documentation

- **README.md** - Quick start guide
- **LOCAL_SETUP_GUIDE.md** - Detailed setup instructions
- **API_DOCUMENTATION.md** - API reference
- **DATABASE_BACKEND_COMPATIBILITY.md** - Schema mapping
- **PROJECT_DOCUMENTATION.md** - This file (comprehensive guide)

### External Resources

- [ASP.NET Core Documentation](https://learn.microsoft.com/aspnet/core)
- [React Documentation](https://react.dev)
- [Entity Framework Core](https://learn.microsoft.com/ef/core)
- [SQL Server Documentation](https://learn.microsoft.com/sql/sql-server)
- [JWT.io](https://jwt.io) - JWT debugger

---

## 📄 LICENSE

This project is developed as an academic project for FPT University.  
All rights reserved © 2025 SWP391_G4_Topic3

---

**📅 Last Updated:** October 15, 2025  
**📌 Version:** 1.0.0  
**✨ Status:** Production Ready

---

