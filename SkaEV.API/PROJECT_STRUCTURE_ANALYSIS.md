# 📋 Phân Tích Chi Tiết Cấu Trúc Dự Án SkaEV.API

## 🎯 Tổng Quan

**SkaEV.API** là một ASP.NET Core Web API được xây dựng theo kiến trúc **Clean Architecture** (Layered Architecture), hỗ trợ hệ thống quản lý trạm sạc xe điện.

### Thông Tin Kỹ Thuật
- **Framework**: .NET 9.0 (Target Framework)
- **ORM**: Entity Framework Core 8.0
- **Database**: SQL Server / SQLite (hỗ trợ cả hai)
- **Authentication**: JWT Bearer Token
- **Real-time**: SignalR
- **Logging**: Serilog
- **Documentation**: Swagger/OpenAPI

---

## 📁 Cấu Trúc Thư Mục Chi Tiết

```
SkaEV.API/
├── 📂 Application/              # Tầng Business Logic
│   ├── 📂 Common/              # Utilities chung
│   │   └── ApiResponse.cs     # Wrapper cho API responses
│   ├── 📂 Constants/          # Hằng số hệ thống
│   │   ├── PaymentStatuses.cs
│   │   └── Roles.cs
│   ├── 📂 DTOs/               # Data Transfer Objects (28 files)
│   │   ├── Admin/             # DTOs cho Admin
│   │   ├── Auth/              # DTOs cho Authentication
│   │   ├── Bookings/          # DTOs cho Bookings
│   │   ├── Incidents/         # DTOs cho Incidents
│   │   ├── Invoices/          # DTOs cho Invoices
│   │   ├── Issues/            # DTOs cho Issues
│   │   ├── Maps/              # DTOs cho Maps/Directions
│   │   ├── Notifications/     # DTOs cho Notifications
│   │   ├── Payments/          # DTOs cho Payments
│   │   ├── Posts/             # DTOs cho Charging Posts
│   │   ├── QRCodes/           # DTOs cho QR Codes
│   │   ├── Reports/           # DTOs cho Reports
│   │   ├── Reviews/           # DTOs cho Reviews
│   │   ├── Slots/             # DTOs cho Charging Slots
│   │   ├── Staff/             # DTOs cho Staff Dashboard
│   │   ├── Stations/          # DTOs cho Stations
│   │   ├── UserProfiles/      # DTOs cho User Profiles
│   │   └── Vehicles/          # DTOs cho Vehicles
│   ├── 📂 Options/            # Configuration Options
│   │   └── GoogleMapsOptions.cs
│   └── 📂 Services/           # Business Logic Services (49 files)
│       ├── AuthService.cs
│       ├── BookingService.cs
│       ├── StationService.cs
│       ├── InvoiceService.cs
│       ├── PaymentMethodService.cs
│       ├── MapsService.cs
│       ├── AdminStationService.cs
│       ├── AdvancedAnalyticsService.cs
│       ├── DemandForecastingService.cs
│       ├── Payments/          # Payment Processors
│       │   ├── IPaymentProcessor.cs
│       │   ├── SimulatedPaymentProcessor.cs
│       │   └── VNPayService.cs
│       └── Simulation/        # Background Services
│           ├── ChargingSimulationService.cs
│           └── SystemEventsSimulationService.cs
│
├── 📂 Controllers/            # API Controllers (38 controllers)
│   ├── BaseApiController.cs  # Base class cho tất cả controllers
│   ├── AuthController.cs
│   ├── StationsController.cs
│   ├── BookingsController.cs
│   ├── AdminController.cs
│   ├── AdminStationsController.cs
│   ├── AdminUsersController.cs
│   ├── AdminReportsController.cs
│   ├── InvoicesController.cs
│   ├── VehiclesController.cs
│   ├── ReviewsController.cs
│   ├── NotificationsController.cs
│   ├── QRCodesController.cs
│   ├── PostsController.cs
│   ├── SlotsController.cs
│   ├── UserProfilesController.cs
│   ├── PaymentMethodsController.cs
│   ├── VNPayController.cs
│   ├── MockPaymentController.cs
│   ├── StaffDashboardController.cs
│   ├── StaffIssuesController.cs
│   ├── StationAnalyticsController.cs
│   ├── AdvancedAnalyticsController.cs
│   ├── DemandForecastingController.cs
│   ├── MonitoringController.cs
│   ├── IncidentController.cs
│   ├── MaintenanceController.cs
│   ├── ReportsController.cs
│   ├── ServicePlansController.cs
│   ├── MapsController.cs
│   ├── StatisticsController.cs
│   ├── HealthController.cs
│   ├── DiagnosticController.cs
│   ├── DebugController.cs
│   ├── TestController.cs
│   └── StationControlSimulationController.cs
│
├── 📂 Domain/                 # Tầng Domain (Business Entities)
│   └── 📂 Entities/          # Database Models (20 entities)
│       ├── User.cs
│       ├── UserProfile.cs
│       ├── Vehicle.cs
│       ├── ChargingStation.cs
│       ├── ChargingPost.cs
│       ├── ChargingSlot.cs
│       ├── Booking.cs
│       ├── SocTracking.cs
│       ├── Invoice.cs
│       ├── QRCode.cs
│       ├── Notification.cs
│       ├── SystemLog.cs
│       ├── Review.cs
│       ├── PricingRule.cs
│       ├── StationStaff.cs
│       ├── PaymentMethod.cs
│       ├── Payment.cs
│       ├── ServicePlan.cs
│       ├── Incident.cs
│       ├── MaintenanceTeam.cs
│       └── 📂 Views/          # Database Views
│           └── ReportViews.cs
│
├── 📂 Infrastructure/         # Tầng Infrastructure
│   └── 📂 Data/              # Data Access Layer
│       ├── SkaEVDbContext.cs # EF Core DbContext
│       ├── SeedSystemLogs.cs # Database Seeding
│       └── 📂 Migrations/    # EF Core Migrations (7 files)
│
├── 📂 Hubs/                   # SignalR Hubs
│   └── StationMonitoringHub.cs
│
├── 📂 Migrations/             # EF Core Migrations (root level)
│
├── 📂 database/               # Database Scripts
│   ├── 001_create_daily_station_metrics.sql
│   ├── 002_seed_sample_daily_metrics.sql
│   └── update_schema.sql
│
├── 📂 logs/                   # Application Logs
│   └── skaev-YYYYMMDD.txt
│
├── 📂 tools/                  # Utility Tools
│
├── 📂 wwwroot/                # Static Files
│   └── index.html
│
├── Program.cs                  # Application Entry Point
├── appsettings.json           # Configuration
├── appsettings.Development.json
├── appsettings.SQLite.json
├── SkaEV.API.csproj           # Project File
└── README.md                  # Documentation
```

---

## 🏗️ Kiến Trúc Phân Tầng (Layered Architecture)

### 1. **Presentation Layer** (Controllers/)
- **Chức năng**: Xử lý HTTP requests/responses, routing, validation
- **Pattern**: RESTful API Controllers
- **Base Class**: `BaseApiController` - cung cấp:
  - `CurrentUserId`: Lấy User ID từ JWT token
  - `CurrentUserRole`: Lấy Role từ JWT token
  - `OkResponse<T>()`: Trả về 200 OK với ApiResponse wrapper
  - `BadRequestResponse()`: Trả về 400 Bad Request
  - `NotFoundResponse()`: Trả về 404 Not Found
  - `ForbiddenResponse()`: Trả về 403 Forbidden
  - `ServerErrorResponse()`: Trả về 500 Internal Server Error

### 2. **Application Layer** (Application/)
- **Chức năng**: Business logic, orchestration, DTOs
- **Components**:
  - **Services**: Business logic services (49 services)
  - **DTOs**: Data Transfer Objects (28 DTO files)
  - **Options**: Configuration options classes
  - **Constants**: System constants

### 3. **Domain Layer** (Domain/)
- **Chức năng**: Business entities, domain models
- **Components**:
  - **Entities**: 20 domain entities
  - **Views**: Database view models

### 4. **Infrastructure Layer** (Infrastructure/)
- **Chức năng**: Data access, external services
- **Components**:
  - **Data**: EF Core DbContext, Migrations
  - **Database**: SQL Server / SQLite support

---

## 🗄️ Database Schema

### Entities (20 tables)

#### **User Management**
1. **users** - Tài khoản người dùng
2. **user_profiles** - Thông tin chi tiết người dùng
3. **vehicles** - Xe điện của người dùng

#### **Station Management**
4. **charging_stations** - Trạm sạc
5. **charging_posts** - Cột sạc (trong trạm)
6. **charging_slots** - Khe sạc (trong cột)
7. **station_staff** - Nhân viên trạm
8. **pricing_rules** - Quy tắc giá

#### **Booking & Charging**
9. **bookings** - Đặt chỗ sạc
10. **soc_tracking** - Theo dõi State of Charge
11. **qr_codes** - Mã QR cho booking

#### **Payment & Billing**
12. **invoices** - Hóa đơn
13. **payment_methods** - Phương thức thanh toán
14. **payments** - Giao dịch thanh toán
15. **service_plans** - Gói dịch vụ

#### **Support & Management**
16. **notifications** - Thông báo
17. **reviews** - Đánh giá trạm
18. **incidents** - Sự cố
19. **maintenance_teams** - Đội bảo trì
20. **system_logs** - Log hệ thống

### Database Views (6 views)
1. **v_user_cost_reports** - Báo cáo chi phí người dùng
2. **v_user_charging_habits** - Thói quen sạc của người dùng
3. **v_admin_revenue_reports** - Báo cáo doanh thu admin
4. **v_admin_usage_reports** - Báo cáo sử dụng admin
5. **v_station_performance** - Hiệu suất trạm
6. **v_payment_methods_summary** - Tổng hợp phương thức thanh toán

---

## 🔧 Services Architecture

### Core Services (15 services)
1. **AuthService** - Xác thực và phân quyền
2. **StationService** - Quản lý trạm sạc
3. **BookingService** - Quản lý đặt chỗ
4. **InvoiceService** - Quản lý hóa đơn
5. **PaymentMethodService** - Quản lý phương thức thanh toán
6. **VehicleService** - Quản lý xe
7. **ReviewService** - Quản lý đánh giá
8. **NotificationService** - Quản lý thông báo
9. **QRCodeService** - Quản lý QR code
10. **PostService** - Quản lý cột sạc
11. **SlotService** - Quản lý khe sạc
12. **UserProfileService** - Quản lý profile người dùng
13. **ReportService** - Báo cáo
14. **IssueService** - Quản lý sự cố
15. **MapsService** - Tích hợp Google Maps

### Admin Services (5 services)
1. **AdminUserService** - Quản lý người dùng (Admin)
2. **AdminStationService** - Quản lý trạm (Admin)
3. **AdminStationManagementService** - Quản lý trạm nâng cao
4. **AdvancedAnalyticsService** - Phân tích nâng cao
5. **StationAnalyticsService** - Phân tích trạm

### Staff Services (2 services)
1. **StaffDashboardService** - Dashboard nhân viên
2. **IncidentService** - Quản lý sự cố

### Payment Services (3 services)
1. **VNPayService** - Tích hợp VNPay
2. **SimulatedPaymentProcessor** - Mô phỏng thanh toán
3. **IPaymentProcessor** - Interface thanh toán

### Analytics & Forecasting (2 services)
1. **DemandForecastingService** - Dự báo nhu cầu
2. **MonitoringService** - Giám sát hệ thống

### Background Services (2 services - hiện đang disabled)
1. **ChargingSimulationService** - Mô phỏng quá trình sạc
2. **SystemEventsSimulationService** - Mô phỏng sự kiện hệ thống

---

## 🔐 Authentication & Authorization

### JWT Authentication
- **Scheme**: Bearer Token
- **Configuration**: `appsettings.json` → `JwtSettings`
- **Claims**:
  - `NameIdentifier`: User ID
  - `Role`: User role (customer, staff, admin)

### User Roles
1. **customer** - Khách hàng
2. **staff** - Nhân viên trạm
3. **admin** - Quản trị viên

---

## 📡 Real-time Communication

### SignalR Hub
- **Hub**: `StationMonitoringHub`
- **Endpoints**:
  - `/hubs/station-monitoring` (hiện đang commented out)
- **Methods**:
  - `BroadcastStationStatus()` - Phát trạng thái trạm
  - `BroadcastSlotStatus()` - Phát trạng thái khe sạc
  - `BroadcastAlert()` - Phát cảnh báo
  - `SubscribeToStation()` - Đăng ký nhận cập nhật trạm
  - `UnsubscribeFromStation()` - Hủy đăng ký

---

## 🔌 External Integrations

### Google Maps API
- **Service**: `MapsService`
- **Configuration**: `GoogleMapsOptions`
- **Features**: Directions, Geocoding, Places

### VNPay Payment Gateway
- **Service**: `VNPayService`
- **Configuration**: `appsettings.json` → `VNPay`
- **Endpoints**: `/api/vnpay/*`

---

## 📊 Logging & Monitoring

### Serilog Configuration
- **Console Logging**: Real-time console output
- **File Logging**: `logs/skaev-YYYYMMDD.txt` (rolling daily)
- **Log Levels**:
  - Default: Information
  - Microsoft: Warning
  - EF Core: Error

### Health Checks
- **Endpoint**: `/health`
- **Checks**: Database connectivity

---

## 🗂️ Configuration Files

### appsettings.json
- **ConnectionStrings**: Database connections
- **JwtSettings**: JWT configuration
- **VNPay**: VNPay gateway settings
- **Serilog**: Logging configuration
- **GoogleMaps**: Maps API settings

### Environment-specific
- `appsettings.Development.json` - Development
- `appsettings.SQLite.json` - SQLite mode

---

## 🚀 Startup Pipeline (Program.cs)

### 1. Builder Initialization
- WebApplication builder setup
- Connection string detection (SQL Server vs SQLite)

### 2. Logging Configuration
- Serilog setup
- Console + File logging

### 3. Service Registration
- **MVC & JSON**: Newtonsoft.Json (camelCase)
- **Database**: EF Core (SQL Server/SQLite)
- **Authentication**: JWT Bearer
- **CORS**: Frontend origins
- **Services**: 20+ scoped services
- **Swagger**: OpenAPI documentation
- **SignalR**: Real-time hub
- **Health Checks**: System monitoring

### 4. Middleware Pipeline
1. Exception Handler (global)
2. Swagger UI (dev only)
3. CORS
4. Request Logging (Serilog)
5. Authentication
6. Authorization
7. Endpoint Routing

### 5. Startup Logic
- Database seeding (optional)
- Auto-migration (SQLite only)
- Application start

---

## 📦 NuGet Packages

### Core Packages
- `Microsoft.AspNetCore.Authentication.JwtBearer` (8.0.11)
- `Microsoft.EntityFrameworkCore` (8.0.11)
- `Microsoft.EntityFrameworkCore.SqlServer` (8.0.11)
- `Microsoft.EntityFrameworkCore.Sqlite` (8.0.11)
- `Microsoft.AspNetCore.Mvc.NewtonsoftJson` (8.0.11)

### Spatial Data
- `NetTopologySuite` (2.5.0)
- `NetTopologySuite.IO.SqlServerBytes` (2.1.0)
- `Microsoft.EntityFrameworkCore.SqlServer.NetTopologySuite` (8.0.11)

### Utilities
- `AutoMapper` (12.0.1)
- `FluentValidation.AspNetCore` (11.3.0)
- `Serilog.AspNetCore` (8.0.0)
- `BCrypt.Net-Next` (4.0.3)
- `QRCoder` (1.4.3)
- `VNPAY.NET` (2.1.0)
- `Swashbuckle.AspNetCore` (6.5.0)

---

## 🎯 API Endpoints Summary

### Authentication (`/api/auth`)
- POST `/login` - Đăng nhập
- POST `/register` - Đăng ký
- GET `/profile` - Lấy profile
- POST `/logout` - Đăng xuất

### Stations (`/api/stations`)
- GET `/` - Danh sách trạm
- GET `/{id}` - Chi tiết trạm
- GET `/nearby` - Tìm trạm gần
- POST `/` - Tạo trạm (Admin)
- PUT `/{id}` - Cập nhật trạm
- DELETE `/{id}` - Xóa trạm

### Bookings (`/api/bookings`)
- GET `/` - Danh sách booking
- GET `/{id}` - Chi tiết booking
- POST `/` - Tạo booking
- POST `/qr-scan` - Scan QR
- PUT `/{id}/start` - Bắt đầu sạc
- PUT `/{id}/complete` - Hoàn thành sạc
- DELETE `/{id}/cancel` - Hủy booking

### Admin (`/api/admin/*`)
- Users management
- Stations management
- Reports & Analytics
- System monitoring

### Staff (`/api/staff/*`)
- Dashboard
- Issue management
- Station control

### Payments (`/api/payments`, `/api/vnpay`)
- Payment methods
- VNPay integration
- Mock payment (testing)

---

## 🔄 Data Flow

```
HTTP Request
    ↓
Controller (Presentation Layer)
    ↓
Service (Application Layer)
    ↓
DbContext (Infrastructure Layer)
    ↓
Database (SQL Server/SQLite)
    ↓
Response (DTO → JSON)
```

---

## 🛡️ Security Features

✅ **Implemented**:
- JWT Bearer Token Authentication
- Role-based Authorization
- Password Hashing (BCrypt)
- CORS Configuration
- SQL Injection Protection (EF Core)
- Soft Delete (Global Query Filter)

⚠️ **TODO**:
- Rate Limiting
- API Versioning
- HTTPS Enforcement (Production)

---

## 📝 Best Practices

1. **Separation of Concerns**: Clear layer separation
2. **Dependency Injection**: All services registered in Program.cs
3. **Repository Pattern**: EF Core DbContext as repository
4. **DTO Pattern**: Separate DTOs from entities
5. **Base Controller**: Common functionality in BaseApiController
6. **Consistent Response**: ApiResponse wrapper for all responses
7. **Soft Delete**: Global query filter for deleted records
8. **Logging**: Comprehensive logging with Serilog
9. **Error Handling**: Global exception handler
10. **Documentation**: Swagger/OpenAPI

---

## 🔍 Key Design Patterns

1. **Layered Architecture**: Presentation → Application → Domain → Infrastructure
2. **Repository Pattern**: EF Core DbContext
3. **Service Pattern**: Business logic in services
4. **DTO Pattern**: Data transfer objects
5. **Dependency Injection**: Constructor injection
6. **Factory Pattern**: ApiResponse factory methods
7. **Strategy Pattern**: Payment processors (VNPay, Simulated)

---

## 📈 Project Statistics

- **Total Controllers**: 38
- **Total Services**: 49
- **Total DTOs**: 28 files
- **Total Entities**: 20
- **Database Views**: 6
- **Migrations**: 7
- **NuGet Packages**: 15+

---

## 🎓 Kết Luận

Dự án **SkaEV.API** được xây dựng theo kiến trúc Clean Architecture với:
- ✅ Tách biệt rõ ràng các tầng
- ✅ Code organization tốt
- ✅ Scalable và maintainable
- ✅ Hỗ trợ đầy đủ các tính năng cần thiết
- ✅ Security và logging tốt
- ✅ Documentation đầy đủ

Dự án sẵn sàng cho development và có thể mở rộng dễ dàng.

---

*Generated: 2025-01-XX*
*Project: SkaEV.API - FPTU_FA25_SWP391_G4_Topic3*

