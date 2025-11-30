namespace SkaEV.API.Application.DTOs.Admin;

public class AdminUserDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int? ManagedStationId { get; set; }
    public string? ManagedStationName { get; set; }
    public string? ManagedStationAddress { get; set; }
    public string? ManagedStationCity { get; set; }
}

public class AdminUserDetailDto : AdminUserDto
{
    public string? AvatarUrl { get; set; }
    public int TotalBookings { get; set; }
    public decimal TotalSpent { get; set; }
    public int VehiclesCount { get; set; }
    public string? DeactivationReason { get; set; }
    public DateTime? DeactivatedAt { get; set; }
}

public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "customer";
    public int? ManagedStationId { get; set; }
}

public class UpdateUserDto
{
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public int? ManagedStationId { get; set; }
}

public class UpdateUserRoleDto
{
    public string Role { get; set; } = string.Empty;
}

public class DeactivateUserDto
{
    public string Reason { get; set; } = string.Empty;
}

public class ResetPasswordResultDto
{
    public string TemporaryPassword { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class UserActivitySummaryDto
{
    public int UserId { get; set; }
    public int TotalBookings { get; set; }
    public int LastMonthBookings { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal LastMonthRevenue { get; set; }
    public DateTime? LastBookingDate { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public List<string> RecentActivities { get; set; } = new();
}

public class UserStatisticsSummaryDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public int CustomersCount { get; set; }
    public int StaffCount { get; set; }
    public int AdminsCount { get; set; }
    public int NewUsersThisMonth { get; set; }
    public int NewUsersLastMonth { get; set; }
}
