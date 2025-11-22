using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Application.Services;

public partial class AdminUserService : IAdminUserService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(SkaEVDbContext context, ILogger<AdminUserService> logger)
    {
        _context = context;
        _logger = logger;
    }

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
                LastLoginAt = null,
                ManagedStationId = _context.StationStaff
                    .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                    .Select(ss => (int?)ss.StationId)
                    .FirstOrDefault(),
                ManagedStationName = _context.StationStaff
                    .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                    .Select(ss => ss.ChargingStation.StationName)
                    .FirstOrDefault(),
                ManagedStationAddress = _context.StationStaff
                    .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                    .Select(ss => ss.ChargingStation.Address)
                    .FirstOrDefault(),
                ManagedStationCity = _context.StationStaff
                    .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                    .Select(ss => ss.ChargingStation.City)
                    .FirstOrDefault()
            })
            .ToListAsync();
    }

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

        var activeAssignment = await _context.StationStaff
            .Include(ss => ss.ChargingStation)
            .Where(ss => ss.StaffUserId == userId && ss.IsActive)
            .OrderByDescending(ss => ss.AssignedAt)
            .FirstOrDefaultAsync();

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
            LastLoginAt = null, // Not tracked in current schema
            ManagedStationId = activeAssignment?.StationId,
            ManagedStationName = activeAssignment?.ChargingStation.StationName,
            ManagedStationAddress = activeAssignment?.ChargingStation.Address,
            ManagedStationCity = activeAssignment?.ChargingStation.City,
            AvatarUrl = user.UserProfile?.AvatarUrl,
            TotalBookings = user.Bookings.Count,
            TotalSpent = user.Invoices.Sum(i => i.TotalAmount),
            VehiclesCount = user.Vehicles.Count,
            DeactivationReason = null, // Not in current schema
            DeactivatedAt = user.IsActive ? null : user.UpdatedAt
        };
    }

    public async Task<AdminUserDto> CreateUserAsync(CreateUserDto createDto)
    {
        // Check if email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == createDto.Email);

        if (existingUser != null)
            throw new ArgumentException("Email already in use");

        var validRoles = new[] { "customer", "staff", "admin" };
        if (!validRoles.Contains(createDto.Role))
            throw new ArgumentException("Invalid role");

        if (createDto.Role == "staff")
        {
            if (!createDto.ManagedStationId.HasValue)
                throw new ArgumentException("Staff users must be assigned to a station");
        }
        else if (createDto.ManagedStationId.HasValue)
        {
            throw new ArgumentException("Only staff users can be assigned to manage a station");
        }

        var user = new User
        {
            Email = createDto.Email,
            PasswordHash = PasswordHasher.HashPassword(createDto.Password),
            FullName = createDto.FullName,
            PhoneNumber = createDto.PhoneNumber,
            Role = createDto.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        if (user.Role == "staff" && createDto.ManagedStationId.HasValue)
        {
            await HandleStaffAssignmentAsync(user, createDto.ManagedStationId.Value);
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Created user {UserId} with role {Role}", user.UserId, createDto.Role);
        return await BuildUserDtoAsync(user.UserId);
    }

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
            // Check if new email is already in use
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == updateDto.Email && u.UserId != userId);

            if (emailExists)
                throw new ArgumentException("Email already in use");

            user.Email = updateDto.Email;
        }

        var validRoles = new[] { "customer", "staff", "admin" };
        if (!string.IsNullOrEmpty(updateDto.Role) && updateDto.Role != user.Role)
        {
            if (!validRoles.Contains(updateDto.Role))
                throw new ArgumentException("Invalid role");

            // Transitioning away from staff should remove assignments later
            user.Role = updateDto.Role;
        }

        var activeAssignment = await GetActiveAssignmentAsync(userId);
        var managedStationSpecified = updateDto.ManagedStationId.HasValue;

        if (user.Role == "staff")
        {
            if (managedStationSpecified)
            {
                await HandleStaffAssignmentAsync(user, updateDto.ManagedStationId!.Value, activeAssignment);
            }
            else if (activeAssignment == null)
            {
                throw new ArgumentException("Staff users must be assigned to a station");
            }
        }
        else
        {
            if (managedStationSpecified)
                throw new ArgumentException("Only staff users can be assigned to manage a station");

            if (activeAssignment != null)
                activeAssignment.IsActive = false;
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated user {UserId}", userId);
        return await BuildUserDtoAsync(user.UserId);
    }

    public async Task<AdminUserDto> UpdateUserRoleAsync(int userId, string role)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        var validRoles = new[] { "customer", "staff", "admin" };
        if (!validRoles.Contains(role))
            throw new ArgumentException("Invalid role");

        var activeAssignment = await GetActiveAssignmentAsync(userId);

        if (role == "staff")
            throw new ArgumentException("Use the user update endpoint to assign staff role with station selection");

        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;

        if (activeAssignment != null)
            activeAssignment.IsActive = false;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated user {UserId} role to {Role}", userId, role);
        return await BuildUserDtoAsync(userId);
    }

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
        return await BuildUserDtoAsync(userId);
    }

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
        return await BuildUserDtoAsync(userId);
    }

    public async Task DeleteUserAsync(int userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        // Check if user has active bookings
        var hasActiveBookings = await _context.Bookings
            .AnyAsync(b => b.UserId == userId && (b.Status == "scheduled" || b.Status == "in_progress"));

        if (hasActiveBookings)
            throw new ArgumentException("Cannot delete user with active bookings");

        // Soft delete by deactivating
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted (soft) user {UserId}", userId);
    }

    public async Task<ResetPasswordResultDto> ResetUserPasswordAsync(int userId, int? performedByUserId = null)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        // Generate temporary password
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
            LastLoginDate = null, // Not tracked
            RecentActivities = new List<string>()
        };
    }

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

    private async Task<StationStaff?> GetActiveAssignmentAsync(int userId)
    {
        return await _context.StationStaff
            .Where(ss => ss.StaffUserId == userId && ss.IsActive)
            .OrderByDescending(ss => ss.AssignedAt)
            .FirstOrDefaultAsync();
    }

    private async Task HandleStaffAssignmentAsync(User user, int stationId, StationStaff? existingAssignment = null)
    {
        existingAssignment ??= await GetActiveAssignmentAsync(user.UserId);

        if (existingAssignment != null && existingAssignment.StationId == stationId && existingAssignment.IsActive)
            return;

        if (existingAssignment != null)
            existingAssignment.IsActive = false;

        var stationExists = await _context.ChargingStations
            .AnyAsync(s => s.StationId == stationId && s.DeletedAt == null);

        if (!stationExists)
            throw new ArgumentException("Managed station not found");

        var stationAssigned = await _context.StationStaff
            .AnyAsync(ss => ss.StationId == stationId && ss.IsActive && ss.StaffUserId != user.UserId);

        if (stationAssigned)
            throw new ArgumentException("Station is already assigned to another staff");

        var assignment = new StationStaff
        {
            StaffUserId = user.UserId,
            StationId = stationId,
            AssignedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.StationStaff.Add(assignment);
    }

    private async Task<AdminUserDto> BuildUserDtoAsync(int userId)
    {
        return await _context.Users
            .Where(u => u.UserId == userId)
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
                LastLoginAt = null,
                ManagedStationId = _context.StationStaff
                    .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                    .Select(ss => (int?)ss.StationId)
                    .FirstOrDefault(),
                ManagedStationName = _context.StationStaff
                    .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                    .Select(ss => ss.ChargingStation.StationName)
                    .FirstOrDefault(),
                ManagedStationAddress = _context.StationStaff
                    .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                    .Select(ss => ss.ChargingStation.Address)
                    .FirstOrDefault(),
                ManagedStationCity = _context.StationStaff
                    .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                    .Select(ss => ss.ChargingStation.City)
                    .FirstOrDefault()
            })
            .FirstAsync();
    }

    private string GenerateTemporaryPassword()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 12)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
