using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Service quản lý người dùng dành cho Admin.
/// </summary>
public partial class AdminUserService : IAdminUserService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(SkaEVDbContext context, ILogger<AdminUserService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách tất cả người dùng với bộ lọc và phân trang.
    /// </summary>
    public async Task<IEnumerable<AdminUserDto>> GetAllUsersAsync(string? role, string? status, string? search, int page, int pageSize)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role))
            query = query.Where(u => u.Role == role);

        if (!string.IsNullOrEmpty(status))
        {
            var isActive = status == "active";
            query = query.Where(u => u.IsActive == isActive);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => 
                u.FullName.Contains(search) || 
                u.Email.Contains(search) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        return await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto
            {
                UserId = u.UserId,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                Status = u.IsActive ? "active" : "inactive",
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                LastLoginAt = null
            })
            .ToListAsync();
    }

    /// <summary>
    /// Đếm tổng số người dùng thỏa mãn điều kiện lọc.
    /// </summary>
    public async Task<int> GetUserCountAsync(string? role, string? status, string? search)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role))
            query = query.Where(u => u.Role == role);

        if (!string.IsNullOrEmpty(status))
        {
            var isActive = status == "active";
            query = query.Where(u => u.IsActive == isActive);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => 
                u.FullName.Contains(search) || 
                u.Email.Contains(search) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        return await query.CountAsync();
    }

    /// <summary>
    /// Lấy thông tin chi tiết người dùng.
    /// </summary>
    public async Task<AdminUserDetailDto?> GetUserDetailAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserProfile)
            .Include(u => u.Vehicles)
            .Include(u => u.Bookings)
            .Include(u => u.Invoices)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            return null;

        return new AdminUserDetailDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            Status = user.IsActive ? "active" : "inactive",
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = null, // Chưa theo dõi trong schema hiện tại
            AvatarUrl = user.UserProfile?.AvatarUrl,
            TotalBookings = user.Bookings.Count,
            TotalSpent = user.Invoices.Sum(i => i.TotalAmount),
            VehiclesCount = user.Vehicles.Count,
            DeactivationReason = null, // Chưa có trong schema
            DeactivatedAt = user.IsActive ? null : user.UpdatedAt
        };
    }

    /// <summary>
    /// Tạo người dùng mới.
    /// </summary>
    public async Task<AdminUserDto> CreateUserAsync(CreateUserDto createDto)
    {
        try
        {
            _logger.LogInformation("Creating user with email: {Email}, role: {Role}", createDto.Email, createDto.Role);

            // Kiểm tra email đã tồn tại chưa
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == createDto.Email);

            if (existingUser != null)
            {
                _logger.LogWarning("Email {Email} already exists", createDto.Email);
                throw new ArgumentException("Email already in use");
            }

            var validRoles = new[] { "customer", "staff", "admin" };
            if (!validRoles.Contains(createDto.Role))
            {
                _logger.LogWarning("Invalid role: {Role}", createDto.Role);
                throw new ArgumentException("Invalid role");
            }

            _logger.LogInformation("Hashing password for user {Email}", createDto.Email);
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(createDto.Password, 11);

            var user = new User
            {
                Email = createDto.Email,
                PasswordHash = hashedPassword,
                FullName = createDto.FullName,
                PhoneNumber = createDto.PhoneNumber,
                Role = createDto.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Adding user to database: {Email}", createDto.Email);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User created with ID: {UserId}, creating profile...", user.UserId);

            // Tạo hồ sơ người dùng
            var profile = new UserProfile
            {
                UserId = user.UserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.UserProfiles.Add(profile);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Successfully created user {UserId} with role {Role}", user.UserId, createDto.Role);
            return MapToDto(user);
        }
        catch (ArgumentException)
        {
            throw; // Ném lại ArgumentException để controller xử lý
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user {Email}: {Message}", createDto.Email, ex.Message);
            throw new Exception($"Failed to create user: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Cập nhật thông tin người dùng.
    /// </summary>
    public async Task<AdminUserDto> UpdateUserAsync(int userId, UpdateUserDto updateDto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        if (updateDto.FullName != null)
            user.FullName = updateDto.FullName;
        
        if (updateDto.PhoneNumber != null)
            user.PhoneNumber = updateDto.PhoneNumber;
        
        if (updateDto.Email != null)
        {
            // Kiểm tra email mới có bị trùng không
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == updateDto.Email && u.UserId != userId);
            
            if (emailExists)
                throw new ArgumentException("Email already in use");
            
            user.Email = updateDto.Email;
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated user {UserId}", userId);
        return MapToDto(user);
    }

    /// <summary>
    /// Cập nhật vai trò người dùng.
    /// </summary>
    public async Task<AdminUserDto> UpdateUserRoleAsync(int userId, string role)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        var validRoles = new[] { "customer", "staff", "admin" };
        if (!validRoles.Contains(role))
            throw new ArgumentException("Invalid role");

        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated user {UserId} role to {Role}", userId, role);
        return MapToDto(user);
    }

    /// <summary>
    /// Kích hoạt tài khoản người dùng.
    /// </summary>
    public async Task<AdminUserDto> ActivateUserAsync(int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Activated user {UserId}", userId);
        return MapToDto(user);
    }

    /// <summary>
    /// Vô hiệu hóa tài khoản người dùng.
    /// </summary>
    public async Task<AdminUserDto> DeactivateUserAsync(int userId, string reason)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deactivated user {UserId}. Reason: {Reason}", userId, reason);
        return MapToDto(user);
    }

    /// <summary>
    /// Xóa người dùng (xóa mềm).
    /// </summary>
    public async Task DeleteUserAsync(int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        // Kiểm tra xem người dùng có đặt chỗ đang hoạt động không
        var hasActiveBookings = await _context.Bookings
            .AnyAsync(b => b.UserId == userId && (b.Status == "scheduled" || b.Status == "in_progress"));

        if (hasActiveBookings)
            throw new ArgumentException("Cannot delete user with active bookings");

        // Xóa mềm - đánh dấu là đã xóa và lưu thời gian
        user.IsActive = false;
        user.DeletedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted (soft) user {UserId} at {DeletedAt}", userId, user.DeletedAt);
    }

    public async Task<ResetPasswordResultDto> ResetUserPasswordAsync(int userId, int? performedByUserId = null)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        // Tạo mật khẩu tạm thời
        var tempPassword = GenerateTemporaryPassword();
        // Store hashed temporary password (BCrypt)
        user.PasswordHash = PasswordHasher.HashPassword(tempPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Reset password for user {UserId} (performedBy={PerformedBy})", userId, performedByUserId);

        // Audit log entry
        try
        {
            _context.SystemLogs.Add(new SkaEV.API.Domain.Entities.SystemLog
            {
                LogType = "admin_action",
                Severity = "info",
                Message = $"Reset password for user {userId}",
                UserId = performedByUserId,
                Endpoint = $"admin/users/{userId}/reset-password",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write audit log for password reset (user {UserId})", userId);
        }

        return new ResetPasswordResultDto
        {
            TemporaryPassword = tempPassword,
            Message = "Password has been reset. User should change it on next login."
        };
    }

    public async Task<int> ResetAllAdminPasswordsAsync(string newPassword, int? performedByUserId = null)
    {
        var admins = await _context.Users
            .Where(u => u.Role != null && u.Role.Equals("admin", StringComparison.OrdinalIgnoreCase) && u.IsActive)
            .ToListAsync();

        var hashed = PasswordHasher.HashPassword(newPassword);
        foreach (var admin in admins)
        {
            admin.PasswordHash = hashed;
            admin.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogWarning("Reset passwords for {AdminCount} admin accounts (performedBy={PerformedBy})", admins.Count, performedByUserId);

        try
        {
            _context.SystemLogs.Add(new SkaEV.API.Domain.Entities.SystemLog
            {
                LogType = "admin_action",
                Severity = "warning",
                Message = $"Reset all admin passwords (count={admins.Count})",
                UserId = performedByUserId,
                Endpoint = "admin/reset-all-admin-passwords",
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write audit log for reset-all-admin-passwords (performedBy={PerformedBy})", performedByUserId);
        }

        return admins.Count;
    }

    // Use shared PasswordHasher (wraps BCrypt)

    public async Task<UserActivitySummaryDto> GetUserActivitySummaryAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Bookings)
            .Include(u => u.Invoices)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        var lastMonth = DateTime.UtcNow.AddMonths(-1);
        var lastMonthBookings = user.Bookings.Count(b => b.CreatedAt >= lastMonth);
        var lastMonthRevenue = user.Invoices.Where(i => i.CreatedAt >= lastMonth).Sum(i => i.TotalAmount);

        return new UserActivitySummaryDto
        {
            UserId = userId,
            TotalBookings = user.Bookings.Count,
            LastMonthBookings = lastMonthBookings,
            TotalRevenue = user.Invoices.Sum(i => i.TotalAmount),
            LastMonthRevenue = lastMonthRevenue,
            LastBookingDate = user.Bookings.OrderByDescending(b => b.CreatedAt).FirstOrDefault()?.CreatedAt,
            LastLoginDate = null, // Chưa theo dõi
            RecentActivities = new List<string>()
        };
    }

    /// <summary>
    /// Lấy thống kê tổng quan về người dùng.
    /// </summary>
    public async Task<UserStatisticsSummaryDto> GetUserStatisticsSummaryAsync()
    {
        var users = await _context.Users.ToListAsync();
        var lastMonth = DateTime.UtcNow.AddMonths(-1);

        return new UserStatisticsSummaryDto
        {
            TotalUsers = users.Count,
            ActiveUsers = users.Count(u => u.IsActive),
            InactiveUsers = users.Count(u => !u.IsActive),
            CustomersCount = users.Count(u => u.Role == "customer"),
            StaffCount = users.Count(u => u.Role == "staff"),
            AdminsCount = users.Count(u => u.Role == "admin"),
            NewUsersThisMonth = users.Count(u => u.CreatedAt >= lastMonth),
            NewUsersLastMonth = users.Count(u => u.CreatedAt >= lastMonth.AddMonths(-1) && u.CreatedAt < lastMonth)
        };
    }

    private string GenerateTemporaryPassword()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 12)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    private AdminUserDto MapToDto(User user)
    {
        return new AdminUserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            Status = user.IsActive ? "active" : "inactive",
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = null // Chưa theo dõi trong schema hiện tại
        };
    }
}
