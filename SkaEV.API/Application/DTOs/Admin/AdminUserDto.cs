namespace SkaEV.API.Application.DTOs.Admin;

/// <summary>
/// DTO thông tin người dùng dành cho Admin.
/// </summary>
public class AdminUserDto
{
    /// <summary>
    /// ID người dùng.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Email người dùng.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Họ và tên đầy đủ.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Số điện thoại.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Vai trò (Admin, Staff, Customer).
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>
    /// Trạng thái tài khoản (Active, Inactive, Locked).
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Ngày tạo tài khoản.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Ngày cập nhật gần nhất.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Thời gian đăng nhập gần nhất.
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// ID trạm quản lý (nếu là Staff).
    /// </summary>
    public int? ManagedStationId { get; set; }

    /// <summary>
    /// Tên trạm quản lý.
    /// </summary>
    public string? ManagedStationName { get; set; }

    /// <summary>
    /// Địa chỉ trạm quản lý.
    /// </summary>
    public string? ManagedStationAddress { get; set; }

    /// <summary>
    /// Thành phố của trạm quản lý.
    /// </summary>
    public string? ManagedStationCity { get; set; }
}

/// <summary>
/// DTO chi tiết người dùng dành cho Admin (bao gồm thống kê).
/// </summary>
public class AdminUserDetailDto : AdminUserDto
{
    /// <summary>
    /// URL ảnh đại diện.
    /// </summary>
    public string? AvatarUrl { get; set; }

    /// <summary>
    /// Tổng số lần đặt chỗ.
    /// </summary>
    public int TotalBookings { get; set; }

    /// <summary>
    /// Tổng số tiền đã chi tiêu.
    /// </summary>
    public decimal TotalSpent { get; set; }

    /// <summary>
    /// Số lượng phương tiện đã đăng ký.
    /// </summary>
    public int VehiclesCount { get; set; }

    /// <summary>
    /// Lý do vô hiệu hóa tài khoản (nếu có).
    /// </summary>
    public string? DeactivationReason { get; set; }

    /// <summary>
    /// Thời gian vô hiệu hóa.
    /// </summary>
    public DateTime? DeactivatedAt { get; set; }
}

/// <summary>
/// DTO tạo người dùng mới bởi Admin.
/// </summary>
public class CreateUserDto
{
    /// <summary>
    /// Email đăng nhập.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Mật khẩu khởi tạo.
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Họ và tên.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Số điện thoại.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Vai trò (mặc định là customer).
    /// </summary>
    public string Role { get; set; } = "customer";

    /// <summary>
    /// ID trạm quản lý (nếu tạo Staff).
    /// </summary>
    public int? ManagedStationId { get; set; }
}

/// <summary>
/// DTO cập nhật thông tin người dùng bởi Admin.
/// </summary>
public class UpdateUserDto
{
    /// <summary>
    /// Họ và tên mới.
    /// </summary>
    public string? FullName { get; set; }

    /// <summary>
    /// Số điện thoại mới.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Email mới.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Vai trò mới.
    /// </summary>
    public string? Role { get; set; }

    /// <summary>
    /// ID trạm quản lý mới (nếu là Staff).
    /// </summary>
    public int? ManagedStationId { get; set; }
}

/// <summary>
/// DTO cập nhật vai trò người dùng.
/// </summary>
public class UpdateUserRoleDto
{
    /// <summary>
    /// Vai trò mới.
    /// </summary>
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// DTO vô hiệu hóa người dùng.
/// </summary>
public class DeactivateUserDto
{
    /// <summary>
    /// Lý do vô hiệu hóa.
    /// </summary>
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// DTO kết quả đặt lại mật khẩu.
/// </summary>
public class ResetPasswordResultDto
{
    /// <summary>
    /// Mật khẩu tạm thời.
    /// </summary>
    public string TemporaryPassword { get; set; } = string.Empty;

    /// <summary>
    /// Thông báo kết quả.
    /// </summary>
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// DTO tóm tắt hoạt động của người dùng.
/// </summary>
public class UserActivitySummaryDto
{
    /// <summary>
    /// ID người dùng.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Tổng số lần đặt chỗ.
    /// </summary>
    public int TotalBookings { get; set; }

    /// <summary>
    /// Số lần đặt chỗ trong tháng trước.
    /// </summary>
    public int LastMonthBookings { get; set; }

    /// <summary>
    /// Tổng doanh thu từ người dùng này.
    /// </summary>
    public decimal TotalRevenue { get; set; }

    /// <summary>
    /// Doanh thu tháng trước.
    /// </summary>
    public decimal LastMonthRevenue { get; set; }

    /// <summary>
    /// Ngày đặt chỗ gần nhất.
    /// </summary>
    public DateTime? LastBookingDate { get; set; }

    /// <summary>
    /// Ngày đăng nhập gần nhất.
    /// </summary>
    public DateTime? LastLoginDate { get; set; }

    /// <summary>
    /// Danh sách các hoạt động gần đây.
    /// </summary>
    public List<string> RecentActivities { get; set; } = new();
}

/// <summary>
/// DTO tóm tắt thống kê người dùng toàn hệ thống.
/// </summary>
public class UserStatisticsSummaryDto
{
    /// <summary>
    /// Tổng số người dùng.
    /// </summary>
    public int TotalUsers { get; set; }

    /// <summary>
    /// Số người dùng đang hoạt động.
    /// </summary>
    public int ActiveUsers { get; set; }

    /// <summary>
    /// Số người dùng không hoạt động.
    /// </summary>
    public int InactiveUsers { get; set; }

    /// <summary>
    /// Số lượng khách hàng.
    /// </summary>
    public int CustomersCount { get; set; }

    /// <summary>
    /// Số lượng nhân viên.
    /// </summary>
    public int StaffCount { get; set; }

    /// <summary>
    /// Số lượng quản trị viên.
    /// </summary>
    public int AdminsCount { get; set; }

    /// <summary>
    /// Số người dùng mới trong tháng này.
    /// </summary>
    public int NewUsersThisMonth { get; set; }

    /// <summary>
    /// Số người dùng mới trong tháng trước.
    /// </summary>
    public int NewUsersLastMonth { get; set; }
}
